/* kernel.c - Wood-Booster Kernel v0.2

Tämä on ainoa tiedosto jonka kääntäjä näkee omana käännösyksikkönään
- muut .c-tiedostot sisällytetään tekstuaalisesti #include:lla, sama
tyyli kuin kernel_bridge.c/syscalls.c jo käyttivät ipc.c/vfs.c/
db_kernel_integration.c:lle. Ei otsikkotiedostoja eikä
include-vartijoita tässä koodikannassa, joten jokainen tiedosto
sisällytetään tässä täsmälleen kerran.

v0.1:n kernel_main() ei kutsunut mitään muista tiedostoista mitään -
ne olivat olemassa mutta täysin kytkemättä. Kaksi tiedostoa
(syscalls.c, kernel_bridge.c) viittasivat lisäksi tiedostoihin joita
ei ollut olemassa lainkaan, joten ydin ei edes kääntynyt. Tämä
versio korjaa molemmat: kirjoittaa puuttuvat tiedostot (ipc.c, vfs.c,
db_kernel_integration.c) ja kutsuu jokaisen osajärjestelmän
alustusfunktiota oikeasti käynnistyksen yhteydessä. */

#include "idt.c"
#include "paging.c"
#include "drivers.c"
#include "scheduler.c"
#include "db_engine.c"
#include "kernel_bridge.c"
#include "syscalls.c"
#include "llm_kernel.c"

/* Freestanding-ympäristössä ei ole libc:tä, mutta kääntäjä voi silti
tunnistaa esim. nollaus- tai kopiointisilmukoita ja korvata ne
kutsuilla memset()/memcpy():een optimoinnin yhteydessä. Ilman näitä
linkitys epäonnistuisi "undefined reference" -virheeseen. */
void* memset(void* dest, int val, unsigned int len) {
    unsigned char* ptr = (unsigned char*)dest;
    while (len-- > 0) {
        *ptr++ = (unsigned char)val;
    }
    return dest;
}

void* memcpy(void* dest, const void* src, unsigned int len) {
    unsigned char* d = (unsigned char*)dest;
    const unsigned char* s = (const unsigned char*)src;
    while (len-- > 0) {
        *d++ = *s++;
    }
    return dest;
}

/* Sarjaportti (COM1) - lisätty jotta käynnistyksen jokainen vaihe on
todennettavissa automaattisesti QEMU:n "-serial stdio" -tulosteesta
eikä pelkän VGA-näytön visuaalisesta tarkistuksesta. */
#define SERIAL_PORT 0x3F8

static void serial_init() {
    outb(SERIAL_PORT + 1, 0x00); /* Keskeytykset pois */
    outb(SERIAL_PORT + 3, 0x80); /* DLAB päälle */
    outb(SERIAL_PORT + 0, 0x03); /* 38400 baud (jakaja alaosa) */
    outb(SERIAL_PORT + 1, 0x00); /* (jakaja yläosa) */
    outb(SERIAL_PORT + 3, 0x03); /* 8 bittiä, ei pariteettia, 1 stop-bitti */
    outb(SERIAL_PORT + 2, 0xC7); /* FIFO päälle, tyhjennys, 14-tavun kynnys */
    outb(SERIAL_PORT + 4, 0x0B); /* IRQ:t päälle, RTS/DSR asetettu */
}

static void serial_putc(char c) {
    while ((inb(SERIAL_PORT + 5) & 0x20) == 0) {
        /* odotetaan että lähetyspuskuri on tyhjä */
    }
    outb(SERIAL_PORT, c);
}

static void serial_print(const char* s) {
    while (*s) {
        serial_putc(*s);
        s++;
    }
}

static void serial_print_uint(unsigned int value) {
    char digits[11];
    int i = 0;

    if (value == 0) {
        serial_putc('0');
        return;
    }

    while (value > 0 && i < 10) {
        digits[i] = (char)('0' + (value % 10));
        value /= 10;
        i++;
    }

    while (i > 0) {
        i--;
        serial_putc(digits[i]);
    }
}

void kernel_main(void) {

    serial_init();
    serial_print("WOOD-BOOSTER KERNEL BOOT\n");

    /* VGA-tekstitilan muistiosoite */
    volatile char* vga_buffer = (volatile char*)0xB8000;
    const char* message = "WOOD-BOOSTER KERNEL ONLINE";
    int i = 0;

    while (message[i] != '\0') {
        vga_buffer[i * 2] = message[i];     /* Merkki */
        vga_buffer[i * 2 + 1] = 0x0A;       /* Väri: vaalea vihreä mustalla pohjalla */
        i++;
    }

    idt_init();
    serial_print("IDT alustettu\n");

    init_paging();
    serial_print("Paging alustettu\n");

    scheduler_init();
    serial_print("Scheduler alustettu\n");

    db_init();
    serial_print("DB-engine alustettu\n");

    bridge_init();
    serial_print("Kernel bridge alustettu (ipc + vfs)\n");

    llm_kernel_init();
    serial_print("LLM-kernel-tynkä alustettu (ei oikeaa mallia viela)\n");

    pic_remap();
    idt_set_gate(32, (unsigned int)timer_handler);
    idt_set_gate(33, (unsigned int)keyboard_handler);
    __asm__ __volatile__("sti");
    serial_print("Keskeytykset paalla (kello + nappaimisto)\n");

    serial_print("WOOD-BOOSTER KERNEL READY\n");

    /* Todiste etta kello-IRQ oikeasti laukeaa toistuvasti eika vain
    etta kaynnistys ei kaatunut: odotetaan (hlt:lla, ei kiireisella
    silmukalla) kunnes system_ticks on kasvanut - sita kasvattaa
    ainoastaan timer_handler. Pelkka "ei kaatunut" ei viela todista
    etta itse keskeytysmekanismi toimii - system_ticks voisi yhta
    hyvin olla jaatynyt nollaan jos PIC-uudelleenmaaritys tai
    IDT-portit olisivat vaarin (nain kavikin ensimmaisella yrityksella
    - ks. idt.c:n current_code_selector()-kommentti). Alkuperainen
    versio taman todisteen kirjoittamisesta kaytti kiireista
    odotussilmukkaa, joka QEMU:ssa ehti paattya nopeammin kuin yksikaan
    oikea ajastinkeskeytys - system_ticks luettiin siis liian aikaisin
    eika kertonut mitaan mekanismin toimivuudesta. hlt-pohjainen odotus
    on seka oikeampi todiste etta oikea tapa odottaa keskeytysta. */
    while (system_ticks < 5) {
        __asm__("hlt");
    }

    serial_print("system_ticks 5:n kello-IRQ:n jalkeen: ");
    serial_print_uint(system_ticks);
    serial_print("\n");

    /* Ikivieras looppi, ettei ydin kaadu. hlt pysayttaa prosessorin
    seuraavaan keskeytykseen asti - talla hetkella kello-IRQ herattaa
    sen sailliannollisesti. */
    while (1) {
        __asm__("hlt");
    }
}
