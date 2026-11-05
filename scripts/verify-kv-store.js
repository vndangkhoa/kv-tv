'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = 'http://127.0.0.1:3456';
const PUBLIC_APK = path.join(__dirname, '..', 'public', 'kv-store.apk');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function request(pathStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
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
  console.log('=== RUNNING KV-STORE TV APP & LINK-ONLY BACKEND INTEGRATION TESTS ===\n');
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

  // 1. Verify 100% Link-Only Mode on disk (zero binaries in uploads/ or public/)
  console.log('1. Checking 100% Link-Only Mode (zero local APK/ZIP files on disk):');
  assert(!fs.existsSync(PUBLIC_APK), 'public/kv-store.apk does not exist on disk');
  const uploadEntries = fs.existsSync(UPLOADS_DIR)
    ? fs.readdirSync(UPLOADS_DIR).filter((n) => !n.startsWith('.'))
    : [];
  assert(
    uploadEntries.length === 0,
    `uploads/ contains 0 binary files (found: ${uploadEntries.length})`
  );

  // 2. Direct download endpoint /kv-store.apk -> 302 redirect to external URL
  console.log('\n2. Testing GET /kv-store.apk (Link-Only 302 redirect):');
  const res1 = await request('/kv-store.apk');
  assert(res1.statusCode === 302, `Status code is 302 (got ${res1.statusCode})`);
  assert(
    res1.headers['location']?.startsWith('https://'),
    `Location redirects to external HTTPS URL (${res1.headers['location']})`
  );

  // 3. API download endpoint /api/download/kv-store -> 302 redirect
  console.log('\n3. Testing GET /api/download/kv-store (Link-Only 302 redirect):');
  const res2 = await request('/api/download/kv-store');
  assert(res2.statusCode === 302, `Status code is 302 (got ${res2.statusCode})`);
  assert(
    res2.headers['location']?.startsWith('https://'),
    `Location redirects to external HTTPS URL (${res2.headers['location']})`
  );

  // 4. Downloader short-code API /api/code/88000 & /api/code/88106 (SmartTube TV)
  console.log('\n4. Testing GET /api/code/88000 and GET /api/code/88106 (SmartTube TV):');
  const res3 = await request('/api/code/88000');
  assert(res3.statusCode === 200, 'GET /api/code/88000 status is 200');
  const data3 = JSON.parse(res3.body.toString('utf8'));
  assert(data3.found === true, 'App found via 88000');
  assert(data3.app?.id === 'kv-store', 'App ID is kv-store');
  assert(data3.linkOnly === true, 'linkOnly is true for kv-store');
  assert(Boolean(data3.apkUrl), `apkUrl is present (${data3.apkUrl})`);

  const resSmart = await request('/api/code/88106');
  assert(resSmart.statusCode === 200, 'GET /api/code/88106 status is 200');
  const dataSmart = JSON.parse(resSmart.body.toString('utf8'));
  assert(dataSmart.found === true, 'SmartTube TV found via 88106');
  assert(dataSmart.app?.id === 'smarttube-tv', 'App ID is smarttube-tv');
  assert(
    dataSmart.app?.packageName === 'org.smarttube.stable',
    'SmartTube TV packageName is org.smarttube.stable'
  );
  assert(dataSmart.linkOnly === true, 'SmartTube TV is linkOnly');
  assert(
    dataSmart.apkUrl?.includes('/releases/download/v1.0.0/smarttube-tv.apk'),
    'SmartTube TV apkUrl points to pre-configured Forgejo release APK'
  );

  const resTube = await request('/api/code/88105');
  assert(resTube.statusCode === 200, 'GET /api/code/88105 status is 200');
  const dataTube = JSON.parse(resTube.body.toString('utf8'));
  assert(dataTube.found === true, 'KV-Tube found via 88105');
  assert(dataTube.app?.id === 'kv-tube', 'App ID is kv-tube');
  assert(
    dataTube.app?.packageName === 'com.kvtube.tv',
    'KV-Tube packageName is com.kvtube.tv (distinct from SmartTube)'
  );
  assert(
    dataTube.apkUrl?.includes('/releases/download/v1.0.0/kv-tube.apk'),
    'KV-Tube apkUrl points to pre-configured Forgejo release APK'
  );

  // 5. Downloader short-code redirects /go/88000, /go/88106, and /api/download/smarttube-tv
  console.log('\n5. Testing 302 redirects for Downloader & SmartTube TV:');
  const res4 = await request('/go/88000');
  assert(res4.statusCode === 302, 'GET /go/88000 returns 302');
  assert(res4.headers['location'] === '/kv-store.apk', 'GET /go/88000 Location is /kv-store.apk');

  const resGoSmart = await request('/go/88106');
  assert(resGoSmart.statusCode === 302, 'GET /go/88106 returns 302');
  assert(
    resGoSmart.headers['location'] === '/api/download/smarttube-tv',
    'GET /go/88106 Location is /api/download/smarttube-tv'
  );

  const resDlSmart = await request('/api/download/smarttube-tv');
  assert(resDlSmart.statusCode === 302, 'GET /api/download/smarttube-tv returns 302');
  assert(
    resDlSmart.headers['location']?.includes('/releases/download/v1.0.0/smarttube-tv.apk'),
    `GET /api/download/smarttube-tv redirects to Forgejo release (${resDlSmart.headers['location']})`
  );

  // 6. Dynamic in-memory Presets for Kodi 21 Omega (kodi-kv) and CloudStream 3 (cloudstream-kv)
  console.log('\n6. Testing dynamic in-memory Presets (kodi-kv & cloudstream-kv):');
  const resKodiPreset = await request('/api/download/kodi-kv?type=preset');
  assert(resKodiPreset.statusCode === 200, 'GET /api/download/kodi-kv?type=preset returns 200');
  assert(
    resKodiPreset.headers['content-type'] === 'application/zip',
    'Kodi preset Content-Type is application/zip'
  );
  assert(
    resKodiPreset.headers['content-disposition']?.includes('plugin.video.kvnetflix.zip'),
    'Kodi preset filename is plugin.video.kvnetflix.zip'
  );
  assert(
    resKodiPreset.body.length > 10000 &&
      resKodiPreset.body.subarray(0, 2).toString('utf8') === 'PK',
    `Kodi preset is a valid non-empty ZIP buffer (${resKodiPreset.body.length} bytes)`
  );

  const resCsPreset = await request('/api/download/cloudstream-kv?type=preset');
  assert(
    resCsPreset.statusCode === 200,
    'GET /api/download/cloudstream-kv?type=preset returns 200'
  );
  const csJson = JSON.parse(resCsPreset.body.toString('utf8'));
  assert(
    Boolean(csJson.datastore?._String?.REPOSITORIES_KEY?.includes('n.khoavo.vndns.net')),
    'CloudStream preset JSON contains KV-Netflix repository'
  );

  // 7. Frontend Integration verification
  console.log('\n7. Verifying Frontend assets:');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  assert(
    indexHtml.includes('id="kv-store-inline-dl-btn"'),
    'index.html has #kv-store-inline-dl-btn download action'
  );
  assert(indexHtml.includes('88000'), 'index.html displays shortcode 88000');

  const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
  assert(appJs.includes('window.KVTVBridge'), 'app.js checks window.KVTVBridge');

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
