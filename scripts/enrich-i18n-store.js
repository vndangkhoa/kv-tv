'use strict';

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'store.json');

const raw = fs.readFileSync(STORE_PATH, 'utf8');
const store = JSON.parse(raw);

const appI18n = {
  'kv-store': {
    edition_vi: 'Ứng dụng Android TV chính thức',
    edition_en: 'Official Android TV Client',
    presetSummary_vi: 'Cài đặt 1-chạm & tự động cập nhật mọi ứng dụng Media, Streaming, 4K HDR cho Android TV',
    presetSummary_en: '1-click install & auto-update for all Media, Streaming, and 4K HDR apps on Android TV',
    description_vi: 'Ứng dụng chính thức của KV-Store dành cho Android TV / Google TV. Tích hợp quản lý ứng dụng, cài đặt 1-chạm không cần chuột, tự động phát hiện phiên bản và khởi chạy ứng dụng media, phim ảnh 4K HDR.',
    description_en: 'Official KV-Store client for Android TV / Google TV. 100% remote D-pad navigation, 1-click sideload without air-mouse, auto-updates and instant playback.',
    presetFeatures_vi: [
      'Điều hướng 100% bằng remote TV D-pad mượt mà',
      'Cài đặt 1-chạm trực tiếp không cần chuột',
      'Tự động quét và phát hiện phiên bản ứng dụng đã cài đặt',
      'Hỗ trợ cập nhật và mở nhanh ứng dụng ngay trên TV',
    ],
    presetFeatures_en: [
      '100% smooth D-pad remote navigation',
      '1-click direct sideloading without air-mouse',
      'Automatic scanning and detection of installed versions',
      'Instant TV app launching and background updates',
    ],
  },
  'jellyfin-kv': {
    edition_vi: 'Bản tối ưu KV · 4K HDR Direct Play',
    edition_en: 'KV-Optimized Edition',
    presetSummary_vi: 'Kết nối sẵn máy chủ KV Media + cấu hình ExoPlayer phát trực tiếp 4K HDR10 / Dolby Vision',
    presetSummary_en: 'Pre-linked to KV Media Server + Direct Play 4K HDR10/Dolby Vision ExoPlayer profile',
    description_vi: 'Bản dựng Jellyfin tùy biến cho Android TV với khả năng tự động kết nối máy chủ KV Media, phát trực tiếp 4K HEVC 10-bit không cần transcode và hỗ trợ phụ đề tiếng Việt / tiếng Anh.',
    description_en: 'Custom Android TV build of Jellyfin with pre-configured KV Media Server discovery, Direct Play 4K HEVC 10-bit profiles, and styled Vietnamese/English subtitles.',
    presetFeatures_vi: [
      'Tự động tìm kiếm & điền sẵn địa chỉ máy chủ',
      'Trình phát ExoPlayer tăng tốc phần cứng + dự phòng libVLC',
      'Phát trực tiếp 4K HEVC 10-bit không qua transcode',
      'Định kiểu phụ đề tiếng Việt & tiếng Anh mặc định',
    ],
    presetFeatures_en: [
      'Auto-discovery & pre-filled server URL',
      'Hardware-accelerated ExoPlayer + libVLC fallback',
      'Zero-transcode 4K HEVC 10-bit Direct Play',
      'Vietnamese & English default subtitle styling',
    ],
  },
  'kodi-kv': {
    edition_vi: 'Gói All-in-One Arctic Zephyr 2',
    edition_en: 'KV-Build All-in-One',
    presetSummary_vi: 'Cài sẵn giao diện Arctic Zephyr 2 nhẹ mượt + Addon phụ đề tiếng Việt + Tối ưu RAM cho Box 1GB/2GB',
    presetSummary_en: 'Pre-loaded Arctic Zephyr 2 Leanback Skin + VN Subtitle Addons + RAM Cache Tuned',
    description_vi: 'Bản Kodi 21.3 Omega dựng sẵn với giao diện TV 10-foot Arctic Zephyr 2 mượt mà, tinh chỉnh bộ nhớ đệm cho TV Box cấu hình thấp và tích hợp sẵn các nguồn phụ đề tiếng Việt chất lượng cao.',
    description_en: 'Ready-to-run Kodi 21.3 Omega build featuring the lightweight Arctic Zephyr 2 10-foot TV skin, tuned memory cache for 1GB/2GB TV boxes, and pre-installed Vietnamese subtitle addons.',
    presetFeatures_vi: [
      'Giao diện điều khiển remote TV Arctic Zephyr 2 kích hoạt sẵn',
      'Tệp advancedsettings.xml tối ưu bộ nhớ đệm cho Box 1GB/2GB RAM',
      'Cài sẵn các nhà cung cấp phụ đề tiếng Việt (Subscene / OpenSubtitles)',
      'Tối ưu bộ đệm phát trực tuyến TorrServer & Elementum',
    ],
    presetFeatures_en: [
      'Arctic Zephyr 2 10-foot TV remote skin pre-activated',
      'advancedsettings.xml tuned for 1GB/2GB RAM TV Boxes',
      'Pre-installed Vietnamese subtitle providers (Subscene/OpenSubtitles)',
      'TorrServer & Elementum streaming buffer optimization',
    ],
  },
  'cloudstream-kv': {
    edition_vi: 'Bản tích hợp sẵn (KV-Netflix 4K VIP)',
    edition_en: 'KV-PreSetup (KV-Netflix 4K VIP)',
    presetSummary_vi: 'Tích hợp sẵn nguồn phim KV-Netflix 4K VIP (n.khoavo.vndns.net), loại bỏ hoàn toàn lỗi nguồn bên thứ ba',
    presetSummary_en: 'Pre-configured with KV-Netflix 4K VIP (n.khoavo.vndns.net), zero broken 3rd-party scrapers',
    description_vi: 'Bản dựng tối ưu hóa riêng cho hệ sinh thái KV: Cài sẵn plugin mở rộng KV-Netflix VIP tốc độ cao, hỗ trợ chuẩn 4K HDR10, âm thanh 5.1 và phụ đề Vietsub đồng bộ.',
    description_en: 'Custom-engineered for the KV ecosystem: Pre-loaded with private high-speed KV-Netflix VIP extension, 4K HDR10, 5.1 surround audio, and synchronized Vietsub.',
    presetFeatures_vi: [
      'Tích hợp sẵn tiện ích mở rộng KV-Netflix (n.khoavo.vndns.net)',
      'Nguồn phim Full HD / 4K HDR10 riêng không bị chặn hay giật lag',
      'Tự động đồng bộ kho phim mới nhất với hệ thống KV-Netflix',
      'Kèm file cấu hình Pre-Set backup (.json) khôi phục 1-chạm',
    ],
    presetFeatures_en: [
      'Pre-loaded with KV-Netflix VIP extension (n.khoavo.vndns.net)',
      'Dedicated Full HD / 4K HDR10 streams without ISP throttling or buffering',
      'Auto-syncs catalog directly with private KV-Netflix server',
      'Includes 1-click Pre-Set restore (.json) backup',
    ],
  },
  'kv-netflix': {
    edition_vi: 'Bản Mod TV Remote & 4K HDR',
    edition_en: 'TV Remote & 4K HDR Mod',
    presetSummary_vi: 'Hoạt động trên mọi TV Box chứng chỉ & không chứng chỉ với điều khiển D-Pad',
    presetSummary_en: 'Works on both certified & uncertified Android TV boxes with full D-Pad navigation',
    description_vi: 'Tối ưu hóa cho các dòng Android TV Box không đạt chứng chỉ Netflix gốc. Hỗ trợ điều hướng remote D-Pad mượt mà không cần chuột bay, tự thích ứng Widevine L1/L3 và âm thanh 5.1.',
    description_en: 'Engineered for Android TV boxes that fail Netflix certification checks. Provides native D-Pad remote focus navigation without an air-mouse, adaptive Widevine L1/L3 fallback, and 5.1 audio.',
    presetFeatures_vi: [
      'Điều hướng trực tiếp bằng remote D-Pad (không cần chuột bay)',
      'Tự động thích ứng Widevine L1/L3 cho mọi TV Box',
      'Cấu hình sẵn âm thanh vòm Dolby Digital Plus 5.1 & HDR10',
      'Khởi động siêu nhanh trên chip Amlogic & Rockchip',
    ],
    presetFeatures_en: [
      'Native D-Pad directional navigation (no air-mouse needed)',
      'Widevine L1/L3 adaptive fallback for uncertified TV boxes',
      'Pre-tuned Dolby Digital Plus 5.1 & HDR10 playback flags',
      'Ultra-fast cold start on Amlogic & Rockchip chips',
    ],
  },
  'kv-tube': {
    edition_vi: 'Chặn 100% quảng cáo 4K60 + SponsorBlock',
    edition_en: 'Ad-Free 4K60 + SponsorBlock',
    presetSummary_vi: 'Chặn toàn bộ quảng cáo video, tự động bỏ qua đoạn tài trợ SponsorBlock, mở khóa 4K 60fps HDR',
    presetSummary_en: 'Blocks 100% of video ads, skips sponsor reads via SponsorBlock, unlocks 4K 60fps HDR on any TV box',
    description_vi: 'Ứng dụng KV-Tube / SmartTube thế hệ mới cho Android TV. Chặn đứng 100% quảng cáo trong và ngoài video, tự động bỏ qua intro/quảng cáo của YouTuber và hỗ trợ giải mã phần cứng 4K 60fps HDR mượt mà.',
    description_en: 'Next-gen SmartTube/KV-Tube client for Android TV. Blocks 100% of video and banner ads, automatically skips sponsor reads via SponsorBlock, and unlocks 4K 60fps HDR on any TV box.',
    presetFeatures_vi: [
      'Xem video 100% không quảng cáo (không video chèn, không banner)',
      'Cấu hình sẵn SponsorBlock (tự động bỏ qua mở đầu, giới thiệu tài trợ)',
      'Hỗ trợ giải mã phần cứng AV1 & VP9 cho hình ảnh 4K 60fps mượt mà',
      'Hoạt động độc lập, không cần Google Play Services trên mọi TV Box',
    ],
    presetFeatures_en: [
      '100% Ad-free playback (no pre-roll, mid-roll, or banner ads)',
      'SponsorBlock pre-configured (skips intros, self-promo & sponsor segments)',
      'AV1 & VP9 hardware codec selector for smooth 4K 60fps',
      'Works without Google Play Services on any Android TV box',
    ],
  },
};

for (const app of store.apps) {
  if (appI18n[app.id]) {
    Object.assign(app, appI18n[app.id]);
    // Set default edition/description to Vietnamese
    app.edition = app.edition_vi;
    app.presetSummary = app.presetSummary_vi;
    app.description = app.description_vi;
    app.presetFeatures = app.presetFeatures_vi;
  }
}

// Ads bilingual enrichment
if (Array.isArray(store.ads)) {
  for (const ad of store.ads) {
    if (ad.id === 'ad-vip-box') {
      ad.title_vi = 'Cài Đặt Hộp KV-TV VIP — Biến Mọi Android TV Thành Rạp Phim 4K';
      ad.title_en = 'KV-TV VIP Box Setup — Turn any Android TV into a 4K Cinema Hub';
      ad.subtitle_vi = 'Jellyfin, Kodi 21 Omega, CloudStream Vietsub & KV-Tube 4K60 không quảng cáo sẵn sàng trong 60 giây.';
      ad.subtitle_en = 'Pre-tuned Jellyfin, Kodi 21 Omega, CloudStream Vietsub & Ad-Free 4K60 KV-Tube ready in 60 seconds.';
      ad.ctaText_vi = 'Khám Phá Bản Cài Sẵn';
      ad.ctaText_en = 'Explore Pre-Set Apps';
    } else if (ad.id === 'ad-vps-cdn') {
      ad.title_vi = 'Mạng ThueVPSGiaRe Tốc Độ Cao VN — Tải Trực Tiếp APK 1Gbps';
      ad.title_en = 'ThueVPSGiaRe High-Speed VN Edge CDN — 1Gbps Direct APK Downloads';
      ad.subtitle_vi = 'Máy chủ NVMe VPS độ trễ thấp tại Việt Nam với mã tải Downloader 5 số (88101–88105).';
      ad.subtitle_en = 'Hosted on low-latency Vietnam NVMe VPS with instant AFTVnews Downloader short-codes (88101–88105).';
      ad.ctaText_vi = 'Nhập Mã Số';
      ad.ctaText_en = 'Dial Short-Code';
    } else if (ad.id === 'ad-cloudstream-44') {
      ad.title_vi = 'Phát Hành CloudStream KV-PreSetup v4.8 — Tích Hợp Kho Phim KV-Netflix VIP';
      ad.title_en = 'CloudStream KV-PreSetup v4.8 Released — KV-Netflix 4K VIP Provider';
      ad.subtitle_vi = 'Bản quyền riêng, kho phim 4K Vietsub mượt mà và bypass chặn nhà mạng qua Cloudflare DoH 1.1.1.1.';
      ad.subtitle_en = 'Includes KV-Netflix VIP repo, 4K Vietsub stream selector, and Cloudflare 1.1.1.1 DoH bypass.';
      ad.ctaText_vi = 'Mã: 88103';
      ad.ctaText_en = 'Code: 88103';
    }
  }
}

fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
console.log('Successfully enriched store.json with bilingual attributes!');
