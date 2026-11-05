'use strict';

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const PORT = Number(process.env.PORT || 3456);
const HOST = process.env.HOST || '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://kv-tv-backend:3457';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.apk': 'application/vnd.android.package-archive',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
};

const COMPRESSIBLE_EXTS = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.webmanifest',
  '.svg',
  '.txt',
]);

/**
 * Extract client IP from reverse proxy headers or socket.
 * @param {http.IncomingMessage} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Determine whether an incoming request should be reverse-proxied to `BACKEND_URL`.
 * @param {string} method
 * @param {string} pathname
 * @returns {boolean}
 */
function shouldProxyToBackend(method, pathname) {
  if (method !== 'GET' && method !== 'HEAD') {
    return true;
  }
  if (
    pathname === '/admin' ||
    pathname === '/admin/' ||
    pathname === '/admin.html' ||
    pathname === '/admin.js' ||
    pathname === '/admin.css' ||
    pathname === '/kv-store.apk' ||
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/go' ||
    pathname.startsWith('/go/') ||
    pathname === '/uploads' ||
    pathname.startsWith('/uploads/') ||
    /^\/(\d{5})\/?$/.test(pathname)
  ) {
    return true;
  }
  return false;
}

/**
 * Zero-buffering HTTP stream reverse-proxy to `BACKEND_URL`.
 * Preserves method, URL, query string, `X-Forwarded-For`, `Range`, `Cookie`,
 * `Authorization`, status code, and all upstream response headers.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function proxyToBackend(req, res) {
  let targetBase;
  try {
    targetBase = new URL(BACKEND_URL);
  } catch {
    targetBase = new URL('http://kv-tv-backend:3457');
  }

  const transport = targetBase.protocol === 'https:' ? https : http;
  const clientIp = getClientIp(req);
  const existingForwardedFor = req.headers['x-forwarded-for'];

  const proxyHeaders = {
    ...req.headers,
    host: targetBase.host,
    'x-forwarded-host': req.headers.host || '',
    'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
    'x-forwarded-for': existingForwardedFor
      ? `${existingForwardedFor}, ${clientIp}`
      : clientIp,
    'x-real-ip': req.headers['x-real-ip'] || clientIp,
  };

  const options = {
    protocol: targetBase.protocol,
    hostname: targetBase.hostname,
    port: targetBase.port || (targetBase.protocol === 'https:' ? 443 : 80),
    method: req.method || 'GET',
    path: req.url || '/',
    headers: proxyHeaders,
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    if ((req.method || 'GET').toUpperCase() === 'HEAD') {
      proxyRes.resume();
      res.end();
      return;
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[KV-TV Interface] Upstream proxy error (${BACKEND_URL}):`, err.message);
    if (!res.headersSent) {
      const body = JSON.stringify({
        ok: false,
        error: 'KV-TV Backend service is temporarily unavailable',
        backend: BACKEND_URL,
        detail: err.message,
      });
      res.writeHead(502, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Length': String(Buffer.byteLength(body)),
      });
      if ((req.method || 'GET').toUpperCase() === 'HEAD') {
        res.end();
        return;
      }
      res.end(body);
    } else {
      res.end();
    }
  });

  req.on('aborted', () => {
    proxyReq.destroy();
  });

  req.pipe(proxyReq);
}

/**
 * Serve static storefront files from `PUBLIC_DIR` with HTTP Range, HEAD, and gzip support.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {string} relativePath
 */
function serveStorefrontFile(req, res, relativePath) {
  const safeRel = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(PUBLIC_DIR, safeRel);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Forbidden path' }));
    return;
  }

  fs.stat(fullPath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      if ((req.method || 'GET').toUpperCase() === 'HEAD') {
        res.end();
        return;
      }
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }

    const method = (req.method || 'GET').toUpperCase();
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';
    const cacheControl = isHtml
      ? 'no-cache, must-revalidate'
      : 'public, max-age=3600';

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    };

    const rangeHeader = req.headers.range;
    if (typeof rangeHeader === 'string' && rangeHeader.trim().startsWith('bytes=')) {
      const rangeMatch = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
      if (!rangeMatch || stat.size === 0) {
        headers['Content-Range'] = `bytes */${stat.size}`;
        res.writeHead(416, headers);
        res.end();
        return;
      }

      const rawStart = rangeMatch[1];
      const rawEnd = rangeMatch[2];
      const start = rawStart !== '' ? parseInt(rawStart, 10) : 0;
      const end =
        rawEnd !== '' ? Math.min(stat.size - 1, parseInt(rawEnd, 10)) : stat.size - 1;

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        start >= stat.size ||
        start > end
      ) {
        headers['Content-Range'] = `bytes */${stat.size}`;
        res.writeHead(416, headers);
        res.end();
        return;
      }

      const chunkSize = end - start + 1;
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      headers['Content-Length'] = String(chunkSize);
      res.writeHead(206, headers);
      if (method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(fullPath, { start, end }).pipe(res);
      return;
    }

    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (
      method === 'GET' &&
      COMPRESSIBLE_EXTS.has(ext) &&
      stat.size > 512 &&
      stat.size < 5 * 1024 * 1024 &&
      acceptEncoding.includes('gzip')
    ) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fs.createReadStream(fullPath).pipe(zlib.createGzip()).pipe(res);
      return;
    }

    headers['Content-Length'] = String(stat.size);
    res.writeHead(200, headers);
    if (method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(fullPath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Admin-Token, X-File-Name, X-Upload-Type, Range',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
    });
    res.end();
    return;
  }

  // Dedicated container healthcheck endpoint
  if ((method === 'GET' || method === 'HEAD') && pathname === '/healthz') {
    const body = JSON.stringify({ status: 'ok', service: 'kv-tv-interface' });
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': String(Buffer.byteLength(body)),
    });
    if (method === 'HEAD') {
      res.end();
      return;
    }
    res.end(body);
    return;
  }

  // Reverse-proxy admin, API, short-codes, and APK downloads to kv-tv-backend
  if (shouldProxyToBackend(method, pathname)) {
    proxyToBackend(req, res);
    return;
  }

  // Storefront HTML & static asset routing
  if (pathname === '/mockup-1' || pathname === '/mockup-1/') {
    serveStorefrontFile(req, res, 'mockup-1.html');
    return;
  }
  if (pathname === '/mockup-2' || pathname === '/mockup-2/') {
    serveStorefrontFile(req, res, 'mockup-2.html');
    return;
  }
  if (pathname === '/mockup-3' || pathname === '/mockup-3/') {
    serveStorefrontFile(req, res, 'mockup-3.html');
    return;
  }
  if (
    pathname === '/' ||
    pathname === '/tv' ||
    pathname === '/tv/' ||
    pathname === '/web' ||
    pathname === '/web/'
  ) {
    const mockupParam = parsedUrl.searchParams.get('mockup');
    if (mockupParam === '1') {
      serveStorefrontFile(req, res, 'mockup-1.html');
      return;
    }
    if (mockupParam === '2') {
      serveStorefrontFile(req, res, 'mockup-2.html');
      return;
    }
    if (mockupParam === '3') {
      serveStorefrontFile(req, res, 'mockup-3.html');
      return;
    }
    serveStorefrontFile(req, res, 'index.html');
    return;
  }

  const relAsset = decodeURIComponent(pathname.slice(1));
  serveStorefrontFile(req, res, relAsset);
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(
      `[KV-TV Interface] Storefront server listening on http://${HOST}:${PORT} -> Backend: ${BACKEND_URL}`
    );
  });
}

module.exports = { server };
