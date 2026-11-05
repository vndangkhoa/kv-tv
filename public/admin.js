/* ==========================================================================
   KV-TV Store Administrator Console — Client Controller (public/admin.js)
   Domain: https://tv.vndns.net/admin · Design System: kv-tv-theme
   ========================================================================== */

(function () {
  'use strict';

  const TOKEN_KEY = 'kvtv_admin_token';

  const state = {
    token: sessionStorage.getItem(TOKEN_KEY) || '',
    tempToken: '',
    activeTab: 'overview',
    logFilter: 'all',
    catalogQuery: '',
    overview: null,
    pendingDelete: null, // { type: 'app' | 'ad', id: string, label: string }
  };

  // ---------------------------------------------------------------------------
  // 1. Modern Web Guidance: <dialog closedby="any"> Fallback
  // ---------------------------------------------------------------------------
  function initDialogFallbacks() {
    const dialogs = document.querySelectorAll('dialog');
    dialogs.forEach((dialog) => {
      // Fallback for browsers without closedby support
      if (!('closedBy' in HTMLDialogElement.prototype)) {
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
      }
    });

    document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-close-dialog');
        const dlg = document.getElementById(id);
        if (dlg && typeof dlg.close === 'function') {
          dlg.close();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Utility Helpers (Escaping, Formatting, Sharp SVG App Icons, Toast)
  // ---------------------------------------------------------------------------
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatNumber(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  function formatTimestamp(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const pad = (v) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function svgToDataUri(svgString) {
    if (!svgString) return '';
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  }

  function getAppIconSvg(iconType) {
    switch (String(iconType || '').toLowerCase()) {
      case 'jellyfin':
        return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polygon points="12 3 4 19 20 19 12 3"></polygon><circle cx="12" cy="14" r="2.5"></circle></svg>`;
      case 'kodi':
        return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polygon points="12 2 22 12 12 22 2 12 12 2"></polygon><line x1="7" y1="7" x2="17" y2="17"></line><line x1="17" y1="7" x2="7" y2="17"></line></svg>`;
      case 'cloudstream':
        return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>`;
      case 'netflix':
        return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter"><path d="M6 3v18"></path><path d="M6 3l12 18"></path><path d="M18 3v18"></path></svg>`;
      case 'tube':
        return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><rect x="2" y="4" width="20" height="16"></rect><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none"></polygon></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><rect x="2" y="4" width="20" height="14"></rect><path d="M8 21h8"></path><path d="M12 18v3"></path></svg>`;
    }
  }

  let toastTimeout = null;
  function showToast(message, isError = false) {
    const el = document.getElementById('consoleToast');
    if (!el) return;
    el.textContent = message;
    el.style.borderColor = '#FFFFFF';
    el.style.backgroundColor = isError ? '#B91C1C' : '#107C10';
    el.style.color = '#FFFFFF';
    el.hidden = false;

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.hidden = true;
    }, 4500);
  }

  function showAuthAlert(message) {
    const alertEl = document.getElementById('authAlert');
    if (!alertEl) return;
    if (!message) {
      alertEl.hidden = true;
      alertEl.textContent = '';
      return;
    }
    alertEl.textContent = message;
    alertEl.hidden = false;
  }

  function setAuthStepUI(step) {
    const headingEl = document.getElementById('authHeading');
    const pivotLogin = document.getElementById('authPivotLogin');
    const pivotTotp = document.getElementById('authPivotTotp');
    const isTotp = step === 'totp';

    if (headingEl) {
      headingEl.textContent = isTotp ? 'verify-2fa' : 'authenticate';
    }
    if (pivotLogin) {
      pivotLogin.classList.toggle('is-active', !isTotp);
      pivotLogin.setAttribute('aria-selected', isTotp ? 'false' : 'true');
    }
    if (pivotTotp) {
      pivotTotp.classList.toggle('is-active', isTotp);
      pivotTotp.setAttribute('aria-selected', isTotp ? 'true' : 'false');
    }
  }

  async function apiFetch(url, options = {}) {
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      options.headers || {}
    );
    if (state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }

    const res = await fetch(url, Object.assign({}, options, { headers }));
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && !url.includes('/login') && !url.includes('/verify-2fa')) {
      handleLogout('Session expired or unauthorized. Please sign in again.');
      throw new Error(data.error || 'Unauthorized');
    }

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  // ---------------------------------------------------------------------------
  // 3. Production Authentication Gate (Username/Password + RFC 6238 TOTP 2FA)
  // ---------------------------------------------------------------------------
  async function handleStep1Login(event) {
    event.preventDefault();
    showAuthAlert('');

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (!username || !password) {
      showAuthAlert('Please enter both administrator username and password.');
      return;
    }

    try {
      submitBtn.disabled = true;
      const data = await apiFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (data.requires2fa && data.tempToken) {
        state.tempToken = data.tempToken;
        document.getElementById('loginForm').hidden = true;
        const totpForm = document.getElementById('totpForm');
        totpForm.hidden = false;
        setAuthStepUI('totp');
        const codeInput = document.getElementById('totpCodeInput');
        codeInput.value = '';
        codeInput.focus();
        return;
      }

      if (data.token) {
        completeLoginSession(data.token);
      }
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  }

  async function handleStep2Totp(event) {
    event.preventDefault();
    showAuthAlert('');

    const totpCode = document.getElementById('totpCodeInput').value.trim();
    const submitBtn = document.getElementById('totpSubmitBtn');

    try {
      submitBtn.disabled = true;
      const data = await apiFetch('/api/admin/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({
          tempToken: state.tempToken,
          totpCode,
        }),
      });

      if (data.token) {
        completeLoginSession(data.token);
      }
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  }

  function completeLoginSession(token) {
    state.token = token;
    state.tempToken = '';
    sessionStorage.setItem(TOKEN_KEY, token);

    document.getElementById('authView').hidden = true;
    document.getElementById('dashboardView').hidden = false;
    document.getElementById('loginForm').hidden = false;
    document.getElementById('totpForm').hidden = true;
    setAuthStepUI('login');

    loadAdminOverview();
  }

  function handleLogout(alertMessage = '') {
    state.token = '';
    state.tempToken = '';
    sessionStorage.removeItem(TOKEN_KEY);

    document.getElementById('dashboardView').hidden = true;
    document.getElementById('authView').hidden = false;
    document.getElementById('loginForm').hidden = false;
    document.getElementById('totpForm').hidden = true;
    setAuthStepUI('login');

    showAuthAlert(alertMessage);
    loadDemoHint();
  }

  // ---------------------------------------------------------------------------
  // 4. Dashboard Navigation & Overview Fetching
  // ---------------------------------------------------------------------------
  function switchTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      const isMatch = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    ['overview', 'catalog', 'ads', 'security'].forEach((id) => {
      const sec = document.getElementById(`tab-${id}`);
      if (sec) sec.hidden = id !== tabName;
    });
  }

  async function loadAdminOverview(silent = false) {
    try {
      const data = await apiFetch('/api/admin/overview');
      state.overview = data;
      renderAllSections(data);
      const syncEl = document.getElementById('lastSyncedLabel');
      if (syncEl) {
        const now = new Date();
        syncEl.textContent = `Synced ${now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}`;
      }
      if (!silent) {
        // Initial load complete
      }
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function renderAllSections(data) {
    const apps = data.apps || [];
    const ads = data.ads || [];
    const analytics = data.analytics || { daily: [], logs: [], totals: {} };
    const storage = data.storage || {
      uploadsCount: 0,
      uploadsFormatted: '0 B',
    };
    const admin = data.admin || {};

    // Panorama pivot badges & storage
    document.getElementById('navAppCountBadge').textContent = String(apps.length);
    document.getElementById('navAdCountBadge').textContent = String(ads.length);
    document.getElementById('sidebarDiskUsage').textContent =
      storage.uploadsFormatted || '0 B';
    document.getElementById('sidebarDiskFiles').textContent = `${
      storage.uploadsCount || 0
    } uploaded binaries`;

    document.getElementById('topbarAuthStatus').textContent = `${
      admin.username || 'admin'
    } (${admin.totpEnabled ? '2FA Enforced' : 'Password Only'})`;

    renderOverviewTab(apps, analytics, storage);
    renderCatalogTab(apps);
    renderAdsTab(ads);
    renderSecurityTab(admin);
  }

  // ---------------------------------------------------------------------------
  // 5. Render Tab 1: Telemetry & Analytics
  // ---------------------------------------------------------------------------
  function renderOverviewTab(apps, analytics, storage) {
    const daily = analytics.daily || [];
    const totalDownloads =
      analytics.totals?.downloads ??
      apps.reduce((sum, a) => sum + Number(a.downloads || 0), 0);
    const downloads7d = daily.reduce((sum, d) => sum + Number(d.downloads || 0), 0);
    const tvViews7d = daily.reduce((sum, d) => sum + Number(d.tvViews || 0), 0);
    const webViews7d = daily.reduce((sum, d) => sum + Number(d.webViews || 0), 0);
    const presetCount = apps.filter((a) => a.preConfigured).length;

    document.getElementById('metricTotalDownloads').textContent =
      formatNumber(totalDownloads);
    document.getElementById('metric7dDownloads').textContent = `${formatNumber(
      downloads7d
    )} in last 7 days`;
    document.getElementById('metricTvViews').textContent = formatNumber(tvViews7d);
    document.getElementById('metricWebViews').textContent = formatNumber(webViews7d);
    document.getElementById('metricPresetApps').textContent = `${presetCount} / ${apps.length}`;
    document.getElementById('metricDiskBytes').textContent =
      storage.uploadsFormatted || '0 B';
    document.getElementById('metricDiskCount').textContent = `${
      storage.uploadsCount || 0
    } binary files on disk`;

    // Render 7-Day Bar Chart
    const chartEl = document.getElementById('dailyChartContainer');
    const maxVal = Math.max(
      10,
      ...daily.flatMap((d) => [
        Number(d.tvViews || 0),
        Number(d.webViews || 0),
        Number(d.downloads || 0),
      ])
    );

    chartEl.innerHTML = daily
      .map((d) => {
        const tvH = Math.max(4, Math.round((Number(d.tvViews || 0) / maxVal) * 100));
        const webH = Math.max(4, Math.round((Number(d.webViews || 0) / maxVal) * 100));
        const dlH = Math.max(4, Math.round((Number(d.downloads || 0) / maxVal) * 100));
        const shortDate = String(d.date || '').slice(5); // MM-DD
        return `
          <div class="chart-day-col">
            <div class="chart-bars-stage">
              <div class="chart-bar chart-bar-tv" style="height: ${tvH}%" title="TV Remote Views: ${d.tvViews}"></div>
              <div class="chart-bar chart-bar-web" style="height: ${webH}%" title="Mobile/Web Views: ${d.webViews}"></div>
              <div class="chart-bar chart-bar-dl" style="height: ${dlH}%" title="APK Downloads: ${d.downloads}"></div>
            </div>
            <div class="chart-day-date">${escapeHtml(shortDate)}</div>
            <div class="chart-day-metrics">
              <div><span>TV</span><strong>${formatNumber(d.tvViews)}</strong></div>
              <div><span>Web</span><strong>${formatNumber(d.webViews)}</strong></div>
              <div><span>APK</span><strong>${formatNumber(d.downloads)}</strong></div>
            </div>
          </div>
        `;
      })
      .join('');

    // Render Per-App Performance Table
    const perfBody = document.getElementById('perfTableBody');
    perfBody.innerHTML = apps
      .map((app) => {
        const hasRealApk = Boolean(app.apkFileName);
        const hasPresetZip = Boolean(app.presetFileName);
        return `
          <tr>
            <th scope="row">
              ${escapeHtml(app.name)}
              <span class="table-cell-sub">${escapeHtml(app.edition)}</span>
            </th>
            <td>
              <a href="/go/${encodeURIComponent(app.shortCode)}" target="_blank" rel="noopener" class="mono-num">
                ${escapeHtml(app.shortCode)}
              </a>
            </td>
            <td class="mono-num">
              v${escapeHtml(app.version)}
              <span class="table-cell-sub">${escapeHtml(app.size)}</span>
            </td>
            <td>
              ${
                hasRealApk
                  ? `<span class="badge badge-emerald">Uploaded (${escapeHtml(app.apkFileName)})</span>`
                  : `<span class="badge badge-sky">Pre-Seeded Demo APK</span>`
              }
            </td>
            <td>
              ${
                hasPresetZip
                  ? `<span class="badge badge-emerald">${escapeHtml(app.presetFileName)}</span>`
                  : app.preConfigured
                  ? `<span class="badge badge-subtle">Built-in Pre-Set</span>`
                  : `<span class="badge badge-subtle">Standard</span>`
              }
            </td>
            <td class="num-col">${formatNumber(app.downloads)}</td>
            <td class="actions-col">
              <div class="row-actions">
                <a href="/api/download/${encodeURIComponent(app.id)}" class="btn btn-secondary btn-xs">[ TEST APK ]</a>
                <button type="button" class="btn btn-secondary btn-xs" data-edit-app="${escapeHtml(app.id)}">[ EDIT ]</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    renderTelemetryLogs(analytics.logs || []);
  }

  function renderTelemetryLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    const filtered = logs.filter((entry) => {
      if (state.logFilter === 'all') return true;
      const ev = String(entry.event || '').toLowerCase();
      if (state.logFilter === 'download') return ev.includes('download');
      if (state.logFilter === 'view') return ev.includes('view');
      if (state.logFilter === 'admin') return ev.includes('admin');
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <th scope="row" colspan="5">No telemetry events match the selected filter.</th>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .slice(0, 35)
      .map((item) => {
        const dev = String(item.deviceType || 'tv').toLowerCase();
        const badgeClass =
          dev === 'tv'
            ? 'badge-sky'
            : dev === 'mobile'
            ? 'badge-emerald'
            : 'badge-subtle';
        return `
          <tr>
            <th scope="row">
              <code>${escapeHtml(item.event)}</code>
              <span>${escapeHtml(item.appName || 'Store')}</span>
            </th>
            <td class="mono-num">${escapeHtml(formatTimestamp(item.timestamp))}</td>
            <td><span class="badge ${badgeClass}">${escapeHtml(dev.toUpperCase())}</span></td>
            <td class="mono-num">${escapeHtml(item.ip || '127.0.0.1')}</td>
            <td><span class="table-cell-sub">${escapeHtml(item.userAgent || '—')}</span></td>
          </tr>
        `;
      })
      .join('');
  }

  // ---------------------------------------------------------------------------
  // 6. Render Tab 2: App Catalog & Direct APK / Pre-Set Upload Manager
  // ---------------------------------------------------------------------------
  function renderCatalogTab(apps) {
    const query = state.catalogQuery.trim().toLowerCase();
    const filtered = apps.filter((app) => {
      if (!query) return true;
      return (
        String(app.name || '').toLowerCase().includes(query) ||
        String(app.packageName || '').toLowerCase().includes(query) ||
        String(app.shortCode || '').toLowerCase().includes(query) ||
        String(app.category || '').toLowerCase().includes(query)
      );
    });

    document.getElementById(
      'catalogCountMeta'
    ).textContent = `Showing ${filtered.length} of ${apps.length} apps`;

    const container = document.getElementById('catalogManagerList');
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="panel-box">
          <p class="section-sub">No applications match "${escapeHtml(
            state.catalogQuery
          )}". Clear the search filter or add a new TV app.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((app) => {
        const features = Array.isArray(app.presetFeatures) ? app.presetFeatures : [];
        const shaShort = app.sha256 ? `${String(app.sha256).slice(0, 12)}…` : '—';
        const apkStatus = app.apkFileName
          ? `Host file: /uploads/${app.apkFileName} (${app.size})`
          : `Serving pre-seeded demo package (${app.size}) until .apk uploaded`;
        const presetStatus = app.presetFileName
          ? `Host file: /uploads/${app.presetFileName}`
          : `Serving auto-generated Pre-Set backup (.zip)`;

        return `
          <article class="app-admin-row" data-app-card="${escapeHtml(app.id)}">
            <div class="app-admin-Identity">
              <div class="app-icon-tile" style="background-color: ${escapeHtml(app.color || '#0078D7')}">
                ${getAppIconSvg(app.iconType)}
              </div>
              <div class="app-admin-body">
                <div class="app-title-line">
                  <h3>${escapeHtml(app.name)}</h3>
                  <span class="badge ${app.preConfigured ? 'badge-emerald' : 'badge-subtle'}">
                    ${app.preConfigured ? 'Pre-Set Ready' : 'Standard APK'}
                  </span>
                  <span class="badge badge-sky mono-num">Code: ${escapeHtml(app.shortCode)}</span>
                  <span class="app-edition-tag">${escapeHtml(app.edition)}</span>
                </div>

                <div class="app-meta-specs mono-num">
                  <span>Pkg: <code>${escapeHtml(app.packageName)}</code></span>
                  <span>Ver: <strong>${escapeHtml(app.version)}</strong></span>
                  <span>Size: <strong>${escapeHtml(app.size)}</strong></span>
                  <span>SHA-256: <code>${escapeHtml(shaShort)}</code></span>
                </div>

                <p class="app-preset-summary">${escapeHtml(app.presetSummary || app.description)}</p>

                <ul class="app-feature-pills">
                  ${features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div class="app-binary-panel">
              <!-- Slot 1: Primary .APK Binary Upload -->
              <div class="binary-slot-row">
                <div class="binary-slot-info">
                  <strong>Android TV Binary (.apk)</strong>
                  <span class="mono-num">${escapeHtml(apkStatus)}</span>
                </div>
                <label class="btn btn-primary btn-xs file-upload-btn-label">
                  <span>[ UPLOAD .APK ]</span>
                  <input
                    type="file"
                    accept=".apk,application/vnd.android.package-archive"
                    hidden
                    data-upload-input="${escapeHtml(app.id)}"
                    data-upload-type="apk"
                  >
                </label>
              </div>

              <!-- Slot 2: Companion Pre-Set Pack (.zip) Upload -->
              <div class="binary-slot-row">
                <div class="binary-slot-info">
                  <strong>Pre-Set Config Bundle (.zip)</strong>
                  <span class="mono-num">${escapeHtml(presetStatus)}</span>
                </div>
                <label class="btn btn-emerald btn-xs file-upload-btn-label">
                  <span>[ UPLOAD PRE-SET .ZIP ]</span>
                  <input
                    type="file"
                    accept=".zip,.backup,.json,application/zip"
                    hidden
                    data-upload-input="${escapeHtml(app.id)}"
                    data-upload-type="preset"
                  >
                </label>
              </div>

              <!-- Upload Progress Bar -->
              <div id="uploadProgressWrap-${escapeHtml(app.id)}" hidden>
                <div class="upload-progress-bar">
                  <div id="uploadProgressFill-${escapeHtml(app.id)}" class="upload-progress-fill"></div>
                </div>
                <div id="uploadProgressText-${escapeHtml(app.id)}" class="mono-num table-cell-sub">Uploading...</div>
              </div>

              <div class="app-card-actions">
                <div class="row-actions">
                  <a href="/api/download/${encodeURIComponent(app.id)}" class="btn btn-secondary btn-xs">[ DOWNLOAD APK ]</a>
                  <a href="/api/download/${encodeURIComponent(app.id)}?type=preset" class="btn btn-secondary btn-xs">[ PRE-SET ZIP ]</a>
                </div>
                <div class="row-actions">
                  <button type="button" class="btn btn-secondary btn-xs" data-edit-app="${escapeHtml(app.id)}">[ EDIT ]</button>
                  <button type="button" class="btn btn-danger-ghost btn-xs" data-delete-app="${escapeHtml(app.id)}" data-delete-name="${escapeHtml(app.name)}">[ DELETE ]</button>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  // Binary upload with live progress via XMLHttpRequest
  function uploadAppBinary(appId, uploadType, file) {
    if (!file) return;
    const wrapEl = document.getElementById(`uploadProgressWrap-${appId}`);
    const fillEl = document.getElementById(`uploadProgressFill-${appId}`);
    const textEl = document.getElementById(`uploadProgressText-${appId}`);

    if (wrapEl) wrapEl.hidden = false;
    if (fillEl) fillEl.style.width = '2%';
    if (textEl) textEl.textContent = `Uploading ${file.name} (0%)...`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/upload/${encodeURIComponent(appId)}`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${state.token}`);
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.setRequestHeader('X-Upload-Type', uploadType);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && fillEl && textEl) {
        const pct = Math.min(100, Math.round((ev.loaded / ev.total) * 100));
        fillEl.style.width = `${pct}%`;
        textEl.textContent = `Uploading ${file.name} (${pct}%)...`;
      }
    };

    xhr.onload = () => {
      let resp = {};
      try {
        resp = JSON.parse(xhr.responseText);
      } catch {
        // Ignore
      }
      if (xhr.status >= 200 && xhr.status < 300 && resp.ok) {
        showToast(
          `Uploaded ${resp.fileName} (${resp.size}) to /uploads — SHA-256: ${String(
            resp.sha256 || ''
          ).slice(0, 12)}…`
        );
        loadAdminOverview(true);
      } else {
        showToast(resp.error || `Upload failed (${xhr.status})`, true);
        if (wrapEl) wrapEl.hidden = true;
      }
    };

    xhr.onerror = () => {
      showToast('Network error while uploading binary.', true);
      if (wrapEl) wrapEl.hidden = true;
    };

    xhr.send(file);
  }

  // ---------------------------------------------------------------------------
  // 7. Create / Edit App Dialog & Delete Confirmation Dialog
  // ---------------------------------------------------------------------------
  function openAppModal(appId = null) {
    const dialog = document.getElementById('appDialog');
    const titleEl = document.getElementById('appDialogTitle');
    const apps = state.overview?.apps || [];
    const existing = appId ? apps.find((a) => a.id === appId) : null;

    document.getElementById('appFormMode').value = existing ? 'edit' : 'create';
    titleEl.textContent = existing
      ? `Edit ${existing.name} (${existing.shortCode})`
      : 'Add New Android TV Application';

    document.getElementById('appFormId').value = existing ? existing.id : '';
    document.getElementById('appFormId').readOnly = Boolean(existing);
    document.getElementById('appFormName').value = existing ? existing.name : '';
    document.getElementById('appFormEdition').value = existing
      ? existing.edition
      : 'KV-Optimized Edition';
    document.getElementById('appFormPackage').value = existing
      ? existing.packageName
      : '';
    document.getElementById('appFormShortCode').value = existing
      ? existing.shortCode
      : '';
    document.getElementById('appFormVersion').value = existing
      ? existing.version
      : '1.0.0-kv';
    document.getElementById('appFormSize').value = existing ? existing.size : '28.5 MB';
    document.getElementById('appFormCategory').value = existing
      ? existing.category
      : 'Media Center';
    document.getElementById('appFormIconType').value = existing
      ? existing.iconType || 'custom'
      : 'custom';
    document.getElementById('appFormColor').value = existing
      ? existing.color || '#0078D7'
      : '#0078D7';
    document.getElementById('appFormPreConfigured').checked = existing
      ? Boolean(existing.preConfigured)
      : true;
    document.getElementById('appFormFeatured').checked = existing
      ? Boolean(existing.featured)
      : true;
    document.getElementById('appFormPresetSummary').value = existing
      ? existing.presetSummary || ''
      : '';
    document.getElementById('appFormDescription').value = existing
      ? existing.description || ''
      : '';
    document.getElementById('appFormFeatures').value = existing
      ? (existing.presetFeatures || []).join('\n')
      : 'Pre-configured for Android TV D-Pad remote\nDirect Play 4K HEVC hardware acceleration';

    dialog.showModal();
  }

  async function handleSaveAppModal(event) {
    event.preventDefault();
    const name = document.getElementById('appFormName').value.trim();
    if (!name) {
      showToast('Application name is required.', true);
      return;
    }

    const payload = {
      id: document.getElementById('appFormId').value.trim(),
      name,
      edition: document.getElementById('appFormEdition').value.trim(),
      packageName: document.getElementById('appFormPackage').value.trim(),
      shortCode: document.getElementById('appFormShortCode').value.trim(),
      version: document.getElementById('appFormVersion').value.trim(),
      size: document.getElementById('appFormSize').value.trim(),
      category: document.getElementById('appFormCategory').value,
      iconType: document.getElementById('appFormIconType').value,
      color: document.getElementById('appFormColor').value.trim(),
      preConfigured: document.getElementById('appFormPreConfigured').checked,
      featured: document.getElementById('appFormFeatured').checked,
      presetSummary: document.getElementById('appFormPresetSummary').value.trim(),
      description: document.getElementById('appFormDescription').value.trim(),
      presetFeatures: document
        .getElementById('appFormFeatures')
        .value.split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const res = await apiFetch('/api/admin/apps', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      document.getElementById('appDialog').close();
      showToast(
        `Saved "${res.app.name}" (Downloader Code: ${res.app.shortCode}) to store.json.`
      );
      loadAdminOverview(true);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function openDeleteConfirm(type, id, label) {
    state.pendingDelete = { type, id, label };
    const msgEl = document.getElementById('deleteDialogMessage');
    msgEl.textContent =
      type === 'app'
        ? `Remove "${label}" (${id}) from the KV-TV catalog and delete its uploaded binaries in /uploads?`
        : `Delete promotional banner "${label}"?`;
    document.getElementById('deleteConfirmDialog').showModal();
  }

  async function executePendingDelete() {
    if (!state.pendingDelete) return;
    const { type, id, label } = state.pendingDelete;
    const btn = document.getElementById('confirmDeleteBtn');

    try {
      btn.disabled = true;
      const endpoint =
        type === 'app'
          ? `/api/admin/apps/${encodeURIComponent(id)}`
          : `/api/admin/ads/${encodeURIComponent(id)}`;
      await apiFetch(endpoint, { method: 'DELETE' });
      document.getElementById('deleteConfirmDialog').close();
      state.pendingDelete = null;
      showToast(`Deleted "${label}".`);
      loadAdminOverview(true);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btn.disabled = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Render Tab 3: Promo & Ad Banner Manager
  // ---------------------------------------------------------------------------
  function renderAdsTab(ads) {
    const tbody = document.getElementById('adsTableBody');
    if (ads.length === 0) {
      tbody.innerHTML = `
        <tr>
          <th scope="row" colspan="8">No promotional banners configured. Click "Create Promo Banner" to add one.</th>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = ads
      .map((ad) => {
        const imp = Number(ad.impressions || 0);
        const clk = Number(ad.clicks || 0);
        const ctr = imp > 0 ? `${((clk / imp) * 100).toFixed(1)}%` : '0.0%';

        return `
          <tr>
            <th scope="row">
              ${escapeHtml(ad.title)}
              <span class="table-cell-sub">${escapeHtml(ad.subtitle)}</span>
            </th>
            <td><span class="badge badge-sky">${escapeHtml(ad.badge || 'SPONSOR')}</span></td>
            <td class="mono-num">
              ${escapeHtml(ad.ctaText)}
              <span class="table-cell-sub">${escapeHtml(ad.ctaUrl)}</span>
            </td>
            <td class="num-col">${formatNumber(imp)}</td>
            <td class="num-col">${formatNumber(clk)}</td>
            <td class="num-col">${ctr}</td>
            <td>
              <span class="badge ${ad.active ? 'badge-emerald' : 'badge-amber'}">
                ${ad.active ? 'Active' : 'Paused'}
              </span>
            </td>
            <td class="actions-col">
              <div class="row-actions">
                <button type="button" class="btn btn-secondary btn-xs" data-toggle-ad="${escapeHtml(ad.id)}">
                  ${ad.active ? '[ PAUSE ]' : '[ ACTIVATE ]'}
                </button>
                <button type="button" class="btn btn-danger-ghost btn-xs" data-delete-ad="${escapeHtml(ad.id)}" data-delete-name="${escapeHtml(ad.title)}">
                  [ DELETE ]
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function openAdModal() {
    document.getElementById('adFormId').value = '';
    document.getElementById('adFormTitle').value = '';
    document.getElementById('adFormSubtitle').value = '';
    document.getElementById('adFormBadge').value = 'FEATURED';
    document.getElementById('adFormCtaText').value = 'Install Now';
    document.getElementById('adFormCtaUrl').value = '/tv';
    document.getElementById('adFormActive').checked = true;
    document.getElementById('adDialog').showModal();
  }

  async function handleSaveAdModal(event) {
    event.preventDefault();
    const title = document.getElementById('adFormTitle').value.trim();
    if (!title) {
      showToast('Campaign headline is required.', true);
      return;
    }

    const payload = {
      id: document.getElementById('adFormId').value.trim() || undefined,
      title,
      subtitle: document.getElementById('adFormSubtitle').value.trim(),
      badge: document.getElementById('adFormBadge').value.trim(),
      ctaText: document.getElementById('adFormCtaText').value.trim(),
      ctaUrl: document.getElementById('adFormCtaUrl').value.trim(),
      gradient: document.getElementById('adFormGradient').value,
      active: document.getElementById('adFormActive').checked,
    };

    try {
      await apiFetch('/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      document.getElementById('adDialog').close();
      showToast('Promotional banner saved.');
      loadAdminOverview(true);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function toggleAdActive(adId) {
    const ads = state.overview?.ads || [];
    const target = ads.find((a) => a.id === adId);
    if (!target) return;

    try {
      await apiFetch('/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(Object.assign({}, target, { active: !target.active })),
      });
      showToast(
        `Banner "${target.title}" is now ${!target.active ? 'Active' : 'Paused'}.`
      );
      loadAdminOverview(true);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Render Tab 4: 2FA & VPS Security Settings
  // ---------------------------------------------------------------------------
  function renderSecurityTab(admin) {
    const badge = document.getElementById('security2faStatusBadge');
    const toggleBtn = document.getElementById('toggle2faStatusBtn');
    const qrImg = document.getElementById('securityQrImg');
    const secretInput = document.getElementById('securitySecretReadonly');
    const uriInput = document.getElementById('securityOtpAuthReadonly');

    const isEnabled = Boolean(admin.totpEnabled);
    badge.textContent = isEnabled ? '2FA Enabled (RFC 6238)' : '2FA Disabled';
    badge.className = isEnabled ? 'badge badge-emerald' : 'badge badge-amber';
    toggleBtn.textContent = isEnabled
      ? '[ DISABLE 2FA REQUIREMENT ]'
      : '[ ENABLE 2FA REQUIREMENT ]';

    if (admin.qrSvg) {
      qrImg.src = svgToDataUri(admin.qrSvg);
    }
    secretInput.value = admin.totpSecret || '';
    uriInput.value = admin.otpAuthUrl || '';
  }

  async function handleToggle2FA(options = {}) {
    try {
      const res = await apiFetch('/api/admin/2fa/toggle', {
        method: 'POST',
        body: JSON.stringify(options),
      });
      if (state.overview) {
        state.overview.admin = res.admin;
      }
      renderSecurityTab(res.admin);
      showToast(
        options.rotateSecret
          ? 'Rotated TOTP 2FA secret key. Scan the new QR code in your Authenticator app.'
          : `Two-Factor Authentication is now ${
              res.admin.totpEnabled ? 'ENABLED' : 'DISABLED'
            }.`
      );
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ---------------------------------------------------------------------------
  // 10. Event Listeners & Initialization
  // ---------------------------------------------------------------------------
  function bindEvents() {
    initDialogFallbacks();

    // Auth events
    document
      .getElementById('loginForm')
      .addEventListener('submit', handleStep1Login);
    document.getElementById('totpForm').addEventListener('submit', handleStep2Totp);
    document.getElementById('backToLoginBtn').addEventListener('click', () => {
      document.getElementById('totpForm').hidden = true;
      document.getElementById('loginForm').hidden = false;
      setAuthStepUI('login');
      showAuthAlert('');
    });

    document.getElementById('togglePasswordBtn').addEventListener('click', () => {
      const pw = document.getElementById('loginPassword');
      pw.type = pw.type === 'password' ? 'text' : 'password';
    });

    // Panorama tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Topbar actions
    document.getElementById('refreshConsoleBtn').addEventListener('click', () => {
      loadAdminOverview(false);
      showToast('Telemetry and storage metrics refreshed.');
    });
    document.getElementById('topAddAppBtn').addEventListener('click', () => {
      switchTab('catalog');
      openAppModal(null);
    });
    document
      .getElementById('openNewAppModalBtn')
      .addEventListener('click', () => openAppModal(null));
    document
      .getElementById('openNewAdModalBtn')
      .addEventListener('click', openAdModal);
    document
      .getElementById('logoutBtn')
      .addEventListener('click', () => handleLogout(''));

    // Modal forms
    document
      .getElementById('appModalForm')
      .addEventListener('submit', handleSaveAppModal);
    document
      .getElementById('adModalForm')
      .addEventListener('submit', handleSaveAdModal);
    document
      .getElementById('confirmDeleteBtn')
      .addEventListener('click', executePendingDelete);

    // Log segmented filter
    document.querySelectorAll('[data-log-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document
          .querySelectorAll('[data-log-filter]')
          .forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.logFilter = btn.getAttribute('data-log-filter');
        if (state.overview?.analytics?.logs) {
          renderTelemetryLogs(state.overview.analytics.logs);
        }
      });
    });

    // Catalog search filter
    document
      .getElementById('catalogSearchInput')
      .addEventListener('input', (e) => {
        state.catalogQuery = e.target.value;
        if (state.overview?.apps) {
          renderCatalogTab(state.overview.apps);
        }
      });

    // Delegated clicks & file uploads inside dashboard
    document.getElementById('dashboardView').addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit-app]');
      if (editBtn) {
        openAppModal(editBtn.getAttribute('data-edit-app'));
        return;
      }

      const delAppBtn = e.target.closest('[data-delete-app]');
      if (delAppBtn) {
        openDeleteConfirm(
          'app',
          delAppBtn.getAttribute('data-delete-app'),
          delAppBtn.getAttribute('data-delete-name')
        );
        return;
      }

      const toggleAdBtn = e.target.closest('[data-toggle-ad]');
      if (toggleAdBtn) {
        toggleAdActive(toggleAdBtn.getAttribute('data-toggle-ad'));
        return;
      }

      const delAdBtn = e.target.closest('[data-delete-ad]');
      if (delAdBtn) {
        openDeleteConfirm(
          'ad',
          delAdBtn.getAttribute('data-delete-ad'),
          delAdBtn.getAttribute('data-delete-name')
        );
        return;
      }

      const copyTargetBtn = e.target.closest('[data-copy-target]');
      if (copyTargetBtn) {
        const targetId = copyTargetBtn.getAttribute('data-copy-target');
        const el = document.getElementById(targetId);
        if (el && navigator.clipboard) {
          navigator.clipboard.writeText(el.textContent || el.value || '');
          showToast('Copied snippet to clipboard.');
        }
      }
    });

    // Delegated file input change for .apk and .zip uploads
    document.getElementById('dashboardView').addEventListener('change', (e) => {
      const input = e.target.closest('[data-upload-input]');
      if (!input || !input.files || !input.files.length) return;
      const appId = input.getAttribute('data-upload-input');
      const uploadType = input.getAttribute('data-upload-type') || 'apk';
      const file = input.files[0];
      uploadAppBinary(appId, uploadType, file);
      input.value = '';
    });

    // Security tab buttons
    document.getElementById('copySecretBtn').addEventListener('click', () => {
      const val = document.getElementById('securitySecretReadonly').value;
      if (val && navigator.clipboard) {
        navigator.clipboard.writeText(val);
        showToast('Copied Base32 TOTP secret to clipboard.');
      }
    });

    document.getElementById('copyUriBtn').addEventListener('click', () => {
      const val = document.getElementById('securityOtpAuthReadonly').value;
      if (val && navigator.clipboard) {
        navigator.clipboard.writeText(val);
        showToast('Copied otpauth:// URI to clipboard.');
      }
    });

    document.getElementById('toggle2faStatusBtn').addEventListener('click', () => {
      const current = Boolean(state.overview?.admin?.totpEnabled);
      handleToggle2FA({ enabled: !current });
    });

    document.getElementById('rotate2faSecretBtn').addEventListener('click', () => {
      handleToggle2FA({ rotateSecret: true });
    });
  }

  function init() {
    bindEvents();

    if (state.token) {
      document.getElementById('authView').hidden = true;
      document.getElementById('dashboardView').hidden = false;
      loadAdminOverview();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
