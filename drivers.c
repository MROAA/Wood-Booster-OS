/* drivers.c - Laitteistoajurit (Timer & Keyboard) IDT:lle */

/* Portti-I/O apufunktiot */
static inline unsigned char inb(unsigned short port) {
    unsigned char ret;
    __asm__ __volatile__("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

static inline void outb(unsigned short port, unsigned char val) {
    __asm__ __volatile__("outb %0, %1" : : "a"(val), "Nd"(port));
}

/* Uudelleenmääritetään PIC (8259) niin että laitteistokeskeytykset
IRQ0-15 osuvat vektoreihin 32-47 eivätkä oletusarvoisesti törmää
prosessorin omiin poikkeusvektoreihin 0-31. Ilman tätä IRQ0 (kello)
osuisi vektoriin 8, joka on prosessorin "double fault" -poikkeus. */
void pic_remap() {
    outb(0x20, 0x11);
    outb(0xA0, 0x11);
    outb(0x21, 0x20); /* Master PIC: IRQ0 -> vektori 32 */
    outb(0xA1, 0x28); /* Slave PIC: IRQ8 -> vektori 40 */
    outb(0x21, 0x04);
    outb(0xA1, 0x02);
    outb(0x21, 0x01);
    outb(0xA1, 0x01);
    outb(0x21, 0x0);
    outb(0xA1, 0x0);
}

unsigned int system_ticks = 0;

struct interrupt_frame;

/* Kellon keskeytysrutiini (IRQ 0 / vektori 32).
`__attribute__((interrupt))` saa GCC:n generoimaan oikean
rekisterien tallennus/palautus- ja iret-koodin automaattisesti -
tätä ennen tälle ei ollut mitään oikeaa keskeytysvektoria, joten
funktio ei koskaan käynnistynyt. `target("general-regs-only")` estää
kääntäjää käyttämästä SSE-rekistereitä tässä funktiossa, koska
keskeytyksen prologi ei tallenna niitä. */
__attribute__((interrupt, target("general-regs-only")))
void timer_handler(struct interrupt_frame* frame) {
    (void)frame;
    system_ticks++;
    outb(0x20, 0x20); /* Kuittaus PIC:lle */
}

/* Näppäimistön keskeytysrutiini (IRQ 1 / vektori 33) */
unsigned char last_scancode = 0;

__attribute__((interrupt, target("general-regs-only")))
void keyboard_handler(struct interrupt_frame* frame) {
    (void)frame;
    last_scancode = inb(0x60); /* Luetaan näppäimen skannauskoodi */
    outb(0x20, 0x20);
}
