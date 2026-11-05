'use strict';

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  getOtpAuthUrl,
  generateQrSvg,
  hashPassword,
  verifyPassword,
} = require('./lib/totp');
const {
  UPLOADS_DIR,
  STORE_PATH,
  formatDateKey,
  ensureSeeded,
} = require('./lib/seed');

const PORT = Number(process.env.PORT || 3456);
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_UPLOAD_BYTES = 512 * 1024 * 1024; // 512 MB max APK upload
const MAX_JSON_BYTES = 1 * 1024 * 1024; // 1 MB max JSON body
const MAX_RATE_KEYS = 10000;
const MAX_SESSION_ENTRIES = 1000;
const ANALYTICS_DEDUP_TTL_MS = 3 * 60 * 1000; // 3 minutes

// Load or seed persistent store on boot
let store = ensureSeeded(false);

// Active admin sessions, temporary 2FA challenges, and bounded rate-limit / security state
const adminSessions = new Map(); // token -> { username, createdAt, expiresAt }
const temp2faTokens = new Map(); // tempToken -> { username, createdAt, expiresAt, failedAttempts }
const revokedTokens = new Set(); // invalidated/consumed temp2fa or session tokens
const loginAttempts = new Map(); // ip -> { count, resetAt }
const verify2faAttempts = new Map(); // ip -> { count, resetAt }
const publicApiRateMap = new Map(); // ip -> { count, resetAt }
const adClickRateMap = new Map(); // ip -> { count, resetAt }
const apkDownloadRateMap = new Map(); // ip -> { count, resetAt }
const activeStreamsByIp = new Map(); // ip -> number of concurrent GET APK streams
const recentAnalyticsEvents = new Map(); // key -> expiresAt

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://tv.vndns.net https://tv.khoavo.vndns.net https://git.khoavo.myds.me; frame-ancestors 'self'; base-uri 'self'",
};

const TRUSTED_ADMIN_ORIGINS = new Set([
  'https://tv.vndns.net',
  'https://tv.khoavo.vndns.net',
  'http://localhost:3456',
  'http://127.0.0.1:3456',
  'http://localhost:3457',
  'http://127.0.0.1:3457',
]);

/**
 * Resolve CORS Access-Control-Allow-Origin header value (strict for /api/admin/*).
 * @param {http.IncomingMessage} req
 * @returns {string}
 */
function resolveCorsOrigin(req) {
  const rawUrl = String(req.url || '');
  if (rawUrl.startsWith('/api/admin/') || rawUrl === '/api/admin') {
    const reqOrigin = String(req.headers.origin || '').trim();
    if (reqOrigin && TRUSTED_ADMIN_ORIGINS.has(reqOrigin)) {
      return reqOrigin;
    }
    return 'https://tv.vndns.net';
  }
  return '*';
}

/**
 * Add a token to the bounded `revokedTokens` Set so stateless HMAC fallback cannot reuse it.
 * @param {string} token
 */
function addRevokedToken(token) {
  if (!token) return;
  if (revokedTokens.size >= MAX_RATE_KEYS && !revokedTokens.has(token)) {
    const oldest = revokedTokens.values().next().value;
    if (oldest !== undefined) revokedTokens.delete(oldest);
  }
  revokedTokens.add(token);
}

/**
 * Insert an entry into a bounded session/token Map (`MAX_SESSION_ENTRIES = 1000`),
 * evicting expired or oldest entries when full.
 * @param {Map} map
 * @param {string} key
 * @param {object} value
 * @param {number} [maxEntries=MAX_SESSION_ENTRIES]
 */
function setBoundedSession(map, key, value, maxEntries = MAX_SESSION_ENTRIES) {
  const now = Date.now();
  if (map.size >= maxEntries && !map.has(key)) {
    for (const [k, v] of map) {
      if (!v || now > v.expiresAt) {
        map.delete(k);
      }
    }
    if (map.size >= maxEntries) {
      const oldestKey = map.keys().next().value;
      if (oldestKey !== undefined) {
        map.delete(oldestKey);
      }
    }
  }
  map.set(key, value);
}

/**
 * Bounded rate-limiter helper with `MAX_RATE_KEYS = 10000`.
 * Evicts expired or oldest keys when full.
 * @param {Map<string, { count: number, resetAt: number }>} map
 * @param {string} key
 * @param {number} maxRequests
 * @param {number} windowMs
 * @returns {{ allowed: boolean, count: number, remaining: number, retryAfterSec: number, resetAt: number }}
 */
function checkRateLimit(map, key, maxRequests, windowMs) {
  const now = Date.now();
  let entry = map.get(key);
  if (!entry || now >= entry.resetAt) {
    if (map.size >= MAX_RATE_KEYS && !map.has(key)) {
      for (const [k, v] of map) {
        if (!v || now >= v.resetAt) {
          map.delete(k);
        }
      }
      if (map.size >= MAX_RATE_KEYS) {
        const oldestKey = map.keys().next().value;
        if (oldestKey !== undefined) {
          map.delete(oldestKey);
        }
      }
    }
    entry = { count: 1, resetAt: now + windowMs };
    map.set(key, entry);
    return {
      allowed: true,
      count: 1,
      remaining: Math.max(0, maxRequests - 1),
      retryAfterSec: Math.max(1, Math.ceil(windowMs / 1000)),
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  if (entry.count > maxRequests) {
    return {
      allowed: false,
      count: entry.count,
      remaining: 0,
      retryAfterSec,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    count: entry.count,
    remaining: Math.max(0, maxRequests - entry.count),
    retryAfterSec,
    resetAt: entry.resetAt,
  };
}

/**
 * Deduplicate analytics/telemetry counter increments per non-loopback IP within a 3-minute TTL window.
 * @param {string} ip
 * @param {string} eventKey
 * @param {number} [ttlMs=ANALYTICS_DEDUP_TTL_MS]
 * @returns {boolean}
 */
function shouldRecordAnalyticsEvent(ip, eventKey, ttlMs = ANALYTICS_DEDUP_TTL_MS) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return true;
  }
  const now = Date.now();
  const expiresAt = recentAnalyticsEvents.get(eventKey);
  if (expiresAt && now < expiresAt) {
    return false;
  }
  if (recentAnalyticsEvents.size >= MAX_RATE_KEYS && !recentAnalyticsEvents.has(eventKey)) {
    for (const [k, exp] of recentAnalyticsEvents) {
      if (now >= exp) {
        recentAnalyticsEvents.delete(k);
      }
    }
    if (recentAnalyticsEvents.size >= MAX_RATE_KEYS) {
      const oldestKey = recentAnalyticsEvents.keys().next().value;
      if (oldestKey !== undefined) {
        recentAnalyticsEvents.delete(oldestKey);
      }
    }
  }
  recentAnalyticsEvents.set(eventKey, now + ttlMs);
  return true;
}

// Periodic cleanup of expired rate-limit, session, and analytics deduplication keys
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of adminSessions) {
    if (!v || now > v.expiresAt) adminSessions.delete(k);
  }
  for (const [k, v] of temp2faTokens) {
    if (!v || now > v.expiresAt) {
      temp2faTokens.delete(k);
      addRevokedToken(k);
    }
  }
  for (const map of [
    loginAttempts,
    verify2faAttempts,
    publicApiRateMap,
    adClickRateMap,
    apkDownloadRateMap,
  ]) {
    for (const [k, v] of map) {
      if (!v || now >= v.resetAt) map.delete(k);
    }
  }
  for (const [k, exp] of recentAnalyticsEvents) {
    if (now >= exp) recentAnalyticsEvents.delete(k);
  }
}, 60000).unref();

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
  '.backup': 'application/octet-stream',
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
 * Persist current `store` state atomically to `data/store.json`.
 */
let saveTimer = null;
function saveStore(immediate = false) {
  const writeNow = () => {
    try {
      const tmpPath = `${STORE_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
      fs.renameSync(tmpPath, STORE_PATH);
    } catch (err) {
      console.error('[KV-TV] Failed to save store.json:', err.message);
    }
  };

  if (immediate) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    writeNow();
    return;
  }

  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      saveTimer = null;
      writeNow();
    }, 150);
  }
}

/**
 * Format byte count into human-readable string (e.g. "42.8 MB").
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n <= 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Normalize an IP address (stripping `::ffff:` IPv4-mapped IPv6 prefix and capping at 64 chars).
 * @param {string} rawIp
 * @returns {string}
 */
function normalizeClientIp(rawIp) {
  let ip = String(rawIp || '').trim();
  if (ip.toLowerCase().startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  return ip.slice(0, 64) || '127.0.0.1';
}

/**
 * Extract trusted client IP preferring `cf-connecting-ip`, then `x-real-ip`,
 * then first valid IP in `x-forwarded-for`, falling back to `req.socket?.remoteAddress || '127.0.0.1'`.
 * @param {http.IncomingMessage} req
 * @returns {string}
 */
function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return normalizeClientIp(cfIp.split(',')[0]);
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return normalizeClientIp(realIp.split(',')[0]);
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const firstIp = forwarded
      .split(',')
      .map((s) => s.trim())
      .find(Boolean);
    if (firstIp) {
      return normalizeClientIp(firstIp);
    }
  }
  return normalizeClientIp(req.socket?.remoteAddress || '127.0.0.1');
}

/**
 * Infer device type ('tv', 'mobile', 'desktop') from query parameter or User-Agent.
 * @param {http.IncomingMessage} req
 * @param {URLSearchParams} searchParams
 * @returns {'tv'|'mobile'|'desktop'}
 */
function detectDeviceType(req, searchParams) {
  const explicit = (searchParams.get('device') || '').toLowerCase();
  if (explicit === 'tv' || explicit === 'mobile' || explicit === 'desktop') {
    return explicit;
  }
  const ua = String(req.headers['user-agent'] || '');
  if (
    /Android.*TV|BRAVIA|AFTV|MIBOX|Shield|TV Bro|Leanback|SmartTV|GoogleTV|CrKey|Dalvik|Downloader/i.test(
      ua
    )
  ) {
    return 'tv';
  }
  if (/Mobile|iPhone|iPad|iPod|Android/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get or create today's analytics bucket in `store.analytics.daily`.
 * @returns {{ date: string, tvViews: number, webViews: number, downloads: number }}
 */
function getTodayAnalyticsBucket() {
  if (!store.analytics) {
    store.analytics = { daily: [], logs: [] };
  }
  if (!Array.isArray(store.analytics.daily)) {
    store.analytics.daily = [];
  }
  const todayKey = formatDateKey(new Date());
  let bucket = store.analytics.daily.find((d) => d.date === todayKey);
  if (!bucket) {
    bucket = { date: todayKey, tvViews: 0, webViews: 0, downloads: 0 };
    store.analytics.daily.push(bucket);
    if (store.analytics.daily.length > 14) {
      store.analytics.daily = store.analytics.daily.slice(-14);
    }
  }
  return bucket;
}

/**
 * Append a telemetry event to `store.analytics.logs` (capped at 100 latest entries).
 * @param {object} entry
 */
function recordTelemetryEvent(entry) {
  if (!store.analytics) {
    store.analytics = { daily: [], logs: [] };
  }
  if (!Array.isArray(store.analytics.logs)) {
    store.analytics.logs = [];
  }
  const logItem = {
    id: `evt-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`,
    timestamp: new Date().toISOString(),
    event: entry.event || 'view',
    appId: entry.appId || null,
    appName: entry.appName || 'Catalog View',
    deviceType: entry.deviceType || 'tv',
    ip: entry.ip || '127.0.0.1',
    userAgent: String(entry.userAgent || '').slice(0, 180),
  };
  store.analytics.logs.unshift(logItem);
  if (store.analytics.logs.length > 100) {
    store.analytics.logs.length = 100;
  }
}

/**
 * Send JSON response with optional gzip and standard security headers.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {number} statusCode
 * @param {object} payload
 * @param {object} [extraHeaders={}]
 */
function sendJson(req, res, statusCode, payload, extraHeaders = {}) {
  const jsonStr = JSON.stringify(payload);
  const acceptEncoding = String(req.headers['accept-encoding'] || '');
  const isHead = (req.method || 'GET').toUpperCase() === 'HEAD';
  const corsOrigin = resolveCorsOrigin(req);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    ...SECURITY_HEADERS,
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Admin-Token, X-File-Name, X-Upload-Type, Range',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Expose-Headers':
      'Content-Length, Content-Range, Accept-Ranges, Content-Disposition, X-Download-Source, X-Backup-Url, X-KVTV-SHA256',
    ...extraHeaders,
  };
  if (corsOrigin !== '*') {
    headers.Vary = 'Origin';
  }

  if (!isHead && jsonStr.length > 1024 && acceptEncoding.includes('gzip')) {
    const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
    headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = String(compressed.length);
    res.writeHead(statusCode, headers);
    res.end(compressed);
    return;
  }

  const buf = Buffer.from(jsonStr, 'utf8');
  headers['Content-Length'] = String(buf.length);
  res.writeHead(statusCode, headers);
  if (isHead) {
    res.end();
    return;
  }
  res.end(buf);
}

/**
 * Read request body as a Buffer up to `maxBytes`.
 * @param {http.IncomingMessage} req
 * @param {number} maxBytes
 * @returns {Promise<Buffer>}
 */
function readBodyBuffer(req, maxBytes = MAX_JSON_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let aborted = false;

    req.on('data', (chunk) => {
      if (aborted) return;
      total += chunk.length;
      if (total > maxBytes) {
        aborted = true;
        reject(new Error(`Payload exceeds limit of ${formatBytes(maxBytes)}`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (aborted) return;
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (err) => {
      if (aborted) return;
      reject(err);
    });
  });
}

/**
 * Parse JSON request body.
 * @param {http.IncomingMessage} req
 * @returns {Promise<object>}
 */
async function readJsonBody(req) {
  const buf = await readBodyBuffer(req, MAX_JSON_BYTES);
  if (!buf.length) return {};
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    throw new Error('Invalid JSON payload');
  }
}

/**
 * Resolve dedicated HMAC signing key for session and temporary 2FA tokens.
 * @returns {string}
 */
function getHmacSecret() {
  return `${process.env.SESSION_HMAC_SECRET || 'kvtv-prod-hmac'}:${
    store.admin.passwordHash || 'kvtv-secret'
  }`;
}

/**
 * Create a signed session token or temp token.
 * @param {string} username
 * @param {'session'|'temp2fa'} kind
 * @param {number} ttlMs
 * @returns {string}
 */
function createAuthToken(username, kind = 'session', ttlMs = 12 * 3600 * 1000) {
  const now = Date.now();
  const expiresAt = now + ttlMs;
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${kind}:${username}:${expiresAt}:${nonce}`;
  const sig = crypto
    .createHmac('sha256', getHmacSecret())
    .update(payload)
    .digest('hex');
  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');

  if (kind === 'session') {
    setBoundedSession(adminSessions, token, { username, createdAt: now, expiresAt });
  } else {
    setBoundedSession(temp2faTokens, token, {
      username,
      createdAt: now,
      expiresAt,
      failedAttempts: 0,
    });
  }
  return token;
}

/**
 * Verify a signed session token or temp token.
 * @param {string} token
 * @param {'session'|'temp2fa'} expectedKind
 * @returns {boolean}
 */
function verifyAuthToken(token, expectedKind = 'session') {
  if (!token || typeof token !== 'string') return false;
  if (revokedTokens.has(token)) return false;

  const map = expectedKind === 'session' ? adminSessions : temp2faTokens;
  const cached = map.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      map.delete(token);
      if (expectedKind === 'temp2fa') {
        addRevokedToken(token);
      }
      return false;
    }
    return true;
  }

  // Fallback stateless HMAC verification (survives process reloads)
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 5) return false;
    const [kind, username, expiresAtStr, nonce, sig] = parts;
    if (kind !== expectedKind) return false;
    const expiresAt = Number(expiresAtStr);
    if (!expiresAt || Date.now() > expiresAt) return false;

    const payload = `${kind}:${username}:${expiresAtStr}:${nonce}`;
    const expectedSig = crypto
      .createHmac('sha256', getHmacSecret())
      .update(payload)
      .digest('hex');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Extract Bearer token from request headers and verify admin authentication.
 * @param {http.IncomingMessage} req
 * @returns {boolean}
 */
function isAuthenticatedAdmin(req) {
  const authHeader = String(req.headers.authorization || '');
  let token = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }
  return verifyAuthToken(token, 'session');
}

/**
 * Build a minimal valid ZIP archive Buffer in pure Node.js so demo APK and Preset downloads
 * are real, well-formed ZIP/APK archives containing a manifest & KV-TV configuration profile.
 * @param {string} entryFileName
 * @param {Buffer} contentBuffer
 * @returns {Buffer}
 */
function buildMinimalZipArchive(entryFileName, contentBuffer) {
  const nameBuf = Buffer.from(entryFileName, 'utf8');
  const dataBuf = Buffer.isBuffer(contentBuffer)
    ? contentBuffer
    : Buffer.from(String(contentBuffer), 'utf8');

  // Compute CRC-32
  let crc = 0xffffffff;
  for (let i = 0; i < dataBuf.length; i++) {
    crc ^= dataBuf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  crc = (crc ^ 0xffffffff) >>> 0;

  // Local file header (30 bytes + name)
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
  localHeader.writeUInt16LE(20, 4); // Version needed
  localHeader.writeUInt16LE(0, 6); // Flags
  localHeader.writeUInt16LE(0, 8); // Compression (0 = store)
  localHeader.writeUInt16LE(0, 10); // Mod time
  localHeader.writeUInt16LE(0, 12); // Mod date
  localHeader.writeUInt32LE(crc, 14); // CRC-32
  localHeader.writeUInt32LE(dataBuf.length, 18); // Compressed size
  localHeader.writeUInt32LE(dataBuf.length, 22); // Uncompressed size
  localHeader.writeUInt16LE(nameBuf.length, 26); // Filename length
  localHeader.writeUInt16LE(0, 28); // Extra field length

  // Central directory file header (46 bytes + name)
  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
  centralHeader.writeUInt16LE(20, 4); // Version made by
  centralHeader.writeUInt16LE(20, 6); // Version needed
  centralHeader.writeUInt16LE(0, 8); // Flags
  centralHeader.writeUInt16LE(0, 10); // Compression
  centralHeader.writeUInt16LE(0, 12); // Mod time
  centralHeader.writeUInt16LE(0, 14); // Mod date
  centralHeader.writeUInt32LE(crc, 16); // CRC-32
  centralHeader.writeUInt32LE(dataBuf.length, 20); // Compressed size
  centralHeader.writeUInt32LE(dataBuf.length, 24); // Uncompressed size
  centralHeader.writeUInt16LE(nameBuf.length, 28); // Filename length
  centralHeader.writeUInt16LE(0, 30); // Extra length
  centralHeader.writeUInt16LE(0, 32); // Comment length
  centralHeader.writeUInt16LE(0, 34); // Disk number
  centralHeader.writeUInt16LE(0, 36); // Internal attrs
  centralHeader.writeUInt32LE(0, 38); // External attrs
  centralHeader.writeUInt32LE(0, 42); // Offset of local header

  const centralOffset = localHeader.length + nameBuf.length + dataBuf.length;
  const centralSize = centralHeader.length + nameBuf.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // PK\x05\x06
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Central dir disk
  eocd.writeUInt16LE(1, 8); // Entries on disk
  eocd.writeUInt16LE(1, 10); // Total entries
  eocd.writeUInt32LE(centralSize, 12); // Central dir size
  eocd.writeUInt32LE(centralOffset, 16); // Central dir offset
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([localHeader, nameBuf, dataBuf, centralHeader, nameBuf, eocd]);
}

/**
 * Compute standard CRC-32 checksum over a Buffer.
 * @param {Buffer} dataBuf
 * @returns {number}
 */
function computeCrc32(dataBuf) {
  let crc = 0xffffffff;
  for (let i = 0; i < dataBuf.length; i++) {
    crc ^= dataBuf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Build a multi-file ZIP archive Buffer in memory using Deflate (compression method 8).
 * @param {Array<{ name: string, data: Buffer }>} entries
 * @returns {Buffer}
 */
function buildMultiFileZipArchive(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const rawBuf = Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(String(entry.data), 'utf8');
    const compressedBuf = zlib.deflateRawSync(rawBuf);
    const crc = computeCrc32(rawBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    localHeader.writeUInt16LE(20, 4); // Version needed
    localHeader.writeUInt16LE(0, 6); // Flags
    localHeader.writeUInt16LE(8, 8); // Compression (8 = deflate)
    localHeader.writeUInt16LE(0, 10); // Mod time
    localHeader.writeUInt16LE(0, 12); // Mod date
    localHeader.writeUInt32LE(crc, 14); // CRC-32
    localHeader.writeUInt32LE(compressedBuf.length, 18); // Compressed size
    localHeader.writeUInt32LE(rawBuf.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // Filename length
    localHeader.writeUInt16LE(0, 28); // Extra field length

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
    centralHeader.writeUInt16LE(20, 4); // Version made by
    centralHeader.writeUInt16LE(20, 6); // Version needed
    centralHeader.writeUInt16LE(0, 8); // Flags
    centralHeader.writeUInt16LE(8, 10); // Compression (8 = deflate)
    centralHeader.writeUInt16LE(0, 12); // Mod time
    centralHeader.writeUInt16LE(0, 14); // Mod date
    centralHeader.writeUInt32LE(crc, 16); // CRC-32
    centralHeader.writeUInt32LE(compressedBuf.length, 20); // Compressed size
    centralHeader.writeUInt32LE(rawBuf.length, 24); // Uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28); // Filename length
    centralHeader.writeUInt16LE(0, 30); // Extra length
    centralHeader.writeUInt16LE(0, 32); // Comment length
    centralHeader.writeUInt16LE(0, 34); // Disk number
    centralHeader.writeUInt16LE(0, 36); // Internal attrs
    centralHeader.writeUInt32LE(0, 38); // External attrs
    centralHeader.writeUInt32LE(offset, 42); // Offset of local header

    localParts.push(localHeader, nameBuf, compressedBuf);
    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressedBuf.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // PK\x05\x06
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Central dir disk
  eocd.writeUInt16LE(entries.length, 8); // Entries on disk
  eocd.writeUInt16LE(entries.length, 10); // Total entries
  eocd.writeUInt32LE(centralBuf.length, 12); // Central dir size
  eocd.writeUInt32LE(offset, 16); // Central dir offset
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

/**
 * Dynamically package `addons/plugin.video.kvnetflix` into an in-memory ZIP Buffer
 * so Kodi KV-Netflix preset addon works in 100% Link-Only mode without local files in `uploads/`.
 * @returns {Buffer | null}
 */
function buildKodiAddonZipBuffer() {
  const addonsRoot = path.join(__dirname, 'addons');
  const addonDir = path.join(addonsRoot, 'plugin.video.kvnetflix');
  if (!fs.existsSync(addonDir)) return null;

  const entries = [];
  function walk(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(fullPath);
      } else if (item.isFile()) {
        const relPath = path.relative(addonsRoot, fullPath).replace(/\\/g, '/');
        entries.push({
          name: relPath,
          data: fs.readFileSync(fullPath),
        });
      }
    }
  }
  walk(addonDir);
  if (entries.length === 0) return null;
  return buildMultiFileZipArchive(entries);
}

/**
 * Dynamically build CloudStream 3 KV-PreSetup `.json` backup Buffer in memory.
 * @returns {Buffer}
 */
function buildCloudStreamPresetBuffer() {
  const preset = {
    datastore: {
      _Bool: {},
      _Int: {},
      _String: {
        REPOSITORIES_KEY:
          '[{"name": "KV-Netflix", "url": "https://n.khoavo.vndns.net/repo.json", "iconUrl": "https://n.khoavo.vndns.net/favicon.svg"}]',
        PLUGINS_KEY:
          '[{"internalName":"KVNetflixProvider","url":"https://n.khoavo.vndns.net/KVNetflixProvider.cs3","isOnline":true,"version":1}]',
        '0/home_api_used': '"KV-Netflix"',
      },
      _Float: {},
      _Long: {},
      _StringSet: {},
    },
    settings: {
      _Bool: {
        auto_update: true,
        auto_update_plugins: true,
        auto_rotate_video_key: true,
      },
      _Int: {},
      _String: {
        filter_sub_lang_key: 'vi',
        app_locale: 'vi',
      },
      _Float: {},
      _Long: {},
      _StringSet: {
        provider_lang_key: ['vi', 'en'],
      },
    },
  };
  return Buffer.from(JSON.stringify(preset, null, 2), 'utf8');
}

/**
 * Inspect storage metrics for `/uploads` and `/data/store.json`.
 * @returns {object}
 */
function getStorageMetrics() {
  let uploadsCount = 0;
  let uploadsBytes = 0;
  const files = [];

  try {
    if (fs.existsSync(UPLOADS_DIR)) {
      const entries = fs.readdirSync(UPLOADS_DIR);
      for (const name of entries) {
        if (name.startsWith('.')) continue;
        const fullPath = path.join(UPLOADS_DIR, name);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          uploadsCount += 1;
          uploadsBytes += stat.size;
          files.push({
            name,
            bytes: stat.size,
            sizeFormatted: formatBytes(stat.size),
            updatedAt: stat.mtime.toISOString(),
          });
        }
      }
    }
  } catch {
    // Ignore read errors
  }

  let dataBytes = 0;
  try {
    if (fs.existsSync(STORE_PATH)) {
      dataBytes = fs.statSync(STORE_PATH).size;
    }
  } catch {
    dataBytes = 0;
  }

  return {
    uploadsCount,
    uploadsBytes,
    uploadsFormatted: formatBytes(uploadsBytes),
    dataBytes,
    dataFormatted: formatBytes(dataBytes),
    files,
  };
}

/**
 * Extract file buffer and metadata from a multipart/form-data request or raw binary stream.
 * @param {http.IncomingMessage} req
 * @param {URLSearchParams} searchParams
 * @returns {Promise<{ fileName: string, uploadType: 'apk'|'preset', fileBuffer: Buffer }>}
 */
async function parseUploadPayload(req, searchParams) {
  const contentType = String(req.headers['content-type'] || '');
  const rawBuffer = await readBodyBuffer(req, MAX_UPLOAD_BYTES);

  // Case 1: JSON with base64 payload
  if (contentType.includes('application/json')) {
    let parsed = {};
    try {
      parsed = JSON.parse(rawBuffer.toString('utf8'));
    } catch {
      throw new Error('Invalid JSON upload payload');
    }
    const uploadType = parsed.uploadType === 'preset' ? 'preset' : 'apk';
    const fileName = String(parsed.fileName || `upload.${uploadType === 'preset' ? 'zip' : 'apk'}`);
    const base64Str = String(parsed.dataBase64 || parsed.data || '').replace(
      /^data:[^;]+;base64,/,
      ''
    );
    const fileBuffer = Buffer.from(base64Str, 'base64');
    return { fileName, uploadType, fileBuffer };
  }

  // Case 2: multipart/form-data
  if (contentType.includes('multipart/form-data')) {
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      throw new Error('Missing multipart boundary');
    }
    const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
    const boundaryBuf = Buffer.from(boundary, 'utf8');

    let uploadType = searchParams.get('type') === 'preset' ? 'preset' : 'apk';
    let fileName = searchParams.get('filename') || '';
    let fileBuffer = null;

    let start = rawBuffer.indexOf(boundaryBuf);
    while (start !== -1) {
      const partStart = start + boundaryBuf.length;
      if (rawBuffer.subarray(partStart, partStart + 2).toString() === '--') {
        break; // End boundary
      }
      const headerStart = partStart + 2; // skip \r\n
      const headerEnd = rawBuffer.indexOf(Buffer.from('\r\n\r\n'), headerStart);
      if (headerEnd === -1) break;

      const headerStr = rawBuffer.subarray(headerStart, headerEnd).toString('utf8');
      const bodyStart = headerEnd + 4;
      const nextBoundary = rawBuffer.indexOf(boundaryBuf, bodyStart);
      if (nextBoundary === -1) break;
      const bodyEnd = nextBoundary - 2; // strip trailing \r\n before boundary
      const partBody = rawBuffer.subarray(bodyStart, bodyEnd);

      const fnMatch = headerStr.match(/filename="([^"]+)"/i);
      const nameMatch = headerStr.match(/name="([^"]+)"/i);
      const fieldName = nameMatch ? nameMatch[1] : '';

      if (fnMatch) {
        fileName = fnMatch[1];
        fileBuffer = partBody;
      } else if (fieldName === 'uploadType' || fieldName === 'type') {
        const val = partBody.toString('utf8').trim().toLowerCase();
        if (val === 'preset' || val === 'apk') uploadType = val;
      }

      start = nextBoundary;
    }

    if (!fileBuffer) {
      throw new Error('No file found in multipart upload');
    }
    return {
      fileName: fileName || `package.${uploadType === 'preset' ? 'zip' : 'apk'}`,
      uploadType,
      fileBuffer,
    };
  }

  // Case 3: Raw binary upload via fetch(url, { headers: { 'X-File-Name', 'X-Upload-Type' }, body: file })
  const headerUploadType = String(
    req.headers['x-upload-type'] || searchParams.get('type') || 'apk'
  ).toLowerCase();
  const uploadType = headerUploadType === 'preset' ? 'preset' : 'apk';
  const rawFileName =
    decodeURIComponent(
      String(req.headers['x-file-name'] || searchParams.get('filename') || '')
    ) || `package.${uploadType === 'preset' ? 'zip' : 'apk'}`;

  return {
    fileName: rawFileName,
    uploadType,
    fileBuffer: rawBuffer,
  };
}

/**
 * Resolve canonical APK file name for an app entry.
 * @param {object} app
 * @returns {string}
 */
function getCanonicalApkFileName(app) {
  if (app && app.apkFileName) {
    return path.basename(String(app.apkFileName).trim());
  }
  if (app && app.id === 'kv-netflix') {
    return 'kv-netflix-tv.apk';
  }
  return `${app?.id || 'app'}.apk`;
}

/**
 * Resolve Forgejo backup APK URL for an app entry.
 * @param {object} app
 * @returns {string}
 */
function getBackupApkUrl(app) {
  const fileName = getCanonicalApkFileName(app);
  if (app && typeof app.backupApkUrl === 'string' && app.backupApkUrl.trim()) {
    return app.backupApkUrl.trim();
  }
  if (
    app &&
    typeof app.apkUrl === 'string' &&
    app.apkUrl.includes('git.khoavo.myds.me')
  ) {
    return app.apkUrl.trim();
  }
  return `https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/${fileName}`;
}

/**
 * Resolve local APK file on VPS disk (`UPLOADS_DIR` or `PUBLIC_DIR`) if present and non-empty.
 * @param {object} app
 * @returns {{ filePath: string, stat: fs.Stats, fileName: string } | null}
 */
function resolveLocalApkPath(app) {
  const canonicalName = getCanonicalApkFileName(app);
  const candidateNames = Array.from(
    new Set(
      [
        canonicalName,
        app?.id ? `${app.id}.apk` : null,
        app?.id ? `${app.id}-apk.apk` : null,
      ].filter(Boolean)
    )
  );

  for (const name of candidateNames) {
    const base = path.basename(name);
    for (const dir of [UPLOADS_DIR, PUBLIC_DIR]) {
      const fullPath = path.join(dir, base);
      try {
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);
          if (stat.isFile() && stat.size > 0) {
            return { filePath: fullPath, stat, fileName: canonicalName };
          }
        }
      } catch {
        // Ignore stat error
      }
    }
  }
  return null;
}

const ULTRA_SHORT_TO_CODE = Object.freeze({
  '0': '88000',
  '1': '88101',
  '2': '88102',
  '3': '88103',
  '4': '88104',
  '5': '88105',
  '6': '88106',
});

const CODE_TO_ULTRA_SHORT = Object.freeze({
  '88000': '0',
  '88101': '1',
  '88102': '2',
  '88103': '3',
  '88104': '4',
  '88105': '5',
  '88106': '6',
});

/**
 * Find an app in `store.apps` by `id`, 5-digit `shortCode` (`88000`, `88101`–`88106`),
 * single-digit ultra-short code (`0`–`6`), or `aftvCode` (from `go.aftvnews.com`).
 * @param {string} identifier
 * @returns {object | undefined}
 */
function findAppByIdentifier(identifier) {
  const norm = String(identifier ?? '').trim().toLowerCase();
  if (!norm) return undefined;
  const mappedCode = ULTRA_SHORT_TO_CODE[norm] || norm;

  return store.apps.find((a) => {
    if (!a) return false;
    if (String(a.id || '').toLowerCase() === norm) return true;
    if (String(a.shortCode || '').toLowerCase() === mappedCode) return true;
    if (a.aftvCode && String(a.aftvCode).trim().toLowerCase() === norm) return true;
    if (
      a.ultraShortPath &&
      String(a.ultraShortPath).trim().toLowerCase().endsWith(`/${norm}`)
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Enrich app object with primary VPS and automatic Forgejo backup download URLs.
 * @param {object} app
 * @returns {object}
 */
function decorateAppForPublic(app) {
  if (!app) return app;
  const fileName = getCanonicalApkFileName(app);
  const localApk = resolveLocalApkPath(app);
  const backupApkUrl = getBackupApkUrl(app);
  const defaultPrimaryUrl = `https://tv.vndns.net/uploads/${fileName}`;
  const apkUrl =
    app.apkUrl && !String(app.apkUrl).includes('git.khoavo.myds.me')
      ? app.apkUrl
      : defaultPrimaryUrl;
  const shortCodeStr = String(app.shortCode || '').trim();
  const ultraDigit = CODE_TO_ULTRA_SHORT[shortCodeStr];
  const shortPath =
    app.shortPath || (shortCodeStr ? `tv.vndns.net/${shortCodeStr}` : null);
  const ultraShortPath =
    app.ultraShortPath ||
    (ultraDigit !== undefined ? `tv.vndns.net/${ultraDigit}` : null);
  const aftvCode =
    app.aftvCode && String(app.aftvCode).trim()
      ? String(app.aftvCode).trim()
      : null;

  return {
    ...app,
    shortPath,
    ultraShortPath,
    aftvCode,
    apkFileName: fileName,
    apkUrl,
    backupApkUrl,
    apkDownloadUrl:
      app.id === 'kv-store' ? '/kv-store.apk' : `/api/download/${app.id}?type=apk`,
    primaryApkUrl: `/api/download/${app.id}?type=apk&source=vps`,
    fallbackDownloadUrl: `/api/download/${app.id}?type=apk&source=backup`,
    hasPrimaryVpsFile: Boolean(localApk),
  };
}

/**
 * Serve a file with full HTTP Range (`206 Partial Content`), `Accept-Ranges: bytes`,
 * `HEAD` support, and optional gzip for small text assets.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {string} filePath
 * @param {object} [extraHeaders={}]
 */
function serveFileWithRange(req, res, filePath, extraHeaders = {}) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      sendJson(req, res, 404, { error: 'File not found' });
      return;
    }

    const method = (req.method || 'GET').toUpperCase();
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      extraHeaders['Content-Type'] || MIME_TYPES[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';
    const cacheControl =
      extraHeaders['Cache-Control'] ||
      (isHtml ? 'no-cache, must-revalidate' : 'public, max-age=3600');

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Accept-Ranges': 'bytes',
      ...SECURITY_HEADERS,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers':
        'Content-Length, Content-Range, Accept-Ranges, Content-Disposition, X-Download-Source, X-Backup-Url, X-KVTV-SHA256',
      ...extraHeaders,
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
      let start = 0;
      let end = stat.size - 1;

      if (rawStart === '' && rawEnd !== '') {
        const suffixLen = parseInt(rawEnd, 10);
        if (!Number.isFinite(suffixLen) || suffixLen <= 0) {
          headers['Content-Range'] = `bytes */${stat.size}`;
          res.writeHead(416, headers);
          res.end();
          return;
        }
        start = Math.max(0, stat.size - suffixLen);
      } else {
        start = rawStart !== '' ? parseInt(rawStart, 10) : 0;
        end = rawEnd !== '' ? parseInt(rawEnd, 10) : stat.size - 1;
        if (end >= stat.size) {
          end = stat.size - 1;
        }
      }

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
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    const isAttachment = Boolean(headers['Content-Disposition']);
    if (
      method === 'GET' &&
      !isAttachment &&
      COMPRESSIBLE_EXTS.has(ext) &&
      stat.size > 512 &&
      stat.size < 5 * 1024 * 1024 &&
      acceptEncoding.includes('gzip')
    ) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
      return;
    }

    headers['Content-Length'] = String(stat.size);
    res.writeHead(200, headers);
    if (method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
}

/**
 * Serve static files from `baseDir` safely with directory traversal prevention, Range, and HEAD support.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {string} baseDir
 * @param {string} relativePath
 * @param {object} [extraHeaders={}]
 */
function serveStaticFile(req, res, baseDir, relativePath, extraHeaders = {}) {
  const safeRel = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(baseDir, safeRel);

  if (!fullPath.startsWith(baseDir)) {
    sendJson(req, res, 403, { error: 'Forbidden path' });
    return;
  }

  serveFileWithRange(req, res, fullPath, extraHeaders);
}

// Track active background APK cache streams to avoid duplicate simultaneous writes
const activeBackgroundCaches = new Set();

/**
 * Stream/proxy APK from Forgejo `backupUrl` directly to the client while caching to
 * `UPLOADS_DIR/<fileName>` in the background; falls back to a 302 redirect if upstream fails.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {object} app
 * @param {string} backupUrl
 * @param {string} fileName
 */
function streamFromBackupWithCache(req, res, app, backupUrl, fileName) {
  const method = (req.method || 'GET').toUpperCase();
  const maxRedirects = 5;

  const fallbackRedirect = () => {
    if (res.headersSent) {
      res.end();
      return;
    }
    res.writeHead(302, {
      Location: backupUrl,
      'Cache-Control': 'no-store',
      'X-Download-Source': 'forgejo-backup-redirect',
      'X-Backup-Url': backupUrl,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Location, X-Download-Source, X-Backup-Url',
    });
    res.end();
  };

  function fetchUpstream(targetUrl, redirectsLeft) {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      fallbackRedirect();
      return;
    }

    const transport = parsed.protocol === 'https:' ? https : http;
    const reqHeaders = {
      'User-Agent': req.headers['user-agent'] || 'KV-TV-Store-Proxy/1.0',
      Accept: '*/*',
    };
    const forgejoToken = (process.env.FORGEJO_TOKEN || '').trim();
    if (forgejoToken && parsed.hostname === 'git.khoavo.myds.me') {
      reqHeaders.Authorization = `token ${forgejoToken}`;
    }
    if (req.headers.range) {
      reqHeaders.Range = req.headers.range;
    }

    const upstreamReq = transport.request(
      parsed,
      {
        method: method === 'HEAD' ? 'HEAD' : 'GET',
        headers: reqHeaders,
        timeout: 12000,
      },
      (upstreamRes) => {
        const statusCode = upstreamRes.statusCode || 502;

        // Follow 301/302/303/307/308 redirects transparently (unless redirecting to login page)
        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          upstreamRes.headers.location
        ) {
          const loc = String(upstreamRes.headers.location);
          upstreamRes.resume();
          if (redirectsLeft <= 0 || loc.includes('/user/login')) {
            fallbackRedirect();
            return;
          }
          const nextUrl = new URL(loc, parsed).toString();
          fetchUpstream(nextUrl, redirectsLeft - 1);
          return;
        }

        const contentType = String(upstreamRes.headers['content-type'] || '').toLowerCase();
        if ((statusCode !== 200 && statusCode !== 206) || contentType.includes('text/html')) {
          upstreamRes.resume();
          fallbackRedirect();
          return;
        }

        const outHeaders = {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
          'X-Download-Source': 'forgejo-backup-proxy',
          'X-Backup-Url': backupUrl,
          'X-KVTV-SHA256': app?.sha256 || '',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers':
            'Content-Length, Content-Range, Accept-Ranges, Content-Disposition, X-Download-Source, X-Backup-Url, X-KVTV-SHA256',
        };

        if (upstreamRes.headers['content-length']) {
          outHeaders['Content-Length'] = String(upstreamRes.headers['content-length']);
        }
        if (upstreamRes.headers['content-range']) {
          outHeaders['Content-Range'] = String(upstreamRes.headers['content-range']);
        }

        res.writeHead(statusCode, outHeaders);
        if (method === 'HEAD') {
          upstreamRes.resume();
          res.end();
          return;
        }

        // Background cache to UPLOADS_DIR when streaming a full 200 response
        const shouldCache =
          statusCode === 200 &&
          !req.headers.range &&
          !activeBackgroundCaches.has(fileName);

        if (shouldCache) {
          activeBackgroundCaches.add(fileName);
          const tmpFile = path.join(
            UPLOADS_DIR,
            `.${fileName}.tmp-${process.pid}-${Date.now()}`
          );
          const finalFile = path.join(UPLOADS_DIR, fileName);
          let bytesWritten = 0;
          let cacheAborted = false;
          const fileStream = fs.createWriteStream(tmpFile);

          fileStream.on('error', () => {
            cacheAborted = true;
            activeBackgroundCaches.delete(fileName);
            try {
              if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
            } catch {
              // Ignore
            }
          });

          upstreamRes.on('data', (chunk) => {
            if (!cacheAborted) {
              bytesWritten += chunk.length;
              fileStream.write(chunk);
            }
          });

          upstreamRes.on('end', () => {
            if (cacheAborted) return;
            fileStream.end(() => {
              activeBackgroundCaches.delete(fileName);
              try {
                const expectedLen = Number(upstreamRes.headers['content-length'] || 0);
                if (
                  bytesWritten > 1024 &&
                  (!expectedLen || bytesWritten === expectedLen)
                ) {
                  fs.renameSync(tmpFile, finalFile);
                  if (app && !app.apkFileName) {
                    app.apkFileName = fileName;
                    saveStore(false);
                  }
                } else if (fs.existsSync(tmpFile)) {
                  fs.unlinkSync(tmpFile);
                }
              } catch {
                try {
                  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
                } catch {
                  // Ignore
                }
              }
            });
          });

          upstreamRes.on('error', () => {
            cacheAborted = true;
            activeBackgroundCaches.delete(fileName);
            fileStream.destroy();
            try {
              if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
            } catch {
              // Ignore
            }
          });
        }

        upstreamRes.pipe(res);
      }
    );

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy(new Error('Upstream timeout'));
    });

    upstreamReq.on('error', () => {
      fallbackRedirect();
    });

    upstreamReq.end();
  }

  fetchUpstream(backupUrl, maxRedirects);
}

/**
 * Unified APK download handler with Primary VPS disk serving (HTTP Range + HEAD)
 * and automatic Forgejo backup streaming/fallback.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {object} app
 * @param {URLSearchParams} searchParams
 * @param {object} [options={}]
 */
function handleApkDownload(req, res, app, searchParams, options = {}) {
  const method = (req.method || 'GET').toUpperCase();
  const ip = getClientIp(req);
  const isLoopback = ip === '127.0.0.1' || ip === '::1';
  const fileName = getCanonicalApkFileName(app);
  const backupUrl = getBackupApkUrl(app);
  const source = String(searchParams.get('source') || '').toLowerCase();
  const fallback = searchParams.get('fallback');
  const rangeHeader = String(req.headers.range || '').trim();
  const isInitialGet =
    method === 'GET' && (!rangeHeader || /^bytes=0-/i.test(rangeHeader));

  // Tier 3 — Concurrent APK stream protection & initial GET download rate limit
  if (method === 'GET' && !isLoopback) {
    const activeCount = activeStreamsByIp.get(ip) || 0;
    if (activeCount >= 6) {
      sendJson(
        req,
        res,
        429,
        { ok: false, error: 'Too Many Concurrent Downloads (max 6 per IP)' },
        { 'Retry-After': '15' }
      );
      return;
    }

    if (isInitialGet) {
      const dlRate = checkRateLimit(apkDownloadRateMap, ip, 30, 5 * 60 * 1000);
      if (!dlRate.allowed) {
        sendJson(
          req,
          res,
          429,
          { ok: false, error: 'Too many APK downloads. Please wait a few minutes.' },
          { 'Retry-After': String(dlRate.retryAfterSec) }
        );
        return;
      }
    }

    activeStreamsByIp.set(ip, activeCount + 1);
    let streamReleased = false;
    const releaseStream = () => {
      if (streamReleased) return;
      streamReleased = true;
      const cur = activeStreamsByIp.get(ip) || 0;
      if (cur <= 1) {
        activeStreamsByIp.delete(ip);
      } else {
        activeStreamsByIp.set(ip, cur - 1);
      }
    };
    res.on('close', releaseStream);
    res.on('finish', releaseStream);
  }

  if (
    isInitialGet &&
    options.trackDownload !== false &&
    shouldRecordAnalyticsEvent(ip, `dl:${ip}:${app.id}`)
  ) {
    const deviceType = detectDeviceType(req, searchParams);
    app.downloads = Number(app.downloads || 0) + 1;
    const bucket = getTodayAnalyticsBucket();
    bucket.downloads += 1;
    recordTelemetryEvent({
      event: 'download',
      appId: app.id,
      appName: `${app.name} (apk)`,
      deviceType,
      ip,
      userAgent: req.headers['user-agent'],
    });
    saveStore(false);
  }

  // Explicit backup/Forgejo request
  if (source === 'backup' || source === 'forgejo' || fallback === '1') {
    if (searchParams.get('redirect') !== '1') {
      streamFromBackupWithCache(req, res, app, backupUrl, fileName);
      return;
    }
    res.writeHead(302, {
      Location: backupUrl,
      'Cache-Control': 'no-store',
      'X-Download-Source': 'forgejo-backup',
      'X-Backup-Url': backupUrl,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Location, X-Download-Source, X-Backup-Url',
    });
    res.end();
    return;
  }

  // Primary VPS check in UPLOADS_DIR (or PUBLIC_DIR)
  const localApk = resolveLocalApkPath(app);
  if (localApk) {
    serveFileWithRange(req, res, localApk.filePath, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
      'X-Download-Source': 'vps-primary',
      'X-Backup-Url': backupUrl,
      'X-KVTV-SHA256': app.sha256 || '',
    });
    return;
  }

  // If frontend probe specifically checks `source=vps` via HEAD and file is not on local disk
  if (source === 'vps' && method === 'HEAD') {
    res.writeHead(404, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Download-Source': 'vps-missing',
      'X-Backup-Url': backupUrl,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'X-Download-Source, X-Backup-Url',
    });
    res.end();
    return;
  }

  // Local VPS file not present: stream/proxy transparently from Forgejo backupUrl
  // (while caching to UPLOADS_DIR in background) and fall back to 302 redirect if upstream fails
  if (backupUrl) {
    streamFromBackupWithCache(req, res, app, backupUrl, fileName);
    return;
  }

  // Final synthetic fallback if neither local file nor backupUrl exists
  const manifestData = {
    store: 'KV-TV Store (https://tv.vndns.net)',
    appId: app.id,
    name: app.name,
    edition: app.edition,
    packageName: app.packageName,
    version: app.version,
    shortCode: app.shortCode,
    type: 'apk',
    generatedAt: new Date().toISOString(),
  };
  const archiveBuf = buildMinimalZipArchive(
    'assets/kv-tv-manifest.json',
    Buffer.from(JSON.stringify(manifestData, null, 2), 'utf8')
  );
  res.writeHead(200, {
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Content-Length': String(archiveBuf.length),
    'Cache-Control': 'no-store',
    'X-KVTV-Demo-Package': 'true',
  });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  res.end(archiveBuf);
}

/**
 * Main HTTP request router.
 */
const server = http.createServer(async (req, res) => {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const rawUrl = String(req.url || '/');
    const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      const corsOrigin = resolveCorsOrigin(req);
      const preflightHeaders = {
        ...SECURITY_HEADERS,
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Admin-Token, X-File-Name, X-Upload-Type, Range',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Expose-Headers':
          'Content-Length, Content-Range, Accept-Ranges, Content-Disposition, X-Download-Source, X-Backup-Url, X-KVTV-SHA256',
      };
      if (corsOrigin !== '*') {
        preflightHeaders.Vary = 'Origin';
      }
      res.writeHead(204, preflightHeaders);
      res.end();
      return;
    }

    // Exploit / Dotfile Scanner Blocker
    const rawUrlLower = rawUrl.toLowerCase();
    const pathLower = pathname.toLowerCase();
    if (
      pathLower.startsWith('/.env') ||
      pathLower.startsWith('/.git') ||
      pathLower.startsWith('/wp-admin') ||
      pathLower.startsWith('/wp-login') ||
      pathLower.startsWith('/phpmyadmin') ||
      pathLower.startsWith('/actuator') ||
      pathLower.startsWith('/cgi-bin') ||
      pathLower.startsWith('/.aws') ||
      pathname.includes('..') ||
      rawUrlLower.includes('..') ||
      rawUrlLower.includes('%2e%2e') ||
      pathname.includes('\0') ||
      rawUrlLower.includes('\0') ||
      rawUrlLower.includes('%00')
    ) {
      sendJson(req, res, 403, { ok: false, error: 'Forbidden' });
      return;
    }

    // 1. Healthcheck endpoints
    if ((method === 'GET' || method === 'HEAD') && (pathname === '/api/health' || pathname === '/healthz')) {
      sendJson(req, res, 200, {
        ok: true,
        status: 'healthy',
        service: 'kv-tv-backend',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Tier 2 — Public API Rate Limit (120 requests per 60 seconds per IP)
    if (
      pathname === '/api/catalog' ||
      pathname.startsWith('/api/apps/') ||
      pathname.startsWith('/api/code/') ||
      pathname === '/api/qr'
    ) {
      const ip = getClientIp(req);
      const rl = checkRateLimit(publicApiRateMap, ip, 120, 60 * 1000);
      if (!rl.allowed) {
        sendJson(
          req,
          res,
          429,
          { ok: false, error: 'Too many requests. Please slow down.' },
          { 'Retry-After': String(rl.retryAfterSec) }
        );
        return;
      }
    }

    // 2. GET / HEAD /api/catalog?device=tv|mobile|desktop
    if ((method === 'GET' || method === 'HEAD') && pathname === '/api/catalog') {
      const deviceType = detectDeviceType(req, searchParams);
      const skipTrack = searchParams.get('track') === '0' || method === 'HEAD';
      const ip = getClientIp(req);

      if (!skipTrack && shouldRecordAnalyticsEvent(ip, `view:${ip}:${deviceType}`)) {
        const bucket = getTodayAnalyticsBucket();
        if (deviceType === 'tv') {
          bucket.tvViews += 1;
        } else {
          bucket.webViews += 1;
        }

        for (const ad of store.ads) {
          if (ad.active) {
            ad.impressions = Number(ad.impressions || 0) + 1;
          }
        }

        recordTelemetryEvent({
          event: 'view',
          appId: null,
          appName: `Catalog (${deviceType.toUpperCase()})`,
          deviceType,
          ip,
          userAgent: req.headers['user-agent'],
        });
        saveStore(false);
      }

      const cfCountry = String(req.headers['cf-ipcountry'] || '').toUpperCase();
      const xCountry = String(req.headers['x-country-code'] || '').toUpperCase();
      const suggestedLang = 'vi';

      sendJson(req, res, 200, {
        storeInfo: store.storeInfo || {
          name: 'KV-TV App Store',
          domain: 'https://tv.vndns.net',
          downloaderCodePrefix: '88',
        },
        suggestedLang,
        clientCountry: cfCountry || xCountry || 'UNKNOWN',
        apps: store.apps.map(decorateAppForPublic),
        ads: store.ads.filter((a) => a.active !== false),
        categories: store.categories || [
          'All',
          'Media Center',
          'Streaming',
          'Originals & Cinema',
          'Video & Music',
        ],
      });
      return;
    }

    // 2.2 GET / HEAD /api/apps/:id
    if ((method === 'GET' || method === 'HEAD') && pathname.startsWith('/api/apps/')) {
      const rawId = decodeURIComponent(pathname.slice('/api/apps/'.length)).trim();
      const app = findAppByIdentifier(rawId);
      if (!app) {
        sendJson(req, res, 404, { ok: false, error: `App "${rawId}" not found` });
        return;
      }
      sendJson(req, res, 200, {
        ok: true,
        app: decorateAppForPublic(app),
      });
      return;
    }

    // 2.5 Dedicated /kv-store.apk and /api/download/kv-store endpoint
    if (
      (method === 'GET' || method === 'HEAD') &&
      (pathname === '/kv-store.apk' || pathname === '/api/download/kv-store')
    ) {
      const app = store.apps.find((a) => a.id === 'kv-store') || {
        id: 'kv-store',
        name: 'KV-Store TV',
        shortCode: '88000',
        shortPath: 'tv.vndns.net/88000',
        ultraShortPath: 'tv.vndns.net/0',
        aftvCode: null,
        downloads: 8800,
        apkFileName: 'kv-store.apk',
        apkUrl: 'https://tv.vndns.net/uploads/kv-store.apk',
        backupApkUrl:
          'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-store.apk',
      };
      if (searchParams.get('type') !== 'preset') {
        handleApkDownload(req, res, app, searchParams);
        return;
      }
    }

    // Direct 1-digit (/0–/6) and 5-digit (/88000, /88101–/88106) shortcode routes for Downloader app
    if ((method === 'GET' || method === 'HEAD') && /^\/(\d|\d{5})\/?$/.test(pathname)) {
      const directCode = pathname.replace(/^\//, '').replace(/\/$/, '');
      const app = findAppByIdentifier(directCode);
      if (!app) {
        sendJson(req, res, 404, {
          found: false,
          error: `Short-code "${directCode}" not found. Valid codes: 0–6, 88000, 88101–88106.`,
        });
        return;
      }
      handleApkDownload(req, res, app, searchParams);
      return;
    }

    // 3. GET / HEAD /api/code/:shortCode
    if ((method === 'GET' || method === 'HEAD') && pathname.startsWith('/api/code/')) {
      const code = decodeURIComponent(pathname.slice('/api/code/'.length)).trim();
      const app = findAppByIdentifier(code);
      if (!app) {
        sendJson(req, res, 404, {
          found: false,
          error: `No app found for Downloader code "${code}". Valid codes: 0–6, 88000, 88101–88106.`,
        });
        return;
      }
      const decorated = decorateAppForPublic(app);
      sendJson(req, res, 200, {
        found: true,
        app: decorated,
        downloadUrl: decorated.apkDownloadUrl,
        primaryApkUrl: decorated.primaryApkUrl,
        backupApkUrl: decorated.backupApkUrl,
        fallbackDownloadUrl: decorated.fallbackDownloadUrl,
        presetUrl: app.presetUrl || `/api/download/${app.id}?type=preset`,
        apkUrl: decorated.apkUrl,
        hasPrimaryVpsFile: decorated.hasPrimaryVpsFile,
        linkOnly: !decorated.hasPrimaryVpsFile,
      });
      return;
    }

    // 4. GET / HEAD /go/:shortCode -> Serve APK directly from VPS (with automatic Forgejo fallback)
    if ((method === 'GET' || method === 'HEAD') && pathname.startsWith('/go/')) {
      const code = decodeURIComponent(pathname.slice('/go/'.length)).trim();
      const app = findAppByIdentifier(code);
      if (!app) {
        sendJson(req, res, 404, {
          found: false,
          error: `Short-code "${code}" not found`,
        });
        return;
      }
      handleApkDownload(req, res, app, searchParams);
      return;
    }

    // 5. GET / HEAD /api/download/:appId?type=apk|preset&source=vps|backup
    if ((method === 'GET' || method === 'HEAD') && pathname.startsWith('/api/download/')) {
      const rawId = decodeURIComponent(pathname.slice('/api/download/'.length)).trim();
      const app = findAppByIdentifier(rawId);
      if (!app) {
        sendJson(req, res, 404, { error: `App "${rawId}" not found` });
        return;
      }

      const downloadType = searchParams.get('type') === 'preset' ? 'preset' : 'apk';
      if (downloadType === 'apk') {
        handleApkDownload(req, res, app, searchParams);
        return;
      }

      // Preset download handling (`type=preset`)
      const deviceType = detectDeviceType(req, searchParams);
      const ip = getClientIp(req);
      const rangeHeader = String(req.headers.range || '').trim();
      const isInitialGet =
        method === 'GET' && (!rangeHeader || /^bytes=0-/i.test(rangeHeader));

      if (isInitialGet && shouldRecordAnalyticsEvent(ip, `dl:${ip}:${app.id}`)) {
        app.downloads = Number(app.downloads || 0) + 1;
        const bucket = getTodayAnalyticsBucket();
        bucket.downloads += 1;

        recordTelemetryEvent({
          event: 'download',
          appId: app.id,
          appName: `${app.name} (preset)`,
          deviceType,
          ip,
          userAgent: req.headers['user-agent'],
        });
        saveStore(false);
      }

      // Check if an uploaded preset binary exists on disk
      const uploadedName = app.presetFileName;
      if (uploadedName) {
        const possibleUploadPaths = [
          path.join(UPLOADS_DIR, path.basename(uploadedName)),
          path.join(PUBLIC_DIR, path.basename(uploadedName)),
        ];
        const uploadedPath = possibleUploadPaths.find(
          (p) => fs.existsSync(p) && fs.statSync(p).isFile()
        );
        if (uploadedPath) {
          const cType = uploadedName.endsWith('.json')
            ? 'application/json; charset=utf-8'
            : 'application/zip';
          serveFileWithRange(req, res, uploadedPath, {
            'Content-Type': cType,
            'Content-Disposition': `attachment; filename="${path.basename(uploadedName)}"`,
            'Cache-Control': 'no-store',
            'X-KVTV-SHA256': app.sha256 || '',
          });
          return;
        }
      }

      // In-Memory Preset handling when no file is stored in uploads/
      if (app.id === 'kodi-kv') {
        const kodiZip = buildKodiAddonZipBuffer();
        if (kodiZip) {
          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="plugin.video.kvnetflix.zip"',
            'Content-Length': String(kodiZip.length),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store',
            'X-KVTV-In-Memory-Preset': 'kodi-kv',
            ...SECURITY_HEADERS,
          });
          if (method === 'HEAD') {
            res.end();
            return;
          }
          res.end(kodiZip);
          return;
        }
      }
      if (app.id === 'cloudstream-kv') {
        const csPreset = buildCloudStreamPresetBuffer();
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="cloudstream-kv-preset.json"',
          'Content-Length': String(csPreset.length),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
          'X-KVTV-In-Memory-Preset': 'cloudstream-kv',
          ...SECURITY_HEADERS,
        });
        if (method === 'HEAD') {
          res.end();
          return;
        }
        res.end(csPreset);
        return;
      }
      if (app.presetUrl) {
        res.writeHead(302, {
          Location: app.presetUrl,
          'Cache-Control': 'no-store',
          ...SECURITY_HEADERS,
        });
        res.end();
        return;
      }

      // Generate realistic downloadable Preset bundle on the fly
      const manifestData = {
        store: 'KV-TV Store (https://tv.vndns.net)',
        appId: app.id,
        name: app.name,
        edition: app.edition,
        packageName: app.packageName,
        version: app.version,
        shortCode: app.shortCode,
        type: 'preset',
        preConfigured: app.preConfigured,
        presetSummary: app.presetSummary,
        presetFeatures: app.presetFeatures,
        generatedAt: new Date().toISOString(),
        note: 'KV-TV Pre-Set Configuration Backup Archive. Import via App Settings -> Restore Backup.',
      };

      const archiveBuf = buildMinimalZipArchive(
        'kv-preset-config.json',
        Buffer.from(JSON.stringify(manifestData, null, 2), 'utf8')
      );
      const outFileName = `${app.id}-kv-preset-backup.zip`;

      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${outFileName}"`,
        'Content-Length': String(archiveBuf.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
        'X-KVTV-Demo-Package': 'true',
        ...SECURITY_HEADERS,
      });
      if (method === 'HEAD') {
        res.end();
        return;
      }
      res.end(archiveBuf);
      return;
    }

    // 6. GET /api/qr?text=...
    if (method === 'GET' && pathname === '/api/qr') {
      const text = searchParams.get('text') || 'https://tv.vndns.net/tv';
      const width = Math.min(Math.max(Number(searchParams.get('size')) || 240, 80), 800);
      const dark = searchParams.get('dark') || '#0B0F17';
      const light = searchParams.get('light') || '#FFFFFF';
      const svg = generateQrSvg(text, { width, dark, light });

      res.writeHead(200, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(Buffer.byteLength(svg, 'utf8')),
        ...SECURITY_HEADERS,
      });
      res.end(svg);
      return;
    }

    // 7. POST /api/ads/:adId/click
    if (
      method === 'POST' &&
      pathname.startsWith('/api/ads/') &&
      pathname.endsWith('/click')
    ) {
      const ip = getClientIp(req);
      const adRate = checkRateLimit(adClickRateMap, ip, 15, 60 * 1000);
      if (!adRate.allowed) {
        sendJson(
          req,
          res,
          429,
          { ok: false, error: 'Too many ad click requests. Please slow down.' },
          { 'Retry-After': String(adRate.retryAfterSec) }
        );
        return;
      }

      const adId = decodeURIComponent(
        pathname.slice('/api/ads/'.length, -'/click'.length)
      );
      const ad = store.ads.find((a) => a.id === adId);
      if (!ad) {
        sendJson(req, res, 404, { ok: false, error: 'Ad not found' });
        return;
      }
      if (shouldRecordAnalyticsEvent(ip, `adclick:${ip}:${adId}`)) {
        ad.clicks = Number(ad.clicks || 0) + 1;
        saveStore(false);
      }
      sendJson(req, res, 200, { ok: true, ad });
      return;
    }

    // 8. GET /api/admin/demo-hint (Disabled in production for security)
    if (method === 'GET' && pathname === '/api/admin/demo-hint') {
      if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEV_HINTS !== 'true') {
        sendJson(req, res, 404, { ok: false, error: 'Endpoint disabled in production' });
        return;
      }
      const otpAuthUrl = getOtpAuthUrl(
        store.admin.totpSecret,
        `${store.admin.username}@tv.vndns.net`,
        'KV-TV Store'
      );
      const qrSvg = generateQrSvg(otpAuthUrl, { width: 220 });
      sendJson(req, res, 200, {
        ok: true,
        username: store.admin.username,
        totpEnabled: Boolean(store.admin.totpEnabled),
        totpSecret: store.admin.totpSecret,
        currentDemoTotpCode: generateTOTP(store.admin.totpSecret),
        otpAuthUrl,
        qrSvg,
      });
      return;
    }

    // 9. POST /api/admin/login
    if (method === 'POST' && pathname === '/api/admin/login') {
      const ip = getClientIp(req);
      const now = Date.now();
      const attempt = loginAttempts.get(ip);
      if (attempt && now < attempt.resetAt && attempt.count >= 10) {
        sendJson(
          req,
          res,
          429,
          {
            ok: false,
            error: 'Too many login attempts. Please wait 10 minutes.',
          },
          { 'Retry-After': '600' }
        );
        return;
      }

      const body = await readJsonBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const totpCode = body.totpCode !== undefined ? String(body.totpCode).trim() : '';

      const validUser = username === store.admin.username;
      const validPass = verifyPassword(password, store.admin.passwordHash);

      if (!validUser || !validPass) {
        checkRateLimit(loginAttempts, ip, 10, 10 * 60 * 1000);
        sendJson(req, res, 401, {
          ok: false,
          error: 'Invalid username or password',
        });
        return;
      }

      if (store.admin.totpEnabled) {
        if (totpCode) {
          const isValidOtp = verifyTOTP(store.admin.totpSecret, totpCode, 1);
          if (!isValidOtp) {
            checkRateLimit(loginAttempts, ip, 10, 10 * 60 * 1000);
            sendJson(req, res, 401, {
              ok: false,
              requires2fa: true,
              error: 'Invalid 6-digit TOTP 2FA code',
            });
            return;
          }
          loginAttempts.delete(ip);
          const token = createAuthToken(store.admin.username, 'session');
          recordTelemetryEvent({
            event: 'admin_login',
            appId: null,
            appName: 'Admin 2FA Login',
            deviceType: 'desktop',
            ip,
            userAgent: req.headers['user-agent'],
          });
          saveStore(false);
          sendJson(req, res, 200, {
            ok: true,
            token,
            admin: {
              username: store.admin.username,
              totpEnabled: store.admin.totpEnabled,
            },
          });
          return;
        }

        loginAttempts.delete(ip);
        const tempToken = createAuthToken(store.admin.username, 'temp2fa', 5 * 60 * 1000);
        sendJson(req, res, 200, {
          ok: true,
          requires2fa: true,
          tempToken,
        });
        return;
      }

      loginAttempts.delete(ip);
      const token = createAuthToken(store.admin.username, 'session');
      sendJson(req, res, 200, {
        ok: true,
        token,
        admin: {
          username: store.admin.username,
          totpEnabled: false,
        },
      });
      return;
    }

    // 10. POST /api/admin/verify-2fa
    if (method === 'POST' && pathname === '/api/admin/verify-2fa') {
      const ip = getClientIp(req);
      const verifyRate = checkRateLimit(verify2faAttempts, ip, 10, 10 * 60 * 1000);
      if (!verifyRate.allowed) {
        sendJson(
          req,
          res,
          429,
          {
            ok: false,
            error: 'Too many 2FA verification attempts. Please wait 10 minutes.',
          },
          { 'Retry-After': '600' }
        );
        return;
      }

      const body = await readJsonBody(req);
      const tempToken = String(body.tempToken || '').trim();
      const totpCode = String(body.totpCode || body.code || '').trim();

      if (!verifyAuthToken(tempToken, 'temp2fa')) {
        sendJson(req, res, 401, {
          ok: false,
          error: '2FA session expired. Please sign in again.',
        });
        return;
      }

      let tempTokenObj = temp2faTokens.get(tempToken);
      if (!tempTokenObj) {
        tempTokenObj = {
          username: store.admin.username,
          createdAt: Date.now(),
          expiresAt: Date.now() + 5 * 60 * 1000,
          failedAttempts: 0,
        };
        setBoundedSession(temp2faTokens, tempToken, tempTokenObj);
      }

      if (!verifyTOTP(store.admin.totpSecret, totpCode, 1)) {
        tempTokenObj.failedAttempts = (tempTokenObj.failedAttempts || 0) + 1;
        if (tempTokenObj.failedAttempts >= 5) {
          temp2faTokens.delete(tempToken);
          addRevokedToken(tempToken);
          sendJson(req, res, 401, {
            ok: false,
            error: 'Too many failed 2FA attempts. Session invalidated, please sign in again.',
          });
          return;
        }
        sendJson(req, res, 401, {
          ok: false,
          error: 'Invalid 6-digit Authenticator code. Please try again.',
        });
        return;
      }

      temp2faTokens.delete(tempToken);
      addRevokedToken(tempToken);
      verify2faAttempts.delete(ip);
      const token = createAuthToken(store.admin.username, 'session');
      recordTelemetryEvent({
        event: 'admin_login',
        appId: null,
        appName: 'Admin 2FA Verified',
        deviceType: 'desktop',
        ip,
        userAgent: req.headers['user-agent'],
      });
      saveStore(false);

      sendJson(req, res, 200, {
        ok: true,
        token,
        admin: {
          username: store.admin.username,
          totpEnabled: store.admin.totpEnabled,
        },
      });
      return;
    }

    // All remaining /api/admin/* routes require Bearer authentication
    if (pathname.startsWith('/api/admin/')) {
      if (!isAuthenticatedAdmin(req)) {
        sendJson(req, res, 401, {
          ok: false,
          error: 'Unauthorized. Valid Admin Bearer token required.',
        });
        return;
      }

      // 11. GET /api/admin/overview
      if (method === 'GET' && pathname === '/api/admin/overview') {
        const otpAuthUrl = getOtpAuthUrl(
          store.admin.totpSecret,
          `${store.admin.username}@tv.vndns.net`,
          'KV-TV Store'
        );
        const qrSvg = generateQrSvg(otpAuthUrl, { width: 220 });
        const storage = getStorageMetrics();

        const totalDownloads = store.apps.reduce(
          (sum, app) => sum + Number(app.downloads || 0),
          0
        );
        const totalTvViews = (store.analytics?.daily || []).reduce(
          (sum, d) => sum + Number(d.tvViews || 0),
          0
        );
        const totalWebViews = (store.analytics?.daily || []).reduce(
          (sum, d) => sum + Number(d.webViews || 0),
          0
        );
        const totalAdClicks = store.ads.reduce(
          (sum, ad) => sum + Number(ad.clicks || 0),
          0
        );

        sendJson(req, res, 200, {
          ok: true,
          storeInfo: store.storeInfo,
          apps: store.apps.map(decorateAppForPublic),
          ads: store.ads,
          analytics: {
            daily: store.analytics?.daily || [],
            logs: store.analytics?.logs || [],
            totals: {
              downloads: totalDownloads,
              tvViews: totalTvViews,
              webViews: totalWebViews,
              adClicks: totalAdClicks,
            },
          },
          admin: {
            username: store.admin.username,
            totpEnabled: Boolean(store.admin.totpEnabled),
            totpSecret: store.admin.totpSecret,
            otpAuthUrl,
            qrSvg,
            currentTotpCode: generateTOTP(store.admin.totpSecret),
          },
          storage,
        });
        return;
      }

      // 12. POST /api/admin/apps or PUT /api/admin/apps/:appId (Create or update an app)
      if ((method === 'POST' || method === 'PUT') && pathname.startsWith('/api/admin/apps')) {
        const body = await readJsonBody(req);
        const urlAppId = pathname.startsWith('/api/admin/apps/')
          ? decodeURIComponent(pathname.slice('/api/admin/apps/'.length)).trim()
          : '';
        const rawName = String(body.name || '').trim();
        if (!rawName && !urlAppId) {
          sendJson(req, res, 400, { ok: false, error: 'App name is required' });
          return;
        }

        const slugId =
          String(body.id || urlAppId || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-|-$/g, '') ||
          rawName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const existingIdx = store.apps.findIndex((a) => a.id === slugId);
        const existing = existingIdx >= 0 ? store.apps[existingIdx] : null;

        let features = body.presetFeatures;
        if (typeof features === 'string') {
          features = features
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (!Array.isArray(features)) {
          features = existing?.presetFeatures || [
            'Pre-configured for Android TV D-Pad remote',
            'Hardware-accelerated 4K playback profile',
          ];
        }

        // Auto-assign next shortCode if not provided
        let shortCode = String(body.shortCode || (existing ? existing.shortCode : '')).trim();
        if (!shortCode) {
          const maxCode = store.apps.reduce((max, a) => {
            const num = parseInt(a.shortCode, 10);
            return Number.isFinite(num) && num > max ? num : max;
          }, 88100);
          shortCode = String(maxCode + 1);
        }

        const resolvedApkFileName =
          body.apkFileName !== undefined && String(body.apkFileName).trim()
            ? path.basename(String(body.apkFileName).trim())
            : existing?.apkFileName || (slugId === 'kv-netflix' ? 'kv-netflix-tv.apk' : `${slugId}.apk`);

        const resolvedApkUrl =
          body.apkUrl !== undefined && String(body.apkUrl).trim()
            ? String(body.apkUrl).trim()
            : existing?.apkUrl || `https://tv.vndns.net/uploads/${resolvedApkFileName}`;

        const resolvedBackupApkUrl =
          body.backupApkUrl !== undefined && String(body.backupApkUrl).trim()
            ? String(body.backupApkUrl).trim()
            : existing?.backupApkUrl ||
              `https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/${resolvedApkFileName}`;

        const ultraDigit = CODE_TO_ULTRA_SHORT[shortCode];
        const resolvedShortPath =
          body.shortPath !== undefined && String(body.shortPath).trim()
            ? String(body.shortPath).trim()
            : existing?.shortPath || `tv.vndns.net/${shortCode}`;
        const resolvedUltraShortPath =
          body.ultraShortPath !== undefined && String(body.ultraShortPath).trim()
            ? String(body.ultraShortPath).trim()
            : existing?.ultraShortPath ||
              (ultraDigit !== undefined ? `tv.vndns.net/${ultraDigit}` : null);
        const resolvedAftvCode =
          body.aftvCode !== undefined
            ? String(body.aftvCode).trim().replace(/[^0-9a-zA-Z_-]/g, '') || null
            : existing?.aftvCode || null;

        const appRecord = {
          id: slugId,
          name: rawName || existing?.name || slugId,
          edition: String(body.edition || existing?.edition || 'KV-Optimized Edition').trim(),
          edition_vi: String(body.edition_vi || body.edition || existing?.edition_vi || existing?.edition || 'KV-Optimized Edition').trim(),
          edition_en: String(body.edition_en || body.edition || existing?.edition_en || existing?.edition || 'KV-Optimized Edition').trim(),
          packageName: String(
            body.packageName || existing?.packageName || `vn.kvtv.${slugId.replace(/-/g, '')}`
          ).trim(),
          version: String(body.version || existing?.version || '1.0.0-kv').trim(),
          versionCode: Number(body.versionCode || existing?.versionCode || 1),
          size: String(body.size || existing?.size || '25.0 MB').trim(),
          shortCode,
          shortPath: resolvedShortPath,
          ultraShortPath: resolvedUltraShortPath,
          aftvCode: resolvedAftvCode,
          category: String(body.category || existing?.category || 'Media Center').trim(),
          featured:
            body.featured !== undefined
              ? Boolean(body.featured)
              : existing
              ? existing.featured
              : true,
          preConfigured:
            body.preConfigured !== undefined
              ? Boolean(body.preConfigured)
              : existing
              ? existing.preConfigured
              : true,
          presetSummary: String(
            body.presetSummary ||
              body.description ||
              existing?.presetSummary ||
              'Pre-configured KV-TV optimization bundle included.'
          ).trim(),
          presetSummary_vi: String(
            body.presetSummary_vi ||
              body.presetSummary ||
              existing?.presetSummary_vi ||
              existing?.presetSummary ||
              'Pre-configured KV-TV optimization bundle included.'
          ).trim(),
          presetSummary_en: String(
            body.presetSummary_en ||
              body.presetSummary ||
              existing?.presetSummary_en ||
              existing?.presetSummary ||
              'Pre-configured KV-TV optimization bundle included.'
          ).trim(),
          description: String(
            body.description ||
              body.presetSummary ||
              existing?.description ||
              'Pre-configured KV-TV optimization bundle included.'
          ).trim(),
          description_vi: String(
            body.description_vi ||
              body.description ||
              existing?.description_vi ||
              existing?.description ||
              'Pre-configured KV-TV optimization bundle included.'
          ).trim(),
          description_en: String(
            body.description_en ||
              body.description ||
              existing?.description_en ||
              existing?.description ||
              'Pre-configured KV-TV optimization bundle included.'
          ).trim(),
          presetFeatures: features,
          presetFeatures_vi: Array.isArray(body.presetFeatures_vi)
            ? body.presetFeatures_vi
            : existing?.presetFeatures_vi || features,
          presetFeatures_en: Array.isArray(body.presetFeatures_en)
            ? body.presetFeatures_en
            : existing?.presetFeatures_en || features,
          color: String(body.color || existing?.color || '#00A4DC').trim(),
          iconType: String(body.iconType || existing?.iconType || 'custom').trim(),
          downloads:
            body.downloads !== undefined
              ? Number(body.downloads)
              : existing
              ? Number(existing.downloads || 0)
              : 0,
          rating: String(body.rating || existing?.rating || '4.9').trim(),
          minAndroid: String(body.minAndroid || existing?.minAndroid || 'Android TV 7.0+').trim(),
          arch: String(
            body.arch || existing?.arch || 'Universal (arm64-v8a + armeabi-v7a)'
          ).trim(),
          sha256:
            existing?.sha256 ||
            crypto.createHash('sha256').update(`${slugId}-${Date.now()}`).digest('hex'),
          apkFileName: resolvedApkFileName,
          presetFileName:
            body.presetFileName !== undefined
              ? body.presetFileName
              : existing?.presetFileName || null,
          apkUrl: resolvedApkUrl,
          backupApkUrl: resolvedBackupApkUrl,
          presetUrl:
            body.presetUrl !== undefined
              ? String(body.presetUrl).trim() || null
              : existing?.presetUrl || null,
          updatedAt: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          store.apps[existingIdx] = appRecord;
        } else {
          store.apps.push(appRecord);
        }

        saveStore(true);
        sendJson(req, res, 200, {
          ok: true,
          app: decorateAppForPublic(appRecord),
          apps: store.apps.map(decorateAppForPublic),
        });
        return;
      }

      // 13. DELETE /api/admin/apps/:appId
      if (method === 'DELETE' && pathname.startsWith('/api/admin/apps/')) {
        const appId = decodeURIComponent(pathname.slice('/api/admin/apps/'.length)).trim();
        const idx = store.apps.findIndex((a) => a.id === appId);
        if (idx === -1) {
          sendJson(req, res, 404, { ok: false, error: `App "${appId}" not found` });
          return;
        }

        const removed = store.apps[idx];
        for (const fName of [removed.apkFileName, removed.presetFileName]) {
          if (fName) {
            const p = path.join(UPLOADS_DIR, path.basename(fName));
            try {
              if (fs.existsSync(p)) fs.unlinkSync(p);
            } catch {
              // Ignore unlink errors
            }
          }
        }

        store.apps.splice(idx, 1);
        saveStore(true);
        sendJson(req, res, 200, {
          ok: true,
          deletedId: appId,
          apps: store.apps,
        });
        return;
      }

      // 14. POST /api/admin/upload/:appId
      if (method === 'POST' && pathname.startsWith('/api/admin/upload/')) {
        const appId = decodeURIComponent(pathname.slice('/api/admin/upload/'.length)).trim();
        const app = store.apps.find((a) => a.id === appId);
        if (!app) {
          sendJson(req, res, 404, { ok: false, error: `App "${appId}" not found` });
          return;
        }

        const { fileName, uploadType, fileBuffer } = await parseUploadPayload(
          req,
          searchParams
        );
        if (!fileBuffer || fileBuffer.length === 0) {
          sendJson(req, res, 400, { ok: false, error: 'Uploaded file is empty' });
          return;
        }

        const cleanBase = path
          .basename(fileName)
          .replace(/[^a-zA-Z0-9._-]+/g, '-')
          .replace(/^-|-$/g, '');
        const ext =
          path.extname(cleanBase) || (uploadType === 'preset' ? '.zip' : '.apk');
        const safeFileName =
          uploadType === 'apk'
            ? getCanonicalApkFileName(app)
            : `${app.id}-${uploadType}${ext}`;
        const targetPath = path.join(UPLOADS_DIR, safeFileName);

        // Remove previous file if different name
        const oldName = uploadType === 'preset' ? app.presetFileName : app.apkFileName;
        if (oldName && oldName !== safeFileName) {
          const oldPath = path.join(UPLOADS_DIR, path.basename(oldName));
          try {
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch {
            // Ignore
          }
        }

        fs.writeFileSync(targetPath, fileBuffer);
        const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const formattedSize = formatBytes(fileBuffer.length);

        if (uploadType === 'preset') {
          app.presetFileName = safeFileName;
        } else {
          app.apkFileName = safeFileName;
          app.apkUrl = `https://tv.vndns.net/uploads/${safeFileName}`;
          app.size = formattedSize;
          app.sha256 = sha256;
        }
        app.updatedAt = new Date().toISOString();

        saveStore(true);
        sendJson(req, res, 200, {
          ok: true,
          app: decorateAppForPublic(app),
          uploadType,
          fileName: safeFileName,
          bytes: fileBuffer.length,
          size: formattedSize,
          sha256,
          storage: getStorageMetrics(),
        });
        return;
      }

      // 15. POST /api/admin/2fa/toggle
      if (method === 'POST' && pathname === '/api/admin/2fa/toggle') {
        const body = await readJsonBody(req);
        if (body.rotateSecret) {
          store.admin.totpSecret = generateSecret(20);
        }
        if (typeof body.enabled === 'boolean') {
          store.admin.totpEnabled = body.enabled;
        }
        if (typeof body.password === 'string' && body.password.trim().length >= 4) {
          store.admin.passwordHash = hashPassword(body.password.trim());
        }
        store.admin.updatedAt = new Date().toISOString();
        saveStore(true);

        const otpAuthUrl = getOtpAuthUrl(
          store.admin.totpSecret,
          `${store.admin.username}@tv.vndns.net`,
          'KV-TV Store'
        );
        const qrSvg = generateQrSvg(otpAuthUrl, { width: 220 });

        sendJson(req, res, 200, {
          ok: true,
          admin: {
            username: store.admin.username,
            totpEnabled: Boolean(store.admin.totpEnabled),
            totpSecret: store.admin.totpSecret,
            otpAuthUrl,
            qrSvg,
            currentTotpCode: generateTOTP(store.admin.totpSecret),
          },
        });
        return;
      }

      // 16. POST /api/admin/ads (Create or update an ad banner)
      if ((method === 'POST' || method === 'PUT') && pathname.startsWith('/api/admin/ads')) {
        const body = await readJsonBody(req);
        const title = String(body.title || '').trim();
        if (!title) {
          sendJson(req, res, 400, { ok: false, error: 'Ad title is required' });
          return;
        }

        const adId =
          String(body.id || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-') || `ad-${Date.now().toString(36)}`;

        const existingIdx = store.ads.findIndex((a) => a.id === adId);
        const existing = existingIdx >= 0 ? store.ads[existingIdx] : null;

        const adRecord = {
          id: adId,
          title,
          subtitle: String(
            body.subtitle ||
              existing?.subtitle ||
              'High-speed pre-configured Android TV apps on tv.vndns.net.'
          ).trim(),
          badge: String(body.badge || existing?.badge || 'SPONSOR')
            .trim()
            .toUpperCase(),
          ctaText: String(body.ctaText || existing?.ctaText || 'Learn More').trim(),
          ctaUrl: String(body.ctaUrl || existing?.ctaUrl || '/tv').trim(),
          gradient: String(
            body.gradient ||
              existing?.gradient ||
              'linear-gradient(135deg, #00A4DC 0%, #6366F1 100%)'
          ).trim(),
          active:
            body.active !== undefined
              ? Boolean(body.active)
              : existing
              ? existing.active
              : true,
          impressions:
            body.impressions !== undefined
              ? Number(body.impressions)
              : existing
              ? Number(existing.impressions || 0)
              : 0,
          clicks:
            body.clicks !== undefined
              ? Number(body.clicks)
              : existing
              ? Number(existing.clicks || 0)
              : 0,
          createdAt: existing?.createdAt || new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          store.ads[existingIdx] = adRecord;
        } else {
          store.ads.push(adRecord);
        }

        saveStore(true);
        sendJson(req, res, 200, {
          ok: true,
          ad: adRecord,
          ads: store.ads,
        });
        return;
      }

      // 17. DELETE /api/admin/ads/:adId
      if (method === 'DELETE' && pathname.startsWith('/api/admin/ads/')) {
        const adId = decodeURIComponent(pathname.slice('/api/admin/ads/'.length)).trim();
        const idx = store.ads.findIndex((a) => a.id === adId);
        if (idx === -1) {
          sendJson(req, res, 404, { ok: false, error: `Ad "${adId}" not found` });
          return;
        }
        store.ads.splice(idx, 1);
        saveStore(true);
        sendJson(req, res, 200, {
          ok: true,
          deletedId: adId,
          ads: store.ads,
        });
        return;
      }

      sendJson(req, res, 404, { ok: false, error: 'Admin endpoint not found' });
      return;
    }

    // Static routes
    if (method === 'GET' || method === 'HEAD') {
      if (pathname === '/mockup-1' || pathname === '/mockup-1/') {
        serveStaticFile(req, res, PUBLIC_DIR, 'mockup-1.html');
        return;
      }
      if (pathname === '/mockup-2' || pathname === '/mockup-2/') {
        serveStaticFile(req, res, PUBLIC_DIR, 'mockup-2.html');
        return;
      }
      if (pathname === '/mockup-3' || pathname === '/mockup-3/') {
        serveStaticFile(req, res, PUBLIC_DIR, 'mockup-3.html');
        return;
      }
      if (pathname === '/' || pathname === '/tv' || pathname === '/tv/' || pathname === '/web' || pathname === '/web/') {
        const mockupParam = parsedUrl.searchParams.get('mockup');
        if (mockupParam === '1') {
          serveStaticFile(req, res, PUBLIC_DIR, 'mockup-1.html');
          return;
        }
        if (mockupParam === '2') {
          serveStaticFile(req, res, PUBLIC_DIR, 'mockup-2.html');
          return;
        }
        if (mockupParam === '3') {
          serveStaticFile(req, res, PUBLIC_DIR, 'mockup-3.html');
          return;
        }
        serveStaticFile(req, res, PUBLIC_DIR, 'index.html');
        return;
      }
      if (pathname === '/admin' || pathname === '/admin/') {
        serveStaticFile(req, res, PUBLIC_DIR, 'admin.html');
        return;
      }
      if (pathname.startsWith('/uploads/')) {
        const relUpload = decodeURIComponent(pathname.slice('/uploads/'.length));
        const baseUploadName = path.basename(relUpload);
        const matchingApp = store.apps.find(
          (a) =>
            getCanonicalApkFileName(a).toLowerCase() === baseUploadName.toLowerCase() ||
            `${a.id}.apk`.toLowerCase() === baseUploadName.toLowerCase()
        );
        if (matchingApp && baseUploadName.toLowerCase().endsWith('.apk')) {
          handleApkDownload(req, res, matchingApp, searchParams);
          return;
        }
        const localFilePath = path.join(UPLOADS_DIR, baseUploadName);
        if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile() && fs.statSync(localFilePath).size > 0) {
          const extraHeaders = {
            'Cache-Control': 'no-store',
            'X-Download-Source': 'vps-primary',
          };
          if (baseUploadName.toLowerCase().endsWith('.apk')) {
            extraHeaders['Content-Type'] = 'application/vnd.android.package-archive';
            extraHeaders['Content-Disposition'] = `attachment; filename="${baseUploadName}"`;
          }
          serveFileWithRange(req, res, localFilePath, extraHeaders);
          return;
        }
        if (matchingApp) {
          handleApkDownload(req, res, matchingApp, searchParams);
          return;
        }
        serveStaticFile(req, res, UPLOADS_DIR, relUpload);
        return;
      }
      // Serve static assets from public/
      const relAsset = decodeURIComponent(pathname.slice(1));
      serveStaticFile(req, res, PUBLIC_DIR, relAsset);
      return;
    }

    sendJson(req, res, 404, { error: 'Not Found' });
  } catch (err) {
    console.error('[KV-TV Server Error]:', err);
    if (!res.headersSent) {
      sendJson(req, res, 500, {
        ok: false,
        error: err.message || 'Internal Server Error',
      });
    }
  }
});

// Slowloris / slow-header & HTTP server timeout hardening
server.headersTimeout = 15000;
server.requestTimeout = 300000;
server.keepAliveTimeout = 65000;
server.maxHeadersCount = 64;

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(
      `[KV-TV Store] Server running on http://${HOST}:${PORT} (Domain: https://tv.vndns.net)`
    );
  });
}

module.exports = { server };
