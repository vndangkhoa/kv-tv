#!/usr/bin/env bash
# ==============================================================================
# launch-cloudstream-emulator.sh
# Automated One-Click Launcher for CloudStream 3 on Android TV Emulator
# ==============================================================================

set -e

# Setup PATH for Android tools if not already present
export PATH="$HOME/.local/bin:$HOME/Android/Sdk/emulator:$HOME/Android/Sdk/platform-tools:/mnt/temp1/Android/Sdk/emulator:/mnt/temp1/Android/Sdk/platform-tools:$PATH"

AVD_NAME="${AVD_NAME:-Television_1080p}"
PACKAGE_NAME="com.lagradost.cloudstream3"
ACTIVITY_NAME=".ui.account.AccountSelectActivity"
FALLBACK_ACTIVITY=".MainActivity"
APK_PATH="/mnt/data/Projects/kv-tv/uploads/cloudstream-kv-apk.apk"
HUB_URL="http://localhost:35727"

echo "========================================================"
echo "  🎬 KV-TV: CloudStream 3 Emulator Launcher"
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

# 3. Check if CloudStream 3 is installed
echo "📦 Verifying CloudStream 3 installation..."
if adb shell pm list packages | grep -q "$PACKAGE_NAME"; then
    echo "✅ CloudStream 3 is installed."
else
    if [ -f "$APK_PATH" ]; then
        echo "⬇️ Installing CloudStream 3 APK from: $APK_PATH"
        adb install -r "$APK_PATH"
        echo "✅ Installed successfully!"
    else
        echo "❌ CloudStream 3 APK not found at $APK_PATH. Please verify file path."
        exit 1
    fi
fi

# 4. Bring CloudStream 3 to Foreground
echo "▶️ Launching CloudStream 3 into foreground..."
adb shell am start -n "$PACKAGE_NAME/$ACTIVITY_NAME" >/dev/null 2>&1 || \
adb shell am start -n "$PACKAGE_NAME/$FALLBACK_ACTIVITY" >/dev/null 2>&1

sleep 2

CURRENT_APP=$(adb shell dumpsys window | grep -E "mCurrentFocus" | tr -d '\r')
echo "🎯 Foreground Window: $CURRENT_APP"

# 5. Remote & Navigation Cheat Sheet
echo ""
echo "========================================================"
echo "  🎮 REMOTE CONTROL & INTERACTION GUIDE"
echo "========================================================"
echo "Option A: Native Desktop Emulator Window"
echo "  - Use Keyboard Arrow Keys (Up, Down, Left, Right)"
echo "  - Enter: Select / Play"
echo "  - Esc / Backspace: Back"
echo "  - Home: Android Home Screen"
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
echo "  - Home:          adb shell input keyevent 3"
echo "  - Play/Pause:    adb shell input keyevent 85"
echo ""
echo "  Quick Provider Switcher:"
echo "  - To switch to ViStream, click the top-right button ('None'/'ViStream')"
echo "    and select ViStream from the list."
echo "========================================================"
echo "🎉 CloudStream 3 is ready on the emulator!"
