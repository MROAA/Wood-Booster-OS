#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_INTO_PERKELE.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - INTO & ENERGIA EDITION\n";
        file << "========================================\n";
        file << " INTOA TÄYTEEN KUN HÖYRYJYRÄ! TULITIKUSTA TULIMEREKSI! 🔥⚡🇫🇮\n";
        file << "- Pure Momentum & Motivation Engine: 9999 RPM\n";
        file << "- Productivity Surge Protocol: Maximum Overdrive\n";
        file << "- Kaffe & Kahvi Booster: Unlimited Refills\n";
        file << "Status: INTO MODE UNLEASHED! HOMMAT HOIDETAAN! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] INTO Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create INTO file!" << std::endl;
    }
    return 0;
}
