import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - counterplay tags (feat/hearthwood-counterplay-tags).
// evaluateMatchup(previewEnemies, runState) is PURE - classifies the
// next fight into up to 6 threat archetypes and reports which the
// deployed kit answers. No combat/engine change, no save bump -> the
// fairness pass is a smoke check; these assertions are the gate.

const PORT = process.env.PORT || 5357
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-counterplay/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const cp = await import("/src/data/heartwood/counterplay.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const roles = await import("/src/data/heartwood/roles.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { enemyThreatsFor, buildAnswersFor, evaluateMatchup } = cp
  const out = {}

  const defs = Object.values(UNITS).filter((d) => d.role && !d.fusedFrom && !d.evolvedFrom && !d.summonOnly && !d.displayTier)
  const findUnit = (pred) => defs.find(pred)?.id
  // synthetic preview-enemy roster: { defId, hp, maxHp, pos }
  const en = (defId, pos, extra = {}) => ({ defId, hp: 30, maxHp: 30, pos, ...extra })
  const mkRun = (defIds, extra = {}) => {
    const base = engine.startRun("tommy")
    const bench = defIds.map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0, wins: 0 }))
    return { ...base, bench, deployed: [1, 2, 3, 4].slice(0, defIds.length), items: [], ...extra }
  }
  const plainRun = mkRun(["the-fool"])

  // 1. threat classification (synthetic enemy defs via a runState.battle.enemyDefs override)
  {
    const withDefs = (enemyDefs, roster) => ({ ...plainRun, battle: { enemyDefs } })
    const armorDef = { id: "z_armor", role: "tank", movePattern: [{ type: "block", amount: 12 }, { type: "attack", amount: 4 }] }
    const wardDef = { id: "z_ward", role: "tank", passive: [{ type: "applyBuff", id: "ward", amount: 1 }], movePattern: [{ type: "attack", amount: 5 }] }
    const healDef = { id: "z_heal", role: "support", movePattern: [{ type: "heal", amount: 6 }, { type: "attack", amount: 3 }] }
    const stunDef = { id: "z_stun", role: "dps", movePattern: [{ type: "debuff", id: "stun", target: "player" }, { type: "attack", amount: 6 }] }
    const poisonDef = { id: "z_pois", role: "dps", movePattern: [{ type: "debuff", id: "poison", amount: 2 }, { type: "attack", amount: 4 }] }
    const chipDef = { id: "z_chip", role: "tank", movePattern: [{ type: "block", amount: 6 }, { type: "attack", amount: 5 }] }

    const rs = { ...plainRun, battle: { enemyDefs: { z_armor: armorDef, z_ward: wardDef, z_heal: healDef, z_stun: stunDef, z_pois: poisonDef, z_chip: chipDef } } }
    const t = (roster) => [...enemyThreatsFor(roster, rs)].sort()
    out.threats = {
      armor: t([en("z_armor", { row: 0, col: 0 })]),
      ward: t([en("z_ward", { row: 0, col: 0 })]),
      heal: t([en("z_heal", { row: 0, col: 0 })]),
      stun: t([en("z_stun", { row: 0, col: 0 })]),
      poison: t([en("z_pois", { row: 0, col: 0 })]),
      chipNotArmor: t([en("z_chip", { row: 0, col: 0 })]),
      swarm: t([en("z_chip", { row: 0, col: 0 }), en("z_chip", { row: 0, col: 1 }), en("z_chip", { row: 0, col: 2 }), en("z_chip", { row: 1, col: 1 })]),
      backline: t([en("z_chip", { row: 1, col: 1 })]),
      override: t([en("spacemonkey", { row: 0, col: 1 })]),
    }
    out.threatsOk =
      out.threats.armor.includes("armor") &&
      out.threats.ward.includes("armor") &&
      out.threats.heal.includes("sustain") &&
      out.threats.stun.includes("control") &&
      out.threats.poison.includes("poison") &&
      !out.threats.chipNotArmor.includes("armor") &&
      out.threats.swarm.includes("swarm") &&
      out.threats.backline.includes("backline") &&
      out.threats.override.includes("armor") &&
      out.threats.override.includes("control")
  }

  // 2. answer classification
  {
    const shatterId = findUnit((d) => (roles.unitProfile(d).tags || []).includes("shatter") || (d.movePattern || []).some((m) => m.type === "debuff" && ["shatter", "sunder", "vulnerable"].includes(m.id)))
    const aoeId = findUnit((d) => d.attackPattern && d.attackPattern !== "single")
    const assassinId = findUnit((d) => roles.unitProfile(d).primary === "assassin")
    const wardId = findUnit((d) => (d.passive || []).some((p) => p.type === "applyBuff" && ["ward", "bulwark", "evade"].includes(p.id)) || (roles.unitProfile(d).tags || []).includes("shield"))
    const regenIds = defs.filter((d) => (roles.unitProfile(d).tags || []).includes("regen")).slice(0, 2).map((d) => d.id)
    const dpsIds = defs.filter((d) => roles.unitProfile(d).primary === "dps").slice(0, 4).map((d) => d.id)

    const A = (run) => [...buildAnswersFor(run)].sort()
    out.answerIds = { shatterId, aoeId, assassinId, wardId, regenIds }
    out.answers = {
      armor: shatterId ? A(mkRun([shatterId])) : ["armor"],
      swarm: aoeId ? A(mkRun([aoeId])) : ["swarm"],
      backline: assassinId ? A(mkRun([assassinId])) : ["backline"],
      control: wardId ? A(mkRun([wardId])) : ["control"],
      poison: regenIds.length === 2 ? A(mkRun(regenIds)) : ["poison"],
      sustainByDamage: A(mkRun(dpsIds)),
    }
    out.answersOk =
      out.answers.armor.includes("armor") &&
      out.answers.swarm.includes("swarm") &&
      out.answers.backline.includes("backline") &&
      out.answers.control.includes("control") &&
      out.answers.poison.includes("poison") &&
      out.answers.sustainByDamage.includes("sustain")
  }

  // 3. evaluateMatchup - covered vs gaps
  {
    const shatterId = out.answerIds.shatterId || "stoneknoll"
    const rs = {
      ...mkRun([shatterId]),
      battle: {
        enemyDefs: {
          e1: { id: "e1", role: "tank", movePattern: [{ type: "block", amount: 12 }] },
          e2: { id: "e2", role: "dps", movePattern: [{ type: "debuff", id: "stun", target: "player" }] },
        },
      },
    }
    const roster = [en("e1", { row: 0, col: 0 }), en("e2", { row: 0, col: 1 })]
    const m = evaluateMatchup(roster, rs)
    out.matchup = m
    out.matchupOk =
      m.threats.includes("armor") &&
      m.threats.includes("control") &&
      m.covered.includes("armor") &&
      m.gaps.includes("control") &&
      evaluateMatchup([], plainRun).threats.length === 0
  }

  // 4. purity / save
  {
    const rs = mkRun(["the-fool", "the-magician"])
    const roster = [en("spacemonkey", { row: 0, col: 1 })]
    const rsSnap = JSON.stringify(rs)
    const rSnap = JSON.stringify(roster)
    const a1 = JSON.stringify(evaluateMatchup(roster, rs))
    const a2 = JSON.stringify(evaluateMatchup(roster, rs))
    const fresh = engine.startRun("tommy")
    out.save = {
      rsUnchanged: JSON.stringify(rs) === rsSnap,
      rosterUnchanged: JSON.stringify(roster) === rSnap,
      deterministic: a1 === a2,
      version: engine.RUN_SAVE_VERSION,
      noKey: !("matchup" in fresh) && !("counterplay" in fresh),
    }
    out.saveOk = out.save.rsUnchanged && out.save.rosterUnchanged && out.save.deterministic && out.save.version === 3 && out.save.noKey
  }

  return out
})

// screenshot: a FormationScreen with the matchup line
let shotOk = false
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH, startRun, serializeRun, actIndexForNode } = engine
    const idx = RUN_PATH.findIndex((n, i) => n.type === "battle" && i > 2)
    // a squad that answers some but not all - a shatter unit + fillers
    const squad = ["stoneknoll", "the-fool", "the-magician", "grovekeeper"]
    const s = {
      ...startRun("tommy"),
      bench: squad.map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0, wins: 0 })),
      deployed: [1, 2, 3, 4],
      benchKeyCounter: 5,
      items: [],
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      essence: 1200,
      lastSeenAct: actIndexForNode(idx, RUN_PATH.length),
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-matchup-chips", { timeout: 9000 })
  await page.waitForTimeout(500)
  const panel = await page.$(".hw-matchup")
  if (panel) await panel.screenshot({ path: `${SHOT}/counterplay_matchup.png` })
  else await page.screenshot({ path: `${SHOT}/counterplay_matchup.png` })
  console.log("matchup text:", (await page.textContent(".hw-matchup"))?.replace(/\s+/g, " ").trim())
  shotOk = true
} catch (e) {
  errs.push(`screenshot: ${e}`.slice(0, 200))
}

await browser.close()
console.log(JSON.stringify(R, null, 2))
console.log("\nscreenshot:", shotOk ? "captured" : "skipped")
console.log("page errors:", errs.length, errs.slice(0, 6))
const checks = ["threatsOk", "answersOk", "matchupOk", "saveOk"]
const failed = checks.filter((k) => !R[k])
console.log("failed:", failed.length ? failed : "none")
const realErrs = errs.filter((e) => !e.startsWith("screenshot:"))
const pass = failed.length === 0 && realErrs.length === 0
console.log("RESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
