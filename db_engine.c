/* db_engine.c - Wood-Booster Database Storage Engine Kernel Module */

#define PAGE_SIZE 4096  // 4KB tietokantasivu
#define MAX_PAGES 128   // Puskurialtaan koko

typedef struct {
    unsigned int page_id;
    char data[PAGE_SIZE];
    int is_dirty;
} DBPage;

typedef struct {
    DBPage buffer_pool[MAX_PAGES];
    int active_pages;
} DatabaseKernel;

DatabaseKernel db_kernel;

void db_init() {
    db_kernel.active_pages = 0;
    for(int i = 0; i < MAX_PAGES; i++) {
        db_kernel.buffer_pool[i].page_id = -1;
        db_kernel.buffer_pool[i].is_dirty = 0;
    }
}

// Simuloitu Write-Ahead Log (WAL) kirjain
void db_write_wal(const char* query) {
    // Tuotannossa kirjoitettaisiin suoraan levyn lokialueelle
}

int db_allocate_page(const char* content) {
    if (db_kernel.active_pages >= MAX_PAGES) return -1; // Buffer pool full
    
    int idx = db_kernel.active_pages;
    db_kernel.buffer_pool[idx].page_id = idx;
    
    // Kopioidaan data sivulle
    for(int i = 0; i < PAGE_SIZE && content[i] != '\0'; i++) {
        db_kernel.buffer_pool[idx].data[i] = content[i];
    }
    
    db_kernel.buffer_pool[idx].is_dirty = 1;
    db_kernel.active_pages++;
    return idx;
}
