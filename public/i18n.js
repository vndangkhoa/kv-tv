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
      description: 'Kho ứng dụng Android TV cài đặt sẵn — CloudStream 3, Jellyfin TV, Kodi 21 Omega, KV-Netflix và KV-Tube trên giao diện Metro typographic panorama.',
    },
    nav: {
      brand: 'KV-TV STORE · tv.vndns.net',
      theme_badge: 'KV-TV-THEME v1.0',
      store: '[ Kho Ứng Dụng (TV) ]',
      presets: '[ Bản Tích Hợp Sẵn ]',
      shortcodes: '[ Mã 5 Số Downloader ]',
      phoneqr: '[ QR & Đồng Hành ]',
      admin: '[ Quản Trị ]',
    },
    pivots: {
      store: 'kho ứng dụng',
      presets: 'bản cài sẵn',
      shortcodes: 'mã 5 số',
      phoneqr: 'qr mobile',
    },
    telemetry: {
      total_installs: 'LƯỢT TẢI',
      codes_range: 'MÃ 88000 · 88101–88105',
      edge_cdn: 'MẠNG CDN VN · tv.vndns.net',
    },
    decks: {
      store: '<strong>Kho Ứng Dụng Android TV Cài Đặt Sẵn</strong> — Không cần gõ link nguồn thủ công. Mọi APK đều tích hợp sẵn kho phim 4K Vietsub & Quốc tế, cấu hình phụ đề, và mã 5 số Downloader dùng được ngay.',
      presets: '<strong>Bộ Cài Đặt Sẵn & Sao Lưu KV-TV</strong> — Tải trực tiếp gói cấu hình <code>type=preset</code> hoặc file APK cài sẵn chi tiết từng tiện ích, nguồn phụ đề tiếng Việt và tùy chọn phần cứng.',
      shortcodes: '<strong>Danh Mục Mã 5 Số AFTVnews Downloader (88101–88105)</strong> — Nhập bất kỳ mã 5 số nào hoặc sao chép 1 chạm để tải trực tiếp APK cài sẵn trên Android TV Box.',
      phoneqr: '<strong>Cổng Sideload & Quảng Cáo Qua Điện Thoại / Máy Tính</strong> — Quét mã QR trực tiếp bằng camera điện thoại, xem các chương trình tài trợ, hoặc cài đặt ứng dụng qua mạng nội bộ gia đình.',
    },
    strip: {
      presets_title: 'gói cấu hình 1 chạm (.zip / .backup)',
      presets_body: 'Đã cài sẵn CloudStream, Kodi hoặc Jellyfin gốc? Tải ngay gói cấu hình độc lập của KV-TV để tích hợp kho phim Vietsub, tiện ích và cài đặt DoH 1.1.1.1 chỉ trong vài giây.',
      presets_badge: '5 GÓI CẤU HÌNH SẴN SÀNG',
      presets_btn: 'Tải Cấu Hình CS3',
      codes_title: 'danh mục mã số aftvnews downloader',
      codes_body: 'Mở ứng dụng Downloader trên mọi Android TV Box và nhập <strong class="tabular">88101</strong> (Jellyfin), <strong class="tabular">88102</strong> (Kodi 21), <strong class="tabular">88103</strong> (CloudStream 3), <strong class="tabular">88104</strong> (KV-Netflix), hoặc <strong class="tabular">88105</strong> (KV-Tube).',
      codes_badge: '302 CHUYỂN HƯỚNG APK TRỰC TIẾP',
      codes_btn: 'Mở Bàn Phím Số',
      sponsor_title: 'kv-tv vip box setup — trung tâm giải trí 4k',
      sponsor_body: 'Máy chủ đặt tại Việt Nam trên nền VPS NVMe tốc độ cao 1Gbps, tải APK cực nhanh và quét mã QR cài đặt tức thì.',
      sponsor_badge: 'MẠNG CDN VN · HOẠT ĐỘNG',
      sponsor_btn: 'QR & Quảng Cáo',
    },
    tiles: {
      dialer_title: 'mã 5 số',
      dialer_edition: 'Bàn Phím Số AFTV',
      dialer_action: 'NHẬP',
      dialer_status: 'Tải APK Tức Thì',
      qr_title: 'điện thoại & qr',
      qr_edition: 'Cài Mobile & Ưu Đãi',
      qr_action: 'QUÉT',
      installs_suffix: 'lượt cài',
    },
    matrix: {
      title: 'bộ cài đặt sẵn & bảng ma trận tối ưu hóa',
      desc: 'Mỗi bản dựng KV-TV bao gồm cả file APK cài đặt sẵn và tệp sao lưu cấu hình <code>type=preset</code> độc lập, ghi rõ các tiện ích mở rộng, nguồn phụ đề và thiết lập phần cứng.',
      archive_label: 'TỆP CẤU HÌNH',
      btn_download_preset: 'TẢI GÓI CẤU HÌNH SẴN (.ZIP)',
      btn_direct_apk: 'TẢI APK TRỰC TIẾP ({code})',
      btn_inspect_qr: 'XEM CHI TIẾT & MÃ QR',
    },
    directory: {
      title: 'danh mục mã 5 số aftvnews downloader',
      desc: 'Nhập bất kỳ mã 5 số nào (<strong class="tabular">88101</strong>–<strong class="tabular">88105</strong>) trong ứng dụng Downloader trên Android TV hoặc sao chép 1 chạm bên dưới.',
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
      hero_lead: 'Không còn cảnh gõ link nguồn mệt mỏi, lỗi plugin phụ đề hay chuột bay phiền toái. Mọi ứng dụng tại <strong>KV-TV Store</strong> (<code>tv.vndns.net</code>) đều được cấu hình sẵn trình phát 4K HDR, phụ đề tiếng Việt & tiếng Anh, và điều khiển chuẩn 10-foot bằng remote TV.',
      btn_download_companion: 'TẢI APK ĐỒNG HÀNH (88103)',
      btn_dialer: 'BÀN PHÍM MÃ SỐ (88101–88105)',
      btn_focus_panorama: 'CHUYỂN ĐẾN KHO ỨNG DỤNG',
      qr_heading: 'quét trên điện thoại hoặc tv',
      qr_caption: 'Dùng camera điện thoại quét tại đây hoặc nhập <strong>tv.vndns.net</strong> vào trình duyệt TV / Downloader.',
      step1_title: '1. mở trình duyệt tv hoặc downloader',
      step1_body: 'Mở <strong>TV Bro</strong>, <strong>Puffin TV</strong>, <strong>Zeus Browser</strong>, hoặc <strong>Downloader by AFTVnews</strong> từ Google Play trên TV Sony, TCL, Xiaomi hoặc TV Box.',
      step2_title: '2. nhập tv.vndns.net hoặc mã 5 số',
      step2_body: 'Truy cập <strong>tv.vndns.net</strong> để dùng kho ứng dụng đầy đủ, hoặc nhập mã 5 số (<code class="tabular">88101</code> Jellyfin, <code class="tabular">88102</code> Kodi, <code class="tabular">88103</code> CloudStream, <code class="tabular">88104</code> KV-Netflix, <code class="tabular">88105</code> KV-Tube).',
      step3_title: '3. cài đặt apk đã cấu hình sẵn',
      step3_body: 'Xác nhận cài đặt APK bằng nút OK trên remote. Các tiện ích mở rộng, codec 4K và phụ đề tiếng Việt đã sẵn sàng—mở là xem ngay!',
      campaigns_title: 'chương trình tài trợ & khuyến mãi',
      campaigns_desc: 'Các bản phát hành đặc biệt và gói giải trí được tuyển chọn, quản lý trực tiếp qua KV-TV Admin Console.',
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
      btn_apk: 'TẢI APK CÀI ĐẶT SẴN',
      btn_preset: 'TẢI GÓI CẤU HÌNH (.ZIP)',
      btn_copy: 'CHÉP MÃ SỐ',
      btn_install: 'CÀI ĐẶT',
      btn_update: 'CẬP NHẬT',
      btn_open: 'MỞ ỨNG DỤNG',
      btn_uninstall: 'GỠ CÀI ĐẶT',
    },
    dialog_dialer: {
      title: 'bàn phím nhập mã số',
      subtitle: 'Nhập mã AFTVnews Downloader 5 số (88101–88105)',
      close: 'ESC · ĐÓNG',
      btn_fetch: 'TẢI APK THEO MÃ SỐ',
      btn_inspect: 'XEM THÔNG SỐ BẢN DỰNG',
    },
    dialog_qr: {
      title: 'mã qr đồng hành cho điện thoại & tv',
      subtitle: 'Quét bằng camera điện thoại để cài đặt APK hoặc khám phá ưu đãi',
      close: 'ESC · ĐÓNG',
      desc: 'Chọn một ứng dụng KV-TV bên dưới để tạo mã QR tải tốc độ cao cho điện thoại hoặc trình duyệt Android TV:',
      sponsor_label: 'ĐƠN VỊ TÀI TRỢ',
      shortlink_label: 'LINK TRỰC TIẾP',
    },
    dpad: {
      title: 'REMOTE D-PAD',
      back: 'LÙI',
      up: 'LÊN',
      code: 'MÃ SỐ',
      left: 'TRÁI',
      ok: 'OK',
      right: 'PHẢI',
      qr: 'QR',
      down: 'XUỐNG',
      top: 'ĐẦU',
    },
    toasts: {
      copied: 'Đã sao chép mã số {code} vào bộ nhớ tạm!',
      fetching: 'Đang tải thông tin APK cho mã {code}...',
      invalid_code: 'Mã số không hợp lệ ({code}). Vui lòng nhập từ 88101 đến 88105.',
      starting_dl: 'Bắt đầu tải xuống {name} ({code})...',
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
      title: 'KV-TV Store · Metro Typographic Panorama (tv.vndns.net)',
      description: 'KV-TV Android TV App Store (tv.vndns.net) — Pre-configured CloudStream 3, Jellyfin TV, Kodi 21 Omega, KV-Netflix, and KV-Tube in kv-tv-theme.',
    },
    nav: {
      brand: 'KV-TV STORE · tv.vndns.net',
      theme_badge: 'KV-TV-THEME v1.0',
      store: '[ Storefront (TV) ]',
      presets: '[ Pre-Set Packs ]',
      shortcodes: '[ Short-Codes ]',
      phoneqr: '[ Phone & Promo Hub ]',
      admin: '[ Admin Console ]',
    },
    pivots: {
      store: 'store',
      presets: 'pre-sets',
      shortcodes: 'short-codes',
      phoneqr: 'phone-qr',
    },
    telemetry: {
      total_installs: 'TOTAL INSTALLS',
      codes_range: 'CODES 88000 · 88101–88105',
      edge_cdn: 'EDGE CDN · tv.vndns.net',
    },
    decks: {
      store: '<strong>Pre-Configured Android TV Storefront</strong> — Zero manual repo typing. Every APK ships with KV-TV Vietnamese & Global 4K repositories, subtitle profiles, and AFTVnews Downloader short-codes ready out of the box.',
      presets: '<strong>KV-TV Pre-Set Builds & Backup Packs</strong> — Download standalone <code>type=preset</code> configuration archives or pre-configured APKs detailing every pre-installed extension, subtitle provider, and player flag.',
      shortcodes: '<strong>AFTVnews 5-Digit Short-Code Directory (88101–88105)</strong> — Dial any 5-digit short-code or copy with one click to fetch pre-configured APKs directly on your Android TV box.',
      phoneqr: '<strong>Phone & Desktop Promotional & Sideload Hub</strong> — Scan the live QR code with your phone camera, explore sponsor campaigns, or sideload packages across your home network.',
    },
    strip: {
      presets_title: 'one-click pre-set config packs (.zip / .backup)',
      presets_body: 'Already installed vanilla CloudStream, Kodi, or Jellyfin? Grab the standalone KV-TV configuration bundle to inject MegaRepo, Vietsub providers, and 1.1.1.1 DoH settings in seconds.',
      presets_badge: '5 PRE-SET ARCHIVES READY',
      presets_btn: 'Download CS3 Pre-Set',
      codes_title: 'aftvnews downloader short-code index',
      codes_body: 'Open Downloader on any Android TV box and enter <strong class="tabular">88101</strong> (Jellyfin), <strong class="tabular">88102</strong> (Kodi 21), <strong class="tabular">88103</strong> (CloudStream 3), <strong class="tabular">88104</strong> (KV-Netflix), or <strong class="tabular">88105</strong> (KV-Tube).',
      codes_badge: '302 DIRECT APK REDIRECT',
      codes_btn: 'Launch Dialer',
      sponsor_title: 'kv-tv vip box setup — 4k cinema hub',
      sponsor_body: 'Hosted on low-latency Vietnam NVMe VPS with 1Gbps direct APK streams and instant QR phone companion sideloading.',
      sponsor_badge: 'VN EDGE CDN · ACTIVE',
      sponsor_btn: 'Phone QR & Promos',
    },
    tiles: {
      dialer_title: 'short-code',
      dialer_edition: '5-Digit AFTV Keypad',
      dialer_action: 'DIAL',
      dialer_status: 'Instant APK Fetch',
      qr_title: 'phone & qr',
      qr_edition: 'Mobile Sideload & Promo',
      qr_action: 'SCAN',
      installs_suffix: 'installs',
    },
    matrix: {
      title: 'pre-set backup packs & optimization matrix',
      desc: 'Every KV-TV build includes both a pre-configured APK and a standalone <code>type=preset</code> configuration archive detailing pre-installed extensions, subtitle providers, and hardware player flags.',
      archive_label: 'PRE-SET ARCHIVE',
      btn_download_preset: 'DOWNLOAD PRE-SET PACK (.ZIP)',
      btn_direct_apk: 'DIRECT APK ({code})',
      btn_inspect_qr: 'INSPECT & QR',
    },
    directory: {
      title: '5-digit aftvnews downloader short-code directory',
      desc: 'Type any 5-digit code (<strong class="tabular">88101</strong>–<strong class="tabular">88105</strong>) inside the AFTVnews Downloader app on Android TV or copy a code with one click below.',
      dialer_title: 'instant short-code dialer',
      dialer_desc: 'Dial a 5-digit code to trigger immediate APK download or inspect package specs.',
      btn_fetch_apk: 'FETCH APK BY CODE',
      btn_open_keypad: 'OPEN FULL KEYPAD',
      btn_copy: 'COPY',
      btn_apk: 'APK',
      btn_qr: 'QR',
    },
    promo: {
      hero_title: 'install on any android tv in 60 seconds',
      hero_lead: 'Skip tedious repository typing, broken subtitle plugins, and air-mouse headaches. Every APK in <strong>KV-TV Store</strong> (<code>tv.vndns.net</code>) ships pre-configured with 4K HDR hardware players, Vietnamese & English subtitles, and 10-foot D-Pad remote navigation out of the box.',
      btn_download_companion: 'DOWNLOAD COMPANION APK (88103)',
      btn_dialer: 'SHORT-CODE DIALER (88101–88105)',
      btn_focus_panorama: 'FOCUS LIVE TILE PANORAMA',
      qr_heading: 'scan on phone or tv',
      qr_caption: 'Point your phone camera here or type <strong>tv.vndns.net</strong> in your TV browser or Downloader app.',
      step1_title: '1. open tv browser or downloader',
      step1_body: 'Launch <strong>TV Bro</strong>, <strong>Puffin TV</strong>, <strong>Zeus Browser</strong>, or <strong>Downloader by AFTVnews</strong> from Google Play on your Sony, TCL, Xiaomi, or Android TV Box.',
      step2_title: '2. enter tv.vndns.net or 5-digit code',
      step2_body: 'Navigate to <strong>tv.vndns.net</strong> for the full D-Pad store, or enter a 5-digit short-code (<code class="tabular">88101</code> Jellyfin, <code class="tabular">88102</code> Kodi, <code class="tabular">88103</code> CloudStream, <code class="tabular">88104</code> KV-Netflix, <code class="tabular">88105</code> KV-Tube).',
      step3_title: '3. install pre-configured apk',
      step3_body: 'Confirm APK installation with your remote OK button. Extensions, 4K codecs, and Vietnamese/English subtitle providers are already configured—open and play!',
      campaigns_title: 'active promotional & sponsor campaigns',
      campaigns_desc: 'Curated seasonal builds and hardware-verified media bundles managed live via the KV-TV Admin Console.',
      table_title: 'sideload & package reference matrix',
      table_desc: 'Direct APK links, standalone Pre-Set packs, SHA/package identifiers, and live install telemetry.',
      search_placeholder: 'Filter by app, code (88103), or package...',
      th_app: 'Application',
      th_code: 'Short-Code',
      th_pkg: 'Package Identifier',
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
      qr_caption: 'SCAN FOR APK · {code}',
      btn_apk: 'DOWNLOAD PRE-CONFIGURED APK',
      btn_preset: 'DOWNLOAD PRE-SET PACK (.ZIP)',
      btn_copy: 'COPY SHORT-CODE',
      btn_install: 'INSTALL',
      btn_update: 'UPDATE',
      btn_open: 'OPEN APP',
      btn_uninstall: 'UNINSTALL',
    },
    dialog_dialer: {
      title: 'short-code dialer',
      subtitle: 'Enter 5-digit AFTVnews Downloader code (88101–88105)',
      close: 'ESC · CLOSE',
      btn_fetch: 'FETCH APK BY CODE',
      btn_inspect: 'INSPECT BUILD DETAILS',
    },
    dialog_qr: {
      title: 'phone & tv qr companion',
      subtitle: 'Scan with phone camera to sideload APKs or browse sponsor offers',
      close: 'ESC · CLOSE',
      desc: 'Select any KV-TV build below to generate a direct high-speed download QR code for your phone or Android TV browser:',
      sponsor_label: 'ACTIVE SPONSOR',
      shortlink_label: 'DIRECT SHORTLINK',
    },
    dpad: {
      title: 'D-PAD REMOTE',
      back: 'BACK',
      up: 'UP',
      code: 'CODE',
      left: 'LEFT',
      ok: 'OK',
      right: 'RIGHT',
      qr: 'QR',
      down: 'DOWN',
      top: 'TOP',
    },
    toasts: {
      copied: 'Copied Short-Code {code} to clipboard!',
      fetching: 'Fetching APK for Short-Code {code}...',
      invalid_code: 'Invalid Short-Code ({code}). Please enter 88101 through 88105.',
      starting_dl: 'Starting download for {name} ({code})...',
      switched_vi: 'Đã chuyển giao diện sang Tiếng Việt.',
      switched_en: 'Switched interface to English.',
    },
    tickers: [
      'KV-Netflix 4K VIP: All VN 4K Repos Pre-Configured',
      'DNS-over-HTTPS (1.1.1.1): VN ISP Anti-Block Enabled',
      '10-Foot Format: Smooth D-Pad remote navigation, zero air-mouse',
      'One-Click Backup & Restore: Instant config import via .json / .backup',
    ],
  },
};

let currentLang = DEFAULT_LANG;
const listeners = new Set();

/**
 * Detect language based on waterfall cascade:
 * 1. localStorage override ('kvtv_lang')
 * 2. URL search param (?lang=vi or ?lang=en)
 * 3. Server suggested lang (from geo/header)
 * 4. Browser navigator language (check for 'vi')
 * 5. Default fallback -> 'vi'
 */
export function detectInitialLanguage(serverSuggestedLang = null) {
  // 1. Explicit override in localStorage
  try {
    const saved = localStorage.getItem('kvtv_lang');
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {}

  // 2. URL query param
  try {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'vi' || param === 'en') {
      try { localStorage.setItem('kvtv_lang', param); } catch {}
      return param;
    }
  } catch {}

  // 3. Server suggestion (GeoIP or accept-language)
  if (serverSuggestedLang === 'vi' || serverSuggestedLang === 'en') {
    return serverSuggestedLang;
  }

  // 4. Browser language
  try {
    const langs = navigator.languages || [navigator.language || ''];
    const hasVi = langs.some((l) => String(l).toLowerCase().startsWith('vi'));
    if (hasVi) return 'vi';
  } catch {}

  // 5. Default to Vietnamese
  return DEFAULT_LANG;
}

export function getCurrentLanguage() {
  return currentLang;
}

export function setLanguage(lang, persist = true) {
  if (!SUPPORTED_LANGS.includes(lang)) {
    lang = DEFAULT_LANG;
  }
  currentLang = lang;
  document.documentElement.lang = lang;

  if (persist) {
    try {
      localStorage.setItem('kvtv_lang', lang);
    } catch {}
  }

  // Update switcher UI buttons if present
  const btnVi = document.getElementById('lang-btn-vi');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnVi && btnEn) {
    const isVi = lang === 'vi';
    btnVi.classList.toggle('is-active', isVi);
    btnVi.setAttribute('aria-pressed', isVi ? 'true' : 'false');
    btnEn.classList.toggle('is-active', !isVi);
    btnEn.setAttribute('aria-pressed', !isVi ? 'true' : 'false');
  }

  // Notify subscribers
  for (const fn of listeners) {
    try {
      fn(currentLang);
    } catch (err) {
      console.error('[i18n] listener error:', err);
    }
  }
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Retrieve translation by dotted path (e.g. 'nav.store')
 */
export function t(path, params = {}) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
  const parts = path.split('.');
  let cur = dict;
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in cur) {
      cur = cur[part];
    } else {
      // Fallback to Vietnamese dictionary
      let fallback = TRANSLATIONS[DEFAULT_LANG];
      for (const p of parts) {
        if (fallback && typeof fallback === 'object' && p in fallback) {
          fallback = fallback[p];
        } else {
          fallback = path;
          break;
        }
      }
      cur = fallback;
      break;
    }
  }

  if (typeof cur !== 'string') return path;

  // Replace {variables}
  return cur.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? params[key] : `{${key}}`;
  });
}

/**
 * Extract localized attribute from data object
 * e.g. tField(app, 'edition') checks app.edition_vi -> app.edition -> app.edition_en
 */
export function tField(obj, fieldName, lang = currentLang) {
  if (!obj) return '';
  const altLang = lang === 'vi' ? 'en' : 'vi';
  return (
    obj[`${fieldName}_${lang}`] ||
    obj[fieldName] ||
    obj[`${fieldName}_${altLang}`] ||
    ''
  );
}

/**
 * Apply translations to all DOM elements with data-i18n attributes
 */
export function translateDom() {
  // Translate textContent / innerHTML
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const isHtml = el.getAttribute('data-i18n-html') === 'true';
    const translation = t(key);
    if (isHtml) {
      el.innerHTML = translation;
    } else {
      el.textContent = translation;
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  // Translate titles / aria-labels
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });

  // Update document title and meta description
  document.title = t('meta.title');
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', t('meta.description'));
  }
}
