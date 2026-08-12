#include <napi.h>
#include "Win96Core.hpp"

Napi::String ExecuteNativeLayers(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    Win96::CoreEngine engine;
    std::string result = engine.runAllNative();
    
    return Napi::String::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "executeNativeLayers"), Napi::Function::New(env, ExecuteNativeLayers));
    return exports;
}

NODE_API_MODULE(win96_core, Init)
