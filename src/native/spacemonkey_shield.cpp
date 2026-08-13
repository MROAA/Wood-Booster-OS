#include <iostream>
#include <vector>
#include <string>
#include <cstdint>

// Spacemonkey Cryptographic & Integrity Shield
extern "C" {
    // Laskee yksinkertaisen mutta nopean FNV-1a tyylisen tarkistussumman muistiblokille
    uint32_t spacemonkey_calculate_checksum(const uint8_t* data, size_t length) {
        uint32_t hash = 2166136261u;
        for (size_t i = 0; i < length; ++i) {
            hash ^= data[i];
            hash *= 16777619u;
        }
        return hash;
    }

    // Tarkistaa muistialueen rajat (Buffer Overflow Protection)
    bool spacemonkey_validate_boundary(size_t requestedSize, size_t maxSize) {
        if (requestedSize > maxSize || requestedSize == 0) {
            std::cerr << "[SECURITY SHIELD] CRITICAL: Muistirajan ylitysyritys estetty natiivisti!" << std::endl;
            return false;
        }
        return true;
    }
}
