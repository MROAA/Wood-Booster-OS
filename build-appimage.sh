#!/bin/bash
set -e

APP_NAME="Wood-Booster-HQ"
ARCH="x86_64"
APPDIR="AppDir"

echo "🧹 Siivotaan vanhat rakennustiedostot..."
rm -rf $APPDIR *.AppImage

echo "📁 Luodaan AppDir-hakemistorakenne..."
mkdir -p $APPDIR/usr/bin
mkdir -p $APPDIR/usr/share/applications
mkdir -p $APPDIR/usr/share/icons/hicolor/256x256/apps

echo "📝 Luodaan työpöytätiedosto..."
cat << 'EOF' > $APPDIR/usr/share/applications/wood-booster-hq.desktop
[Desktop Entry]
Type=Application
Name=Wood-Booster HQ
Exec=AppRun
Icon=wood-booster
Categories=Development;System;
EOF

# Linkitetään tai kopioidaan .desktop myös juureen (vaaditaan AppImage-standardissa)
cp $APPDIR/usr/share/applications/wood-booster-hq.desktop $APPDIR/

echo "⚡ Luodaan tehokas AppRun-käynnistyskomentosarja..."
cat << 'EOF' > $APPDIR/AppRun
#!/bin/sh
HERE="$(dirname "$(readlink -f "$0")")"
export PATH="$HERE/usr/bin:$PATH"
exec node "$HERE/usr/share/wood-booster-hq/index.js"
EOF
chmod +x $APPDIR/AppRun

echo "📥 Ladataan linuxdeploy tarvittaessa..."
if [ ! -f linuxdeploy-x86_64.AppImage ]; then
    wget -q --show-progress https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage
    chmod +x linuxdeploy-x86_64.AppImage
fi

echo "📦 Pakataan Wood-Booster HQ AppImage-muotoon..."
./linuxdeploy-x86_64.AppImage --appdir=$APPDIR --output appimage

echo "✨ Valmista! Wood-Booster HQ AppImage on luotu onnistuneesti."
