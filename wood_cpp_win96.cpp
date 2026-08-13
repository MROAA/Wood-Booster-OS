#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_WIN96_SYSTEM.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - WIN96 RETRO SYSTEM EDITION\n";
        file << "========================================\n";
        file << " WIN96 RETRO DESKTOP ENVIRONMENT! KLASSINEN UI! 💻🪟🇫🇮\n";
        file << "- Classic Windows 96 Kernel Bridge: Active\n";
        file << "- Nostalgic Desktop & Window Manager: Online\n";
        file << "- Retro Sound & Visual Theme: Fully Operational\n";
        file << "Status: WIN96 MODE ENGAGED. START MENU OPEN! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] WIN96 Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create WIN96 file!" << std::endl;
    }
    return 0;
}
