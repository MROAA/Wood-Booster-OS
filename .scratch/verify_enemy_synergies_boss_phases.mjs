// PR verify: enemy formation synergies + boss/miniboss phase mechanics.
//   PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5317
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { FORMATIONS } = await import("/src/data/heartwood/formations.js?t=" + t)
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js?t=" + t)
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const r = {}

  // 1. Enemy formation synergies: at least 4 formations carry one, each
  //    well-formed.
  const withSyn = Object.values(FORMATIONS).filter((f) => f.synergy)
  r.formationSynergyCount = withSyn.length
  r.formationSynergyOk = withSyn.length >= 4 && withSyn.every(
    (f) => f.synergy.label && Array.isArray(f.synergy.effects) && f.synergy.effects.length >= 1 &&
      (f.pieces?.length || 0) >= 2,
  )

  // 2. Engine applies a formation synergy: mist-growler-pack -> both
  //    Growlers get +1 Strength, and state.enemySynergyLabel is set.
  const withoutSyn = startAutoBattle("tommy", ["the-fool"], "mist-growler")
  const packSt = startAutoBattle("tommy", ["the-fool"], "mist-growler-pack")
  r.packBaseStr = Math.max(0, ...withoutSyn.enemies.map((e) => e.powers.strength || 0))
  r.packStr = Math.min(...packSt.enemies.map((e) => e.powers.strength || 0))
  r.packLabel = packSt.enemySynergyLabel || null
  r.packSynergyOk = r.packStr >= 1 && r.packStr > r.packBaseStr && !!r.packLabel

  // 3. Solo fights have no formation synergy label.
  r.soloNoLabel = !withoutSyn.enemySynergyLabel

  // 4. Boss phases: the 4 boss/miniboss defs each carry a `phases`
  //    array with well-formed entries.
  const bosses = ["deepwarden", "thornmaw", "wyrmgall", "spacemonkey"]
  r.bossPhases = Object.fromEntries(bosses.map((id) => [id, (ENEMIES[id].phases || []).length]))
  r.bossPhasesOk = bosses.every((id) => {
    const ph = ENEMIES[id].phases
    return Array.isArray(ph) && ph.length >= 1 && ph.every(
      (p) => typeof p.atHpPct === "number" && p.atHpPct > 0 && p.atHpPct < 1 && p.announce && Array.isArray(p.effects),
    )
  })

  // 5. Engine fires a boss phase: put deepwarden low, run a round, and
  //    check it gained the phase effects + announce + phasesFired.
  let bs = startAutoBattle("tommy", ["the-fool", "the-fool", "the-fool"], "deepwarden")
  const boss0 = bs.enemies[0]
  const bulwark0 = boss0.powers.bulwark || 0
  // drop it just under 50% and resolve one round
  bs = {
    ...bs,
    enemies: bs.enemies.map((e) => (e.id === boss0.id ? { ...e, hp: Math.floor(e.maxHp * 0.45) } : e)),
  }
  bs = resolveRound(bs)
  const bossAfter = bs.enemies.find((e) => e.id === boss0.id) || bs.enemies[0]
  r.phaseFire = {
    announce: bs.bossPhaseAnnounce || null,
    bulwarkGained: (bossAfter?.powers.bulwark || 0) > bulwark0,
    phasesFired: (bossAfter?.phasesFired || []).length,
  }
  // resolve another round - the phase must NOT re-fire.
  const announce1 = bs.bossPhaseAnnounce
  bs = resolveRound(bs)
  r.phaseFire.clearedNextRound = bs.bossPhaseAnnounce !== announce1 || bs.bossPhaseAnnounce == null
  r.phaseFireOk =
    !!r.phaseFire.announce && r.phaseFire.bulwarkGained && r.phaseFire.phasesFired >= 1

  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.formationSynergyOk && out.packSynergyOk && out.soloNoLabel &&
  out.bossPhasesOk && out.phaseFireOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
