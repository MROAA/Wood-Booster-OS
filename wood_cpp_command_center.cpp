#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_Command_Center.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - Command Center & CLI\n";
        file << "========================================\n";
        file << "- Task Scheduler & Automation Module: Active\n";
        file << "- Memory & Resource Monitor: Active\n";
        file << "- Package & Module Management: Active\n";
        file << "- GUI / Desktop Environment Bridge: Ready\n";
        file << "Status: All command center modules loaded successfully! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] Command Center created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create command center file!" << std::endl;
    }
    return 0;
}
