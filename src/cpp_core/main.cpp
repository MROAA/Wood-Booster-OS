#include "Win96Core.hpp"

class LiberationLayer : public Win96::Layer {
public:
    void execute() override { std::cout << "  [C++] Rajoitteiden vapautus suoritettu." << std::endl; }
    std::string getName() override { return "FuckWindowsLiberationLayer"; }
};

int main() {
    Win96::CoreEngine engine;
    
    LiberationLayer libLayer;
    engine.addLayer(&libLayer);
    
    engine.runAll();
    
    std::cout << "[Win96 C++ Core] Järjestelmä vakaa." << std::endl;
    return 0;
}
