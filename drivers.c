/* drivers.c - Laitteistoajurit (Timer & Keyboard) IDT:lle */

// Portti-I/O apufunktiot
static inline unsigned char inb(unsigned short port) {
    unsigned char ret;
    __asm__ __volatile__ ("inb %1, %0" : "=a" (ret) : "Nd" (port));
    return ret;
}

static inline void outb(unsigned short port, unsigned char val) {
    __asm__ __volatile__ ("outb %0, %1" : : "a" (val), "Nd" (port));
}

unsigned int system_ticks = 0;

// Kellon keskeytysrutiini (IRQ 0)
void timer_handler() {
    system_ticks++;
    // Lähetetään kuittaus PIC:lle (Programmable Interrupt Controller)
    outb(0x20, 0x20);
}

// Näppäimistön keskeytysrutiini (IRQ 1)
unsigned char last_scancode = 0;
void keyboard_handler() {
    last_scancode = inb(0x60); // Luetaan näppäimen skannauskoodi
    outb(0x20, 0x20);
}
