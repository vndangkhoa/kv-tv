'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const INTERFACE_URL = process.env.INTERFACE_URL || 'http://127.0.0.1:3456';
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3457';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function request(baseUrl, pathStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, baseUrl);
    const headers = { ...(options.headers || {}) };
    let bodyBuf = null;
    if (options.body !== undefined && options.body !== null) {
      bodyBuf = Buffer.isBuffer(options.body)
        ? options.body
        : Buffer.from(
            typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
            'utf8'
          );
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      headers['Content-Length'] = String(bodyBuf.length);
    }
    const req = http.request(
      url,
      { method: options.method || 'GET', headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on('error', reject);
    if (bodyBuf) {
      req.write(bodyBuf);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== RUNNING KV-TV SPLIT DOCKER & 1-CLICK VPS + FORGEJO FALLBACK TESTS ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Verify Split Containers Health (Interface :3456 & Backend :3457)
  console.log('1. Checking Split Docker Services (kv-tv-interface :3456 & kv-tv-backend :3457):');
  const uiHealth = await request(INTERFACE_URL, '/healthz');
  assert(uiHealth.statusCode === 200, `Interface /healthz returns 200 (got ${uiHealth.statusCode})`);
  const uiHealthJson = JSON.parse(uiHealth.body.toString('utf8'));
  assert(
    uiHealthJson.service === 'kv-tv-interface',
    `Interface service name is kv-tv-interface (got ${uiHealthJson.service})`
  );

  const backendHealth = await request(BACKEND_URL, '/healthz');
  assert(backendHealth.statusCode === 200, `Backend /healthz returns 200 (got ${backendHealth.statusCode})`);
  const backendHealthJson = JSON.parse(backendHealth.body.toString('utf8'));
  assert(
    backendHealthJson.service === 'kv-tv-backend',
    `Backend service name is kv-tv-backend (got ${backendHealthJson.service})`
  );

  // 2. Verify all 7 APKs in uploads/
  console.log('\n2. Checking Primary VPS APK Files in uploads/:');
  const expectedApks = [
    'kv-store.apk',
    'jellyfin-kv.apk',
    'kodi-kv.apk',
    'cloudstream-kv.apk',
    'kv-netflix-tv.apk',
    'kv-tube.apk',
    'smarttube-tv.apk',
  ];
  for (const apk of expectedApks) {
    const p = path.join(UPLOADS_DIR, apk);
    const exists = fs.existsSync(p) && fs.statSync(p).size > 100000;
    assert(exists, `uploads/${apk} exists and is > 100KB`);
  }

  // 3. Test 1-Click Primary VPS Download & HTTP Range via Interface Proxy (:3456)
  console.log('\n3. Testing 1-Click Primary VPS APK Download & Range Support via :3456:');
  const headStore = await request(INTERFACE_URL, '/kv-store.apk?source=vps', { method: 'HEAD' });
  assert(headStore.statusCode === 200, `HEAD /kv-store.apk?source=vps is 200 (got ${headStore.statusCode})`);
  assert(
    headStore.headers['x-download-source'] === 'vps-primary',
    `X-Download-Source is vps-primary (got ${headStore.headers['x-download-source']})`
  );
  assert(
    headStore.headers['content-type'] === 'application/vnd.android.package-archive',
    'Content-Type is application/vnd.android.package-archive'
  );
  assert(
    headStore.headers['content-disposition']?.includes('attachment; filename="kv-store.apk"'),
    `Content-Disposition is attachment (${headStore.headers['content-disposition']})`
  );

  const rangeRes = await request(INTERFACE_URL, '/api/download/kodi-kv?type=apk&source=vps', {
    headers: { Range: 'bytes=0-15' },
  });
  assert(
    rangeRes.statusCode === 206,
    `Range GET /api/download/kodi-kv returns 206 Partial Content (got ${rangeRes.statusCode})`
  );
  assert(
    rangeRes.body.length === 16 && rangeRes.body.subarray(0, 2).toString('utf8') === 'PK',
    'First 2 bytes of streamed kodi-kv.apk are PK (valid ZIP/APK header)'
  );

  // 4. Test Short-Code API & Direct 5-Digit Code Download (/go/88105 & /api/code/88105)
  console.log('\n4. Testing Short-Code Lookup & Forgejo Backup Metadata:');
  const codeTube = await request(INTERFACE_URL, '/api/code/88105');
  assert(codeTube.statusCode === 200, 'GET /api/code/88105 returns 200');
  const dataTube = JSON.parse(codeTube.body.toString('utf8'));
  assert(dataTube.app?.packageName === 'com.kvtube.tv', 'KV-Tube packageName is com.kvtube.tv');
  assert(
    dataTube.app?.hasPrimaryVpsFile === true,
    'KV-Tube hasPrimaryVpsFile is true'
  );
  assert(
    dataTube.app?.backupApkUrl?.includes('git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-tube.apk'),
    `KV-Tube backupApkUrl points to Forgejo release (${dataTube.app?.backupApkUrl})`
  );

  // 4b. Test Direct Short-Code Routes (/88000–/88103, /0–/3, and AFTVnews /2179554, /5798721, /3939162, /1037083)
  console.log('\n4b. Testing AFTVnews Downloader Codes & Ultra-Short Routes:');
  const aftvCases = [
    { aftv: '2179554', code: '88000', ultra: '0', file: 'kv-store.apk' },
    { aftv: '5798721', code: '88101', ultra: '1', file: 'jellyfin-kv.apk' },
    { aftv: '3939162', code: '88102', ultra: '2', file: 'kodi-kv.apk' },
    { aftv: '1037083', code: '88103', ultra: '3', file: 'cloudstream-kv.apk' },
    { aftv: '4523598', code: '88104', ultra: '4', file: 'kv-netflix-tv.apk' },
    { aftv: '3001533', code: '88105', ultra: '5', file: 'kv-tube.apk' },
    { aftv: '6908499', code: '88106', ultra: '6', file: 'smarttube-tv.apk' },
  ];
  for (const tc of aftvCases) {
    const resCode = await request(INTERFACE_URL, `/${tc.code}`, { method: 'HEAD' });
    assert(
      resCode.statusCode === 200 && resCode.headers['content-disposition']?.includes(tc.file),
      `HEAD /${tc.code} serves ${tc.file} (status ${resCode.statusCode})`
    );
    const resAftv = await request(INTERFACE_URL, `/${tc.aftv}`, { method: 'HEAD' });
    assert(
      resAftv.statusCode === 200 && resAftv.headers['content-disposition']?.includes(tc.file),
      `HEAD /${tc.aftv} (AFTVnews code) serves ${tc.file} (status ${resAftv.statusCode})`
    );
    const resApiAftv = await request(INTERFACE_URL, `/api/code/${tc.aftv}`);
    const jsonApiAftv = JSON.parse(resApiAftv.body.toString('utf8'));
    assert(
      resApiAftv.statusCode === 200 && jsonApiAftv.app?.aftvCode === tc.aftv,
      `GET /api/code/${tc.aftv} resolves app with aftvCode=${tc.aftv}`
    );
  }

  // 5. Test Forgejo Backup Fallback Endpoint (?source=backup)
  console.log('\n5. Testing Automatic Fallback Endpoint (/api/download/kv-store?type=apk&source=backup):');
  const backupRes = await request(INTERFACE_URL, '/api/download/kv-store?type=apk&source=backup', {
    method: 'HEAD',
  });
  assert(
    backupRes.statusCode === 200 || backupRes.statusCode === 302,
    `HEAD /api/download/kv-store?source=backup returns 200 or 302 (got ${backupRes.statusCode}, source=${backupRes.headers['x-download-source']})`
  );

  // 6. Test Admin Page Reverse-Proxy & Direct Backend Access
  console.log('\n6. Testing Admin Console via Interface (:3456/admin) and Backend (:3457/admin):');
  const adminViaUi = await request(INTERFACE_URL, '/admin');
  assert(adminViaUi.statusCode === 200, 'GET :3456/admin returns 200');
  const adminViaBackend = await request(BACKEND_URL, '/admin');
  assert(adminViaBackend.statusCode === 200, 'GET :3457/admin returns 200');

  // 6b. Test App Updates API (/api/version & GET/POST /api/updates/check)
  console.log('\n6b. Testing Updates Center API (/api/version & /api/updates/check):');
  const versionRes = await request(INTERFACE_URL, '/api/version');
  assert(versionRes.statusCode === 200, 'GET /api/version returns 200');
  const versionJson = JSON.parse(versionRes.body.toString('utf8'));
  assert(
    versionJson.ok === true && versionJson.storeVersion === '1.1.0' && versionJson.storeVersionCode === 2,
    `Store version is 1.1.0 (#2) (got ${versionJson.storeVersion} #${versionJson.storeVersionCode})`
  );

  const updatesGetRes = await request(INTERFACE_URL, '/api/updates/check?storeVersionCode=1');
  assert(updatesGetRes.statusCode === 200, 'GET /api/updates/check?storeVersionCode=1 returns 200');
  const updatesGetJson = JSON.parse(updatesGetRes.body.toString('utf8'));
  assert(
    updatesGetJson.selfUpdate?.updateAvailable === true,
    'Self-update flagged true when storeVersionCode=1 < 2'
  );

  const updatesPostRes = await request(INTERFACE_URL, '/api/updates/check', {
    method: 'POST',
    body: {
      storeVersionCode: 1,
      storeVersionName: '1.0.0',
      apps: [
        { packageName: 'com.kvtube.tv', versionCode: 8, versionName: '1.1.5-tv' },
        { packageName: 'com.streamflow.tv', versionCode: 117, versionName: '1.4.6-kv', isDebuggable: true },
        {
          packageName: 'org.smarttube.stable',
          versionCode: 2458,
          versionName: '32.68s',
          signingCertSha256: 'e89668e5f473a3193e7d624d2d1679985ec8e612bce1bf969661634fd33e218b',
        },
        { packageName: 'org.jellyfin.androidtv', versionCode: 191099, versionName: '0.19.10' },
      ],
    },
  });
  assert(updatesPostRes.statusCode === 200, 'POST /api/updates/check returns 200');
  const updatesPostJson = JSON.parse(updatesPostRes.body.toString('utf8'));
  const availIds = (updatesPostJson.updatesAvailable || []).map((a) => a.id);
  const stEntry = (updatesPostJson.updatesAvailable || []).find((a) => a.id === 'smarttube-tv');
  const nfEntry = (updatesPostJson.updatesAvailable || []).find((a) => a.id === 'kv-netflix');
  assert(
    updatesPostJson.selfUpdate?.updateAvailable === true &&
      availIds.includes('kv-tube') &&
      Boolean(nfEntry?.debuggableUpgrade) &&
      Boolean(stEntry?.signatureMismatch) &&
      updatesPostJson.totalUpdates === 4,
    `Updates matrix flags self-update + kv-tube + kv-netflix (debuggable) + smarttube-tv (signatureMismatch) (total=${updatesPostJson.totalUpdates})`
  );

  // 7. Frontend Integration verification (Astryx built bundle + fallback)
  console.log('\n7. Verifying Astryx Built Storefront & Assets via Interface (:3456):');
  const uiHtmlRes = await request(INTERFACE_URL, '/');
  const uiHtmlText = uiHtmlRes.body.toString('utf8');
  assert(
    uiHtmlRes.statusCode === 200 && /\/assets\/index-[^"']+\.js/i.test(uiHtmlText),
    'GET / serves Vite-built Astryx bundle (index-*.js)'
  );
  const assetMatch = uiHtmlText.match(/(\/assets\/index-[^"']+\.js)/i);
  if (assetMatch) {
    const assetRes = await request(INTERFACE_URL, assetMatch[1]);
    assert(
      assetRes.statusCode === 200 &&
        String(assetRes.headers['cache-control'] || '').includes('immutable'),
      `GET ${assetMatch[1]} returns 200 with immutable Cache-Control (${assetRes.headers['cache-control']})`
    );
  }
  assert(
    fs.existsSync(path.join(__dirname, '..', 'frontend', 'dist', 'index.html')),
    'frontend/dist/index.html built on disk'
  );

  // 8. Production Security & Anti-Abuse Hardening Tests
  console.log('\n8. Production Security & Anti-Abuse Hardening Tests:');
  const uiRootRes = await request(INTERFACE_URL, '/');
  assert(
    uiRootRes.headers['x-content-type-options'] === 'nosniff',
    `Interface / includes X-Content-Type-Options: nosniff (got ${uiRootRes.headers['x-content-type-options']})`
  );
  assert(
    uiRootRes.headers['x-frame-options'] === 'SAMEORIGIN',
    `Interface / includes X-Frame-Options: SAMEORIGIN (got ${uiRootRes.headers['x-frame-options']})`
  );
  assert(
    Boolean(uiRootRes.headers['strict-transport-security']),
    `Interface / includes Strict-Transport-Security (${uiRootRes.headers['strict-transport-security']})`
  );
  assert(
    Boolean(uiRootRes.headers['content-security-policy']),
    'Interface / includes Content-Security-Policy'
  );

  const backendCatRes = await request(BACKEND_URL, '/api/catalog?track=0');
  assert(
    backendCatRes.headers['x-content-type-options'] === 'nosniff',
    `Backend /api/catalog?track=0 includes X-Content-Type-Options: nosniff (got ${backendCatRes.headers['x-content-type-options']})`
  );
  assert(
    backendCatRes.headers['x-frame-options'] === 'SAMEORIGIN',
    `Backend /api/catalog?track=0 includes X-Frame-Options: SAMEORIGIN (got ${backendCatRes.headers['x-frame-options']})`
  );
  assert(
    Boolean(backendCatRes.headers['strict-transport-security']),
    `Backend /api/catalog?track=0 includes Strict-Transport-Security (${backendCatRes.headers['strict-transport-security']})`
  );
  assert(
    Boolean(backendCatRes.headers['content-security-policy']),
    'Backend /api/catalog?track=0 includes Content-Security-Policy'
  );

  const envProbeRes = await request(INTERFACE_URL, '/.env');
  assert(
    envProbeRes.statusCode === 403,
    `GET /.env on Interface returns 403 (got ${envProbeRes.statusCode})`
  );
  const gitProbeRes = await request(INTERFACE_URL, '/.git/config');
  assert(
    gitProbeRes.statusCode === 403,
    `GET /.git/config on Interface returns 403 (got ${gitProbeRes.statusCode})`
  );

  const sha256Header = String(headStore.headers['x-kvtv-sha256'] || '').trim();
  assert(
    /^[a-f0-9]{64}$/i.test(sha256Header),
    `HEAD /kv-store.apk?source=vps returns 64-char hex X-KVTV-SHA256 (${sha256Header})`
  );

  const invalid2faRes = await request(BACKEND_URL, '/api/admin/verify-2fa', {
    method: 'POST',
    headers: { 'X-Forwarded-For': '198.51.100.201' },
    body: { tempToken: 'invalid-forged-temp-token', totpCode: '000000' },
  });
  assert(
    invalid2faRes.statusCode === 401,
    `POST /api/admin/verify-2fa rejects invalid tempToken with 401 (got ${invalid2faRes.statusCode})`
  );

  let bruteForceBlocked = false;
  for (let i = 0; i < 22; i++) {
    const attemptRes = await request(BACKEND_URL, '/api/admin/verify-2fa', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.202' },
      body: { tempToken: 'brute-force-temp-token', totpCode: String(100000 + i) },
    });
    if (attemptRes.statusCode === 429 || attemptRes.statusCode === 401) {
      bruteForceBlocked = true;
      if (attemptRes.statusCode === 429) break;
    }
  }
  assert(
    bruteForceBlocked,
    'POST /api/admin/verify-2fa enforces token rejection (401) or brute-force rate limiting (429)'
  );

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
