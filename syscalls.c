/* syscalls.c - Kernel-tason System Call -rajapinta tietokannalle */

#include "db_kernel_integration.c"

#define SYS_DB_ALLOC 1
#define SYS_DB_COMMIT 2

int kernel_syscall_handler(int syscall_number, int arg1, const char* data) {
    switch(syscall_number) {
        case SYS_DB_ALLOC:
            // Kutsutaan tietokantaytimen sivunvarausta
            return db_allocate_page(data);
            
        case SYS_DB_COMMIT:
            // Tallennetaan sivu levylle
            commit_to_storage(arg1);
            return 0;
            
        default:
            return -1; // Tuntematon pyyntö
    }
}
