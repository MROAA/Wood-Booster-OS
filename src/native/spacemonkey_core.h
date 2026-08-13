#ifndef SPACEMONKEY_CORE_H
#define SPACEMONKEY_CORE_H

#ifdef __cplusplus
extern "C" {
#endif

// Optimoitu C-funktio puusepän datan pakkaamiseen muistiin
void spacemonkey_c_optimize_memory(int* buffer, int length) {
    // Tehdään natiivi bittitason optimointi muistille
    for (int i = 0; i < length; i++) {
        buffer[i] = buffer[i] ^ 0xA5; // Suojattu bittimaski Spacemonkeyn muistille
    }
}

#ifdef __cplusplus
}
#endif

#endif
