# KV-TV Store — Internationalization (i18n) Architecture & Specification
## Tiếng Việt & English Dual-Language Engine for Metro Typographic Panorama

- **System Domain**: `tv.vndns.net`
- **Design System**: `kv-tv-theme` v1.0 (Metro Typographic Panorama, Zune HD / Windows Phone 7 lineage)
- **Supported Locales**: `vi` (Tiếng Việt - Default for Vietnam), `en` (English - Global fallback)
- **Zero-Bloat Rule**: Pure vanilla JS / ES Module, <100ms first render on budget 1GB/2GB RAM Android TV boxes.

---

## 1. Executive Architecture Overview

KV-TV Store serves three distinct audiences:
1. **Primary TV Viewers in Vietnam**: Navigating on Android TV boxes (Sony, TCL, Xiaomi, Amlogic/Rockchip) with 10-foot D-Pad remotes from 3 meters away.
2. **Global & Tech-Enthusiast TV Users**: English-speaking or bilingual users looking for direct APK sideloading and pre-set configurations.
3. **Store Administrator**: Managing APK builds, promotional ads, and TOTP 2FA telemetry.

The i18n architecture solves bilingual support across static HTML, dynamically rendered live tiles, short-code dialers, modals, remote simulator, and backend store models without compromising TV performance.

### Architectural Core Principles
- **Deterministic Language Cascade**: User Override (`localStorage`) > URL Param (`?lang=`) > Server GeoIP Hint (`cf-ipcountry`) > Browser Locale (`navigator.language`) > Default (`vi`).
- **Instant Client-Side Switching**: Dual-language data payloads (`field_vi` / `field_en`) allow instantaneous switching without network re-fetches.
- **Strict Metro Design Discipline**: 0px border-radius, pure OLED black `#000000`, `JetBrains Mono` bracketed buttons `[ VI | EN ]` matching `.kv-topbar-link`.
- **D-Pad Remote Accessibility**: The language switcher is fully focusable via directional remote navigation (`tabindex="0"`, 3px high-contrast outline).

---

## 2. String Display Audit in the Existing Codebase

| Category | File | Implementation Method | Strings / Content Affected |
| :--- | :--- | :--- | :--- |
| **Static Chrome & Navigation** | `public/index.html` | Hardcoded HTML tags | Topbar links `[ Storefront (TV) ]`, `[ Pre-Set Packs ]`, `[ Short-Codes ]`, `[ Phone & Promo Hub ]`, `[ Admin Console ]`, badge `KV-TV-THEME v1.0` |
| **Metro Panorama Header** | `public/index.html`, `public/app.js` | HTML + `PIVOT_DESCRIPTIONS` dictionary | Tabs `store`, `pre-sets`, `short-codes`, `phone-qr`; subbar deck descriptions; telemetry labels `TOTAL INSTALLS`, `CODES 88101–88105` |
| **Metro Live Tiles** | `public/index.html`, `public/app.js` | Hardcoded HTML hydrated by JS | App names, editions (`KV-PreSetup · All VN & Global 4K Repos`), status tickers (`csMessages`), meta badges (`installs`), action buttons (`DIAL`, `SCAN`) |
| **Lower Feature Strip** | `public/index.html` | Hardcoded 3-column articles | Strip block headings, descriptions, buttons (`Download CS3 Pre-Set`, `Launch Dialer`, `Phone QR & Promos`) |
| **Pivot: Pre-Sets Matrix** | `public/app.js` (`renderPresetsMatrix`) | Dynamic template literals | Section header, `app.edition`, `app.description`, `app.presetFeatures`, buttons (`DOWNLOAD PRE-SET PACK (.ZIP)`, `APK (...)`, `INSPECT & QR`) |
| **Pivot: Short-Codes Directory** | `public/app.js` (`renderShortCodesDirectory`) | Dynamic template literals | Directory rows, buttons (`COPY 881xx`, `DIRECT APK`, `QR & SPECS`), inline dialer headings and status |
| **Pivot: Phone-QR & Promo Hub** | `public/index.html`, `public/app.js` | HTML + dynamic table/ads | Hero title (`install on any android tv in 60 seconds`), lead paragraph, 3-step setup guide cards, table column headers, search placeholder |
| **Native `<dialog>` Modals** | `public/index.html`, `public/app.js` | Static markup + JS population | Spec labels (`SHORT-CODE`, `VERSION & SIZE`, `PACKAGE ID`, `ARCHITECTURE`), keypad buttons (`CLR`, `DEL`), modal CTA buttons |
| **D-Pad Remote Simulator** | `public/index.html` | Hardcoded SVG / buttons | `D-PAD REMOTE`, button text and titles (`BACK`, `UP`, `CODE`, `LEFT`, `OK`, `RIGHT`, `QR`, `DOWN`, `TOP`) |
| **Toast & Status Notifications** | `public/app.js` | String interpolation in `showToast` | `"Fetching APK for Short-Code..."`, `"Copied Short-Code..."`, `"Starting download..."` |
| **Backend & Store Model** | `data/store.json`, `lib/seed.js` | JSON attributes | `edition`, `description`, `presetSummary`, `presetFeatures`, ad `title`, `subtitle`, `badge`, `ctaText` |

---

## 3. Language Resolution Pipeline

The language is determined at runtime using the following 5-tier waterfall:

```
[1. User Preference] -----> localStorage.getItem('kvtv_lang') ('vi' | 'en')
         | (null)
[2. URL Parameter]   -----> ?lang=vi or ?lang=en (persists to localStorage)
         | (null)
[3. Server GeoIP]    -----> cf-ipcountry: 'VN' or suggestedLang from /api/catalog
         | (null)
[4. Browser Locale]  -----> navigator.languages / navigator.language ('vi'*)
         | (null)
[5. Site Default]    -----> 'vi' (Tiếng Việt)
```

### Detection Implementation
```javascript
export function detectInitialLanguage(serverSuggestedLang = null) {
  // 1. Explicit user override in localStorage
  try {
    const saved = localStorage.getItem('kvtv_lang');
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {}

  // 2. URL parameter override (?lang=vi or ?lang=en)
  try {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'vi' || param === 'en') {
      try { localStorage.setItem('kvtv_lang', param); } catch {}
      return param;
    }
  } catch {}

  // 3. Server GeoIP / Suggested language header
  if (serverSuggestedLang === 'vi' || serverSuggestedLang === 'en') {
    return serverSuggestedLang;
  }

  // 4. Browser locale detection (navigator.language)
  const navLangs = navigator.languages || [navigator.language || ''];
  const hasVietnamese = navLangs.some((l) => String(l).toLowerCase().startsWith('vi'));
  if (hasVietnamese) return 'vi';

  // 5. Default fallback: Vietnamese (Core audience for tv.vndns.net)
  return 'vi';
}
```

---

## 4. Metro Topbar Toggle UI Specification

In accordance with `DESIGN.md`, the UI language toggle lives in the persistent Metro topbar (`.kv-topbar-nav`). It uses bracketed monospace typography and zero-radius geometry.

### HTML Markup (`public/index.html`)
```html
<div class="kv-lang-switcher" role="group" aria-label="Ngôn ngữ / Language">
  <button
    type="button"
    class="kv-topbar-link kv-lang-btn is-active"
    id="lang-btn-vi"
    data-lang="vi"
    aria-pressed="true"
    title="Tiếng Việt"
  >[ VI ]</button>
  <button
    type="button"
    class="kv-topbar-link kv-lang-btn"
    id="lang-btn-en"
    data-lang="en"
    aria-pressed="false"
    title="English"
  >[ EN ]</button>
</div>
```

### CSS Tokens & Rules (`public/kv-tv-theme.css`)
```css
/* Metro Language Switcher (.kv-lang-switcher) */
.kv-lang-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background-color: var(--kv-bg-surface);
  border: 1px solid var(--kv-border-hairline);
  padding: 1px;
}

.kv-lang-btn {
  appearance: none;
  font-family: var(--kv-font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--kv-fg-muted);
  background-color: transparent;
  border: 1px solid transparent;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 0px;
  transition:
    background-color 120ms var(--kv-ease-out-expo),
    color 120ms var(--kv-ease-out-expo),
    border-color 120ms var(--kv-ease-out-expo);
}

.kv-lang-btn:hover,
.kv-lang-btn:focus-visible {
  color: var(--kv-fg-primary);
  border-color: var(--kv-fg-primary);
  outline: none;
}

.kv-lang-btn.is-active,
.kv-lang-btn[aria-pressed="true"] {
  background-color: var(--kv-cobalt);
  color: var(--kv-fg-primary);
  border-color: var(--kv-fg-primary);
}
```

---

## 5. Translation Dictionary Architecture (`public/i18n.js`)

A dedicated zero-dependency module `public/i18n.js` maintains full dictionaries with hierarchical namespaces:
- `meta`: HTML document metadata
- `nav`: Topbar navigation
- `pivots`: Metro panorama tab labels
- `decks`: Metro panorama deck subbar explanations
- `strip`: 3-Column lower feature blocks
- `presets`: Matrix section title and card action buttons
- `shortcodes`: Directory headings, action buttons, dialer
- `promo`: Hero banner, 3-step setup cards, table headings
- `dialogs`: App command modal, 5-digit dialer modal, phone QR modal
- `dpad`: D-Pad remote simulation controls
- `toasts`: Dynamic notification messages
- `tickers`: CloudStream 3 live tile cycling status ticker messages

### Dual-Language Catalog Field Extractor
```javascript
export function tField(obj, fieldName, lang = 'vi') {
  if (!obj) return '';
  // Fallback chain: specific lang -> opposite lang -> baseline field
  return (
    obj[`${fieldName}_${lang}`] ||
    obj[fieldName] ||
    obj[`${fieldName}_${lang === 'vi' ? 'en' : 'vi'}`] ||
    ''
  );
}
```

---

## 6. Dynamic Content Schema (`data/store.json` & `lib/seed.js`)

Each app in `data/store.json` carries bilingual fields alongside traditional fields for complete backward compatibility:

```json
{
  "id": "cloudstream-kv",
  "name": "CloudStream 3",
  "edition": "KV-PreSetup (Full Repos)",
  "edition_en": "KV-PreSetup (Full Repos)",
  "edition_vi": "Bản tích hợp sẵn (Full Kho Phim Vietsub)",
  "shortCode": "88103",
  "category": "Streaming",
  "category_en": "Streaming",
  "category_vi": "Phim & Trực tuyến",
  "presetSummary": "Our already-setup build: Vietnamese & Global repositories pre-installed & auto-updated",
  "presetSummary_en": "Our already-setup build: Vietnamese & Global repositories pre-installed & auto-updated",
  "presetSummary_vi": "Bản cài đặt sẵn: Tích hợp đầy đủ nguồn phim Việt Nam & Quốc tế, tự động cập nhật",
  "description": "Zero manual repository typing required. Ships with MegaRepo and Vietnamese HD movie/anime extensions pre-activated, Cloudflare DoH enabled, and automatic 4K Vietsub stream selection.",
  "description_en": "Zero manual repository typing required. Ships with MegaRepo and Vietnamese HD movie/anime extensions pre-activated, Cloudflare DoH enabled, and automatic 4K Vietsub stream selection.",
  "description_vi": "Không cần gõ link nguồn thủ công. Cài sẵn MegaRepo cùng các tiện ích phim/anime HD Việt Nam, bật sẵn Cloudflare DoH và tự động ưu tiên luồng 4K Vietsub tốt nhất.",
  "presetFeatures_en": [
    "Pre-configured MegaRepo + Vietnamese HD Movie/Anime extensions",
    "Auto-selects 1080p/4K highest-bitrate stream with Vietsub",
    "DNS-over-HTTPS (Cloudflare 1.1.1.1) pre-enabled to bypass ISP blocks",
    "One-click Pre-Set Backup (.backup) restore included"
  ],
  "presetFeatures_vi": [
    "Cài sẵn MegaRepo + Tiện ích mở rộng Phim/Anime HD Vietsub",
    "Tự động chọn nguồn phim 1080p/4K bitrate cao nhất kèm phụ đề tiếng Việt",
    "Bật sẵn DNS-over-HTTPS (Cloudflare 1.1.1.1) chống chặn nhà mạng",
    "Hỗ trợ khôi phục 1 chạm từ tệp sao lưu (.backup)"
  ]
}
```

---

## 7. Server-Side GeoIP Integration (`server.js`)

In `server.js`, `/api/catalog` checks reverse-proxy headers from Nginx / Cloudflare and passes geo intelligence to the frontend:

```javascript
// Inside server.js GET /api/catalog router
const cfCountry = String(req.headers['cf-ipcountry'] || '').toUpperCase();
const xCountry = String(req.headers['x-country-code'] || '').toUpperCase();
const acceptLang = String(req.headers['accept-language'] || '').toLowerCase();

const isVietnam = cfCountry === 'VN' || xCountry === 'VN';
const prefersVietnamese = isVietnam || /vi([-_][a-zA-Z]{2})?|vi-vn/i.test(acceptLang);
const suggestedLang = prefersVietnamese ? 'vi' : 'en';

sendJson(req, res, 200, {
  storeInfo: store.storeInfo,
  suggestedLang,
  clientCountry: cfCountry || xCountry || 'UNKNOWN',
  apps: store.apps,
  ads: store.ads.filter((a) => a.active !== false),
  categories: store.categories,
});
```

---

## 8. Summary of Benefits
1. **Instant Switching (0ms delay)**: Entire dictionary and bilingual catalog fields are in-memory.
2. **Preserves 10-Foot Focus & Spatial Nav**: Remote simulator, roving tabindex, and shortcuts continue operating without re-initializing DOM focus traps.
3. **No Heavy Dependencies**: 0 KB added from external libraries (no React, i18next, or Vue-i18n needed).
4. **Culturally Grounded Vietnamese**: Terminology aligned with Vietnamese TV Box users (Phụ đề Vietsub, Mã 5 số Downloader, Giải mã phần cứng 4K HDR).
