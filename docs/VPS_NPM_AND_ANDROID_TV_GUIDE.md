# KV-TV Store (`https://tv.vndns.net`) — VPS Deployment, Nginx Proxy Manager & Android TV Engineering Guide

This guide covers the complete production lifecycle for **KV-TV Store**:
1. **System Architecture**: How the 10-foot Android TV D-Pad Store, Mobile/Desktop Promo Hub, and 2FA Admin Console work together.
2. **VPS Deployment (`thuevpsgiare`) & Auto-Prune Docker Workflow**: How to update APKs dynamically without rebuilding Docker, and how to prune unused Docker layers to save VPS disk space.
3. **Nginx Proxy Manager (NPM) Configuration for `https://tv.vndns.net`**: Including the essential `client_max_body_size 500M;` configuration for large `.apk` uploads.
4. **How the "Pre-Set Optimized App" Pipeline Works**: Practical methods to ship Jellyfin, Kodi, CloudStream, KV-Netflix, and KV-Tube pre-configured so users never have to type repository URLs on a TV remote.
5. **Building the Native `KV-Store.apk` Android TV Wrapper**: Complete Android `AndroidManifest.xml` and `MainActivity.kt` source code to compile a 1.5 MB native Android TV app that opens `https://tv.vndns.net` with native D-Pad navigation and 1-click APK installation.

---

## 1. System Architecture Overview

```
                         https://tv.vndns.net
                                  │
                                  ▼
                ┌───────────────────────────────────┐
                │   Nginx Proxy Manager (Port 443)  │
                │   Let's Encrypt SSL + HTTP/2      │
                │   client_max_body_size 500M       │
                └─────────────────┬─────────────────┘
                                  │  Proxy Pass -> http://172.17.0.1:3456
                                  ▼
                ┌───────────────────────────────────┐
                │   Docker Container: kv-tv-store   │
                │   Node.js 22 Alpine (Port 3456)   │
                ├─────────────────┬─────────────────┤
                │                 │                 │
                ▼                 ▼                 ▼
     ┌────────────────┐ ┌──────────────────┐ ┌────────────────┐
     │ 10-Foot TV UI  │ │ Mobile / Desktop │ │ Admin Console  │
     │ (?mode=tv)     │ │ Promo & Ad Hub   │ │ (/admin + 2FA) │
     │ D-Pad Spatial  │ │ QR + Short-Codes │ │ APK Upload &   │
     │ Navigation     │ │ Ad Impressions   │ │ Telemetry      │
     └────────────────┘ └──────────────────┘ └────────────────┘
                                  │
                    Host VPS Bind-Mounts (Persistent)
                    ├── ./data/store.json   (Catalog, Ads, 2FA, Telemetry)
                    └── ./uploads/*.apk     (APK Binaries & Pre-Set .zip Packs)
```

### Key Architectural Advantage: "Upload Without Rebuild"
In traditional Docker setups, adding static files requires rebuilding the Docker image, which duplicates layers and rapidly fills up small VPS disks.

**KV-TV Store** solves this by bind-mounting `./data` and `./uploads` directly from the Linux host into `/app/data` and `/app/uploads` inside the container:
- **Zero-Rebuild APK Management**: When you log into `https://tv.vndns.net/admin` (with Username/Password + 6-digit TOTP 2FA) and upload a 95 MB `Kodi-KV-Omega.apk` or delete an old `.apk`, the file is written/deleted directly in `/mnt/data/Projects/kv-tv/uploads` on the host. No Docker rebuild is needed.
- **Safe Aggressive Pruning**: When you update the store's code via `./scripts/deploy-and-prune.sh`, the script runs `docker image prune -af` and `docker builder prune -af` to reclaim 100% of old image layers and BuildKit caches while leaving `./data` and `./uploads` completely untouched.

---

## 2. Deploying on `thuevpsgiare` VPS

### Step 1: Clone or Copy the Project to Your VPS
SSH into your `thuevpsgiare` VPS and place the project in `/opt/kv-tv` (or `/mnt/data/Projects/kv-tv`):

```bash
mkdir -p /opt/kv-tv
cd /opt/kv-tv
# Upload or git clone the repository here
chmod +x ./scripts/deploy-and-prune.sh
```

### Step 2: Run the Auto-Prune Deployment Script
Whenever you deploy for the first time—or whenever you pull a code update—run:

```bash
./scripts/deploy-and-prune.sh
```

What `./scripts/deploy-and-prune.sh` does automatically:
1. Creates `./data` and `./uploads` on the host and backs up `./data/store.json` to `./data/store.json.bak`.
2. Displays `df -h` and `docker system df` **before** building.
3. Runs `docker compose up -d --build --remove-orphans`.
4. Verifies that `http://127.0.0.1:3456/api/catalog` returns HTTP 200 OK.
5. Runs `docker container prune -f`, `docker image prune -af`, `docker builder prune -af`, and `docker volume prune -f` to immediately free all dangling build layers.
6. Displays `df -h` and `docker system df` **after** cleanup so you can verify your free disk space.

---

## 3. Mapping `https://tv.vndns.net` in Nginx Proxy Manager (NPM)

### Step 1: DNS Configuration (`vndns.net`)
In your DNS provider (Cloudflare or your domain registrar for `vndns.net`), create an `A` record:
- **Type**: `A`
- **Name**: `tv` (resolves to `tv.vndns.net`)
- **IPv4 Address**: `<YOUR_THUEVPSGIARE_PUBLIC_IP>`
- **Proxy Status**: DNS Only (Grey cloud recommended while issuing Let's Encrypt cert, or Cloudflare Proxied with Full/Strict SSL; note Cloudflare free tier limits single HTTP request uploads to 100MB, so if uploading >100MB Kodi APKs via `/admin`, either use DNS Only or upload chunks/direct IP).

### Step 2: Create the Proxy Host in Nginx Proxy Manager
Open your Nginx Proxy Manager admin UI (typically port `81`), go to **Hosts → Proxy Hosts → Add Proxy Host**:

#### **Details Tab**
- **Domain Names**: `tv.vndns.net`
- **Scheme**: `http`
- **Forward Hostname / IP**:
  - Use `172.17.0.1` (the default Docker bridge gateway IP on Linux) or your VPS private IP.
  - *Alternative*: If you uncomment `npm_default` in `docker-compose.yml` so both NPM and `kv-tv-store` share a Docker network, enter `kv-tv-store`.
- **Forward Port**: `3456`
- **Cache Assets**: `OFF` (KV-TV Store handles its own headers and dynamic JSON catalog)
- **Block Common Exploits**: `ON`
- **Websockets Support**: `ON`

#### **SSL Tab**
- **SSL Certificate**: Request a new SSL Certificate with Let's Encrypt
- **Force SSL**: `ON`
- **HTTP/2 Support**: `ON`
- **HSTS Enabled**: `ON`

#### **Advanced Tab (CRITICAL FOR `.APK` UPLOADS)**
By default, Nginx blocks file uploads larger than `1 MB` with `413 Request Entity Too Large`. Because Android TV `.apk` files (like Kodi, Jellyfin, and KV-Netflix) range from `15 MB` to `250 MB`, paste the following into the **Custom Nginx Configuration** box in the **Advanced** tab:

```nginx
# Allow uploading large Android TV .apk binaries & .zip pre-set bundles up to 500 MB
client_max_body_size 500M;

# Stream APK uploads directly to the Node.js backend without buffering to NPM temp disk
proxy_request_buffering off;
proxy_buffering off;

# Extended timeouts for large APK uploads & downloads on slower connections
proxy_read_timeout 600s;
proxy_send_timeout 600s;
send_timeout 600s;
```

Click **Save**. Now `https://tv.vndns.net` and `https://tv.vndns.net/admin` are live over HTTPS!

---

## 4. How the "Pre-Set Optimized App" Pipeline Works

Typing long URLs, repo addresses, or subtitle tokens with an Android TV remote D-Pad is painful for end users. **KV-TV Store** supports three practical tiers of shipping "already setup" (Pre-Set) applications:

### Method A: Pre-Configured Companion Pack (`.zip` / Backup Restore) — *Supported Out-of-the-Box*
In `/admin` → **App Catalog & APK Manager**, every app supports two uploads:
1. **Primary `.apk` Binary** (`X-Upload-Type: apk`) — Downloaded when the user clicks **Download APK** or enters the 5-digit short-code (e.g. `88101`).
2. **Pre-Set Companion Pack** (`X-Upload-Type: preset`) — A `.zip` or `.json` backup containing pre-configured repositories, skin settings, and server URLs.
   - **Kodi 21 Omega**: Configure Kodi once on your test device (install skins, Vietnamese subtitle addons, media sources), export the `addons/` + `userdata/` folders as `kodi-kv-preset.zip`, and upload it as the Pre-Set Pack in `/admin`.
   - **CloudStream 3**: Export your configured layout/extension list backup and attach it as the Pre-Set Pack.

### Method B: Pre-Modded APK with Embedded Default Assets (`assets/`)
For **Jellyfin TV**, **KV-Netflix**, and **KV-Tube** (e.g., SmartTube-based or custom Android TV builds):
1. Use **APKTool** or compile from open-source upstream (e.g., `jellyfin-androidtv` or `SmartTube`):
   - In `jellyfin-androidtv`, set your default server discovery address or pre-populate `shared_prefs` on first run if empty.
   - In `SmartTube` (`KV-Tube`), bundle your default `settings_backup.zip` inside `assets/` so SponsorBlock, 4K60 HDR VP9, and clean home tabs are active on first launch.
2. Sign the APK with your release keystore (`apksigner sign --ks kv-release.jks`) so future updates uploaded to `/admin` install seamlessly over existing installs without "Package signatures do not match" errors.

### Method C: First-Launch Auto-Provisioning via `KV-Store.apk`
When you package the native `KV-Store.apk` launcher wrapper (below), the store app itself can download both the `.apk` and the `.zip` Pre-Set Pack, prompt Android's PackageInstaller for the `.apk`, and copy the companion configuration into `/sdcard/Android/media/` or a shared directory.

---

## 5. Packaging a Native Android TV App (`KV-Store.apk`)

While users can immediately access `https://tv.vndns.net` from **Downloader by AFTVnews** (using the 5-digit short-codes), **TV Bro**, or any browser, you can also compile a tiny **1.5 MB Native Android TV App (`KV-Store.apk`)** that appears on the Android TV / Google TV Leanback Home Row and opens `https://tv.vndns.net/?mode=tv` fullscreen with native APK auto-installation.

### 1. `AndroidManifest.xml`
Includes the `LEANBACK_LAUNCHER` intent filter (mandatory for Android TV home screens), banner drawable, internet access, and `REQUEST_INSTALL_PACKAGES` so clicking an APK in the store triggers the native Android TV package installer directly:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="net.vndns.tv.store">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

    <!-- Declare Android TV Leanback support without requiring a touchscreen -->
    <uses-feature
        android:name="android.software.leanback"
        android:required="true" />
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />

    <application
        android:allowBackup="true"
        android:banner="@drawable/tv_banner"
        android:icon="@mipmap/ic_launcher"
        android:label="KV-TV Store"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name=".MainActivity"
            android:configChanges="keyboard|keyboardHidden|navigation|orientation|screenSize"
            android:exported="true"
            android:screenOrientation="landscape">
            <!-- Standard launcher + Android TV Leanback Home Screen launcher -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
```

### 2. `MainActivity.kt` (WebView + Native APK Download & Installer Bridge)
This lightweight activity loads `https://tv.vndns.net/?mode=tv`, passes remote D-Pad keys (`DPAD_UP`, `DPAD_DOWN`, `DPAD_LEFT`, `DPAD_RIGHT`, `DPAD_CENTER`, `BACK`) straight to the KV-TV Store's spatial navigator, intercepts `.apk` downloads, downloads them to cache with a native progress toast, and launches the Android PackageInstaller automatically:

```kotlin
package net.vndns.tv.store

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.DownloadListener
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private val storeUrl = "https://tv.vndns.net/?mode=tv"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString AndroidTV KVTVStore/1.0"
        }

        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        // Intercept .apk downloads and trigger native Android TV PackageInstaller
        webView.setDownloadListener(DownloadListener { url, _, _, mimetype, _ ->
            if (url.endsWith(".apk") || mimetype == "application/vnd.android.package-archive" || url.contains("/dl/")) {
                downloadAndInstallApk(url)
            } else {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            }
        })

        webView.loadUrl(storeUrl)
    }

    private fun downloadAndInstallApk(apkUrl: String) {
        Toast.makeText(this, "Downloading APK from KV-TV Store...", Toast.LENGTH_SHORT).show()
        thread {
            try {
                val outFile = File(externalCacheDir ?: cacheDir, "kvtv-install.apk")
                val conn = URL(apkUrl).openConnection() as HttpURLConnection
                conn.instanceFollowRedirects = true
                conn.connect()
                conn.inputStream.use { input ->
                    outFile.outputStream().use { output -> input.copyTo(output) }
                }
                runOnUiThread {
                    val apkUri = FileProvider.getUriForFile(
                        this,
                        "$packageName.fileprovider",
                        outFile
                    )
                    val installIntent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(apkUri, "application/vnd.android.package-archive")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                    }
                    startActivity(installIntent)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(this, "Download failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
```

Once compiled (`./gradlew assembleRelease`), you can upload `KV-Store.apk` into your `/admin` dashboard so any visitor on `https://tv.vndns.net` can install the KV-TV Store app itself with one click!
