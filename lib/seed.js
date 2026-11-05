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
      sha256: 'e1f9e1116f273126885004f1bbccfe43906fdb921933594cfdd12a09dfe284a8',
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
      versionCode: 191099,
      size: '20.9 MB',
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
      sha256: '04a486b3f7c3148e3e400d313de12af121f9008f354857ef519cdea495f74f3c',
      apkFileName: null,
      presetFileName: null,
      apkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/jellyfin-kv.apk',
      presetUrl: null,
      updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 'kodi-kv',
      name: 'Kodi 21 Omega',
      edition: 'Gói Addon KV-Netflix & Bingie Mod',
      edition_vi: 'Gói Addon KV-Netflix & Bingie Mod',
      edition_en: 'KV-Netflix Addon & Bingie Mod',
      packageName: 'org.xbmc.kodi',
      version: '21.3-Omega',
      versionCode: 2103000,
      size: '66.8 MB',
      shortCode: '88102',
      category: 'Media Center',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Pre-loaded KV-Netflix Addon + 4K FHD Direct Play & Vietsub HLS Streaming',
      presetSummary_vi:
        'Cài sẵn Addon KV-Netflix 4K ngay trên màn hình chính + Tối ưu RAM cho TV Box',
      presetSummary_en:
        'Pre-loaded KV-Netflix Addon on Home Screen + RAM Cache Tuned',
      description:
        'Bản Kodi 21.3 Omega dựng sẵn với Addon KV-Netflix ngay trên màn hình chính, vào thẳng kho phim 4K không hỏi quyền rườm rà, tinh chỉnh bộ nhớ đệm cho TV Box và phụ đề tiếng Việt.',
      description_vi:
        'Bản Kodi 21.3 Omega dựng sẵn với Addon KV-Netflix ngay trên màn hình chính, vào thẳng kho phim 4K không hỏi quyền rườm rà, tinh chỉnh bộ nhớ đệm cho TV Box và phụ đề tiếng Việt.',
      description_en:
        'Ready-to-run Kodi 21.3 Omega build featuring the KV-Netflix 4K poster wall directly on the Home screen, zero-prompt startup, tuned memory cache for TV boxes, and pre-installed Vietnamese subtitles.',
      presetFeatures: [
        'Cài sẵn Addon KV-Netflix (plugin.video.kvnetflix) ngay trên màn hình chính',
        'Khởi chạy tức thì vào kho phim 4K không hỏi quyền truy cập tệp',
        'Tệp advancedsettings.xml tối ưu bộ nhớ đệm cho Box 1GB/2GB RAM',
        'Passthrough âm thanh Dolby Atmos / DTS-HD & phụ đề tiếng Việt',
      ],
      presetFeatures_vi: [
        'Cài sẵn Addon KV-Netflix (plugin.video.kvnetflix) ngay trên màn hình chính',
        'Khởi chạy tức thì vào kho phim 4K không hỏi quyền truy cập tệp',
        'Tệp advancedsettings.xml tối ưu bộ nhớ đệm cho Box 1GB/2GB RAM',
        'Passthrough âm thanh Dolby Atmos / DTS-HD & phụ đề tiếng Việt',
      ],
      presetFeatures_en: [
        'Pre-installed KV-Netflix Addon (plugin.video.kvnetflix) on Home screen',
        'Zero-prompt instant launch directly into 4K poster wall',
        'advancedsettings.xml tuned for 1GB/2GB RAM TV Boxes',
        'Dolby Atmos / DTS-HD audio passthrough & Vietnamese subtitles',
      ],
      color: '#17B2E7',
      iconType: 'kodi',
      downloads: 764,
      rating: '4.9',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a)',
      sha256: '0c95c81202e449da3165dbbb134fdea9e1687ce84ec49cc3ac3181e706eddf58',
      apkFileName: null,
      presetFileName: null,
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kodi-kv.apk',
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
      size: '68.8 MB',
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
      downloads: 952,
      rating: '5.0',
      minAndroid: 'Android TV 6.0+',
      arch: 'Universal (arm64-v8a, armeabi-v7a, x86, x86_64)',
      sha256: '9afb6d317b70ccd30a5b0eb8c7972c629d82c8c9beec5a25a3ba24dedf27e13c',
      apkFileName: null,
      presetFileName: null,
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/cloudstream-kv.apk',
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
      edition: 'Bản Chính Chủ KV · Không Quảng Cáo',
      edition_vi: 'Bản Chính Chủ KV · Không Quảng Cáo',
      edition_en: 'Official KV Client · Ad-Free TV',
      packageName: 'com.kvtube.tv',
      version: '1.1.5-tv',
      versionCode: 8,
      size: '16.9 MB',
      shortCode: '88105',
      category: 'Video & Music',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Ứng dụng KV-Tube TV chính chủ: kết nối sẵn máy chủ Invidious yt.khoavo.vndns.net, không quảng cáo, ghép đôi TV 1 chạm.',
      presetSummary_vi:
        'Ứng dụng KV-Tube TV chính chủ: kết nối sẵn máy chủ Invidious yt.khoavo.vndns.net, không quảng cáo, ghép đôi TV 1 chạm.',
      presetSummary_en:
        'Official KV-Tube TV client pre-connected to yt.khoavo.vndns.net Invidious server, 100% ad-free with 1-click TV pairing.',
      description:
        'Ứng dụng KV-Tube Android TV chính chủ (Compose for TV & Media3 ExoPlayer). Tích hợp sẵn máy chủ Invidious riêng (yt.khoavo.vndns.net) và dịch vụ ghép đôi tài khoản từ web u.khoavo.vndns.net — mở lên xem ngay video & nhạc Việt Nam không quảng cáo.',
      description_vi:
        'Ứng dụng KV-Tube Android TV chính chủ (Compose for TV & Media3 ExoPlayer). Tích hợp sẵn máy chủ Invidious riêng (yt.khoavo.vndns.net) và dịch vụ ghép đôi tài khoản từ web u.khoavo.vndns.net — mở lên xem ngay video & nhạc Việt Nam không quảng cáo.',
      description_en:
        'Official KV-Tube Android TV app built with Compose for TV and Media3 ExoPlayer. Pre-configured with the private Invidious backend (yt.khoavo.vndns.net) and 6-digit TV pairing via u.khoavo.vndns.net for instant ad-free streaming.',
      presetFeatures: [
        'Kết nối sẵn máy chủ Invidious riêng https://yt.khoavo.vndns.net',
        'Giao diện Android TV gốc (Compose for TV) tối ưu cho điều khiển D-Pad',
        'Phát mượt DASH / HLS với Media3 ExoPlayer, chặn 100% quảng cáo',
        'Ghép đôi nhanh bằng mã 6 số với KV-Tube Web (u.khoavo.vndns.net)',
      ],
      presetFeatures_vi: [
        'Kết nối sẵn máy chủ Invidious riêng https://yt.khoavo.vndns.net',
        'Giao diện Android TV gốc (Compose for TV) tối ưu cho điều khiển D-Pad',
        'Phát mượt DASH / HLS với Media3 ExoPlayer, chặn 100% quảng cáo',
        'Ghép đôi nhanh bằng mã 6 số với KV-Tube Web (u.khoavo.vndns.net)',
      ],
      presetFeatures_en: [
        'Pre-connected to private Invidious server https://yt.khoavo.vndns.net',
        'Native Compose for TV UI tailored for D-Pad remote navigation',
        'Smooth DASH / HLS playback via Media3 ExoPlayer, 100% ad-free',
        'Instant 6-digit code pairing with KV-Tube Web (u.khoavo.vndns.net)',
      ],
      color: '#FF0033',
      iconType: 'tube',
      downloads: 812,
      rating: '5.0',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a + x86_64)',
      sha256: '4ea32693a42fbd03dfa86864af58234b5d971851d03935faa3f1219eb5263d3b',
      apkFileName: null,
      presetFileName: null,
      apkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-tube.apk',
      presetUrl: null,
      updatedAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
    },
    {
      id: 'smarttube-tv',
      name: 'SmartTube TV',
      edition: 'Bản Chính Thức · 4K60 HDR & SponsorBlock',
      edition_vi: 'Bản Chính Thức · 4K60 HDR & SponsorBlock',
      edition_en: 'Official Release · Ad-Free 4K60 HDR & SponsorBlock',
      packageName: 'org.smarttube.stable',
      version: '32.68s',
      versionCode: 2458,
      size: '33.4 MB',
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
      downloads: 1420,
      rating: '5.0',
      minAndroid: 'Android TV 5.0+ (API 21+)',
      arch: 'Universal (arm64-v8a, armeabi-v7a, x86)',
      sha256: '355b3abc7fb71b6d07ee3dd6dc056e6e36df6a6042a95902a56c2c17e99202a4',
      apkFileName: null,
      presetFileName: null,
      apkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/smarttube-tv.apk',
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
        const canonical = createInitialStoreData();
        let updated = false;
        for (const seedApp of canonical.apps) {
          const existing = parsed.apps.find((a) => a.id === seedApp.id);
          if (existing && !existing.apkFileName) {
            const fieldsToSync = [
              'packageName',
              'version',
              'versionCode',
              'size',
              'sha256',
              'apkUrl',
              'presetUrl',
              'edition',
              'edition_vi',
              'edition_en',
              'presetSummary',
              'presetSummary_vi',
              'presetSummary_en',
              'description',
              'description_vi',
              'description_en',
              'presetFeatures',
              'presetFeatures_vi',
              'presetFeatures_en',
            ];
            for (const f of fieldsToSync) {
              if (JSON.stringify(existing[f]) !== JSON.stringify(seedApp[f])) {
                existing[f] = seedApp[f];
                updated = true;
              }
            }
          } else if (!existing) {
            parsed.apps.push(seedApp);
            updated = true;
          }
        }
        if (updated) {
          fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
        }
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
