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

// --- 9. VirtualMemoryPaging ---
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

// --- 10. InterruptVectorTable ---
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

// --- 11. AudioMixerEngine ---
struct AudioChannel {
    int channelId;
    std::string soundName;
    float volume;
    bool playing;
};

class AudioMixerEngine {
private:
    std::unordered_map<int, AudioChannel> channels;
public:
    void PlaySound(int id, const std::string& name, float vol) {
        channels[id] = {id, name, vol, true};
    }
    std::vector<AudioChannel> GetActiveChannels() {
        std::vector<AudioChannel> active;
        for (const auto& pair : channels) {
            if (pair.second.playing) active.push_back(pair.second);
        }
        return active;
    }
};
static AudioMixerEngine g_audioMixer;

Napi::Value AudioPlay(const Napi::CallbackInfo& info) {
    g_audioMixer.PlaySound(
        info[0].As<Napi::Number>().Int32Value(),
        info[1].As<Napi::String>(),
        (float)info[2].As<Napi::Number>().DoubleValue()
    );
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value AudioGetActive(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<AudioChannel> list = g_audioMixer.GetActiveChannels();
    Napi::Array arr = Napi::Array::New(env, list.size());
    for (size_t i = 0; i < list.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("channelId", list[i].channelId);
        obj.Set("soundName", list[i].soundName);
        obj.Set("volume", list[i].volume);
        obj.Set("playing", list[i].playing);
        arr[i] = obj;
    }
    return arr;
}

// --- 12. NetworkSocketTable ---
struct SocketConnection {
    int socketId;
    std::string host;
    int port;
    bool connected;
};

class NetworkSocketTable {
private:
    std::unordered_map<int, SocketConnection> sockets;
public:
    bool Connect(int id, const std::string& host, int port) {
        sockets[id] = {id, host, port, true};
        return true;
    }
    std::vector<SocketConnection> GetSockets() {
        std::vector<SocketConnection> list;
        for (const auto& pair : sockets) list.push_back(pair.second);
        return list;
    }
};
static NetworkSocketTable g_netSockets;

Napi::Value NetConnect(const Napi::CallbackInfo& info) {
    bool res = g_netSockets.Connect(
        info[0].As<Napi::Number>().Int32Value(),
        info[1].As<Napi::String>(),
        info[2].As<Napi::Number>().Int32Value()
    );
    return Napi::Boolean::New(info.Env(), res);
}

Napi::Value NetGetSockets(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<SocketConnection> list = g_netSockets.GetSockets();
    Napi::Array arr = Napi::Array::New(env, list.size());
    for (size_t i = 0; i < list.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("socketId", list[i].socketId);
        obj.Set("host", list[i].host);
        obj.Set("port", list[i].port);
        obj.Set("connected", list[i].connected);
        arr[i] = obj;
    }
    return arr;
}

// --- 13. UUSI: ProcessMonitor (Käyttäjäprosessien taulu) ---
struct KernelProcess {
    int pid;
    std::string name;
    std::string status;
};

class ProcessMonitor {
private:
    std::unordered_map<int, KernelProcess> processes;
public:
    void Spawn(int pid, const std::string& name, const std::string& status) {
        processes[pid] = {pid, name, status};
    }
    void Kill(int pid) {
        processes.erase(pid);
    }
    std::vector<KernelProcess> ListProcesses() {
        std::vector<KernelProcess> list;
        for (const auto& pair : processes) list.push_back(pair.second);
        return list;
    }
};
static ProcessMonitor g_processMonitor;

Napi::Value ProcSpawn(const Napi::CallbackInfo& info) {
    g_processMonitor.Spawn(
        info[0].As<Napi::Number>().Int32Value(),
        info[1].As<Napi::String>(),
        info[2].As<Napi::String>()
    );
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value ProcList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<KernelProcess> list = g_processMonitor.ListProcesses();
    Napi::Array arr = Napi::Array::New(env, list.size());
    for (size_t i = 0; i < list.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("pid", list[i].pid);
        obj.Set("name", list[i].name);
        obj.Set("status", list[i].status);
        arr[i] = obj;
    }
    return arr;
}

// --- 14. UUSI: KernelLoggerRingBuffer (Ytimen lokipuskuri) ---
class KernelLoggerRingBuffer {
private:
    std::vector<std::string> logs;
    size_t maxSize = 100;
public:
    void Log(const std::string& message) {
        if (logs.size() >= maxSize) {
            logs.erase(logs.begin());
        }
        logs.push_back(message);
    }
    std::vector<std::string> GetLogs() {
        return logs;
    }
};
static KernelLoggerRingBuffer g_kernelLogger;

Napi::Value KernelLog(const Napi::CallbackInfo& info) {
    g_kernelLogger.Log(info[0].As<Napi::String>());
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value KernelGetLogs(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<std::string> logs = g_kernelLogger.GetLogs();
    Napi::Array arr = Napi::Array::New(env, logs.size());
    for (size_t i = 0; i < logs.size(); i++) {
        arr[i] = Napi::String::New(env, logs[i]);
    }
    return arr;
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
    exports.Set("vmPagingSet", Napi::Function::New(env, VMPagingSet));
    exports.Set("vmPagingGet", Napi::Function::New(env, VMPagingGet));
    exports.Set("ivtRegister", Napi::Function::New(env, IVTRegister));
    exports.Set("ivtTrigger", Napi::Function::New(env, IVTTrigger));
    exports.Set("audioPlay", Napi::Function::New(env, AudioPlay));
    exports.Set("audioGetActive", Napi::Function::New(env, AudioGetActive));
    exports.Set("netConnect", Napi::Function::New(env, NetConnect));
    exports.Set("netGetSockets", Napi::Function::New(env, NetGetSockets));
    // Uudet prosessi- ja lokimoduulit
    exports.Set("procSpawn", Napi::Function::New(env, ProcSpawn));
    exports.Set("procList", Napi::Function::New(env, ProcList));
    exports.Set("kernelLog", Napi::Function::New(env, KernelLog));
    exports.Set("kernelGetLogs", Napi::Function::New(env, KernelGetLogs));

    return exports;
}

NODE_API_MODULE(win96_core, InitCore)
