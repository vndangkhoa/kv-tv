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
    const req = http.request(
      url,
      { method: options.method || 'GET', headers: options.headers || {} },
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

  // 7. Frontend Integration verification
  console.log('\n7. Verifying Frontend 1-Click Installer & Fallback UI:');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  assert(
    indexHtml.includes('id="metro-dialog-backup-btn"'),
    'index.html includes #metro-dialog-backup-btn (Forgejo Backup Mirror button)'
  );
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
  assert(
    appJs.includes('triggerOneClickApkDownload'),
    'app.js implements triggerOneClickApkDownload with auto-fallback'
  );
  assert(
    appJs.includes('installAppWithFallback'),
    'app.js integrates window.KVTVBridge.installAppWithFallback'
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
