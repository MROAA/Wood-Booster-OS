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

    create_module("Wood-Booster_LUMOUS.txt", 
        "========================================\n Wood-Booster OS - LUMOUS & TAIKA\n========================================\n Todellisuuden kangas taipuu. Puhasta taikaa! ✨🔮🇫🇮\n");

    create_module("Wood-Booster_SYNERGIA.txt", 
        "========================================\n Wood-Booster OS - SYNERGIA & YHTEISVAIKUTUS\n========================================\n Yhdessä enemmän kuin osiensa summa! ⚡🤝🇫🇮\n");

    create_module("Wood-Booster_INFINITUM.txt", 
        "========================================\n Wood-Booster OS - INFINITUM & RAJATTOMUUS\n========================================\n Matka jatkuu vailla loppua! 🌌💫🇫🇮\n");

    create_module("Wood-Booster_AURA.txt", 
        "========================================\n Wood-Booster OS - AURA & SUOJAKENTTÄ\n========================================\n Loistava ja läpäisemätön henkinen kilpi! 🛡️✨🇫🇮\n");

    create_module("Wood-Booster_ECHO.txt", 
        "========================================\n Wood-Booster OS - ECHO & KAIKU\n========================================\n Ääni kiertää ja kantaa läpi ajan! 🗣️🔊🇫🇮\n");

    create_module("Wood-Booster_NEXUS.txt", 
        "========================================\n Wood-Booster OS - NEXUS & SOLMUKOHTA\n========================================\n Kaikki tiet kohtaavat ja risteävät tässä! 🌐🔗🇫🇮\n");

    create_module("Wood-Booster_PULS.txt", 
        "========================================\n Wood-Booster OS - PULS & SYKE\n========================================\n Elämän ja järjestelmän tasainen sykkivä sydän! 💓⚡🇫🇮\n");

    create_module("Wood-Booster_AAMU.txt", 
        "========================================\n Wood-Booster OS - AAMU & ENSISIEMEN\n========================================\n Raikas tuore aamu ja uuden päivän sarastus! 🌅☕🇫🇮\n");

    create_module("Wood-Booster_JUURI.txt", 
        "========================================\n Wood-Booster OS - JUURI & MAAPERÄ\n========================================\n Syvällä maassa, tukeva pohja kaikelle elämälle! 🌳🪵🇫🇮\n");

    create_module("Wood-Booster_KIPINÄ.txt", 
        "========================================\n Wood-Booster OS - KIPINÄ & SYTTYMINEN\n========================================\n Pieni kipinälaukaus sytyttää suuren liekin! 🔥✨🇫🇮\n");

    create_module("Wood-Booster_LIIKE.txt", 
        "========================================\n Wood-Booster OS - LIIKE & DYNAMIIKKA\n========================================\n Eteenpäin virtaava muutos ja fyysinen liike! 🏃‍♂️💨🇫🇮\n");

    create_module("Wood-Booster_KIVIJALKA.txt", 
        "========================================\n Wood-Booster OS - KIVIJALKA & VAKAUTUKSEN LAKKI\n========================================\n Vankka ja murtumaton perusta kaikelle toiminnalle! 🏛️⚓🇫🇮\n");

    create_module("Wood-Booster_KORPI.txt", 
        "========================================\n Wood-Booster OS - KORPI & SYVÄ ERÄMAA\n========================================\n Puhdas koskematon luonto ja salattu hiljaisuus! 🌲🐻🇫🇮\n");

    create_module("Wood-Booster_KAAMOS.txt", 
        "========================================\n Wood-Booster OS - KAAMOS & TALVEN SYVÄ YÖ\n========================================\n Pimeyden rauha, revontulet ja sisäinen voima! 🌌❄️🇫🇮\n");

    create_module("Wood-Booster_ROIHUTULI.txt", 
        "========================================\n Wood-Booster OS - ROIHUTULI & LÄMPÖ\n========================================\n Loimuava ja lämmittävä yövalo erämaassa! 🔥🪵🇫🇮\n");

    create_module("Wood-Booster_AAPA.txt", 
        "========================================\n Wood-Booster OS - AAPA & LAAJA SUO\n========================================\n Avoin horisontti, vetiset maat ja vapaa tuuli! 🌾💨🇫🇮\n");

    std::cout << "--- All modules generated successfully ---" << std::endl;
    return 0;
}
