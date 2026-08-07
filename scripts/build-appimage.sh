#!/usr/bin/env bash

set -e

echo "📦 Building AppImage package"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

APP="$PROJECT_ROOT/src-tauri/target/release/app"

if [ ! -f "$APP" ]; then
    echo "❌ Application binary not found:"
    echo "$APP"
    echo "Run build-tauri.sh first"
    exit 1
fi

echo "⚙️ AppImage requires Tauri bundling"

cd "$PROJECT_ROOT"

npm run tauri build -- --bundles appimage

echo "✅ AppImage package ready"

ls -lh "$PROJECT_ROOT/src-tauri/target/release/bundle/appimage"