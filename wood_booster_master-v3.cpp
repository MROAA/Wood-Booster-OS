#include <iostream>
#include <fstream>
#include <string>

void create_module(const std::string& filename, const std::string& content) {
    std::ofstream file("/home/marc/Desktop/" + filename);
    if (file.is_open()) {
        file << content;
        file.close();
        std::cout << "[SUCCESS] Generated: " << filename << std::endl;
    } else {
        std::cerr << "[ERROR] Could not create: " << filename << std::endl;
    }
}

int main() {
    std::cout << "--- Wood-Booster OS Master Module Generator ---" << std::endl;

    create_module("Wood-Booster_OPPI.txt", 
        "========================================\n Wood-Booster OS - OPPI & VIISAUS\n========================================\n TIETO ON VOIMAA! 📚💡🇫🇮\n");
    
    create_module("Wood-Booster_SIELU.txt", 
        "========================================\n Wood-Booster OS - SIELU & SYVYYS\n========================================\n SIELUN RAUHA JA METSÄN SYVYYS. 🌲🌌🇫🇮\n");
    
    create_module("Wood-Booster_TIETOISUUS.txt", 
        "========================================\n Wood-Booster OS - TIETOISUUS\n========================================\n TIETOISUUS HERÄÄ! 👁️🌌🇫🇮\n");
    
    create_module("Wood-Booster_VIHA.txt", 
        "========================================\n Wood-Booster OS - VIHA & TULENKATO\n========================================\n ROihUVA RAIVO! 🔥⚡🇫🇮\n");
    
    create_module("Wood-Booster_WIN96.txt", 
        "========================================\n Wood-Booster OS - WIN96 RETRO\n========================================\n KLASSINEN UI! 💻🪟🇫🇮\n");

    create_module("Wood-Booster_IKUISUUS.txt", 
        "========================================\n Wood-Booster OS - IKUISUUS\n========================================\n IKUISUUS ON TÄSSÄ! ⏳♾️🇫🇮\n");
        
    create_module("Wood-Booster_VALO.txt", 
        "========================================\n Wood-Booster OS - VALO & KIRKKAUS\n========================================\n VALO VOITTAA PIMEÄN. KIRKAS NÄKYMÄ! ☀️✨🇫🇮\n");
        
    create_module("Wood-Booster_RAUHA.txt", 
        "========================================\n Wood-Booster OS - RAUHA & TASAPAINO\n========================================\n TYHJYYS JA HILJAISUUS. KAIKKI ON HYVIN. 🧘‍♂️🍃🇫🇮\n");

    std::cout << "--- All modules generated successfully ---" << std::endl;
    return 0;
}
