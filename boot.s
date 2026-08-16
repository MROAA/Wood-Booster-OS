# boot.s - Multiboot 1 -standardin mukainen käynnistin
#
# Uudelleenkirjoitettu NASM-syntaksista (boot.asm) GNU as:lle, koska
# tässä ympäristössä ei ole nasmia asennettuna mutta binutils (as/ld)
# on. .intel_syntax noprefix pitää sisällön lähes identtisenä
# alkuperäisen kanssa.

.intel_syntax noprefix

.set MIG_ALIGN,   1 << 0        # kohdista moduulit sivurajoille
.set MIG_MEMINFO, 1 << 1        # anna muistikartta kernelille
.set MIG_FLAGS,   MIG_ALIGN | MIG_MEMINFO
.set MAGIC,       0x1BADB002    # multiboot-magia numero
.set CHECKSUM,    -(MAGIC + MIG_FLAGS)

.section .multiboot
.align 4
    .long MAGIC
    .long MIG_FLAGS
    .long CHECKSUM

.section .text
.global start
.extern kernel_main

start:
    # Asetetaan pino (stack pointer)
    mov esp, offset stack_space

    # Siirrytään C-kielisen kernelin pääohjelmaan
    call kernel_main

.hang:
    cli
    hlt
    jmp .hang

.section .bss
.skip 8192                      # Varataan 8KB pino tilaa
stack_space:
