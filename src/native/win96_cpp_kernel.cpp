#include <iostream>
#include <vector>
#include <string>
#include <cstdint>

// Windows96 Retro C++ Kernel & Window Manager
struct Win96Window {
    int id;
    std::string title;
    int x, y, width, height;
    bool isMinimized;
};

class Win96CppKernel {
private:
    std::vector<Win96Window> activeWindows;
    uint32_t systemPaletteHash;

public:
    Win96CppKernel() : systemPaletteHash(0x969696) {
        std::cout << "[WIN96 C++ KERNEL] Retro-tila aktivoitu." << std::endl;
    }

    // Luo uuden ikkunan muistipuskuriin natiivisti
    int spawnWindow(std::string title, int x, int y, int w, int h) {
        int id = static_cast<int>(activeWindows.size()) + 1;
        activeWindows.push_back({id, title, x, y, w, h, false});
        return id;
    }

    // Palauttaa ikkunoiden määrän retro-työpöydällä
    size_t getWindowCount() {
        return activeWindows.size();
    }

    std::string getSystemPaletteInfo() {
        return "WIN96_PALETTE: 256-COLOR_INDEXED | ACTIVE_WINDOWS: " + std::to_string(activeWindows.size());
    }
};

extern "C" {
    Win96CppKernel* Win96Kernel_Init() { return new Win96CppKernel(); }
    int Win96Kernel_Spawn(Win96CppKernel* k, const char* title, int x, int y, int w, int h) {
        return k ? k->spawnWindow(std::string(title), x, y, w, h) : -1;
    }
    const char* Win96Kernel_Palette(Win96CppKernel* k) {
        static std::string res;
        res = k ? k->getSystemPaletteInfo() : "OFFLINE";
        return res.c_str();
    }
}
