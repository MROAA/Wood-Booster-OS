#!/bin/bash
# Wood-Booster OS - rakentaa oikeasti kaynnistyvan live-USB ISO:n.
#
# Perustuu Alpine Linuxin viralliseen, jo toimivaksi todettuun
# boot-ketjuun (oma ydin+initrd+BIOS/UEFI-tuki) sen sijaan etta
# yritettaisiin koota ne itse. Wood-Booster -sovellus lisataan paalle
# Alpinen omalla laajennusmekanismilla (apkovl + erillinen squashfs),
# katso iso-build/apkovl/.
#
# Kaytto:
#   ./iso-build/build-wood-booster-iso.sh
# Tulos:
#   iso-build/out/Wood-Booster-OS.iso
#
# Vaatii: docker, mksquashfs (squashfs-tools), xorriso, curl.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORK_DIR="$SCRIPT_DIR/.work"
OUT_DIR="$SCRIPT_DIR/out"
ALPINE_VERSION="3.20.10"
ALPINE_ISO="alpine-standard-${ALPINE_VERSION}-x86_64.iso"
ALPINE_URL="https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/x86_64/${ALPINE_ISO}"
ALPINE_SHA256_URL="${ALPINE_URL}.sha256"
CONTAINER_NAME="wood-booster-iso-build"

for tool in docker mksquashfs xorriso curl sha256sum; do
	command -v "$tool" >/dev/null 2>&1 || { echo "Tyokalu puuttuu: $tool" >&2; exit 1; }
done

echo "Siivotaan edellinen build..."
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR" "$OUT_DIR"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
# 1) Sovelluksen tarvitsemat tiedostot (server.py + sen kayttamat modulit).
#    Pidetaan lista eksplisiittisena, ei glob-haettuna - repo-juuressa on
#    paljon muutakin (arkistoja, kokeiluja) joita ISO:on ei haluta mukaan.
# ---------------------------------------------------------------------------
APP_FILES=(
	server.py core_manager.py black_hole.py brain.py consciousness.py
	entropy.py eternity.py identity.py knowledge_bank.py monitor.py
	neural_growth.py quantum_core.py quantum_resonance.py soul.py
	spacemonkey.py spacemonkey_art.py spacemonkey_drives.py spacemonkey_gimp.py
	spacemonkey_humanity.py spacemonkey_interfaces.py spacemonkey_love.py
	spacemonkey_media.py spacemonkey_simulation.py spacemonkey_social.py
	spacemonkey_wordpress.py system_controller.py web_portal.py
	windows_engine.py windows_filesystem.py yggdrasill.py
	desktop.html knowledge_bank.json
)

echo "Rakennetaan musl-yhteensopiva ajoymparisto (Alpine 3.20 -kontissa)..."
docker run -d --name "$CONTAINER_NAME" alpine:3.20 sleep 3600 >/dev/null
docker exec "$CONTAINER_NAME" sh -c "apk update >/dev/null && apk add --no-cache python3 py3-flask py3-psutil >/dev/null"

RUNTIME_DIR="$WORK_DIR/wb-runtime"
mkdir -p "$RUNTIME_DIR/usr/bin" "$RUNTIME_DIR/usr/lib" "$RUNTIME_DIR/lib" "$RUNTIME_DIR/opt/wood-booster"

docker exec "$CONTAINER_NAME" sh -c '
	set -e
	rm -rf /export && mkdir -p /export/usr/bin /export/usr/lib /export/lib /export/opt/wood-booster
	cp "$(readlink -f "$(which python3)")" /export/usr/bin/python3.12
	ln -s python3.12 /export/usr/bin/python3
	cp -a /usr/lib/libpython3.12.so* /export/usr/lib/
	cp -a /usr/lib/python3.12 /export/usr/lib/python3.12
	rm -rf /export/usr/lib/python3.12/test /export/usr/lib/python3.12/idlelib \
		/export/usr/lib/python3.12/tkinter /export/usr/lib/python3.12/lib2to3 \
		/export/usr/lib/python3.12/ensurepip
	find /export/usr/lib/python3.12 -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	cp -a /lib/ld-musl-x86_64.so.1 /export/lib/
'

for f in "${APP_FILES[@]}"; do
	cp "$REPO_ROOT/$f" "$WORK_DIR/tmp_$(basename "$f")" 2>/dev/null || true
done
docker cp "$WORK_DIR/." "$CONTAINER_NAME:/tmp/app_src/" >/dev/null
for f in "${APP_FILES[@]}"; do
	docker cp "$REPO_ROOT/$f" "$CONTAINER_NAME:/export/opt/wood-booster/$(basename "$f")" >/dev/null
done
rm -f "$WORK_DIR"/tmp_*

docker cp "$CONTAINER_NAME:/export/." "$RUNTIME_DIR/" >/dev/null
docker rm -f "$CONTAINER_NAME" >/dev/null

echo "Pakataan sovellus + ajoymparisto squashfs-tiedostoksi..."
rm -f "$WORK_DIR/wood-booster.squashfs"
mksquashfs "$RUNTIME_DIR" "$WORK_DIR/wood-booster.squashfs" -comp xz -noappend >/dev/null

# ---------------------------------------------------------------------------
# 2) apkovl: Alpinen oma laajennuspaketti, joka asentaa etc/local.d
#    -kaynnistysskriptin. etc/.default_boot_services -merkkitiedosto ON
#    PAKOLLINEN - ilman sita Alpine olettaa apkovl:n tuovan mukanaan TAYDEN
#    oman runlevel-kokoonpanon, ja jattaa lisaamatta modloopin, mdev:in,
#    laiteajurien latauksen jne. kokonaan. Ilman sita mitaan verkkoa/
#    ajureita ei koskaan lataudu - tama loydettiin vasta viiden
#    epaonnistuneen QEMU-boottitestin jalkeen suoraan Alpinen
#    initramfs-init-lahdekoodista.
# ---------------------------------------------------------------------------
echo "Pakataan apkovl (kaynnistysskripti)..."
rm -f "$WORK_DIR/localhost.apkovl.tar.gz"
( cd "$SCRIPT_DIR/apkovl" && tar czf "$WORK_DIR/localhost.apkovl.tar.gz" etc )

# ---------------------------------------------------------------------------
# 3) Alpinen virallinen, jo bootattavaksi todettu ISO (BIOS+UEFI, oma ydin+
#    initrd). Ei kosketa naita - vain lisataan kaksi tiedostoa ja patchataan
#    kaksi konfiguraatiotiedostoa.
# ---------------------------------------------------------------------------
if [ ! -f "$WORK_DIR/$ALPINE_ISO" ]; then
	echo "Ladataan Alpine Linux $ALPINE_VERSION (standard, x86_64)..."
	curl -fSL -o "$WORK_DIR/$ALPINE_ISO" "$ALPINE_URL"
fi
echo "Tarkistetaan Alpine-ISOn eheys (sha256)..."
EXPECTED_SHA=$(curl -fsSL "$ALPINE_SHA256_URL" | awk '{print $1}')
ACTUAL_SHA=$(sha256sum "$WORK_DIR/$ALPINE_ISO" | awk '{print $1}')
if [ "$EXPECTED_SHA" != "$ACTUAL_SHA" ]; then
	echo "VIRHE: Alpine-ISOn tarkistussumma ei tasmaa - ladattu tiedosto on korruptoitunut tai vaarennettu." >&2
	exit 1
fi

echo "Puretaan alkuperaiset boot-konfiguraatiot patchausta varten..."
EXTRACT_DIR="$WORK_DIR/alpine-extract"
mkdir -p "$EXTRACT_DIR"
( cd "$EXTRACT_DIR" && 7z x -y "$WORK_DIR/$ALPINE_ISO" boot/syslinux/syslinux.cfg boot/grub/grub.cfg >/dev/null )

CONSOLE_OPTS="console=tty0 console=ttyS0,115200n8"
sed -e "s/^APPEND \(.*\)$/APPEND \1 $CONSOLE_OPTS/" \
	-e 's/^MENU LABEL .*/MENU LABEL Wood-Booster OS/' \
	-e 's/^TIMEOUT .*/TIMEOUT 30/' \
	"$EXTRACT_DIR/boot/syslinux/syslinux.cfg" > "$WORK_DIR/syslinux.cfg"

sed -e "s#^linux\t/boot/vmlinuz-lts \(.*\)\$#linux\t/boot/vmlinuz-lts \1 $CONSOLE_OPTS#" \
	-e 's/^menuentry ".*"/menuentry "Wood-Booster OS"/' \
	-e 's/^set timeout=.*/set timeout=5/' \
	"$EXTRACT_DIR/boot/grub/grub.cfg" > "$WORK_DIR/grub.cfg"

echo "Rakennetaan lopullinen ISO (xorriso: lisataan tiedostot, sailytetaan alkuperainen BIOS+UEFI-boot-ketju)..."
rm -f "$OUT_DIR/Wood-Booster-OS.iso"
xorriso -indev "$WORK_DIR/$ALPINE_ISO" \
	-outdev "$OUT_DIR/Wood-Booster-OS.iso" \
	-boot_image any replay \
	-map "$WORK_DIR/wood-booster.squashfs" /wood-booster.squashfs \
	-map "$WORK_DIR/localhost.apkovl.tar.gz" /localhost.apkovl.tar.gz \
	-update "$WORK_DIR/syslinux.cfg" /boot/syslinux/syslinux.cfg \
	-update "$WORK_DIR/grub.cfg" /boot/grub/grub.cfg \
	-volid WOOD_BOOSTER_OS

echo ""
echo "Valmista: $OUT_DIR/Wood-Booster-OS.iso"
echo "Testaa ensin virtuaalikoneessa, esim.:"
echo "  qemu-system-x86_64 -m 1024 -enable-kvm -cdrom \"$OUT_DIR/Wood-Booster-OS.iso\" -boot d -nic user,hostfwd=tcp::5000-:5000"
echo "ja avaa selaimella http://127.0.0.1:5000/"
