#!/bin/bash
set -e

APP_NAME="Wood-Booster-OS"
ARCH="x86_64"
APPDIR="AppDir"

echo "🧹 Siivotaan vanhat rakennustiedostot..."
rm -rf $APPDIR *.AppImage release/*.AppImage
mkdir -p release

echo "📁 Luodaan AppDir-hakemistorakenne..."
mkdir -p $APPDIR/usr/bin
mkdir -p $APPDIR/usr/share/applications
mkdir -p $APPDIR/usr/share/icons/hicolor/256x256/apps
mkdir -p $APPDIR/opt/wood-booster

echo "📦 Kopioidaan taustajärjestelmä ja venv..."
cp -r server.py brain.py venv $APPDIR/opt/wood-booster/

echo "🖼️ Luodaan väliaikainen kuvake, jotta pakkaus ei kaadu..."
touch $APPDIR/usr/share/icons/hicolor/256x256/apps/wood-booster.png

echo "📝 Luodaan työpöytätiedosto..."
cat << 'EOF' > $APPDIR/usr/share/applications/wood-booster-hq.desktop
[Desktop Entry]
Type=Application
Name=Wood-Booster OS HQ
Exec=AppRun
Icon=wood-booster
Categories=Development;System;
EOF

cp $APPDIR/usr/share/applications/wood-booster-hq.desktop $APPDIR/

echo "⚡ Luodaan AppRun-käynnistysskripti..."
cat << 'EOF' > $APPDIR/AppRun
#!/bin/sh
HERE="$(dirname "$(readlink -f "$0")")"
cd "$HERE/opt/wood-booster"
exec ./venv/bin/python server.py
EOF
chmod +x $APPDIR/AppRun

echo "📥 Ladataan linuxdeploy tarvittaessa..."
if [ ! -f linuxdeploy-x86_64.AppImage ]; then
    wget -q --show-progress https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage
    chmod +x linuxdeploy-x86_64.AppImage
fi

echo "📦 Pakataan Wood-Booster OS AppImage-muotoon..."
./linuxdeploy-x86_64.AppImage --appdir=$APPDIR --output appimage

mv Wood_Booster_OS*.AppImage release/ 2>/dev/null || mv *.AppImage release/ 2>/dev/null || true

echo "✨ Valmista! Wood-Booster OS AppImage on luotu release/-kansioon."
