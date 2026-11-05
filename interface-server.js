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

const SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://tv.vndns.net https://tv.khoavo.vndns.net https://git.khoavo.myds.me; frame-ancestors 'self'; base-uri 'self'",
});

const BLOCKED_PATH_PREFIXES = [
  '/.env',
  '/.git',
  '/wp-admin',
  '/wp-login',
  '/phpmyadmin',
  '/actuator',
  '/cgi-bin',
  '/.aws',
  '/vendor/phpunit',
];

const MAX_RATE_KEYS = 10000;
const RATE_WINDOW_MS = 60 * 1000;
const GENERAL_RATE_LIMIT = 180;
const ADMIN_POST_RATE_LIMIT = 20;
const rateBuckets = new Map();

const rateCleanupTimer = setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [key, timestamps] of rateBuckets.entries()) {
    const active = timestamps.filter((t) => t > cutoff);
    if (active.length === 0) {
      rateBuckets.delete(key);
    } else {
      rateBuckets.set(key, active);
    }
  }
}, RATE_WINDOW_MS);
if (typeof rateCleanupTimer.unref === 'function') {
  rateCleanupTimer.unref();
}

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
 * Extract trusted client IP from reverse proxy headers or socket.
 * Priority: CF-Connecting-IP -> X-Real-IP -> first X-Forwarded-For -> socket.remoteAddress.
 * Normalizes IPv4-mapped IPv6 prefix (`::ffff:`) and caps at 64 characters.
 * @param {http.IncomingMessage} req
 * @returns {string}
 */
function getClientIp(req) {
  let raw = '';
  const cfIp = req.headers['cf-connecting-ip'];
  const realIp = req.headers['x-real-ip'];
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof cfIp === 'string' && cfIp.trim()) {
    raw = cfIp.trim();
  } else if (typeof realIp === 'string' && realIp.trim()) {
    raw = realIp.trim();
  } else if (typeof forwarded === 'string' && forwarded.trim()) {
    raw = forwarded.split(',')[0].trim();
  } else {
    raw = req.socket?.remoteAddress || '127.0.0.1';
  }

  if (raw.startsWith('::ffff:')) {
    raw = raw.slice(7);
  }
  return raw.slice(0, 64) || '127.0.0.1';
}

/**
 * Check whether a request path targets common exploit/scanner probes or path traversal.
 * @param {string} pathname
 * @param {string} rawUrl
 * @returns {boolean}
 */
function isBlockedExploitPath(pathname, rawUrl) {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return true;
  }

  if (
    pathname.includes('..') ||
    decoded.includes('..') ||
    pathname.includes('\0') ||
    decoded.includes('\0') ||
    rawUrl.includes('\0') ||
    /%00/i.test(rawUrl)
  ) {
    return true;
  }

  const lowerPath = pathname.toLowerCase();
  const lowerDecoded = decoded.toLowerCase();

  for (const prefix of BLOCKED_PATH_PREFIXES) {
    if (lowerPath.startsWith(prefix) || lowerDecoded.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Bounded sliding-window rate limiter.
 * @param {string} bucketKey
 * @param {number} maxRequests
 * @param {number} [windowMs]
 * @returns {boolean} true if allowed, false if rate-limited
 */
function checkSlidingWindowLimit(bucketKey, maxRequests, windowMs = RATE_WINDOW_MS) {
  const now = Date.now();
  const cutoff = now - windowMs;
  let timestamps = rateBuckets.get(bucketKey);

  if (timestamps) {
    timestamps = timestamps.filter((t) => t > cutoff);
  } else {
    if (rateBuckets.size >= MAX_RATE_KEYS) {
      const oldestKey = rateBuckets.keys().next().value;
      if (oldestKey !== undefined) {
        rateBuckets.delete(oldestKey);
      }
    }
    timestamps = [];
  }

  if (timestamps.length >= maxRequests) {
    rateBuckets.set(bucketKey, timestamps);
    return false;
  }

  timestamps.push(now);
  rateBuckets.set(bucketKey, timestamps);
  return true;
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
    /^\/(\d|\d{5,8})\/?$/.test(pathname)
  ) {
    return true;
  }
  return false;
}

/**
 * Zero-buffering HTTP stream reverse-proxy to `BACKEND_URL`.
 * Enforces anti-spoofing `X-Real-IP` and `X-Forwarded-For` from `getClientIp(req)`
 * while preserving method, URL, query string, `Range`, `Cookie`, `Authorization`,
 * status code, and all upstream response headers.
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

  const proxyHeaders = {
    ...req.headers,
    host: targetBase.host,
    'x-forwarded-host': req.headers.host || '',
    'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
    'x-forwarded-for': clientIp,
    'x-real-ip': clientIp,
  };

  if (typeof req.headers['cf-connecting-ip'] === 'string' && req.headers['cf-connecting-ip'].trim()) {
    proxyHeaders['cf-connecting-ip'] = clientIp;
  }

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
        ...SECURITY_HEADERS,
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
 * Serve static storefront files from `PUBLIC_DIR` with HTTP Range, HEAD, gzip, and security headers.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {string} relativePath
 */
function serveStorefrontFile(req, res, relativePath) {
  const safeRel = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(PUBLIC_DIR, safeRel);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    });
    res.end(JSON.stringify({ error: 'Forbidden path' }));
    return;
  }

  fs.stat(fullPath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, {
        ...SECURITY_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
      });
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
      ...SECURITY_HEADERS,
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Accept-Ranges': 'bytes',
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
  const rawUrl = req.url || '/';
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
  } catch {
    res.writeHead(400, {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    });
    res.end(JSON.stringify({ ok: false, error: 'Malformed request URL' }));
    return;
  }
  const pathname = parsedUrl.pathname;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      ...SECURITY_HEADERS,
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
      ...SECURITY_HEADERS,
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

  // Scanner & exploit path blocker
  if (isBlockedExploitPath(pathname, rawUrl)) {
    const body = JSON.stringify({ ok: false, error: 'Forbidden' });
    res.writeHead(403, {
      ...SECURITY_HEADERS,
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

  // Edge sliding-window rate limiter (non-loopback IPs)
  const clientIp = getClientIp(req);
  if (clientIp !== '127.0.0.1' && clientIp !== '::1') {
    const isAdminPost =
      method === 'POST' && (pathname === '/api/admin' || pathname.startsWith('/api/admin/'));

    if (
      (isAdminPost && !checkSlidingWindowLimit(`admin:${clientIp}`, ADMIN_POST_RATE_LIMIT)) ||
      !checkSlidingWindowLimit(`gen:${clientIp}`, GENERAL_RATE_LIMIT)
    ) {
      const body = JSON.stringify({
        ok: false,
        error: 'Too many requests. Please try again in 60 seconds.',
      });
      res.writeHead(429, {
        ...SECURITY_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '60',
        'Content-Length': String(Buffer.byteLength(body)),
      });
      if (method === 'HEAD') {
        res.end();
        return;
      }
      res.end(body);
      return;
    }
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

server.headersTimeout = 15000;
server.requestTimeout = 300000;
server.keepAliveTimeout = 65000;
server.maxHeadersCount = 64;

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(
      `[KV-TV Interface] Storefront server listening on http://${HOST}:${PORT} -> Backend: ${BACKEND_URL}`
    );
  });
}

module.exports = { server, getClientIp };
