package net.vndns.tv.store

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.core.content.FileProvider
import androidx.core.content.pm.PackageInfoCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.zip.ZipInputStream

class KVTVBridge(
    private val activity: Activity,
    private val webView: WebView
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(Dispatchers.IO)
    private val context: Context get() = activity.applicationContext

    @Volatile
    private var isDownloadingApk: Boolean = false

    companion object {
        const val STATUS_NOT_INSTALLED = "NOT_INSTALLED"
        const val STATUS_UPDATE = "UPDATE"
        const val STATUS_INSTALLED = "INSTALLED"
        const val BASE_URL = "https://tv.vndns.net"

        const val PKG_KODI = "org.xbmc.kodi"
        const val PKG_CLOUDSTREAM = "com.lagradost.cloudstream3"

        const val KODI_PRESET_URL = "$BASE_URL/api/download/kodi-kv?type=preset"
        const val CLOUDSTREAM_REPO_URL = "https://n.khoavo.vndns.net/repo.json"
        const val CLOUDSTREAM_PLUGIN_URL = "https://n.khoavo.vndns.net/KVNetflixProvider.cs3"
        const val MAX_REDIRECTS = 10
        const val MIN_VALID_APK_BYTES = 100_000L
        const val FORGEJO_RELEASE_BASE =
            "https://git.khoavo.myds.me/vndangkhoa/kv-tv/releases/download/v1.0.0"

        val TRUSTED_DOWNLOAD_HOSTS = setOf(
            "tv.vndns.net",
            "tv.khoavo.vndns.net",
            "git.khoavo.myds.me",
            "n.khoavo.vndns.net",
            "127.0.0.1",
            "10.0.2.2",
            "localhost"
        )

        val BACKUP_APK_URLS: Map<String, String> = mapOf(
            "kv-store" to "$FORGEJO_RELEASE_BASE/kv-store.apk",
            "kv-store.apk" to "$FORGEJO_RELEASE_BASE/kv-store.apk",
            "88000" to "$FORGEJO_RELEASE_BASE/kv-store.apk",
            "jellyfin-kv" to "$FORGEJO_RELEASE_BASE/jellyfin-kv.apk",
            "jellyfin-kv.apk" to "$FORGEJO_RELEASE_BASE/jellyfin-kv.apk",
            "88101" to "$FORGEJO_RELEASE_BASE/jellyfin-kv.apk",
            "kodi-kv" to "$FORGEJO_RELEASE_BASE/kodi-kv.apk",
            "kodi-kv.apk" to "$FORGEJO_RELEASE_BASE/kodi-kv.apk",
            "88102" to "$FORGEJO_RELEASE_BASE/kodi-kv.apk",
            "cloudstream-kv" to "$FORGEJO_RELEASE_BASE/cloudstream-kv.apk",
            "cloudstream-kv.apk" to "$FORGEJO_RELEASE_BASE/cloudstream-kv.apk",
            "88103" to "$FORGEJO_RELEASE_BASE/cloudstream-kv.apk",
            "kv-netflix-tv.apk" to "$FORGEJO_RELEASE_BASE/kv-netflix-tv.apk",
            "kv-netflix" to "$FORGEJO_RELEASE_BASE/kv-netflix-tv.apk",
            "88104" to "$FORGEJO_RELEASE_BASE/kv-netflix-tv.apk",
            "kv-tube" to "$FORGEJO_RELEASE_BASE/kv-tube.apk",
            "kv-tube.apk" to "$FORGEJO_RELEASE_BASE/kv-tube.apk",
            "88105" to "$FORGEJO_RELEASE_BASE/kv-tube.apk",
            "smarttube-tv" to "$FORGEJO_RELEASE_BASE/smarttube-tv.apk",
            "smarttube-tv.apk" to "$FORGEJO_RELEASE_BASE/smarttube-tv.apk",
            "88106" to "$FORGEJO_RELEASE_BASE/smarttube-tv.apk"
        )

        val PACKAGE_ALIASES: Map<String, List<String>> = mapOf(
            "org.smarttube.stable" to listOf("org.smarttube.stable", "com.teamsmart.videomanager.tv", "app.smarttube.fdroid", "com.liskovsoft.smarttubetv"),
            "com.teamsmart.videomanager.tv" to listOf("org.smarttube.stable", "com.teamsmart.videomanager.tv", "app.smarttube.fdroid", "com.liskovsoft.smarttubetv"),
            "org.schabi.newpipe" to listOf("org.schabi.newpipe", "com.kvtube.tv"),
            "com.kvtube.tv" to listOf("org.schabi.newpipe", "com.kvtube.tv")
        )
    }

    private fun resolveInstalledPackage(packageName: String): android.content.pm.PackageInfo? {
        val pm = context.packageManager
        val candidates = PACKAGE_ALIASES[packageName] ?: listOf(packageName)
        for (cand in candidates) {
            try {
                return pm.getPackageInfo(cand, 0)
            } catch (_: PackageManager.NameNotFoundException) {
            } catch (_: Exception) {
            }
        }
        return null
    }

    /**
     * Check installation status of a single package.
     * Returns "NOT_INSTALLED", "UPDATE", or "INSTALLED".
     */
    @JavascriptInterface
    fun checkApp(packageName: String, storeVersionCode: Long): String {
        return try {
            val pInfo = resolveInstalledPackage(packageName) ?: return STATUS_NOT_INSTALLED
            val installedCode = PackageInfoCompat.getLongVersionCode(pInfo)
            if (storeVersionCode > 0 && installedCode < storeVersionCode) {
                STATUS_UPDATE
            } else {
                STATUS_INSTALLED
            }
        } catch (e: Exception) {
            STATUS_NOT_INSTALLED
        }
    }

    /**
     * Batch check app catalog packages from JSON array string.
     * Returns JSON map: {"org.xbmc.kodi": "INSTALLED", ...}
     */
    @JavascriptInterface
    fun scanCatalogStatuses(catalogJsonStr: String): String {
        val result = JSONObject()
        try {
            val arr = JSONArray(catalogJsonStr)
            for (i in 0 until arr.length()) {
                val item = arr.optJSONObject(i)
                val pkgName = item?.optString("packageName")
                    ?: arr.optString(i, "")
                if (pkgName.isNullOrBlank()) continue

                val storeCode = item?.optLong("versionCode", 0L) ?: 0L
                val status = checkApp(pkgName, storeCode)
                result.put(pkgName, status)
            }
        } catch (e: Exception) {
            // Error parsing json
        }
        return result.toString()
    }

    /**
     * Clean up temporary APK files from cache and external directories
     * so KV-Store never leaves stored APK files on the device.
     */
    @JavascriptInterface
    fun cleanTempApks(): Int {
        if (isDownloadingApk) return 0
        var deletedCount = 0
        val candidateDirs = listOfNotNull(
            File(context.cacheDir, "apk_staging"),
            context.cacheDir,
            context.externalCacheDir,
            context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
            context.filesDir
        )
        for (dir in candidateDirs) {
            if (!dir.exists() || !dir.isDirectory) continue
            val files = dir.listFiles() ?: continue
            for (file in files) {
                if (file.isFile && (file.name.endsWith(".apk", ignoreCase = true) || file.name.endsWith(".apk.tmp", ignoreCase = true))) {
                    if (file.delete()) {
                        deletedCount++
                    }
                }
            }
        }
        return deletedCount
    }

    /**
     * Pre-configure Kodi 21 Omega or CloudStream 3 with KV-Netflix addons/repos.
     * - For Kodi (org.xbmc.kodi): checks if /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/plugin.video.kvnetflix/addon.py
     *   exists; if not, downloads https://tv.vndns.net/api/download/kodi-kv?type=preset on a background coroutine
     *   and extracts the zip into /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/.
     * - For CloudStream 3 (com.lagradost.cloudstream3): ensures KV-Netflix repo (https://n.khoavo.vndns.net/repo.json)
     *   and plugin (KVNetflixProvider.cs3) are configured.
     */
    @JavascriptInterface
    fun preConfigureApp(packageName: String): Boolean {
        return when (packageName) {
            PKG_KODI -> {
                val addonPy = File("/sdcard/Android/data/$PKG_KODI/files/.kodi/addons/plugin.video.kvnetflix/addon.py")
                if (!addonPy.exists()) {
                    scope.launch {
                        installKodiKvNetflixAddon()
                    }
                }
                true
            }
            PKG_CLOUDSTREAM -> {
                scope.launch {
                    ensureCloudStreamKvNetflixPreset()
                }
                true
            }
            else -> false
        }
    }

    private fun installKodiKvNetflixAddon(): Boolean {
        return try {
            val addonsDir = File("/sdcard/Android/data/$PKG_KODI/files/.kodi/addons")
            val addonPy = File(addonsDir, "plugin.video.kvnetflix/addon.py")
            if (addonPy.exists() && addonPy.length() > 0) {
                return true
            }
            if (!addonsDir.exists()) {
                addonsDir.mkdirs()
            }

            val conn = openRedirectingConnection(KODI_PRESET_URL) ?: return false
            try {
                ZipInputStream(BufferedInputStream(conn.inputStream)).use { zis ->
                    var entry = zis.nextEntry
                    val canonicalBase = addonsDir.canonicalPath
                    while (entry != null) {
                        val outFile = File(addonsDir, entry.name)
                        if (outFile.canonicalPath.startsWith(canonicalBase)) {
                            if (entry.isDirectory) {
                                outFile.mkdirs()
                            } else {
                                outFile.parentFile?.mkdirs()
                                FileOutputStream(outFile).use { fos ->
                                    zis.copyTo(fos)
                                }
                            }
                        }
                        zis.closeEntry()
                        entry = zis.nextEntry
                    }
                }
            } finally {
                conn.disconnect()
            }
            addonPy.exists()
        } catch (e: Exception) {
            false
        }
    }

    private fun ensureCloudStreamKvNetflixPreset(): Boolean {
        return try {
            val presetJson = JSONObject().apply {
                put("datastore", JSONObject().apply {
                    put("_Bool", JSONObject())
                    put("_Int", JSONObject())
                    put("_String", JSONObject().apply {
                        put(
                            "REPOSITORIES_KEY",
                            "[{\"name\": \"KV-Netflix\", \"url\": \"$CLOUDSTREAM_REPO_URL\", \"iconUrl\": \"https://n.khoavo.vndns.net/favicon.svg\"}]"
                        )
                        put(
                            "PLUGINS_KEY",
                            "[{\"internalName\":\"KVNetflixProvider\",\"url\":\"$CLOUDSTREAM_PLUGIN_URL\",\"isOnline\":true,\"version\":1}]"
                        )
                        put("0/home_api_used", "\"KV-Netflix\"")
                    })
                    put("_Float", JSONObject())
                    put("_Long", JSONObject())
                    put("_StringSet", JSONObject())
                })
                put("settings", JSONObject().apply {
                    put("_Bool", JSONObject().apply {
                        put("auto_update", true)
                        put("auto_update_plugins", true)
                        put("auto_rotate_video_key", true)
                    })
                    put("_Int", JSONObject())
                    put("_String", JSONObject().apply {
                        put("filter_sub_lang_key", "vi")
                        put("app_locale", "vi")
                    })
                    put("_Float", JSONObject())
                    put("_Long", JSONObject())
                    put("_StringSet", JSONObject().apply {
                        put("provider_lang_key", JSONArray().put("vi").put("en"))
                    })
                })
            }.toString(2)

            val downloadPreset = File("/sdcard/Download/cloudstream-kv-preset.json")
            if (!downloadPreset.exists() || !downloadPreset.readText().contains(CLOUDSTREAM_REPO_URL)) {
                downloadPreset.parentFile?.mkdirs()
                downloadPreset.writeText(presetJson)
            }

            val csExternalDir = File("/sdcard/Android/data/$PKG_CLOUDSTREAM/files")
            if (csExternalDir.exists() || csExternalDir.mkdirs()) {
                val csPresetFile = File(csExternalDir, "cloudstream-kv-preset.json")
                if (!csPresetFile.exists()) {
                    csPresetFile.writeText(presetJson)
                }
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun normalizeUrl(rawUrl: String): String {
        val trimmed = rawUrl.trim()
        return if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            trimmed
        } else {
            val cleanedPath = if (trimmed.startsWith("/")) trimmed else "/$trimmed"
            "$BASE_URL$cleanedPath"
        }
    }

    private fun isTrustedDownloadUrl(urlStr: String): Boolean {
        return try {
            val normalized = normalizeUrl(urlStr)
            val url = URL(normalized)
            val protocol = url.protocol.lowercase()
            if (protocol != "https" && protocol != "http") {
                return false
            }
            val host = url.host?.lowercase()?.trim() ?: return false
            if (host.isEmpty()) return false
            host in TRUSTED_DOWNLOAD_HOSTS ||
                host.endsWith(".vndns.net") ||
                host.endsWith(".myds.me")
        } catch (_: Exception) {
            false
        }
    }

    private fun resolveBackupUrl(primaryUrl: String, explicitBackupUrl: String? = null): String? {
        if (!explicitBackupUrl.isNullOrBlank()) {
            val normalizedBackup = normalizeUrl(explicitBackupUrl)
            if (isTrustedDownloadUrl(normalizedBackup)) {
                return normalizedBackup
            }
        }
        if (primaryUrl.contains("git.khoavo.myds.me", ignoreCase = true)) {
            return null
        }
        val lower = primaryUrl.lowercase()
        for ((token, backupTarget) in BACKUP_APK_URLS) {
            if (lower.contains(token.lowercase())) {
                return backupTarget
            }
        }
        return null
    }

    private fun isValidApkFile(file: File?): Boolean {
        if (file == null || !file.exists() || !file.isFile || file.length() <= MIN_VALID_APK_BYTES) {
            return false
        }
        return try {
            val header = ByteArray(4)
            val bytesRead = FileInputStream(file).use { fis -> fis.read(header) }
            bytesRead == 4 &&
                header[0] == 0x50.toByte() && // 'P'
                header[1] == 0x4B.toByte() && // 'K'
                header[2] == 0x03.toByte() &&
                header[3] == 0x04.toByte()
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Download from a link-only endpoint (following up to 10 HTTP/HTTPS redirects)
     * into a temporary cache file and trigger Android's native PackageInstaller,
     * with automatic fallback to the Forgejo release mirror if the primary URL fails.
     */
    @JavascriptInterface
    fun installApp(downloadUrl: String, appName: String) {
        if (!isTrustedDownloadUrl(downloadUrl)) {
            showToast("Nguồn tải không hợp lệ hoặc không đáng tin cậy.")
            return
        }
        startApkDownloadAndInstall(downloadUrl, null, appName)
    }

    /**
     * 1-Click Direct Download & Install with explicit primary VPS URL and backup Forgejo URL.
     */
    @JavascriptInterface
    fun installAppWithFallback(downloadUrl: String, backupUrl: String, appName: String) {
        if (!isTrustedDownloadUrl(downloadUrl) && (backupUrl.isBlank() || !isTrustedDownloadUrl(backupUrl))) {
            showToast("Nguồn tải không hợp lệ hoặc không đáng tin cậy.")
            return
        }
        startApkDownloadAndInstall(downloadUrl, backupUrl, appName)
    }

    private fun startApkDownloadAndInstall(
        downloadUrl: String,
        backupUrl: String?,
        appName: String
    ) {
        val fullPrimaryUrl = normalizeUrl(downloadUrl)
        val resolvedBackupUrl = resolveBackupUrl(fullPrimaryUrl, backupUrl)
        if (!isTrustedDownloadUrl(fullPrimaryUrl) &&
            (resolvedBackupUrl.isNullOrBlank() || !isTrustedDownloadUrl(resolvedBackupUrl))
        ) {
            showToast("Nguồn tải không hợp lệ hoặc không đáng tin cậy.")
            return
        }

        cleanTempApks()
        showToast("Đang tải $appName...\nVui lòng đợi giây lát.")

        scope.launch {
            isDownloadingApk = true
            try {
                var apkFile = if (isTrustedDownloadUrl(fullPrimaryUrl)) {
                    downloadApkFile(fullPrimaryUrl, appName)
                } else {
                    null
                }
                if (!isValidApkFile(apkFile) &&
                    !resolvedBackupUrl.isNullOrBlank() &&
                    resolvedBackupUrl != fullPrimaryUrl &&
                    isTrustedDownloadUrl(resolvedBackupUrl)
                ) {
                    showToast("Đang chuyển sang máy chủ dự phòng (Forgejo) cho $appName...")
                    apkFile = downloadApkFile(resolvedBackupUrl, appName)
                }

                isDownloadingApk = false
                if (apkFile != null && isValidApkFile(apkFile)) {
                    if (fullPrimaryUrl.contains("kodi", ignoreCase = true) ||
                        appName.contains("kodi", ignoreCase = true)
                    ) {
                        preConfigureApp(PKG_KODI)
                    } else if (fullPrimaryUrl.contains("cloudstream", ignoreCase = true) ||
                        appName.contains("cloudstream", ignoreCase = true)
                    ) {
                        preConfigureApp(PKG_CLOUDSTREAM)
                    }
                    withContext(Dispatchers.Main) {
                        showToast("Đã tải xong $appName. Đang mở trình cài đặt...")
                        promptApkInstall(apkFile)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        showToast("Lỗi khi tải $appName. Vui lòng thử lại.")
                    }
                }
            } catch (e: Exception) {
                isDownloadingApk = false
                withContext(Dispatchers.Main) {
                    showToast("Lỗi tải ứng dụng: ${e.localizedMessage}")
                }
            }
        }
    }

    /**
     * Launch uninstaller for a given package name.
     */
    @JavascriptInterface
    fun uninstallApp(packageName: String) {
        try {
            val targetPkg = resolveInstalledPackage(packageName)?.packageName ?: packageName
            val intent = Intent(Intent.ACTION_DELETE).apply {
                data = Uri.parse("package:$targetPkg")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            activity.startActivity(intent)
        } catch (e: Exception) {
            showToast("Không thể gỡ cài đặt: ${e.localizedMessage}")
        }
    }

    /**
     * Launch an installed app via Leanback or standard launcher intent.
     * Automatically runs preConfigureApp for CloudStream 3 and Kodi 21 Omega before launching.
     */
    @JavascriptInterface
    fun launchApp(packageName: String): Boolean {
        return try {
            val targetPkg = resolveInstalledPackage(packageName)?.packageName ?: packageName
            if (targetPkg == PKG_KODI || targetPkg == PKG_CLOUDSTREAM) {
                preConfigureApp(targetPkg)
            }
            val pm = context.packageManager
            val intent = pm.getLeanbackLaunchIntentForPackage(targetPkg)
                ?: pm.getLaunchIntentForPackage(targetPkg)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                activity.startActivity(intent)
                true
            } else {
                showToast("Không thể khởi chạy ứng dụng $targetPkg")
                false
            }
        } catch (e: Exception) {
            showToast("Lỗi khởi chạy: ${e.localizedMessage}")
            false
        }
    }

    /**
     * Returns current KV-Store app version info as JSON string.
     */
    @JavascriptInterface
    fun getStoreAppVersion(): String {
        val json = JSONObject()
        try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            val vCode = PackageInfoCompat.getLongVersionCode(pInfo)
            json.put("packageName", context.packageName)
            json.put("versionName", pInfo.versionName ?: "1.0.0")
            json.put("versionCode", vCode)
            json.put("appName", "KV-Store TV")
        } catch (e: Exception) {
            json.put("packageName", "net.vndns.tv.store")
            json.put("versionName", "1.0.0")
            json.put("versionCode", 1)
        }
        return json.toString()
    }

    /**
     * Returns true indicating this is a native Android TV environment.
     */
    @JavascriptInterface
    fun isTV(): Boolean {
        return true
    }

    @JavascriptInterface
    fun showToast(message: String) {
        mainHandler.post {
            Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        }
    }

    /**
     * Follow up to 10 HTTP/HTTPS redirects on trusted download hosts
     * and return the connected HttpURLConnection with HTTP 200.
     */
    private fun openRedirectingConnection(urlStr: String): HttpURLConnection? {
        var currentUrl = normalizeUrl(urlStr)
        var redirectCount = 0

        while (redirectCount < MAX_REDIRECTS) {
            if (!isTrustedDownloadUrl(currentUrl)) {
                return null
            }
            val url = URL(currentUrl)
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 30000
                readTimeout = 60000
                instanceFollowRedirects = false
                setRequestProperty("User-Agent", "KVTVStore-Installer/1.0.0 (Android TV)")
                setRequestProperty("Accept", "*/*")
            }
            conn.connect()

            val code = conn.responseCode
            if (code == HttpURLConnection.HTTP_MOVED_PERM ||
                code == HttpURLConnection.HTTP_MOVED_TEMP ||
                code == HttpURLConnection.HTTP_SEE_OTHER ||
                code == 307 ||
                code == 308
            ) {
                val loc = conn.getHeaderField("Location")
                conn.disconnect()
                if (loc.isNullOrBlank()) return null
                currentUrl = if (loc.startsWith("http://") || loc.startsWith("https://")) {
                    loc
                } else {
                    URL(url, loc).toString()
                }
                if (!isTrustedDownloadUrl(currentUrl)) {
                    return null
                }
                redirectCount++
                continue
            }

            if (code != HttpURLConnection.HTTP_OK) {
                conn.disconnect()
                return null
            }

            return conn
        }
        return null
    }

    /**
     * Download APK to a temporary cache file in context.cacheDir with up to 10 redirects,
     * verify ZIP magic header bytes, and verify optional X-KVTV-SHA256 cryptographic digest.
     */
    private fun downloadApkFile(urlStr: String, appName: String): File? {
        if (!isTrustedDownloadUrl(urlStr)) {
            return null
        }
        val conn = try {
            openRedirectingConnection(urlStr)
        } catch (_: Exception) {
            null
        } ?: return null

        return try {
            val expectedSha256 = conn.getHeaderField("X-KVTV-SHA256")?.trim()?.lowercase()
            val digest = MessageDigest.getInstance("SHA-256")

            val stagingDir = File(context.cacheDir, "apk_staging")
            if (!stagingDir.exists()) stagingDir.mkdirs()

            val safeName = appName.replace("[^a-zA-Z0-9.-]".toRegex(), "_")
            val targetFile = File(stagingDir, "temp_${safeName}.apk")
            if (targetFile.exists()) targetFile.delete()

            conn.inputStream.use { input ->
                FileOutputStream(targetFile).use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead = input.read(buffer)
                    while (bytesRead != -1) {
                        if (bytesRead > 0) {
                            digest.update(buffer, 0, bytesRead)
                            output.write(buffer, 0, bytesRead)
                        }
                        bytesRead = input.read(buffer)
                    }
                    output.flush()
                }
            }

            val computedSha256 = digest.digest().joinToString("") { "%02x".format(it) }
            val sha256Matches = if (expectedSha256 != null && expectedSha256.length == 64) {
                computedSha256 == expectedSha256
            } else {
                true
            }

            if (!isValidApkFile(targetFile) || !sha256Matches) {
                targetFile.delete()
                null
            } else {
                targetFile
            }
        } catch (_: Exception) {
            null
        } finally {
            conn.disconnect()
        }
    }

    /**
     * Open Android's PackageInstaller via FileProvider.
     */
    private fun promptApkInstall(apkFile: File) {
        try {
            val authority = "${context.packageName}.fileprovider"
            val apkUri = FileProvider.getUriForFile(context, authority, apkFile)

            @Suppress("DEPRECATION")
            val installIntent = Intent(Intent.ACTION_INSTALL_PACKAGE).apply {
                data = apkUri
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true)
                putExtra(Intent.EXTRA_RETURN_RESULT, false)
            }
            try {
                activity.startActivity(installIntent)
            } catch (fallbackEx: Exception) {
                val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(apkUri, "application/vnd.android.package-archive")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                }
                activity.startActivity(viewIntent)
            }
        } catch (e: Exception) {
            showToast("Lỗi mở trình cài đặt: ${e.localizedMessage}")
        }
    }
}
