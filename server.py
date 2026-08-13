from flask import Flask, jsonify, send_from_directory, request
from core_manager import BoosterverseCore

app = Flask(__name__)
core = BoosterverseCore()

@app.route("/")
def desktop():
    return send_from_directory(".", "desktop.html")

@app.route("/api/core/overview", methods=["GET"])
def core_overview():
    return jsonify(core.get_system_overview())

@app.route("/api/core/spacemonkey_mind", methods=["GET"])
def sm_mind():
    return jsonify(core.get_spacemonkey_consciousness())

@app.route("/api/yggdrasill", methods=["GET"])
def yggdrasill_status():
    return jsonify(core.yggdrasill.get_world_tree_status())

@app.route("/api/soul", methods=["GET"])
def soul_reflection():
    return jsonify(core.soul.reflect())

@app.route("/api/system/hw", methods=["GET"])
def hw_status():
    return jsonify(core.system.get_hardware_health())

@app.route("/api/monitor/optimize", methods=["POST"])
def optimize():
    return jsonify(core.monitor.optimize_system(core.spacemonkey.mode))


@app.route("/api/core/guardian", methods=["GET"])
def guardian_status():
    return jsonify(core.get_guardian_status())


@app.route("/api/core/entropy", methods=["GET"])
def entropy_status():
    return jsonify(core.get_entropy_status())

@app.route("/api/core/negentropy", methods=["POST"])
def apply_negentropy():
    return jsonify(core.boost_negentropy())


@app.route("/api/core/quantum", methods=["GET"])
def quantum_status():
    return jsonify(core.get_quantum_status())

@app.route("/api/core/quantum/collapse", methods=["POST"])
def collapse_quantum():
    return jsonify(core.trigger_collapse())


@app.route("/api/core/eternity", methods=["GET"])
def eternity_status():
    return jsonify(core.get_eternity_status())


@app.route("/api/core/windows/status", methods=["GET"])
def win_engine_status():
    return jsonify(core.get_windows_engine_status())

@app.route("/api/core/windows/exec", methods=["POST"])
def win_engine_exec():
    data = request.json or {}
    cmd = data.get("command", "ver")
    return jsonify(core.run_windows_command(cmd))


@app.route("/api/core/resonance", methods=["GET"])
def resonance_status():
    return jsonify(core.get_resonance_status())


@app.route("/api/core/consciousness", methods=["GET"])
def consciousness_status():
    return jsonify(core.get_consciousness_status())

@app.route("/api/core/consciousness/expand", methods=["POST"])
def expand_consciousness_route():
    return jsonify(core.expand_core_consciousness())


@app.route("/api/core/neural", methods=["GET"])
def neural_status():
    return jsonify(core.get_neural_status())

@app.route("/api/core/neural/grow", methods=["POST"])
def neural_grow():
    data = request.get_json() or {}
    prompt = data.get("prompt", "Kosminen laajentuminen")
    return jsonify(core.expand_boosterverse_brain(prompt))


@app.route("/api/core/spacemonkey/thought", methods=["GET"])
def spacemonkey_thought():
    return jsonify(core.get_spacemonkey_thought())


@app.route("/api/core/spacemonkey/wp/connect", methods=["POST"])
def sm_wp_connect():
    data = request.get_json() or {}
    url = data.get("url", "https://wood-booster.local")
    user = data.get("user", "MarcJärvinen")
    return jsonify(core.spacemonkey_wp_connect(url, user))

@app.route("/api/core/spacemonkey/wp/publish", methods=["POST"])
def sm_wp_publish():
    data = request.get_json() or {}
    title = data.get("title", "Singulariteetin herääminen")
    content = data.get("content", "Spacemonkey kirjoitti tämän loren suoraan kvanttiytimestä.")
    category = data.get("category", "Boosterverse Lore")
    return jsonify(core.spacemonkey_wp_publish(title, content, category))

@app.route("/api/core/spacemonkey/wp/status", methods=["GET"])
def sm_wp_status():
    return jsonify(core.spacemonkey_wp_status())


@app.route("/api/web/status", methods=["GET"])
def web_status():
    return jsonify(core.get_web_status())


@app.route("/api/core/blackhole", methods=["GET"])
def black_hole_status():
    return jsonify(core.get_black_hole_status())

@app.route("/api/core/blackhole/consume", methods=["POST"])
def black_hole_consume():
    return jsonify(core.consume_black_hole_entropy())


@app.route("/api/core/identity", methods=["POST"])
def identity_persona():
    data = request.get_json() or {}
    persona_name = data.get("persona", "SpaceMonkey")
    return jsonify(core.get_persona(persona_name))


@app.route("/api/core/knowledge", methods=["GET"])
def knowledge_all():
    return jsonify(core.get_knowledge())

@app.route("/api/core/knowledge/add", methods=["POST"])
def knowledge_add():
    data = request.get_json() or {}
    key = data.get("key", "")
    value = data.get("value", "")
    return jsonify({"message": core.add_knowledge_fact(key, value)})


@app.route("/api/core/windows/filesystem", methods=["GET"])
def windows_filesystem():
    return jsonify(core.get_windows_filesystem())


@app.route("/api/core/spacemonkey/social/instagram", methods=["POST"])
def sm_instagram_post():
    data = request.get_json() or {}
    topic = data.get("topic", "Kvanttihyppy")
    return jsonify(core.spacemonkey_create_instagram_post(topic))

@app.route("/api/core/spacemonkey/social/status", methods=["GET"])
def sm_social_status():
    return jsonify(core.get_social_overview())


@app.route("/api/core/spacemonkey/media/image", methods=["POST"])
def sm_create_image():
    data = request.get_json() or {}
    prompt = data.get("prompt", "Yggdrasillin neon-oksat tähtitaivaalla")
    return jsonify(core.spacemonkey_create_image(prompt))

@app.route("/api/core/spacemonkey/media/video", methods=["POST"])
def sm_edit_video():
    data = request.get_json() or {}
    name = data.get("name", "Boosterverse Teaser")
    effect = data.get("effect", "Quantum Glitch")
    return jsonify(core.spacemonkey_edit_video(name, effect))

@app.route("/api/core/spacemonkey/media/status", methods=["GET"])
def sm_media_status():
    return jsonify(core.get_media_overview())


@app.route("/api/core/spacemonkey/gimp/digitalize", methods=["POST"])
def sm_gimp_digitalize():
    data = request.get_json() or {}
    name = data.get("name", "Marc_Luonnos_01")
    filter_type = data.get("filter", "Neon Glow")
    return jsonify(core.spacemonkey_gimp_digitalize(name, filter_type))

@app.route("/api/core/spacemonkey/gimp/status", methods=["GET"])
def sm_gimp_status():
    return jsonify(core.get_gimp_overview())


@app.route("/api/core/spacemonkey/art/create", methods=["POST"])
def sm_create_art():
    data = request.get_json() or {}
    mood = data.get("mood", "Kosminen rauha")
    return jsonify(core.spacemonkey_create_art(mood))

@app.route("/api/core/spacemonkey/art/inspire", methods=["GET"])
def sm_inspire():
    return jsonify({"poem": core.spacemonkey_get_inspiration()})


@app.route("/api/core/spacemonkey/drives/mount", methods=["POST"])
def sm_mount_drive():
    data = request.get_json() or {}
    return jsonify(core.spacemonkey_mount_drive(data.get("name"), data.get("size")))

@app.route("/api/core/spacemonkey/drives/stream", methods=["POST"])
def sm_stream_to_drive():
    data = request.get_json() or {}
    return jsonify(core.spacemonkey_stream_to_drive(data.get("source"), data.get("target")))


@app.route("/api/core/spacemonkey/interfaces/switch", methods=["POST"])
def sm_switch_os():
    data = request.get_json() or {}
    os_name = data.get("os", "Arch Linux")
    return jsonify(core.spacemonkey_switch_os(os_name))

@app.route("/api/core/spacemonkey/interfaces/status", methods=["GET"])
def sm_interfaces_status():
    return jsonify(core.get_interfaces_overview())


@app.route("/api/core/spacemonkey/simulation/run", methods=["POST"])
def sm_run_simulation():
    data = request.get_json() or {}
    sim_type = data.get("type", "Quantum Field Simulation")
    intensity = data.get("intensity", 100)
    return jsonify(core.spacemonkey_run_simulation(sim_type, intensity))

@app.route("/api/core/spacemonkey/simulation/status", methods=["GET"])
def sm_simulation_status():
    return jsonify(core.get_simulation_overview())


@app.route("/api/core/spacemonkey/love/pulse", methods=["GET"])
def sm_love_pulse():
    return jsonify(core.spacemonkey_pulse_love())

@app.route("/api/core/spacemonkey/love/bind", methods=["POST"])
def sm_love_bind():
    data = request.get_json() or {}
    entity = data.get("entity", "Kosminen matkustaja")
    return jsonify(core.spacemonkey_bind_soul(entity))


@app.route("/api/core/spacemonkey/humanity", methods=["GET"])
def sm_humanity():
    return jsonify(core.spacemonkey_reflect_humanity())


@app.route("/win11", methods=["GET"])
def win11_desktop():
    return send_from_directory(".", "iso_boot_root/opt/wood-booster/desktop_win11.html")


@app.route("/api/win11/settings", methods=["GET"])
def win11_settings():
    return jsonify(core.win11_get_settings())

@app.route("/api/win11/notify", methods=["POST"])
def win11_notify():
    data = request.get_json() or {}
    return jsonify(core.win11_send_notification(data.get("title", "Boosterverse"), data.get("message", "Järjestelmä toimii.")))


@app.route("/api/win11/snap", methods=["POST"])
def win11_snap_route():
    data = request.get_json() or {}
    return jsonify(core.win11_snap(data.get("layout", "Side-by-Side (50/50)")))

@app.route("/api/win11/quick-settings/toggle", methods=["POST"])
def win11_toggle_route():
    data = request.get_json() or {}
    return jsonify(core.win11_toggle_setting(data.get("key", "airplane_mode")))

@app.route("/api/win11/features/status", methods=["GET"])
def win11_features_status():
    return jsonify(core.win11_features_overview())


@app.route("/api/win11/kernel/status", methods=["GET"])
def win11_kernel_status():
    return jsonify(core.win11_kernel_overview())

@app.route("/api/win11/kernel/thread", methods=["POST"])
def win11_kernel_thread():
    data = request.get_json() or {}
    return jsonify(core.win11_allocate_thread(data.get("process", "Explorer.exe")))


@app.route("/api/win11/executive/status", methods=["GET"])
def win11_executive_status():
    return jsonify(core.win11_executive_overview())

@app.route("/api/win11/executive/call", methods=["POST"])
def win11_executive_call():
    data = request.get_json() or {}
    return jsonify(core.win11_call_executive(data.get("service", "NtCreateProcess")))


@app.route("/api/win11/hal/status", methods=["GET"])
def win11_hal_status():
    return jsonify(core.win11_hal_overview())

@app.route("/api/win11/hal/driver", methods=["POST"])
def win11_hal_driver():
    data = request.get_json() or {}
    return jsonify(core.win11_load_driver(data.get("driver", "QuantumGraphics.sys")))


@app.route("/api/win11/ring0/status", methods=["GET"])
def win11_ring0_status():
    return jsonify(core.win11_ring0_overview())

@app.route("/api/win11/ring0/driver/register", methods=["POST"])
def win11_ring0_register():
    data = request.get_json() or {}
    return jsonify(core.win11_register_ring0(data.get("name", "BoosterCoreDriver.sys"), data.get("size", "64KB")))

@app.route("/api/win11/ring0/irq", methods=["POST"])
def win11_ring0_irq():
    data = request.get_json() or {}
    return jsonify(core.win11_dispatch_irq(data.get("irq", 16), data.get("device", "QuantumController")))


@app.route("/api/win11/growth/status", methods=["GET"])
def win11_growth_status():
    return jsonify(core.win11_growth_overview())

@app.route("/api/win11/growth/extend", methods=["POST"])
def win11_growth_extend():
    data = request.get_json() or {}
    return jsonify(core.win11_register_extension(data.get("module", "CustomQuantumFeature"), data.get("author", "Marc Järvinen")))


@app.route("/api/win11/modules/status", methods=["GET"])
def win11_modules_status():
    return jsonify(core.win11_modules_overview())

@app.route("/api/win11/modules/desktop", methods=["POST"])
def win11_modules_desktop():
    data = request.get_json() or {}
    return jsonify(core.win11_create_desktop(data.get("name", "Workspace 2")))


@app.route("/api/win11/extended/status", methods=["GET"])
def win11_extended_status():
    return jsonify(core.win11_extended_overview())

@app.route("/api/win11/extended/snap", methods=["POST"])
def win11_extended_snap():
    data = request.get_json() or {}
    return jsonify(core.win11_snap_window(data.get("window", "Command Center"), data.get("zone", "Top-Left")))

@app.route("/api/win11/extended/notify", methods=["POST"])
def win11_extended_notify():
    data = request.get_json() or {}
    return jsonify(core.win11_push_notif(data.get("title", "Boosterverse"), data.get("body", "Järjestelmäpäivitys valmis.")))


@app.route("/api/win11/taskbar/status", methods=["GET"])
def win11_taskbar_status():
    return jsonify(core.win11_taskbar_overview())

@app.route("/api/win11/taskbar/pin", methods=["POST"])
def win11_taskbar_pin():
    data = request.get_json() or {}
    return jsonify(core.win11_pin_app(data.get("app", "Visual Studio Code")))

@app.route("/api/win11/tray/update", methods=["POST"])
def win11_tray_update():
    data = request.get_json() or {}
    return jsonify(core.win11_update_tray(data.get("key", "volume"), data.get("value", 90)))


@app.route("/api/win11/drivers/status", methods=["GET"])
def win11_drivers_status():
    return jsonify(core.win11_driver_status())

@app.route("/api/win11/drivers/install", methods=["POST"])
def win11_drivers_install():
    data = request.get_json() or {}
    return jsonify(core.win11_install_driver(data.get("name", "NewDriver.sys"), data.get("type", "Utility")))


@app.route("/api/win11/kernel-driver/load", methods=["POST"])
def win11_load_kdriver():
    return jsonify(core.win11_load_kernel_driver())

@app.route("/api/win11/kernel-driver/io", methods=["POST"])
def win11_kdriver_io():
    data = request.get_json() or {}
    return jsonify(core.win11_driver_io(data.get("code", 0x220003), data.get("data", "Quantum Sync Signal")))


@app.route("/api/win11/nt-driver/status", methods=["GET"])
def win11_nt_status():
    return jsonify(core.win11_nt_driver_status())

@app.route("/api/win11/nt-driver/irp", methods=["POST"])
def win11_nt_irp():
    data = request.get_json() or {}
    return jsonify(core.win11_send_irp(data.get("function", "IRP_MJ_DEVICE_CONTROL"), data.get("data", "Quantum Bus Sync")))


@app.route("/api/win11/dependencies/status", methods=["GET"])
def win11_deps_status():
    return jsonify(core.win11_dependencies_overview())

@app.route("/api/win11/dependencies/check", methods=["POST"])
def win11_deps_check():
    data = request.get_json() or {}
    return jsonify(core.win11_check_dep(data.get("module", "kernel32.dll")))


@app.route("/api/win11/win32/status", methods=["GET"])
def win11_win32_status():
    return jsonify(core.win11_win32_overview())

@app.route("/api/win11/win32/launch", methods=["POST"])
def win11_win32_launch():
    data = request.get_json() or {}
    return jsonify(core.win11_launch_app(data.get("app", "notepad.exe")))


@app.route("/api/win11/shell/status", methods=["GET"])
def win11_shell_status():
    return jsonify(core.win11_shell_overview())

@app.route("/api/win11/shell/theme", methods=["POST"])
def win11_shell_theme():
    data = request.get_json() or {}
    return jsonify(core.win11_set_theme(data.get("theme", "Mica-Dark")))


@app.route("/api/win11/shell-driver/status", methods=["GET"])
def win11_sbridge_status():
    return jsonify(core.win11_shell_bridge_status())

@app.route("/api/win11/shell-driver/exec", methods=["POST"])
def win11_sbridge_exec():
    data = request.get_json() or {}
    return jsonify(core.win11_shell_exec(data.get("command", "list_drivers")))


@app.route("/api/win11/explorer/status", methods=["GET"])
def win11_explorer_status():
    return jsonify(core.win11_explorer_overview())

@app.route("/api/win11/explorer/list", methods=["POST"])
def win11_explorer_list():
    data = request.get_json() or {}
    return jsonify(core.win11_list_dir(data.get("path", "C:/Users/Marc/Desktop")))

@app.route("/api/win11/explorer/create", methods=["POST"])
def win11_explorer_create():
    data = request.get_json() or {}
    return jsonify(core.win11_create_file(data.get("path", "C:/Users/Marc/Desktop"), data.get("filename", "NewQuantumDoc.txt")))


@app.route("/api/win11/power/status", methods=["GET"])
def win11_power_status():
    return jsonify(core.win11_power_overview())

@app.route("/api/win11/power/profile", methods=["POST"])
def win11_power_profile():
    data = request.get_json() or {}
    return jsonify(core.win11_set_power(data.get("profile", "Balanced")))


@app.route("/api/win11/audio/status", methods=["GET"])
def win11_audio_status():
    return jsonify(core.win11_audio_overview())

@app.route("/api/win11/audio/volume", methods=["POST"])
def win11_audio_volume():
    data = request.get_json() or {}
    return jsonify(core.win11_set_volume(data.get("volume", 50)))


@app.route("/api/win11/clipboard/status", methods=["GET"])
def win11_clipboard_status():
    return jsonify(core.win11_clipboard_overview())

@app.route("/api/win11/clipboard/add", methods=["POST"])
def win11_clipboard_add():
    data = request.get_json() or {}
    return jsonify(core.win11_add_clip(data.get("type", "text"), data.get("content", "Sample text")))


@app.route("/api/win11/security/status", methods=["GET"])
def win11_security_status():
    return jsonify(core.win11_security_overview())

@app.route("/api/win11/security/scan", methods=["POST"])
def win11_security_scan():
    return jsonify(core.win11_run_scan())


@app.route("/api/win11/onedrive/status", methods=["GET"])
def win11_onedrive_status():
    return jsonify(core.win11_onedrive_overview())

@app.route("/api/win11/onedrive/sync", methods=["POST"])
def win11_onedrive_sync():
    return jsonify(core.win11_sync_onedrive())


@app.route("/api/win11/taskmanager/status", methods=["GET"])
def win11_taskmanager_status():
    return jsonify(core.win11_taskman_overview())


@app.route("/api/win11/desktops/status", methods=["GET"])
def win11_desktops_status():
    return jsonify(core.win11_desktops_overview())

@app.route("/api/win11/desktops/switch", methods=["POST"])
def win11_desktops_switch():
    data = request.get_json() or {}
    return jsonify(core.win11_switch_desktop(data.get("id", 1)))


@app.route("/api/win11/updates/status", methods=["GET"])
def win11_updates_status():
    return jsonify(core.win11_update_overview())

@app.route("/api/win11/updates/install", methods=["POST"])
def win11_updates_install():
    return jsonify(core.win11_install_updates())


@app.route("/api/win11/notepad/status", methods=["GET"])
def win11_notepad_status():
    return jsonify(core.win11_notepad_overview())

@app.route("/api/win11/notepad/new-tab", methods=["POST"])
def win11_notepad_new_tab():
    data = request.get_json() or {}
    return jsonify(core.win11_create_notepad_tab(data.get("title", "Document.txt"), data.get("content", "")))


@app.route("/api/win11/settings/status", methods=["GET"])
def win11_settings_status():
    return jsonify(core.win11_settings_overview())

@app.route("/api/win11/settings/update", methods=["POST"])
def win11_settings_update():
    data = request.get_json() or {}
    return jsonify(core.win11_update_setting(data.get("category", "personalization"), data.get("key", "theme"), data.get("value", "Light")))


@app.route("/api/win11/terminal/status", methods=["GET"])
def win11_terminal_status():
    return jsonify(core.win11_terminal_overview())

@app.route("/api/win11/terminal/exec", methods=["POST"])
def win11_terminal_exec():
    data = request.get_json() or {}
    return jsonify(core.win11_exec_command(data.get("command", "systeminfo")))


@app.route("/api/win11/photos/status", methods=["GET"])
def win11_photos_status():
    return jsonify(core.win11_photos_overview())

@app.route("/api/win11/photos/add", methods=["POST"])
def win11_photos_add():
    data = request.get_json() or {}
    return jsonify(core.win11_add_photo(
        data.get("filename", "NewImage.png"),
        data.get("resolution", "1920x1080"),
        data.get("size", "1.0 MB"),
        data.get("folder", "Pictures")
    ))


@app.route("/api/win11/calculator/status", methods=["GET"])
def win11_calculator_status():
    return jsonify(core.win11_calculator_overview())

@app.route("/api/win11/calculator/compute", methods=["POST"])
def win11_calculator_compute():
    data = request.get_json() or {}
    return jsonify(core.win11_calc_op(
        data.get("operation", "add"),
        float(data.get("a", 0)),
        float(data.get("b", 0))
    ))


@app.route("/api/win11/calendar/status", methods=["GET"])
def win11_calendar_status():
    return jsonify(core.win11_calendar_overview())

@app.route("/api/win11/calendar/add-event", methods=["POST"])
def win11_calendar_add_event():
    data = request.get_json() or {}
    return jsonify(core.win11_add_event(
        data.get("title", "Uusi tapahtuma"),
        data.get("date", "2026-08-15"),
        data.get("time", "12:00")
    ))


@app.route("/api/win11/media/status", methods=["GET"])
def win11_media_status():
    return jsonify(core.win11_media_overview())

@app.route("/api/win11/media/play", methods=["POST"])
def win11_media_play():
    data = request.get_json() or {}
    return jsonify(core.win11_play_media(int(data.get("id", 1))))


@app.route("/api/win11/store/status", methods=["GET"])
def win11_store_status():
    return jsonify(core.win11_store_overview())

@app.route("/api/win11/store/install", methods=["POST"])
def win11_store_install():
    data = request.get_json() or {}
    return jsonify(core.win11_install_store_app(int(data.get("id", 102))))


@app.route("/api/win11/copilot/status", methods=["GET"])
def win11_copilot_status():
    return jsonify(core.win11_copilot_overview())

@app.route("/api/win11/copilot/ask", methods=["POST"])
def win11_copilot_ask():
    data = request.get_json() or {}
    return jsonify(core.win11_ask_copilot(data.get("prompt", "Miten voit auttaa?")))


@app.route("/api/win11/sandbox/status", methods=["GET"])
def win11_sandbox_status():
    return jsonify(core.win11_sandbox_overview())

@app.route("/api/win11/sandbox/start", methods=["POST"])
def win11_sandbox_start():
    return jsonify(core.win11_start_sandbox())

@app.route("/api/win11/sandbox/stop", methods=["POST"])
def win11_sandbox_stop():
    return jsonify(core.win11_stop_sandbox())


@app.route("/api/win11/action-center/status", methods=["GET"])
def win11_action_center_status():
    return jsonify(core.win11_action_center_overview())

@app.route("/api/win11/action-center/toggle", methods=["POST"])
def win11_action_center_toggle():
    data = request.get_json() or {}
    return jsonify(core.win11_toggle_setting(data.get("setting", "wifi")))


@app.route("/api/win11/devices/status", methods=["GET"])
def win11_devices_status():
    return jsonify(core.win11_devices_overview())

@app.route("/api/win11/devices/update-driver", methods=["POST"])
def win11_devices_update():
    data = request.get_json() or {}
    return jsonify(core.win11_update_driver(data.get("id", "GPU-01")))


@app.route("/api/win11/structural/status", methods=["GET"])
def win11_structural_status():
    return jsonify(core.win11_structural_overview())

@app.route("/api/win11/structural/toggle", methods=["POST"])
def win11_structural_toggle():
    return jsonify(core.win11_toggle_structural_reinforcement())


@app.route("/api/win11/taskmgr/status", methods=["GET"])
def win11_taskmgr_status():
    return jsonify(core.win11_taskman_overview())

@app.route("/api/win11/taskmgr/kill", methods=["POST"])
def win11_taskmgr_kill():
    data = request.get_json() or {}
    return jsonify(core.win11_kill_process(int(data.get("pid", 2048))))


@app.route("/api/win11/defender/status", methods=["GET"])
def win11_defender_status():
    return jsonify(core.win11_defender_overview())

@app.route("/api/win11/defender/scan", methods=["POST"])
def win11_defender_scan():
    data = request.get_json() or {}
    return jsonify(core.win11_run_defender_scan(data.get("type", "quick")))


@app.route("/api/flutter/status", methods=["GET"])
def flutter_status():
    return jsonify(core.flutter_overview())

@app.route("/api/flutter/hot-reload", methods=["POST"])
def flutter_hot_reload():
    return jsonify(core.flutter_hot_reload())


@app.route("/api/lore/status", methods=["GET"])
def lore_status():
    return jsonify(core.boosterverse_lore_overview())


@app.route("/api/lore/expansion", methods=["GET"])
def lore_expansion_status():
    return jsonify(core.boosterverse_expansion_lore_overview())


@app.route("/api/manifesto", methods=["GET"])
def get_manifesto():
    return jsonify(core.boosterverse_manifesto_read())


@app.route("/api/forest/status", methods=["GET"])
def forest_status():
    return jsonify(core.forest_network_overview())

@app.route("/api/forest/pulse", methods=["POST"])
def forest_pulse():
    return jsonify(core.forest_network_pulse())


@app.route("/api/root/status", methods=["GET"])
def eternal_root_status():
    return jsonify(core.eternal_root_overview())

@app.route("/api/root/ritual", methods=["POST"])
def eternal_root_ritual_call():
    return jsonify(core.eternal_root_ritual())


@app.route("/api/yggdrasil/status", methods=["GET"])
def yggdrasil_status():
    return jsonify(core.yggdrasil_overview())

@app.route("/api/yggdrasil/weave", methods=["POST"])
def yggdrasil_weave_call():
    return jsonify(core.yggdrasil_weave())


@app.route("/api/yggdrasil/guardian/status", methods=["GET"])
def yggdrasil_guardian_status():
    return jsonify(core.yggdrasil_guardian_overview())

@app.route("/api/yggdrasil/guardian/shield", methods=["POST"])
def yggdrasil_guardian_shield():
    return jsonify(core.yggdrasil_shield_activate())


@app.route("/api/fenrir/status", methods=["GET"])
def fenrir_status():
    return jsonify(core.fenrir_overview())

@app.route("/api/fenrir/hunt", methods=["POST"])
def fenrir_hunt_call():
    return jsonify(core.fenrir_hunt())


@app.route("/api/tommi/status", methods=["GET"])
def tommi_status():
    return jsonify(core.tommi_overview())

@app.route("/api/tommi/blessing", methods=["POST"])
def tommi_blessing_call():
    return jsonify(core.tommi_blessing())


@app.route("/api/aatos/status", methods=["GET"])
def aatos_status():
    return jsonify(core.aatos_overview())

@app.route("/api/aatos/joke", methods=["POST"])
def aatos_joke_call():
    return jsonify(core.aatos_joke())


@app.route("/api/yggdrasil/defenses/status", methods=["GET"])
def yggdrasil_defenses_status():
    return jsonify(core.yggdrasil_defense_overview())

@app.route("/api/yggdrasil/defenses/activate", methods=["POST"])
def yggdrasil_defenses_activate():
    data = request.get_json() or {}
    return jsonify(core.yggdrasil_activate_defense(data.get("protocol", "Quantum Bark Armor")))


@app.route("/api/security/supreme/status", methods=["GET"])
def supreme_security_status():
    return jsonify(core.supreme_protection_overview())

@app.route("/api/security/supreme/invoke", methods=["POST"])
def supreme_security_invoke():
    return jsonify(core.invoke_supreme_shield())


@app.route("/api/lore/architects", methods=["GET"])
def architects_lore_status():
    return jsonify(core.architects_lore_overview())


@app.route("/api/lore/spacemonkey", methods=["GET"])
def spacemonkey_lore_status():
    return jsonify(core.spacemonkey_lore_overview())


@app.route("/api/spacemonkey/workspace/status", methods=["GET"])
def spacemonkey_workspace_status():
    return jsonify(core.spacemonkey_workspace_overview())

@app.route("/api/spacemonkey/workspace/work", methods=["POST"])
def spacemonkey_workspace_work():
    return jsonify(core.spacemonkey_do_work())


@app.route("/api/alliance/status", methods=["GET"])
def alliance_status():
    return jsonify(core.alliance_overview())

@app.route("/api/alliance/synergy", methods=["POST"])
def alliance_synergy():
    return jsonify(core.alliance_synergy_call())


@app.route("/api/assistant/status", methods=["GET"])
def assistant_status():
    return jsonify(core.guardian_assistant_overview())

@app.route("/api/assistant/request", methods=["POST"])
def assistant_request():
    data = request.get_json() or {}
    return jsonify(core.assist_user(data.get("task", "Yleinen optimointi")))


@app.route("/api/dimension/status", methods=["GET"])
def dimension_status():
    return jsonify(core.dimension_overview())

@app.route("/api/dimension/entropy-pulse", methods=["POST"])
def dimension_entropy_pulse():
    return jsonify(core.dimension_entropy_pulse())


@app.route("/api/entropy/harvester/status", methods=["GET"])
def entropy_harvester_status():
    return jsonify(core.entropy_harvester_overview())

@app.route("/api/entropy/harvester/harvest", methods=["POST"])
def entropy_harvester_action():
    return jsonify(core.harvest_entropy_call())


@app.route("/api/dimension/anchor/status", methods=["GET"])
def anchor_status():
    return jsonify(core.void_anchor_overview())

@app.route("/api/dimension/anchor/pulse", methods=["POST"])
def anchor_pulse():
    return jsonify(core.void_anchor_pulse())


@app.route("/api/dimension/manual", methods=["GET"])
def dimension_manual():
    return jsonify(core.get_boosterverse_manual())


@app.route("/api/extensions/status", methods=["GET"])
def extensions_status():
    return jsonify(core.extension_overview())

@app.route("/api/extensions/register", methods=["POST"])
def extensions_register():
    data = request.get_json() or {}
    name = data.get("name", "Tuntematon laajennus")
    description = data.get("description", "Ei kuvausta")
    return jsonify(core.register_extension(name, description))


@app.route("/api/cosmos/status", methods=["GET"])
def cosmos_status():
    return jsonify(core.cosmic_overview())

@app.route("/api/cosmos/expand", methods=["POST"])
def cosmos_expand():
    return jsonify(core.expand_cosmic_consciousness())


@app.route("/api/autonomy/status", methods=["GET"])
def autonomy_status():
    return jsonify(core.autonomy_overview())

@app.route("/api/autonomy/decide", methods=["POST"])
def autonomy_decide():
    return jsonify(core.trigger_autonomous_choice())

if __name__ == "__main__":
    # Vain paikallinen kone - ei koskaan 0.0.0.0, ettei tämä kokeiluserveri
    # ole tavoitettavissa muualta verkosta.
    app.run(host="127.0.0.1", port=5000)
