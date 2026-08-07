#!/usr/bin/env bash

set -e

echo "🚀 Wood-Booster OS release builder"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"


echo ""
echo "1/4 Building Tauri packages"

npm run tauri build


echo ""
echo "2/4 Fixing Linux desktop metadata"

# bundle.linux.deb/rpm.desktopTemplate in tauri.conf.json does NOT
# actually get applied by this Tauri CLI version (2.11.4) - confirmed
# by extracting a built .deb and .rpm and finding Tauri's raw default
# (Exec=app, Icon=app, Comment=A Tauri App) despite the config being
# set correctly per the schema. sed-patching the generated files after
# the fact is the only thing that's actually been shown to work.
DEB_DESKTOP=$(find src-tauri/target/release/bundle/deb -name "*.desktop" | head -1)

RPM_DESKTOP=$(find src-tauri/target/release/bundle/rpm -name "*.desktop" | head -1)

APPIMAGE_DESKTOP=$(find src-tauri/target/release/bundle/appimage -name "*.desktop" | head -1)


fix_desktop() {

FILE="$1"

if [ -f "$FILE" ]; then

echo "Fixing $FILE"

sed -i \
-e 's/Exec=app/Exec=wood-booster-os/' \
-e 's/Icon=app/Icon=wood-booster-os/' \
-e 's/StartupWMClass=app/StartupWMClass=wood-booster-os/' \
-e 's/Comment=A Tauri App/Comment=Wood-Booster OS desktop application/' \
-e 's/Categories=$/Categories=Office;Finance;/' \
"$FILE"

fi

}


fix_desktop "$DEB_DESKTOP"
fix_desktop "$RPM_DESKTOP"
fix_desktop "$APPIMAGE_DESKTOP"



echo ""
echo "3/4 Building Arch package"

./scripts/build-arch.sh



echo ""
echo "4/4 Collecting release packages"

./scripts/package-all.sh



echo ""
echo "🎉 Wood-Booster OS release ready"

ls -lh release