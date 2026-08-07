#!/usr/bin/env bash

set -e

echo "🚀 Wood-Booster OS release builder"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RELEASE_DIR="$PROJECT_ROOT/release"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

echo ""
echo "1/3 Building packages"

"$PROJECT_ROOT/scripts/build-all.sh"

echo ""
echo "2/3 Collecting packages"

cp "$PROJECT_ROOT/src-tauri/target/release/bundle/appimage/"*.AppImage \
"$RELEASE_DIR/"

cp "$PROJECT_ROOT/src-tauri/target/release/bundle/deb/"*.deb \
"$RELEASE_DIR/"

cp "$PROJECT_ROOT/src-tauri/target/release/bundle/rpm/"*.rpm \
"$RELEASE_DIR/"

cp "$PROJECT_ROOT/src-tauri/packaging/arch/"*.pkg.tar.zst \
"$RELEASE_DIR/"

echo ""
echo "3/3 Creating checksums"

cd "$RELEASE_DIR"

sha256sum * > SHA256SUMS

echo ""
echo "✅ Release ready"

ls -lh "$RELEASE_DIR"
