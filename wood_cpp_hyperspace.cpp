#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_HYPERSPACE.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - HYPERSPACE JUMP EDITION\n";
        file << "========================================\n";
        file << " HYPERAVARUUS HYPPY! VALONNOPETAUDEN LÄPI! 🌌⚡🇫🇮\n";
        file << "- Warp Speed Propulsion Core: 99.9% Light Speed\n";
        file << "- Interstellar Navigation Matrix: Online\n";
        file << "- Hyperspace Jump Protocol: Engaged\n";
        file << "Status: HYPERSPACE MODE UNLEASHED. TÄHDET VILISEVÄT! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] Hyperspace Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create Hyperspace file!" << std::endl;
    }
    return 0;
}
