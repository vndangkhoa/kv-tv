# KV-TV Theme (`kv-tv-theme`) — Master Playbook & Starter Kit

> **Canonical Reference:** [`DESIGN.md`](../DESIGN.md) · **Machine Sidecar:** [`.impeccable/design.json`](../.impeccable/design.json) · **Shared Stylesheet:** `/kv-tv-theme.css`
> **Design Canon:** Windows Phone 7 / Zune HD Metro (`digital-design-canon-metro-typographic-tiles`)
> **Creative North Star:** *"The OLED Typographic Panorama"*

This playbook is your copy-paste engineering and design manual for building any new page, module, or standalone application in the KV-TV ecosystem (`tv.vndns.net`, `kv-netflix`, `kv-tube`, `cloudstream-kv`, `jellyfin-kv`, `kodi-kv`, or new Admin/Telemetry dashboards) with **100% visual and interactive fidelity**.

---

## 1. Core Philosophy & The 7 Golden Laws of `kv-tv-theme`

`kv-tv-theme` treats **oversized light-weight typography**, **unmodulated flat color blocks**, and **pure OLED pitch-black space** as its only building materials. Every screen must pass the **7 Golden Laws**:

1. **Law 1 — Pure OLED Pitch-Black Ground (`#000000`):**
   `html`, `body`, and `.metro-grid` / `.kv-grid` always sit on `#000000` (`--bg-oled`). On living-room OLED TVs, the `12px` grid gutters turn off the physical pixels completely, making the color-block tiles float in space without a single drop shadow.
2. **Law 2 — Absolute Zero-Radius Geometry (`0px`):**
   `* { border-radius: 0px; }` is law. Tiles, buttons, badges, inputs, QR frames, tables, and `<dialog>` modals use crisp 90-degree right angles. Pill badges and rounded cards are strictly forbidden.
3. **Law 3 — Giant Weight-`200` Lowercase Panorama Pivots:**
   Section headers and view switchers use `Work Sans` at `font-weight: 200`, `clamp(2.8rem, 5vw, 4.6rem)`, `letter-spacing: -0.04em`, and `text-transform: lowercase` (`store`, `pre-sets`, `short-codes`, `phone-qr`, `overview`, `applications`, `promotions`). Active pivot is `#FFFFFF`; inactive pivots are `rgba(255, 255, 255, 0.58)`.
4. **Law 4 — Flat Unmodulated Color-Block Live Tiles:**
   Every tile and KPI block is filled with one solid, high-chroma color (`#0078D7`, `#6B21A8`, `#008272`, `#D83B01`, `#B91C1C`, `#107C10`, `#B45309`) and `#FFFFFF` foreground ink/icons. Never use gradients, background photos, or dark-gray cards where a color block belongs.
5. **Law 5 — Razor-Sharp `4px solid #FFFFFF` D-Pad Focus Ring:**
   10-foot TV navigation requires instant visual certainty from 3 meters away. Focused tiles scale to `1.022` with `outline: 4px solid #FFFFFF; outline-offset: 2px` and zero blurred glow.
6. **Law 6 — `tabular-nums` Monospace Telemetry & `12px` Floor:**
   All 5-digit short-codes (`88101`–`88105`), install counts, file sizes, version tags, and timestamps use `JetBrains Mono` with `font-variant-numeric: tabular-nums`. No text anywhere may be smaller than `0.75rem` (`12px`).
7. **Law 7 — Zero Banned AI Clichés:**
   No `backdrop-filter: blur()`, no glassmorphism, no `box-shadow` or neon glow, no gradient text, and no unrequested decorative chrome.

---

## 2. Quick-Start Integration (New Page in 60 Seconds)

Drop this HTML skeleton into any new page or app to inherit the complete `kv-tv-theme` token system, fonts, topbar, panorama header, and responsive grid:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KV-TV App · Metro Typographic Panorama</title>
  <meta name="theme-color" content="#000000">
  <!-- 1. Canonical Fonts: Work Sans (200..700) + JetBrains Mono (400..700) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Work+Sans:wght@200;300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- 2. Shared KV-TV Theme Stylesheet -->
  <link rel="stylesheet" href="/kv-tv-theme.css">
</head>
<body>
  <!-- Persistent Top Chrome Bar -->
  <nav class="kv-topbar mockup-switcher" aria-label="System Navigation">
    <a class="switcher-brand" href="/">
      <span class="switcher-brand-mark" aria-hidden="true"></span>
      <span>KV-TV STORE · tv.vndns.net</span>
    </a>
    <div class="switcher-links">
      <a class="switcher-link" href="/" aria-current="page">[ Storefront ]</a>
      <a class="switcher-link" href="/admin">[ Admin Console ]</a>
    </div>
  </nav>

  <!-- Main Metro Panorama Stage -->
  <main class="metro-stage kv-stage">
    <header class="panorama-header">
      <div class="panorama-pivots kv-pivots" role="tablist" aria-label="Panorama Sections">
        <button type="button" class="pivot-btn" role="tab" aria-selected="true" data-pivot="all">catalog</button>
        <button type="button" class="pivot-btn" role="tab" aria-selected="false" data-pivot="4k">4k-hdr</button>
        <button type="button" class="pivot-btn" role="tab" aria-selected="false" data-pivot="live">live-tv</button>
      </div>
      <div class="panorama-subbar">
        <p class="panorama-deck">
          <strong>KV-TV Panorama Surface</strong> — Pure OLED #000000 canvas with 10-foot D-Pad spatial navigation.
        </p>
        <div class="panorama-telemetry">
          <span class="telemetry-pill">
            <span class="telemetry-dot" aria-hidden="true"></span>
            <span>EDGE CDN ONLINE</span>
          </span>
          <span class="telemetry-pill tabular">CODES 88101–88105</span>
        </div>
      </div>
    </header>

    <!-- 6-Column Asymmetric Live Tile Matrix -->
    <section id="metro-grid" class="metro-grid kv-grid" aria-label="Live Tiles">
      <!-- Add .metro-tile blocks here (see Recipe 3) -->
    </section>
  </main>
</body>
</html>
```

---

## 3. Color Token & App Brand Assignment Matrix

Every app, utility, and KPI state in `kv-tv-theme` maps to a dedicated CSS variable and utility class. Always pair the seven Metro color blocks with `#FFFFFF` text and icons.

### Metro Flat Color-Block Tokens

| Token Name | CSS Variable | Tile / Utility Class | Canonical Hex | Assigned App / Semantic Role | Short-Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Metro Cobalt** | `--metro-cobalt` | `.tile-cobalt` | `#0078D7` | **CloudStream 3** (`cloudstream-kv`), Primary Brand, Active Nav, Primary Button Hover | `88103` |
| **Royal Violet** | `--metro-violet` | `.tile-violet` | `#6B21A8` | **Jellyfin TV** (`jellyfin-kv`), Media Server Telemetry, Secondary KPI Tile | `88101` |
| **Metro Teal** | `--metro-teal` | `.tile-teal` | `#008272` | **Kodi 21 Omega** (`kodi-kv`), Pre-Set Zip Bundles, Build / Repo Status | `88102` |
| **Cinema Crimson** | `--metro-crimson` | `.tile-crimson` | `#D83B01` | **KV-Netflix** (`netflix-kv`), 4K Cinema App, Destructive / Reset Actions | `88104` |
| **Broadcast Vermilion** | `--metro-vermilion` | `.tile-vermilion` | `#B91C1C` | **KV-Tube / SmartTube** (`youtube-kv`), Ad-Free 4K60 Video & Broadcast | `88105` |
| **Signal Emerald** | `--metro-emerald` | `.tile-emerald` | `#107C10` | **5-Digit Short-Code Dialer**, CDN Online Dot, Active Promo Badge | `DIAL` |
| **Editorial Amber** | `--metro-amber` | `.tile-amber` | `#B45309` | **Phone & TV QR Companion**, Featured Promo Banner, Warning Callouts | `QR` |

### Surface, Ink & Border Tokens

| Token Name | CSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| **OLED Void** | `--bg-oled` | `#000000` | Root `html`, `body`, `.metro-grid` gutters, inputs, spec wells |
| **Surface Chrome** | `--bg-chrome` | `#0A0A0A` | `.kv-topbar` / `.mockup-switcher`, floating `.dpad-simulator` |
| **Surface Card** | `--bg-surface` | `#121212` | `.strip-block`, `<dialog>` body, admin form/table containers |
| **Surface Elevated** | `--bg-surface-elevated` | `#1C1C1C` | `.dialer-key`, table header rows, D-Pad buttons |
| **Ink Primary** | `--fg-primary` | `#FFFFFF` | All tile text, active pivots, primary headings, `4px` focus outlines |
| **Ink Secondary** | `--fg-secondary` | `#D4D4D4` / `rgba(255,255,255,0.82)` | Subbar deck copy, table cells, inactive topbar links |
| **Ink Muted** | `--fg-muted` | `#8E8E8E` / `rgba(255,255,255,0.65)` | Spec labels, metadata captions |
| **Pivot Inactive** | `--fg-pivot-inactive` | `rgba(255,255,255,0.58)` | Unselected `.pivot-btn` headers |
| **Border Hairline** | `--border-hairline` | `#262626` / `rgba(255,255,255,0.18)` | `1px solid` section dividers, table borders, telemetry pills |
| **Border Strong** | `--border-strong` | `#454545` / `rgba(255,255,255,0.38)` | `1px solid` input borders, keypad buttons |

---

## 4. Component Copy-Paste Recipes

### Recipe 1: Top System Bar (`.kv-topbar` / `.mockup-switcher`)

Use at the very top of every storefront, app, or admin page:

```html
<nav class="kv-topbar mockup-switcher" aria-label="System Switcher">
  <a class="switcher-brand" href="/">
    <span class="switcher-brand-mark" aria-hidden="true"></span>
    <span>KV-TV STORE · tv.vndns.net</span>
  </a>
  <div class="switcher-links">
    <a class="switcher-link" href="/" aria-current="page">[ 1 · Storefront Panorama ]</a>
    <a class="switcher-link" href="/?mode=classic">[ Classic View ]</a>
    <a class="switcher-link" href="/admin">[ Admin Console ]</a>
  </div>
</nav>
```

---

### Recipe 2: Giant Lowercase Panorama Pivot Header (`.kv-pivots` / `.panorama-header`)

The signature Zune/Windows Phone 7 header rail. Clicking any `.pivot-btn` updates `aria-selected="true"` and filters or switches the active stage:

```html
<header class="panorama-header">
  <div class="panorama-pivots kv-pivots" role="tablist" aria-label="Metro Panorama Pivots">
    <button type="button" class="pivot-btn" role="tab" aria-selected="true" data-pivot="store">store</button>
    <button type="button" class="pivot-btn" role="tab" aria-selected="false" data-pivot="pre-sets">pre-sets</button>
    <button type="button" class="pivot-btn" role="tab" aria-selected="false" data-pivot="short-codes">short-codes</button>
    <button type="button" class="pivot-btn" role="tab" aria-selected="false" data-pivot="phone-qr">phone-qr</button>
  </div>
  <div class="panorama-subbar">
    <p class="panorama-deck" id="panorama-deck-text">
      <strong>Pre-Configured Android TV Storefront</strong> — Zero manual repo typing. Every APK ships with KV-TV Vietnamese &amp; Global 4K repositories ready out of the box.
    </p>
    <div class="panorama-telemetry">
      <span class="telemetry-pill">
        <span class="telemetry-dot" aria-hidden="true"></span>
        <span>EDGE CDN · tv.vndns.net</span>
      </span>
      <span class="telemetry-pill tabular">18,060 TOTAL INSTALLS</span>
      <span class="telemetry-pill tabular">CODES 88101–88105</span>
    </div>
  </div>
</header>
```

---

### Recipe 3: Asymmetric 6-Column Live Tile Grid (`2×2`, `2×1`, `1×1` Tiles)

The `.metro-grid` container divides the stage into 6 equal columns (`repeat(6, minmax(0, 1fr))`) with `12px` gutters. Combine `.span-2x2` (Hero), `.span-2x1` (Wide), and `.span-1x1` (Square) tiles so rows sum to 6 columns:

```html
<section id="metro-grid" class="metro-grid kv-grid" aria-label="Featured Live Tiles">
  <!-- 2x2 HERO LIVE TILE (CloudStream 3 · Cobalt #0078D7) -->
  <button
    type="button"
    class="metro-tile tile-cobalt span-2x2"
    tabindex="0"
    data-tile-kind="app"
    data-app-id="cloudstream-kv"
    data-short-code="88103"
  >
    <div class="tile-top">
      <svg class="tile-glyph" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
        <path d="M14 34H35C40 34 43 30.5 43 26C43 21.8 39.8 18.4 35.5 18.1C34.2 11.8 28.6 7 22 7C14.3 7 8 13.3 8 21C8 21.6 8.1 22.2 8.2 22.8C5.2 24.1 3 27.1 3 30.5C3 32.5 4.5 34 6.5 34H14Z" />
        <polygon points="21,18 32,24.5 21,31" fill="currentColor" stroke="none" />
      </svg>
      <span class="code-stamp tabular">88103 · 24.2 MB</span>
    </div>
    <div class="tile-bottom">
      <span class="tile-title">cloudstream 3</span>
      <span class="tile-edition">KV-PreSetup · All VN &amp; Global 4K Repos</span>
      <div class="live-status-strip">
        <span class="live-status-text">MegaRepo + Vietsub + 1.1.1.1 DoH Ready</span>
        <span class="live-status-badge tabular">v4.4.1-kv</span>
      </div>
      <div class="tile-meta-row">
        <span>com.lagradost.cloudstream3</span>
        <span class="tabular">4,150 installs</span>
      </div>
    </div>
  </button>

  <!-- 2x1 WIDE LIVE TILE (Jellyfin TV · Violet #6B21A8) -->
  <button
    type="button"
    class="metro-tile tile-violet span-2x1"
    tabindex="-1"
    data-tile-kind="app"
    data-app-id="jellyfin-kv"
    data-short-code="88101"
  >
    <div class="tile-top">
      <svg class="tile-glyph" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
        <polygon points="24,5 43,39 5,39" />
        <polygon points="24,17 33,34 15,34" fill="currentColor" stroke="none" />
      </svg>
      <span class="code-stamp tabular">88101 · 42.8 MB</span>
    </div>
    <div class="tile-bottom">
      <span class="tile-title">jellyfin tv</span>
      <span class="tile-edition">KV-Optimized · 4K HDR Direct Play</span>
      <div class="tile-meta-row">
        <span>v0.18.4-kv2 · ExoPlayer HDR10</span>
        <span class="tabular">1,420 installs</span>
      </div>
    </div>
  </button>

  <!-- 1x1 SQUARE LIVE TILE (Kodi 21 · Teal #008272) -->
  <button
    type="button"
    class="metro-tile tile-teal span-1x1"
    tabindex="-1"
    data-tile-kind="app"
    data-app-id="kodi-kv"
    data-short-code="88102"
  >
    <div class="tile-top">
      <svg class="tile-glyph" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
        <polygon points="24,4 44,24 24,44 4,24" />
      </svg>
      <span class="code-stamp tabular">88102</span>
    </div>
    <div class="tile-bottom">
      <span class="tile-title">kodi 21</span>
      <span class="tile-edition">KV-Build Omega</span>
      <div class="tile-meta-row">
        <span>86.4 MB</span>
        <span class="tabular">2,890</span>
      </div>
    </div>
  </button>
</section>
```

---

### Recipe 4: Admin / Data KPI Color Blocks & Hairline Tables

For dashboards and admin modules (`/admin`), pair 4 solid Metro KPI color blocks across the top with a `#121212` hairline data table below:

```html
<!-- 4-Column Metro KPI Strip -->
<section class="kv-kpi-grid" aria-label="Key Performance Telemetry">
  <article class="kv-kpi-tile tile-cobalt">
    <span class="code-stamp tabular">APPS · ACTIVE</span>
    <strong class="kv-kpi-value tabular">5</strong>
    <span class="kv-kpi-label">Pre-Configured TV Builds</span>
  </article>
  <article class="kv-kpi-tile tile-emerald">
    <span class="code-stamp tabular">INSTALLS · TOTAL</span>
    <strong class="kv-kpi-value tabular">18,060</strong>
    <span class="kv-kpi-label">Verified APK &amp; Zip Fetches</span>
  </article>
  <article class="kv-kpi-tile tile-amber">
    <span class="code-stamp tabular">PROMOS · LIVE</span>
    <strong class="kv-kpi-value tabular">3</strong>
    <span class="kv-kpi-label">Active Storefront Campaigns</span>
  </article>
  <article class="kv-kpi-tile tile-violet">
    <span class="code-stamp tabular">CDN · SHORT-CODES</span>
    <strong class="kv-kpi-value tabular">88101–88105</strong>
    <span class="kv-kpi-label">AFTVnews &amp; Direct Edge Routes</span>
  </article>
</section>

<!-- Crisp 1px Hairline Data Table -->
<div class="kv-table-wrap">
  <table class="kv-table">
    <thead>
      <tr>
        <th>SHORT-CODE</th>
        <th>APPLICATION</th>
        <th>VERSION</th>
        <th>INSTALLS</th>
        <th>ACTIONS</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="tabular"><code>88103</code></td>
        <td><strong>cloudstream 3</strong> · KV-PreSetup</td>
        <td class="tabular">v4.4.1-kv (24.2 MB)</td>
        <td class="tabular">4,150</td>
        <td>
          <button type="button" class="metro-inline-btn">EDIT</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Recipe 5: Native `<dialog closedby="any">` Metro Command Modal

Always use native `<dialog closedby="any">` so Escape, Android TV Back, and backdrop clicks close the modal cleanly without scroll bleed (`overscroll-behavior: contain`):

```html
<dialog id="metro-app-dialog" closedby="any" aria-labelledby="metro-dialog-title">
  <div class="dialog-banner tile-cobalt" id="app-dialog-banner">
    <div>
      <h2 class="dialog-title" id="metro-dialog-title">cloudstream 3</h2>
      <p class="dialog-subtitle" id="metro-dialog-edition">KV-PreSetup · All VN &amp; Global 4K Repos</p>
    </div>
    <form method="dialog">
      <button type="submit" class="dialog-close-btn">[ ESC · CLOSE ]</button>
    </form>
  </div>
  <div class="dialog-body">
    <div class="dialog-grid">
      <div>
        <div class="dialog-specs">
          <div class="spec-item">
            <span class="spec-label">SHORT-CODE</span>
            <span class="spec-value tabular" id="metro-dialog-code">88103</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">VERSION &amp; SIZE</span>
            <span class="spec-value tabular" id="metro-dialog-version">v4.4.1-kv · 24.2 MB</span>
          </div>
        </div>
      </div>
      <div class="dialog-qr-panel">
        <img class="dialog-qr-img" src="/api/qr?text=https%3A%2F%2Ftv.vndns.net%2Fgo%2F88103&size=200" alt="QR Code" width="148" height="148">
        <span class="dialog-qr-caption tabular">SCAN FOR APK · 88103</span>
      </div>
    </div>
    <div class="dialog-actions">
      <a class="metro-action-btn" href="/api/download/cloudstream-kv?type=apk">DOWNLOAD PRE-SET APK</a>
      <a class="metro-action-btn secondary" href="/api/download/cloudstream-kv?type=preset">DOWNLOAD .ZIP BUNDLE</a>
    </div>
  </div>
</dialog>
```

---

### Recipe 6: 2D Spatial D-Pad Roving Tabindex JS Snippet

Drop this self-contained script into any `kv-tv-theme` page so 5-way Android TV remote arrow keys (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`) navigate seamlessly across asymmetric `2×2`, `2×1`, and `1×1` tiles using real `getBoundingClientRect()` geometry:

```javascript
(function initMetroSpatialDpad(gridSelector = '#metro-grid', tileSelector = '.metro-tile') {
  const gridEl = document.querySelector(gridSelector);
  if (!gridEl) return;

  const getTiles = () =>
    Array.from(gridEl.querySelectorAll(tileSelector)).filter((el) =>
      typeof el.checkVisibility === 'function' ? el.checkVisibility() : true
    );

  function setRovingFocus(targetTile, shouldFocus = true) {
    const tiles = getTiles();
    tiles.forEach((tile) => {
      tile.setAttribute('tabindex', tile === targetTile ? '0' : '-1');
    });
    if (shouldFocus && targetTile) {
      targetTile.focus();
      targetTile.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function findSpatialCandidate(currentEl, direction) {
    const candidates = getTiles().filter((el) => el !== currentEl);
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
          rect.bottom > currentRect.top + tolerance && rect.top < currentRect.bottom - tolerance;
        perpCenterOffset = Math.abs(rect.top + rect.height / 2 - currentCenterY);
      } else if (direction === 'ArrowLeft') {
        isValid = rect.right <= currentRect.left + tolerance;
        gap = Math.max(0, currentRect.left - rect.right);
        overlapsPerpendicular =
          rect.bottom > currentRect.top + tolerance && rect.top < currentRect.bottom - tolerance;
        perpCenterOffset = Math.abs(rect.top + rect.height / 2 - currentCenterY);
      } else if (direction === 'ArrowDown') {
        isValid = rect.top >= currentRect.bottom - tolerance;
        gap = Math.max(0, rect.top - currentRect.bottom);
        overlapsPerpendicular =
          rect.right > currentRect.left + tolerance && rect.left < currentRect.right - tolerance;
        perpCenterOffset = Math.abs(rect.left + rect.width / 2 - currentCenterX);
      } else if (direction === 'ArrowUp') {
        isValid = rect.bottom <= currentRect.top + tolerance;
        gap = Math.max(0, currentRect.top - rect.bottom);
        overlapsPerpendicular =
          rect.right > currentRect.left + tolerance && rect.left < currentRect.right - tolerance;
        perpCenterOffset = Math.abs(rect.left + rect.width / 2 - currentCenterX);
      }

      if (isValid) {
        inDirection.push({ candidate, gap, overlapsPerpendicular, perpCenterOffset });
      }
    }

    if (inDirection.length === 0) return null;

    const overlapping = inDirection.filter((item) => item.overlapsPerpendicular);
    if (overlapping.length > 0) {
      overlapping.sort((a, b) =>
        Math.abs(a.gap - b.gap) > 1 ? a.gap - b.gap : a.perpCenterOffset - b.perpCenterOffset
      );
      return overlapping[0].candidate;
    }

    const weight = 2.5;
    inDirection.sort(
      (a, b) => a.gap + weight * a.perpCenterOffset - (b.gap + weight * b.perpCenterOffset)
    );
    return inDirection[0].candidate;
  }

  gridEl.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    const innermost = e.composedPath()[0];
    if (
      innermost instanceof Element &&
      innermost.matches(':read-write, select, input[type="range"], [role="slider"]')
    ) {
      return;
    }

    const activeEl = document.activeElement;
    const tiles = getTiles();
    if (!tiles.includes(activeEl)) return;

    const nextTile = findSpatialCandidate(activeEl, e.key);
    if (!nextTile) return;

    e.preventDefault();
    setRovingFocus(nextTile, true);
  });
})();
```

---

## 5. Reusable AI Prompt Template (Copy & Paste into Any Future Chat)

Whenever you start a new chat or spin up a new page/app (`kv-netflix`, `kv-tube`, a new settings screen, or an analytics page), paste the block below:

```markdown
Build/update this page using the committed **`kv-tv-theme`** ("Metro Typographic Panorama") design system.
Read `/mnt/data/Projects/kv-tv/DESIGN.md`, `/mnt/data/Projects/kv-tv/.impeccable/design.json`, and `/mnt/data/Projects/kv-tv/docs/KV_TV_THEME_PLAYBOOK.md` first, and link `/kv-tv-theme.css`.

Enforce all 7 Golden Laws of `kv-tv-theme`:
1. Root background is pure OLED pitch-black (`#000000`) with `12px` grid gutters.
2. `border-radius: 0px` on every single element (tiles, buttons, inputs, badges, modals, tables).
3. Giant lowercase `Work Sans` weight `200` (`clamp(2.8rem, 5vw, 4.6rem)`, `letter-spacing: -0.04em`) panorama pivot headers at the top of the stage.
4. Flat, unmodulated high-chroma Metro color-block tiles (`#0078D7` Cobalt, `#6B21A8` Violet, `#008272` Teal, `#D83B01` Crimson, `#B91C1C` Vermilion, `#107C10` Emerald, `#B45309` Amber) with pure `#FFFFFF` text and geometric vector glyphs.
5. Razor-sharp 10-foot D-Pad focus state (`outline: 4px solid #FFFFFF; outline-offset: 2px; transform: scale(1.022)`) + 2D spatial arrow-key roving `tabindex`.
6. `JetBrains Mono` with `font-variant-numeric: tabular-nums` on all short-codes, counters, sizes, and versions (`12px` / `0.75rem` minimum font size).
7. Zero `backdrop-filter: blur()`, zero `box-shadow`, zero gradients, and native `<dialog closedby="any">` for modals.
```
