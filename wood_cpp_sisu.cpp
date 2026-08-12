#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_SISU_PERKELE.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - SISU & PERKELE EDITION\n";
        file << "========================================\n";
        file << " SISU, PERKELE JA TALVISODAN HENKI! 🇫🇮❄️🪓\n";
        file << "- Unbreakable Willpower Engine: 100% Active\n";
        file << "- Periksi Antamaton Protokolla: Online\n";
        file << "- Salmiakki & Sisu-pastilli Booster: Loaded\n";
        file << "Status: SISU MODE UNLOCKED! EI ANNETA PERIKSI! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] SISU Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create SISU file!" << std::endl;
    }
    return 0;
}
