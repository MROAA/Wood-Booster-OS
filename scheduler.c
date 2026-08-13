/* scheduler.c - Wood-Booster Kernel Process Scheduler */

#define MAX_PROCESSES 16
#define STACK_SIZE 1024

typedef enum {
    READY,
    RUNNING,
    BLOCKED,
    TERMINATED
} ProcessState;

typedef struct {
    int pid;
    ProcessState state;
    unsigned int stack[STACK_SIZE];
    int instruction_pointer;
} ProcessControlBlock;

ProcessControlBlock process_table[MAX_PROCESSES];
int current_process_index = 0;
int process_count = 0;

void scheduler_init() {
    for(int i = 0; i < MAX_PROCESSES; i++) {
        process_table[i].pid = -1;
        process_table[i].state = TERMINATED;
    }
    process_count = 0;
    current_process_index = 0;
}

int create_process() {
    if (process_count >= MAX_PROCESSES) return -1;
    
    int pid = process_count + 1;
    process_table[process_count].pid = pid;
    process_table[process_count].state = READY;
    process_count++;
    
    return pid;
}

// Vuoronnin (Scheduler tick) - vaihtaa aktiivista prosessia
void schedule_next() {
    if (process_count == 0) return;

    process_table[current_process_index].state = READY;
    
    // Siirrytään seuraavaan prosessiin kiertävästi (Round-Robin)
    current_process_index = (current_process_index + 1) % process_count;
    
    process_table[current_process_index].state = RUNNING;
}
