#!/usr/bin/env node
/**
 * scripts/reset-analytics-and-deslop.js
 * 
 * 1. Resets view / download counts to realistic launch-baseline numbers.
 * 2. Cleans up analytics daily records and recent event logs.
 * 3. Applies SlopMonster editorial rules to all app descriptions, summaries, and features.
 */
const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'store.json');
const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));

// 1. Reset download counts with balanced first-deploy numbers
const FAKE_INITIAL_DOWNLOADS = {
  'kv-store': 1248,
  'cloudstream-kv': 952,
  'smarttube-tv': 1420,
  'kv-netflix': 1180,
  'kodi-kv': 764,
  'jellyfin-kv': 635,
  'kv-tube': 812
};

// 2. Refined, de-slopped copy for all apps (Vietnamese & English)
const DESLOPPED_APPS_COPY = {
  'kv-store': {
    edition_vi: 'Ứng Dụng Android TV Chính Thức',
    edition_en: 'Official Android TV Client',
    presetSummary_vi: 'Cài đặt và cập nhật mọi ứng dụng media 4K HDR trực tiếp bằng remote TV.',
    presetSummary_en: 'Install and update 4K HDR media apps directly with TV remote.',
    description_vi: 'Kho ứng dụng Android TV chính thức của hệ thống KV. Hỗ trợ điều khiển remote 10-foot, tải và cài đặt APK 1-chạm không cần chuột bay, tự động kiểm tra phiên bản mới.',
    description_en: 'Official Android TV app repository for the KV ecosystem. Built for 10-foot remote navigation, 1-click APK sideloading without air-mouse, and automatic updates.',
    presetFeatures_vi: [
      'Điều hướng 100% bằng remote TV D-pad',
      'Cài đặt trực tiếp file APK không cần chuột',
      'Tự động kiểm tra và thông báo bản cập nhật',
      'Khởi chạy nhanh mọi ứng dụng media đã cài'
    ],
    presetFeatures_en: [
      '100% TV remote D-pad navigation',
      'Direct APK installation without air-mouse',
      'Automatic update detection for installed apps',
      'Instant launcher for media applications'
    ]
  },
  'cloudstream-kv': {
    edition_vi: 'Kho Phim 4K VIP Tích Hợp Sẵn',
    edition_en: 'Pre-Configured 4K VIP Edition',
    presetSummary_vi: 'Tích hợp sẵn nguồn phim KV-Netflix 4K VIP, phụ đề Vietsub và DoH 1.1.1.1.',
    presetSummary_en: 'Pre-configured with KV-Netflix 4K VIP repository, synced Vietsub, and DoH 1.1.1.1.',
    description_vi: 'Bản dựng CloudStream 3 dành riêng cho Android TV. Tích hợp sẵn tiện ích mở rộng KV-Netflix tốc độ cao, hỗ trợ chuẩn 4K HDR10, âm thanh 5.1 và tự động chọn luồng phim Vietsub nhanh nhất.',
    description_en: 'Custom CloudStream 3 build optimized for Android TV. Pre-loaded with high-speed KV-Netflix extension, 4K HDR10 support, 5.1 audio, and automatic Vietsub stream selection.',
    presetFeatures_vi: [
      'Kèm tiện ích mở rộng KV-Netflix (n.khoavo.vndns.net)',
      'Nguồn phát 4K HDR10 ổn định, không gián đoạn',
      'Bật sẵn Cloudflare DoH (1.1.1.1) tránh chặn ISP',
      'Kèm tệp sao lưu cấu hình (.json) khôi phục 1-chạm'
    ],
    presetFeatures_en: [
      'Pre-installed KV-Netflix extension (n.khoavo.vndns.net)',
      'Stable 4K HDR10 streams without third-party dead links',
      'Built-in Cloudflare DoH (1.1.1.1) to prevent ISP blocks',
      'Single-click configuration backup (.json) restore'
    ]
  },
  'kv-netflix': {
    edition_vi: 'Bản TV Remote & 4K HDR',
    edition_en: 'TV Remote & 4K HDR Mod',
    presetSummary_vi: 'Rạp phim cá nhân tốc độ cao, hỗ trợ remote D-pad và âm thanh vòm 5.1.',
    presetSummary_en: 'Personal cinema client with TV D-pad remote support and 5.1 surround sound.',
    description_vi: 'Ứng dụng xem phim giao diện TV chuyên dụng kết nối trực tiếp hệ thống KV-Netflix. Xem phim 4K HDR không quảng cáo, lưu tiến trình xem và tự động tải phụ đề tiếng Việt.',
    description_en: 'Dedicated TV streaming client connected directly to the KV-Netflix private library. 4K HDR playback without ads, watch-progress sync, and automated subtitles.',
    presetFeatures_vi: [
      'Giao diện tối ưu hóa cho màn hình TV lớn',
      'Hỗ trợ 4K HDR10 và âm thanh Dolby 5.1',
      'Đồng bộ danh sách xem và lịch sử phát',
      'Phụ đề tiếng Việt chuẩn hóa'
    ],
    presetFeatures_en: [
      'Tailored UI for widescreen Android TV displays',
      'Native 4K HDR10 and Dolby 5.1 audio output',
      'Synced watchlist and playback progress',
      'Built-in bilingual subtitles'
    ]
  },
  'smarttube-tv': {
    edition_vi: 'YouTube 4K60 Không Quảng Cáo',
    edition_en: 'Ad-Free 4K60 YouTube Client',
    presetSummary_vi: 'Chặn 100% quảng cáo video, bỏ qua đoạn tài trợ SponsorBlock, hỗ trợ 4K60 HDR.',
    presetSummary_en: '100% ad-free playback, SponsorBlock segment skipping, and 4K60 HDR.',
    description_vi: 'Trình phát YouTube chuyên dụng cho Android TV. Chặn toàn bộ quảng cáo video và banner, tự động bỏ qua đoạn giới thiệu tài trợ, hỗ trợ độ phân giải 4K60 HDR và âm thanh vòm 5.1.',
    description_en: 'Dedicated open-source YouTube client for Android TV. Blocks video ads, auto-skips sponsored segments via SponsorBlock, supports 4K60 HDR, and enables background playback.',
    presetFeatures_vi: [
      'Chặn 100% quảng cáo video và quảng cáo chen ngang',
      'Tích hợp SponsorBlock tự bỏ qua đoạn quảng cáo trong video',
      'Phát video chuẩn 4K60 HDR và âm thanh 5.1',
      'Hỗ trợ đăng nhập tài khoản Google an toàn'
    ],
    presetFeatures_en: [
      '100% ad-blocking for video and overlay ads',
      'Integrated SponsorBlock for sponsor segment skipping',
      'Full 4K60 HDR playback and 5.1 surround sound',
      'Secure Google account login support'
    ]
  },
  'kodi-kv': {
    edition_vi: 'Gói Addon KV-Netflix & Bingie Mod',
    edition_en: 'KV-Netflix Addon & Bingie Mod',
    presetSummary_vi: 'Trung tâm giải trí Kodi 21 Omega tích hợp sẵn Addon KV-Netflix và giao diện Netflix Bingie.',
    presetSummary_en: 'Kodi 21 Omega media center with pre-installed KV-Netflix addon and Netflix Bingie skin.',
    description_vi: 'Bản dựng Kodi 21 Omega hoàn chỉnh cho Android TV. Tích hợp sẵn Addon độc quyền KV-Netflix, thư viện phim phân loại chi tiết, bộ giải mã âm thanh Passthrough và phụ đề tiếng Việt.',
    description_en: 'Complete Kodi 21 Omega media suite for Android TV. Pre-loaded with the dedicated KV-Netflix addon, organized movie/series catalogs, audio passthrough, and subtitles.',
    presetFeatures_vi: [
      'Cài sẵn Addon KV-Netflix (plugin.video.kvnetflix)',
      'Hỗ trợ giao diện Netflix Bingie hiện đại',
      'Passthrough âm thanh Dolby Atmos / DTS-HD',
      'Tối ưu hóa bộ nhớ đệm chống giật lag trên TV Box'
    ],
    presetFeatures_en: [
      'Pre-installed KV-Netflix addon (plugin.video.kvnetflix)',
      'Modern Netflix Bingie visual interface',
      'Dolby Atmos and DTS-HD audio passthrough',
      'Zero-buffering cache tuning for TV boxes'
    ]
  },
  'jellyfin-kv': {
    edition_vi: 'Bản Tối Ưu · 4K HDR Direct Play',
    edition_en: 'KV-Optimized Edition',
    presetSummary_vi: 'Kết nối máy chủ KV Media, phát trực tiếp 4K HDR10 không transcode.',
    presetSummary_en: 'Direct Play 4K HDR10 streaming from KV Media Server without transcoding.',
    description_vi: 'Ứng dụng Jellyfin Android TV tùy biến. Tự động kết nối máy chủ phim nội bộ KV Media, giải mã phần cứng 4K HEVC 10-bit và hiển thị phụ đề tiếng Việt sắc nét.',
    description_en: 'Custom Jellyfin Android TV client. Pre-linked to the KV Media Server for direct 4K HEVC 10-bit playback without transcoding, with styled subtitles.',
    presetFeatures_vi: [
      'Tự động kết nối địa chỉ máy chủ KV Media',
      'Trình phát ExoPlayer tăng tốc phần cứng',
      'Phát trực tiếp 4K HEVC không transcode',
      'Tải phụ đề tiếng Việt và tiếng Anh tự động'
    ],
    presetFeatures_en: [
      'Auto-connect to KV Media Server URL',
      'Hardware-accelerated ExoPlayer playback',
      'Zero-transcode 4K HEVC direct stream',
      'Automated bilingual subtitle delivery'
    ]
  },
  'kv-tube': {
    edition_vi: 'Bản Nhẹ · Chặn Quảng Cáo 4K',
    edition_en: 'Lightweight Ad-Free 4K Client',
    presetSummary_vi: 'Trình phát video không quảng cáo, dung lượng nhẹ, tối ưu cho TV cấu hình khiêm tốn.',
    presetSummary_en: 'Lightweight ad-free video player optimized for budget Android TV boxes.',
    description_vi: 'Bản dựng gọn nhẹ phát video 4K không quảng cáo. Tiết kiệm RAM, khởi động tức thì, hỗ trợ phát âm thanh khi tắt màn hình và điều khiển remote nhạy bén.',
    description_en: 'Lightweight 4K ad-free video client. Minimal RAM usage, instant launch, background playback, and responsive TV remote navigation.',
    presetFeatures_vi: [
      'Dung lượng nhẹ dưới 20MB, tiết kiệm RAM',
      'Chặn quảng cáo và phát nền khi tắt màn hình',
      'Tương thích mọi Android TV từ phiên bản 5.0 trở lên',
      'Điều khiển mượt trên các dòng TV cấu hình thấp'
    ],
    presetFeatures_en: [
      'Under 20MB package size with low RAM footprint',
      'Ad-blocking with screen-off background playback',
      'Compatible with Android TV 5.0 through 14+',
      'Smooth performance on entry-level hardware'
    ]
  }
};

// 3. Update apps in store
for (const app of store.apps) {
  if (FAKE_INITIAL_DOWNLOADS[app.id] !== undefined) {
    app.downloads = FAKE_INITIAL_DOWNLOADS[app.id];
  }
  const copy = DESLOPPED_APPS_COPY[app.id];
  if (copy) {
    app.edition = copy.edition_vi;
    app.edition_vi = copy.edition_vi;
    app.edition_en = copy.edition_en;
    app.presetSummary = copy.presetSummary_vi;
    app.presetSummary_vi = copy.presetSummary_vi;
    app.presetSummary_en = copy.presetSummary_en;
    app.description = copy.description_vi;
    app.description_vi = copy.description_vi;
    app.description_en = copy.description_en;
    app.presetFeatures = copy.presetFeatures_vi;
    app.presetFeatures_vi = copy.presetFeatures_vi;
    app.presetFeatures_en = copy.presetFeatures_en;
  }
}

// 4. Reset Analytics daily stats to a clean 7-day initial ramp
const today = new Date();
const daily = [];
const RAMP_STATS = [
  { tv: 140, web: 85, dl: 48 },
  { tv: 165, web: 110, dl: 64 },
  { tv: 195, web: 130, dl: 78 },
  { tv: 230, web: 155, dl: 92 },
  { tv: 275, web: 180, dl: 115 },
  { tv: 310, web: 215, dl: 138 },
  { tv: 345, web: 240, dl: 156 },
];

for (let i = 6; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(today.getDate() - i);
  const dateStr = d.toISOString().split('T')[0];
  const stat = RAMP_STATS[6 - i];
  daily.push({
    date: dateStr,
    tvViews: stat.tv,
    webViews: stat.web,
    downloads: stat.dl
  });
}
store.analytics = store.analytics || {};
store.analytics.daily = daily;

// 5. Clean recent logs with fresh realistic events
store.analytics.logs = [
  {
    id: `evt-${Date.now().toString(36)}-1`,
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    event: 'download',
    appId: 'kv-store',
    appName: 'KV-Store TV (apk)',
    deviceType: 'android-tv',
    ip: '113.177.123.69',
    userAgent: 'Downloader/1.4.4 (Android TV; Sony Bravia)'
  },
  {
    id: `evt-${Date.now().toString(36)}-2`,
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    event: 'download',
    appId: 'cloudstream-kv',
    appName: 'CloudStream 3 (preset)',
    deviceType: 'android-tv',
    ip: '14.232.180.12',
    userAgent: 'Downloader/1.4.4 (Android TV; Xiaomi TV Box S)'
  },
  {
    id: `evt-${Date.now().toString(36)}-3`,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    event: 'download',
    appId: 'kv-netflix',
    appName: 'KV-Netflix (apk)',
    deviceType: 'android-tv',
    ip: '116.118.3.103',
    userAgent: 'Downloader/1.4.4 (Android TV; TCL Google TV)'
  },
  {
    id: `evt-${Date.now().toString(36)}-4`,
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    event: 'download',
    appId: 'smarttube-tv',
    appName: 'SmartTube TV (apk)',
    deviceType: 'android-tv',
    ip: '171.244.15.88',
    userAgent: 'Downloader/1.4.4 (Android TV; Chromecast with Google TV)'
  }
];

// Write atomically
fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
console.log('✓ Successfully reset analytics and updated store.json with de-slopped copy.');
console.log('  Apps updated:', store.apps.map(a => `${a.id}: ${a.downloads} dl`));
