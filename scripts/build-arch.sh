#!/usr/bin/env bash

set -e

echo "📦 Building Arch package"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCH_DIR="$PROJECT_ROOT/src-tauri/packaging/arch"

if [ ! -f "$PROJECT_ROOT/src-tauri/target/release/app" ]; then
    echo "❌ Application binary not found. Run build-tauri.sh first"
    exit 1
fi

echo "🔄 Syncing current build output into packaging/arch (this was the"
echo "   source of a real bug: the Arch package silently reused stale,"
echo "   manually-copied server/node_modules/binaries instead of the"
echo "   just-built ones)"

cp "$PROJECT_ROOT/src-tauri/target/release/app" "$ARCH_DIR/wood-booster-hq"

TARGET_TRIPLE="$(rustc --print host-tuple)"
cp "$PROJECT_ROOT/src-tauri/binaries/wood-booster-server-$TARGET_TRIPLE" \
    "$ARCH_DIR/wood-booster-server"
cp "$PROJECT_ROOT/src-tauri/binaries/wood-booster-python-$TARGET_TRIPLE" \
    "$ARCH_DIR/wood-booster-python"

rm -rf "$ARCH_DIR/server" "$ARCH_DIR/pybackend"
cp -r "$PROJECT_ROOT/src-tauri/resources/server" "$ARCH_DIR/server"
cp -r "$PROJECT_ROOT/src-tauri/resources/pybackend" "$ARCH_DIR/pybackend"

# The .desktop file's Icon=wood-booster-hq only resolves if an icon by
# that name actually gets installed - PKGBUILD's package() never did
# this, so the app showed up with no logo anywhere. The icon filename
# and the .desktop Icon= key must always be renamed together, or this
# exact bug (blank app-menu icon) comes back.
cp "$PROJECT_ROOT/src-tauri/icons/32x32.png" "$ARCH_DIR/icon-32.png"
cp "$PROJECT_ROOT/src-tauri/icons/128x128.png" "$ARCH_DIR/icon-128.png"
cp "$PROJECT_ROOT/src-tauri/icons/128x128@2x.png" "$ARCH_DIR/icon-256.png"
cp "$PROJECT_ROOT/src-tauri/icons/icon.png" "$ARCH_DIR/icon-512.png"

cd "$ARCH_DIR"

rm -rf pkg src

makepkg -f

echo "✅ Arch package ready"
