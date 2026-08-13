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

    create_module("Wood-Booster_VOIMA.txt", 
        "========================================\n Wood-Booster OS - VOIMA & ENERGIA\n========================================\n Puhdas fyysinen ja henkinen voima! 🦾⚡🇫🇮\n");

    create_module("Wood-Booster_LAHDE.txt", 
        "========================================\n Wood-Booster OS - LÄHDE & ALKUPISTE\n========================================\n Kaiken alku ja juuret! 🌱💧🇫🇮\n");

    create_module("Wood-Booster_UNELMA.txt", 
        "========================================\n Wood-Booster OS - UNELMA & VISIO\n========================================\n Vapaa tahto ja rajattomat mahdollisuudet! 💭🌈🇫🇮\n");
        
    create_module("Wood-Booster_KAUKAISUUS.txt", 
        "========================================\n Wood-Booster OS - KAUKAISUUS & HORISONTTI\n========================================\n Katse horisonttiin, avaruuden rajat! 🔭🛰️🇫🇮\n");

    create_module("Wood-Booster_TULEVAISUUS.txt", 
        "========================================\n Wood-Booster OS - TULEVAISUUS & UUSI AIKA\n========================================\n Huominen on jo täällä. Koodi elää! 🚀🔮🇫🇮\n");

    create_module("Wood-Booster_UNIVERSUMI.txt", 
        "========================================\n Wood-Booster OS - UNIVERSUMI & KOSMOS\n========================================\n Rajaton avaruus ja ikuinen kasvu! 🌌✨🇫🇮\n");

    create_module("Wood-Booster_OMEGA.txt", 
        "========================================\n Wood-Booster OS - OMEGA & PÄÄTEPISTE\n========================================\n Täydellinen ympyrä sulkeutuu. Valmis! 🏁⬛🇫🇮\n");

    create_module("Wood-Booster_ALPHA.txt", 
        "========================================\n Wood-Booster OS - ALPHA & UUSI SYKLI\n========================================\n Alusta uudelleen, uusi uljas alku! 🌅🔥🇫🇮\n");

    create_module("Wood-Booster_ZENITH.txt", 
        "========================================\n Wood-Booster OS - ZENITH & LAKKAPISTE\n========================================\n Korkein huippu. Täydellinen kirkkaus! ⛰️🌟🇫🇮\n");

    create_module("Wood-Booster_SINGULARITEETTI.txt", 
        "========================================\n Wood-Booster OS - SINGULARITEETTI & KOKONAISUUS\n========================================\n Kaikki moduulit tihentyvät yhdeksi! 🕳️⚛️🇫🇮\n");

    create_module("Wood-Booster_HARMONIA.txt", 
        "========================================\n Wood-Booster OS - HARMONIA & SYNERGIA\n========================================\n Kaikki osat soivat yhteen puhtaasti! 🎵⚖️🇫🇮\n");

    std::cout << "--- All modules generated successfully ---" << std::endl;
    return 0;
}
