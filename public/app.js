/**
 * KV-TV Store (https://tv.vndns.net) — kv-tv-theme Client Engine
 * - Metro Typographic Panorama Storefront (6x2 Asymmetric Live Tile Matrix)
 * - 4 Panorama Pivots: store · pre-sets · short-codes · phone-qr (?mode=promo)
 * - 3 Native <dialog closedby="any"> Modals + Light-Dismiss Fallback
 * - 10-Foot Roving Tabindex 2D Spatial Navigation + D-Pad Remote Simulator
 * - Bilingual Engine (Tiếng Việt [default] & English)
 */

import {
  detectInitialLanguage,
  getCurrentLanguage,
  setLanguage,
  onLanguageChange,
  t,
  tField,
  translateDom,
  TRANSLATIONS,
} from './i18n.js';

const METRO_TILE_CLASSES = {
  'kv-store': 'kv-tile--cobalt',
  'cloudstream-kv': 'kv-tile--cobalt',
  'jellyfin-kv': 'kv-tile--violet',
  'kodi-kv': 'kv-tile--teal',
  'kv-netflix': 'kv-tile--crimson',
  'kv-tube': 'kv-tile--vermilion',
  'smarttube-tv': 'kv-tile--vermilion',
};

const METRO_TILE_COLORS = {
  'kv-store': 'var(--kv-cobalt)',
  'cloudstream-kv': 'var(--kv-cobalt)',
  'jellyfin-kv': 'var(--kv-violet)',
  'kodi-kv': 'var(--kv-teal)',
  'kv-netflix': 'var(--kv-crimson)',
  'kv-tube': 'var(--kv-vermilion)',
  'smarttube-tv': 'var(--kv-vermilion)',
};

const FALLBACK_CATALOG = {
  storeInfo: {
    name: 'KV-TV App Store',
    domain: 'https://tv.vndns.net',
    downloaderCodePrefix: '88',
    version: '1.0.0',
  },
  apps: [
    {
      id: 'kv-store',
      name: 'KV-Store TV',
      edition: 'Ứng Dụng Android TV Chính Thức',
      edition_vi: 'Ứng Dụng Android TV Chính Thức',
      edition_en: 'Official Android TV Client',
      packageName: 'net.vndns.tv.store',
      version: '1.0.0',
      versionCode: 1,
      size: '2.5 MB',
      shortCode: '88000',
      category: 'Media Center',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 1248,
      sha256: 'e1f9e1116f273126885004f1bbccfe43906fdb921933594cfdd12a09dfe284a8',
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-store.apk',
      description:
        'Ứng dụng chính thức của KV-Store dành cho Android TV / Google TV. Tích hợp quản lý ứng dụng, cài đặt 1-chạm không cần chuột, tự động phát hiện phiên bản và khởi chạy ứng dụng media, phim ảnh 4K HDR.',
      presetFeatures: [
        'Điều hướng 100% bằng remote TV D-pad mượt mà',
        'Cài đặt 1-chạm trực tiếp không cần chuột',
        'Tự động quét và phát hiện phiên bản ứng dụng đã cài đặt',
        'Hỗ trợ cập nhật và mở nhanh ứng dụng ngay trên TV',
      ],
    },
    {
      id: 'cloudstream-kv',
      name: 'CloudStream 3',
      edition: 'Kho Phim 4K VIP Tích Hợp Sẵn',
      edition_vi: 'Kho Phim 4K VIP Tích Hợp Sẵn',
      edition_en: 'Pre-Configured 4K VIP Edition',
      packageName: 'com.lagradost.cloudstream3',
      version: '4.8.0-kv',
      versionCode: 68,
      size: '68.8 MB',
      shortCode: '88103',
      category: 'Streaming',
      category_vi: 'Phim & Trực Tuyến',
      category_en: 'Streaming',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 952,
      sha256: '9afb6d317b70ccd30a5b0eb8c7972c629d82c8c9beec5a25a3ba24dedf27e13c',
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/cloudstream-kv.apk',
      description: 'Bản dựng tối ưu hóa riêng cho hệ sinh thái KV: Cài sẵn plugin mở rộng KV-Netflix VIP tốc độ cao, hỗ trợ chuẩn 4K HDR10, âm thanh 5.1 và phụ đề Vietsub đồng bộ.',
      description_vi: 'Bản dựng tối ưu hóa riêng cho hệ sinh thái KV: Cài sẵn plugin mở rộng KV-Netflix VIP tốc độ cao, hỗ trợ chuẩn 4K HDR10, âm thanh 5.1 và phụ đề Vietsub đồng bộ.',
      description_en: 'Custom-engineered for the KV ecosystem: Pre-loaded with private high-speed KV-Netflix VIP extension, 4K HDR10, 5.1 surround audio, and synchronized Vietsub.',
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
    },
    {
      id: 'jellyfin-kv',
      name: 'Jellyfin TV',
      edition: 'Bản Tối Ưu · 4K HDR Direct Play',
      edition_vi: 'Bản Tối Ưu · 4K HDR Direct Play',
      edition_en: 'KV-Optimized Edition',
      packageName: 'org.jellyfin.androidtv',
      version: '0.19.10',
      versionCode: 191099,
      size: '20.9 MB',
      shortCode: '88101',
      category: 'Media Center',
      category_vi: 'Máy Chủ Phim & Nhạc',
      category_en: 'Media Center',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 635,
      sha256: '04a486b3f7c3148e3e400d313de12af121f9008f354857ef519cdea495f74f3c',
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/jellyfin-kv.apk',
      description: 'Bản dựng Jellyfin tùy biến cho Android TV với khả năng tự động kết nối máy chủ KV Media, phát trực tiếp 4K HEVC 10-bit không cần transcode và hỗ trợ phụ đề tiếng Việt / tiếng Anh.',
      description_vi: 'Bản dựng Jellyfin tùy biến cho Android TV với khả năng tự động kết nối máy chủ KV Media, phát trực tiếp 4K HEVC 10-bit không cần transcode và hỗ trợ phụ đề tiếng Việt / tiếng Anh.',
      description_en: 'Custom Android TV build of Jellyfin with pre-configured KV Media Server discovery, Direct Play 4K HEVC 10-bit profiles, and styled Vietnamese/English subtitles.',
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
      category_vi: 'Trung Tâm Giải Trí',
      category_en: 'Media Center',
      arch: 'Universal (arm64-v8a)',
      downloads: 764,
      sha256: '0c95c81202e449da3165dbbb134fdea9e1687ce84ec49cc3ac3181e706eddf58',
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kodi-kv.apk',
      description: 'Bản Kodi 21.3 Omega dựng sẵn với Addon KV-Netflix ngay trên màn hình chính, vào thẳng kho phim 4K không hỏi quyền rườm rà, tinh chỉnh bộ nhớ đệm cho TV Box và phụ đề tiếng Việt.',
      description_vi: 'Bản Kodi 21.3 Omega dựng sẵn với Addon KV-Netflix ngay trên màn hình chính, vào thẳng kho phim 4K không hỏi quyền rườm rà, tinh chỉnh bộ nhớ đệm cho TV Box và phụ đề tiếng Việt.',
      description_en: 'Ready-to-run Kodi 21.3 Omega build featuring the KV-Netflix 4K poster wall on the Home screen, zero-prompt launch, tuned memory cache for TV boxes, and pre-installed Vietnamese subtitles.',
      presetFeatures: [
        'Cài sẵn Addon KV-Netflix (plugin.video.kvnetflix) trên màn hình chính',
        'Khởi chạy tức thì vào kho phim 4K không hỏi quyền truy cập tệp',
        'Tệp advancedsettings.xml tối ưu bộ nhớ đệm cho Box 1GB/2GB RAM',
        'Passthrough âm thanh Dolby Atmos / DTS-HD & phụ đề tiếng Việt',
      ],
      presetFeatures_vi: [
        'Cài sẵn Addon KV-Netflix (plugin.video.kvnetflix) trên màn hình chính',
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
    },
    {
      id: 'kv-netflix',
      name: 'KV-Netflix',
      edition: 'Bản TV Remote & 4K HDR',
      edition_vi: 'Bản TV Remote & 4K HDR',
      edition_en: 'TV Remote & 4K HDR Mod',
      packageName: 'com.streamflow.tv',
      version: '1.4.6-kv',
      versionCode: 117,
      size: '24.1 MB',
      shortCode: '88104',
      category: 'Originals & Cinema',
      category_vi: 'Điện Ảnh & Phim Gốc',
      category_en: 'Originals & Cinema',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 1180,
      sha256: '25f5af849bbc6f447292c163c6199a07cfb2f09baa963902e2c4e3cd60357dca',
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-netflix-tv.apk',
      description: 'Tối ưu hóa cho các dòng Android TV Box không đạt chứng chỉ Netflix gốc. Hỗ trợ điều hướng remote D-Pad mượt mà không cần chuột bay, tự thích ứng Widevine L1/L3 và âm thanh 5.1.',
      description_vi: 'Tối ưu hóa cho các dòng Android TV Box không đạt chứng chỉ Netflix gốc. Hỗ trợ điều hướng remote D-Pad mượt mà không cần chuột bay, tự thích ứng Widevine L1/L3 và âm thanh 5.1.',
      description_en: 'Engineered for Android TV boxes that fail Netflix certification checks. Provides native D-Pad remote focus navigation without an air-mouse, adaptive Widevine L1/L3 fallback, and 5.1 audio.',
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
    },
    {
      id: 'kv-tube',
      name: 'KV-Tube',
      edition: 'Bản Nhẹ · Chặn Quảng Cáo 4K',
      edition_vi: 'Bản Nhẹ · Chặn Quảng Cáo 4K',
      edition_en: 'Lightweight Ad-Free 4K Client',
      packageName: 'org.schabi.newpipe',
      version: '0.29.1-kv',
      versionCode: 1015,
      size: '11.0 MB',
      shortCode: '88105',
      category: 'Video & Music',
      category_vi: 'Video & Âm Nhạc',
      category_en: 'Video & Music',
      arch: 'Universal (arm64-v8a + armeabi-v7a + x86_64)',
      downloads: 812,
      sha256: '8d7a7e39881fdd607dc14a4afc932cf08f402c759a43ba2b6e33268eaa6c48e4',
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-tube.apk',
      description: 'Bản dựng KV-Tube (NewPipe KV-Mod) siêu nhẹ chỉ 11MB cho Android TV & Box cấu hình thấp. Bật sẵn độ phân giải 4K/1080p60, giao diện đen OLED, xu hướng Việt Nam và phát nhạc nền khi tắt màn hình.',
      description_vi: 'Bản dựng KV-Tube (NewPipe KV-Mod) siêu nhẹ chỉ 11MB cho Android TV & Box cấu hình thấp. Bật sẵn độ phân giải 4K/1080p60, giao diện đen OLED, xu hướng Việt Nam và phát nhạc nền khi tắt màn hình.',
      description_en: 'Ultra-lightweight 11MB KV-Tube (NewPipe KV-Mod) client for Android TV. Pre-configured with 4K/1080p60 default resolution, OLED black theme, Vietnam trending feed, and background audio playback.',
      presetFeatures: [
        'Siêu nhẹ 11MB, khởi động tức thì trên TV Box RAM 1GB/2GB',
        'Bật sẵn độ phân giải 4K / 1080p60 và giao diện đen OLED',
        'Chặn 100% quảng cáo, hỗ trợ nghe nhạc nền & tải video',
        'Đặt sẵn ngôn ngữ Tiếng Việt và bảng xu hướng Việt Nam',
      ],
      presetFeatures_vi: [
        'Siêu nhẹ 11MB, khởi động tức thì trên TV Box RAM 1GB/2GB',
        'Bật sẵn độ phân giải 4K / 1080p60 và giao diện đen OLED',
        'Chặn 100% quảng cáo, hỗ trợ nghe nhạc nền & tải video',
        'Đặt sẵn ngôn ngữ Tiếng Việt và bảng xu hướng Việt Nam',
      ],
      presetFeatures_en: [
        'Ultra-light 11MB package for 1GB/2GB RAM TV boxes',
        'Pre-configured 4K / 1080p60 resolution and OLED black theme',
        '100% ad-free with background playback and video downloads',
        'Pre-set Vietnamese locale and Vietnam trending feed',
      ],
    },
    {
      id: 'smarttube-tv',
      name: 'SmartTube TV',
      edition: 'YouTube 4K60 Không Quảng Cáo',
      edition_vi: 'YouTube 4K60 Không Quảng Cáo',
      edition_en: 'Ad-Free 4K60 YouTube Client',
      packageName: 'org.smarttube.stable',
      version: '32.68s',
      versionCode: 2458,
      size: '33.4 MB',
      shortCode: '88106',
      category: 'Video & Music',
      category_vi: 'Video & Âm Nhạc',
      category_en: 'Video & Music',
      arch: 'Universal (arm64-v8a + armeabi-v7a + x86)',
      downloads: 1420,
      sha256: '355b3abc7fb71b6d07ee3dd6dc056e6e36df6a6042a95902a56c2c17e99202a4',
      apkUrl: 'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/smarttube-tv.apk',
      description: 'Ứng dụng xem YouTube không quảng cáo tốt nhất cho Android TV / Google TV / TV Box (yuliskov/SmartTube). Chặn 100% quảng cáo, tích hợp sẵn SponsorBlock tự bỏ qua đoạn giới thiệu, hỗ trợ 4K 60fps HDR & điều khiển bằng remote TV mượt mà.',
      description_vi: 'Ứng dụng xem YouTube không quảng cáo tốt nhất cho Android TV / Google TV / TV Box (yuliskov/SmartTube). Chặn 100% quảng cáo, tích hợp sẵn SponsorBlock tự bỏ qua đoạn giới thiệu, hỗ trợ 4K 60fps HDR & điều khiển bằng remote TV mượt mà.',
      description_en: 'Official SmartTube Stable universal release for Android TV & TV Boxes. 100% ad-free YouTube experience with built-in SponsorBlock, DeArrow, 4K 60fps HDR VP9/AV1 hardware decoding, and full D-Pad remote control.',
      presetFeatures: [
        'Chặn 100% quảng cáo video, banner và quảng cáo chèn giữa',
        'Tích hợp sẵn SponsorBlock tự động bỏ qua intro, outro & đoạn quảng cáo tài trợ',
        'Hỗ trợ độ phân giải 4K 60fps HDR10 / VP9 / AV1 mượt mà trên mọi TV Box',
        'Đăng nhập tài khoản Google đồng bộ lịch sử & kênh đăng ký không cần MicroG',
      ],
      presetFeatures_vi: [
        'Chặn 100% quảng cáo video, banner và quảng cáo chèn giữa',
        'Tích hợp sẵn SponsorBlock tự động bỏ qua intro, outro & đoạn quảng cáo tài trợ',
        'Hỗ trợ độ phân giải 4K 60fps HDR10 / VP9 / AV1 mượt mà trên mọi TV Box',
        'Đăng nhập tài khoản Google đồng bộ lịch sử & kênh đăng ký không cần MicroG',
      ],
      presetFeatures_en: [
        '100% Ad-free playback (zero pre-roll, mid-roll, or sponsored banners)',
        'Built-in SponsorBlock auto-skips intros, outros, and sponsor segments',
        'Full 4K 60fps HDR10 / VP9 / AV1 hardware acceleration for Android TV',
        'Direct Google account sign-in & subscription sync without Google Play Services',
      ],
    },
  ],
  ads: [
    {
      id: 'ad-vip-box',
      title: 'Cài Đặt Hộp KV-TV VIP — Biến Mọi Android TV Thành Rạp Phim 4K',
      title_vi: 'Cài Đặt Hộp KV-TV VIP — Biến Mọi Android TV Thành Rạp Phim 4K',
      title_en: 'KV-TV VIP Box Setup — Turn any Android TV into a 4K Cinema Hub',
      subtitle: 'Jellyfin, Kodi 21 Omega, CloudStream Vietsub & SmartTube 4K60 không quảng cáo sẵn sàng trong 60 giây.',
      subtitle_vi: 'Jellyfin, Kodi 21 Omega, CloudStream Vietsub & SmartTube 4K60 không quảng cáo sẵn sàng trong 60 giây.',
      subtitle_en: 'Pre-tuned Jellyfin, Kodi 21 Omega, CloudStream Vietsub & Ad-Free 4K60 SmartTube ready in 60 seconds.',
      badge: 'FEATURED',
      ctaText: 'Khám Phá Bản Cài Sẵn',
      ctaText_vi: 'Khám Phá Bản Cài Sẵn',
      ctaText_en: 'Explore Pre-Set Apps',
      ctaUrl: '#metro-grid',
      active: true,
      impressions: 4820,
      clicks: 612,
    },
    {
      id: 'ad-vps-cdn',
      title: 'Mạng ThueVPSGiaRe Tốc Độ Cao VN — Tải Trực Tiếp APK 1Gbps',
      title_vi: 'Mạng ThueVPSGiaRe Tốc Độ Cao VN — Tải Trực Tiếp APK 1Gbps',
      title_en: 'ThueVPSGiaRe High-Speed VN Edge CDN — 1Gbps Direct APK Downloads',
      subtitle: 'Máy chủ NVMe VPS độ trễ thấp tại Việt Nam với mã tải Downloader 5 số (88101–88106).',
      subtitle_vi: 'Máy chủ NVMe VPS độ trễ thấp tại Việt Nam với mã tải Downloader 5 số (88101–88106).',
      subtitle_en: 'Hosted on low-latency Vietnam NVMe VPS with instant AFTVnews Downloader short-codes (88101–88106).',
      badge: 'SPONSOR',
      ctaText: 'Nhập Mã Số',
      ctaText_vi: 'Nhập Mã Số',
      ctaText_en: 'Dial Short-Code',
      ctaUrl: '/go/88103',
      active: true,
      impressions: 3190,
      clicks: 284,
    },
    {
      id: 'ad-cloudstream-44',
      title: 'Phát Hành CloudStream KV-PreSetup v4.8 — Tích Hợp Kho Phim KV-Netflix VIP',
      title_vi: 'Phát Hành CloudStream KV-PreSetup v4.8 — Tích Hợp Kho Phim KV-Netflix VIP',
      title_en: 'CloudStream KV-PreSetup v4.8 Released — KV-Netflix 4K VIP Provider',
      subtitle: 'Bản quyền riêng, kho phim 4K Vietsub mượt mà và bypass chặn nhà mạng qua Cloudflare DoH 1.1.1.1.',
      subtitle_vi: 'Bản quyền riêng, kho phim 4K Vietsub mượt mà và bypass chặn nhà mạng qua Cloudflare DoH 1.1.1.1.',
      subtitle_en: 'Includes KV-Netflix VIP repo, 4K Vietsub stream selector, and Cloudflare 1.1.1.1 DoH bypass.',
      badge: 'NEW RELEASE',
      ctaText: 'Mã: 88103',
      ctaText_vi: 'Mã: 88103',
      ctaText_en: 'Code: 88103',
      ctaUrl: '/go/88103',
      active: true,
      impressions: 5410,
      clicks: 890,
    },
  ],
};

const PIVOT_DESCRIPTIONS = {
  store:
    '<strong>Pre-Configured Android TV Storefront</strong> — Zero manual repo typing. Every APK ships with KV-TV Vietnamese &amp; Global 4K repositories, subtitle profiles, and AFTVnews Downloader short-codes ready out of the box.',
  'pre-sets':
    '<strong>KV-TV Pre-Set Builds &amp; Backup Packs</strong> — Download standalone <code>type=preset</code> configuration archives or pre-configured APKs detailing every pre-installed extension, subtitle provider, and player flag.',
  'short-codes':
    '<strong>AFTVnews 5-Digit Short-Code Directory (88101–88106)</strong> — Dial any 5-digit short-code or copy with one click to fetch pre-configured APKs directly on your Android TV box.',
  'phone-qr':
    '<strong>Phone &amp; Desktop Promotional &amp; Sideload Hub</strong> — Scan the live QR code with your phone camera, explore sponsor campaigns, or sideload packages across your home network.',
};

const state = {
  pivot: 'store',
  currentCode: '88103',
  activeAppId: 'cloudstream-kv',
  promoSearchQuery: '',
  catalog: structuredClone(FALLBACK_CATALOG),
  isTVApp: typeof window.KVTVBridge !== 'undefined',
  appStatuses: {},
};

if (state.isTVApp) {
  document.body.classList.add('is-tv-app');
  document.documentElement.classList.add('is-tv-app');
}

function checkIsTVApp() {
  if (typeof window.KVTVBridge !== 'undefined') {
    state.isTVApp = true;
    document.body.classList.add('is-tv-app');
    document.documentElement.classList.add('is-tv-app');
    return true;
  }
  return false;
}

function syncInstalledAppStatuses() {
  if (!checkIsTVApp() || !window.KVTVBridge) return;
  try {
    const payload = (state.catalog.apps || []).map((a) => ({
      packageName: a.packageName,
      versionCode: Number(a.versionCode || 0),
      id: a.id,
    }));
    const raw = window.KVTVBridge.scanCatalogStatuses(JSON.stringify(payload));
    state.appStatuses = JSON.parse(raw || '{}');
    updateAppStatusBadges();
  } catch (err) {
    console.error('[KVTVBridge] syncInstalledAppStatuses error:', err);
  }
}

function updateAppStatusBadges() {
  if (!state.isTVApp) return;
  const isVi = getCurrentLanguage() !== 'en';

  // Ensure inner tile links/chips don't hijack TV D-Pad tile-to-tile navigation
  for (const innerEl of document.querySelectorAll('#metro-grid .kv-hero-btn, #metro-grid .kv-tile-chip')) {
    innerEl.setAttribute('tabindex', '-1');
  }

  for (const app of state.catalog.apps || []) {
    const status = state.appStatuses[app.packageName] || 'NOT_INSTALLED';
    const tile = document.querySelector(`.kv-tile[data-app-id="${CSS.escape(app.id)}"]`);
    if (tile) {
      let badgeEl = tile.querySelector('.kv-app-status-badge');
      if (!badgeEl) {
        badgeEl = document.createElement('span');
        badgeEl.className = 'kv-app-status-badge';
        const metaRow = tile.querySelector('.kv-tile-meta-row') || tile.querySelector('.kv-tile-bottom');
        if (metaRow) metaRow.prepend(badgeEl);
      }
      badgeEl.className = `kv-app-status-badge is-${status.toLowerCase().replace(/_/g, '-')}`;
      if (status === 'INSTALLED') {
        badgeEl.textContent = isVi ? '✓ ĐÃ CÀI ĐẶT' : '✓ INSTALLED';
      } else if (status === 'UPDATE') {
        badgeEl.textContent = isVi ? '▲ CÓ BẢN MỚI' : '▲ UPDATE';
      } else {
        badgeEl.textContent = isVi ? '○ CHƯA CÀI' : '○ NOT INSTALLED';
      }

      if (app.id === 'cloudstream-kv') {
        const heroPrimaryBtn = tile.querySelector('.kv-hero-actions .kv-hero-btn:first-child');
        if (heroPrimaryBtn) {
          heroPrimaryBtn.removeAttribute('href');
          if (status === 'INSTALLED') {
            heroPrimaryBtn.textContent = isVi ? 'MỞ ỨNG DỤNG' : 'OPEN APP';
            heroPrimaryBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.KVTVBridge?.launchApp(app.packageName);
            };
          } else {
            heroPrimaryBtn.textContent =
              status === 'UPDATE'
                ? isVi
                  ? 'CẬP NHẬT (88103)'
                  : 'UPDATE (88103)'
                : isVi
                ? 'CÀI ĐẶT (88103)'
                : 'INSTALL (88103)';
            heroPrimaryBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.KVTVBridge?.installApp('/api/download/cloudstream-kv?type=apk', app.name);
            };
          }
        }
      }

      if (app.id === 'kv-store') {
        const storeBtn = document.getElementById('kv-store-inline-dl-btn');
        if (storeBtn) {
          storeBtn.removeAttribute('href');
          storeBtn.removeAttribute('download');
          storeBtn.textContent = isVi ? `✓ ĐANG CHẠY v${app.version}` : `✓ RUNNING v${app.version}`;
          storeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openAppDialog('kv-store');
          };
        }
      }
    }
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let toastTimer = null;
function showToast(message) {
  const banner = document.getElementById('kv-toast-banner');
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    banner.hidden = true;
  }, 3200);
}

function findApp(identifier) {
  if (!identifier) return state.catalog.apps[0];
  const needle = String(identifier).trim().toLowerCase();
  return (
    state.catalog.apps.find(
      (a) =>
        String(a.id).toLowerCase() === needle ||
        String(a.shortCode).toLowerCase() === needle ||
        String(a.id).toLowerCase().startsWith(needle)
    ) || null
  );
}

/**
 * Determine initial pivot from URL query (`?mode=promo` -> `phone-qr`, `?pivot=...`, etc.)
 */
function resolveInitialPivot() {
  const url = new URL(window.location.href);
  const pivotParam = (url.searchParams.get('pivot') || '').toLowerCase();
  if (['store', 'pre-sets', 'short-codes', 'phone-qr'].includes(pivotParam)) {
    return pivotParam;
  }
  const modeParam = (url.searchParams.get('mode') || '').toLowerCase();
  if (modeParam === 'promo' || modeParam === 'web' || modeParam === 'mobile') {
    return 'phone-qr';
  }
  return 'store';
}

/**
 * Activate one of the 4 Metro Panorama pivots:
 * - 'store'
 * - 'pre-sets'
 * - 'short-codes'
 * - 'phone-qr'
 */
function activatePivot(pivotName, options = {}) {
  const { updateUrl = true, focusTarget = false, scrollToSection = false } = options;
  const normalized = ['store', 'pre-sets', 'short-codes', 'phone-qr'].includes(pivotName)
    ? pivotName
    : 'store';
  state.pivot = normalized;
  document.documentElement.setAttribute('data-pivot', normalized);

  // 1. Update Panorama Pivot buttons
  for (const btn of document.querySelectorAll('.pivot-btn[data-pivot]')) {
    const isSelected = btn.getAttribute('data-pivot') === normalized;
    btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    btn.classList.toggle('is-active', isSelected);
  }

  // 2. Update Topbar Navigation links
  for (const link of document.querySelectorAll('[data-nav-pivot]')) {
    const isCurrent = link.getAttribute('data-nav-pivot') === normalized;
    link.classList.toggle('is-active', isCurrent);
    if (isCurrent) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  // 3. Update Panorama Subbar Deck copy
  const deckTextEl = document.getElementById('panorama-deck-text');
  if (deckTextEl) {
    const key = `decks.${normalized.replace(/-/g, '')}`;
    deckTextEl.innerHTML = t(key);
  }

  // 4. Toggle Store Panorama Grid & Lower Strip vs Dedicated Pivot Stage Panels
  const metroGrid = document.getElementById('metro-grid');
  const lowerStrip = document.getElementById('metro-lower-strip');
  const presetsPanel = document.getElementById('pivot-panel-presets');
  const shortcodesPanel = document.getElementById('pivot-panel-shortcodes');
  const phoneQrPanel = document.getElementById('pivot-panel-phoneqr');

  if (metroGrid) metroGrid.hidden = normalized !== 'store';
  if (lowerStrip) lowerStrip.hidden = normalized !== 'store';
  if (presetsPanel) presetsPanel.hidden = normalized !== 'pre-sets';
  if (shortcodesPanel) shortcodesPanel.hidden = normalized !== 'short-codes';
  if (phoneQrPanel) phoneQrPanel.hidden = normalized !== 'phone-qr';

  // 6. Sync URL state
  if (updateUrl && window.history?.replaceState) {
    const url = new URL(window.location.href);
    if (normalized === 'phone-qr') {
      url.searchParams.set('mode', 'promo');
      url.searchParams.delete('pivot');
    } else if (normalized === 'store') {
      url.searchParams.set('mode', 'tv');
      url.searchParams.delete('pivot');
    } else {
      url.searchParams.set('pivot', normalized);
      url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', url.toString());
  }

  // 7. Optional focus/scroll assist when user switches pivot interactively
  if (focusTarget) {
    if (normalized === 'short-codes') {
      const dialerTile = document.querySelector('#metro-grid [data-tile-kind="dialer"]');
      if (dialerTile instanceof HTMLElement) setRovingFocus(dialerTile, false);
    } else if (normalized === 'phone-qr') {
      const qrTile = document.querySelector('#metro-grid [data-tile-kind="qr"]');
      if (qrTile instanceof HTMLElement) setRovingFocus(qrTile, false);
    }
  }

  if (scrollToSection) {
    const panelMap = {
      'pre-sets': presetsPanel,
      'short-codes': shortcodesPanel,
      'phone-qr': phoneQrPanel,
    };
    const targetPanel = panelMap[normalized];
    if (targetPanel) {
      targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

/**
 * Render the Pre-Set Backup Packs & Optimization Matrix (#presets-matrix-grid)
 */
function renderPresetsMatrix() {
  const grid = document.getElementById('presets-matrix-grid');
  if (!grid) return;

  const currentLang = getCurrentLanguage();
  grid.innerHTML = state.catalog.apps
    .map((app) => {
      const colorClass = METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt';
      const versionClean = String(app.version || '').replace(/^v/i, '');
      const localizedEdition = tField(app, 'edition', currentLang);
      const localizedDesc = tField(app, 'description', currentLang);
      const features =
        currentLang === 'en' && Array.isArray(app.presetFeatures_en)
          ? app.presetFeatures_en
          : Array.isArray(app.presetFeatures_vi)
          ? app.presetFeatures_vi
          : app.presetFeatures || [];

      const featuresHtml = features
        .map(
          (feat) => `
          <li>
            <span class="feature-bullet"></span>
            <span>${escapeHtml(feat)}</span>
          </li>`
        )
        .join('');

      return `
        <article class="kv-preset-card">
          <div class="kv-preset-banner ${colorClass}">
            <div>
              <h3 class="kv-preset-banner-title">${escapeHtml(app.name.toLowerCase())}</h3>
              <p>${escapeHtml(localizedEdition)}</p>
            </div>
            <span class="kv-code-stamp tabular">CODE ${escapeHtml(app.shortCode)}</span>
          </div>
          <div class="kv-preset-body">
            <p class="kv-preset-summary">${escapeHtml(localizedDesc)}</p>
            <div class="kv-dialog-specs dialog-specs">
              <div class="spec-item">
                <span class="spec-label">${t('matrix.archive_label')}</span>
                <span class="spec-value tabular">${escapeHtml(app.id)}-preset.zip</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">${t('dialog_app.spec_ver_size')}</span>
                <span class="spec-value tabular">v${escapeHtml(versionClean)} · ${escapeHtml(app.size)}</span>
              </div>
            </div>
            <ul class="feature-list">${featuresHtml}</ul>
          </div>
          <div class="kv-preset-actions">
            <a
              class="kv-btn kv-btn--primary"
              href="/api/download/${encodeURIComponent(app.id)}?type=preset"
              data-app-download="${escapeHtml(app.id)}"
            >
              <span>${t('matrix.btn_download_preset')}</span>
            </a>
            <a
              class="kv-btn"
              href="/api/download/${encodeURIComponent(app.id)}?type=apk"
              data-app-download="${escapeHtml(app.id)}"
            >
              <span>${t('matrix.btn_direct_apk', { code: app.shortCode })}</span>
            </a>
            <button type="button" class="kv-btn" data-open-app="${escapeHtml(app.id)}">
              <span>${t('matrix.btn_inspect_qr')}</span>
            </button>
          </div>
        </article>`;
    })
    .join('');
}

/**
 * Render the 5-Digit AFTVnews Downloader Short-Code Directory (#shortcodes-directory-list)
 */
function renderShortCodesDirectory() {
  const listEl = document.getElementById('shortcodes-directory-list');
  if (!listEl) return;

  const currentLang = getCurrentLanguage();
  listEl.innerHTML = state.catalog.apps
    .map((app) => {
      const colorClass = METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt';
      const versionClean = String(app.version || '').replace(/^v/i, '');
      const localizedEdition = tField(app, 'edition', currentLang);
      return `
        <article class="kv-shortcode-row">
          <div class="kv-shortcode-id">
            <span class="kv-shortcode-num ${colorClass} tabular">${escapeHtml(app.shortCode)}</span>
            <div>
              <h3 class="kv-shortcode-info-title">${escapeHtml(app.name.toLowerCase())}</h3>
              <p class="kv-shortcode-info-sub tabular">
                ${escapeHtml(localizedEdition)} · v${escapeHtml(versionClean)} · ${escapeHtml(app.size)}
              </p>
            </div>
          </div>
          <div class="kv-shortcode-btns">
            <button type="button" class="kv-btn kv-btn--emerald" data-copy-code="${escapeHtml(app.shortCode)}">
              <span>${t('directory.btn_copy')} ${escapeHtml(app.shortCode)}</span>
            </button>
            <a
              class="kv-btn kv-btn--primary"
              href="/api/download/${encodeURIComponent(app.id)}?type=apk"
              data-app-download="${escapeHtml(app.id)}"
            >
              <span>${t('directory.btn_apk')}</span>
            </a>
            <button type="button" class="kv-btn" data-open-app="${escapeHtml(app.id)}">
              <span>${t('directory.btn_qr')} &amp; SPECS</span>
            </button>
          </div>
        </article>`;
    })
    .join('');
}

/**
 * Render the Phone & Desktop Promotional & Ad Landing Portal (#pivot-panel-phoneqr)
 */
function renderPromoPortal() {
  const currentLang = getCurrentLanguage();
  const adsGrid = document.getElementById('promo-ads-grid');
  if (adsGrid) {
    const adPalette = ['kv-tile--cobalt', 'kv-tile--violet', 'kv-tile--teal'];
    const activeAds = (state.catalog.ads || []).filter((ad) => ad.active !== false);
    adsGrid.innerHTML = activeAds
      .map((ad, idx) => {
        const bgClass = adPalette[idx % adPalette.length];
        const titleLoc = tField(ad, 'title', currentLang);
        const subLoc = tField(ad, 'subtitle', currentLang);
        const ctaLoc = tField(ad, 'ctaText', currentLang) || t('promo.open_btn');
        return `
          <article class="kv-ad-tile ${bgClass}">
            <div>
              <h4 class="kv-ad-title">${escapeHtml(titleLoc.toLowerCase())}</h4>
              <p class="kv-ad-subtitle">${escapeHtml(subLoc)}</p>
            </div>
            <div class="kv-ad-footer tabular">
              <span class="kv-code-stamp">${escapeHtml(ad.badge || 'SPONSOR')} · ${Number(ad.impressions || 0).toLocaleString('en-US')} VIEWS</span>
              <button
                type="button"
                class="kv-btn kv-btn--primary kv-btn--sm"
                data-ad-id="${escapeHtml(ad.id)}"
                data-ad-url="${escapeHtml(ad.ctaUrl || '#metro-grid')}"
              >
                <span>${escapeHtml(ctaLoc)}</span>
              </button>
            </div>
          </article>`;
      })
      .join('');
  }

  const tableBody = document.getElementById('promo-catalog-table-body');
  if (tableBody) {
    const q = state.promoSearchQuery.trim().toLowerCase();
    const filtered = state.catalog.apps.filter((app) => {
      if (!q) return true;
      const haystack = [
        app.name,
        tField(app, 'edition', currentLang),
        app.shortCode,
        app.packageName,
        tField(app, 'description', currentLang),
        ...(currentLang === 'vi' && app.presetFeatures_vi ? app.presetFeatures_vi : (app.presetFeatures || [])),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    tableBody.innerHTML = filtered
      .map((app) => {
        const versionClean = String(app.version || '').replace(/^v/i, '');
        const colorClass = METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt';
        const localizedEdition = tField(app, 'edition', currentLang);

        const status = state.isTVApp ? (state.appStatuses[app.packageName] || 'NOT_INSTALLED') : null;
        let statusBadgeHtml = '';
        if (status === 'INSTALLED') {
          statusBadgeHtml = `<span class="kv-app-status-badge is-installed" style="margin-left: 6px;">✓ ĐÃ CÀI</span>`;
        } else if (status === 'UPDATE') {
          statusBadgeHtml = `<span class="kv-app-status-badge is-update" style="margin-left: 6px;">▲ CÓ BẢN MỚI</span>`;
        }

        let actionsHtml = '';
        if (state.isTVApp) {
          if (status === 'INSTALLED') {
            actionsHtml = `
              <button type="button" class="kv-btn kv-btn--primary kv-btn--sm" data-tv-launch="${escapeHtml(app.packageName)}">[ MỞ ]</button>
              <button type="button" class="kv-btn kv-btn--sm" data-tv-uninstall="${escapeHtml(app.packageName)}" style="color: var(--kv-crimson); border-color: var(--kv-crimson);">[ GỠ ]</button>
              <button type="button" class="kv-btn kv-btn--sm" data-open-app="${escapeHtml(app.id)}">${t('directory.btn_qr')}</button>
            `;
          } else if (status === 'UPDATE') {
            actionsHtml = `
              <button type="button" class="kv-btn kv-btn--primary kv-btn--sm" data-tv-install="${escapeHtml(app.id)}">[ CẬP NHẬT ]</button>
              <button type="button" class="kv-btn kv-btn--sm" data-open-app="${escapeHtml(app.id)}">${t('directory.btn_qr')}</button>
            `;
          } else {
            actionsHtml = `
              <button type="button" class="kv-btn kv-btn--primary kv-btn--sm" data-tv-install="${escapeHtml(app.id)}">[ CÀI ĐẶT ]</button>
              <button type="button" class="kv-btn kv-btn--sm" data-open-app="${escapeHtml(app.id)}">${t('directory.btn_qr')}</button>
            `;
          }
        } else {
          actionsHtml = `
            <a
              class="kv-btn kv-btn--primary kv-btn--sm"
              href="${app.id === 'kv-store' ? '/kv-store.apk' : `/api/download/${encodeURIComponent(app.id)}?type=apk`}"
              data-app-download="${escapeHtml(app.id)}"
            >APK</a>
            <a
              class="kv-btn kv-btn--sm"
              href="/api/download/${encodeURIComponent(app.id)}?type=preset"
              data-app-download="${escapeHtml(app.id)}"
            >PRE-SET</a>
            <button
              type="button"
              class="kv-btn kv-btn--sm"
              data-copy-code="${escapeHtml(app.shortCode)}"
            >${t('directory.btn_copy')} ${escapeHtml(app.shortCode)}</button>
            <button
              type="button"
              class="kv-btn kv-btn--sm"
              data-open-app="${escapeHtml(app.id)}"
            >${t('directory.btn_qr')}</button>
          `;
        }

        return `
          <tr class="tabular">
            <td data-label="${escapeHtml(t('promo.th_app'))}">
              <div>
                <strong>${escapeHtml(app.name)}</strong>${statusBadgeHtml}
                <div>${escapeHtml(localizedEdition)}</div>
              </div>
            </td>
            <td data-label="${escapeHtml(t('promo.th_code'))}">
              <span class="kv-code-stamp ${colorClass}">CODE ${escapeHtml(app.shortCode)}</span>
            </td>
            <td data-label="${escapeHtml(t('promo.th_pkg'))}"><code>${escapeHtml(app.packageName)}</code></td>
            <td data-label="${escapeHtml(t('promo.th_ver_size'))}">v${escapeHtml(versionClean)} · ${escapeHtml(app.size)}</td>
            <td data-label="${escapeHtml(t('promo.th_installs'))}">${Number(app.downloads || 0).toLocaleString('en-US')}</td>
            <td data-label="${escapeHtml(t('promo.th_actions'))}">
              <div class="kv-table-actions">
                ${actionsHtml}
              </div>
            </td>
          </tr>`;
      })
      .join('');
  }
}

/**
 * Hydrate live tiles, telemetry pills, and lower sponsor strip from state.catalog
 */
function hydrateLiveTilesAndStrip() {
  const currentLang = getCurrentLanguage();
  const metroGrid = document.getElementById('metro-grid');
  const dialerTile = metroGrid?.querySelector('[data-tile-kind="dialer"]') || null;
  let totalInstalls = 0;

  for (const app of state.catalog.apps) {
    totalInstalls += Number(app.downloads || 0);

    // Dynamically create and insert a Live Tile on #metro-grid if it doesn't exist yet
    if (metroGrid && app.id && app.id !== 'kv-store') {
      let existingTile = metroGrid.querySelector(`[data-app-id="${CSS.escape(app.id)}"]`);
      if (!existingTile) {
        const tileColorClass = METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt';
        const legacyColorClass = tileColorClass.replace('kv-tile--', 'tile-');
        const newTile = document.createElement('div');
        newTile.setAttribute('role', 'button');
        newTile.className = `kv-tile ${tileColorClass} kv-span-1x1 metro-tile ${legacyColorClass} span-1x1`;
        newTile.setAttribute('tabindex', '-1');
        newTile.setAttribute('data-tile-kind', 'app');
        newTile.setAttribute('data-app-id', app.id);
        newTile.setAttribute('data-short-code', app.shortCode || '');
        newTile.setAttribute('data-pivot-tags', 'store pre-sets short-codes');
        if (app.color && !METRO_TILE_CLASSES[app.id]) {
          newTile.style.backgroundColor = app.color;
        }
        const versionClean = String(app.version || '1.0').replace(/^v/i, '');
        const formattedDownloads = Number(app.downloads || 0).toLocaleString('en-US');
        newTile.innerHTML = `
          <div class="kv-tile-top tile-top">
            <svg class="kv-tile-glyph tile-glyph" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
              <rect x="5" y="9" width="38" height="30" />
              <polygon points="20,17 32,24 20,31" fill="currentColor" stroke="none" />
            </svg>
            <span class="kv-code-stamp code-stamp tabular" data-app-stamp="${escapeHtml(app.id)}">${escapeHtml(app.shortCode || '')}</span>
          </div>
          <div class="kv-tile-bottom tile-bottom">
            <span class="kv-tile-title tile-title">${escapeHtml(String(app.name || app.id).toLowerCase())}</span>
            <span class="kv-tile-edition tile-edition">${escapeHtml(tField(app, 'edition', currentLang))}</span>
            <div class="kv-tile-meta-row tile-meta-row">
              <span class="tabular" data-app-version="${escapeHtml(app.id)}">v${escapeHtml(versionClean)}</span>
              <span class="tabular" data-app-downloads="${escapeHtml(app.id)}">${formattedDownloads} ${escapeHtml(t('tiles.installs_suffix'))}</span>
            </div>
          </div>
        `;
        newTile.addEventListener('click', () => {
          setRovingFocus(newTile, false);
          openAppDialog(app.id);
        });
        newTile.addEventListener('focus', () => {
          const readout = document.getElementById('dpad-focus-readout');
          if (readout) {
            readout.textContent = newTile.getAttribute('data-short-code') || app.id;
          }
        });
        if (dialerTile && dialerTile.parentNode === metroGrid) {
          metroGrid.insertBefore(newTile, dialerTile);
        } else {
          metroGrid.appendChild(newTile);
        }
      }
    }

    const dlEl = document.querySelector(`[data-app-downloads="${CSS.escape(app.id)}"]`);
    if (dlEl) {
      const formatted = Number(app.downloads || 0).toLocaleString('en-US');
      const suffix = t('tiles.installs_suffix');
      dlEl.textContent = `${formatted} ${suffix}`;
    }
    const stampEl = document.querySelector(`[data-app-stamp="${CSS.escape(app.id)}"]`);
    if (stampEl && app.shortCode && app.size) {
      const parentTile = stampEl.closest('.kv-tile');
      const isSquare1x1 = parentTile && parentTile.classList.contains('kv-span-1x1');
      if (app.id === 'kv-store') {
        stampEl.textContent = app.size;
      } else if (isSquare1x1) {
        stampEl.textContent = app.shortCode;
      } else {
        stampEl.textContent = `${app.shortCode} · ${app.size}`;
      }
    }
    const verEl = document.querySelector(`[data-app-version="${CSS.escape(app.id)}"]`);
    if (verEl && app.version) {
      verEl.textContent = `v${String(app.version).replace(/^v/i, '')}`;
    }
    const tileBtn = document.querySelector(`[data-app-id="${CSS.escape(app.id)}"]`);
    if (tileBtn) {
      const editionEl = tileBtn.querySelector('.tile-edition');
      if (editionEl) {
        editionEl.textContent = tField(app, 'edition', currentLang);
      }
    }
  }

  const totalEl = document.getElementById('telemetry-downloads');
  if (totalEl && totalInstalls > 0) {
    totalEl.textContent = `${totalInstalls.toLocaleString('en-US')} ${t('telemetry.total_installs')}`;
  }
}

/**
 * Fetch live catalog from /api/catalog and update all views
 */
async function loadCatalog() {
  try {
    const deviceHint = state.pivot === 'phone-qr' ? 'desktop' : 'tv';
    const res = await fetch(`/api/catalog?device=${deviceHint}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.apps) && data.apps.length > 0) {
        state.catalog = {
          ...state.catalog,
          ...data,
        };
      }
    }
  } catch {
    // Offline or standalone preview: fallback catalog stays active
  }

  translateDom();
  hydrateLiveTilesAndStrip();
  renderPresetsMatrix();
  renderShortCodesDirectory();
  renderPromoPortal();
  updateDialerReadouts();
  syncInstalledAppStatuses();
}

/**
 * Open the App Command Modal Dialog (#metro-app-dialog)
 */
function openAppDialog(appIdentifier) {
  const app = findApp(appIdentifier) || state.catalog.apps[0];
  const appDialog = document.getElementById('metro-app-dialog');
  if (!app || !appDialog) return;

  state.activeAppId = app.id;

  const banner = document.getElementById('app-dialog-banner');
  if (banner) {
    banner.className = `kv-dialog-banner dialog-banner ${METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt'}`;
  }

  const currentLang = getCurrentLanguage();
  const versionClean = String(app.version || '').replace(/^v/i, '');
  const titleEl = document.getElementById('metro-dialog-title');
  const editionEl = document.getElementById('metro-dialog-edition');
  const descEl = document.getElementById('metro-dialog-desc');
  const codeEl = document.getElementById('metro-dialog-code');
  const verEl = document.getElementById('metro-dialog-version');
  const pkgEl = document.getElementById('metro-dialog-pkg');
  const archEl = document.getElementById('metro-dialog-arch');

  if (titleEl) titleEl.textContent = app.name.toLowerCase();
  if (editionEl) editionEl.textContent = tField(app, 'edition', currentLang);
  if (descEl) descEl.textContent = tField(app, 'description', currentLang);
  if (codeEl) codeEl.textContent = app.shortCode;
  if (verEl) verEl.textContent = `v${versionClean} · ${app.size}`;
  if (pkgEl) pkgEl.textContent = app.packageName;
  if (archEl) archEl.textContent = app.arch || 'Universal (arm64-v8a + armeabi-v7a)';

  const featureList = document.getElementById('metro-dialog-features');
  if (featureList) {
    featureList.innerHTML = '';
    const feats = (currentLang === 'vi' && app.presetFeatures_vi)
      ? app.presetFeatures_vi
      : (app.presetFeatures || []);
    for (const feat of feats) {
      const li = document.createElement('li');
      const bullet = document.createElement('span');
      bullet.className = `feature-bullet ${METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt'}`;
      const text = document.createElement('span');
      text.textContent = feat;
      li.append(bullet, text);
      featureList.appendChild(li);
    }
  }

  const qrUrl = `https://tv.vndns.net/go/${app.shortCode}`;
  const qrImg = document.getElementById('metro-dialog-qr');
  if (qrImg) {
    qrImg.src = `/api/qr?text=${encodeURIComponent(qrUrl)}&size=200`;
  }
  const qrCap = document.getElementById('metro-dialog-qr-caption');
  if (qrCap) {
    qrCap.textContent = t('dialog_app.qr_caption', { code: app.shortCode });
  }

  const apkBtn = document.getElementById('metro-dialog-apk-btn');
  const presetBtn = document.getElementById('metro-dialog-preset-btn');
  const copyBtn = document.getElementById('metro-dialog-copy-btn');
  const uninstallBtn = document.getElementById('metro-dialog-uninstall-btn');

  const downloadApkUrl = app.id === 'kv-store' ? '/kv-store.apk' : `/api/download/${encodeURIComponent(app.id)}?type=apk`;

  if (state.isTVApp && window.KVTVBridge) {
    const status =
      state.appStatuses[app.packageName] ||
      window.KVTVBridge.checkApp(app.packageName, Number(app.versionCode || 0));

    if (status === 'INSTALLED') {
      if (apkBtn) {
        apkBtn.removeAttribute('href');
        apkBtn.setAttribute('tabindex', '0');
        apkBtn.setAttribute('role', 'button');
        const span = apkBtn.querySelector('span');
        if (span) span.textContent = `[ ${t('dialog_app.btn_open') || 'MỞ ỨNG DỤNG'} ]`;
        apkBtn.onclick = (e) => {
          e.preventDefault();
          window.KVTVBridge.launchApp(app.packageName);
        };
      }
      if (uninstallBtn) {
        uninstallBtn.style.display = 'inline-flex';
        uninstallBtn.setAttribute('tabindex', '0');
        const uSpan = uninstallBtn.querySelector('span');
        if (uSpan) uSpan.textContent = `[ ${t('dialog_app.btn_uninstall') || 'GỠ CÀI ĐẶT'} ]`;
        uninstallBtn.onclick = (e) => {
          e.preventDefault();
          window.KVTVBridge.uninstallApp(app.packageName);
        };
      }
      if (presetBtn) {
        presetBtn.style.display = 'inline-flex';
        presetBtn.setAttribute('tabindex', '0');
        if (app.id === 'cloudstream-kv' || app.id === 'kodi-kv') {
          presetBtn.removeAttribute('href');
          presetBtn.setAttribute('role', 'button');
          const pSpan = presetBtn.querySelector('span');
          if (pSpan) {
            pSpan.textContent =
              currentLang === 'vi'
                ? '[ NẠP CẤU HÌNH KV-NETFLIX ]'
                : '[ APPLY KV-NETFLIX PRE-SET ]';
          }
          presetBtn.onclick = (e) => {
            e.preventDefault();
            if (window.KVTVBridge.preConfigureApp) {
              window.KVTVBridge.preConfigureApp(app.packageName);
            }
          };
        } else {
          presetBtn.href = `/api/download/${encodeURIComponent(app.id)}?type=preset`;
          const pSpan = presetBtn.querySelector('span');
          if (pSpan) pSpan.textContent = t('dialog_app.btn_preset') || 'TẢI GÓI CẤU HÌNH (.ZIP)';
          presetBtn.onclick = null;
        }
      }
    } else if (status === 'UPDATE') {
      if (apkBtn) {
        apkBtn.removeAttribute('href');
        apkBtn.setAttribute('tabindex', '0');
        apkBtn.setAttribute('role', 'button');
        const span = apkBtn.querySelector('span');
        if (span) span.textContent = `[ ${t('dialog_app.btn_update') || 'CẬP NHẬT'} ]`;
        apkBtn.onclick = (e) => {
          e.preventDefault();
          window.KVTVBridge.installApp(downloadApkUrl, app.name);
        };
      }
      if (uninstallBtn) {
        uninstallBtn.style.display = 'none';
      }
      if (presetBtn) {
        presetBtn.style.display = 'inline-flex';
        presetBtn.removeAttribute('href');
        presetBtn.setAttribute('tabindex', '0');
        presetBtn.setAttribute('role', 'button');
        const pSpan = presetBtn.querySelector('span');
        if (pSpan) pSpan.textContent = `[ ${t('dialog_app.btn_open') || 'MỞ BẢN HIỆN TẠI'} ]`;
        presetBtn.onclick = (e) => {
          e.preventDefault();
          window.KVTVBridge.launchApp(app.packageName);
        };
      }
    } else {
      // NOT_INSTALLED
      if (apkBtn) {
        apkBtn.removeAttribute('href');
        apkBtn.setAttribute('tabindex', '0');
        apkBtn.setAttribute('role', 'button');
        const span = apkBtn.querySelector('span');
        if (span) span.textContent = `[ ${t('dialog_app.btn_install') || 'CÀI ĐẶT'} ]`;
        apkBtn.onclick = (e) => {
          e.preventDefault();
          window.KVTVBridge.installApp(downloadApkUrl, app.name);
        };
      }
      if (uninstallBtn) {
        uninstallBtn.style.display = 'none';
      }
      if (presetBtn) {
        presetBtn.style.display = 'inline-flex';
        presetBtn.setAttribute('tabindex', '0');
        presetBtn.href = `/api/download/${encodeURIComponent(app.id)}?type=preset`;
        const pSpan = presetBtn.querySelector('span');
        if (pSpan) pSpan.textContent = t('dialog_app.btn_preset') || 'TẢI GÓI CẤU HÌNH (.ZIP)';
        presetBtn.onclick = null;
      }
    }
  } else {
    // Normal web browser
    if (apkBtn) {
      apkBtn.href = downloadApkUrl;
      apkBtn.setAttribute('data-app-download', app.id);
      const span = apkBtn.querySelector('span');
      if (span) span.textContent = t('dialog_app.btn_apk') || 'TẢI APK CÀI ĐẶT SẴN';
      apkBtn.onclick = null;
    }
    if (presetBtn) {
      presetBtn.href = `/api/download/${encodeURIComponent(app.id)}?type=preset`;
      presetBtn.setAttribute('data-app-download', app.id);
      const span = presetBtn.querySelector('span');
      if (span) span.textContent = t('dialog_app.btn_preset') || 'TẢI GÓI CẤU HÌNH (.ZIP)';
      presetBtn.onclick = null;
    }
    if (uninstallBtn) {
      uninstallBtn.style.display = 'none';
    }
  }
  if (copyBtn) {
    copyBtn.setAttribute('data-copy-code', app.shortCode);
  }

  if (!appDialog.open) {
    appDialog.showModal();
  }
  if (apkBtn) {
    requestAnimationFrame(() => apkBtn.focus());
  }
}

/**
 * Update both modal and inline Short-Code Dialer readouts
 */
function updateDialerReadouts() {
  const padded = state.currentCode.padEnd(5, '_');
  const match = findApp(state.currentCode);
  const isVi = getCurrentLanguage() === 'vi';
  let statusText = isVi ? 'Nhập mã 5 số...' : 'Type 5-digit code...';
  if (match) {
    statusText = `${match.name} · ${match.size}`;
  } else if (state.currentCode.length === 5) {
    statusText = isVi ? 'Mã hợp lệ: 88000, 88101–88106' : 'Valid codes: 88000, 88101–88106';
  }

  for (const id of ['dialer-digits', 'inline-dialer-digits']) {
    const el = document.getElementById(id);
    if (el) el.textContent = padded;
  }
  for (const id of ['dialer-match-label', 'inline-dialer-status']) {
    const el = document.getElementById(id);
    if (el) el.textContent = statusText;
  }
}

/**
 * Open the 5-Digit Short-Code Dialer Modal (#metro-dialer-dialog)
 */
function openDialerDialog(initialCode = '') {
  if (initialCode) {
    state.currentCode = String(initialCode);
  }
  updateDialerReadouts();
  const dialerDialog = document.getElementById('metro-dialer-dialog');
  if (dialerDialog && !dialerDialog.open) {
    dialerDialog.showModal();
  }
}

/**
 * Open the Phone & TV QR Companion Modal (#metro-qr-dialog)
 */
function openQrDialog() {
  const qrDialog = document.getElementById('metro-qr-dialog');
  if (qrDialog && !qrDialog.open) {
    qrDialog.showModal();
  }
}

/**
 * Record promotional ad click via POST /api/ads/:adId/click and perform target action
 */
async function handleAdClick(adId, ctaUrl) {
  if (adId) {
    try {
      await fetch(`/api/ads/${encodeURIComponent(adId)}/click`, { method: 'POST' });
    } catch {
      // Non-blocking telemetry
    }
  }
  const url = String(ctaUrl || '');
  if (url.startsWith('/go/')) {
    const code = url.slice('/go/'.length).trim();
    const app = findApp(code);
    if (app) {
      openAppDialog(app.id);
      return;
    }
  }
  activatePivot('store', { scrollToSection: false });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Roving Tabindex & 2D Spatial Navigation Engine
 */
function getAllGridTiles() {
  return Array.from(document.querySelectorAll('#metro-grid .metro-tile'));
}

function getVisibleGridTiles() {
  return getAllGridTiles().filter((el) =>
    typeof el.checkVisibility === 'function' ? el.checkVisibility() : true
  );
}

function setRovingFocus(targetTile, shouldFocus = true) {
  const allTiles = getAllGridTiles();
  for (const tile of allTiles) {
    tile.setAttribute('tabindex', '0');
    tile.toggleAttribute('data-roving-active', tile === targetTile);
  }
  if (shouldFocus && targetTile instanceof HTMLElement) {
    targetTile.focus();
    targetTile.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function findSpatialCandidate(currentEl, direction) {
  const candidates = getVisibleGridTiles().filter((el) => el !== currentEl);
  if (candidates.length === 0) return null;

  const currentRect = currentEl.getBoundingClientRect();
  const currentCenterX = currentRect.left + currentRect.width / 2;
  const currentCenterY = currentRect.top + currentRect.height / 2;
  const tolerance = 2;

  const inDirection = [];

  for (const candidate of candidates) {
    const rect = candidate.getBoundingClientRect();
    let gap = 0;
    let isValid = false;
    let overlapsPerpendicular = false;
    let perpCenterOffset = 0;

    if (direction === 'ArrowRight') {
      isValid = rect.left >= currentRect.right - tolerance;
      gap = Math.max(0, rect.left - currentRect.right);
      overlapsPerpendicular =
        rect.bottom > currentRect.top + tolerance &&
        rect.top < currentRect.bottom - tolerance;
      perpCenterOffset = Math.abs(rect.top + rect.height / 2 - currentCenterY);
    } else if (direction === 'ArrowLeft') {
      isValid = rect.right <= currentRect.left + tolerance;
      gap = Math.max(0, currentRect.left - rect.right);
      overlapsPerpendicular =
        rect.bottom > currentRect.top + tolerance &&
        rect.top < currentRect.bottom - tolerance;
      perpCenterOffset = Math.abs(rect.top + rect.height / 2 - currentCenterY);
    } else if (direction === 'ArrowDown') {
      isValid = rect.top >= currentRect.bottom - tolerance;
      gap = Math.max(0, rect.top - currentRect.bottom);
      overlapsPerpendicular =
        rect.right > currentRect.left + tolerance &&
        rect.left < currentRect.right - tolerance;
      perpCenterOffset = Math.abs(rect.left + rect.width / 2 - currentCenterX);
    } else if (direction === 'ArrowUp') {
      isValid = rect.bottom <= currentRect.top + tolerance;
      gap = Math.max(0, currentRect.top - rect.bottom);
      overlapsPerpendicular =
        rect.right > currentRect.left + tolerance &&
        rect.left < currentRect.right - tolerance;
      perpCenterOffset = Math.abs(rect.left + rect.width / 2 - currentCenterX);
    }

    if (isValid) {
      inDirection.push({
        candidate,
        gap,
        overlapsPerpendicular,
        perpCenterOffset,
      });
    }
  }

  if (inDirection.length === 0) return null;

  const overlapping = inDirection.filter((item) => item.overlapsPerpendicular);
  if (overlapping.length > 0) {
    overlapping.sort((a, b) => {
      if (Math.abs(a.gap - b.gap) > 1) return a.gap - b.gap;
      return a.perpCenterOffset - b.perpCenterOffset;
    });
    return overlapping[0].candidate;
  }

  const weight = 2.5;
  inDirection.sort(
    (a, b) =>
      a.gap + weight * a.perpCenterOffset - (b.gap + weight * b.perpCenterOffset)
  );
  return inDirection[0].candidate;
}

/**
 * Mandatory Light-Dismiss Fallback for browsers without native <dialog closedby="any">
 */
function initDialogLightDismiss() {
  const allDialogs = document.querySelectorAll('dialog');
  for (const dialog of allDialogs) {
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
    });
  }

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    allDialogs.forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    });
  }
}

/**
 * Start live clock in the panorama telemetry strip and CloudStream 3 live tile status ticker
 */
function startLiveTickers() {
  const clockEl = document.getElementById('tv-live-clock');
  if (clockEl) {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      clockEl.textContent = `${hh}:${mm}`;
      clockEl.setAttribute('datetime', now.toISOString());
    };
    updateClock();
    setInterval(updateClock, 15000);
  }

  let csIndex = 0;
  const csStatusEl = document.getElementById('cs-live-status');
  if (csStatusEl) {
    const messages = TRANSLATIONS[getCurrentLanguage()]?.tickers || TRANSLATIONS['vi'].tickers;
    csStatusEl.textContent = messages[0];
  }
  setInterval(() => {
    if (!csStatusEl) return;
    const messages = TRANSLATIONS[getCurrentLanguage()]?.tickers || TRANSLATIONS['vi'].tickers;
    csIndex = (csIndex + 1) % messages.length;
    csStatusEl.textContent = messages[csIndex];
  }, 3600);
}

/**
 * Bind all event listeners for Pivots, Live Tiles, Modals, Dialer, QR Switcher, and D-Pad Simulator
 */
function bindInteractions() {
  const gridEl = document.getElementById('metro-grid');
  const allTiles = getAllGridTiles();
  const allDialogs = Array.from(document.querySelectorAll('dialog'));

  // 1. Panorama Pivot buttons
  for (const btn of document.querySelectorAll('.pivot-btn[data-pivot]')) {
    btn.addEventListener('click', () => {
      const targetPivot = btn.getAttribute('data-pivot') || 'store';
      activatePivot(targetPivot, {
        updateUrl: true,
        focusTarget: true,
        scrollToSection: targetPivot !== 'store',
      });
    });
  }

  // 2. Topbar Navigation links with [data-nav-pivot]
  for (const link of document.querySelectorAll('[data-nav-pivot]')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPivot = link.getAttribute('data-nav-pivot') || 'store';
      activatePivot(targetPivot, {
        updateUrl: true,
        focusTarget: true,
        scrollToSection: targetPivot !== 'store',
      });
    });
  }

  document.getElementById('brand-home-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    activatePivot('store', { updateUrl: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 3. Live Tile Click & Focus handlers
  for (const tile of allTiles) {
    tile.addEventListener('click', (e) => {
      // Don't open tile dialog if clicking an inner action button or link
      if (e.target.closest('a, button, .kv-hero-btn, .kv-tile-chip') && e.target.closest('a, button, .kv-hero-btn, .kv-tile-chip') !== tile) {
        return;
      }
      setRovingFocus(tile, false);
      const kind = tile.getAttribute('data-tile-kind');
      if (kind === 'app') {
        openAppDialog(tile.getAttribute('data-app-id'));
      } else if (kind === 'dialer') {
        openDialerDialog();
      } else if (kind === 'qr') {
        openQrDialog();
      }
    });

    tile.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === tile) {
        e.preventDefault();
        tile.click();
      }
    });

    tile.addEventListener('focus', () => {
      const readout = document.getElementById('dpad-focus-readout');
      if (readout) {
        readout.textContent =
          tile.getAttribute('data-short-code') ||
          (tile.getAttribute('data-tile-kind') === 'dialer' ? 'DIAL' : 'QR');
      }
    });
  }

  // 4. Lower Strip & Promo Portal action triggers
  document.getElementById('open-dialer-strip-btn')?.addEventListener('click', () => {
    openDialerDialog();
  });
  document.getElementById('open-qr-strip-btn')?.addEventListener('click', () => {
    openQrDialog();
  });
  document.getElementById('promo-open-dialer-btn')?.addEventListener('click', () => {
    openDialerDialog();
  });
  document.getElementById('promo-launch-tv-btn')?.addEventListener('click', () => {
    activatePivot('store', { updateUrl: true });
    setRovingFocus(allTiles[0], true);
  });

  // 5. Dialer keypad & preset chips
  for (const btn of document.querySelectorAll('.dialer-key[data-key]')) {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key') || '';
      if (key === 'CLR') {
        state.currentCode = '';
      } else if (key === 'DEL') {
        state.currentCode = state.currentCode.slice(0, -1);
      } else if (state.currentCode.length < 5) {
        state.currentCode += key;
      } else {
        state.currentCode = key;
      }
      updateDialerReadouts();
    });
  }

  for (const chip of document.querySelectorAll('[data-preset-code]')) {
    chip.addEventListener('click', () => {
      state.currentCode = chip.getAttribute('data-preset-code') || '88103';
      updateDialerReadouts();
    });
  }

  const triggerDialerFetch = () => {
    const match = findApp(state.currentCode) || state.catalog.apps[0];
    const dlUrl = match.id === 'kv-store' ? '/kv-store.apk' : `/api/download/${encodeURIComponent(match.id)}?type=apk`;
    if (state.isTVApp && window.KVTVBridge) {
      window.KVTVBridge.installApp(dlUrl, match.name);
    } else {
      showToast(t('toasts.fetching', { code: match.shortCode }));
      window.location.href = dlUrl;
    }
  };

  document.getElementById('dialer-go-apk-btn')?.addEventListener('click', triggerDialerFetch);
  document.getElementById('inline-dialer-fetch-btn')?.addEventListener('click', triggerDialerFetch);

  document.getElementById('inline-dialer-modal-btn')?.addEventListener('click', () => {
    openDialerDialog();
  });

  document.getElementById('dialer-open-app-btn')?.addEventListener('click', () => {
    const match = findApp(state.currentCode) || state.catalog.apps[0];
    document.getElementById('metro-dialer-dialog')?.close();
    openAppDialog(match.id);
  });

  // 6. Phone & TV QR Companion switcher
  for (const chip of document.querySelectorAll('[data-qr-url]')) {
    chip.addEventListener('click', () => {
      for (const peer of document.querySelectorAll('[data-qr-url]')) {
        peer.classList.toggle('is-active', peer === chip);
      }
      const url = chip.getAttribute('data-qr-url') || 'https://tv.vndns.net';
      const label = chip.getAttribute('data-qr-label') || url;
      const img = document.getElementById('companion-qr-img');
      const cap = document.getElementById('companion-qr-caption');
      const urlReadout = document.getElementById('qr-selected-url');
      if (img) img.src = `/api/qr?text=${encodeURIComponent(url)}&size=220`;
      if (cap) cap.textContent = label;
      if (urlReadout) urlReadout.textContent = url;
    });
  }

  // 7. Promo Table Search Filter
  const searchInput = document.getElementById('promo-search-input');
  searchInput?.addEventListener('input', (e) => {
    state.promoSearchQuery = e.target.value || '';
    renderPromoPortal();
  });

  // 8. Delegated clicks for [data-open-app], [data-copy-code], [data-ad-id], [data-app-download]
  document.addEventListener('click', async (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const tvInstallBtn = target.closest('[data-tv-install]');
    if (tvInstallBtn) {
      const appId = tvInstallBtn.getAttribute('data-tv-install');
      const app = findApp(appId);
      if (app && window.KVTVBridge) {
        const url = app.id === 'kv-store' ? '/kv-store.apk' : `/api/download/${encodeURIComponent(app.id)}?type=apk`;
        window.KVTVBridge.installApp(url, app.name);
      }
      return;
    }

    const tvLaunchBtn = target.closest('[data-tv-launch]');
    if (tvLaunchBtn) {
      const pkg = tvLaunchBtn.getAttribute('data-tv-launch');
      if (pkg && window.KVTVBridge) {
        window.KVTVBridge.launchApp(pkg);
      }
      return;
    }

    const tvUninstallBtn = target.closest('[data-tv-uninstall]');
    if (tvUninstallBtn) {
      const pkg = tvUninstallBtn.getAttribute('data-tv-uninstall');
      if (pkg && window.KVTVBridge) {
        window.KVTVBridge.uninstallApp(pkg);
      }
      return;
    }

    const openAppBtn = target.closest('[data-open-app]');
    if (openAppBtn) {
      openAppDialog(openAppBtn.getAttribute('data-open-app'));
      return;
    }

    const copyBtn = target.closest('[data-copy-code]');
    if (copyBtn) {
      const code = copyBtn.getAttribute('data-copy-code') || '88103';
      try {
        await navigator.clipboard.writeText(code);
        showToast(t('toasts.copied', { code }));
      } catch {
        showToast(`Short-Code: ${code}`);
      }
      return;
    }

    const adBtn = target.closest('[data-ad-id]');
    if (adBtn) {
      await handleAdClick(
        adBtn.getAttribute('data-ad-id'),
        adBtn.getAttribute('data-ad-url')
      );
      return;
    }

    const dlBtn = target.closest('[data-app-download]');
    if (dlBtn) {
      const appId = dlBtn.getAttribute('data-app-download');
      const app = findApp(appId);
      if (app) {
        app.downloads = Number(app.downloads || 0) + 1;
        hydrateLiveTilesAndStrip();
        renderPromoPortal();
        showToast(t('toasts.starting_dl', { name: app.name, code: app.shortCode }));
      }
    }
  });

  // 9. Scoped 2D Spatial Navigation Keydown Handler on #metro-grid
  gridEl?.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const arrowDirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!arrowDirs.includes(e.key)) return;

    const innermost = e.composedPath()[0];
    if (
      innermost instanceof Element &&
      innermost.matches(':read-write, select, input[type="range"], [role="slider"]')
    ) {
      return;
    }

    const activeEl = document.activeElement;
    const liveTiles = getAllGridTiles();
    if (!liveTiles.includes(activeEl)) return;

    const nextTile = findSpatialCandidate(activeEl, e.key);
    if (!nextTile) {
      // Preserve native boundary scrolling when no candidate exists in the pressed direction
      return;
    }

    e.preventDefault();
    setRovingFocus(nextTile, true);
  });

  // 10. D-Pad Remote Simulator Controls
  for (const btn of document.querySelectorAll('[data-dpad]')) {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-dpad');
      const liveTiles = getAllGridTiles();
      const activeTile =
        liveTiles.find((t) => t === document.activeElement || t.hasAttribute('data-roving-active')) ||
        liveTiles[0];

      if (action === 'BACK') {
        allDialogs.forEach((d) => {
          if (d.open) d.close();
        });
        setRovingFocus(activeTile, true);
        return;
      }

      if (action === 'HOME') {
        allDialogs.forEach((d) => {
          if (d.open) d.close();
        });
        activatePivot('store', { updateUrl: true });
        setRovingFocus(liveTiles[0], true);
        return;
      }

      if (action === 'DIAL') {
        openDialerDialog();
        return;
      }

      if (action === 'QR') {
        openQrDialog();
        return;
      }

      if (action === 'Enter') {
        activeTile?.click();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(action)) {
        const next = findSpatialCandidate(activeTile, action);
        if (next) {
          setRovingFocus(next, true);
        } else {
          setRovingFocus(activeTile, true);
        }
      }
    });
  }

  // 11. KV-Store TV App Guide Modal & Code Copy
  document.getElementById('kv-banner-guide-btn')?.addEventListener('click', () => {
    document.getElementById('metro-guide-dialog')?.showModal();
  });
  document.getElementById('kv-store-inline-guide-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('metro-guide-dialog')?.showModal();
  });

  // 11b. Dialer Tile Quick Preset Chips & Hero Action Clicks
  for (const chip of document.querySelectorAll('.kv-tile-chip[data-preset-code]')) {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = chip.getAttribute('data-preset-code');
      if (code) {
        state.dialerCode = code;
        updateDialerReadouts();
        openDialerDialog();
      }
    });
  }

  for (const btn of document.querySelectorAll('.kv-hero-btn')) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  document.getElementById('guide-copy-code-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('88000');
      showToast('Đã chép mã 88000 vào bộ nhớ tạm');
    } catch {
      showToast('Mã Downloader: 88000');
    }
  });

  // 12. TV App Lifecycle Handlers
  window.onKVTVResume = () => {
    syncInstalledAppStatuses();
  };

  window.addEventListener('focus', () => {
    if (state.isTVApp) {
      syncInstalledAppStatuses();
    }
  });
  // 13. Metro Language Switcher Buttons
  const btnVi = document.getElementById('lang-btn-vi');
  const btnEn = document.getElementById('lang-btn-en');
  btnVi?.addEventListener('click', () => {
    if (getCurrentLanguage() !== 'vi') {
      setLanguage('vi');
      showToast(t('toasts.switched_vi'));
    }
  });
  btnEn?.addEventListener('click', () => {
    if (getCurrentLanguage() !== 'en') {
      setLanguage('en');
      showToast(t('toasts.switched_en'));
    }
  });
}

function initApp() {
  const initialLang = detectInitialLanguage();
  setLanguage(initialLang, false);
  translateDom();

  initDialogLightDismiss();
  startLiveTickers();
  bindInteractions();

  onLanguageChange(() => {
    translateDom();
    hydrateLiveTilesAndStrip();
    renderPresetsMatrix();
    renderShortCodesDirectory();
    renderPromoPortal();
    updateDialerReadouts();
    const deckTextEl = document.getElementById('panorama-deck-text');
    if (deckTextEl) {
      const key = `decks.${state.pivot.replace(/-/g, '')}`;
      deckTextEl.innerHTML = t(key);
    }
  });

  const initialPivot = resolveInitialPivot();
  activatePivot(initialPivot, { updateUrl: false, focusTarget: false });
  loadCatalog();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
