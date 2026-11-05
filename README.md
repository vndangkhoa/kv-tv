<p align="center">
  <img src="public/logo.svg" alt="KV-TV Store Logo" width="110" height="110" style="border: 2px solid #0078D7;">
</p>

<h1 align="center">KV-TV Store</h1>

<p align="center">
  <strong>The 10-Foot Android TV App Store &amp; Pre-Configured 4K Media Hub.</strong><br>
  Engineered with the canonical <b>Metro Typographic Panorama design system (<code>kv-tv-theme</code>)</b>, <b>2D spatial D-Pad navigation</b>, <b>AFTVnews Downloader 5-digit short-codes (<code>88101</code>–<code>88105</code>)</b>, and <b>zero manual repository typing</b>.<br>
  <i>Available at <a href="https://tv.vndns.net">https://tv.vndns.net</a> with Phone/Desktop Promotional Hub and RFC 6238 TOTP 2FA Admin Operations Console.</i>
</p>

<p align="center">
  <a href="https://tv.vndns.net"><img src="https://img.shields.io/badge/Website-tv.vndns.net-0078D7?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Website"></a>
  <a href="https://tv.khoavo.vndns.net"><img src="https://img.shields.io/badge/Mirror-tv.khoavo.vndns.net-008272?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Mirror Domain"></a>
  <a href="https://hub.docker.com/r/vndangkhoa/kv-tv"><img src="https://img.shields.io/docker/v/vndangkhoa/kv-tv?style=for-the-badge&label=Docker%20Hub&color=2496ED&logo=docker" alt="Docker Hub Image"></a>
  <a href="https://git.khoavo.myds.me/vndangkhoa/kv-tv"><img src="https://img.shields.io/badge/Forgejo-MyDS_Mirror-success?style=for-the-badge&logo=forgejo&logoColor=white" alt="Forgejo Repository"></a>
  <a href="https://gitlab.khoavo.myds.me/vndangkhoa/kv-tv"><img src="https://img.shields.io/badge/GitLab-Self--Hosted-FC6D26?style=for-the-badge&logo=gitlab&logoColor=white" alt="GitLab Repository"></a>
  <a href="https://github.com/vndangkhoa/kv-tv"><img src="https://img.shields.io/badge/GitHub-vndangkhoa%2Fkv--tv-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Runtime-Node_22_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 22 LTS"></a>
  <a href="#-license"><img src="https://img.shields.io/badge/License-MIT-gray?style=for-the-badge" alt="License MIT"></a>
</p>

<p align="center">
  <a href="https://tv.vndns.net"><b>🌐 Live Store</b></a> •
  <a href="#-why-kv-tv-store"><b>Why KV-TV?</b></a> •
  <a href="#-competitive-comparison"><b>Comparison</b></a> •
  <a href="#-interface-preview"><b>Interface</b></a> •
  <a href="#-killer-features"><b>Features</b></a> •
  <a href="#-pre-configured-android-tv-lineup"><b>App Lineup</b></a> •
  <a href="#-quick-start-30-seconds"><b>Quick Start</b></a> •
  <a href="#-architecture--directory-structure"><b>Architecture</b></a> •
  <a href="#-rest-api-reference"><b>API Reference</b></a> •
  <a href="#-license"><b>License</b></a>
</p>

---

## ⚡ Why KV-TV Store?

Setting up streaming and home theater applications on Android TV, Google TV, or Fire TV sticks is notoriously tedious:

- 🎮 **The Remote Typing Nightmare**: Entering long repository URLs, raw GitHub release links, or complex JSON sources with a TV remote D-Pad takes 15+ minutes per device.
- 🧩 **Broken Subtitles & Addons**: Vanilla installations of **CloudStream**, **Kodi**, or **Jellyfin** lack pre-activated Vietnamese / English subtitle providers, optimized hardware buffers, and Cloudflare DNS-over-HTTPS (DoH).
- 🖱️ **Air-Mouse & Mobile Port Headaches**: Sideloading mobile APKs forces users to fight with virtual mouse toggles because UI touch targets are unoptimized for 10-foot television viewing distances.
- 📦 **Container Disk Bloat**: Traditional self-hosted stores rebuild Docker images whenever an APK updates, exhausting VPS storage and creating downtime.

**KV-TV Store (`tv.vndns.net`)** eliminates these pain points with a unified, self-hosted media delivery platform:

- 📺 **10-Foot Spatial D-Pad Navigation**: Engineered with `kv-tv-theme` (Metro Typographic Panorama) featuring roving tabindex, geometric 2D bounding-box projection, and zero-radius high-contrast focus rings (`4px solid #FFFFFF`).
- ⚡ **Pre-Configured Signature Builds**: Every APK comes with pre-activated Vietnamese & Global 4K extensions, ExoPlayer/HDR10 direct-play flags, and subtitle scrapers pre-tuned.
- 🔢 **5-Digit AFTVnews Short-Codes**: Users simply enter a 5-digit number (`88101`–`88105`) into the official **Downloader** app to trigger direct 302 APK downloads.
- 📱 **Dual-Audience Promotional Hub**: Responsive mobile & desktop landing portal (`/?mode=promo`) equipped with QR code phone sideloading, hardware compatibility chips, and partner sponsor tiles.
- 🐳 **Zero-Rebuild Persistent Docker Bind-Mounts**: `./data` (catalog JSON, telemetry, 2FA) and `./uploads` (.apk and .zip files) live directly on the host VPS. Uploading new APKs in `/admin` requires **zero Docker rebuilds or service restarts**.
- 🛡️ **Security-Hardened Admin Operations Console**: Full web-based APK uploader, metadata editor, ad campaign manager, and telemetry dashboard protected by **RFC 6238 TOTP Two-Factor Authentication**.

---

## 📊 Competitive Comparison

| Capability | 📺 **KV-TV Store** | 🛒 Google Play Store TV | 🌐 Downloader Manual URLs | 🍿 Aptoide TV |
| :--- | :---: | :---: | :---: | :---: |
| **Pre-Configured Repos & Subs** | **✅ Pre-installed (MegaRepo + Vietsub)** | ❌ Vanilla only | ❌ Manual typing | ❌ Vanilla only |
| **5-Digit Downloader Codes** | **✅ Instant 302 Redirects (`88101`–`88105`)** | ❌ None | ⚠️ Requires setup | ❌ None |
| **10-Foot Remote Navigation** | **✅ Metro 2D Spatial D-Pad Engine** | ⚠️ Generic Grid | ❌ Pointer/Mouse only | ⚠️ Cluttered UI |
| **Standalone Pre-Set `.zip` Packs** | **✅ Exported for Vanilla Apps** | ❌ None | ❌ None | ❌ None |
| **Phone QR Companion Sideload** | **✅ Built-in QR Generator** | ❌ None | ❌ None | ❌ None |
| **Zero-Rebuild Host Persistence** | **✅ Host Bind-Mounts (`./uploads`)** | N/A (Closed) | ⚠️ Manual FTP/Web | ❌ Closed Infra |
| **Admin Console with TOTP 2FA** | **✅ Native RFC 6238 2FA** | ❌ None | ❌ None | ❌ None |
| **Privacy & Zero Adware** | **✅ Self-Hosted, No Trackers** | ⚠️ Heavy Tracking | ⚠️ Ad-Supported Sites | ❌ Adware Bloat |

---

## 📸 Interface Preview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [■] KV-TV STORE · tv.vndns.net  [KV-TV-THEME v1.0]      [Storefront] [Pre-Sets] [Codes] [Promo] [Admin] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   store   pre-sets   short-codes   phone-qr                                            │
│   Pre-Configured Android TV Storefront — Zero manual repo typing. 18,060 INSTALLS      │
│                                                                                        │
│ ┌───────────────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐ │
│ │ CloudStream 3 — KV-PreSetup│ │ Jellyfin TV │ │ Kodi 21     │ │ KV-Tube              │ │
│ │ 88103 · 24.2 MB           │ │ 88101       │ │ 88102       │ │ 88105 · 19.4 MB      │ │
│ │ Auto-selects 4K Vietsub   │ │ 4K HDR10    │ │ Arctic Z. 2 │ │ Ad-Free 4K60         │ │
│ │ MegaRepo + 1.1.1.1 DoH    │ │ Direct Play │ │ 512MB Cache │ │ SponsorBlock Ready   │ │
│ └───────────────────────────┘ └─────────────┘ └─────────────┘ └──────────────────────┘ │
│ ┌─────────────┐ ┌─────────────┐ ┌────────────────────────────────────────────────────┐ │
│ │ KV-Netflix  │ │ Short-Code  │ │ Phone & QR Companion Tile                          │ │
│ │ 88104       │ │ Dialer      │ │ [ QR CODE ]  Scan with phone camera or             │ │
│ │ 4K HDR Mod  │ │ 88101-88105 │ │              visit https://tv.vndns.net             │ │
│ └─────────────┘ └─────────────┘ └────────────────────────────────────────────────────┘ │
│                                                                                        │
│ ────────────────────────────────────────────────────────────────────────────────────── │
│ [D-PAD REMOTE]  [BACK]  [▲]  [CODE]  [◄]  [OK]  [►]  [QR]  [▼]  [TOP]                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Killer Features

### 1. 📺 Metro Typographic Panorama & Spatial D-Pad Navigation (`kv-tv-theme`)
Built strictly to the **7 Golden Laws of `kv-tv-theme`** codified in [`docs/KV_TV_THEME_PLAYBOOK.md`](docs/KV_TV_THEME_PLAYBOOK.md):
- **Pure `#000000` OLED Canvas**: Deep black ground eliminates blooming and saves power on OLED and Mini-LED panels.
- **2D Geometric Raycasting**: Navigating via arrow keys dynamically calculates candidates using Euclidean gap and perpendicular center offsets rather than static 1D tab order.
- **Zero-Radius Flat Aesthetic**: Solid chromatic tiles (`#0078D7` Cobalt, `#6B21A8` Violet, `#008272` Teal, `#D83B01` Crimson, `#B91C1C` Vermilion, `#107C10` Emerald, `#B45309` Amber) with sharp `4px solid #FFFFFF` focus outlines.

### 2. ⚡ Signature Pre-Configured Android TV Builds (`88101`–`88105`)
Ships with 5 tuned builds ready for instant deployment:
- **CloudStream 3 (`88103`)**: Includes MegaRepo + Vietnamese HD movie/anime providers, auto-stream quality selector, and Cloudflare `1.1.1.1` DoH pre-configured to bypass ISP blocks.
- **Jellyfin TV (`88101`)**: Direct-Play 4K HEVC/HDR10, ExoPlayer buffer optimization, and Vietnamese audio/subtitle fallbacks.
- **Kodi 21 Omega (`88102`)**: Pre-skinned with Arctic Zephyr 2, 512MB RAM cache tuning, and OpenSubtitles.com pre-linked.
- **KV-Netflix (`88104`)**: TV Remote & 4K HDR mod with native D-Pad focus rings and Widevine L1/L3 adaptive bitrate support.
- **KV-Tube (`88105`)**: Ad-free SmartTubeTV mod with SponsorBlock, Return YouTube Dislike, and VP9/AV1 hardware decoding.

### 3. 💾 Zero-Rebuild Persistent Docker Bind-Mount Architecture
Uploading a new 100MB APK or modifying catalog JSON **never requires rebuilding the container**:
- `/app/data` is mounted to `./data` on the host (`store.json` persists downloads, visitor telemetry, and TOTP secrets).
- `/app/uploads` is mounted to `./uploads` on the host (stores `.apk` binaries and `.zip` pre-set archives).
- Rebuilding or restarting the Docker container leaves all binaries and database state completely intact.

### 4. 📱 Dual-Audience Phone & Desktop Promotional Hub (`/?mode=promo`)
A dedicated marketing and companion landing experience accessible at `https://tv.vndns.net/?mode=promo`:
- Instant dynamic QR code for mobile camera scanning.
- 3-step installation guide with inline SVG diagrams.
- Active partner & sponsor banner campaign tiles.
- Searchable catalog data table with 1-click APK download, Pre-Set archive download, and code copy buttons.

### 5. 🛡️ Security-Hardened Admin Operations Console (`/admin`)
- Two-tier gate: Username/Password authentication followed by **RFC 6238 TOTP Two-Factor Authentication** with time-drift tolerance ($\pm 1$ step).
- Web-based multipart APK and Pre-Set pack upload directly to persistent storage.
- Real-time download counters, visitor metrics, and sponsor impression analytics.
- Live local-dev TOTP helper tile for instant clipboard copying during setup.

---

## 📦 Pre-Configured Android TV Lineup

| Short-Code | Application | Edition | Key Optimizations | Direct Download |
| :---: | :--- | :--- | :--- | :---: |
| **`88101`** | **Jellyfin TV** | KV-Optimized | 4K HEVC/HDR10 Direct Play, ExoPlayer Buffer Tuning, VN Subtitles | [`/go/88101`](https://tv.vndns.net/go/88101) |
| **`88102`** | **Kodi 21 Omega** | KV-Build All-in-One | Arctic Zephyr 2 10-foot Skin, 512MB RAM Cache, OpenSubtitles | [`/go/88102`](https://tv.vndns.net/go/88102) |
| **`88103`** | **CloudStream 3** | KV-PreSetup (Full) | MegaRepo + Vietsub HD Providers, 1.1.1.1 DoH DNS Bypass | [`/go/88103`](https://tv.vndns.net/go/88103) |
| **`88104`** | **KV-Netflix** | TV Remote & HDR Mod | Native D-Pad Focus, Widevine L1/L3 Adaptive 4K Bitrate | [`/go/88104`](https://tv.vndns.net/go/88104) |
| **`88105`** | **KV-Tube** | Ad-Free 4K60 | SponsorBlock, Return YouTube Dislike, VP9/AV1 Decode | [`/go/88105`](https://tv.vndns.net/go/88105) |

---

## 🚀 Quick Start (30 Seconds)

### Option A: Run Prebuilt Docker Container
Run the official image with persistent host bind-mounts:

```bash
docker run -d \
  --name kv-tv \
  -p 3456:3456 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e PUBLIC_BASE_URL=https://tv.vndns.net \
  -e ADMIN_DEFAULT_USER=admin \
  -e ADMIN_DEFAULT_PASS=kvtv2026 \
  --restart unless-stopped \
  vndangkhoa/kv-tv:latest
```

Open **`http://localhost:3456`** in your browser.

---

### Option B: Deploy with Docker Compose
Using the production [`docker-compose.yml`](docker-compose.yml):

```bash
docker compose pull
docker compose up -d
```

---

### Option C: Automated Multi-Git Push + Docker Build + VPS Rollout
Commit code, push to **GitHub + Forgejo + GitLab**, rebuild & push the Docker image, deploy to your VPS, and prune unused layers with a single command:

```bash
./scripts/push-and-deploy.sh "feat: update pre-set configs or UI"
```

---

## 📱 Android TV Installation (3 Simple Steps)

1. **Open Downloader by AFTVnews** on your Android TV, Sony Bravia, TCL, or Xiaomi Box.
2. **Enter any 5-Digit Short-Code**:
   - `88101` &rarr; Jellyfin TV
   - `88102` &rarr; Kodi 21 Omega
   - `88103` &rarr; CloudStream 3
   - `88104` &rarr; KV-Netflix
   - `88105` &rarr; KV-Tube
   *(Or enter `tv.vndns.net` to browse the full 10-foot interactive store)*.
3. **Click Install** &mdash; All repos, plugins, and subtitle providers are pre-configured. Open and enjoy!

---

## 🏗️ Architecture & Directory Structure

```
kv-tv/
├── .github/workflows/
│   └── docker-publish.yml         # Multi-arch automated Docker Hub publisher
├── .forgejo/workflows/
│   └── build.yml                  # Self-hosted Forgejo CI syntax & integrity check
├── .gitlab-ci.yml                 # GitLab CI pipeline definition
├── .impeccable/
│   └── design.json                # Impeccable schema v2 design tokens & component contracts
├── data/
│   └── store.json                 # Persistent catalog, telemetry, 2FA secret & ad state
├── docs/
│   ├── KV_TV_THEME_PLAYBOOK.md    # 7 Golden Laws, token matrix & 60-second page boilerplate
│   └── VPS_NPM_AND_ANDROID_TV_GUIDE.md # VPS setup, NPM proxy host, & Android TV remote guide
├── lib/
│   ├── seed.js                    # Initial catalog seeder (5 signature apps + ad campaigns)
│   └── totp.js                    # RFC 6238 HMAC-SHA1 TOTP 2FA engine with drift tolerance
├── public/
│   ├── admin.css                  # Admin console styles in kv-tv-theme
│   ├── admin.html                 # Admin Operations Console & 2FA login gate
│   ├── admin.js                   # Admin state, CRUD handlers, and telemetry charting
│   ├── app.js                     # 10-foot 2D spatial D-Pad navigation & modal controllers
│   ├── index.html                 # 10-foot TV storefront & responsive promo hub
│   ├── kv-tv-theme.css            # Canonical Metro design tokens, buttons, dialogs & tables
│   ├── logo.svg                   # Sharp Metro TV vector brandmark
│   ├── manifest.json              # Progressive Web App manifest for Android TV
│   └── styles.css                 # Storefront layout extensions
├── scripts/
│   ├── deploy-and-prune.sh        # Host deployment and Docker layer pruning script
│   ├── push-and-deploy.sh         # Master multi-git sync, Docker build, and VPS rollout
│   └── setup-npm-tv.py            # Automated NPM proxy host & Let's Encrypt SSL provisioner
├── uploads/
│   └── .gitkeep                   # Persistent host storage for .apk and .zip files
├── DESIGN.md                      # Official Impeccable Design System specification
├── Dockerfile                     # Lightweight Node 22 Alpine production container
├── docker-compose.yml             # Local & VPS container stack definition
├── package.json                   # Zero heavy framework dependencies
├── PRODUCT.md                     # Durable product context & requirements schema
└── server.js                      # High-throughput HTTP API, static file & proxy server
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/catalog?device=tv\|desktop` | Returns catalog apps, store metadata, and active sponsor ads | Public |
| `GET` | `/api/download/:appId?type=apk\|preset` | Direct stream for `.apk` or `.zip` file; increments install count | Public |
| `GET` | `/go/:shortCode` | `302 Found` redirect for AFTVnews Downloader (e.g. `/go/88103`) | Public |
| `GET` | `/api/qr?text=...&size=200` | Generates high-contrast SVG/PNG QR code for companion pairing | Public |
| `POST` | `/api/ads/:adId/click` | Registers an impression / click conversion for sponsor ads | Public |
| `POST` | `/api/auth/login` | Step 1 authentication: verifies admin username and password | Public |
| `POST` | `/api/auth/verify-2fa` | Step 2 authentication: verifies 6-digit RFC 6238 TOTP token | Public |
| `GET` | `/api/admin/metrics` | Fetches install telemetry, active sessions, and disk statistics | Admin Session |
| `POST` | `/api/admin/apps` | Creates or updates an app entry in `data/store.json` | Admin Session |
| `DELETE` | `/api/admin/apps/:appId` | Removes an app entry and optionally deletes uploaded files | Admin Session |
| `POST` | `/api/admin/upload` | Multipart upload for `.apk` binaries or `.zip` pre-set archives | Admin Session |

---

## 📜 License

This project is licensed under the **MIT License**.

Designed and maintained by **Khoa Vo ([@vndangkhoa](https://github.com/vndangkhoa))**.
Hosted on **thuevpsgiare** at **[https://tv.vndns.net](https://tv.vndns.net)**.
