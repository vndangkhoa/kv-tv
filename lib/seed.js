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
      version: '1.1.0',
      versionCode: 2,
      releaseOnly: false,
      size: '2.5 MB',
      fileSize: 2619558,
      fileSizeFormatted: '2.5 MB',
      shortCode: '88000',
      shortPath: 'tv.vndns.net/88000',
      ultraShortPath: 'tv.vndns.net/0',
      aftvCode: '2179554',
      category: 'Media Center',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Cài đặt 1-chạm, Trung tâm Cập nhật & nâng cấp mọi ứng dụng Media 4K HDR cho Android TV',
      presetSummary_vi:
        'Cài đặt 1-chạm, Trung tâm Cập nhật & nâng cấp mọi ứng dụng Media 4K HDR cho Android TV',
      presetSummary_en:
        '1-click install, Updates Center & auto-upgrade for all Media and 4K HDR apps on Android TV',
      description:
        'Ứng dụng chính thức của KV-Store dành cho Android TV / Google TV với giao diện Astryx Cinema Obsidian mới. Tích hợp Trung tâm Cập nhật, tải APK có thanh tiến trình, xác thực SHA-256 và tự động nâng cấp ứng dụng khác chữ ký.',
      description_vi:
        'Ứng dụng chính thức của KV-Store dành cho Android TV / Google TV với giao diện Astryx Cinema Obsidian mới. Tích hợp Trung tâm Cập nhật, tải APK có thanh tiến trình, xác thực SHA-256 và tự động nâng cấp ứng dụng khác chữ ký.',
      description_en:
        'Official KV-Store client for Android TV / Google TV featuring the new Astryx Cinema Obsidian interface, built-in Updates Center, live APK download progress, SHA-256 verification, and signature-mismatch replacement.',
      presetFeatures: [
        'Giao diện Astryx Cinema Obsidian tối ưu cho điều hướng D-Pad 10-foot TV',
        'Trung tâm Cập nhật tự động kiểm tra phiên bản mới cho cả KV-Store và mọi ứng dụng',
        'Hiển thị tiến trình tải APK trực tiếp, kiểm tra SHA-256 & máy chủ dự phòng Forgejo',
        'Tự động hỗ trợ gỡ bản cũ khác chữ ký (SmartTube) rồi cài bản chính thức mới',
      ],
      presetFeatures_vi: [
        'Giao diện Astryx Cinema Obsidian tối ưu cho điều hướng D-Pad 10-foot TV',
        'Trung tâm Cập nhật tự động kiểm tra phiên bản mới cho cả KV-Store và mọi ứng dụng',
        'Hiển thị tiến trình tải APK trực tiếp, kiểm tra SHA-256 & máy chủ dự phòng Forgejo',
        'Tự động hỗ trợ gỡ bản cũ khác chữ ký (SmartTube) rồi cài bản chính thức mới',
      ],
      presetFeatures_en: [
        'Astryx Cinema Obsidian UI built for crisp 10-foot TV D-Pad navigation',
        'Updates Center automatically checks for both KV-Store self-updates and app updates',
        'Live APK download progress bar, SHA-256 verification & Forgejo failover',
        'Automatic uninstall-then-reinstall workflow for signature changes (e.g. SmartTube)',
      ],
      color: '#E50914',
      iconType: 'store',
      downloads: 8804,
      rating: '5.0',
      minAndroid: 'Android TV 5.0+ (API 21+)',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: '166c1f312389dcdb52575479894cb37c09aba163ad5c4bff609435bb2dff3646',
      signingCertSha256: 'e89668e5f473a3193e7d624d2d1679985ec8e612bce1bf969661634fd33e218b',
      apkFileName: 'kv-store.apk',
      presetFileName: null,
      apkUrl: 'https://tv.vndns.net/uploads/kv-store.apk',
      backupApkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-store.apk',
      presetUrl: null,
      changelog_vi:
        '• Giao diện Astryx Cinema Obsidian mới (Dark & Light mode)\n• Trung tâm Cập nhật tích hợp tự cập nhật KV-Store & nâng cấp tất cả ứng dụng\n• Thanh tiến trình tải APK trực tiếp, kiểm tra SHA-256 & quyền cài đặt\n• Tự động xử lý đổi chữ ký khi nâng cấp SmartTube lên bản chính thức',
      changelog_en:
        '• Redesigned Astryx Cinema Obsidian interface (Dark & Light modes)\n• Built-in Updates Center for KV-Store self-update & bulk app upgrades\n• Live APK download progress, SHA-256 verification & Unknown Sources prompt\n• Automated uninstall-then-reinstall handling for incompatible signatures',
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
      releaseOnly: false,
      size: '20.9 MB',
      fileSize: 21955905,
      fileSizeFormatted: '20.9 MB',
      shortCode: '88101',
      shortPath: 'tv.vndns.net/88101',
      ultraShortPath: 'tv.vndns.net/1',
      aftvCode: '5798721',
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
      signingCertSha256: 'e89668e5f473a3193e7d624d2d1679985ec8e612bce1bf969661634fd33e218b',
      apkFileName: 'jellyfin-kv.apk',
      presetFileName: null,
      apkUrl: 'https://tv.vndns.net/uploads/jellyfin-kv.apk',
      backupApkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/jellyfin-kv.apk',
      presetUrl: null,
      updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 'kodi-kv',
      name: 'Kodi 21 Omega',
      edition: 'Giao diện Netflix Bingie Mod & KV-Netflix',
      edition_vi: 'Giao diện Netflix Bingie Mod & KV-Netflix',
      edition_en: 'Netflix Bingie Mod Theme & KV-Netflix',
      packageName: 'org.xbmc.kodi',
      version: '21.3-Omega',
      versionCode: 2103000,
      releaseOnly: false,
      size: '157.3 MB',
      fileSize: 164941911,
      fileSizeFormatted: '157.3 MB',
      shortCode: '88102',
      shortPath: 'tv.vndns.net/88102',
      ultraShortPath: 'tv.vndns.net/2',
      aftvCode: '3939162',
      category: 'Media Center',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Kodi 21.3 Universal ARM (32-bit + 64-bit) · Giao diện Netflix Bingie & KV-Netflix cho mọi Android TV 5.0+',
      presetSummary_vi:
        'Kodi 21.3 Universal ARM (32-bit + 64-bit) · Giao diện Netflix Bingie & KV-Netflix cho mọi Android TV 5.0+',
      presetSummary_en:
        'Universal ARM (32-bit + 64-bit) Kodi 21.3 Omega · Netflix Bingie Theme & KV-Netflix for all Android TV 5.0+ devices',
      description:
        'Bản Kodi 21.3 Omega Universal ARM (hỗ trợ cả TV 32-bit cũ armeabi-v7a lẫn TV 64-bit mới arm64-v8a từ Android 5.0+), tích hợp sẵn giao diện Netflix (Titan Bingie Mod) và Addon KV-Netflix: mở lên vào thẳng Spotlight + danh mục phim 4K Vietsub không cần cài thêm.',
      description_vi:
        'Bản Kodi 21.3 Omega Universal ARM (hỗ trợ cả TV 32-bit cũ armeabi-v7a lẫn TV 64-bit mới arm64-v8a từ Android 5.0+), tích hợp sẵn giao diện Netflix (Titan Bingie Mod) và Addon KV-Netflix: mở lên vào thẳng Spotlight + danh mục phim 4K Vietsub không cần cài thêm.',
      description_en:
        'Universal ARM Kodi 21.3 Omega build (bundles both 32-bit armeabi-v7a and 64-bit arm64-v8a libraries for Android TV 5.0+), pre-configured with Titan Bingie Mod Netflix UI, hardware MediaCodec Surface decoding, and the KV-Netflix 4K Vietsub addon.',
      notes_vi:
        'Tương thích cả Android TV Box đời cũ (32-bit Android 5.0+) lẫn TV 64-bit mới. Mẹo cho TV cấu hình yếu / RAM 1–1.5 GB: nếu giao diện Bingie hơi nặng, bạn có thể chuyển sang giao diện Estuary mặc định (đã gắn sẵn menu KV-Netflix) trong Giao diện, hoặc dùng KV-Netflix TV (mã 88104 · 16.6 MB) nhẹ mượt hơn.',
      notes_en:
        'Compatible with both older 32-bit (armeabi-v7a) and modern 64-bit (arm64-v8a) Android TVs running Android 5.0+. Tip for older low-RAM TVs (1–1.5 GB RAM): switch Skin to Estuary (already wired with KV-Netflix) under Interface Settings, or use the lightweight KV-Netflix TV app (code 88104 · 16.6 MB).',
      presetFeatures: [
        'Đóng gói Universal ARM (armeabi-v7a + arm64-v8a) cài được trên mọi Android TV 5.0+',
        'Tích hợp sẵn giao diện Netflix (Titan Bingie Mod) & menu dự phòng nhẹ trên Estuary',
        'Cài sẵn Addon KV-Netflix (plugin.video.kvnetflix) kèm proxy phát mượt HLS Vietsub',
        'Khôi phục giải mã phần cứng MediaCodec Surface & phụ đề tiếng Việt chuẩn',
      ],
      presetFeatures_vi: [
        'Đóng gói Universal ARM (armeabi-v7a + arm64-v8a) cài được trên mọi Android TV 5.0+',
        'Tích hợp sẵn giao diện Netflix (Titan Bingie Mod) & menu dự phòng nhẹ trên Estuary',
        'Cài sẵn Addon KV-Netflix (plugin.video.kvnetflix) kèm proxy phát mượt HLS Vietsub',
        'Khôi phục giải mã phần cứng MediaCodec Surface & phụ đề tiếng Việt chuẩn',
      ],
      presetFeatures_en: [
        'Universal ARM packaging (armeabi-v7a + arm64-v8a) for all Android TV 5.0+ devices',
        'Pre-activated Netflix UI (Titan Bingie Mod) plus lightweight Estuary KV-Netflix fallback',
        'Bundled KV-Netflix Addon (plugin.video.kvnetflix) with local Vietsub HLS proxy',
        'Hardware MediaCodec Surface zero-copy decoding & Vietnamese subtitle defaults restored',
      ],
      color: '#17B2E7',
      iconType: 'kodi',
      downloads: 764,
      rating: '4.9',
      minAndroid: 'Android TV 5.0+ (API 21+)',
      arch: 'Universal ARM (armeabi-v7a + arm64-v8a)',
      sha256: 'ad7e8ef490481d6e6cac557b91dd8533cfb53ad24f43e5f54c75a6f3874fd473',
      signingCertSha256: 'e89668e5f473a3193e7d624d2d1679985ec8e612bce1bf969661634fd33e218b',
      apkFileName: 'kodi-kv.apk',
      presetFileName: null,
      apkUrl: 'https://tv.vndns.net/uploads/kodi-kv.apk',
      backupApkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kodi-kv.apk',
      presetUrl: 'https://tv.vndns.net/api/download/kodi-kv?type=preset',
      changelog_vi:
        '• Khắc phục lỗi không cài được trên TV thật: chuyển từ bản x86 sang Universal ARM (armeabi-v7a 32-bit + arm64-v8a 64-bit)\n• Hỗ trợ đầy đủ chữ ký v1/v2/v3 cho Android TV 5.0+ đời cũ đến Android 14+\n• Bật lại MediaCodec Surface phần cứng giúp phát phim 4K mượt trên box TV cũ',
      changelog_en:
        '• Fixed installation failures on physical Android TVs: rebuilt as Universal ARM (32-bit armeabi-v7a + 64-bit arm64-v8a) replacing prior x86-only build\n• Signed with v1 + v2 + v3 schemes covering Android TV 5.0+ through Android 14+\n• Restored MediaCodec Surface hardware decoding for smoother playback on older TV boxes',
      updatedAt: new Date(now.getTime()).toISOString(),
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
      releaseOnly: false,
      size: '68.8 MB',
      fileSize: 72118774,
      fileSizeFormatted: '68.8 MB',
      shortCode: '88103',
      shortPath: 'tv.vndns.net/88103',
      ultraShortPath: 'tv.vndns.net/3',
      aftvCode: '1037083',
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
      signingCertSha256: 'e89668e5f473a3193e7d624d2d1679985ec8e612bce1bf969661634fd33e218b',
      apkFileName: 'cloudstream-kv.apk',
      presetFileName: null,
      apkUrl: 'https://tv.vndns.net/uploads/cloudstream-kv.apk',
      backupApkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/cloudstream-kv.apk',
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
      version: '1.4.6',
      versionCode: 117,
      releaseOnly: true,
      size: '16.6 MB',
      fileSize: 17439110,
      fileSizeFormatted: '16.6 MB',
      shortCode: '88104',
      shortPath: 'tv.vndns.net/88104',
      ultraShortPath: 'tv.vndns.net/4',
      aftvCode: '4523598',
      category: 'Originals & Cinema',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Bản Release 1.4.6 chính thức · Hỗ trợ mọi TV Box & điều hướng D-Pad mượt mà',
      presetSummary_vi:
        'Bản Release 1.4.6 chính thức · Hỗ trợ mọi TV Box & điều hướng D-Pad mượt mà',
      presetSummary_en:
        'Official 1.4.6 Release · Universal Android TV Box support with native D-Pad controls',
      description:
        'Bản Release chính thức mới nhất của KV-Netflix Android TV (v1.4.6, nhẹ hơn 30%). Tối ưu hóa cho các dòng Android TV Box, điều hướng remote D-Pad mượt mà, tự thích ứng Widevine L1/L3, HDR10 và tích hợp kiểm tra cập nhật tự động.',
      description_vi:
        'Bản Release chính thức mới nhất của KV-Netflix Android TV (v1.4.6, nhẹ hơn 30%). Tối ưu hóa cho các dòng Android TV Box, điều hướng remote D-Pad mượt mà, tự thích ứng Widevine L1/L3, HDR10 và tích hợp kiểm tra cập nhật tự động.',
      description_en:
        'Latest non-debuggable Release build of KV-Netflix Android TV (v1.4.6, 16.6 MB). Fast cold start, native D-Pad remote focus, Widevine L1/L3 fallback, 4K HDR10 playback, and built-in release update support.',
      presetFeatures: [
        'Bản Release chính thức (16.6 MB) khởi động nhanh và ổn định hơn',
        'Điều hướng trực tiếp bằng remote D-Pad (không cần chuột bay)',
        'Tự động thích ứng Widevine L1/L3, Dolby Digital Plus 5.1 & HDR10',
        'Tích hợp kiểm tra & thông báo phiên bản mới ngay trên TV',
      ],
      presetFeatures_vi: [
        'Bản Release chính thức (16.6 MB) khởi động nhanh và ổn định hơn',
        'Điều hướng trực tiếp bằng remote D-Pad (không cần chuột bay)',
        'Tự động thích ứng Widevine L1/L3, Dolby Digital Plus 5.1 & HDR10',
        'Tích hợp kiểm tra & thông báo phiên bản mới ngay trên TV',
      ],
      presetFeatures_en: [
        'Lean non-debuggable Release APK (16.6 MB) for fast cold start',
        'Native D-Pad directional navigation (no air-mouse needed)',
        'Adaptive Widevine L1/L3, Dolby Digital Plus 5.1 & 4K HDR10',
        'Supports automatic update detection from KV-Store TV',
      ],
      color: '#E50914',
      iconType: 'netflix',
      downloads: 1180,
      rating: '4.9',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: '9a7fc7ea6c030f9e8d22dbc246304590e367e801db786d1f95c7463a9b5b6bae',
      signingCertSha256: 'e89668e5f473a3193e7d624d2d1679985ec8e612bce1bf969661634fd33e218b',
      apkFileName: 'kv-netflix-tv.apk',
      presetFileName: null,
      apkUrl: 'https://tv.vndns.net/uploads/kv-netflix-tv.apk',
      backupApkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-netflix-tv.apk',
      presetUrl: 'https://n.khoavo.vndns.net/repo.json',
      changelog_vi:
        '• Nâng cấp lên bản KV-Netflix Android TV Release 1.4.6 chính thức (16.6 MB)\n• Cải thiện tốc độ khởi động & độ mượt khi cuộn poster bằng D-Pad\n• Sửa lỗi phát HLS / phụ đề & tối ưu Widevine trên các dòng Android TV Box',
      changelog_en:
        '• Upgraded to official non-debuggable Release 1.4.6 (16.6 MB)\n• Improved cold-start speed and smooth D-Pad poster browsing\n• Playback & subtitle stability enhancements on Android TV boxes',
      updatedAt: new Date(now.getTime()).toISOString(),
    },
    {
      id: 'kv-tube',
      name: 'KV-Tube',
      edition: 'Bản Chính Chủ KV · Không Quảng Cáo',
      edition_vi: 'Bản Chính Chủ KV · Không Quảng Cáo',
      edition_en: 'Official KV Client · Ad-Free TV',
      packageName: 'com.kvtube.tv',
      version: '1.2.5-tv',
      versionCode: 14,
      releaseOnly: true,
      size: '17.1 MB',
      fileSize: 17943153,
      fileSizeFormatted: '17.1 MB',
      shortCode: '88105',
      shortPath: 'tv.vndns.net/88105',
      ultraShortPath: 'tv.vndns.net/5',
      aftvCode: '3001533',
      category: 'Video & Music',
      featured: true,
      preConfigured: true,
      presetSummary:
        'KV-Tube Android TV v1.2.5-tv mới nhất: sửa lỗi không tải được luồng phát, giữ kết quả tìm kiếm & chọn ngôn ngữ âm thanh gốc.',
      presetSummary_vi:
        'KV-Tube Android TV v1.2.5-tv mới nhất: sửa lỗi không tải được luồng phát, giữ kết quả tìm kiếm & chọn ngôn ngữ âm thanh gốc.',
      presetSummary_en:
        'Latest KV-Tube Android TV v1.2.5-tv: fixes stream resolution timeouts, preserves Search focus & adds Original audio track picker.',
      description:
        'Ứng dụng KV-Tube Android TV chính chủ phiên bản v1.2.5-tv (Compose for TV & Media3 ExoPlayer). Sửa triệt để lỗi "Unable to resolve playable video streams", giữ nguyên tiêu điểm kết quả sau khi tìm kiếm, tự động ưu tiên âm thanh gốc (tránh bị lồng tiếng AI sang tiếng Anh trên video Việt) kèm nút chọn Audio trực tiếp khi phát và cài đặt ngôn ngữ mặc định.',
      description_vi:
        'Ứng dụng KV-Tube Android TV chính chủ phiên bản v1.2.5-tv (Compose for TV & Media3 ExoPlayer). Sửa triệt để lỗi "Unable to resolve playable video streams", giữ nguyên tiêu điểm kết quả sau khi tìm kiếm, tự động ưu tiên âm thanh gốc (tránh bị lồng tiếng AI sang tiếng Anh trên video Việt) kèm nút chọn Audio trực tiếp khi phát và cài đặt ngôn ngữ mặc định.',
      description_en:
        'Official KV-Tube Android TV v1.2.5-tv (Compose for TV & Media3 ExoPlayer). Eliminates "Unable to resolve playable video streams" timeouts with resilient gateway fallback, keeps Search results focused instead of expanding Left Guide, prefers Original audio over English AI auto-dub by default, and adds an in-player Audio Track Picker + Settings → Playback language preference.',
      presetFeatures: [
        'Phiên bản v1.2.5-tv mới: sửa lỗi timeout giải mã luồng phát ("Unable to resolve playable video streams")',
        'Tự động chọn âm thanh gốc (Original) cho video Việt kèm menu đổi track Audio ngay trong trình phát',
        'Cài đặt Phát lại → Ngôn ngữ âm thanh mặc định (Gốc / Tiếng Việt / English / Hệ thống) & giữ focus kết quả tìm kiếm',
        'Kết nối sẵn máy chủ riêng https://u.khoavo.vndns.net & ghép đôi TV 6 số, chặn 100% quảng cáo',
      ],
      presetFeatures_vi: [
        'Phiên bản v1.2.5-tv mới: sửa lỗi timeout giải mã luồng phát ("Unable to resolve playable video streams")',
        'Tự động chọn âm thanh gốc (Original) cho video Việt kèm menu đổi track Audio ngay trong trình phát',
        'Cài đặt Phát lại → Ngôn ngữ âm thanh mặc định (Gốc / Tiếng Việt / English / Hệ thống) & giữ focus kết quả tìm kiếm',
        'Kết nối sẵn máy chủ riêng https://u.khoavo.vndns.net & ghép đôi TV 6 số, chặn 100% quảng cáo',
      ],
      presetFeatures_en: [
        'New v1.2.5-tv release: resilient stream resolver eliminates "Unable to resolve playable video streams" errors',
        'Defaults Vietnamese videos to Original audio instead of English AI auto-dub, with live in-player Audio Track Picker',
        'Settings → Playback → Audio language preference + keeps Search results focused after search submit',
        'Pre-connected private u.khoavo.vndns.net backend & 6-digit pairing, 100% ad-free',
      ],
      color: '#FF0033',
      iconType: 'tube',
      downloads: 812,
      rating: '5.0',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a + x86_64)',
      sha256: 'f8afdd9520a41b912e984011968239c22aba069e034e90cfbc2a69e7b15b3239',
      signingCertSha256: '35949d057db1bde725379941c4d60408cdfe990828a0c2e6ff3e047992b1a552',
      apkFileName: 'kv-tube.apk',
      presetFileName: null,
      apkUrl: 'https://tv.vndns.net/uploads/kv-tube.apk',
      backupApkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/kv-tube.apk',
      presetUrl: null,
      changelog_vi:
        '• Nâng cấp lên KV-Tube Android TV v1.2.5-tv (versionCode 14)\n• Sửa lỗi timeout "Unable to resolve playable video streams" với cơ chế fallback đa tầng qua gateway\n• Tự động chọn âm thanh gốc (Original) cho video Việt thay vì lồng tiếng AI tiếng Anh + bổ sung nút chọn Audio trực tiếp trong trình phát & mục Ngôn ngữ âm thanh ở Cài đặt\n• Sửa lỗi điều hướng sau khi tìm kiếm làm bung thanh menu trái thay vì giữ ở kết quả',
      changelog_en:
        '• Upgraded to KV-Tube Android TV v1.2.5-tv (versionCode 14)\n• Fixed recurring "Unable to resolve playable video streams" timeouts via resilient 15s gateway & DASH fallback resolution\n• Fixed Vietnamese videos playing English AI auto-dub by defaulting to Original audio + added in-player Audio Track Picker & Settings → Playback → Audio language preference\n• Fixed Search focus behavior so results remain focused instead of expanding Left Guide',
      updatedAt: new Date(now.getTime()).toISOString(),
    },
    {
      id: 'smarttube-tv',
      name: 'SmartTube TV',
      edition: 'Bản Beta Chính Thức 32.83 · Vá Lỗi Quay Vòng SABR',
      edition_vi: 'Bản Beta Chính Thức 32.83 · Vá Lỗi Quay Vòng SABR',
      edition_en: 'Official Signed 32.83 Beta · SABR Spinner Fix',
      packageName: 'org.smarttube.beta',
      version: '32.83 Beta',
      versionCode: 2473,
      releaseOnly: false,
      size: '33.8 MB',
      fileSize: 35470951,
      fileSizeFormatted: '33.8 MB',
      shortCode: '88106',
      shortPath: 'tv.vndns.net/88106',
      ultraShortPath: 'tv.vndns.net/6',
      aftvCode: '6908499',
      category: 'Video & Music',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Bản SmartTube 32.83 Beta chính thức từ Yurii L: vá lỗi quay vòng vô hạn SABR/PoToken & nhận cập nhật Beta mới nhất (32.84+).',
      presetSummary_vi:
        'Bản SmartTube 32.83 Beta chính thức từ Yurii L: vá lỗi quay vòng vô hạn SABR/PoToken & nhận cập nhật Beta mới nhất (32.84+).',
      presetSummary_en:
        'Official Yurii L signed SmartTube 32.83 Beta: fixes SABR/PoToken infinite buffering spinner & auto-updates on the Beta channel (32.84+).',
      description:
        'Bản SmartTube Beta 32.83 chính thức (chữ ký Yurii L) bổ sung các bản vá khôi phục lỗi quay vòng vô hạn SABR / PoToken và tải chậm sau 32.80, đồng thời tự động nhận bản cập nhật Beta mới nhất (32.84+) ngay trong ứng dụng.',
      description_vi:
        'Bản SmartTube Beta 32.83 chính thức (chữ ký Yurii L) bổ sung các bản vá khôi phục lỗi quay vòng vô hạn SABR / PoToken và tải chậm sau 32.80, đồng thời tự động nhận bản cập nhật Beta mới nhất (32.84+) ngay trong ứng dụng.',
      description_en:
        'Official unmodified SmartTube 32.83 Beta (Yurii L signed) containing post-32.80 SABR long-buffering recovery, PoToken cache fixes, player download retry patches, and Beta OTA updates (32.84+).',
      notes_vi:
        'Quan trọng khi video xoay vòng mãi trên TV: YouTube hiện chặn phát ẩn danh trên nhiều IP nhà mạng Việt Nam ("Sign in to confirm you\'re not a bot"), dù màn hình chính vẫn hiện thumbnail. Sau khi cài bản 32.83 Beta: (1) Đăng nhập tài khoản Google bên trong SmartTube, và (2) Nếu vẫn tải chậm trên TV cũ, vào Cài đặt → Chung → Cài đặt mạng (Network stack) chuyển sang OkHttp + bật Prefer IPv4 DNS — hoặc dùng KV-Tube TV v1.2.5-tv (mã 88105) phát ngay không cần đăng nhập.',
      notes_en:
        'Important if videos spin endlessly on your TV: YouTube currently blocks unauthenticated player requests on many ISP IPs ("Sign in to confirm you\'re not a bot") while still showing home thumbnails. After installing 32.83 Beta: (1) Sign in with a Google account inside SmartTube, and (2) If still slow on older TVs, switch Settings → General → Network settings → Network stack to OkHttp + enable Prefer IPv4 DNS — or use KV-Tube TV v1.2.5-tv (code 88105), which plays with no Google login required.',
      presetFeatures: [
        'Bản chính thức 32.83 Beta vá lỗi quay vòng SABR, PoToken & retry player từ Yurii L',
        'Nhận tự động các bản vá nóng 32.84+ trên kênh Beta ngay bên trong SmartTube',
        'Chặn 100% quảng cáo, SponsorBlock tự động bỏ qua giới thiệu & 4K60 HDR',
        'Hướng dẫn vượt chặn bot IP (đăng nhập Google + OkHttp / Prefer IPv4 DNS)',
      ],
      presetFeatures_vi: [
        'Bản chính thức 32.83 Beta vá lỗi quay vòng SABR, PoToken & retry player từ Yurii L',
        'Nhận tự động các bản vá nóng 32.84+ trên kênh Beta ngay bên trong SmartTube',
        'Chặn 100% quảng cáo, SponsorBlock tự động bỏ qua giới thiệu & 4K60 HDR',
        'Hướng dẫn vượt chặn bot IP (đăng nhập Google + OkHttp / Prefer IPv4 DNS)',
      ],
      presetFeatures_en: [
        'Official 32.83 Beta with SABR spinner recovery, PoToken cache fixes & player retry patches',
        'Auto-receives Beta OTA updates (32.84+) directly inside SmartTube',
        '100% ad-free YouTube, SponsorBlock auto-skip & 4K 60fps HDR10',
        'Includes Google Sign-in & OkHttp / Prefer IPv4 DNS setup guidance for ISP bot gates',
      ],
      color: '#FF0033',
      iconType: 'tube',
      downloads: 1420,
      rating: '5.0',
      minAndroid: 'Android TV 5.0+ (API 21+)',
      arch: 'Universal (arm64-v8a, armeabi-v7a, x86)',
      sha256: '8bf70f1b1342d5eb4aa21bacf7f137bc47855f4e6e497564de8182c6e479189f',
      signingCertSha256: '109735aa24fe85e2e1623ebb3b1ecc4bf4263f4c6374e4411d646bfa2eda482a',
      apkFileName: 'smarttube-tv.apk',
      presetFileName: null,
      apkUrl: 'https://tv.vndns.net/uploads/smarttube-tv.apk',
      backupApkUrl:
        'https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0/smarttube-tv.apk',
      presetUrl: null,
      changelog_vi:
        '• Nâng cấp lên SmartTube 32.83 Beta chính thức (org.smarttube.beta, versionCode 2473)\n• Bổ sung hàng loạt bản vá sau 32.80 khắc phục lỗi xoay vòng mãi không phát được (SABR long buffering, PoToken cache timeout, MediaServiceCore player retry)\n• Kênh Beta tự động cập nhật ngay lên 32.84+ khi phát hành\n• Bổ sung hướng dẫn đăng nhập Google + đổi OkHttp / Prefer IPv4 DNS khi IP bị YouTube kiểm tra bot',
      changelog_en:
        '• Upgraded to official Yurii L signed SmartTube 32.83 Beta (org.smarttube.beta, versionCode 2473)\n• Adds post-32.80 SABR long-buffering error recovery, PoToken cache timeout fix, and MediaServiceCore playerUrl retry fixes\n• Switches to Beta OTA channel to receive upcoming 32.84+ patches automatically\n• Documents Google Sign-in + OkHttp / Prefer IPv4 DNS workaround for ISP-level YouTube bot checks',
      updatedAt: new Date(now.getTime()).toISOString(),
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
      version: '1.1.0',
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
 * Write store JSON atomically via temp file + rename so bind-mounted files owned by root in
 * previous Docker runs can be cleanly replaced whenever the parent directory is writable.
 * @param {object} data
 */
function writeStoreAtomic(data) {
  const tmpPath = `${STORE_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
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
        if (parsed.admin.username === 'admin') {
          parsed.admin = canonical.admin;
          updated = true;
        }
        if (!parsed.storeInfo || parsed.storeInfo.version !== canonical.storeInfo.version) {
          parsed.storeInfo = {
            ...(parsed.storeInfo || {}),
            ...canonical.storeInfo,
          };
          updated = true;
        }
        for (const seedApp of canonical.apps) {
          const existing = parsed.apps.find((a) => a.id === seedApp.id);
          if (existing) {
            if (existing.shortPath !== seedApp.shortPath) {
              existing.shortPath = seedApp.shortPath;
              updated = true;
            }
            if (existing.ultraShortPath !== seedApp.ultraShortPath) {
              existing.ultraShortPath = seedApp.ultraShortPath;
              updated = true;
            }
            if (existing.aftvCode === undefined) {
              existing.aftvCode = seedApp.aftvCode ?? null;
              updated = true;
            } else if (seedApp.aftvCode && existing.aftvCode !== seedApp.aftvCode) {
              existing.aftvCode = seedApp.aftvCode;
              updated = true;
            }
          }
          const needsPrimaryVpsSync =
            existing &&
            (!existing.apkFileName ||
              !existing.backupApkUrl ||
              existing.sha256 !== seedApp.sha256 ||
              existing.versionCode !== seedApp.versionCode ||
              existing.fileSize !== seedApp.fileSize ||
              Boolean(existing.releaseOnly) !== Boolean(seedApp.releaseOnly) ||
              existing.signingCertSha256 !== seedApp.signingCertSha256 ||
              existing.changelog_en !== seedApp.changelog_en ||
              (typeof existing.apkUrl === 'string' &&
                existing.apkUrl.includes('git.khoavo.myds.me')));

          if (existing && needsPrimaryVpsSync) {
            const fieldsToSync = [
              'apkFileName',
              'apkUrl',
              'backupApkUrl',
              'packageName',
              'version',
              'versionCode',
              'releaseOnly',
              'size',
              'fileSize',
              'fileSizeFormatted',
              'sha256',
              'signingCertSha256',
              'minAndroid',
              'arch',
              'shortPath',
              'ultraShortPath',
              'presetUrl',
              'color',
              'rating',
              'notes_vi',
              'notes_en',
              'changelog_vi',
              'changelog_en',
              'updatedAt',
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
          try {
            writeStoreAtomic(parsed);
          } catch {
            // Ignore write errors if read-only filesystem
          }
        }
        return parsed;
      }
    } catch {
      // Fall through to re-seed if file is corrupted
    }
  }

  const initialData = createInitialStoreData();
  writeStoreAtomic(initialData);
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
