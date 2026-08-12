#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::string path = "/home/marc/Desktop/Wood-Booster_Features.txt";
    std::ofstream file(path);
    if (file.is_open()) {
        file << "Wood-Booster OS - Expanded Features Active!\n";
        file.close();
        std::cout << "[SUCCESS] Created: " << path << std::endl;
    } else {
        std::cerr << "[ERROR] Failed!" << std::endl;
    }
    return 0;
}
