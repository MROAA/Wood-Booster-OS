#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <cstdint>

// Spacemonkey Cryptographic Vault & Sandbox Engine
class CryptoVault {
private:
    uint32_t masterKey;

    // Yksinkertaistettu sisäinen hajautusfunktio kryptografiseen sidontaan
    uint32_t generateVaultHash(const std::string& data) {
        uint32_t hash = this->masterKey;
        for (char c : data) {
            hash = ((hash << 5) + hash) + static_cast<uint32_t>(c);
        }
        return hash;
    }

public:
    CryptoVault(uint32_t key = 0x53504143) : masterKey(key) {} // "SPAC" hexana

    // Allekirjoittaa verstaan tiedoston tai muistipalan digitaalisella leimalla
    std::string signMemoryBlock(const std::string& content) {
        uint32_t sig = generateVaultHash(content);
        std::stringstream ss;
        ss << "VAULT_SIG_0x" << std::hex << std::uppercase << sig;
        return ss.str();
    }

    // Varmistaa, että muistipalaa tai tiedostoa ei ole peukaloitu
    bool verifyMemoryBlock(const std::string& content, const std::string& expectedSig) {
        std::string calculated = signMemoryBlock(content);
        return (calculated == expectedSig);
    }
};

extern "C" {
    CryptoVault* CryptoVault_New(uint32_t key) { return new CryptoVault(key); }
    
    // Natiivirajapinta merkkijonon kryptografiseen allekirjoitukseen
    const char* CryptoVault_Sign(CryptoVault* vault, const char* data) {
        static std::string result;
        result = vault->signMemoryBlock(std::string(data));
        return result.c_str();
    }
}
