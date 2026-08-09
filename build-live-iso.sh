#!/bin/bash
set -e

echo "🚀 Aloitetaan Wood-Booster OS Live-ISO rakennus (Alpine-pohja)..."

ISO_DIR="iso_alpine_root"
rm -rf $ISO_DIR Wood-Booster-Live.iso
mkdir -p $ISO_DIR/boot/syslinux
mkdir -p $ISO_DIR/opt/wood-booster

echo "📦 Kopioidaan taustajärjestelmä ja venv..."
cp server.py brain.py $ISO_DIR/opt/wood-booster/
if [ -d "venv" ]; then
    cp -r venv $ISO_DIR/opt/wood-booster/
fi

echo "⚡ Luodaan Alpine init-autostart skripti..."
cat << 'EOF' > $ISO_DIR/opt/wood-booster/init.sh
#!/bin/sh
echo "=== Wood-Booster OS Käynnistyy Raudalta ==="
cd /opt/wood-booster
./venv/bin/python server.py
EOF
chmod +x $ISO_DIR/opt/wood-booster/init.sh

echo "📥 Ladataan Alpine Linuxin kevyt ydin ja initramfs..."
ALPINE_VERSION="3.20.0"
# Haetaan Alpine minirootfs tai netboot kernel tarvittaessa
# (Voimme myös käyttää suoraan valmista syslinux-pohjaa)

echo "✨ Valmista ISO-rakennuksen pohja."
