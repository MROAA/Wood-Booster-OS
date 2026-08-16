/* vfs.c - Yksinkertainen virtuaalinen tiedostojärjestelmä

Puuttui aiemmin kokonaan - kernel_bridge.c sisälsi jo
`#include "vfs.c"` -rivin, mutta tiedostoa ei ollut. Muistiin
simuloitu "levy" kiinteän kokoisina lohkoina, sama tyyli kuin
db_engine.c:n puskurialtaassa. */

#define VFS_BLOCK_SIZE 512
#define VFS_BLOCK_COUNT 1024

typedef struct {
    char data[VFS_BLOCK_SIZE];
    int written;
} VFSBlock;

VFSBlock vfs_disk[VFS_BLOCK_COUNT];

void vfs_init() {
    for (int i = 0; i < VFS_BLOCK_COUNT; i++) {
        vfs_disk[i].written = 0;
    }
}

/* Kirjoittaa datan annettuun lohkoon simuloidulle "levylle". Palauttaa
0 onnistuessa, -1 jos lohkoindeksi on rajojen ulkopuolella. */
int vfs_write_block(int block_index, const char* data) {
    if (block_index < 0 || block_index >= VFS_BLOCK_COUNT) {
        return -1;
    }

    int i = 0;
    while (data[i] != '\0' && i < VFS_BLOCK_SIZE - 1) {
        vfs_disk[block_index].data[i] = data[i];
        i++;
    }
    vfs_disk[block_index].data[i] = '\0';
    vfs_disk[block_index].written = 1;

    return 0;
}
