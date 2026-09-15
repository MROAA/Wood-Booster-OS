// Hearthwood - sound + music. Marc: "kehitetään lisää peliä" -> "ääni ja
// musiikki" + "julkaisukuntoon hiominen", then "synteettiset
// placeholder-äänet nyt".
//
// SFX are SYNTHESISED (Web Audio oscillators + noise + gain envelopes) -
// no asset files. Every `play("name")` is a stable hook: real .ogg
// samples can slot in behind the same names later with zero call-site
// changes. Music is a small per-mode procedural pad.
//
// HARD RULE: nothing here ever throws. Headless Playwright, private
// windows, and browsers with audio blocked have no usable AudioContext;
// every method must be a silent no-op there. Audio never touches
// runState / the sim - it's 100% presentational.

const KEY = "heartwood-settings-v1"

const DEFAULTS = { master: 0.8, sfx: 0.8, music: 0.35, muted: false, reduceMotion: false }

const clamp01 = (n) => (typeof n === "number" && n >= 0 && n <= 1 ? n : null)

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw)
    return {
      master: clamp01(p.master) ?? DEFAULTS.master,
      sfx: clamp01(p.sfx) ?? DEFAULTS.sfx,
      music: clamp01(p.music) ?? DEFAULTS.music,
      muted: !!p.muted,
      reduceMotion: !!p.reduceMotion,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(next) {
  settings = { ...settings, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // settings are a nicety; the game plays fine without persistence
  }
  return settings
}

let settings = loadSettings()

// --- Web Audio graph (lazy) --------------------------------------------
let ctx = null
let masterGain = null
let sfxGain = null
let musicGain = null

function audio() {
  if (ctx) return ctx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    masterGain = ctx.createGain()
    sfxGain = ctx.createGain()
    musicGain = ctx.createGain()
    sfxGain.connect(masterGain)
    musicGain.connect(masterGain)
    masterGain.connect(ctx.destination)
    applyGains()
    return ctx
  } catch {
    ctx = null
    return null
  }
}

function applyGains() {
  if (!ctx) return
  const m = settings.muted ? 0 : settings.master
  try {
    masterGain.gain.value = m
    sfxGain.gain.value = settings.sfx
    musicGain.gain.value = settings.music
  } catch {
    /* noop */
  }
}

// --- SFX synth recipes -----------------------------------------------
// Each: (ctx, out, t0, rate) - `out` is the sfx bus, `t0` is ctx.currentTime.
function tone(a, out, t0, { type = "sine", f0, f1, dur = 0.12, gain = 0.3 }) {
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t0)
  if (f1 != null) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g)
  g.connect(out)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function noise(a, out, t0, { dur = 0.12, gain = 0.3, lp = 2200, hp = 300 }) {
  const n = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, n, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = a.createBufferSource()
  src.buffer = buf
  const bp = a.createBiquadFilter()
  bp.type = "bandpass"
  bp.frequency.value = (lp + hp) / 2
  const g = a.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(bp)
  bp.connect(g)
  g.connect(out)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

const RECIPES = {
  click: (a, out, t) => tone(a, out, t, { type: "triangle", f0: 520, f1: 340, dur: 0.04, gain: 0.14 }),
  hit: (a, out, t) => {
    noise(a, out, t, { dur: 0.09, gain: 0.28, hp: 400, lp: 3200 })
    tone(a, out, t, { type: "sine", f0: 180, f1: 90, dur: 0.1, gain: 0.18 })
  },
  hitBig: (a, out, t) => {
    noise(a, out, t, { dur: 0.16, gain: 0.4, hp: 200, lp: 2600 })
    tone(a, out, t, { type: "sine", f0: 130, f1: 55, dur: 0.22, gain: 0.34 })
    tone(a, out, t + 0.01, { type: "square", f0: 90, f1: 60, dur: 0.14, gain: 0.12 })
  },
  block: (a, out, t) => {
    tone(a, out, t, { type: "square", f0: 320, f1: 260, dur: 0.06, gain: 0.12 })
    noise(a, out, t, { dur: 0.05, gain: 0.14, hp: 1200, lp: 5000 })
  },
  heal: (a, out, t) => {
    tone(a, out, t, { type: "sine", f0: 440, f1: 660, dur: 0.16, gain: 0.16 })
    tone(a, out, t + 0.05, { type: "sine", f0: 660, f1: 880, dur: 0.16, gain: 0.12 })
  },
  tick: (a, out, t) => tone(a, out, t, { type: "sine", f0: 1400, f1: 900, dur: 0.05, gain: 0.09 }),
  ko: (a, out, t) => tone(a, out, t, { type: "sawtooth", f0: 300, f1: 60, dur: 0.35, gain: 0.2 }),
  reroll: (a, out, t) => noise(a, out, t, { dur: 0.22, gain: 0.18, hp: 600, lp: 6000 }),
  buy: (a, out, t) => {
    tone(a, out, t, { type: "triangle", f0: 700, f1: 700, dur: 0.05, gain: 0.14 })
    tone(a, out, t + 0.06, { type: "triangle", f0: 950, f1: 950, dur: 0.06, gain: 0.14 })
  },
  shopEnter: (a, out, t) => {
    tone(a, out, t, { type: "sine", f0: 523, f1: 523, dur: 0.3, gain: 0.1 })
    tone(a, out, t + 0.08, { type: "sine", f0: 784, f1: 784, dur: 0.32, gain: 0.08 })
  },
  victory: (a, out, t) => {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      tone(a, out, t + i * 0.09, { type: "triangle", f0: f, f1: f, dur: 0.3, gain: 0.16 }),
    )
  },
  defeat: (a, out, t) => {
    ;[440, 370, 294, 220].forEach((f, i) =>
      tone(a, out, t + i * 0.12, { type: "sine", f0: f, f1: f * 0.98, dur: 0.4, gain: 0.16 }),
    )
  },
}

export function play(name, { gain = 1, rate = 1 } = {}) {
  const a = audio()
  if (!a || settings.muted || settings.sfx <= 0) return
  try {
    if (a.state === "suspended") a.resume?.()
    const bus = a.createGain()
    bus.gain.value = gain
    bus.connect(sfxGain)
    RECIPES[name]?.(a, bus, a.currentTime, rate)
    // let the bus outlive its longest voice, then let GC take it
    setTimeout(() => {
      try {
        bus.disconnect()
      } catch {
        /* noop */
      }
    }, 2000)
  } catch {
    /* a broken audio graph must never break the game */
  }
}

// --- Procedural per-mode music --------------------------------------
// A slow detuned pad. Each mode = a root + a chord shape + a filter
// cutoff. Crossfaded on change; nodes disposed after the fade.
const MODES = {
  menu: { root: 130.81, chord: [0, 7, 12], cutoff: 700, level: 0.5 },
  shop: { root: 146.83, chord: [0, 4, 7, 11], cutoff: 900, level: 0.5 },
  battle: { root: 110.0, chord: [0, 3, 7], cutoff: 620, level: 0.6 },
  boss: { root: 98.0, chord: [0, 1, 6, 7], cutoff: 520, level: 0.75 },
  end: { root: 164.81, chord: [0, 4, 7, 12], cutoff: 1100, level: 0.45 },
}

let musicVoice = null // { nodes:[], gain, mode }

function stopMusicVoice(voice, when) {
  if (!voice) return
  try {
    voice.gain.gain.cancelScheduledValues(when)
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, when)
    voice.gain.gain.linearRampToValueAtTime(0.0001, when + 1.4)
    voice.nodes.forEach((n) => {
      try {
        n.stop?.(when + 1.6)
      } catch {
        /* noop */
      }
    })
  } catch {
    /* noop */
  }
}

export function setMusicMode(mode) {
  const a = audio()
  if (!a) return
  const spec = MODES[mode] || MODES.menu
  if (musicVoice && musicVoice.mode === mode) return
  try {
    const now = a.currentTime
    if (musicVoice) stopMusicVoice(musicVoice, now)

    const g = a.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.linearRampToValueAtTime(spec.level, now + 1.6)
    const lp = a.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = spec.cutoff
    g.connect(lp)
    lp.connect(musicGain)

    // slow tremolo so the pad breathes
    const lfo = a.createOscillator()
    const lfoGain = a.createGain()
    lfo.frequency.value = 0.07
    lfoGain.gain.value = spec.level * 0.35
    lfo.connect(lfoGain)
    lfoGain.connect(g.gain)
    lfo.start(now)

    const nodes = [lfo]
    for (const semi of spec.chord) {
      const f = spec.root * Math.pow(2, semi / 12)
      for (const det of [-3, 3]) {
        const o = a.createOscillator()
        o.type = "sawtooth"
        o.frequency.value = f + det
        const og = a.createGain()
        og.gain.value = 0.09
        o.connect(og)
        og.connect(g)
        o.start(now)
        nodes.push(o)
      }
    }
    musicVoice = { nodes, gain: g, mode }
  } catch {
    /* noop */
  }
}

export function stopMusic() {
  const a = audio()
  if (a && musicVoice) stopMusicVoice(musicVoice, a.currentTime)
  musicVoice = null
}

// --- public settings API -------------------------------------------
export function setVolumes(next) {
  saveSettings(next)
  applyGains()
}

export function setMuted(v) {
  saveSettings({ muted: !!v })
  applyGains()
}

export function setReduceMotion(v) {
  saveSettings({ reduceMotion: !!v })
  try {
    document.documentElement.classList.toggle("hw-reduce-motion", !!v)
  } catch {
    /* noop */
  }
}

// Apply persisted settings on boot - the reduce-motion class especially,
// which must be live before the first animation. Volumes are applied
// lazily when the context is first created (applyGains in audio()).
export function initAudioFromStorage() {
  settings = loadSettings()
  try {
    document.documentElement.classList.toggle("hw-reduce-motion", !!settings.reduceMotion)
  } catch {
    /* noop */
  }
}

// One delegated listener: a soft click on any <button>, and - crucially -
// the user gesture that unlocks / resumes the AudioContext so everything
// after it can actually sound.
let clickInstalled = false
export function installClickSound() {
  if (clickInstalled) return
  clickInstalled = true
  try {
    document.addEventListener(
      "click",
      (e) => {
        const a = audio()
        if (a?.state === "suspended") a.resume?.()
        if (e.target?.closest?.("button")) play("click", { gain: 0.5 })
      },
      true,
    )
    // pause the pad when the tab is hidden so it doesn't idle forever
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopMusic()
    })
  } catch {
    /* noop */
  }
}
