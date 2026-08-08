/* paging.c - Muistinsuojauksen ja sivutuksen perusta */

#define PAGE_SIZE_4KB 4096

unsigned int page_directory[1024] __attribute__((aligned(4096)));
unsigned int first_page_table[1024] __attribute__((aligned(4096)));

void init_paging() {
    // Täytetään sivutaulu identtisellä mappauksella (4MB asti)
    for(int i = 0; i < 1024; i++) {
        first_page_table[i] = (i * PAGE_SIZE_4KB) | 3; // Supervisor, read/write, present
    }

    page_directory[0] = (unsigned int)first_page_table | 3;
    
    // Asetetaan loput hakemistosta tyhjiksi
    for(int i = 1; i < 1024; i++) {
        page_directory[i] = 0 | 2; // Supervisor, read/write, not present
    }

    // Ladataan sivuhakemistorekisteri (CR3) ja otetaan paging käyttöön (CR4 & CR0)
    __asm__ __volatile__ (
        "mov %0, %%cr3\n\t"
        "mov %%cr0, %%eax\n\t"
        "or $0x80000000, %%eax\n\t"
        "mov %%eax, %%cr0"
        : : "r" (page_directory) : "%eax"
    );
}
