#!/usr/bin/env bash
# ==============================================================================
# KV-TV Store — Production Admin 2FA Code & Authenticator Setup
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_DIR}"

node -e "
const qrcode = require('qrcode');
const { generateTOTP } = require('./lib/totp');
const store = require('./data/store.json');
const secret = store.admin.totpSecret;
const code = generateTOTP(secret);
const url = 'otpauth://totp/KV-TV%20Store:admin@tv.vndns.net?secret=' + secret + '&issuer=KV-TV%20Store';

console.log('\n======================================================');
console.log('  KV-TV Store — Production Admin 2FA Authenticator Setup');
console.log('======================================================\n');
console.log('1. CURRENT LIVE 6-DIGIT CODE (Valid for next 30s):');
console.log('   >>>  ' + code + '  <<<\n');
console.log('2. MANUAL SETUP KEY (for Google Authenticator / Authy):');
console.log('   Account Name : admin@tv.vndns.net');
console.log('   Key (Secret) : ' + secret);
console.log('   Type of Key  : Time-based (TOTP)\n');
console.log('3. SCAN QR CODE DIRECTLY WITH YOUR AUTHENTICATOR APP:\n');
qrcode.toString(url, { type: 'terminal', small: true }, (err, str) => {
  if (!err) console.log(str);
});
"
