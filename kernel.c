/* kernel.c - Wood-Booster Kernel v0.1 */

void kernel_main(void) {
    // VGA-tekstitilan muistiosoite
    volatile char* vga_buffer = (volatile char*) 0xB8000;
    
    const char* message = "WOOD-BOOSTER KERNEL ONLINE";
    int i = 0;

    // Tyhjennetään rivi ja kirjoitetaan viesti (vaalea teksti tummalla pohjalla)
    while (message[i] != '\0') {
        vga_buffer[i * 2] = message[i];     // Merkki
        vga_buffer[i * 2 + 1] = 0x0A;       // Väri: vaalea vihreä mustalla pohjalla
        i++;
    }

    // Ikivieras looppi, ettei ydin kaadu
    while(1) {
        __asm__("hlt");
    }
}
