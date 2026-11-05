'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { hashPassword } = require('./totp');

const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

/**
 * Helper to format Date as YYYY-MM-DD in UTC/local consistent format.
 * @param {Date} dateObj
 * @returns {string}
 */
function formatDateKey(dateObj = new Date()) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Build the default seed state for the KV-TV Store (100% Link-Only Mode).
 * @returns {object}
 */
function createInitialStoreData() {
  const now = new Date();

  const apps = [
    {
      id: 'kv-store',
      name: 'KV-Store TV',
      edition: 'Ứng dụng Android TV chính thức',
      edition_vi: 'Ứng dụng Android TV chính thức',
      edition_en: 'Official Android TV Client',
      packageName: 'net.vndns.tv.store',
      version: '1.0.0',
      versionCode: 1,
      size: '2.5 MB',
      shortCode: '88000',
      category: 'Media Center',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Cài đặt 1-chạm & tự động cập nhật mọi ứng dụng Media, Streaming, 4K HDR cho Android TV',
      presetSummary_vi:
        'Cài đặt 1-chạm & tự động cập nhật mọi ứng dụng Media, Streaming, 4K HDR cho Android TV',
      presetSummary_en:
        '1-click install & auto-update for all Media, Streaming, and 4K HDR apps on Android TV',
      description:
        'Ứng dụng chính thức của KV-Store dành cho Android TV / Google TV. Tích hợp quản lý ứng dụng, cài đặt 1-chạm không cần chuột, tự động phát hiện phiên bản và khởi chạy ứng dụng media, phim ảnh 4K HDR.',
      description_vi:
        'Ứng dụng chính thức của KV-Store dành cho Android TV / Google TV. Tích hợp quản lý ứng dụng, cài đặt 1-chạm không cần chuột, tự động phát hiện phiên bản và khởi chạy ứng dụng media, phim ảnh 4K HDR.',
      description_en:
        'Official KV-Store client for Android TV / Google TV. 100% remote D-pad navigation, 1-click sideload without air-mouse, auto-updates and instant playback.',
      presetFeatures: [
        'Điều hướng 100% bằng remote TV D-pad mượt mà',
        'Cài đặt 1-chạm trực tiếp không cần chuột',
        'Tự động quét và phát hiện phiên bản ứng dụng đã cài đặt',
        'Hỗ trợ cập nhật và mở nhanh ứng dụng ngay trên TV',
      ],
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
      color: '#00A4DC',
      iconType: 'store',
      downloads: 8804,
      rating: '5.0',
      minAndroid: 'Android TV 5.0+ (API 21+)',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: '10c3627fcf1b4a3a2452def14c9736c0e7c15df774c5d869d85337c541cc2e95',
      apkFileName: null,
      presetFileName: null,
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-store.apk',
      presetUrl: null,
      updatedAt: new Date(now.getTime()).toISOString(),
    },
    {
      id: 'jellyfin-kv',
      name: 'Jellyfin TV',
      edition: 'Bản tối ưu KV · 4K HDR Direct Play',
      edition_vi: 'Bản tối ưu KV · 4K HDR Direct Play',
      edition_en: 'KV-Optimized Edition',
      packageName: 'org.jellyfin.androidtv',
      version: '0.19.10',
      versionCode: 1910,
      size: '42.8 MB',
      shortCode: '88101',
      category: 'Media Center',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Kết nối sẵn máy chủ KV Media + cấu hình ExoPlayer phát trực tiếp 4K HDR10 / Dolby Vision',
      presetSummary_vi:
        'Kết nối sẵn máy chủ KV Media + cấu hình ExoPlayer phát trực tiếp 4K HDR10 / Dolby Vision',
      presetSummary_en:
        'Pre-linked to KV Media Server + Direct Play 4K HDR10/Dolby Vision ExoPlayer profile',
      description:
        'Bản dựng Jellyfin tùy biến cho Android TV với khả năng tự động kết nối máy chủ KV Media, phát trực tiếp 4K HEVC 10-bit không cần transcode và hỗ trợ phụ đề tiếng Việt / tiếng Anh.',
      description_vi:
        'Bản dựng Jellyfin tùy biến cho Android TV với khả năng tự động kết nối máy chủ KV Media, phát trực tiếp 4K HEVC 10-bit không cần transcode và hỗ trợ phụ đề tiếng Việt / tiếng Anh.',
      description_en:
        'Custom Android TV build of Jellyfin with pre-configured KV Media Server discovery, Direct Play 4K HEVC 10-bit profiles, and styled Vietnamese/English subtitles.',
      presetFeatures: [
        'Tự động tìm kiếm & điền sẵn địa chỉ máy chủ',
        'Trình phát ExoPlayer tăng tốc phần cứng + dự phòng libVLC',
        'Phát trực tiếp 4K HEVC 10-bit không qua transcode',
        'Định kiểu phụ đề tiếng Việt & tiếng Anh mặc định',
      ],
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
      color: '#00A4DC',
      iconType: 'jellyfin',
      downloads: 635,
      rating: '4.9',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: crypto.createHash('sha256').update('jellyfin-kv-0.19.10').digest('hex'),
      apkFileName: null,
      presetFileName: null,
      apkUrl:
        'https://github.com/jellyfin/jellyfin-androidtv/releases/download/v0.19.10/jellyfin-androidtv-v0.19.10-release.apk',
      presetUrl: null,
      updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 'kodi-kv',
      name: 'Kodi 21 Omega',
      edition: 'Gói All-in-One Arctic Zephyr 2',
      edition_vi: 'Gói All-in-One Arctic Zephyr 2',
      edition_en: 'KV-Build All-in-One',
      packageName: 'org.xbmc.kodi',
      version: '21.3-Omega',
      versionCode: 2103000,
      size: '66.6 MB',
      shortCode: '88102',
      category: 'Media Center',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Pre-loaded KV-Netflix Addon + 4K FHD Direct Play & Vietsub HLS Streaming',
      presetSummary_vi:
        'Cài sẵn giao diện Arctic Zephyr 2 nhẹ mượt + Addon KV-Netflix 4K + Tối ưu RAM cho Box 1GB/2GB',
      presetSummary_en:
        'Pre-loaded Arctic Zephyr 2 Leanback Skin + KV-Netflix Addon + RAM Cache Tuned',
      description:
        'Bản Kodi 21.3 Omega dựng sẵn với giao diện TV 10-foot Arctic Zephyr 2 mượt mà, tinh chỉnh bộ nhớ đệm cho TV Box cấu hình thấp và tích hợp sẵn các nguồn phụ đề tiếng Việt chất lượng cao.',
      description_vi:
        'Bản Kodi 21.3 Omega dựng sẵn với giao diện TV 10-foot Arctic Zephyr 2 mượt mà, tinh chỉnh bộ nhớ đệm cho TV Box cấu hình thấp và tích hợp sẵn các nguồn phụ đề tiếng Việt chất lượng cao.',
      description_en:
        'Ready-to-run Kodi 21.3 Omega build featuring the lightweight Arctic Zephyr 2 10-foot TV skin, tuned memory cache for 1GB/2GB TV boxes, and pre-installed Vietnamese subtitle addons.',
      presetFeatures: [
        'Giao diện điều khiển remote TV Arctic Zephyr 2 kích hoạt sẵn',
        'Tệp advancedsettings.xml tối ưu bộ nhớ đệm cho Box 1GB/2GB RAM',
        'Cài sẵn Addon KV-Netflix VIP & các nguồn phụ đề tiếng Việt',
        'Tối ưu bộ đệm phát trực tuyến TorrServer & Elementum',
      ],
      presetFeatures_vi: [
        'Giao diện điều khiển remote TV Arctic Zephyr 2 kích hoạt sẵn',
        'Tệp advancedsettings.xml tối ưu bộ nhớ đệm cho Box 1GB/2GB RAM',
        'Cài sẵn Addon KV-Netflix VIP & các nguồn phụ đề tiếng Việt',
        'Tối ưu bộ đệm phát trực tuyến TorrServer & Elementum',
      ],
      presetFeatures_en: [
        'Arctic Zephyr 2 10-foot TV remote skin pre-activated',
        'advancedsettings.xml tuned for 1GB/2GB RAM TV Boxes',
        'Pre-installed KV-Netflix VIP Addon & Vietnamese subtitle providers',
        'TorrServer & Elementum streaming buffer optimization',
      ],
      color: '#17B2E7',
      iconType: 'kodi',
      downloads: 2890,
      rating: '4.9',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a, armeabi-v7a, x86)',
      sha256: 'cf53a43522743f937ec0644991c625da0796d5705fb2081bd005430927fe7755',
      apkFileName: null,
      presetFileName: null,
      apkUrl: 'https://mirrors.kodi.tv/releases/android/arm64-v8a/kodi-21.2-Omega-arm64-v8a.apk',
      presetUrl: 'https://tv.vndns.net/api/download/kodi-kv?type=preset',
      updatedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: 'cloudstream-kv',
      name: 'CloudStream 3',
      edition: 'Bản tích hợp sẵn (KV-Netflix 4K VIP)',
      edition_vi: 'Bản tích hợp sẵn (KV-Netflix 4K VIP)',
      edition_en: 'KV-PreSetup (KV-Netflix 4K VIP)',
      packageName: 'com.lagradost.cloudstream3',
      version: '4.8.0-kv',
      versionCode: 68,
      size: '68.7 MB',
      shortCode: '88103',
      category: 'Streaming',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Tích hợp sẵn nguồn phim KV-Netflix 4K VIP (n.khoavo.vndns.net), loại bỏ hoàn toàn lỗi nguồn bên thứ ba',
      presetSummary_vi:
        'Tích hợp sẵn nguồn phim KV-Netflix 4K VIP (n.khoavo.vndns.net), loại bỏ hoàn toàn lỗi nguồn bên thứ ba',
      presetSummary_en:
        'Pre-configured with KV-Netflix 4K VIP (n.khoavo.vndns.net), zero broken 3rd-party scrapers',
      description:
        'Bản dựng tối ưu hóa riêng cho hệ sinh thái KV: Cài sẵn plugin mở rộng KV-Netflix VIP tốc độ cao, hỗ trợ chuẩn 4K HDR10, âm thanh 5.1 và phụ đề Vietsub đồng bộ.',
      description_vi:
        'Bản dựng tối ưu hóa riêng cho hệ sinh thái KV: Cài sẵn plugin mở rộng KV-Netflix VIP tốc độ cao, hỗ trợ chuẩn 4K HDR10, âm thanh 5.1 và phụ đề Vietsub đồng bộ.',
      description_en:
        'Custom-engineered for the KV ecosystem: Pre-loaded with private high-speed KV-Netflix VIP extension, 4K HDR10, 5.1 surround audio, and synchronized Vietsub.',
      presetFeatures: [
        'Tích hợp sẵn tiện ích mở rộng KV-Netflix (n.khoavo.vndns.net)',
        'Nguồn phim Full HD / 4K HDR10 riêng không bị chặn hay giật lag',
        'Tự động đồng bộ kho phim mới nhất với hệ thống KV-Netflix',
        'Kèm file cấu hình Pre-Set backup (.json) khôi phục 1-chạm',
      ],
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
      color: '#6366F1',
      iconType: 'cloudstream',
      downloads: 4155,
      rating: '5.0',
      minAndroid: 'Android TV 6.0+',
      arch: 'Universal (arm64-v8a, armeabi-v7a, x86, x86_64)',
      sha256: '348c3f09551f2dda4fba25ba348928ee7b82a47ce98a6b1eae3295d4c127877c',
      apkFileName: null,
      presetFileName: null,
      apkUrl: 'https://github.com/recloudstream/cloudstream/releases/download/v4.8.0/4.8.0.apk',
      presetUrl: 'https://n.khoavo.vndns.net/repo.json',
      updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: 'kv-netflix',
      name: 'KV-Netflix',
      edition: 'Bản Mod TV Remote & 4K HDR',
      edition_vi: 'Bản Mod TV Remote & 4K HDR',
      edition_en: 'TV Remote & 4K HDR Mod',
      packageName: 'com.streamflow.tv',
      version: '1.4.6-kv',
      versionCode: 117,
      size: '24.1 MB',
      shortCode: '88104',
      category: 'Originals & Cinema',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Hoạt động trên mọi TV Box chứng chỉ & không chứng chỉ với điều khiển D-Pad',
      presetSummary_vi:
        'Hoạt động trên mọi TV Box chứng chỉ & không chứng chỉ với điều khiển D-Pad',
      presetSummary_en:
        'Works on both certified & uncertified Android TV boxes with full D-Pad navigation',
      description:
        'Tối ưu hóa cho các dòng Android TV Box không đạt chứng chỉ Netflix gốc. Hỗ trợ điều hướng remote D-Pad mượt mà không cần chuột bay, tự thích ứng Widevine L1/L3 và âm thanh 5.1.',
      description_vi:
        'Tối ưu hóa cho các dòng Android TV Box không đạt chứng chỉ Netflix gốc. Hỗ trợ điều hướng remote D-Pad mượt mà không cần chuột bay, tự thích ứng Widevine L1/L3 và âm thanh 5.1.',
      description_en:
        'Engineered for Android TV boxes that fail Netflix certification checks. Provides native D-Pad remote focus navigation without an air-mouse, adaptive Widevine L1/L3 fallback, and 5.1 audio.',
      presetFeatures: [
        'Điều hướng trực tiếp bằng remote D-Pad (không cần chuột bay)',
        'Tự động thích ứng Widevine L1/L3 cho mọi TV Box',
        'Cấu hình sẵn âm thanh vòm Dolby Digital Plus 5.1 & HDR10',
        'Khởi động siêu nhanh trên chip Amlogic & Rockchip',
      ],
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
      color: '#E50914',
      iconType: 'netflix',
      downloads: 1180,
      rating: '4.8',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: '25f5af849bbc6f447292c163c6199a07cfb2f09baa963902e2c4e3cd60357dca',
      apkFileName: null,
      presetFileName: null,
      apkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-netflix-tv.apk',
      presetUrl: 'https://n.khoavo.vndns.net/repo.json',
      updatedAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
    },
    {
      id: 'kv-tube',
      name: 'KV-Tube',
      edition: 'Chặn 100% quảng cáo 4K60 + SponsorBlock',
      edition_vi: 'Chặn 100% quảng cáo 4K60 + SponsorBlock',
      edition_en: 'Ad-Free 4K60 + SponsorBlock',
      packageName: 'com.kvtube.tv',
      version: '24.85-kv',
      versionCode: 2485,
      size: '19.4 MB',
      shortCode: '88105',
      category: 'Video & Music',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Chặn toàn bộ quảng cáo video, tự động bỏ qua đoạn tài trợ SponsorBlock, mở khóa 4K 60fps HDR',
      presetSummary_vi:
        'Chặn toàn bộ quảng cáo video, tự động bỏ qua đoạn tài trợ SponsorBlock, mở khóa 4K 60fps HDR',
      presetSummary_en:
        'Blocks 100% of video ads, skips sponsor reads via SponsorBlock, unlocks 4K 60fps HDR on any TV box',
      description:
        'Ứng dụng KV-Tube / SmartTube thế hệ mới cho Android TV. Chặn đứng 100% quảng cáo trong và ngoài video, tự động bỏ qua intro/quảng cáo của YouTuber và hỗ trợ giải mã phần cứng 4K 60fps HDR mượt mà.',
      description_vi:
        'Ứng dụng KV-Tube / SmartTube thế hệ mới cho Android TV. Chặn đứng 100% quảng cáo trong và ngoài video, tự động bỏ qua intro/quảng cáo của YouTuber và hỗ trợ giải mã phần cứng 4K 60fps HDR mượt mà.',
      description_en:
        'Next-gen SmartTube/KV-Tube client for Android TV. Blocks 100% of video and banner ads, automatically skips sponsor reads via SponsorBlock, and unlocks 4K 60fps HDR on any TV box.',
      presetFeatures: [
        'Xem video 100% không quảng cáo (không video chèn, không banner)',
        'Cấu hình sẵn SponsorBlock (tự động bỏ qua mở đầu, giới thiệu tài trợ)',
        'Hỗ trợ giải mã phần cứng AV1 & VP9 cho hình ảnh 4K 60fps mượt mà',
        'Hoạt động độc lập, không cần Google Play Services trên mọi TV Box',
      ],
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
      color: '#FF0033',
      iconType: 'tube',
      downloads: 812,
      rating: '5.0',
      minAndroid: 'Android TV 6.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: '629784a302008b3497ee53e341ab48d51841b46f0a5a41540dcb4947150f17d1',
      apkFileName: null,
      presetFileName: null,
      apkUrl:
        'https://github.com/yuliskov/SmartTube/releases/download/32.68s/SmartTube_stable_32.68_universal.apk',
      presetUrl: null,
      updatedAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
    },
    {
      id: 'smarttube-tv',
      name: 'SmartTube TV',
      edition: 'Bản Chính Thức · 4K60 HDR & SponsorBlock',
      edition_vi: 'Bản Chính Thức · 4K60 HDR & SponsorBlock',
      edition_en: 'Official Release · Ad-Free 4K60 HDR & SponsorBlock',
      packageName: 'com.teamsmart.videomanager.tv',
      version: '32.68s',
      versionCode: 32680,
      size: '19.8 MB',
      shortCode: '88106',
      category: 'Video & Music',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Bản SmartTube Stable chính thức cho Android TV: Chặn 100% quảng cáo, tự động bỏ qua SponsorBlock & phát 4K 60fps HDR mượt mà',
      presetSummary_vi:
        'Bản SmartTube Stable chính thức cho Android TV: Chặn 100% quảng cáo, tự động bỏ qua SponsorBlock & phát 4K 60fps HDR mượt mà',
      presetSummary_en:
        'Official SmartTube Stable for Android TV: 100% ad-free YouTube, SponsorBlock auto-skip, DeArrow & 4K 60fps HDR playback',
      description:
        'Trình phát YouTube mã nguồn mở hàng đầu dành riêng cho Android TV & Google TV. Loại bỏ hoàn toàn quảng cáo, tích hợp sẵn SponsorBlock tự động bỏ qua đoạn giới thiệu/tài trợ, hỗ trợ độ phân giải lên tới 8K/4K 60fps HDR và điều khiển tối ưu cho remote TV.',
      description_vi:
        'Trình phát YouTube mã nguồn mở hàng đầu dành riêng cho Android TV & Google TV. Loại bỏ hoàn toàn quảng cáo, tích hợp sẵn SponsorBlock tự động bỏ qua đoạn giới thiệu/tài trợ, hỗ trợ độ phân giải lên tới 8K/4K 60fps HDR và điều khiển tối ưu cho remote TV.',
      description_en:
        'The leading open-source YouTube client for Android TV & Google TV. Completely ad-free with built-in SponsorBlock segment skipping, DeArrow title/thumbnail cleanup, up to 4K/8K 60fps HDR hardware decoding, and full D-Pad remote customization.',
      presetFeatures: [
        'Chặn 100% quảng cáo video, quảng cáo đầu/giữa video và banner trên TV',
        'Tích hợp sẵn SponsorBlock tự động bỏ qua intro, outro và quảng cáo tài trợ',
        'Hỗ trợ chuẩn hình ảnh 4K/8K 60fps HDR10, VP9 & AV1 cùng điều chỉnh tốc độ phát',
        'Đăng nhập tài khoản đồng bộ lịch sử xem mà không cần Google Play Services',
      ],
      presetFeatures_vi: [
        'Chặn 100% quảng cáo video, quảng cáo đầu/giữa video và banner trên TV',
        'Tích hợp sẵn SponsorBlock tự động bỏ qua intro, outro và quảng cáo tài trợ',
        'Hỗ trợ chuẩn hình ảnh 4K/8K 60fps HDR10, VP9 & AV1 cùng điều chỉnh tốc độ phát',
        'Đăng nhập tài khoản đồng bộ lịch sử xem mà không cần Google Play Services',
      ],
      presetFeatures_en: [
        '100% ad-free YouTube experience with zero pre-roll, mid-roll, or banner ads',
        'Built-in SponsorBlock automatically skips sponsors, intros, outros & self-promotion',
        '4K/8K 60fps HDR10 playback with hardware AV1/VP9 codec & frame-rate matching',
        'Works standalone on any Android TV box without requiring Google Play Services',
      ],
      color: '#FF0033',
      iconType: 'tube',
      downloads: 6420,
      rating: '5.0',
      minAndroid: 'Android TV 5.0+ (API 21+)',
      arch: 'Universal (arm64-v8a, armeabi-v7a, x86)',
      sha256: crypto.createHash('sha256').update('smarttube-tv-32.68s').digest('hex'),
      apkFileName: null,
      presetFileName: null,
      apkUrl:
        'https://github.com/yuliskov/SmartTube/releases/download/32.68s/SmartTube_stable_32.68_universal.apk',
      presetUrl: null,
      updatedAt: new Date(now.getTime() - 6 * 3600000).toISOString(),
    },
  ];

  const ads = [
    {
      id: 'ad-vip-box',
      title: 'KV-TV VIP Box Setup — Turn any Android TV into a 4K Cinema Hub',
      subtitle:
        'Pre-tuned Jellyfin, Kodi 21 Omega, CloudStream Vietsub & Ad-Free 4K60 SmartTube TV ready in 60 seconds.',
      badge: 'FEATURED',
      ctaText: 'Explore Pre-Set Apps',
      ctaUrl: '#catalog',
      gradient: 'linear-gradient(135deg, #00A4DC 0%, #6366F1 100%)',
      active: true,
      impressions: 4820,
      clicks: 612,
      createdAt: new Date(now.getTime() - 6 * 86400000).toISOString(),
    },
    {
      id: 'ad-vps-cdn',
      title: 'ThueVPSGiaRe High-Speed VN Edge CDN — 1Gbps Direct APK Downloads',
      subtitle:
        'Hosted on low-latency Vietnam NVMe VPS with instant AFTVnews Downloader short-codes (88101–88106).',
      badge: 'SPONSOR',
      ctaText: 'Test Speed',
      ctaUrl: '/tv',
      gradient: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
      active: true,
      impressions: 3190,
      clicks: 284,
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: 'ad-cloudstream-44',
      title: 'CloudStream KV-PreSetup v4.8 Released — KV-Netflix 4K VIP Provider',
      subtitle:
        'Includes KV-Netflix VIP repo, 4K Vietsub stream selector, and Cloudflare 1.1.1.1 DoH bypass.',
      badge: 'NEW RELEASE',
      ctaText: 'Code: 88103',
      ctaUrl: '/go/88103',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
      active: true,
      impressions: 5410,
      clicks: 890,
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
  ];

  // Generate last 7 days of analytics
  const daily = [];
  const baseStats = [
    { tvViews: 310, webViews: 195, downloads: 184 },
    { tvViews: 345, webViews: 220, downloads: 215 },
    { tvViews: 390, webViews: 260, downloads: 248 },
    { tvViews: 412, webViews: 240, downloads: 269 },
    { tvViews: 468, webViews: 305, downloads: 312 },
    { tvViews: 520, webViews: 342, downloads: 364 },
    { tvViews: 485, webViews: 318, downloads: 339 },
  ];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const stat = baseStats[6 - i];
    daily.push({
      date: formatDateKey(d),
      tvViews: stat.tvViews,
      webViews: stat.webViews,
      downloads: stat.downloads,
    });
  }

  const logs = [
    {
      id: 'evt-seed-1',
      timestamp: new Date(now.getTime() - 18 * 60000).toISOString(),
      event: 'download',
      appId: 'smarttube-tv',
      appName: 'SmartTube TV (apk)',
      deviceType: 'tv',
      ip: '113.161.72.14',
      userAgent: 'Mozilla/5.0 (Linux; Android 11; MIBOX4 Build/RTM3.210722.001) TV Bro/2.0.1',
    },
    {
      id: 'evt-seed-2',
      timestamp: new Date(now.getTime() - 14 * 60000).toISOString(),
      event: 'download',
      appId: 'cloudstream-kv',
      appName: 'CloudStream 3 (apk)',
      deviceType: 'tv',
      ip: '27.72.98.210',
      userAgent: 'AFTVnews Downloader/1.4.4 (Android TV; BRAVIA 4K VH2)',
    },
    {
      id: 'evt-seed-3',
      timestamp: new Date(now.getTime() - 9 * 60000).toISOString(),
      event: 'download',
      appId: 'kv-netflix',
      appName: 'KV-Netflix (apk)',
      deviceType: 'tv',
      ip: '14.232.160.55',
      userAgent: 'Mozilla/5.0 (Linux; Android 12; Chromecast HD) AppleWebKit/537.36',
    },
    {
      id: 'evt-seed-4',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      event: 'view',
      appId: null,
      appName: 'Catalog View',
      deviceType: 'tv',
      ip: '171.244.18.92',
      userAgent: 'Mozilla/5.0 (Linux; Android 10; Shield Android TV) AppleWebKit/537.36',
    },
    {
      id: 'evt-seed-5',
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
      event: 'download',
      appId: 'jellyfin-kv',
      appName: 'Jellyfin TV (apk)',
      deviceType: 'desktop',
      ip: '118.69.54.101',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0.0.0 Safari/537.36',
    },
  ];

  // Default credentials: vndangkhoa / thieugia
  const admin = {
    username: 'vndangkhoa',
    passwordHash: hashPassword('thieugia'),
    totpSecret: 'KVKVTVSTORETWOFASECRETBASE32AABB',
    totpEnabled: true,
    updatedAt: now.toISOString(),
  };

  return {
    storeInfo: {
      name: 'KV-TV App Store',
      domain: 'https://tv.vndns.net',
      downloaderCodePrefix: '88',
      version: '1.0.0',
    },
    categories: ['All', 'Media Center', 'Streaming', 'Originals & Cinema', 'Video & Music'],
    apps,
    ads,
    admin,
    analytics: {
      daily,
      logs,
    },
  };
}

/**
 * Ensure `data/` and `uploads/` directories exist, and seed `data/store.json` if missing or forced.
 * @param {boolean} [force=false]
 * @returns {object} Loaded or newly seeded store object
 */
function ensureSeeded(force = false) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  if (!force && fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.apps) && parsed.admin) {
        return parsed;
      }
    } catch {
      // Fall through to re-seed if file is corrupted
    }
  }

  const initialData = createInitialStoreData();
  fs.writeFileSync(STORE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  return initialData;
}

module.exports = {
  DATA_DIR,
  UPLOADS_DIR,
  STORE_PATH,
  formatDateKey,
  createInitialStoreData,
  ensureSeeded,
};
