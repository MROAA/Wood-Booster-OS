// PR verify: two unlockable Commanders (Kaski, Louhi) - data shape,
// the meta unlock flow, and a full auto-resolved run with each so a
// new kit can't crash.  PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5320
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { CHARACTERS, unlockableCommanders, isCommanderUnlocked } = await import("/src/data/heartwood/characters.js?t=" + t)
  const meta = await import("/src/services/heartwood/metaState.js?t=" + t)
  const eng = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const r = {}

  // 1. Two new locked Commanders, well-formed like the base four.
  const locked = unlockableCommanders()
  r.lockedIds = locked.map((c) => c.id)
  r.lockedCount = locked.length
  r.lockedShapeOk = locked.length === 2 && locked.every(
    (c) => c.id && c.name && c.art && c.tagline && c.description && typeof c.maxHp === "number" &&
      Array.isArray(c.movePattern) && Array.isArray(c.squadPassive) && c.squadPassive.length >= 1 &&
      c.activePower && c.activePower.name && typeof c.activePower.cost === "number" &&
      Array.isArray(c.activePower.effects) && typeof c.unlockCost === "number",
  )
  r.baseFourStillFour = Object.values(CHARACTERS).filter((c) => !c.locked).length === 4

  // 2. isCommanderUnlocked: base always, locked only when in the list.
  r.gate = {
    tommyAlways: isCommanderUnlocked("tommy", []),
    kaskiLockedByDefault: !isCommanderUnlocked("kaski", []),
    kaskiUnlockedInList: isCommanderUnlocked("kaski", ["kaski"]),
  }
  r.gateOk = r.gate.tommyAlways && r.gate.kaskiLockedByDefault && r.gate.kaskiUnlockedInList

  // 3. Meta store carries unlockedCommanders and round-trips it.
  meta.resetMeta()
  const fresh = meta.loadMeta()
  r.metaShapeOk = Array.isArray(fresh.unlockedCommanders) && fresh.unlockedCommanders.length === 0
  meta.saveMeta({ ...fresh, unlockedCommanders: ["kaski"] })
  r.metaRoundTripOk = meta.loadMeta().unlockedCommanders.includes("kaski")
  meta.resetMeta()

  // 4. A full auto-resolved run with each new Commander - the new kits
  //    must survive startRun -> deploy -> every fight without a crash.
  function fullRun(characterId) {
    let run = eng.startRun(characterId, null, null)
    run = { ...run, essence: 999999 }
    let safety = 0
    while (run.phase !== "victory" && run.phase !== "defeat" && safety < 500) {
      safety++
      if (run.phase === "shop") {
        // recruit a few so the squad can actually fight
        for (let k = 0; k < 4; k++) {
          const id = run.shopOffers[k % run.shopOffers.length]
          const next = eng.recruitUnit(run, id)
          if (next !== run) run = next
        }
        run = eng.leaveShop(run)
      } else if (run.phase === "choice") {
        run = eng.chooseFloorEncounter(run, 0)
      } else if (run.phase === "relic") {
        run = eng.chooseRelic(run, undefined)
      } else if (run.phase === "event") {
        run = eng.resolveEventChoice(run, 0)
      } else if (run.phase === "formation") {
        run = eng.startFormationBattle(run)
        run = eng.autoResolve(run)
        run = eng.resolveBattleOutcome(run)
      } else break
    }
    return { outcome: run.phase, nodeIndex: run.nodeIndex, safety }
  }
  r.kaskiRun = fullRun("kaski")
  r.louhiRun = fullRun("louhi")
  r.runsOk =
    (r.kaskiRun.outcome === "victory" || r.kaskiRun.outcome === "defeat") && r.kaskiRun.safety < 500 &&
    (r.louhiRun.outcome === "victory" || r.louhiRun.outcome === "defeat") && r.louhiRun.safety < 500

  // 5. The new kits actually apply at battle start: Louhi's Commander
  //    unit gets Bulwark, Kaski's carries a poison-on-hit trigger.
  function commanderAtFirstBattle(characterId) {
    let run = eng.startRun(characterId, null, null)
    run = { ...run, essence: 999999 }
    let safety = 0
    while (run.phase !== "formation" && safety < 30) {
      safety++
      if (run.phase === "shop") {
        for (let k = 0; k < 3; k++) {
          const id = run.shopOffers[k % run.shopOffers.length]
          const next = eng.recruitUnit(run, id)
          if (next !== run) run = next
        }
        run = eng.leaveShop(run)
      } else if (run.phase === "choice") run = eng.chooseFloorEncounter(run, 0)
      else if (run.phase === "event") run = eng.resolveEventChoice(run, 0)
      else if (run.phase === "relic") run = eng.chooseRelic(run, undefined)
      else break
    }
    if (run.phase !== "formation") return null
    run = eng.startFormationBattle(run)
    return run.battle?.playerUnits?.find((u) => u.id === "commander") || null
  }
  const lc = commanderAtFirstBattle("louhi")
  const kc = commanderAtFirstBattle("kaski")
  r.louhiBulwark = lc?.powers.bulwark || 0
  r.kaskiPoisonTrigger = (kc?.triggers || []).some((tg) => tg.trigger === "onDealDamage")
  r.kitsApplyOk = r.louhiBulwark >= 1 && r.kaskiPoisonTrigger

  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.lockedShapeOk && out.baseFourStillFour && out.gateOk && out.metaShapeOk && out.metaRoundTripOk &&
  out.runsOk && out.kitsApplyOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
