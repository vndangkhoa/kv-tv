package net.vndns.tv.store

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
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
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class KVTVBridge(
    private val activity: Activity,
    private val webView: WebView
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(Dispatchers.IO)
    private val context: Context get() = activity.applicationContext

    companion object {
        const val STATUS_NOT_INSTALLED = "NOT_INSTALLED"
        const val STATUS_UPDATE = "UPDATE"
        const val STATUS_INSTALLED = "INSTALLED"
        const val BASE_URL = "https://tv.vndns.net"
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
     * Returns JSON map: {"org.jellyfin.androidtv.kv": "INSTALLED", ...}
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
     * Download and trigger native PackageInstaller for an APK.
     */
    @JavascriptInterface
    fun installApp(downloadUrl: String, appName: String) {
        val fullUrl = if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
            downloadUrl
        } else {
            val cleanedPath = if (downloadUrl.startsWith("/")) downloadUrl else "/$downloadUrl"
            "$BASE_URL$cleanedPath"
        }

        showToast("Đang tải $appName...\nVui lòng đợi giây lát.")

        scope.launch {
            try {
                val apkFile = downloadApkFile(fullUrl, appName)
                if (apkFile != null && apkFile.exists() && apkFile.length() > 0) {
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
     */
    @JavascriptInterface
    fun launchApp(packageName: String): Boolean {
        return try {
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
     * Download APK to app's external files or cache directory with redirect following.
     */
    private fun downloadApkFile(urlStr: String, appName: String): File? {
        var currentUrl = urlStr
        var redirectCount = 0
        val maxRedirects = 5

        while (redirectCount < maxRedirects) {
            val url = URL(currentUrl)
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 30000
            conn.readTimeout = 60000
            conn.instanceFollowRedirects = false
            conn.setRequestProperty("User-Agent", "KVTVStore-Installer/1.0.0 (Android TV)")
            conn.connect()

            val code = conn.responseCode
            if (code == HttpURLConnection.HTTP_MOVED_PERM || code == HttpURLConnection.HTTP_MOVED_TEMP || code == 307 || code == 308) {
                val loc = conn.getHeaderField("Location") ?: return null
                currentUrl = if (loc.startsWith("http://") || loc.startsWith("https://")) loc else URL(url, loc).toString()
                redirectCount++
                conn.disconnect()
                continue
            }

            if (code != HttpURLConnection.HTTP_OK) {
                conn.disconnect()
                return null
            }

            val storageDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: context.cacheDir
            if (!storageDir.exists()) storageDir.mkdirs()

            val safeName = appName.replace("[^a-zA-Z0-9.-]".toRegex(), "_")
            val targetFile = File(storageDir, "$safeName.apk")
            if (targetFile.exists()) targetFile.delete()

            conn.inputStream.use { input ->
                FileOutputStream(targetFile).use { output ->
                    input.copyTo(output)
                }
            }
            conn.disconnect()
            return targetFile
        }
        return null
    }

    /**
     * Open Android package installer via FileProvider.
     */
    private fun promptApkInstall(apkFile: File) {
        try {
            val authority = "${context.packageName}.fileprovider"
            val apkUri = FileProvider.getUriForFile(context, authority, apkFile)

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            }
            activity.startActivity(installIntent)
        } catch (e: Exception) {
            showToast("Lỗi mở trình cài đặt: ${e.localizedMessage}")
        }
    }
}
