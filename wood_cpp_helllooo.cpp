#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_HELLLOOO_Edition.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - HELLLOOOOOOOOOOOO EDITION\n";
        file << "========================================\n";
        file << " HELLLOOOOOOOOOOOOOOOOOOOOOOOooo! 🚀🇫🇮\n";
        file << "- Maximum Volume & Echo Engine: Active\n";
        file << "- Infinite Loop Greeting Protocol: Online\n";
        file << "Status: HELLLOOO MODE FULLY ENGAGED! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] HELLLOOO Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create HELLLOOO file!" << std::endl;
    }
    return 0;
}
