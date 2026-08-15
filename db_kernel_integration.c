/* db_kernel_integration.c - Syscall-rajapinnan ja tietokantaytimen
välinen liima

Puuttui aiemmin kokonaan - syscalls.c sisälsi jo
`#include "db_kernel_integration.c"` -rivin, mutta tiedostoa ei ollut.

Ei viittaa db_engine.c:n sisäisiin rakenteisiin suoraan, jotta tämä
tiedosto pysyy käännettävissä riippumatta siitä missä järjestyksessä
kutsuva tiedosto (syscalls.c) sisällytetään suhteessa db_engine.c:hen
- tässä koodikannassa ei ole otsikkotiedostoja/include-vartijoita,
joten kaksinkertaisen sisällytyksen riski pitää välttää tällä
tavalla. */

int db_commit_count = 0;

/* Merkitsee sivun tallennetuksi. Ei vielä oikeaa levy-I/O:ta - sama
"simuloitu" tila kuin db_engine.c:n db_write_wal():ssa. */
void commit_to_storage(int page_index) {
    (void)page_index;
    db_commit_count++;
}
