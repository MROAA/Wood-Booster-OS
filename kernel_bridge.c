/* kernel_bridge.c - Yhdistää kernelin IPC-viestit ja tietokantaytimen OS-tasolle */

#include "ipc.c"
#include "vfs.c"

// Ytimen silta-rakenne, joka välittää tilatietoa ja tietokantapuskureita eteenpäin
typedef struct {
    int bridge_active;
    int total_syncs;
} KernelBridge;

KernelBridge os_bridge;

void bridge_init() {
    ipc_init();
    vfs_init();
    os_bridge.bridge_active = 1;
    os_bridge.total_syncs = 0;
}

// Funktio, jolla kernelin tietokantatila synkronoidaan ulospäin
int bridge_sync_state(int process_id, const char* status_payload) {
    if (!os_bridge.bridge_active) return -1;

    // Lähetetään IPC-viesti ytimen sisällä (esim. PID 0 -> PID 1)
    int result = ipc_send(process_id, 1, status_payload);
    if (result == 0) {
        os_bridge.total_syncs++;
        
        // Tallennetaan tila myös virtuaaliseen levylohkoon (VFS)
        vfs_write_block(os_bridge.total_syncs % 1024, status_payload);
    }
    return result;
}
