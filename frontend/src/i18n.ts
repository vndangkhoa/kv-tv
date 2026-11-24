import type { Lang } from './types';

export const CATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  vi: {
    All: 'Tất cả',
    'Media Center': 'Trung tâm Media',
    Streaming: 'Phim Trực tuyến',
    'Originals & Cinema': 'Chiếu Rạp 4K',
    'Video & Music': 'Video & Nhạc',
  },
  en: {
    All: 'All',
    'Media Center': 'Media Center',
    Streaming: 'Streaming',
    'Originals & Cinema': 'Originals & Cinema',
    'Video & Music': 'Video & Music',
  },
};

export const STRINGS: Record<Lang, Record<string, string>> = {
  vi: {
    brandHeading: 'KV-Store TV',
    brandSubheading: 'tv.vndns.net',
    navStore: 'Kho ứng dụng',
    navUpdates: 'Cập nhật',
    navPresets: 'Cấu hình sẵn',
    navCodes: 'Mã Downloader',
    navPromo: 'Đối tác',
    searchPlaceholder: 'Tìm Jellyfin, Kodi, KV-Tube, SmartTube hoặc mã 88101–88106...',
    searchLabel: 'Tìm kiếm ứng dụng',
    categoryLabel: 'Lọc theo nhóm ứng dụng',
    btnDialer: 'Nhập mã',
    btnQr: 'Mã QR',
    btnGuide: 'Hướng dẫn',
    heroTitle: 'KV-Store TV v1.1.0 · Kho Android TV Chính Thức',
    heroDesc:
      'Cài đặt 1-chạm bằng remote TV, tự động kiểm tra bản mới, hỗ trợ cập nhật cả KV-Store lẫn toàn bộ ứng dụng giải trí 4K HDR.',
    heroActionDownload: 'Tải KV-Store APK',
    heroActionInstall: 'Cài / Cập nhật ngay',
    heroActionDetails: 'Chi tiết phiên bản',
    updateBannerSelfTitle: 'Có bản cập nhật KV-Store TV mới',
    updateBannerAppsTitle: 'Có ứng dụng cần cập nhật trên TV này',
    updateBannerBtn: 'Mở Cập nhật',
    statusInstalled: 'Đã cài đặt',
    statusUpdate: 'Có bản mới',
    statusNotInstalled: 'Chưa cài',
    statusSignatureSwap: 'Cần gỡ bản cũ để đổi chữ ký',
    btnInstall: 'Cài đặt',
    btnUpdate: 'Cập nhật',
    btnOpen: 'Mở ứng dụng',
    btnDetails: 'Chi tiết',
    btnDownloadApk: 'Tải APK',
    btnBackupDownload: 'Tải dự phòng (Forgejo)',
    btnCopyUrl: 'Sao chép link',
    btnShowQr: 'Hiện QR',
    btnUninstall: 'Gỡ cài đặt',
    btnClose: 'Đóng',
    btnCheckUpdates: 'Kiểm tra cập nhật',
    btnUpdateAll: 'Cập nhật tất cả',
    updatesTitle: 'Trung tâm Cập nhật Ứng dụng',
    updatesSubtitleTv:
      'Quét toàn bộ gói ứng dụng đang cài trên Android TV, đối chiếu mã phiên bản và chữ ký số với máy chủ tv.vndns.net.',
    updatesSubtitleWeb:
      'Bảng phiên bản mới nhất trên máy chủ tv.vndns.net. Mở trên ứng dụng KV-Store TV để quét và cập nhật 1-chạm trực tiếp trên TV.',
    updatesSelfCardTitle: 'Cập nhật ứng dụng KV-Store TV',
    updatesSelfUpToDate: 'KV-Store TV đang ở phiên bản mới nhất.',
    updatesSelfAvailable: 'Đã có KV-Store TV phiên bản mới — cập nhật tại chỗ không mất dữ liệu.',
    updatesPermissionMissing:
      'TV chưa bật quyền "Cài đặt ứng dụng không rõ nguồn gốc" cho KV-Store TV.',
    updatesOpenPermission: 'Mở cài đặt quyền',
    updatesSectionAvailable: 'Cần cập nhật',
    updatesSectionUpToDate: 'Đã mới nhất',
    updatesSectionCatalog: 'Danh mục phát hành mới nhất',
    updatesEmptyTitle: 'Tất cả ứng dụng đã cài đều là bản mới nhất',
    updatesEmptyDesc: 'Nhấn Kiểm tra cập nhật bất kỳ lúc nào để đồng bộ lại với máy chủ.',
    updatesWebBannerTitle: 'Bạn đang xem trên trình duyệt web',
    updatesWebBannerDesc:
      'Cài đặt KV-Store TV v1.1.0 (mã Downloader 2179554) lên Android TV để tự động phát hiện ứng dụng đã cài và cập nhật chỉ với 1 chạm.',
    versionCurrent: 'Đang cài',
    versionLatest: 'Mới nhất',
    whatsNewTitle: 'Có gì mới',
    smartTubeNoteTitle: 'Lưu ý SmartTube TV & khắc phục tải mãi không phát',
    presetTitle: 'Ứng dụng Tích hợp Cấu hình Sẵn (Pre-Configured)',
    presetSubtitle:
      'Mỗi APK đã được đóng gói cấu hình tối ưu cho hệ sinh thái KV và xác thực SHA-256 trước khi cài.',
    codesTitle: 'Bảng Mã Rút gọn AFTVnews Downloader & Short-Links',
    codesSubtitle:
      'Nhập trực tiếp mã 7 chữ số vào ứng dụng Downloader trên Android TV hoặc mở link ngắn tv.vndns.net/88xxx.',
    promoTitle: 'Đối tác & Hệ sinh thái KV',
    promoSubtitle: 'Các dịch vụ phim, nhạc và hạ tầng giải trí gia đình kết nối cùng KV-Store TV.',
    dialerTitle: 'Bàn phím Mã Nhanh (88000 – 88106)',
    dialerSubtitle: 'Nhập mã 5 số hoặc chọn nhanh ứng dụng để tải/cài đặt ngay.',
    guideTitle: 'Hướng dẫn cài đặt lên Android TV / Google TV',
    qrTitle: 'Quét mã QR để mở hoặc tải APK',
    copiedToast: 'Đã sao chép vào bộ nhớ tạm',
    checkingToast: 'Đang kiểm tra phiên bản mới từ máy chủ...',
    checkedToast: 'Đã đồng bộ danh sách cập nhật mới nhất.',
    phaseDownloading: 'Đang tải xuống...',
    phaseFallback: 'Đang chuyển sang máy chủ dự phòng...',
    phaseVerifying: 'Đang kiểm tra SHA-256...',
    phasePermission: 'Chờ cấp quyền cài đặt...',
    phaseUninstalling: 'Đang chờ gỡ bản cũ khác chữ ký...',
    phaseInstalling: 'Đang mở trình cài đặt Android...',
    noAppsFound: 'Không có ứng dụng nào khớp với bộ lọc hiện tại.',
  },
  en: {
    brandHeading: 'KV-Store TV',
    brandSubheading: 'tv.vndns.net',
    navStore: 'App Store',
    navUpdates: 'Updates',
    navPresets: 'Pre-Configured',
    navCodes: 'Short Codes',
    navPromo: 'Partners',
    searchPlaceholder: 'Search Jellyfin, Kodi, KV-Tube, SmartTube or code 88101–88106...',
    searchLabel: 'Search apps',
    categoryLabel: 'Filter apps by category',
    btnDialer: 'Dialer',
    btnQr: 'QR Code',
    btnGuide: 'Guide',
    heroTitle: 'KV-Store TV v1.1.0 · Official Android TV Storefront',
    heroDesc:
      '1-click D-pad installation on Android TV with self-updating storefront, bulk app upgrades, SHA-256 verification, and Forgejo mirror fallback.',
    heroActionDownload: 'Download KV-Store APK',
    heroActionInstall: 'Install / Update Now',
    heroActionDetails: 'Release Details',
    updateBannerSelfTitle: 'A new KV-Store TV update is ready',
    updateBannerAppsTitle: 'App updates are available on this TV',
    updateBannerBtn: 'View Updates',
    statusInstalled: 'Installed',
    statusUpdate: 'Update Ready',
    statusNotInstalled: 'Not Installed',
    statusSignatureSwap: 'Uninstall old signature required',
    btnInstall: 'Install',
    btnUpdate: 'Update',
    btnOpen: 'Launch App',
    btnDetails: 'Details',
    btnDownloadApk: 'Download APK',
    btnBackupDownload: 'Backup Mirror (Forgejo)',
    btnCopyUrl: 'Copy URL',
    btnShowQr: 'Show QR',
    btnUninstall: 'Uninstall',
    btnClose: 'Close',
    btnCheckUpdates: 'Check for Updates',
    btnUpdateAll: 'Update All',
    updatesTitle: 'App Updates Center',
    updatesSubtitleTv:
      'Scans installed Android TV packages, version codes, debuggable flags, and signing certificates against tv.vndns.net.',
    updatesSubtitleWeb:
      'Latest verified APK releases hosted on tv.vndns.net. Open on KV-Store TV to scan installed packages and upgrade in one click.',
    updatesSelfCardTitle: 'KV-Store TV Client Update',
    updatesSelfUpToDate: 'KV-Store TV is up to date.',
    updatesSelfAvailable: 'A newer KV-Store TV build is available and upgrades cleanly in place.',
    updatesPermissionMissing:
      'Unknown Sources install permission is not enabled for KV-Store TV yet.',
    updatesOpenPermission: 'Grant Permission',
    updatesSectionAvailable: 'Updates Available',
    updatesSectionUpToDate: 'Up to Date',
    updatesSectionCatalog: 'Latest Store Releases',
    updatesEmptyTitle: 'All installed apps are up to date',
    updatesEmptyDesc: 'Run Check for Updates anytime to re-verify against tv.vndns.net.',
    updatesWebBannerTitle: 'Viewing on Web Browser',
    updatesWebBannerDesc:
      'Install KV-Store TV v1.1.0 (Downloader code 2179554) on your Android TV to detect installed APKs and trigger 1-click updates.',
    versionCurrent: 'Installed',
    versionLatest: 'Latest',
    whatsNewTitle: "What's New",
    smartTubeNoteTitle: 'SmartTube TV Notes & Infinite-Loading Recovery',
    presetTitle: 'Pre-Configured TV Builds & Presets',
    presetSubtitle:
      'Every APK comes pre-wired for the KV media ecosystem and verified by SHA-256 before installation.',
    codesTitle: 'AFTVnews Downloader & Short-Code Directory',
    codesSubtitle:
      'Enter the 7-digit AFTVnews code directly inside the Downloader app on TV, or visit tv.vndns.net/88xxx.',
    promoTitle: 'KV Ecosystem & Partner Picks',
    promoSubtitle: 'Private streaming gateways, media servers, and TV companion services.',
    dialerTitle: 'Quick Code Dialer (88000 – 88106)',
    dialerSubtitle: 'Enter a 5-digit code or tap a shortcut to launch download/install.',
    guideTitle: 'How to Install on Android TV / Google TV',
    qrTitle: 'Scan QR Code to Open or Download APK',
    copiedToast: 'Copied to clipboard',
    checkingToast: 'Checking server for latest versions...',
    checkedToast: 'Updates status synced with tv.vndns.net.',
    phaseDownloading: 'Downloading...',
    phaseFallback: 'Switching to Forgejo backup mirror...',
    phaseVerifying: 'Verifying SHA-256 checksum...',
    phasePermission: 'Waiting for install permission...',
    phaseUninstalling: 'Waiting to uninstall old signature...',
    phaseInstalling: 'Opening Android package installer...',
    noAppsFound: 'No applications match your current filter.',
  },
};

export function tr(lang: Lang, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

export function pickLocalized<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  lang: Lang
): string {
  const localized = obj[`${field}_${lang}`];
  if (typeof localized === 'string' && localized.trim()) return localized;
  const fallbackEn = obj[`${field}_en`];
  if (lang === 'en' && typeof fallbackEn === 'string' && fallbackEn.trim()) return fallbackEn;
  const fallbackVi = obj[`${field}_vi`];
  if (typeof fallbackVi === 'string' && fallbackVi.trim()) return fallbackVi;
  const base = obj[field];
  return typeof base === 'string' ? base : '';
}

export function pickLocalizedList<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  lang: Lang
): string[] {
  const localized = obj[`${field}_${lang}`];
  if (Array.isArray(localized) && localized.length > 0) return localized as string[];
  const base = obj[field];
  return Array.isArray(base) ? (base as string[]) : [];
}
