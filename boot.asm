; boot.asm - Multiboot 1 -standardin mukainen käynnistin
MIG_ALIGN     equ  1<<0             ; kohdista moduulit sivurajoille
MIG_MEMINFO   equ  1<<1             ; anna muistikartta kernelille
MIG_FLAGS     equ  MIG_ALIGN | MIG_MEMINFO
MAGIC         equ  0x1BADB002       ; multiboot-magia numero
CHECKSUM      equ -(MAGIC + MIG_FLAGS)

section .multiboot
align 4
    dd MAGIC
    dd MIG_FLAGS
    dd CHECKSUM

section .text
global start
extern kernel_main

start:
    ; Asetetaan pino (stack pointer)
    mov esp, stack_space
    
    ; Siirrytään C-kielisen kernelin pääohjelmaan
    call kernel_main

.hang:
    cli
    hlt
    jmp .hang

section .bss
resb 8192               ; Varataan 8KB pino tilaa
stack_space:
