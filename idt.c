/* idt.c - Keskeytystenhallinnan alustus ytimelle */

struct IDTEntry {
    unsigned short offset_lowerbits;
    unsigned short selector;
    unsigned char zero;
    unsigned char type_attr;
    unsigned short offset_higherbits;
} __attribute__((packed));

struct IDTPtr {
    unsigned short limit;
    unsigned int base;
} __attribute__((packed));

struct IDTEntry idt[256];
struct IDTPtr idt_ptr;

void idt_set_gate(int n, unsigned int handler) {
    idt[n].offset_lowerbits = handler & 0xFFFF;
    idt[n].selector = 0x08; // Kernel code segment
    idt[n].zero = 0;
    idt[n].type_attr = 0x8E; // Interrupt Gate
    idt[n].offset_higherbits = (handler >> 16) & 0xFFFF;
}

void idt_init() {
    idt_ptr.limit = (sizeof(struct IDTEntry) * 256) - 1;
    idt_ptr.base = (unsigned int)&idt;

    // Ladataan IDT prosessorille
    __asm__ __volatile__("lidt (%0)" : : "r" (&idt_ptr));
}
