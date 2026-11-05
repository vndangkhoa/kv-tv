/**
 * KV-TV Store — Internationalization (i18n) Engine
 * Supported Locales:
 *  - 'vi' (Tiếng Việt - Default)
 *  - 'en' (English)
 */

export const SUPPORTED_LANGS = ['vi', 'en'];
export const DEFAULT_LANG = 'vi';

export const TRANSLATIONS = {
  vi: {
    meta: {
      title: 'KV-TV Store · Kho Ứng Dụng Android TV (tv.vndns.net)',
      description: 'Kho ứng dụng Android TV tối ưu — CloudStream 3, Jellyfin TV, Kodi 21 Omega, KV-Netflix, SmartTube TV và KV-Store trên giao diện Bento Grid hiện đại.',
    },
    nav: {
      brand: 'KV-TV STORE · tv.vndns.net',
      theme_badge: 'TIẾNG VIỆT',
      store: 'Kho Ứng Dụng',
      presets: 'Gói Cài Sẵn',
      shortcodes: 'Mã 5 Số',
      phoneqr: 'Mã QR',
    },
    pivots: {
      store: 'kho ứng dụng',
      presets: 'bản cài sẵn',
      shortcodes: 'mã 5 số',
      phoneqr: 'qr mobile',
    },
    telemetry: {
      total_installs: 'LƯỢT TẢI',
      codes_range: 'MÃ 88000 · 88101–88106',
      edge_cdn: 'MẠNG CDN VN · tv.vndns.net',
    },
    decks: {
      store: '<strong>Kho Ứng Dụng Android TV Tối Ưu</strong> — Tích hợp sẵn nguồn phim 4K Vietsub, chặn quảng cáo và mã cài nhanh AFTVnews Downloader.',
      presets: '<strong>Gói Sao Lưu & Cấu Hình Độc Lập</strong> — Tải trực tiếp file cấu hình (.json / .zip) hoặc bộ cài APK hoàn chỉnh.',
      shortcodes: '<strong>Danh Mục Mã 5 Số AFTVnews Downloader</strong> — Nhập mã 5 số để tải trực tiếp APK trên Android TV trong 3 giây.',
      phoneqr: '<strong>Quét Mã QR & Cài Đặt Di Động</strong> — Dùng camera điện thoại quét mã QR để tải nhanh hoặc chia sẻ đến TV.',
    },
    strip: {
      presets_title: 'gói sao lưu & cấu hình (.zip / .json)',
      presets_body: 'Gói cấu hình độc lập cho CloudStream 3, Kodi 21 và Jellyfin. Tích hợp trực tiếp nguồn phim KV-Netflix 4K VIP, phụ đề đồng bộ và DoH 1.1.1.1.',
      presets_badge: '5 GÓI CẤU HÌNH SẴN SÀNG',
      presets_btn: 'Tải Cấu Hình CS3',
      codes_title: 'danh mục mã số aftvnews downloader',
      codes_body: 'Mở ứng dụng Downloader trên Android TV và nhập mã 5 số: <strong class="tabular">88000</strong> (KV-Store), <strong class="tabular">88101</strong> (Jellyfin), <strong class="tabular">88102</strong> (Kodi 21), <strong class="tabular">88103</strong> (CloudStream 3), <strong class="tabular">88104</strong> (KV-Netflix), <strong class="tabular">88105</strong> (KV-Tube), hoặc <strong class="tabular">88106</strong> (SmartTube TV).',
      codes_badge: 'CHUYỂN HƯỚNG APK TRỰC TIẾP',
      codes_btn: 'Mở Bàn Phím Số',
      sponsor_title: 'hạ tầng vps nvme edge cdn',
      sponsor_body: 'Máy chủ đặt tại Việt Nam băng thông 1Gbps không giới hạn. Tải APK trực tiếp, phản hồi dưới 15ms trên mọi nhà mạng.',
      sponsor_badge: 'MẠNG CDN VN · HOẠT ĐỘNG',
      sponsor_btn: 'Xem Mã QR',
    },
    tiles: {
      hero_badge: '★ 4K VIP REPO',
      hero_desc: 'Tích hợp sẵn kho phim KV-Netflix 4K HDR10, âm thanh 5.1, phụ đề Vietsub tự động và vượt chặn ISP qua Cloudflare DoH 1.1.1.1.',
      btn_apk: 'TẢI APK (88103)',
      btn_preset: 'GÓI CẤU HÌNH',
      store_badge: 'BẢN CHÍNH THỨC · MÃ 88000',
      store_title: 'kv-store cho android tv',
      store_desc: 'Cài đặt và cập nhật mọi app media 4K HDR bằng remote TV.',
      store_btn_dl: 'TẢI APP TV (88000)',
      store_btn_guide: 'HƯỚNG DẪN',
      dialer_title: 'Mã 5 Số Downloader',
      dialer_edition: 'Bàn phím nhập mã nhanh',
      dialer_action: 'NHẬP',
      dialer_status: 'Tải APK Tức Thì',
      qr_title: 'Điện Thoại & QR',
      qr_edition: 'Quét để tải trên di động',
      qr_action: 'QUÉT',
      installs_suffix: 'lượt cài',
    },
    matrix: {
      title: 'bộ cài đặt sẵn & bảng ma trận tối ưu hóa',
      desc: 'Mỗi bản dựng KV-TV bao gồm file APK cài sẵn và tệp cấu hình <code>type=preset</code> độc lập, ghi rõ các tiện ích mở rộng và nguồn phụ đề.',
      archive_label: 'TỆP CẤU HÌNH',
      btn_download_preset: 'TẢI GÓI CẤU HÌNH (.JSON / .ZIP)',
      btn_direct_apk: 'TẢI APK TRỰC TIẾP ({code})',
      btn_inspect_qr: 'XEM CHI TIẾT & MÃ QR',
    },
    directory: {
      title: 'danh mục mã 5 số aftvnews downloader',
      desc: 'Nhập bất kỳ mã 5 số nào (<strong class="tabular">88000</strong>, <strong class="tabular">88101</strong>–<strong class="tabular">88106</strong>) trong ứng dụng Downloader trên Android TV hoặc sao chép 1 chạm.',
      dialer_title: 'bàn phím nhập mã số nhanh',
      dialer_desc: 'Nhập mã 5 số để tải APK ngay lập tức hoặc xem thông số kỹ thuật.',
      btn_fetch_apk: 'TẢI APK THEO MÃ SỐ',
      btn_open_keypad: 'MỞ BÀN PHÍM ĐẦY ĐỦ',
      btn_copy: 'CHÉP',
      btn_apk: 'APK',
      btn_qr: 'QR',
    },
    promo: {
      hero_title: 'cài đặt trên mọi android tv trong 60 giây',
      hero_lead: 'Toàn bộ ứng dụng tại <strong>KV-TV Store</strong> (<code>tv.vndns.net</code>) được cấu hình sẵn cho màn hình Android TV: chuẩn phát 4K HDR, phụ đề tiếng Việt đồng bộ và điều khiển 100% bằng remote TV.',
      btn_download_companion: 'TẢI APK CLOUDSTREAM (88103)',
      btn_dialer: 'BÀN PHÍM MÃ SỐ (88000–88106)',
      btn_focus_panorama: 'CHUYỂN ĐẾN KHO ỨNG DỤNG',
      qr_heading: 'quét trên điện thoại hoặc tv',
      qr_caption: 'Dùng camera điện thoại quét tại đây hoặc nhập <strong>tv.vndns.net</strong> vào trình duyệt TV / Downloader.',
      step1_title: '1. mở downloader trên android tv',
      step1_body: 'Mở ứng dụng <strong>Downloader by AFTVnews</strong> (biểu tượng màu cam) từ Google Play Store trên TV Box hoặc Smart TV.',
      step2_title: '2. nhập mã 5 số ứng dụng',
      step2_body: 'Tại ô URL / Search Term nhập một trong các mã: <code class="tabular">88000</code> (KV-Store), <code class="tabular">88103</code> (CloudStream), <code class="tabular">88104</code> (KV-Netflix), hoặc <code class="tabular">88106</code> (SmartTube).',
      step3_title: '3. bấm cài đặt & thưởng thức',
      step3_body: 'Bấm nút Cài đặt (Install). Tiện ích xem phim 4K Vietsub và cấu hình tối ưu đã tích hợp sẵn, mở app là dùng được ngay.',
      campaigns_title: 'chương trình tài trợ & hạ tầng',
      campaigns_desc: 'Hệ thống hạ tầng mạng và máy chủ tốc độ cao phục vụ phân phối APK và stream nội dung 4K.',
      table_title: 'bảng tra cứu gói cài đặt & sideload',
      table_desc: 'Link tải APK trực tiếp, gói cấu hình độc lập, mã định danh gói và số liệu lượt cài đặt thực tế.',
      search_placeholder: 'Tìm kiếm theo tên app, mã số (88103), hoặc package...',
      th_app: 'Ứng Dụng',
      th_code: 'Mã Số',
      th_pkg: 'Mã Gói (Package ID)',
      th_ver_size: 'Phiên Bản & Dung Lượng',
      th_installs: 'Lượt Cài',
      th_actions: 'Thao Tác Trực Tiếp',
      open_btn: 'MỞ',
    },
    dialog_app: {
      close: 'ESC · ĐÓNG',
      spec_code: 'MÃ SỐ',
      spec_ver_size: 'PHIÊN BẢN & DUNG LƯỢNG',
      spec_pkg: 'MÃ GÓI (PACKAGE ID)',
      spec_arch: 'KIẾN TRÚC',
      qr_caption: 'QUÉT ĐỂ TẢI APK · {code}',
      btn_apk: 'TẢI & CÀI ĐẶT NGAY (VPS)',
      btn_backup: 'LINK DỰ PHÒNG (FORGEJO)',
      btn_preset: 'TẢI GÓI CẤU HÌNH (.ZIP)',
      btn_copy: 'CHÉP MÃ SỐ',
      btn_install: 'CÀI ĐẶT',
      btn_update: 'CẬP NHẬT',
      btn_open: 'MỞ ỨNG DỤNG',
      btn_uninstall: 'GỠ CÀI ĐẶT',
    },
    dialog_dialer: {
      title: 'bàn phím nhập mã số',
      subtitle: 'Nhập mã AFTVnews Downloader 5 số (88000, 88101–88106)',
      close: 'ESC · ĐÓNG',
      btn_fetch: 'TẢI APK THEO MÃ SỐ',
      btn_inspect: 'XEM THÔNG SỐ BẢN DỰNG',
    },
    dialog_qr: {
      title: 'mã qr đồng hành cho điện thoại & tv',
      subtitle: 'Quét bằng camera điện thoại để cài đặt APK hoặc mở link trực tiếp',
      close: 'ESC · ĐÓNG',
      desc: 'Chọn một ứng dụng KV-TV bên dưới để tạo mã QR tải tốc độ cao:',
      sponsor_label: 'HẠ TẦNG MÁY CHỦ',
      shortlink_label: 'LINK TRỰC TIẾP',
    },
    footer: {
      copyright: '© 2026 KV-TV Store · tv.vndns.net',
      admin: 'Quản trị hệ thống',
    },
    toasts: {
      copied: 'Đã sao chép mã số {code} vào bộ nhớ tạm!',
      fetching: 'Đang tải thông tin APK cho mã {code}...',
      invalid_code: 'Mã số không hợp lệ ({code}). Vui lòng nhập từ 88000 đến 88106.',
      starting_dl: 'Đang tải trực tiếp {name} từ máy chủ VPS (1Gbps)...',
      fallback_dl: 'Máy chủ chính bận — Đang tự động chuyển sang Link Dự Phòng (Forgejo)...',
      switched_vi: 'Đã chuyển giao diện sang Tiếng Việt.',
      switched_en: 'Switched interface to English.',
    },
    tickers: [
      'KV-Netflix 4K VIP: Tích hợp đầy đủ nguồn phim 4K Vietsub',
      'DNS-over-HTTPS Cloudflare 1.1.1.1: Bỏ qua chặn mạng VN',
      'Định dạng 10-Foot: Điều khiển D-Pad TV mượt mà, không cần chuột bay',
      'Sao lưu & Khôi phục 1 chạm: Phục hồi nhanh qua tệp .json / .backup',
    ],
  },
  en: {
    meta: {
      title: 'KV-TV Store · Android TV App Repository (tv.vndns.net)',
      description: 'Pre-configured Android TV apps — CloudStream 3, Jellyfin TV, Kodi 21 Omega, KV-Netflix, SmartTube TV, and KV-Store on a modern Bento Grid.',
    },
    nav: {
      brand: 'KV-TV STORE · tv.vndns.net',
      theme_badge: 'ENGLISH',
      store: 'Apps',
      presets: 'Presets',
      shortcodes: '5-Digit Codes',
      phoneqr: 'QR Code',
    },
    pivots: {
      store: 'apps',
      presets: 'presets',
      shortcodes: 'short-codes',
      phoneqr: 'qr companion',
    },
    telemetry: {
      total_installs: 'TOTAL INSTALLS',
      codes_range: 'CODES 88000 · 88101–88106',
      edge_cdn: 'EDGE CDN · tv.vndns.net',
    },
    decks: {
      store: '<strong>Optimized Android TV App Repository</strong> — Pre-configured 4K Vietsub streams, ad-blocking, and 5-digit AFTVnews Downloader codes.',
      presets: '<strong>Standalone Configuration & Backup Packs</strong> — Direct downloads for standalone configurations (.json / .zip) or complete APKs.',
      shortcodes: '<strong>AFTVnews 5-Digit Downloader Directory</strong> — Enter any 5-digit code to download APKs directly on Android TV in seconds.',
      phoneqr: '<strong>QR Codes & Mobile Installation</strong> — Scan QR codes with your phone camera to download APKs or share links to TV.',
    },
    strip: {
      presets_title: 'configuration & backup packs (.zip / .json)',
      presets_body: 'Standalone configs for CloudStream 3, Kodi 21, and Jellyfin. Connects directly to the KV-Netflix 4K VIP repository, subtitles, and DoH 1.1.1.1.',
      presets_badge: '5 PRESET PACKS READY',
      presets_btn: 'Download CS3 Config',
      codes_title: 'aftvnews downloader directory',
      codes_body: 'Launch Downloader on Android TV and enter: <strong class="tabular">88000</strong> (KV-Store), <strong class="tabular">88101</strong> (Jellyfin), <strong class="tabular">88102</strong> (Kodi 21), <strong class="tabular">88103</strong> (CloudStream 3), <strong class="tabular">88104</strong> (KV-Netflix), <strong class="tabular">88105</strong> (KV-Tube), or <strong class="tabular">88106</strong> (SmartTube TV).',
      codes_badge: 'DIRECT APK REDIRECTS',
      codes_btn: 'Open Numeric Keypad',
      sponsor_title: 'vps nvme edge cdn infrastructure',
      sponsor_body: 'Hosted on high-speed Vietnam NVMe servers with 1Gbps bandwidth. Direct APK downloads with sub-15ms response times.',
      sponsor_badge: 'EDGE CDN · ACTIVE',
      sponsor_btn: 'View QR Code',
    },
    tiles: {
      hero_badge: '★ 4K VIP REPO',
      hero_desc: 'Pre-loaded with KV-Netflix 4K HDR10 extension, 5.1 surround audio, auto Vietsub, and Cloudflare DoH 1.1.1.1 ISP bypass.',
      btn_apk: 'GET APK (88103)',
      btn_preset: 'PRESET CONFIG',
      store_badge: 'OFFICIAL APP · CODE 88000',
      store_title: 'kv-store for android tv',
      store_desc: 'Install and update 4K HDR media apps using your TV remote.',
      store_btn_dl: 'GET APP TV (88000)',
      store_btn_guide: 'GUIDE',
      dialer_title: '5-Digit Code Dialer',
      dialer_edition: 'Quick numeric keypad',
      dialer_action: 'DIAL',
      dialer_status: 'Instant APK Fetch',
      qr_title: 'Phone & QR Code',
      qr_edition: 'Scan to open on mobile',
      qr_action: 'SCAN',
      installs_suffix: 'installs',
    },
    matrix: {
      title: 'pre-configured packages & optimization matrix',
      desc: 'Each KV-TV build includes a pre-configured APK and a standalone <code>type=preset</code> config file specifying extensions and subtitle sources.',
      archive_label: 'CONFIG ARCHIVE',
      btn_download_preset: 'DOWNLOAD PRESET (.JSON / .ZIP)',
      btn_direct_apk: 'DIRECT APK DOWNLOAD ({code})',
      btn_inspect_qr: 'DETAILS & QR CODE',
    },
    directory: {
      title: 'aftvnews 5-digit downloader directory',
      desc: 'Enter any 5-digit code (<strong class="tabular">88000</strong>, <strong class="tabular">88101</strong>–<strong class="tabular">88106</strong>) in the Downloader app on Android TV or copy with one click.',
      dialer_title: 'quick short-code dialer',
      dialer_desc: 'Enter 5-digit code to download APK instantly or inspect specifications.',
      btn_fetch_apk: 'FETCH APK BY CODE',
      btn_open_keypad: 'OPEN FULL KEYPAD',
      btn_copy: 'COPY',
      btn_apk: 'APK',
      btn_qr: 'QR',
    },
    promo: {
      hero_title: 'install on any android tv in 60 seconds',
      hero_lead: 'All applications on <strong>KV-TV Store</strong> (<code>tv.vndns.net</code>) are pre-configured for Android TV displays: 4K HDR playback, synchronized subtitles, and native remote navigation.',
      btn_download_companion: 'GET CLOUDSTREAM APK (88103)',
      btn_dialer: 'SHORT-CODE KEYPAD (88000–88106)',
      btn_focus_panorama: 'VIEW APP STORE',
      qr_heading: 'scan on phone or tv',
      qr_caption: 'Scan with your smartphone camera or enter <strong>tv.vndns.net</strong> into your TV browser / Downloader.',
      step1_title: '1. open downloader on android tv',
      step1_body: 'Launch <strong>Downloader by AFTVnews</strong> (orange icon) from Google Play Store on your TV Box or Smart TV.',
      step2_title: '2. enter 5-digit code',
      step2_body: 'In the URL / Search Term field, enter: <code class="tabular">88000</code> (KV-Store), <code class="tabular">88103</code> (CloudStream), <code class="tabular">88104</code> (KV-Netflix), or <code class="tabular">88106</code> (SmartTube).',
      step3_title: '3. install and enjoy',
      step3_body: 'Click Install. 4K Vietsub streaming extensions and settings are already configured for immediate viewing.',
      campaigns_title: 'infrastructure & sponsorships',
      campaigns_desc: 'High-speed NVMe edge network delivering fast APK downloads and media streaming.',
      table_title: 'apk package & sideload directory',
      table_desc: 'Direct APK download links, standalone config packs, package IDs, and install statistics.',
      search_placeholder: 'Search by app name, short-code (88103), or package...',
      th_app: 'Application',
      th_code: 'Code',
      th_pkg: 'Package ID',
      th_ver_size: 'Version & Size',
      th_installs: 'Installs',
      th_actions: 'Direct Actions',
      open_btn: 'OPEN',
    },
    dialog_app: {
      close: 'ESC · CLOSE',
      spec_code: 'SHORT-CODE',
      spec_ver_size: 'VERSION & SIZE',
      spec_pkg: 'PACKAGE ID',
      spec_arch: 'ARCHITECTURE',
      qr_caption: 'SCAN TO DOWNLOAD APK · {code}',
      btn_apk: '1-CLICK DOWNLOAD (VPS)',
      btn_backup: 'BACKUP MIRROR (FORGEJO)',
      btn_preset: 'DOWNLOAD PRESET (.ZIP)',
      btn_copy: 'COPY CODE',
      btn_install: 'INSTALL',
      btn_update: 'UPDATE',
      btn_open: 'LAUNCH APP',
      btn_uninstall: 'UNINSTALL',
    },
    dialog_dialer: {
      title: 'numeric code dialer',
      subtitle: 'Enter 5-digit AFTVnews Downloader code (88000, 88101–88106)',
      close: 'ESC · CLOSE',
      btn_fetch: 'FETCH APK BY CODE',
      btn_inspect: 'INSPECT APP DETAILS',
    },
    dialog_qr: {
      title: 'companion qr for phone & tv',
      subtitle: 'Scan with smartphone camera to download APK or open direct link',
      close: 'ESC · CLOSE',
      desc: 'Select a KV-TV application below to generate high-speed QR download code:',
      sponsor_label: 'INFRASTRUCTURE',
      shortlink_label: 'DIRECT LINK',
    },
    footer: {
      copyright: '© 2026 KV-TV Store · tv.vndns.net',
      admin: 'Admin Console',
    },
    toasts: {
      copied: 'Copied code {code} to clipboard!',
      fetching: 'Fetching APK details for code {code}...',
      invalid_code: 'Invalid code ({code}). Please enter between 88000 and 88106.',
      starting_dl: 'Downloading {name} directly from VPS (1Gbps)...',
      fallback_dl: 'Primary busy — Auto-switching to Backup Mirror (Forgejo)...',
      switched_vi: 'Đã chuyển giao diện sang Tiếng Việt.',
      switched_en: 'Switched interface to English.',
    },
    tickers: [
      'KV-Netflix 4K VIP: High-speed 4K HDR streams with synced Vietsub',
      'Cloudflare 1.1.1.1 DoH: Built-in bypass for Vietnamese ISP filters',
      '10-Foot Design: Smooth TV remote D-Pad navigation, zero air-mouse needed',
      '1-Click Restore: Instant configuration setup via .json / .backup file',
    ],
  },
};

export function detectInitialLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const langQuery = (urlParams.get('lang') || '').toLowerCase();
  if (SUPPORTED_LANGS.includes(langQuery)) {
    return langQuery;
  }
  try {
    const stored = (localStorage.getItem('kv_tv_lang') || '').toLowerCase();
    if (SUPPORTED_LANGS.includes(stored)) {
      return stored;
    }
  } catch {}
  return DEFAULT_LANG;
}

let activeLang = detectInitialLanguage();
const listeners = new Set();

export function getCurrentLanguage() {
  return activeLang;
}

export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang) || lang === activeLang) {
    return;
  }
  activeLang = lang;
  try {
    localStorage.setItem('kv_tv_lang', lang);
  } catch {}

  document.documentElement.setAttribute('lang', lang);

  const btnVi = document.getElementById('lang-btn-vi');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnVi && btnEn) {
    btnVi.classList.toggle('is-active', lang === 'vi');
    btnVi.setAttribute('aria-pressed', String(lang === 'vi'));
    btnEn.classList.toggle('is-active', lang === 'en');
    btnEn.setAttribute('aria-pressed', String(lang === 'en'));
  }

  translateDom();

  for (const fn of listeners) {
    try {
      fn(lang);
    } catch (e) {
      console.error('[i18n] listener error:', e);
    }
  }
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(keyPath, params = {}) {
  const parts = keyPath.split('.');
  let node = TRANSLATIONS[activeLang];
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) {
      node = node[p];
    } else {
      let fallbackNode = TRANSLATIONS[DEFAULT_LANG];
      for (const fp of parts) {
        if (fallbackNode && typeof fallbackNode === 'object' && fp in fallbackNode) {
          fallbackNode = fallbackNode[fp];
        } else {
          return keyPath;
        }
      }
      node = fallbackNode;
      break;
    }
  }

  if (typeof node === 'string') {
    return node.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match;
    });
  }

  return node !== undefined ? node : keyPath;
}

export function tField(obj, baseKey, lang = activeLang) {
  if (!obj || typeof obj !== 'object') return '';
  const langKey = `${baseKey}_${lang}`;
  if (obj[langKey]) return obj[langKey];
  if (obj[baseKey]) return obj[baseKey];
  const fallbackKey = `${baseKey}_${DEFAULT_LANG}`;
  if (obj[fallbackKey]) return obj[fallbackKey];
  return '';
}

export function translateDom() {
  document.documentElement.setAttribute('lang', activeLang);

  const btnVi = document.getElementById('lang-btn-vi');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnVi && btnEn) {
    btnVi.classList.toggle('is-active', activeLang === 'vi');
    btnVi.setAttribute('aria-pressed', String(activeLang === 'vi'));
    btnEn.classList.toggle('is-active', activeLang === 'en');
    btnEn.setAttribute('aria-pressed', String(activeLang === 'en'));
  }

  const metaTitle = t('meta.title');
  if (metaTitle && metaTitle !== 'meta.title') {
    document.title = metaTitle;
  }
  const metaDescEl = document.querySelector('meta[name="description"]');
  if (metaDescEl) {
    metaDescEl.setAttribute('content', t('meta.description'));
  }

  const elements = document.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    if (!key) continue;
    const isHtml = el.getAttribute('data-i18n-html') === 'true';
    const translated = t(key);
    if (translated && translated !== key) {
      if (isHtml) {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    }
  }

  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  for (const el of placeholders) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) continue;
    el.setAttribute('placeholder', t(key));
  }

  const titles = document.querySelectorAll('[data-i18n-title]');
  for (const el of titles) {
    const key = el.getAttribute('data-i18n-title');
    if (!key) continue;
    el.setAttribute('title', t(key));
  }

  const arias = document.querySelectorAll('[data-i18n-aria]');
  for (const el of arias) {
    const key = el.getAttribute('data-i18n-aria');
    if (!key) continue;
    el.setAttribute('aria-label', t(key));
  }
}
