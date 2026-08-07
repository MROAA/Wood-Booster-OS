#!/usr/bin/env bash

set -e

echo "📦 Building AppImage package"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

npm run tauri build -- --bundles appimage

echo "✅ AppImage package ready"

ls -lh "$PROJECT_ROOT/src-tauri/target/release/bundle/appimage"
