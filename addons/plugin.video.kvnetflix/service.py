# -*- coding: utf-8 -*-
"""
KV-Netflix Local HLS Stream Proxy & VSMOV Signer/Segment Cleaner
Runs on 127.0.0.1:48915 inside Kodi to:
1. Resolve dynamic signedMasterUrl tokens for VSMOV (streamvsmov.com) streams.
2. Strip fake PNG/image headers (e.g., 452-byte PNG prefix before 0x47 MPEG-TS sync bytes) on segments.
3. Answer HEAD requests with 200 OK + application/vnd.apple.mpegurl for Kodi's FFmpeg demuxer.
"""

import re
import ssl
import time
import threading
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PROXY_HOST = '127.0.0.1'
PROXY_PORT = 48915

BROWSER_UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    'AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/124.0.0.0 Safari/537.36'
)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

VSMOV_STREAM_RE = re.compile(r'(https?://[^/]*streamvsmov\.com)/stream/([a-f0-9-]+)/master\.m3u8', re.I)
SIGNED_URL_RE = re.compile(r'signedMasterUrl:\s*"([^"]+)"')
KEY_URI_RE = re.compile(r'URI="([^"]+)"')


def find_ts_sync_offset(data):
    """Find first 188-byte aligned MPEG-TS sync byte (0x47) to strip fake PNG/JPG headers."""
    if not data or len(data) < 564 or data[0] == 0x47:
        return 0
    limit = min(len(data) - 376, 65536)
    for i in range(limit):
        if data[i] == 0x47 and data[i + 188] == 0x47 and data[i + 376] == 0x47:
            return i
    return 0


def resolve_vsmov_signed_url(stream_url, embed_url=''):
    """Fetch VSMOV embed page and extract the fresh signedMasterUrl (?expires=...&signature=...)."""
    m = VSMOV_STREAM_RE.search(stream_url)
    if not embed_url and m:
        embed_url = f"{m.group(1)}/video/{m.group(2)}"
    if not embed_url:
        return stream_url
    try:
        req = urllib.request.Request(
            embed_url,
            headers={
                'User-Agent': BROWSER_UA,
                'Referer': 'https://vsmov.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        )
        with urllib.request.urlopen(req, timeout=10, context=SSL_CTX) as resp:
            html_text = resp.read().decode('utf-8', 'ignore')
        sm = SIGNED_URL_RE.search(html_text)
        if sm and sm.group(1):
            return sm.group(1)
    except Exception:
        pass
    return stream_url


def fetch_upstream(url, referer=''):
    """Fetch bytes and content-type from upstream CDN."""
    parsed = urllib.parse.urlparse(url)
    if not referer:
        if 'streamvsmov.com' in parsed.netloc:
            referer = 'https://v1.streamvsmov.com/'
        elif 'amass15.top' in parsed.netloc or 'streamc.xyz' in parsed.netloc:
            referer = 'https://streamc.xyz/'
        else:
            referer = f"{parsed.scheme}://{parsed.netloc}/"

    headers = {
        'User-Agent': BROWSER_UA,
        'Accept': '*/*',
        'Referer': referer,
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15, context=SSL_CTX) as resp:
        return resp.read(), resp.headers.get('Content-Type', '')


class StreamProxyHandler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, fmt, *args):
        pass

    def _safe_write(self, data):
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        try:
            if parsed.path == '/ping':
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.send_header('Content-Length', '2')
                self.end_headers()
                return
            if parsed.path.endswith('.m3u8'):
                self.send_response(200)
                self.send_header('Content-Type', 'application/vnd.apple.mpegurl')
                self.send_header('Accept-Ranges', 'none')
                self.end_headers()
                return
            self.send_response(200)
            self.send_header('Content-Type', 'video/mp2t')
            self.end_headers()
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/ping':
            body = b'ok'
            try:
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self._safe_write(body)
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            return

        target_url = qs.get('url', [''])[0]
        embed_url = qs.get('embed', [''])[0]
        ref_url = qs.get('ref', [''])[0]

        if not target_url:
            try:
                self.send_error(400, 'Missing url parameter')
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            return

        if parsed.path.endswith('.m3u8'):
            self.handle_manifest(target_url, embed_url)
        elif parsed.path.endswith('.bin'):
            self.handle_key(target_url, ref_url)
        else:
            self.handle_segment(target_url, ref_url)

    def handle_manifest(self, target_url, embed_url=''):
        effective_url = target_url
        if 'streamvsmov.com' in effective_url and 'signature=' not in effective_url:
            effective_url = resolve_vsmov_signed_url(effective_url, embed_url)

        try:
            raw_bytes, _ = fetch_upstream(effective_url)
        except Exception:
            if 'streamvsmov.com' in target_url:
                effective_url = resolve_vsmov_signed_url(target_url, embed_url)
                try:
                    raw_bytes, _ = fetch_upstream(effective_url)
                except Exception as e:
                    try:
                        self.send_error(502, f"Manifest fetch error: {e}")
                    except (BrokenPipeError, ConnectionResetError, OSError):
                        pass
                    return
            else:
                try:
                    self.send_error(502, "Manifest fetch error")
                except (BrokenPipeError, ConnectionResetError, OSError):
                    pass
                return

        text = raw_bytes.decode('utf-8', 'ignore')
        out_lines = []
        base_proxy = f"http://{PROXY_HOST}:{PROXY_PORT}"
        quoted_ref = urllib.parse.quote(effective_url, safe='')

        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith('#'):
                if 'URI="' in line:
                    def _repl_uri(match):
                        abs_u = urllib.parse.urljoin(effective_url, match.group(1))
                        q_u = urllib.parse.quote(abs_u, safe='')
                        if abs_u.lower().endswith('.m3u8'):
                            return f'URI="{base_proxy}/play.m3u8?url={q_u}&ref={quoted_ref}"'
                        return f'URI="{base_proxy}/key.bin?url={q_u}&ref={quoted_ref}"'
                    line = KEY_URI_RE.sub(_repl_uri, line)
                out_lines.append(line)
                continue

            abs_url = urllib.parse.urljoin(effective_url, line)
            abs_path = urllib.parse.urlparse(abs_url).path.lower()
            quoted_url = urllib.parse.quote(abs_url, safe='')

            if abs_path.endswith('.m3u8'):
                out_lines.append(f"{base_proxy}/play.m3u8?url={quoted_url}&ref={quoted_ref}")
            else:
                out_lines.append(f"{base_proxy}/seg.ts?url={quoted_url}&ref={quoted_ref}")

        body = ('\n'.join(out_lines) + '\n').encode('utf-8')
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/vnd.apple.mpegurl')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self._safe_write(body)
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass

    def handle_key(self, target_url, ref_url=''):
        try:
            data, _ = fetch_upstream(target_url, ref_url)
        except Exception as e:
            try:
                self.send_error(502, f"Key fetch error: {e}")
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            return
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self._safe_write(data)
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass

    def handle_segment(self, target_url, ref_url=''):
        try:
            data, _ = fetch_upstream(target_url, ref_url)
        except Exception as e:
            try:
                self.send_error(502, f"Segment fetch error: {e}")
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            return

        offset = find_ts_sync_offset(data)
        if offset > 0:
            data = data[offset:]

        try:
            self.send_response(200)
            self.send_header('Content-Type', 'video/mp2t')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self._safe_write(data)
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def is_proxy_alive():
    try:
        with urllib.request.urlopen(f"http://{PROXY_HOST}:{PROXY_PORT}/ping", timeout=0.5) as resp:
            return resp.read() == b'ok'
    except Exception:
        return False


def ensure_proxy_running():
    """Ensure the background HLS proxy server is listening on 127.0.0.1:48915."""
    if is_proxy_alive():
        return True
    try:
        import xbmc
        xbmc.executebuiltin('RunScript(special://home/addons/plugin.video.kvnetflix/service.py)')
        for _ in range(15):
            time.sleep(0.1)
            if is_proxy_alive():
                return True
    except Exception:
        pass
    start_proxy_server(block=False)
    return is_proxy_alive()


def build_proxy_play_url(stream_url, embed_url=''):
    """Wrap an upstream HLS URL into the local proxy's .m3u8 endpoint."""
    q_url = urllib.parse.quote(stream_url, safe='')
    q_emb = urllib.parse.quote(embed_url, safe='') if embed_url else ''
    if q_emb:
        return f"http://{PROXY_HOST}:{PROXY_PORT}/play.m3u8?url={q_url}&embed={q_emb}"
    return f"http://{PROXY_HOST}:{PROXY_PORT}/play.m3u8?url={q_url}"


def start_proxy_server(block=False):
    try:
        server = ReusableThreadingHTTPServer((PROXY_HOST, PROXY_PORT), StreamProxyHandler)
    except OSError:
        return None
    if block:
        try:
            import xbmc
            monitor = xbmc.Monitor()
            t = threading.Thread(target=server.serve_forever, daemon=True)
            t.start()
            while not monitor.abortRequested():
                if monitor.waitForAbort(2):
                    break
            server.shutdown()
        except ImportError:
            server.serve_forever()
    else:
        t = threading.Thread(target=server.serve_forever, daemon=True)
        t.start()
    return server


if __name__ == '__main__':
    start_proxy_server(block=True)
