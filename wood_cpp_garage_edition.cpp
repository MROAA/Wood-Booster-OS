#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_Garage_Edition.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - Garage & Datsun 240Z Edition\n";
        file << "========================================\n";
        file << "- Classic Car Telemetry (Datsun 240Z): Active\n";
        file << "- Garage Man Cave Control & Dark Walnut Theme: Active\n";
        file << "- Darts Lounge Scoreboard & Audio Integration: Ready\n";
        file << "- Tepa & Rein Collaboration Tools: Connected\n";
        file << "Status: Garage Edition online and ready for action! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] Garage Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create Garage Edition file!" << std::endl;
    }
    return 0;
}
