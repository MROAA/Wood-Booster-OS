# Wood-Booster Kernel - build system
#
# Kaantaa x86 (32-bit) freestanding-ytimen ja linkkaa sen
# multiboot-yhteensopivaksi ELF-binaariksi. Ei ollut aiemmin mitaan
# build-jarjestelmaa talle koodille ollenkaan.
#
# Kayttaa GNU as:ia nasmin sijaan (nasmia ei ole asennettuna tassa
# ymparistossa; binutils/as on).

AS = as
CC = gcc
LD = ld

CFLAGS = -m32 -ffreestanding -fno-pie -fno-pic -fno-stack-protector \
         -fno-builtin -nostdlib -O0 -Wall -Wextra \
         -mno-sse -mno-sse2 -mfpmath=387

LDFLAGS = -m elf_i386 -T linker.ld -nostdlib

BUILD_DIR = build
KERNEL = $(BUILD_DIR)/wood-booster-kernel.bin
ISO = $(BUILD_DIR)/wood-booster.iso

.PHONY: all iso run clean

all: $(KERNEL)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(BUILD_DIR)/boot.o: boot.s | $(BUILD_DIR)
	$(AS) --32 boot.s -o $(BUILD_DIR)/boot.o

$(BUILD_DIR)/kernel.o: kernel.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) -c kernel.c -o $(BUILD_DIR)/kernel.o

$(KERNEL): $(BUILD_DIR)/boot.o $(BUILD_DIR)/kernel.o
	$(LD) $(LDFLAGS) -o $(KERNEL) $(BUILD_DIR)/boot.o $(BUILD_DIR)/kernel.o

iso: $(KERNEL)
	mkdir -p $(BUILD_DIR)/isodir/boot/grub
	cp $(KERNEL) $(BUILD_DIR)/isodir/boot/wood-booster-kernel.bin
	cp grub.cfg $(BUILD_DIR)/isodir/boot/grub/grub.cfg
	grub-mkrescue -o $(ISO) $(BUILD_DIR)/isodir

# Boottaa QEMU:ssa ilman graafista naytto - sarjaportin tuloste nakyy
# terminaalissa (ks. kernel.c:n serial_print-kutsut).
run: iso
	qemu-system-i386 -cdrom $(ISO) -serial stdio -display none -no-reboot -no-shutdown

clean:
	rm -rf $(BUILD_DIR)
