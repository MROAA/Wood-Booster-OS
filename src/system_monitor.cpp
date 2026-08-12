#include <napi.h>
#include <chrono>

#ifdef _WIN32
#include <windows.h>
#else
#include <sys/sysinfo.h>
#include <unistd.h>
#endif

// Funktio, joka hakee järjestelmän muistitiedot natiivisti
Napi::Value GetSystemStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object stats = Napi::Object::New(env);

    long long totalMemory = 0;
    long long freeMemory = 0;

#ifdef _WIN32
    MEMORYSTATUSEX status;
    status.dwLength = sizeof(status);
    if (GlobalMemoryStatusEx(&status)) {
        totalMemory = status.ullTotalPhys;
        freeMemory = status.ullAvailPhys;
    }
#else
    struct sysinfo si;
    if (sysinfo(&si) == 0) {
        totalMemory = (long long)si.totalram * si.mem_unit;
        freeMemory = (long long)si.freeram * si.mem_unit;
    }
#endif

    stats.Set("totalMemory", Napi::Number::New(env, (double)totalMemory));
    stats.Set("freeMemory", Napi::Number::New(env, (double)freeMemory));
    stats.Set("activeLayers", Napi::Number::New(env, 33)); // Wood-booster OS:n aktiiviset kerrokset
    stats.Set("timestamp", Napi::Number::New(env, (double)std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count()));

    return stats;
}

// Moduulin alustus ja rekisteröinti Node-addoniksi
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    exports.Set("getSystemStats", Napi::Function::New(env, GetSystemStats));
    return exports;
}

NODE_API_MODULE(win96_system_monitor, InitAll)
