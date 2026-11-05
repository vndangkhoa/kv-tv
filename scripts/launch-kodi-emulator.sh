#!/usr/bin/env bash
# ==============================================================================
# launch-kodi-emulator.sh
# Automated One-Click Launcher for Kodi 21 Omega on Android TV Emulator
# ==============================================================================

set -e

# Setup PATH for Android tools if not already present
export PATH="$HOME/.local/bin:$HOME/Android/Sdk/emulator:$HOME/Android/Sdk/platform-tools:/mnt/temp1/Android/Sdk/emulator:/mnt/temp1/Android/Sdk/platform-tools:$PATH"

AVD_NAME="${AVD_NAME:-Television_1080p}"
PACKAGE_NAME="org.xbmc.kodi"
ACTIVITY_NAME=".Splash"
FALLBACK_ACTIVITY=".Main"
APK_PATH="/mnt/data/Projects/kv-tv/uploads/kodi-21-omega.apk"
HUB_URL="http://localhost:35727"

echo "========================================================"
echo "  🎬 KV-TV: Kodi 21 Omega Emulator Launcher"
echo "========================================================"

# 1. Check ADB
if ! command -v adb >/dev/null 2>&1; then
    echo "❌ Error: 'adb' command not found in PATH."
    exit 1
fi

# 2. Check if emulator is running
echo "🔍 Checking emulator status..."
DEVICE_ID=$(adb devices | grep "emulator-" | head -n 1 | awk '{print $1}')

if [ -n "$DEVICE_ID" ]; then
    echo "✅ Emulator is already running: $DEVICE_ID"
else
    echo "🚀 Starting Android TV Emulator ($AVD_NAME)..."
    if ! command -v emulator >/dev/null 2>&1; then
        echo "❌ Error: 'emulator' command not found in PATH."
        exit 1
    fi

    # Launch emulator in background with hardware acceleration
    nohup emulator -avd "$AVD_NAME" -gpu host -accel on > /tmp/emulator.log 2>&1 &
    EMU_PID=$!
    echo "   Spawned emulator PID: $EMU_PID. Waiting for connection..."

    # Wait for adb device to appear
    adb wait-for-device

    # Wait for system boot completion
    echo "⏳ Waiting for Android TV to complete boot..."
    BOOT_COMPLETED=""
    RETRY_COUNT=0
    MAX_RETRIES=60

    while [ "$BOOT_COMPLETED" != "1" ]; do
        sleep 2
        BOOT_COMPLETED=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
            echo "⚠️ Timeout waiting for boot completion. Continuing anyway..."
            break
        fi
    done
    echo "✅ Android TV system booted successfully!"
fi

# Ensure device is awake and keyguard is dismissed
adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
adb shell wm dismiss-keyguard >/dev/null 2>&1 || true

# 3. Check if Kodi is installed
echo "📦 Verifying Kodi installation..."
if adb shell pm list packages | grep -q "$PACKAGE_NAME"; then
    echo "✅ Kodi is installed."
else
    if [ -f "$APK_PATH" ]; then
        echo "⬇️ Installing Kodi APK from: $APK_PATH"
        adb install -r "$APK_PATH"
        echo "✅ Installed successfully!"
    else
        echo "❌ Kodi APK not found at $APK_PATH. Please verify file path."
        exit 1
    fi
fi

# Grant necessary permissions for Scoped Storage and media access
echo "🔑 Verifying storage and media permissions..."
adb shell appops set "$PACKAGE_NAME" MANAGE_EXTERNAL_STORAGE allow >/dev/null 2>&1 || true
adb shell pm grant "$PACKAGE_NAME" android.permission.READ_EXTERNAL_STORAGE >/dev/null 2>&1 || true
adb shell pm grant "$PACKAGE_NAME" android.permission.WRITE_EXTERNAL_STORAGE >/dev/null 2>&1 || true
adb shell pm grant "$PACKAGE_NAME" android.permission.RECORD_AUDIO >/dev/null 2>&1 || true

# Ensure KV-Netflix Addon is installed
if [ -f "/mnt/data/Projects/kv-tv/uploads/plugin.video.kvnetflix.zip" ]; then
    if ! adb shell "[ -d /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/plugin.video.kvnetflix ]" 2>/dev/null; then
        echo "📦 Installing KV-Netflix Kodi Addon..."
        adb push /mnt/data/Projects/kv-tv/uploads/plugin.video.kvnetflix.zip /data/local/tmp/ >/dev/null 2>&1
        adb shell "mkdir -p /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/ && cd /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/ && unzip -o -q /data/local/tmp/plugin.video.kvnetflix.zip && chmod -R 775 plugin.video.kvnetflix" 2>/dev/null || true
    fi
fi

# 4. Bring Kodi to Foreground
echo "▶️ Launching Kodi into foreground..."
adb shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || \
adb shell am start -n "$PACKAGE_NAME/$ACTIVITY_NAME" >/dev/null 2>&1 || \
adb shell am start -n "$PACKAGE_NAME/$FALLBACK_ACTIVITY" >/dev/null 2>&1

sleep 3

# Forward Kodi JSON-RPC TCP socket to localhost:9090
adb forward tcp:9090 tcp:9090 >/dev/null 2>&1 || true

CURRENT_APP=$(adb shell dumpsys window | grep -E "mCurrentFocus" | tr -d '\r')
echo "🎯 Foreground Window: $CURRENT_APP"

# 5. Remote & Navigation Cheat Sheet
echo ""
echo "========================================================"
echo "  🎮 REMOTE CONTROL & INTERACTION GUIDE"
echo "========================================================"
echo "Option A: Native Desktop Emulator Window"
echo "  - Arrow Keys (Up, Down, Left, Right): Navigate menus"
echo "  - Enter / Return: Select / Activate item"
echo "  - Esc / Backspace: Back / Previous menu"
echo "  - C key / Context Menu: Bring up item options / Context Menu"
echo "  - I key / Info: Show media details & metadata"
echo "  - Spacebar: Play / Pause toggle"
echo "  - X key: Stop playback"
echo "  - Tab: Fullscreen toggle for video playback"
echo ""
echo "Option B: Web Mirror / Android Device Hub"
echo "  - Web UI: $HUB_URL"
echo "  - Mouse click or touch to navigate"
echo ""
echo "Option C: ADB Shell Remote Commands"
echo "  - D-Pad UP:      adb shell input keyevent 19"
echo "  - D-Pad DOWN:    adb shell input keyevent 20"
echo "  - D-Pad LEFT:    adb shell input keyevent 21"
echo "  - D-Pad RIGHT:   adb shell input keyevent 22"
echo "  - Select/OK:     adb shell input keyevent 23 (or 66)"
echo "  - Back:          adb shell input keyevent 4"
echo "  - Menu/Context:  adb shell input keyevent 82"
echo "  - Info:          adb shell input keyevent 165"
echo "  - Home:          adb shell input keyevent 3"
echo "  - Play/Pause:    adb shell input keyevent 85"
echo "  - Volume UP:     adb shell input keyevent 24"
echo "  - Volume DOWN:   adb shell input keyevent 25"
echo "========================================================"
echo "🎉 Kodi 21 Omega is ready on the emulator!"
