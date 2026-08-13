#include <napi.h>
#include <unordered_map>
#include <string>
#include <vector>

// Yksinkertainen in-memory VFS-välimuisti natiivilla puolella nopeisiin lukuoperaatioihin
class VirtualFileSystem {
private:
    std::unordered_map<std::string, std::string> storage;

public:
    void WriteFile(const std::string& path, const std::string& content) {
        storage[path] = content;
    }

    std::string ReadFile(const std::string& path) {
        auto it = storage.find(path);
        if (it != storage.end()) {
            return it->second;
        }
        return "";
    }

    bool Exists(const std::string& path) {
        return storage.find(path) != storage.end();
    }

    std::vector<std::string> ListFiles() {
        std::vector<std::string> files;
        for (const auto& pair : storage) {
            files.push_back(pair.first);
        }
        return files;
    }
};

// Globaali VFS-instanssi ytimelle
static VirtualFileSystem g_vfs;

// N-API kääreet
Napi::Value VFSWrite(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "String path and content expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string path = info[0].As<Napi::String>();
    std::string content = info[1].As<Napi::String>();
    
    g_vfs.WriteFile(path, content);
    return Napi::Boolean::New(env, true);
}

Napi::Value VFSRead(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String path expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string path = info[0].As<Napi::String>();
    std::string content = g_vfs.ReadFile(path);
    
    return Napi::String::New(env, content);
}

Napi::Value VFSList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<std::string> files = g_vfs.ListFiles();
    
    Napi::Array arr = Napi::Array::New(env, files.size());
    for (size_t i = 0; i < files.size(); i++) {
        arr[i] = Napi::String::New(env, files[i]);
    }
    
    return arr;
}

Napi::Object InitVFS(Napi::Env env, Napi::Object exports) {
    exports.Set("vfsWrite", Napi::Function::New(env, VFSWrite));
    exports.Set("vfsRead", Napi::Function::New(env, VFSRead));
    exports.Set("vfsList", Napi::Function::New(env, VFSList));
    return exports;
}

NODE_API_MODULE(win96_vfs, InitVFS)
