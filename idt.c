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

/* Lukee nykyisen koodisegmenttivalitsimen (CS) suoraan prosessorilta
sen sijaan etta oletettaisiin se olevan aina 0x08. Multiboot-
standardi ei maarita mika GDT-asettelu bootloaderin pitaa jattaa
jalkeensa - tama koodikanta oletti aiemmin kiinteasti 0x08:aa, mika
aiheutti General Protection Fault -poikkeuksen (ja siita kaskyvan
double faultin) heti kun ensimmainen laitteistokeskeytys yritti
laueta, koska tassa GRUB/QEMU-yhdistelmassa todellinen CS onkin
0x10. Todennettu QEMU:n "-d int" -keskeytyslokista suoraan. */
static unsigned short current_code_selector() {
    unsigned short cs;
    __asm__ __volatile__("mov %%cs, %0" : "=r"(cs));
    return cs;
}

void idt_set_gate(int n, unsigned int handler) {
    idt[n].offset_lowerbits = handler & 0xFFFF;
    idt[n].selector = current_code_selector();
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
