#!/usr/bin/env bash
# ==============================================================================
# launch-kv-netflix-emulator.sh
# Automated One-Click Launcher for KV-Netflix (StreamFlow TV) on Android TV Emulator
# ==============================================================================

set -e

# Setup PATH for Android tools if not already present
export PATH="$HOME/.local/bin:$HOME/Android/Sdk/emulator:$HOME/Android/Sdk/platform-tools:/mnt/temp1/Android/Sdk/emulator:/mnt/temp1/Android/Sdk/platform-tools:$PATH"

AVD_NAME="${AVD_NAME:-Television_1080p}"
PACKAGE_NAME="com.streamflow.tv"
ACTIVITY_NAME=".MainActivity"
APK_PATH="/mnt/data/Projects/kv-tv/uploads/kv-netflix-tv.apk"
KODI_PACKAGE="org.xbmc.kodi"
KODI_ADDON_ID="plugin.video.kvnetflix"
HUB_URL="http://localhost:35727"

echo "========================================================"
echo "  🎬 KV-TV: KV-Netflix (Android TV & Kodi) Launcher"
echo "========================================================"

# 1. Check ADB
if ! command -v adb >/dev/null 2>&1; then
    echo "❌ Error: 'adb' command not found in PATH."
    exit 1
fi

# 2. Check if emulator is running
echo "🔍 Checking Android TV emulator status..."
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

# 3. Check if standalone KV-Netflix (com.streamflow.tv) is installed
echo "📦 Verifying KV-Netflix Android TV app installation..."
if adb shell pm list packages | grep -q "$PACKAGE_NAME"; then
    echo "✅ KV-Netflix standalone app is installed ($PACKAGE_NAME)."
else
    if [ -f "$APK_PATH" ]; then
        echo "⬇️ Installing KV-Netflix APK from: $APK_PATH"
        adb install -r "$APK_PATH"
        echo "✅ Installed successfully!"
    else
        echo "❌ KV-Netflix APK not found at $APK_PATH. Please verify file path."
        exit 1
    fi
fi

# 4. Check if Kodi Addon plugin.video.kvnetflix is installed
echo "🔍 Checking Kodi KV-Netflix addon installation..."
if adb shell "[ -d /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/$KODI_ADDON_ID ]" 2>/dev/null; then
    echo "✅ Kodi Addon ($KODI_ADDON_ID) is pre-installed in Kodi."
else
    echo "ℹ️ Kodi Addon not found in .kodi/addons. Installing..."
    ZIP_PATH="/mnt/data/Projects/kv-tv/uploads/plugin.video.kvnetflix.zip"
    if [ -f "$ZIP_PATH" ]; then
        adb push "$ZIP_PATH" /data/local/tmp/ >/dev/null 2>&1
        adb shell "mkdir -p /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/ && cd /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/ && unzip -o -q /data/local/tmp/plugin.video.kvnetflix.zip && chmod -R 775 $KODI_ADDON_ID" 2>/dev/null || true
        echo "✅ Kodi Addon installed to /sdcard/Android/data/org.xbmc.kodi/files/.kodi/addons/$KODI_ADDON_ID"
    fi
fi

# 5. Bring Standalone KV-Netflix into Foreground
echo "▶️ Launching KV-Netflix into foreground..."
adb shell am start -n "$PACKAGE_NAME/$ACTIVITY_NAME" --activity-brought-to-front >/dev/null 2>&1 || \
adb shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1

sleep 2

CURRENT_APP=$(adb shell dumpsys window | grep -E "mCurrentFocus" | tr -d '\r')
echo "🎯 Foreground Window: $CURRENT_APP"

# 6. Remote & Navigation Cheat Sheet
echo ""
echo "========================================================"
echo "  🎮 REMOTE CONTROL & INTERACTION GUIDE"
echo "========================================================"
echo "Mode 1: Native Standalone KV-Netflix TV App"
echo "  - Foreground: $PACKAGE_NAME"
echo "  - Use Keyboard Arrow Keys (Up, Down, Left, Right)"
echo "  - Enter: Select / Open Title / Play Movie"
echo "  - Esc / Backspace: Return / Back"
echo "  - Left key from movie cards: Expand Sidebar Menu"
echo ""
echo "Mode 2: Kodi 21 Omega (KV-Netflix Addon)"
echo "  - Switch to Kodi:   adb shell am start -n org.xbmc.kodi/.Splash"
echo "  - Launch Addon direct: python3 -c \"import socket, json; s = socket.socket(); s.connect(('127.0.0.1', 9090)); s.sendall(json.dumps({'jsonrpc':'2.0','method':'GUI.ActivateWindow','params':{'window':'videos','parameters':['plugin://plugin.video.kvnetflix/']},'id':1}).encode()); s.close()\""
echo ""
echo "Remote ADB Control Commands:"
echo "  - D-Pad UP:      adb shell input keyevent 19"
echo "  - D-Pad DOWN:    adb shell input keyevent 20"
echo "  - D-Pad LEFT:    adb shell input keyevent 21"
echo "  - D-Pad RIGHT:   adb shell input keyevent 22"
echo "  - Select / OK:   adb shell input keyevent 23 (or 66)"
echo "  - Back:          adb shell input keyevent 4"
echo "  - Home:          adb shell input keyevent 3"
echo "  - Play / Pause:  adb shell input keyevent 85"
echo ""
echo "Android Device Hub (Web Mirror):"
echo "  - Web UI: $HUB_URL"
echo "========================================================"
echo "🎉 KV-Netflix is running and ready for movie playback!"
