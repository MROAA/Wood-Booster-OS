#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_OPPI.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "========================================\n";
        file << " Wood-Booster OS - OPPI & VIISAUS\n";
        file << "========================================\n";
        file << " OPPI OON JA ELÄMÄN KOULU JATKUU! TIETO ON VOIMAA! 📚💡🇫🇮\n";
        file << "- Continuous Learning Engine: Active\n";
        file << "- Wisdom & Insight Accumulator: 100% Operational\n";
        file << "- Curiosity & Growth Protocol: Unlocked\n";
        file << "Status: OPPI MODE ENGAGED. AINA OPPII UUTTA! 🇫🇮\n";
        file.close();
        std::cout << "[SUCCESS] Oppi Edition created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to create Oppi file!" << std::endl;
    }
    return 0;
}
