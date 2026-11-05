'use strict';

const http = require('node:http');
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
const MAX_JSON_BYTES = 50 * 1024 * 1024; // 50 MB max JSON body

// Load or seed persistent store on boot
let store = ensureSeeded(false);

// Active admin sessions & temporary 2FA challenges
const adminSessions = new Map(); // token -> { username, createdAt, expiresAt }
const temp2faTokens = new Map(); // tempToken -> { username, createdAt, expiresAt }
const loginAttempts = new Map(); // ip -> { count, resetAt }

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
 */
function sendJson(req, res, statusCode, payload) {
  const jsonStr = JSON.stringify(payload);
  const acceptEncoding = String(req.headers['accept-encoding'] || '');
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Admin-Token, X-File-Name, X-Upload-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (jsonStr.length > 1024 && acceptEncoding.includes('gzip')) {
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
    .createHmac('sha256', store.admin.passwordHash || 'kvtv-secret')
    .update(payload)
    .digest('hex');
  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');

  if (kind === 'session') {
    adminSessions.set(token, { username, createdAt: now, expiresAt });
  } else {
    temp2faTokens.set(token, { username, createdAt: now, expiresAt });
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

  const map = expectedKind === 'session' ? adminSessions : temp2faTokens;
  const cached = map.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      map.delete(token);
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
      .createHmac('sha256', store.admin.passwordHash || 'kvtv-secret')
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
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
 * Serve static files from `baseDir` safely with directory traversal prevention and gzip.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {string} baseDir
 * @param {string} relativePath
 */
function serveStaticFile(req, res, baseDir, relativePath) {
  const safeRel = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(baseDir, safeRel);

  if (!fullPath.startsWith(baseDir)) {
    sendJson(req, res, 403, { error: 'Forbidden path' });
    return;
  }

  fs.stat(fullPath, (err, stat) => {
    if (err || !stat.isFile()) {
      sendJson(req, res, 404, { error: 'File not found' });
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';
    const cacheControl = isHtml
      ? 'no-cache, must-revalidate'
      : 'public, max-age=3600';

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
    };

    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (
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
    fs.createReadStream(fullPath).pipe(res);
  });
}

/**
 * Main HTTP request router.
 */
const server = http.createServer(async (req, res) => {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Admin-Token, X-File-Name, X-Upload-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      });
      res.end();
      return;
    }

    // 1. Healthcheck endpoint
    if (method === 'GET' && pathname === '/api/health') {
      sendJson(req, res, 200, {
        ok: true,
        status: 'healthy',
        service: 'kv-tv-store',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. GET /api/catalog?device=tv|mobile|desktop
    if (method === 'GET' && pathname === '/api/catalog') {
      const deviceType = detectDeviceType(req, searchParams);
      const skipTrack = searchParams.get('track') === '0';

      if (!skipTrack) {
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
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'],
        });
        saveStore(false);
      }

      sendJson(req, res, 200, {
        storeInfo: store.storeInfo || {
          name: 'KV-TV App Store',
          domain: 'https://tv.vndns.net',
          downloaderCodePrefix: '88',
        },
        apps: store.apps,
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

    // 3. GET /api/code/:shortCode
    if (method === 'GET' && pathname.startsWith('/api/code/')) {
      const code = decodeURIComponent(pathname.slice('/api/code/'.length)).trim();
      const app = store.apps.find(
        (a) =>
          String(a.shortCode).toLowerCase() === code.toLowerCase() ||
          String(a.id).toLowerCase() === code.toLowerCase()
      );
      if (!app) {
        sendJson(req, res, 404, {
          found: false,
          error: `No app found for Downloader code "${code}". Valid codes: 88101–88105.`,
        });
        return;
      }
      sendJson(req, res, 200, {
        found: true,
        app,
        downloadUrl: `/api/download/${app.id}`,
        presetUrl: `/api/download/${app.id}?type=preset`,
      });
      return;
    }

    // 4. GET /go/:shortCode -> 302 redirect to /api/download/:appId
    if (method === 'GET' && pathname.startsWith('/go/')) {
      const code = decodeURIComponent(pathname.slice('/go/'.length)).trim();
      const app = store.apps.find(
        (a) =>
          String(a.shortCode).toLowerCase() === code.toLowerCase() ||
          String(a.id).toLowerCase() === code.toLowerCase()
      );
      if (!app) {
        sendJson(req, res, 404, {
          found: false,
          error: `Short-code "${code}" not found`,
        });
        return;
      }
      res.writeHead(302, {
        Location: `/api/download/${app.id}`,
        'Cache-Control': 'no-store',
      });
      res.end();
      return;
    }

    // 5. GET /api/download/:appId?type=apk|preset
    if (method === 'GET' && pathname.startsWith('/api/download/')) {
      const rawId = decodeURIComponent(pathname.slice('/api/download/'.length)).trim();
      const app = store.apps.find(
        (a) =>
          String(a.id).toLowerCase() === rawId.toLowerCase() ||
          String(a.shortCode).toLowerCase() === rawId.toLowerCase()
      );
      if (!app) {
        sendJson(req, res, 404, { error: `App "${rawId}" not found` });
        return;
      }

      const downloadType = searchParams.get('type') === 'preset' ? 'preset' : 'apk';
      const deviceType = detectDeviceType(req, searchParams);

      app.downloads = Number(app.downloads || 0) + 1;
      const bucket = getTodayAnalyticsBucket();
      bucket.downloads += 1;

      recordTelemetryEvent({
        event: 'download',
        appId: app.id,
        appName: `${app.name} (${downloadType})`,
        deviceType,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
      });
      saveStore(false);

      // Check if an uploaded binary exists on disk
      const uploadedName =
        downloadType === 'preset' ? app.presetFileName : app.apkFileName;
      if (uploadedName) {
        const uploadedPath = path.join(UPLOADS_DIR, path.basename(uploadedName));
        if (fs.existsSync(uploadedPath) && fs.statSync(uploadedPath).isFile()) {
          const stat = fs.statSync(uploadedPath);
          res.writeHead(200, {
            'Content-Type':
              downloadType === 'preset'
                ? 'application/zip'
                : 'application/vnd.android.package-archive',
            'Content-Disposition': `attachment; filename="${path.basename(uploadedName)}"`,
            'Content-Length': String(stat.size),
            'Cache-Control': 'no-store',
            'X-KVTV-SHA256': app.sha256 || '',
          });
          fs.createReadStream(uploadedPath).pipe(res);
          return;
        }
      }

      // Generate realistic downloadable APK / Preset bundle on the fly
      const manifestData = {
        store: 'KV-TV Store (https://tv.vndns.net)',
        appId: app.id,
        name: app.name,
        edition: app.edition,
        packageName: app.packageName,
        version: app.version,
        shortCode: app.shortCode,
        type: downloadType,
        preConfigured: app.preConfigured,
        presetSummary: app.presetSummary,
        presetFeatures: app.presetFeatures,
        generatedAt: new Date().toISOString(),
        note:
          downloadType === 'preset'
            ? 'KV-TV Pre-Set Configuration Backup Archive. Import via App Settings -> Restore Backup.'
            : 'KV-TV Pre-Configured Android TV Package. Upload your production signed APK in /admin to replace this demo package.',
      };

      const innerEntryName =
        downloadType === 'preset'
          ? 'kv-preset-config.json'
          : 'assets/kv-tv-manifest.json';
      const archiveBuf = buildMinimalZipArchive(
        innerEntryName,
        Buffer.from(JSON.stringify(manifestData, null, 2), 'utf8')
      );
      const outFileName =
        downloadType === 'preset'
          ? `${app.id}-kv-preset-backup.zip`
          : `${app.id}-${app.version}.apk`;

      res.writeHead(200, {
        'Content-Type':
          downloadType === 'preset'
            ? 'application/zip'
            : 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="${outFileName}"`,
        'Content-Length': String(archiveBuf.length),
        'Cache-Control': 'no-store',
        'X-KVTV-Demo-Package': 'true',
      });
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
      const adId = decodeURIComponent(
        pathname.slice('/api/ads/'.length, -'/click'.length)
      );
      const ad = store.ads.find((a) => a.id === adId);
      if (!ad) {
        sendJson(req, res, 404, { ok: false, error: 'Ad not found' });
        return;
      }
      ad.clicks = Number(ad.clicks || 0) + 1;
      saveStore(false);
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
      if (attempt && now < attempt.resetAt && attempt.count >= 20) {
        sendJson(req, res, 429, {
          ok: false,
          error: 'Too many login attempts. Please wait a few minutes.',
        });
        return;
      }

      const body = await readJsonBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const totpCode = body.totpCode !== undefined ? String(body.totpCode).trim() : '';

      const validUser = username === store.admin.username;
      const validPass = verifyPassword(password, store.admin.passwordHash);

      if (!validUser || !validPass) {
        const prev = loginAttempts.get(ip) || { count: 0, resetAt: now + 5 * 60000 };
        prev.count += 1;
        loginAttempts.set(ip, prev);
        sendJson(req, res, 401, {
          ok: false,
          error: 'Invalid username or password (default local password: kvtv2026)',
        });
        return;
      }

      loginAttempts.delete(ip);

      if (store.admin.totpEnabled) {
        if (totpCode) {
          const isValidOtp = verifyTOTP(store.admin.totpSecret, totpCode, 1);
          if (!isValidOtp) {
            sendJson(req, res, 401, {
              ok: false,
              requires2fa: true,
              error: 'Invalid 6-digit TOTP 2FA code',
            });
            return;
          }
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

        const tempToken = createAuthToken(store.admin.username, 'temp2fa', 5 * 60 * 1000);
        sendJson(req, res, 200, {
          ok: true,
          requires2fa: true,
          tempToken,
        });
        return;
      }

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

      if (!verifyTOTP(store.admin.totpSecret, totpCode, 1)) {
        sendJson(req, res, 401, {
          ok: false,
          error: 'Invalid 6-digit Authenticator code. Please try again.',
        });
        return;
      }

      temp2faTokens.delete(tempToken);
      const token = createAuthToken(store.admin.username, 'session');
      recordTelemetryEvent({
        event: 'admin_login',
        appId: null,
        appName: 'Admin 2FA Verified',
        deviceType: 'desktop',
        ip: getClientIp(req),
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
          apps: store.apps,
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

      // 12. POST /api/admin/apps (Create or update an app)
      if ((method === 'POST' || method === 'PUT') && pathname.startsWith('/api/admin/apps')) {
        const body = await readJsonBody(req);
        const rawName = String(body.name || '').trim();
        if (!rawName) {
          sendJson(req, res, 400, { ok: false, error: 'App name is required' });
          return;
        }

        const slugId =
          String(body.id || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-|-$/g, '') ||
          rawName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let features = body.presetFeatures;
        if (typeof features === 'string') {
          features = features
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (!Array.isArray(features)) {
          features = [
            'Pre-configured for Android TV D-Pad remote',
            'Hardware-accelerated 4K playback profile',
          ];
        }

        const existingIdx = store.apps.findIndex((a) => a.id === slugId);
        const existing = existingIdx >= 0 ? store.apps[existingIdx] : null;

        // Auto-assign next shortCode if not provided
        let shortCode = String(body.shortCode || (existing ? existing.shortCode : '')).trim();
        if (!shortCode) {
          const maxCode = store.apps.reduce((max, a) => {
            const num = parseInt(a.shortCode, 10);
            return Number.isFinite(num) && num > max ? num : max;
          }, 88100);
          shortCode = String(maxCode + 1);
        }

        const appRecord = {
          id: slugId,
          name: rawName,
          edition: String(body.edition || existing?.edition || 'KV-Optimized Edition').trim(),
          packageName: String(
            body.packageName || existing?.packageName || `vn.kvtv.${slugId.replace(/-/g, '')}`
          ).trim(),
          version: String(body.version || existing?.version || '1.0.0-kv').trim(),
          size: String(body.size || existing?.size || '25.0 MB').trim(),
          shortCode,
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
          description: String(
            body.description ||
              body.presetSummary ||
              existing?.description ||
              'Pre-configured KV-TV optimization bundle included.'
          ).trim(),
          presetFeatures: features,
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
          apkFileName: existing?.apkFileName || null,
          presetFileName: existing?.presetFileName || null,
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
          app: appRecord,
          apps: store.apps,
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
        const safeFileName = `${app.id}-${uploadType}${ext}`;
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
          app.size = formattedSize;
          app.sha256 = sha256;
        }
        app.updatedAt = new Date().toISOString();

        saveStore(true);
        sendJson(req, res, 200, {
          ok: true,
          app,
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
      if (pathname === '/' || pathname === '/tv' || pathname === '/tv/') {
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

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(
      `[KV-TV Store] Server running on http://${HOST}:${PORT} (Domain: https://tv.vndns.net)`
    );
  });
}

module.exports = { server };
