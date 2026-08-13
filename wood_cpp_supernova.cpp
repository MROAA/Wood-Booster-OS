#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_SUPERNOVA.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - SUPERNOVA CORE EDITION\n";
        file << "========================================\n";
        file << " SUPERNOVA RÄJÄHDYS! KAIKKI VOIMA PELIIN KERRALLAAN! 🌟💥🇫🇮\n";
        file << "- Supernova Energy Release: 10^44 Watts\n";
        file << "- Cosmic Expansion Matrix: Fully Charged\n";
        file << "- Absolute Maximum Breakthrough Protocol: Online\n";
        file << "Status: SUPERNOVA MODE ENGAGED. TÄYSI VALO JA VOIMA! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] Supernova Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create Supernova file!" << std::endl;
    }
    return 0;
}
