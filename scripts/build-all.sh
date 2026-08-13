#!/usr/bin/env bash

set -e

echo "🪵 Wood-Booster OS release builder"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "1/4 Building AppImage"
"$SCRIPT_DIR/build-appimage.sh"

echo ""
echo "2/4 Building Debian package"
"$SCRIPT_DIR/build-deb.sh"

echo ""
echo "3/4 Building RPM package"
"$SCRIPT_DIR/build-rpm.sh"

echo ""
echo "4/4 Building Arch package"
"$SCRIPT_DIR/build-arch.sh"

echo ""
echo "================================"
echo "✅ Wood-Booster OS build complete"
echo "================================"

echo ""
echo "Generated packages:"
find "$(dirname "$SCRIPT_DIR")/src-tauri/target/release/bundle" \
-type f \
\( -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \)

find "$(dirname "$SCRIPT_DIR")/src-tauri/packaging/arch" \
-type f \
-name "*.pkg.tar.zst"
