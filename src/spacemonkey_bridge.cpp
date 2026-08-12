#include <napi.h>
#include <iostream>
#include <string>
#include <map>

class SpacemonkeyEngine {
private:
    bool isReady = false;
    std::map<std::string, std::string> commandHistory;

public:
    bool Initialize() {
        // Tähän voidaan kytkeä varsinainen laitteistotason yhteys
        isReady = true;
        return isReady;
    }

    std::string ProcessCommand(const std::string& cmd) {
        if (!isReady) return "ERR_SPACEMONKEY_NOT_READY";
        
        // Logiikka Spacemonkey-komentojen tulkintaan
        commandHistory[cmd] = "executed";
        return "SUCCESS: Command '" + cmd + "' processed by Spacemonkey core.";
    }
};

static SpacemonkeyEngine g_smEngine;

// N-API kääreet
Napi::Value SMInitialize(const Napi::CallbackInfo& info) {
    bool success = g_smEngine.Initialize();
    return Napi::Boolean::New(info.Env(), success);
}

Napi::Value SMExecute(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String command expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string cmd = info[0].As<Napi::String>();
    std::string response = g_smEngine.ProcessCommand(cmd);
    
    return Napi::String::New(env, response);
}

Napi::Object InitSpacemonkey(Napi::Env env, Napi::Object exports) {
    exports.Set("smInitialize", Napi::Function::New(env, SMInitialize));
    exports.Set("smExecute", Napi::Function::New(env, SMExecute));
    return exports;
}

NODE_API_MODULE(win96_spacemonkey, InitSpacemonkey)
