/* ipc.c - Ytimen sisäinen viestinvälitys (Inter-Process Communication)

Puuttui aiemmin kokonaan - kernel_bridge.c sisälsi jo
`#include "ipc.c"` -rivin, mutta tiedostoa ei ollut, joten mikään
kernelin osa ei kääntynyt. Yksinkertainen kiinteän kokoinen
postilaatikko, samaa "simuloitu, ei vielä oikeaa I/O:ta" -tyyliä kuin
db_engine.c. */

#define IPC_MAILBOX_SIZE 32
#define IPC_MESSAGE_MAX 128

typedef struct {
    int from_pid;
    int to_pid;
    char payload[IPC_MESSAGE_MAX];
    int used;
} IPCMessage;

IPCMessage ipc_mailbox[IPC_MAILBOX_SIZE];
int ipc_mailbox_count = 0;

void ipc_init() {
    ipc_mailbox_count = 0;
    for (int i = 0; i < IPC_MAILBOX_SIZE; i++) {
        ipc_mailbox[i].used = 0;
    }
}

/* Lähettää viestin postilaatikkoon. Palauttaa 0 onnistuessa, -1 jos
täynnä. */
int ipc_send(int from_pid, int to_pid, const char* payload) {
    if (ipc_mailbox_count >= IPC_MAILBOX_SIZE) {
        return -1;
    }

    int slot = ipc_mailbox_count;
    ipc_mailbox[slot].from_pid = from_pid;
    ipc_mailbox[slot].to_pid = to_pid;

    int i = 0;
    while (payload[i] != '\0' && i < IPC_MESSAGE_MAX - 1) {
        ipc_mailbox[slot].payload[i] = payload[i];
        i++;
    }
    ipc_mailbox[slot].payload[i] = '\0';
    ipc_mailbox[slot].used = 1;

    ipc_mailbox_count++;
    return 0;
}
