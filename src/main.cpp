#include <napi.h>
#include <chrono>
#include <unordered_map>
#include <string>
#include <vector>
#include <algorithm>
#include <queue>
#include <functional>

// --- 1. SystemMonitor ---
Napi::Value GetSystemStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object stats = Napi::Object::New(env);
    long long totalMemory = 16106127360;
    long long freeMemory = 8589934592;

    stats.Set("totalMemory", Napi::Number::New(env, (double)totalMemory));
    stats.Set("freeMemory", Napi::Number::New(env, (double)freeMemory));
    stats.Set("activeLayers", Napi::Number::New(env, 33));
    stats.Set("timestamp", Napi::Number::New(env, (double)std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count()));
    return stats;
}

// --- 2. VirtualFileSystem ---
class VirtualFileSystem {
private:
    std::unordered_map<std::string, std::string> storage;
public:
    void WriteFile(const std::string& path, const std::string& content) { storage[path] = content; }
    std::string ReadFile(const std::string& path) {
        auto it = storage.find(path);
        return (it != storage.end()) ? it->second : "";
    }
    std::vector<std::string> ListFiles() {
        std::vector<std::string> files;
        for (const auto& pair : storage) files.push_back(pair.first);
        return files;
    }
};
static VirtualFileSystem g_vfs;

Napi::Value VFSWrite(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    g_vfs.WriteFile(info[0].As<Napi::String>(), info[1].As<Napi::String>());
    return Napi::Boolean::New(env, true);
}

Napi::Value VFSRead(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, g_vfs.ReadFile(info[0].As<Napi::String>()));
}

Napi::Value VFSList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<std::string> files = g_vfs.ListFiles();
    Napi::Array arr = Napi::Array::New(env, files.size());
    for (size_t i = 0; i < files.size(); i++) arr[i] = Napi::String::New(env, files[i]);
    return arr;
}

// --- 3. WindowCompositor ---
struct WindowNode {
    int id; std::string title; int x, y, width, height; int zIndex; bool visible;
};
class WindowCompositor {
private:
    std::vector<WindowNode> windows;
public:
    void UpsertWindow(int id, const std::string& title, int x, int y, int w, int h, int zIndex, bool visible) {
        auto it = std::find_if(windows.begin(), windows.end(), [id](const WindowNode& win) { return win.id == id; });
        if (it != windows.end()) {
            *it = {id, title, x, y, w, h, zIndex, visible};
        } else {
            windows.push_back({id, title, x, y, w, h, zIndex, visible});
        }
        std::sort(windows.begin(), windows.end(), [](const WindowNode& a, const WindowNode& b) { return a.zIndex < b.zIndex; });
    }
    std::vector<WindowNode> GetRenderList() { return windows; }
};
static WindowCompositor g_compositor;

Napi::Value CompositorUpsert(const Napi::CallbackInfo& info) {
    g_compositor.UpsertWindow(
        info[0].As<Napi::Number>().Int32Value(), info[1].As<Napi::String>(),
        info[2].As<Napi::Number>().Int32Value(), info[3].As<Napi::Number>().Int32Value(),
        info[4].As<Napi::Number>().Int32Value(), info[5].As<Napi::Number>().Int32Value(),
        info[6].As<Napi::Number>().Int32Value(), info[7].As<Napi::Boolean>().Value()
    );
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value CompositorGetList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<WindowNode> list = g_compositor.GetRenderList();
    Napi::Array arr = Napi::Array::New(env, list.size());
    for (size_t i = 0; i < list.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("id", list[i].id); obj.Set("title", list[i].title);
        obj.Set("x", list[i].x); obj.Set("y", list[i].y);
        obj.Set("width", list[i].width); obj.Set("height", list[i].height);
        obj.Set("zIndex", list[i].zIndex); obj.Set("visible", list[i].visible);
        arr[i] = obj;
    }
    return arr;
}

// --- 4. SpacemonkeyEngine ---
class SpacemonkeyEngine {
public:
    std::string ProcessCommand(const std::string& cmd) {
        return "SUCCESS: Command '" + cmd + "' processed by Spacemonkey core.";
    }
};
static SpacemonkeyEngine g_smEngine;

Napi::Value SMInitialize(const Napi::CallbackInfo& info) {
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value SMExecute(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string cmd = info[0].As<Napi::String>();
    return Napi::String::New(env, g_smEngine.ProcessCommand(cmd));
}

// --- 5. ThreadScheduler ---
struct KernelTask {
    int taskId;
    std::string name;
    int priority;
};

class ThreadScheduler {
private:
    std::vector<KernelTask> tasks;
public:
    void AddTask(int id, const std::string& name, int priority) {
        tasks.push_back({id, name, priority});
        std::sort(tasks.begin(), tasks.end(), [](const KernelTask& a, const KernelTask& b) {
            return a.priority > b.priority;
        });
    }
    std::vector<KernelTask> GetTasks() { return tasks; }
};
static ThreadScheduler g_scheduler;

Napi::Value KernelAddTask(const Napi::CallbackInfo& info) {
    g_scheduler.AddTask(
        info[0].As<Napi::Number>().Int32Value(),
        info[1].As<Napi::String>(),
        info[2].As<Napi::Number>().Int32Value()
    );
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value KernelGetTasks(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<KernelTask> list = g_scheduler.GetTasks();
    Napi::Array arr = Napi::Array::New(env, list.size());
    for (size_t i = 0; i < list.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("taskId", list[i].taskId);
        obj.Set("name", list[i].name);
        obj.Set("priority", list[i].priority);
        arr[i] = obj;
    }
    return arr;
}

// --- 6. HardwareBuffer ---
class HardwareBuffer {
private:
    std::vector<unsigned char> buffer;
public:
    void Allocate(size_t size) { buffer.resize(size, 0); }
    size_t GetSize() { return buffer.size(); }
};
static HardwareBuffer g_hwBuffer;

Napi::Value HBAllocate(const Napi::CallbackInfo& info) {
    size_t size = info[0].As<Napi::Number>().Int64Value();
    g_hwBuffer.Allocate(size);
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value HBGetSize(const Napi::CallbackInfo& info) {
    return Napi::Number::New(info.Env(), (double)g_hwBuffer.GetSize());
}

// --- 7. IPCMessageQueue ---
struct IPCMessage {
    std::string sender;
    std::string receiver;
    std::string payload;
};

class IPCMessageQueue {
private:
    std::vector<IPCMessage> messages;
public:
    void Send(const std::string& sender, const std::string& receiver, const std::string& payload) {
        messages.push_back({sender, receiver, payload});
    }
    std::vector<IPCMessage> Receive(const std::string& receiver) {
        std::vector<IPCMessage> result;
        for (const auto& msg : messages) {
            if (msg.receiver == receiver || msg.receiver == "broadcast") {
                result.push_back(msg);
            }
        }
        return result;
    }
};
static IPCMessageQueue g_ipcQueue;

Napi::Value IPCSend(const Napi::CallbackInfo& info) {
    g_ipcQueue.Send(
        info[0].As<Napi::String>(),
        info[1].As<Napi::String>(),
        info[2].As<Napi::String>()
    );
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value IPCReceive(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string receiver = info[0].As<Napi::String>();
    std::vector<IPCMessage> list = g_ipcQueue.Receive(receiver);
    
    Napi::Array arr = Napi::Array::New(env, list.size());
    for (size_t i = 0; i < list.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("sender", list[i].sender);
        obj.Set("receiver", list[i].receiver);
        obj.Set("payload", list[i].payload);
        arr[i] = obj;
    }
    return arr;
}

// --- 8. HardwareRegister ---
class HardwareRegisterMap {
private:
    std::unordered_map<std::string, int> registers;
public:
    void SetReg(const std::string& reg, int val) { registers[reg] = val; }
    int GetReg(const std::string& reg) {
        auto it = registers.find(reg);
        return (it != registers.end()) ? it->second : 0;
    }
};
static HardwareRegisterMap g_hwRegisters;

Napi::Value HWSetReg(const Napi::CallbackInfo& info) {
    g_hwRegisters.SetReg(
        info[0].As<Napi::String>(),
        info[1].As<Napi::Number>().Int32Value()
    );
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value HWGetReg(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string reg = info[0].As<Napi::String>();
    return Napi::Number::New(env, g_hwRegisters.GetReg(reg));
}

// --- 9. UUSI: VirtualMemoryPaging (Muistisivutus) ---
struct PageTableEntry {
    int pageId;
    bool present;
    bool dirty;
};

class VirtualMemoryPaging {
private:
    std::unordered_map<int, PageTableEntry> pages;
public:
    void SetPage(int pageId, bool present, bool dirty) {
        pages[pageId] = {pageId, present, dirty};
    }
    PageTableEntry GetPage(int pageId) {
        auto it = pages.find(pageId);
        if (it != pages.end()) return it->second;
        return {pageId, false, false};
    }
};
static VirtualMemoryPaging g_vmPaging;

Napi::Value VMPagingSet(const Napi::CallbackInfo& info) {
    g_vmPaging.SetPage(
        info[0].As<Napi::Number>().Int32Value(),
        info[1].As<Napi::Boolean>().Value(),
        info[2].As<Napi::Boolean>().Value()
    );
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value VMPagingGet(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int pageId = info[0].As<Napi::Number>().Int32Value();
    PageTableEntry entry = g_vmPaging.GetPage(pageId);
    
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("pageId", entry.pageId);
    obj.Set("present", entry.present);
    obj.Set("dirty", entry.dirty);
    return obj;
}

// --- 10. UUSI: InterruptVectorTable (Laitteistokeskeytykset) ---
class InterruptVectorTable {
private:
    std::unordered_map<int, std::string> handlers;
public:
    void RegisterHandler(int irq, const std::string& name) {
        handlers[irq] = name;
    }
    std::string Trigger(int irq) {
        auto it = handlers.find(irq);
        if (it != handlers.end()) {
            return "IRQ_" + std::to_string(irq) + "_HANDLED_BY_" + it->second;
        }
        return "IRQ_UNHANDLED";
    }
};
static InterruptVectorTable g_ivt;

Napi::Value IVTRegister(const Napi::CallbackInfo& info) {
    g_ivt.RegisterHandler(
        info[0].As<Napi::Number>().Int32Value(),
        info[1].As<Napi::String>()
    );
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value IVTTrigger(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int irq = info[0].As<Napi::Number>().Int32Value();
    std::string res = g_ivt.Trigger(irq);
    return Napi::String::New(env, res);
}

// --- Moduulien rekisteröinti ytimeen ---
Napi::Object InitCore(Napi::Env env, Napi::Object exports) {
    exports.Set("getSystemStats", Napi::Function::New(env, GetSystemStats));
    exports.Set("vfsWrite", Napi::Function::New(env, VFSWrite));
    exports.Set("vfsRead", Napi::Function::New(env, VFSRead));
    exports.Set("vfsList", Napi::Function::New(env, VFSList));
    exports.Set("compositorUpsert", Napi::Function::New(env, CompositorUpsert));
    exports.Set("compositorGetList", Napi::Function::New(env, CompositorGetList));
    exports.Set("smInitialize", Napi::Function::New(env, SMInitialize));
    exports.Set("smExecute", Napi::Function::New(env, SMExecute));
    exports.Set("kernelAddTask", Napi::Function::New(env, KernelAddTask));
    exports.Set("kernelGetTasks", Napi::Function::New(env, KernelGetTasks));
    exports.Set("hbAllocate", Napi::Function::New(env, HBAllocate));
    exports.Set("hbGetSize", Napi::Function::New(env, HBGetSize));
    exports.Set("ipcSend", Napi::Function::New(env, IPCSend));
    exports.Set("ipcReceive", Napi::Function::New(env, IPCReceive));
    exports.Set("hwSetReg", Napi::Function::New(env, HWSetReg));
    exports.Set("hwGetReg", Napi::Function::New(env, HWGetReg));
    // Uudet sivutus- ja keskeytysmoduulit
    exports.Set("vmPagingSet", Napi::Function::New(env, VMPagingSet));
    exports.Set("vmPagingGet", Napi::Function::New(env, VMPagingGet));
    exports.Set("ivtRegister", Napi::Function::New(env, IVTRegister));
    exports.Set("ivtTrigger", Napi::Function::New(env, IVTTrigger));

    return exports;
}

NODE_API_MODULE(win96_core, InitCore)
