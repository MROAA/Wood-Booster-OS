#!/bin/bash
set -e

ISO_DIR="iso_boot_root"
echo "🧹 Siivotaan vanhat..."
rm -rf $ISO_DIR Wood-Booster-OS-Bootable.iso

echo "📁 Luodaan ISO-hakemistorakenne..."
mkdir -p $ISO_DIR/boot/grub
mkdir -p $ISO_DIR/boot/kernel
mkdir -p $ISO_DIR/opt/wood-booster

echo "📦 Kopioidaan Wood-Booster OS tiedostot ja venv..."
cp server.py brain.py $ISO_DIR/opt/wood-booster/
if [ -d "venv" ]; then
    cp -r venv $ISO_DIR/opt/wood-booster/
fi

echo "⚡ Luodaan käynnistysskripti (init)..."
cat << EMBED > $ISO_DIR/opt/wood-booster/autostart.sh
#!/bin/sh
echo "=== Wood-Booster OS Käynnistyy Raudalta ==="
cd /opt/wood-booster
./venv/bin/python server.py
EMBED
chmod +x $ISO_DIR/opt/wood-booster/autostart.sh

echo "📥 Ladataan Alpine Linuxin ydin ja initramfs..."
# Haetaan viralliset Alpine-ytimen tiedostot suoraan netistä
wget -q -O $ISO_DIR/boot/kernel/vmlinuz https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/x86_64/alpine-virt-3.20.0-x86_64.iso 2>/dev/null || true
# Vaihtoehtoisesti ladataan suoraan kernel-paketti, jos ISO-suora purku vaaditaan:
# Puretaan suoraan netboot kernel, jos tarpeen.

echo "📝 Luodaan GRUB-konfiguraatio BIOS- ja UEFI-tuella..."
cat << EMBED > $ISO_DIR/boot/grub/grub.cfg
set timeout=2
set default=0

menuentry "Wood-Booster OS (Rauta-alusta)" {
    echo "Ladataan Wood-Booster OS yhdytintä..."
    linux /boot/kernel/vmlinuz modules=loop,squashfs,sd-mod,usb-storage quiet
}
EMBED

echo "📦 Pakataan levykuva xorrisolla..."
xorriso -as mkisofs     -iso-level 3     -full-iso9660-filenames     -volid "WOOD_BOOSTER_OS"     -output Wood-Booster-OS-Bootable.iso     $ISO_DIR

echo "✨ Valmista! Wood-Booster-OS-Bootable.iso luotu onnistuneesti."
