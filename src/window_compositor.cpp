#include <napi.h>
#include <vector>
#include <string>
#include <algorithm>

// Ikkunarakenne renderöintipuskurille
struct WindowNode {
    int id;
    std::string title;
    int x, y, width, height;
    int zIndex;
    bool visible;
};

class WindowCompositor {
private:
    std::vector<WindowNode> windows;

public:
    void UpsertWindow(int id, const std::string& title, int x, int y, int w, int h, int zIndex, bool visible) {
        auto it = std::find_if(windows.begin(), windows.end(), [id](const WindowNode& win) {
            return win.id == id;
        });

        if (it != windows.end()) {
            it->title = title;
            it->x = x;
            it->y = y;
            it->width = w;
            it->height = h;
            it->zIndex = zIndex;
            it->visible = visible;
        } else {
            windows.push_back({id, title, x, y, w, h, zIndex, visible});
        }

        // Järjestetään ikkunat zIndex-arvon mukaan renderöintijärjestykseen
        std::sort(windows.begin(), windows.end(), [](const WindowNode& a, const WindowNode& b) {
            return a.zIndex < b.zIndex;
        });
    }

    std::vector<WindowNode> GetRenderList() {
        return windows;
    }
};

static WindowCompositor g_compositor;

// N-API kääreet
Napi::Value CompositorUpsert(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 8) {
        Napi::TypeError::New(env, "Expected 8 arguments for window compositing").ThrowAsJavaScriptException();
        return env.Null();
    }

    int id = info[0].As<Napi::Number>().Int32Value();
    std::string title = info[1].As<Napi::String>();
    int x = info[2].As<Napi::Number>().Int32Value();
    int y = info[3].As<Napi::Number>().Int32Value();
    int w = info[4].As<Napi::Number>().Int32Value();
    int h = info[5].As<Napi::Number>().Int32Value();
    int zIndex = info[6].As<Napi::Number>().Int32Value();
    bool visible = info[7].As<Napi::Boolean>().Value();

    g_compositor.UpsertWindow(id, title, x, y, w, h, zIndex, visible);
    return Napi::Boolean::New(env, true);
}

Napi::Value CompositorGetList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::vector<WindowNode> list = g_compositor.GetRenderList();

    Napi::Array arr = Napi::Array::New(env, list.size());
    for (size_t i = 0; i < list.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("id", list[i].id);
        obj.Set("title", list[i].title);
        obj.Set("x", list[i].x);
        obj.Set("y", list[i].y);
        obj.Set("width", list[i].width);
        obj.Set("height", list[i].height);
        obj.Set("zIndex", list[i].zIndex);
        obj.Set("visible", list[i].visible);
        arr[i] = obj;
    }

    return arr;
}

Napi::Object InitCompositor(Napi::Env env, Napi::Object exports) {
    exports.Set("compositorUpsert", Napi::Function::New(env, CompositorUpsert));
    exports.Set("compositorGetList", Napi::Function::New(env, CompositorGetList));
    return exports;
}

NODE_API_MODULE(win96_compositor, InitCompositor)
