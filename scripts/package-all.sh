#!/usr/bin/env bash

set -e

echo "📦 Collecting Wood-Booster HQ packages"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RELEASE_DIR="$PROJECT_ROOT/release"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

echo "📦 Copying AppImage"

cp "$PROJECT_ROOT/src-tauri/target/release/bundle/appimage/"*.AppImage \
"$RELEASE_DIR/" 2>/dev/null || true


echo "📦 Copying Debian package"

cp "$PROJECT_ROOT/src-tauri/target/release/bundle/deb/"*.deb \
"$RELEASE_DIR/" 2>/dev/null || true


echo "📦 Copying RPM package"

cp "$PROJECT_ROOT/src-tauri/target/release/bundle/rpm/"*.rpm \
"$RELEASE_DIR/" 2>/dev/null || true


echo "📦 Copying latest Arch package"

ARCH_PACKAGE=$(ls -t "$PROJECT_ROOT/src-tauri/packaging/arch/"*.pkg.tar.zst 2>/dev/null | head -1 || true)

if [ -n "$ARCH_PACKAGE" ]; then
    cp "$ARCH_PACKAGE" "$RELEASE_DIR/"
fi


echo "🔐 Creating checksums"

cd "$RELEASE_DIR"

sha256sum * > SHA256SUMS


echo ""
echo "✅ Packages collected"
echo ""

ls -lh
