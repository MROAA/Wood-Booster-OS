#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_SAUNA_PERKELE.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - SAUNA PERKELE EDITION\n";
        file << "========================================\n";
        file << " SAUNA PERKELE! LÖYLYÄ KUKA LÄMMITTÄÄ?! 🪵🔥🇫🇮\n";
        file << "- Kiuas Temperature: 350°C (Maximum Löyly)\n";
        file << "- Steam Generation Engine: Fully Operational\n";
        file << "- Mämmi & Saunakalja Protocol: Active\n";
        file << "Status: SAUNA PERKELE MODE ENGAGED! TORILLA TAVATAAN! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] SAUNA PERKELE Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create SAUNA PERKELE file!" << std::endl;
    }
    return 0;
}
