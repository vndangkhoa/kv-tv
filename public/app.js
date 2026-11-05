/**
 * KV-TV Store (https://tv.vndns.net) — kv-tv-theme Client Engine
 * - Metro Typographic Panorama Storefront (6x2 Asymmetric Live Tile Matrix)
 * - 4 Panorama Pivots: store · pre-sets · short-codes · phone-qr (?mode=promo)
 * - 3 Native <dialog closedby="any"> Modals + Light-Dismiss Fallback
 * - 10-Foot Roving Tabindex 2D Spatial Navigation + D-Pad Remote Simulator
 */

const METRO_TILE_CLASSES = {
  'cloudstream-kv': 'kv-tile--cobalt',
  'jellyfin-kv': 'kv-tile--violet',
  'kodi-kv': 'kv-tile--teal',
  'kv-netflix': 'kv-tile--crimson',
  'kv-tube': 'kv-tile--vermilion',
};

const METRO_TILE_COLORS = {
  'cloudstream-kv': 'var(--kv-cobalt)',
  'jellyfin-kv': 'var(--kv-violet)',
  'kodi-kv': 'var(--kv-teal)',
  'kv-netflix': 'var(--kv-crimson)',
  'kv-tube': 'var(--kv-vermilion)',
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
      id: 'cloudstream-kv',
      name: 'CloudStream 3',
      edition: 'KV-PreSetup (Full Repos)',
      packageName: 'com.lagradost.cloudstream3',
      version: '4.4.1-kv',
      size: '24.2 MB',
      shortCode: '88103',
      category: 'Streaming',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 4150,
      description:
        'Zero manual repository typing required. Ships with MegaRepo and Vietnamese HD movie/anime extensions pre-activated, Cloudflare DoH enabled, and automatic 4K Vietsub stream selection.',
      presetFeatures: [
        'Pre-configured MegaRepo + Vietnamese HD Movie/Anime extensions',
        'Auto-selects 1080p/4K highest-bitrate stream with Vietsub',
        'DNS-over-HTTPS (Cloudflare 1.1.1.1) pre-enabled to bypass ISP blocks',
        'One-click Pre-Set Backup (.backup) restore included',
      ],
    },
    {
      id: 'jellyfin-kv',
      name: 'Jellyfin TV',
      edition: 'KV-Optimized Edition',
      packageName: 'org.jellyfin.androidtv.kv',
      version: '0.18.4-kv2',
      size: '42.8 MB',
      shortCode: '88101',
      category: 'Media Center',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 1420,
      description:
        'Custom Android TV build of Jellyfin with pre-configured KV Media Server discovery, Direct Play 4K HEVC 10-bit profiles, and styled Vietnamese/English subtitles.',
      presetFeatures: [
        'Auto-discovery & pre-filled server URL',
        'Hardware-accelerated ExoPlayer + libVLC fallback',
        'Zero-transcode 4K HEVC 10-bit Direct Play',
        'Vietnamese & English default subtitle styling',
      ],
    },
    {
      id: 'kodi-kv',
      name: 'Kodi 21 Omega',
      edition: 'KV-Build All-in-One',
      packageName: 'org.xbmc.kodi',
      version: '21.2-kv-build',
      size: '94.5 MB',
      shortCode: '88102',
      category: 'Media Center',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 2890,
      description:
        'Ready-to-run Kodi 21.2 Omega build featuring the lightweight Arctic Zephyr 2 10-foot TV skin, tuned memory cache for 1GB/2GB TV boxes, and pre-installed Vietnamese subtitle addons.',
      presetFeatures: [
        'Arctic Zephyr 2 10-foot TV remote skin pre-activated',
        'advancedsettings.xml tuned for 1GB/2GB RAM TV Boxes',
        'Pre-installed Vietnamese subtitle providers (Subscene/OpenSubtitles)',
        'TorrServer & Elementum streaming buffer optimization',
      ],
    },
    {
      id: 'kv-netflix',
      name: 'KV-Netflix',
      edition: 'TV Remote & 4K HDR Mod',
      packageName: 'vn.kvtv.netflix',
      version: '8.114.0-kv',
      size: '38.6 MB',
      shortCode: '88104',
      category: 'Originals & Cinema',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 3680,
      description:
        'Engineered for Android TV boxes that fail Netflix certification checks. Provides native D-Pad remote focus navigation without an air-mouse, adaptive Widevine L1/L3 fallback, and 5.1 audio.',
      presetFeatures: [
        'Native D-Pad directional navigation (no air-mouse needed)',
        'Widevine L1/L3 adaptive fallback for uncertified TV boxes',
        'Pre-tuned Dolby Digital Plus 5.1 & HDR10 playback flags',
        'Ultra-fast cold start on Amlogic & Rockchip chips',
      ],
    },
    {
      id: 'kv-tube',
      name: 'KV-Tube',
      edition: 'Ad-Free 4K60 + SponsorBlock',
      packageName: 'vn.kvtv.tube',
      version: '24.85-kv',
      size: '19.4 MB',
      shortCode: '88105',
      category: 'Video & Music',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      downloads: 5920,
      description:
        'Next-gen SmartTube/KV-Tube client for Android TV. Blocks 100% of video and banner ads, automatically skips sponsor reads via SponsorBlock, and unlocks 4K 60fps HDR on any TV box.',
      presetFeatures: [
        '100% Ad-free playback (no pre-roll, mid-roll, or banner ads)',
        'SponsorBlock pre-configured (skips intros, self-promo & sponsor segments)',
        'AV1 & VP9 hardware codec selector for smooth 4K 60fps',
        'Works without Google Play Services on any Android TV box',
      ],
    },
  ],
  ads: [
    {
      id: 'ad-vip-box',
      title: 'KV-TV VIP Box Setup — Turn any Android TV into a 4K Cinema Hub',
      subtitle:
        'Pre-tuned Jellyfin, Kodi 21 Omega, CloudStream Vietsub & Ad-Free 4K60 KV-Tube ready in 60 seconds.',
      badge: 'FEATURED',
      ctaText: 'Explore Pre-Set Apps',
      ctaUrl: '#metro-grid',
      active: true,
      impressions: 4820,
      clicks: 612,
    },
    {
      id: 'ad-vps-cdn',
      title: 'ThueVPSGiaRe High-Speed VN Edge CDN — 1Gbps Direct APK Downloads',
      subtitle:
        'Hosted on low-latency Vietnam NVMe VPS with instant AFTVnews Downloader short-codes (88101–88105).',
      badge: 'SPONSOR',
      ctaText: 'Dial Short-Code',
      ctaUrl: '/go/88103',
      active: true,
      impressions: 3190,
      clicks: 284,
    },
    {
      id: 'ad-cloudstream-44',
      title: 'CloudStream KV-PreSetup v4.4 Released — All VN Movie Extensions Ready',
      subtitle:
        'Includes pre-loaded MegaRepo, 4K Vietsub auto-selector, and Cloudflare 1.1.1.1 DoH bypass.',
      badge: 'NEW RELEASE',
      ctaText: 'Code: 88103',
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
    '<strong>AFTVnews 5-Digit Short-Code Directory (88101–88105)</strong> — Dial any 5-digit short-code or copy with one click to fetch pre-configured APKs directly on your Android TV box.',
  'phone-qr':
    '<strong>Phone &amp; Desktop Promotional &amp; Sideload Hub</strong> — Scan the live QR code with your phone camera, explore sponsor campaigns, or sideload packages across your home network.',
};

const state = {
  pivot: 'store',
  currentCode: '88103',
  activeAppId: 'cloudstream-kv',
  promoSearchQuery: '',
  catalog: structuredClone(FALLBACK_CATALOG),
};

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
  if (deckTextEl && PIVOT_DESCRIPTIONS[normalized]) {
    deckTextEl.innerHTML = PIVOT_DESCRIPTIONS[normalized];
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

  grid.innerHTML = state.catalog.apps
    .map((app) => {
      const colorClass = METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt';
      const versionClean = String(app.version || '').replace(/^v/i, '');
      const featuresHtml = (app.presetFeatures || [])
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
              <p>${escapeHtml(app.edition)}</p>
            </div>
            <span class="kv-code-stamp tabular">CODE ${escapeHtml(app.shortCode)}</span>
          </div>
          <div class="kv-preset-body">
            <p class="kv-preset-summary">${escapeHtml(app.description)}</p>
            <div class="kv-dialog-specs dialog-specs">
              <div class="spec-item">
                <span class="spec-label">PRE-SET ARCHIVE</span>
                <span class="spec-value tabular">${escapeHtml(app.id)}-preset.zip</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">BUILD VERSION</span>
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
              <span>DOWNLOAD PRE-SET PACK (.ZIP)</span>
            </a>
            <a
              class="kv-btn"
              href="/api/download/${encodeURIComponent(app.id)}?type=apk"
              data-app-download="${escapeHtml(app.id)}"
            >
              <span>APK (${escapeHtml(app.size)})</span>
            </a>
            <button type="button" class="kv-btn" data-open-app="${escapeHtml(app.id)}">
              <span>INSPECT &amp; QR</span>
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

  listEl.innerHTML = state.catalog.apps
    .map((app) => {
      const colorClass = METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt';
      const versionClean = String(app.version || '').replace(/^v/i, '');
      return `
        <article class="kv-shortcode-row">
          <div class="kv-shortcode-id">
            <span class="kv-shortcode-num ${colorClass} tabular">${escapeHtml(app.shortCode)}</span>
            <div>
              <h3 class="kv-shortcode-info-title">${escapeHtml(app.name.toLowerCase())}</h3>
              <p class="kv-shortcode-info-sub tabular">
                ${escapeHtml(app.edition)} · v${escapeHtml(versionClean)} · ${escapeHtml(app.size)}
              </p>
            </div>
          </div>
          <div class="kv-shortcode-btns">
            <button type="button" class="kv-btn kv-btn--emerald" data-copy-code="${escapeHtml(app.shortCode)}">
              <span>COPY ${escapeHtml(app.shortCode)}</span>
            </button>
            <a
              class="kv-btn kv-btn--primary"
              href="/api/download/${encodeURIComponent(app.id)}?type=apk"
              data-app-download="${escapeHtml(app.id)}"
            >
              <span>DIRECT APK</span>
            </a>
            <button type="button" class="kv-btn" data-open-app="${escapeHtml(app.id)}">
              <span>QR &amp; SPECS</span>
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
  const adsGrid = document.getElementById('promo-ads-grid');
  if (adsGrid) {
    const adPalette = ['kv-tile--cobalt', 'kv-tile--violet', 'kv-tile--teal'];
    const activeAds = (state.catalog.ads || []).filter((ad) => ad.active !== false);
    adsGrid.innerHTML = activeAds
      .map((ad, idx) => {
        const bgClass = adPalette[idx % adPalette.length];
        return `
          <article class="kv-ad-tile ${bgClass}">
            <div>
              <h4 class="kv-ad-title">${escapeHtml(ad.title.toLowerCase())}</h4>
              <p class="kv-ad-subtitle">${escapeHtml(ad.subtitle)}</p>
            </div>
            <div class="kv-ad-footer tabular">
              <span class="kv-code-stamp">${escapeHtml(ad.badge || 'SPONSOR')} · ${Number(ad.impressions || 0).toLocaleString('en-US')} VIEWS</span>
              <button
                type="button"
                class="kv-btn kv-btn--primary kv-btn--sm"
                data-ad-id="${escapeHtml(ad.id)}"
                data-ad-url="${escapeHtml(ad.ctaUrl || '#metro-grid')}"
              >
                <span>${escapeHtml(ad.ctaText || 'OPEN')}</span>
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
        app.edition,
        app.shortCode,
        app.packageName,
        app.description,
        ...(app.presetFeatures || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    tableBody.innerHTML = filtered
      .map((app) => {
        const versionClean = String(app.version || '').replace(/^v/i, '');
        const colorClass = METRO_TILE_CLASSES[app.id] || 'kv-tile--cobalt';
        return `
          <tr class="tabular">
            <td>
              <strong>${escapeHtml(app.name)}</strong>
              <div>${escapeHtml(app.edition)}</div>
            </td>
            <td>
              <span class="kv-code-stamp ${colorClass}">CODE ${escapeHtml(app.shortCode)}</span>
            </td>
            <td><code>${escapeHtml(app.packageName)}</code></td>
            <td>v${escapeHtml(versionClean)} · ${escapeHtml(app.size)}</td>
            <td>${Number(app.downloads || 0).toLocaleString('en-US')}</td>
            <td>
              <div class="kv-table-actions">
                <a
                  class="kv-btn kv-btn--primary kv-btn--sm"
                  href="/api/download/${encodeURIComponent(app.id)}?type=apk"
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
                >COPY ${escapeHtml(app.shortCode)}</button>
                <button
                  type="button"
                  class="kv-btn kv-btn--sm"
                  data-open-app="${escapeHtml(app.id)}"
                >DETAILS</button>
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
  let totalInstalls = 0;
  for (const app of state.catalog.apps) {
    totalInstalls += Number(app.downloads || 0);
    const dlEl = document.querySelector(`[data-app-downloads="${CSS.escape(app.id)}"]`);
    if (dlEl) {
      const formatted = Number(app.downloads || 0).toLocaleString('en-US');
      dlEl.textContent = dlEl.textContent.includes('installs')
        ? `${formatted} installs`
        : formatted;
    }
    const stampEl = document.querySelector(`[data-app-stamp="${CSS.escape(app.id)}"]`);
    if (stampEl && app.shortCode && app.size) {
      stampEl.textContent = `${app.shortCode} · ${app.size}`;
    }
    const verEl = document.querySelector(`[data-app-version="${CSS.escape(app.id)}"]`);
    if (verEl && app.version) {
      verEl.textContent = `v${String(app.version).replace(/^v/i, '')}`;
    }
  }

  const totalEl = document.getElementById('telemetry-downloads');
  if (totalEl && totalInstalls > 0) {
    totalEl.textContent = `${totalInstalls.toLocaleString('en-US')} TOTAL INSTALLS`;
  }

  const activeAds = (state.catalog.ads || []).filter((ad) => ad.active !== false);
  if (activeAds.length > 0) {
    const leadAd = activeAds[0];
    const titleEl = document.getElementById('sponsor-strip-title');
    const bodyEl = document.getElementById('sponsor-strip-body');
    const statsEl = document.getElementById('sponsor-strip-stats');
    if (titleEl) titleEl.textContent = leadAd.title.toLowerCase();
    if (bodyEl) bodyEl.textContent = leadAd.subtitle;
    if (statsEl) {
      statsEl.textContent = `${leadAd.badge || 'SPONSOR'} · ${Number(leadAd.impressions || 0).toLocaleString('en-US')} VIEWS`;
    }
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

  hydrateLiveTilesAndStrip();
  renderPresetsMatrix();
  renderShortCodesDirectory();
  renderPromoPortal();
  updateDialerReadouts();
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

  const versionClean = String(app.version || '').replace(/^v/i, '');
  const titleEl = document.getElementById('metro-dialog-title');
  const editionEl = document.getElementById('metro-dialog-edition');
  const descEl = document.getElementById('metro-dialog-desc');
  const codeEl = document.getElementById('metro-dialog-code');
  const verEl = document.getElementById('metro-dialog-version');
  const pkgEl = document.getElementById('metro-dialog-pkg');
  const archEl = document.getElementById('metro-dialog-arch');

  if (titleEl) titleEl.textContent = app.name.toLowerCase();
  if (editionEl) editionEl.textContent = app.edition;
  if (descEl) descEl.textContent = app.description;
  if (codeEl) codeEl.textContent = app.shortCode;
  if (verEl) verEl.textContent = `v${versionClean} · ${app.size}`;
  if (pkgEl) pkgEl.textContent = app.packageName;
  if (archEl) archEl.textContent = app.arch || 'Universal (arm64-v8a + armeabi-v7a)';

  const featureList = document.getElementById('metro-dialog-features');
  if (featureList) {
    featureList.innerHTML = '';
    for (const feat of app.presetFeatures || []) {
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
    qrCap.textContent = `SCAN FOR APK · ${app.shortCode}`;
  }

  const apkBtn = document.getElementById('metro-dialog-apk-btn');
  const presetBtn = document.getElementById('metro-dialog-preset-btn');
  const copyBtn = document.getElementById('metro-dialog-copy-btn');
  if (apkBtn) {
    apkBtn.href = `/api/download/${encodeURIComponent(app.id)}?type=apk`;
    apkBtn.setAttribute('data-app-download', app.id);
  }
  if (presetBtn) {
    presetBtn.href = `/api/download/${encodeURIComponent(app.id)}?type=preset`;
    presetBtn.setAttribute('data-app-download', app.id);
  }
  if (copyBtn) {
    copyBtn.setAttribute('data-copy-code', app.shortCode);
  }

  if (!appDialog.open) {
    appDialog.showModal();
  }
}

/**
 * Update both modal and inline Short-Code Dialer readouts
 */
function updateDialerReadouts() {
  const padded = state.currentCode.padEnd(5, '_');
  const match = findApp(state.currentCode);
  let statusText = 'Type 5-digit code...';
  if (match) {
    statusText = `${match.name} · ${match.size}`;
  } else if (state.currentCode.length === 5) {
    statusText = 'Valid codes: 88101–88105';
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
    tile.setAttribute('tabindex', tile === targetTile ? '0' : '-1');
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

  const csMessages = [
    'MegaRepo + Vietsub + 1.1.1.1 DoH Ready',
    'Auto-Selects 4K HDR10 Stream + Vietnamese Subs',
    'Zero Manual Repo Typing · Pre-Activated Extensions',
    'AFTVnews Downloader Short-Code: 88103',
  ];
  let csIndex = 0;
  const csStatusEl = document.getElementById('cs-live-status');
  setInterval(() => {
    if (!csStatusEl) return;
    csIndex = (csIndex + 1) % csMessages.length;
    csStatusEl.textContent = csMessages[csIndex];
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
    tile.addEventListener('click', () => {
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
    showToast(`Fetching APK for Short-Code ${match.shortCode} (${match.name})...`);
    window.location.href = `/api/download/${encodeURIComponent(match.id)}?type=apk`;
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
        showToast(`Copied Short-Code ${code} to clipboard`);
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
        showToast(`Starting download for ${app.name} (${app.shortCode})...`);
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
    if (!allTiles.includes(activeEl)) return;

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
      const activeTile =
        allTiles.find((t) => t.getAttribute('tabindex') === '0') || allTiles[0];

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
        setRovingFocus(allTiles[0], true);
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
}

function initApp() {
  initDialogLightDismiss();
  startLiveTickers();
  bindInteractions();

  const initialPivot = resolveInitialPivot();
  activatePivot(initialPivot, { updateUrl: false, focusTarget: false });
  loadCatalog();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
