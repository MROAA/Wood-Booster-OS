import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5333
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-mirror/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

const eng = await page.evaluate(async () => {
  const t = Date.now()
  const AB = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const out = {}

  // Build a run with a real deployed squad, park it at victory / actFive.
  const buildRun = (deployIds) => {
    let rs = E.startRun("tommy", null, { forcedSeed: 5 })
    let benchKey = rs.benchKeyCounter
    for (const id of deployIds) {
      rs = { ...rs, bench: [...rs.bench, { key: benchKey, defId: id, upgradeLevel: 0 }], benchKeyCounter: benchKey + 1 }
      benchKey++
    }
    rs.deployed = rs.bench.slice(0, 4).map((e) => e.key)
    return { ...rs, phase: "victory", nodeIndex: E.RUN_PATH.length - 1, actFive: "throne",
      path: rs.path.concat(Array(E.RUN_PATH.length - 1).fill({ type: "battle" })) }
  }

  // 1. mirror: 4 deployed units -> 4 Echo enemies matching player defIds
  const rs = buildRun(["the-hierophant", "the-chariot", "briarblade", "ironbark"])
  const inFight = E.startCrownlessBattle(rs)
  const enemyDefIds = inFight.battle.enemies.map((e) => e.defId).sort()
  const playerDefIds = rs.deployed.map((k) => rs.bench.find((b) => b.key === k).defId).sort()
  out.mirrorMatchesSquad = JSON.stringify(enemyDefIds) === JSON.stringify(playerDefIds)
  out.echoNames = inFight.battle.enemies.map((e) => e.name)
  out.allEchoPrefixed = inFight.battle.enemies.every((e) => e.name.startsWith("Echo of "))
  out.enemyHpsSane = inFight.battle.enemies.every((e) => e.maxHp > 0 && Number.isFinite(e.maxHp) && e.hp === e.maxHp)
  out.phaseStaysVictory = inFight.phase === "victory"
  out.enemyCount = inFight.battle.enemies.length

  // 2. it fully auto-resolves without crashing, and can't strand
  let resolved = null
  try { resolved = AB.autoResolveBattle(inFight.battle) } catch (e) { out.resolveCrash = String(e) }
  out.mirrorResolves = ["won", "lost"].includes(resolved?.phase)

  // 3. empty deployed squad -> falls back to the-crownless-mirror (3 pieces)
  const emptyRs = { ...buildRun([]), deployed: [null, null, null, null] }
  const fb = E.startCrownlessBattle(emptyRs)
  out.fallbackCount = fb.battle.enemies.length
  out.fallbackNames = fb.battle.enemies.map((e) => e.name)
  out.fallbackNotEchoes = fb.battle.enemies.every((e) => !e.name.startsWith("Echo of "))

  // 4. regression: startAutoBattle with NO mirrorSquad is byte-identical
  //    behaviour to before (a normal formation fight still works)
  const normal = AB.startAutoBattle("tommy", [{ defId: "the-hierophant", upgradeLevel: 0, itemIds: [] }],
    "mist-growler-pack", [], 0, {}, [], [], 1.4, null, "restless")
  out.normalEnemies = normal.enemies.map((e) => e.name)
  out.normalNoEcho = normal.enemies.every((e) => !e.name.startsWith("Echo of "))
  out.normalResolves = ["won", "lost"].includes(AB.autoResolveBattle(normal).phase)

  return out
})
console.log(JSON.stringify(eng, null, 2))

// --- DOM: full Act V with a mirror fight ----------------------------
await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let rs = E.startRun("tommy", null, { forcedSeed: 5 })
  let bk = rs.benchKeyCounter
  for (const id of ["the-hierophant", "the-chariot", "briarblade", "ironbark"]) {
    rs = { ...rs, bench: [...rs.bench, { key: bk, defId: id, upgradeLevel: 0 }], benchKeyCounter: bk + 1 }; bk++
  }
  rs.deployed = rs.bench.slice(0, 4).map((e) => e.key)
  rs = { ...rs, phase: "victory", nodeIndex: E.RUN_PATH.length - 1, actFive: "throne", runModifiers: ["hollow-accepted"],
    path: rs.path.concat(Array(E.RUN_PATH.length - 1).fill({ type: "battle" })) }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload()
await page.waitForTimeout(900)
const tn = page.locator("button.hw-tutorial-next")
if (await tn.isVisible({ timeout: 500 }).catch(() => false)) { await tn.click(); await page.waitForTimeout(200) }
// throne cinematic -> click through
for (let k = 0; k < 12; k++) {
  const cb = page.locator(".hw-cinematic-prompt .hw-end-turn")
  if (await cb.isVisible().catch(() => false)) { await cb.click(); break }
  await page.locator(".hw-cinematic-inner").click({ position: { x: 10, y: 10 } })
  await page.waitForTimeout(120)
}
await page.waitForTimeout(1000)
const battleScreen = await page.locator('[data-screen="crownless-battle"]').isVisible().catch(() => false)
const echoOnScreen = (await page.locator("text=/Echo of/i").count()) > 0
await page.screenshot({ path: `${SHOT_DIR}/crownless_mirror_battle.png` })
console.log("DOM:", { battleScreen, echoOnScreen })

const pass =
  eng.mirrorMatchesSquad && eng.allEchoPrefixed && eng.enemyHpsSane && eng.phaseStaysVictory && eng.enemyCount === 4 &&
  eng.mirrorResolves && !eng.resolveCrash &&
  eng.fallbackCount === 3 && eng.fallbackNotEchoes &&
  eng.normalNoEcho && eng.normalResolves &&
  battleScreen && echoOnScreen &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
