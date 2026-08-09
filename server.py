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

if __name__ == "__main__":
    # Live-USB-appliancena palvelu kuunnellaan koko lähiverkkoon, jotta
    # Wood-Booster OS on avattavissa toiselta laitteelta (puhelin/läppäri)
    # ilman selainta itse käynnistetyssä koneessa.
    app.run(host="0.0.0.0", port=5000)
