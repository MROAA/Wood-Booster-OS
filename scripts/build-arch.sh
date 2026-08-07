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

cp "$PROJECT_ROOT/src-tauri/target/release/app" "$ARCH_DIR/wood-booster-os"

TARGET_TRIPLE="$(rustc --print host-tuple)"
cp "$PROJECT_ROOT/src-tauri/binaries/wood-booster-server-$TARGET_TRIPLE" \
    "$ARCH_DIR/wood-booster-server"

rm -rf "$ARCH_DIR/server" "$ARCH_DIR/services"
cp -r "$PROJECT_ROOT/src-tauri/resources/server" "$ARCH_DIR/server"
cp -r "$PROJECT_ROOT/src-tauri/resources/services" "$ARCH_DIR/services"

cd "$ARCH_DIR"

rm -rf pkg src

makepkg -f

echo "✅ Arch package ready"
