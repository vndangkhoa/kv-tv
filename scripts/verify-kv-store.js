'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const BASE_URL = 'http://127.0.0.1:3456';
const PUBLIC_APK = path.join(__dirname, '..', 'public', 'kv-store.apk');
const UPLOADS_APK = path.join(__dirname, '..', 'uploads', 'kv-store.apk');

function request(pathStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
    const req = http.request(url, { method: options.method || 'GET', headers: options.headers || {} }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== RUNNING KV-STORE TV APP & WEB INTEGRATION TESTS ===\n');
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

  // 1. Files on disk
  console.log('1. Checking APK files on disk:');
  assert(fs.existsSync(PUBLIC_APK), 'public/kv-store.apk exists');
  assert(fs.existsSync(UPLOADS_APK), 'uploads/kv-store.apk exists');
  const apkStat = fs.statSync(PUBLIC_APK);
  assert(apkStat.size > 2 * 1024 * 1024, `APK size is realistic: ${(apkStat.size / (1024 * 1024)).toFixed(2)} MB`);

  // 2. Direct download endpoint /kv-store.apk
  console.log('\n2. Testing GET /kv-store.apk:');
  const res1 = await request('/kv-store.apk');
  assert(res1.statusCode === 200, `Status code is 200 (got ${res1.statusCode})`);
  assert(res1.headers['content-type'] === 'application/vnd.android.package-archive', `Content-Type is APK (${res1.headers['content-type']})`);
  assert(res1.headers['content-disposition']?.includes('attachment; filename="kv-store.apk"'), `Content-Disposition has kv-store.apk`);
  assert(Number(res1.headers['content-length']) === apkStat.size, `Content-Length matches disk size (${res1.headers['content-length']})`);
  assert(res1.body.length === apkStat.size, `Body bytes match disk size (${res1.body.length})`);

  // 3. API download endpoint /api/download/kv-store
  console.log('\n3. Testing GET /api/download/kv-store:');
  const res2 = await request('/api/download/kv-store');
  assert(res2.statusCode === 200, `Status code is 200 (got ${res2.statusCode})`);
  assert(res2.headers['content-type'] === 'application/vnd.android.package-archive', `Content-Type is APK`);
  assert(Number(res2.headers['content-length']) === apkStat.size, `Content-Length matches disk size`);

  // 4. Downloader short-code API /api/code/88000
  console.log('\n4. Testing GET /api/code/88000:');
  const res3 = await request('/api/code/88000');
  assert(res3.statusCode === 200, `Status code is 200`);
  const data3 = JSON.parse(res3.body.toString('utf8'));
  assert(data3.found === true, `App found via 88000`);
  assert(data3.app?.id === 'kv-store', `App ID is kv-store`);
  assert(data3.app?.shortCode === '88000', `Short-code is 88000`);
  assert(data3.app?.packageName === 'net.vndns.tv.store', `Package name is net.vndns.tv.store`);
  assert(data3.downloadUrl === '/kv-store.apk', `Download URL is /kv-store.apk`);

  // 5. Downloader short-code redirects /go/88000 and /88000
  console.log('\n5. Testing 302 redirects for Downloader:');
  const res4 = await request('/go/88000');
  assert(res4.statusCode === 302, `GET /go/88000 returns 302`);
  assert(res4.headers['location'] === '/kv-store.apk', `GET /go/88000 Location is /kv-store.apk`);

  const res5 = await request('/88000');
  assert(res5.statusCode === 302, `GET /88000 returns 302`);
  assert(res5.headers['location'] === '/kv-store.apk', `GET /88000 Location is /kv-store.apk`);

  // 6. Native Android APK Inspection
  console.log('\n6. Inspecting compiled Android APK:');
  try {
    const aaptOutput = execSync(
      `/home/khoavo/Android/Sdk/build-tools/34.0.0/aapt dump badging "${PUBLIC_APK}"`,
      { encoding: 'utf8' }
    );
    assert(aaptOutput.includes("package: name='net.vndns.tv.store'"), 'Package name is net.vndns.tv.store');
    assert(aaptOutput.includes("android.permission.INTERNET"), 'Permission INTERNET present');
    assert(aaptOutput.includes("android.permission.REQUEST_INSTALL_PACKAGES"), 'Permission REQUEST_INSTALL_PACKAGES present');
    assert(aaptOutput.includes("android.permission.REQUEST_DELETE_PACKAGES"), 'Permission REQUEST_DELETE_PACKAGES present');
    assert(aaptOutput.includes("android.permission.QUERY_ALL_PACKAGES"), 'Permission QUERY_ALL_PACKAGES present');
    assert(aaptOutput.includes("leanback-launchable-activity: name='net.vndns.tv.store.MainActivity'"), 'Leanback launcher intent configured');
    assert(aaptOutput.includes("banner="), 'TV Banner configured');
    assert(aaptOutput.includes("landscape"), 'Landscape orientation configured');
  } catch (err) {
    assert(false, `aapt verification failed: ${err.message}`);
  }

  // 7. Frontend Integration verification
  console.log('\n7. Verifying Frontend assets:');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  assert(indexHtml.includes('id="kv-store-app-promo"'), 'index.html has #kv-store-app-promo banner');
  assert(indexHtml.includes('88000'), 'index.html displays shortcode 88000');
  assert(indexHtml.includes('id="metro-guide-dialog"'), 'index.html includes #metro-guide-dialog (88000 guide modal)');
  assert(indexHtml.includes('id="metro-dialog-uninstall-btn"'), 'index.html includes #metro-dialog-uninstall-btn for TV uninstall');

  const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
  assert(appJs.includes('window.KVTVBridge'), 'app.js checks window.KVTVBridge');
  assert(appJs.includes('scanCatalogStatuses'), 'app.js calls scanCatalogStatuses');
  assert(appJs.includes('installApp'), 'app.js calls installApp');
  assert(appJs.includes('launchApp'), 'app.js calls launchApp');
  assert(appJs.includes('uninstallApp'), 'app.js calls uninstallApp');

  const themeCss = fs.readFileSync(path.join(__dirname, '..', 'public', 'kv-tv-theme.css'), 'utf8');
  assert(themeCss.includes('.kv-app-banner'), 'kv-tv-theme.css includes .kv-app-banner styling');
  assert(themeCss.includes('.kv-app-status-badge'), 'kv-tv-theme.css includes .kv-app-status-badge styling');
  assert(themeCss.includes('body.is-tv-app .kv-app-banner'), 'kv-tv-theme.css hides banner when inside native TV app');

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
