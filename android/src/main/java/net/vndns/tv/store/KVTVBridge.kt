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
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
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
    }

    /**
     * Check installation status of a single package.
     * Returns "NOT_INSTALLED", "UPDATE", or "INSTALLED".
     */
    @JavascriptInterface
    fun checkApp(packageName: String, storeVersionCode: Long): String {
        return try {
            val pm = context.packageManager
            val pInfo = pm.getPackageInfo(packageName, 0)
            val installedCode = PackageInfoCompat.getLongVersionCode(pInfo)
            if (storeVersionCode > 0 && installedCode < storeVersionCode) {
                STATUS_UPDATE
            } else {
                STATUS_INSTALLED
            }
        } catch (e: PackageManager.NameNotFoundException) {
            STATUS_NOT_INSTALLED
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
            val pm = context.packageManager
            for (i in 0 until arr.length()) {
                val item = arr.optJSONObject(i)
                val pkgName = item?.optString("packageName")
                    ?: arr.optString(i, "")
                if (pkgName.isNullOrBlank()) continue

                val storeCode = item?.optLong("versionCode", 0L) ?: 0L

                val status = try {
                    val pInfo = pm.getPackageInfo(pkgName, 0)
                    val installedCode = PackageInfoCompat.getLongVersionCode(pInfo)
                    if (storeCode > 0 && installedCode < storeCode) {
                        STATUS_UPDATE
                    } else {
                        STATUS_INSTALLED
                    }
                } catch (e: PackageManager.NameNotFoundException) {
                    STATUS_NOT_INSTALLED
                } catch (e: Exception) {
                    STATUS_NOT_INSTALLED
                }
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

    /**
     * Download from a link-only endpoint (following up to 10 HTTP/HTTPS redirects)
     * into a temporary cache file and trigger Android's native PackageInstaller.
     */
    @JavascriptInterface
    fun installApp(downloadUrl: String, appName: String) {
        val fullUrl = if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
            downloadUrl
        } else {
            val cleanedPath = if (downloadUrl.startsWith("/")) downloadUrl else "/$downloadUrl"
            "$BASE_URL$cleanedPath"
        }

        cleanTempApks()
        showToast("Đang tải $appName...\nVui lòng đợi giây lát.")

        scope.launch {
            isDownloadingApk = true
            try {
                val apkFile = downloadApkFile(fullUrl, appName)
                isDownloadingApk = false
                if (apkFile != null && apkFile.exists() && apkFile.length() > 0) {
                    if (fullUrl.contains("kodi", ignoreCase = true)) {
                        preConfigureApp(PKG_KODI)
                    } else if (fullUrl.contains("cloudstream", ignoreCase = true)) {
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
            val intent = Intent(Intent.ACTION_DELETE).apply {
                data = Uri.parse("package:$packageName")
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
            if (packageName == PKG_KODI || packageName == PKG_CLOUDSTREAM) {
                preConfigureApp(packageName)
            }
            val pm = context.packageManager
            val intent = pm.getLeanbackLaunchIntentForPackage(packageName)
                ?: pm.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                activity.startActivity(intent)
                true
            } else {
                showToast("Không thể khởi chạy ứng dụng $packageName")
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
     * Follow up to 10 HTTP/HTTPS redirects (e.g. /api/download/smarttube-tv -> github.com -> objects.githubusercontent.com)
     * and return the connected HttpURLConnection with HTTP 200.
     */
    private fun openRedirectingConnection(urlStr: String): HttpURLConnection? {
        var currentUrl = urlStr
        var redirectCount = 0

        while (redirectCount < MAX_REDIRECTS) {
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
     * Download APK to a temporary cache file in context.cacheDir with up to 10 redirects.
     */
    private fun downloadApkFile(urlStr: String, appName: String): File? {
        val conn = openRedirectingConnection(urlStr) ?: return null
        return try {
            val stagingDir = File(context.cacheDir, "apk_staging")
            if (!stagingDir.exists()) stagingDir.mkdirs()

            val safeName = appName.replace("[^a-zA-Z0-9.-]".toRegex(), "_")
            val targetFile = File(stagingDir, "temp_${safeName}.apk")
            if (targetFile.exists()) targetFile.delete()

            conn.inputStream.use { input ->
                FileOutputStream(targetFile).use { output ->
                    input.copyTo(output)
                }
            }
            targetFile
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
