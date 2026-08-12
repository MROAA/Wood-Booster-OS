#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string filename = "/home/marc/Desktop/Wood-Booster_Note.txt";
    std::ofstream outFile(filename);
    if (outFile.is_open()) {
        outFile << "Tervehdys Marc! Wood-Booster OS toimii.\n";
        outFile.close();
        std::cout << "[SUCCESS] Created: " << filename << std::endl;
    } else {
        std::cerr << "[ERROR] Failed!" << std::endl;
    }
    return 0;
}
