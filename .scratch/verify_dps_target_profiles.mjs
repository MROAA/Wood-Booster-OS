import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - per-DPS target profiles (feat/hearthwood-dps-target-profiles).
// The player-side counterpart to #424's threat targeting. v1 ships the
// two profiles that CONCENTRATE the squad's damage: `executioner` (the
// lowest-HP enemy) and `breaker` (the toughest). Real combat change ->
// the fairness pass is the gate; these assertions pin the mechanic.
// (The PRD's "assassin -> back line" profile is held for a later round -
// redirecting fire AWAY from the focus splits an offense squad's burst.)

const PORT = process.env.PORT || 5353
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-dps-profiles/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const ab = await import("/src/services/heartwood/autoBattleEngine.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const roles = await import("/src/data/heartwood/roles.js")
  const tg = await import("/src/services/heartwood/targeting.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { unitTargetProfile } = roles
  const { playerTarget } = ab
  const out = {}

  const base = (d) => d.role && !d.fusedFrom && !d.evolvedFrom && !d.summonOnly && !d.displayTier
  const defs = Object.values(UNITS).filter(base)
  const plainDef = defs.find((d) => roles.unitProfile(d).primary === "tank")
  const anyAssassin = defs.find((d) => roles.unitProfile(d).primary === "assassin")
  const execDef = UNITS["deepwood-sovereign"]

  // 1. unitTargetProfile - override table only, everything else "default"
  out.profiles = {
    ovExec: unitTargetProfile(execDef),
    ovDefault: unitTargetProfile(UNITS["the-thorn-throne"]),
    plain: plainDef && unitTargetProfile(plainDef),
    assassinNow: anyAssassin ? unitTargetProfile(anyAssassin) : "default", // no assassin units in v1
    missing: unitTargetProfile(undefined),
  }
  out.tableSize = Object.keys(roles.TARGET_PROFILE_OVERRIDES).length
  out.profileOk =
    out.profiles.ovExec === "executioner" &&
    out.profiles.ovDefault === "default" &&
    out.profiles.plain === "default" &&
    out.profiles.assassinNow === "default" &&
    out.profiles.missing === "default" &&
    !roles.TARGET_PROFILES.includes("assassin") &&
    !roles.TARGET_PROFILES.includes("breaker")

  const mkState = (enemies) => ({ phase: "player", enemies, playerUnits: [], grid: { rows: 3, cols: 3 }, enemyDefs: null })
  const en = (id, pos, extra = {}) => ({ id, defId: "twin-watch", name: id, hp: 30, maxHp: 30, pos, block: 0, powers: {}, ...extra })

  // 2. playerTarget per profile (synthetic frozen states)
  {
    // default -> row 0, lowest col (identical to frontmost)
    const dSt = mkState([en("x0", { row: 1, col: 2 }), en("x1", { row: 0, col: 1 }), en("x2", { row: 0, col: 2 })])
    const dPick = playerTarget(dSt, plainDef, dSt.enemies)

    // executioner -> lowest hp among the UNSHIELDED (e_low at col 1, exposed)
    const xSt = mkState([
      en("e_a", { row: 0, col: 0 }, { hp: 25 }),
      en("e_low", { row: 1, col: 1 }, { hp: 4 }),
      en("e_c", { row: 0, col: 2 }, { hp: 18 }),
    ])
    const xPick = playerTarget(xSt, execDef, xSt.enemies)
    // a shielded low-HP enemy is NOT reachable (respects shielding)
    const xShSt = mkState([en("e_front", { row: 0, col: 1 }, { hp: 20 }), en("e_shlow", { row: 1, col: 1 }, { hp: 2 })])
    const xShPick = playerTarget(xShSt, execDef, xShSt.enemies)

    // a plain (default) unit still hits the front rank in the same state
    const plainPick = playerTarget(xSt, plainDef, xSt.enemies)

    const det = Array.from({ length: 20 }, () => playerTarget(xSt, execDef, xSt.enemies)).every((p) => p === xPick)
    out.picks = { dPick, xPick, xShPick, plainPick, det }
    out.pickOk = dPick === "x1" && xPick === "e_low" && xShPick === "e_front" && plainPick === "e_a" && det
  }

  // 3. engine integration - an executioner focuses the lowest-HP enemy
  {
    const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
    const fmtId = Object.keys(FORMATIONS).find((id) => (resolveFormation(id)?.pieces || []).length >= 2)
    let b = ab.startAutoBattle("tommy", ["deepwood-sovereign", "the-fool", "the-magician"], fmtId || "twin-watch")
    // hurt one enemy so there's a clear "lowest"
    const victim = b.enemies.find((e) => !tg.isShielded(b, e.id))
    if (victim) b = { ...b, enemies: b.enemies.map((e) => (e.id === victim.id ? { ...e, hp: 3 } : e)) }
    const p1 = ab.playerTarget(b, UNITS["deepwood-sovereign"], b.enemies)
    const p2 = ab.playerTarget(b, UNITS["deepwood-sovereign"], b.enemies)
    let g = 0
    while (b.phase === "player" && g++ < 12) b = ab.resolveRound(b)
    out.engine = { fmtId, victim: victim?.id, pick: p1, deterministic: p1 === p2, endPhase: b.phase }
    out.engineOk = !!fmtId && !!victim && p1 === victim.id && p1 === p2 && typeof b.phase === "string"
  }

  // 4. purity / save
  {
    const st = mkState([en("e_a", { row: 0, col: 0 }), en("e_b", { row: 1, col: 1 })])
    const snap = JSON.stringify(st)
    playerTarget(st, execDef, st.enemies)
    unitTargetProfile(execDef)
    const unchanged = JSON.stringify(st) === snap
    const fresh = engine.startRun("tommy")
    const noKey = !("targetProfile" in fresh)
    const bt = ab.startAutoBattle("tommy", ["deepwood-sovereign", "the-fool"], "twin-watch")
    const round = engine.deserializeRun(engine.serializeRun({ ...engine.startRun("tommy"), phase: "battle", battle: bt }))
    out.save = { unchanged, noKey, version: engine.RUN_SAVE_VERSION, roundTrip: !!round && !!round.battle }
    out.saveOk = unchanged && noKey && engine.RUN_SAVE_VERSION === 3 && !!round && !!round.battle
  }

  return out
})

// screenshot: a bench card with the ⌖ target line
let shotOk = false
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH, startRun, serializeRun, actIndexForNode } = engine
    const idx = RUN_PATH.findIndex((n, i) => n.type === "battle" && i > 2)
    const squad = ["deepwood-sovereign", "the-hanged-man", "the-magician", "the-fool"]
    const bench = squad.map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0, wins: 0 }))
    const s = {
      ...startRun("tommy"),
      bench,
      deployed: [1, 2, 3, 4],
      items: [],
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      essence: 1500,
      benchKeyCounter: 5,
      lastSeenAct: actIndexForNode(idx, RUN_PATH.length),
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-card-target-line", { timeout: 8000 })
  const card = await page.$(".hw-card:has(.hw-card-target-line)")
  if (card) {
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await card.screenshot({ path: `${SHOT}/dps_target_profiles.png` })
  } else {
    await page.screenshot({ path: `${SHOT}/dps_target_profiles.png` })
  }
  shotOk = true
} catch (e) {
  errs.push(`screenshot: ${e}`.slice(0, 200))
}

await browser.close()
console.log(JSON.stringify(R, null, 2))
console.log("\nscreenshot:", shotOk ? "captured" : "skipped")
console.log("page errors:", errs.length, errs.slice(0, 6))
const checks = ["profileOk", "pickOk", "engineOk", "saveOk"]
const failed = checks.filter((k) => !R[k])
console.log("failed:", failed.length ? failed : "none")
const realErrs = errs.filter((e) => !e.startsWith("screenshot:"))
const pass = failed.length === 0 && realErrs.length === 0
console.log("RESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
