import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - sound + settings (release-hardening pt 1). Marc: "ääni ja
// musiikki" + "julkaisukuntoon hiominen" -> synth placeholder SFX +
// procedural music + a Settings screen. Audio is 100% inert for the sim
// and MUST never throw without a usable AudioContext.

const PORT = process.env.PORT || 5340
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-sound"
const SHOT_DIR = `${ROOT}/.scratch/shots`
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const r = await page.evaluate(async () => {
  const out = { ok: {}, detail: {} }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // ---- 1. inert with NO Web Audio -------------------------------
  const realAC = window.AudioContext
  const realWAC = window.webkitAudioContext
  try {
    delete window.AudioContext
    delete window.webkitAudioContext
    const sm = await import("/src/services/heartwood/soundManager.js?nowa=" + Date.now())
    let threw = false
    try {
      sm.installClickSound()
      sm.initAudioFromStorage()
      sm.play("hit")
      sm.play("hitBig", { gain: 0.5 })
      sm.play("nonexistent-recipe")
      sm.setMusicMode("battle")
      sm.setMusicMode("boss")
      sm.setVolumes({ master: 0.5, sfx: 0.2, music: 0.1 })
      sm.setMuted(true)
      sm.setReduceMotion(true)
      sm.setReduceMotion(false)
      sm.stopMusic()
    } catch (e) {
      threw = true
      out.detail.inertErr = String(e)
    }
    out.ok.inertNoThrow = !threw
    out.ok.playReturnsUndefined = sm.play("hit") === undefined
  } finally {
    if (realAC) window.AudioContext = realAC
    if (realWAC) window.webkitAudioContext = realWAC
  }

  // fresh import now that AudioContext is back (headless Chromium has one)
  const sm = await import("/src/services/heartwood/soundManager.js?wa=" + Date.now())

  // ---- 2. settings persistence ---------------------------------
  localStorage.removeItem("heartwood-settings-v1")
  out.ok.defaultsWhenEmpty = eq(sm.loadSettings(), {
    master: 0.8,
    sfx: 0.8,
    music: 0.35,
    muted: false,
    reduceMotion: false,
  })
  sm.saveSettings({ master: 0.3, sfx: 0, music: 0.7, muted: true, reduceMotion: true })
  out.ok.roundTrips = eq(sm.loadSettings(), {
    master: 0.3,
    sfx: 0,
    music: 0.7,
    muted: true,
    reduceMotion: true,
  })
  localStorage.setItem("heartwood-settings-v1", "{not json")
  let corruptThrew = false
  try {
    sm.loadSettings()
  } catch {
    corruptThrew = true
  }
  out.ok.corruptSafe = !corruptThrew && eq(sm.loadSettings(), sm.loadSettings())
  // out-of-range values clamp to defaults, not NaN
  localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 5, sfx: -1, music: "x" }))
  const clamped = sm.loadSettings()
  out.ok.clampsBadValues = clamped.master === 0.8 && clamped.sfx === 0.8 && clamped.music === 0.35

  // ---- 3. reduce-motion class -------------------------------
  localStorage.removeItem("heartwood-settings-v1")
  sm.setReduceMotion(true)
  out.ok.rmClassOn = document.documentElement.classList.contains("hw-reduce-motion")
  sm.setReduceMotion(false)
  out.ok.rmClassOff = !document.documentElement.classList.contains("hw-reduce-motion")
  sm.saveSettings({ reduceMotion: true })
  sm.initAudioFromStorage()
  out.ok.rmReappliedOnInit = document.documentElement.classList.contains("hw-reduce-motion")
  sm.setReduceMotion(false) // reset for the UI test below

  // ---- 4. real fight, audio enabled, no errors --------------
  // (headless has an AudioContext but no output device - exercises the
  // whole graph without silence being a bug)
  localStorage.removeItem("heartwood-settings-v1")
  let fightThrew = false
  try {
    const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
    let st = startAutoBattle("tommy", ["thornguard", "the-fool"], "rotwood-husk-pair")
    for (let i = 0; i < 20 && st.phase === "player"; i++) {
      st = resolveRound(st)
      for (const ev of st.roundEvents || []) {
        if (ev.kind === "damage") sm.play(ev.amount >= 15 ? "hitBig" : "hit")
        else if (ev.kind === "tick") sm.play("tick")
      }
    }
    sm.play(st.phase === "won" ? "victory" : "defeat")
    sm.setMusicMode("boss")
    sm.setMusicMode("shop")
  } catch (e) {
    fightThrew = true
    out.detail.fightErr = String(e)
  }
  out.ok.fightSonifiedNoThrow = !fightThrew

  out.pass = Object.values(out.ok).every(Boolean)
  return out
})

console.log(JSON.stringify(r, null, 2))

// ---- 5. UI: SettingsScreen -----------------------------------
await page.evaluate(() => localStorage.removeItem("heartwood-settings-v1"))
await page.reload()
await page.waitForSelector(".hw-settings-open-btn", { timeout: 8000 })
await page.waitForTimeout(300)
await page.click(".hw-settings-open-btn")
await page.waitForSelector(".hw-settings", { timeout: 5000 })
await page.waitForTimeout(300)

const sliders = await page.locator('.hw-settings input[type="range"]').count()
const toggles = await page.locator('.hw-settings input[type="checkbox"]').count()
console.log("sliders:", sliders, "| toggles:", toggles)

// move the Music slider (3rd range)
const music = page.locator('.hw-settings input[type="range"]').nth(2)
await music.fill("0.9").catch(() => {})
await page.waitForTimeout(150)

// reduce-motion toggle (2nd checkbox: mute-all is 1st)
const rm = page.locator('.hw-settings input[type="checkbox"]').nth(1)
await rm.check()
await page.waitForTimeout(150)
const rmOn = await page.evaluate(() => document.documentElement.classList.contains("hw-reduce-motion"))
await rm.uncheck()
await page.waitForTimeout(150)
const rmOff = await page.evaluate(() => !document.documentElement.classList.contains("hw-reduce-motion"))
console.log("reduce-motion toggled on:", rmOn, "off:", rmOff)

await page.locator(".hw-settings").screenshot({ path: `${SHOT_DIR}/settings_screen.png` }).catch(() => {})

// danger: first click shows confirm, does NOT wipe
await page.evaluate(() =>
  localStorage.setItem("heartwood-meta-v1", JSON.stringify({ version: 1, acorns: 99, chosenPerks: [] })),
)
const eraseBtn = page.locator(".hw-settings-danger-row button", { hasText: "Erase all progress" })
await eraseBtn.click()
await page.waitForTimeout(150)
const metaStillThere = await page.evaluate(() => !!localStorage.getItem("heartwood-meta-v1"))
const confirmShown = await page.locator('.hw-settings-danger-row button[data-danger="true"]').isVisible().catch(() => false)
console.log("after 1st erase click - meta still there:", metaStillThere, "| confirm shown:", confirmShown)

// second click wipes + reloads
await page.locator('.hw-settings-danger-row button[data-danger="true"]', { hasText: /erase everything/i }).click()
await page.waitForTimeout(800)
const metaGone = await page.evaluate(() => !localStorage.getItem("heartwood-meta-v1"))
const backAtSelect = await page.locator(".hw-settings-open-btn").isVisible().catch(() => false)
console.log("after confirm - meta gone:", metaGone, "| back at character-select:", backAtSelect)

const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
await browser.close()

const uiOk =
  sliders === 3 &&
  toggles === 2 &&
  rmOn &&
  rmOff &&
  metaStillThere &&
  confirmShown &&
  metaGone &&
  backAtSelect &&
  noHScroll

console.log("\nengine/data pass:", r.pass)
console.log("ui pass:", uiOk, "| noHScroll:", noHScroll)
console.log("page errors:", JSON.stringify(errors))

if (r.pass && uiOk && errors.length === 0) {
  console.log("\nRESULT: PASS")
  process.exit(0)
} else {
  const failed = Object.entries(r.ok).filter(([, v]) => !v).map(([k]) => k)
  console.log("\nRESULT: FAIL", JSON.stringify({ failedChecks: failed, uiOk, errCount: errors.length }))
  process.exit(1)
}
