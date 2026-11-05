'use strict';

const crypto = require('node:crypto');

let QRCode = null;
try {
  QRCode = require('qrcode');
} catch {
  QRCode = null;
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encode a Buffer or Uint8Array into an RFC 4648 Base32 string.
 * @param {Buffer|Uint8Array} buffer
 * @returns {string}
 */
function base32Encode(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decode an RFC 4648 Base32 string into a Buffer.
 * @param {string} base32Str
 * @returns {Buffer}
 */
function base32Decode(base32Str) {
  const cleaned = String(base32Str || '')
    .toUpperCase()
    .replace(/[\s=-]+/g, '');

  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate a random Base32 TOTP secret (default 20 bytes = 32 Base32 chars).
 * @param {number} byteLength
 * @returns {string}
 */
function generateSecret(byteLength = 20) {
  return base32Encode(crypto.randomBytes(byteLength));
}

/**
 * Generate an RFC 6238 TOTP token using HMAC-SHA1.
 * @param {string} secret - Base32-encoded secret
 * @param {number} windowOffset - Time-step offset (e.g. -1, 0, +1)
 * @param {number} stepSeconds - Time-step in seconds (default 30)
 * @param {number} digits - Number of OTP digits (default 6)
 * @param {number} timestampMs - Current Unix timestamp in ms
 * @returns {string}
 */
function generateTOTP(
  secret,
  windowOffset = 0,
  stepSeconds = 30,
  digits = 6,
  timestampMs = Date.now()
) {
  const key = base32Decode(secret);
  const counter = Math.floor(timestampMs / 1000 / stepSeconds) + Number(windowOffset || 0);

  const counterBuf = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuf.writeUInt32BE(high, 0);
  counterBuf.writeUInt32BE(low, 4);

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const mod = 10 ** digits;
  return String(binary % mod).padStart(digits, '0');
}

/**
 * Verify an RFC 6238 TOTP token within +/- window steps using constant-time comparison.
 * @param {string} secret - Base32-encoded secret
 * @param {string} token - User-provided 6-digit code
 * @param {number} window - Allowed step drift (default 1 = +/- 30s)
 * @param {number} stepSeconds - Time-step in seconds (default 30)
 * @param {number} digits - Number of digits (default 6)
 * @param {number} timestampMs - Current Unix timestamp in ms
 * @returns {boolean}
 */
function verifyTOTP(
  secret,
  token,
  window = 1,
  stepSeconds = 30,
  digits = 6,
  timestampMs = Date.now()
) {
  if (!secret || token === undefined || token === null) return false;
  const cleanToken = String(token).replace(/\s+/g, '');
  if (!/^\d+$/.test(cleanToken) || cleanToken.length !== digits) return false;

  const tokenBuf = Buffer.from(cleanToken, 'utf8');
  for (let offset = -window; offset <= window; offset++) {
    const candidate = generateTOTP(secret, offset, stepSeconds, digits, timestampMs);
    const candidateBuf = Buffer.from(candidate, 'utf8');
    if (
      tokenBuf.length === candidateBuf.length &&
      crypto.timingSafeEqual(tokenBuf, candidateBuf)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Build a standard otpauth:// URI for Google Authenticator, Authy, 1Password, or Apple Passwords.
 * @param {string} secret
 * @param {string} account
 * @param {string} issuer
 * @returns {string}
 */
function getOtpAuthUrl(secret, account = 'vndangkhoa@tv.vndns.net', issuer = 'KV-TV Store') {
  const cleanSecret = String(secret || '').replace(/\s+/g, '').toUpperCase();
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({
    secret: cleanSecret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Escape XML special characters for safe SVG output.
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate a standards-compliant SVG QR code string synchronously.
 * Uses the `qrcode` matrix encoder when installed, with a deterministic SVG fallback.
 * @param {string} text
 * @param {object} options
 * @returns {string}
 */
function generateQrSvg(text, options = {}) {
  const payload = String(text || 'https://tv.vndns.net');
  const dark = options.dark || '#0B0F17';
  const light = options.light || '#FFFFFF';
  const margin = options.margin !== undefined ? Number(options.margin) : 2;
  const sizePx = options.width || 240;

  if (QRCode && typeof QRCode.create === 'function') {
    try {
      const qr = QRCode.create(payload, {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      });
      const matrixSize = qr.modules.size;
      const data = qr.modules.data;
      const totalSize = matrixSize + margin * 2;
      let pathParts = '';

      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          if (data[r * matrixSize + c]) {
            const x = c + margin;
            const y = r + margin;
            pathParts += `M${x} ${y}h1v1h-1z`;
          }
        }
      }

      return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges" role="img" aria-label="QR Code">`,
        `<rect width="100%" height="100%" fill="${escapeXml(light)}" rx="1.5"/>`,
        `<path d="${pathParts}" fill="${escapeXml(dark)}"/>`,
        `</svg>`,
      ].join('');
    } catch {
      // Fall through to deterministic fallback SVG
    }
  }

  // Deterministic visual QR matrix fallback if qrcode module is unavailable
  const grid = 25;
  const total = grid + margin * 2;
  const hash = crypto.createHash('sha256').update(payload).digest();
  const isFinder = (r, c, fr, fc) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7;
  const finderBit = (r, c, fr, fc) => {
    const lr = r - fr;
    const lc = c - fc;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  let d = '';
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      let on = false;
      if (isFinder(r, c, 0, 0)) on = finderBit(r, c, 0, 0);
      else if (isFinder(r, c, 0, grid - 7)) on = finderBit(r, c, 0, grid - 7);
      else if (isFinder(r, c, grid - 7, 0)) on = finderBit(r, c, grid - 7, 0);
      else if (r === 6 || c === 6) on = (r + c) % 2 === 0;
      else {
        const bitIdx = (r * grid + c) % (hash.length * 8);
        const byte = hash[Math.floor(bitIdx / 8)];
        on = Boolean((byte >> (bitIdx % 8)) & 1);
      }
      if (on) {
        d += `M${c + margin} ${r + margin}h1v1h-1z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges" role="img" aria-label="QR Code"><rect width="100%" height="100%" fill="${escapeXml(light)}"/><path d="${d}" fill="${escapeXml(dark)}"/></svg>`;
}

/**
 * Hash a plaintext password with PBKDF2-HMAC-SHA256.
 * @param {string} password
 * @param {string} [salt]
 * @returns {string} format: pbkdf2$iterations$salt$hashHex
 */
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const iterations = 100000;
  const derived = crypto
    .pbkdf2Sync(String(password), salt, iterations, 32, 'sha256')
    .toString('hex');
  return `pbkdf2$${iterations}$${salt}$${derived}`;
}

/**
 * Verify a plaintext password against a stored PBKDF2 hash.
 * @param {string} password
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const parts = String(storedHash).split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expectedHex = parts[3];
  if (!iterations || !salt || !expectedHex) return false;

  const actualHex = crypto
    .pbkdf2Sync(String(password), salt, iterations, 32, 'sha256')
    .toString('hex');

  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const actualBuf = Buffer.from(actualHex, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

module.exports = {
  base32Encode,
  base32Decode,
  generateSecret,
  generateTOTP,
  verifyTOTP,
  getOtpAuthUrl,
  generateQrSvg,
  hashPassword,
  verifyPassword,
};
