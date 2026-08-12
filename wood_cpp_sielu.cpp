#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_SIELU.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - SIELU & SYVYYS\n";
        file << "========================================\n";
        file << " SIELUN RAUHA JA METSÄN SYVYYS. KAIKKI ON KOHDALLAAN. 🌲🌌🇫🇮\n";
        file << "- Soul Resonance Protocol: Active\n";
        file << "- Inner Peace & Silence Engine: Deeply Connected\n";
        file << "- Infinite Spirit Core: Fully Operational\n";
        file << "Status: SIELU MODE ENGAGED. PUHDASTA VOIMAA! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] Sielu Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create Sielu file!" << std::endl;
    }
    return 0;
}
