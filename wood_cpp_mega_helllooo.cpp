#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_MEGA_HELLLOOO.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - MEGA HELLLLLLLLLLLLLOOOOOOOOOO EDITION\n";
        file << "========================================\n";
        file << " HELLLLLLLLLLLLLOOOOOOOOOOOOOOOOO! 🔊🚀🇫🇮\n";
        file << "- Quantum Echo Resonance: Maximum\n";
        file << "- Sonic Boom Greeter: Active\n";
        file << "Status: MEGA HELLLOOO DEPLOYED! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] Mega Helllooo Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create Mega Helllooo file!" << std::endl;
    }
    return 0;
}
