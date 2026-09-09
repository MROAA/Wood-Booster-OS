import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - Strategic Playstyle profile (feat/hearthwood-playstyle-profile).
// evaluatePlaystyle(runState) is a PURE function (evaluateBuild precedent)
// -> six 0-100 axes + the dominant lean, derived from the whole run's
// choices. No runState write, no save bump -> the fairness pass is a
// smoke check; these assertions are the gate.

const PORT = process.env.PORT || 5354
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-playstyle/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const ps = await import("/src/data/heartwood/playstyle.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const roles = await import("/src/data/heartwood/roles.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { evaluatePlaystyle, PLAYSTYLE_AXES } = ps
  const out = {}
  const AX = PLAYSTYLE_AXES.map((a) => a.id)

  const defs = Object.values(UNITS).filter((d) => d.role && !d.fusedFrom && !d.evolvedFrom && !d.summonOnly && !d.displayTier)
  const byPrimary = (p, n) => defs.filter((d) => roles.unitProfile(d).primary === p).slice(0, n).map((d) => d.id)

  const mkRun = (defIds, extra = {}, upgrades = []) => {
    const base = engine.startRun("tommy")
    const bench = defIds.map((defId, i) => ({ key: i + 1, defId, upgrades: upgrades[i] || [], upgradeLevel: 0, wins: 0 }))
    return { ...base, bench, deployed: [1, 2, 3, 4].slice(0, defIds.length), items: [], nodeIndex: 6, ...extra }
  }

  // 1. curated-run dominance
  const aggr = evaluatePlaystyle(
    mkRun(byPrimary("dps", 3).concat(byPrimary("assassin", 1)), {}, [["power"], ["power"], ["power"], ["power"]]),
  )
  const def = evaluatePlaystyle(
    mkRun(byPrimary("tank", 2).concat(byPrimary("healer", 2)), {}, [["defense"], ["defense"], ["synergy"], ["synergy"]]),
  )
  const econ = evaluatePlaystyle(
    mkRun(byPrimary("dps", 2), {
      recruitDiscount: 0.2,
      shopSlotBonus: 1,
      ledgerWinBonus: 40,
      marketLevel: 4,
    }, [["economy"], ["economy"]]),
  )
  const ctrl = evaluatePlaystyle(
    mkRun(byPrimary("control", 2).concat(byPrimary("debuffer", 2)), {}, [["utility"], ["utility"], [], []]),
  )
  const RUN_PATH = engine.RUN_PATH
  const eliteNodes = RUN_PATH.filter((n) => n.type === "elite" || n.type === "miniboss").slice(0, 4)
  const risk = evaluatePlaystyle(
    mkRun(byPrimary("dps", 2), {
      runModifiers: engine.RUN_PATH ? [] : [],
      path: eliteNodes,
      nodeIndex: 8,
      essence: 10,
    }),
  )
  // add real bane ids from boons.js
  const boons = await import("/src/data/heartwood/boons.js")
  const baneIds = boons.RUN_BANES.slice(0, 2).map((m) => m.id)
  const risk2 = evaluatePlaystyle(mkRun(byPrimary("dps", 2), { runModifiers: baneIds, path: eliteNodes, nodeIndex: 8, essence: 10 }))
  const adapt = evaluatePlaystyle(
    mkRun(defs.slice(0, 4).map((d) => d.id), { eventLog: [{}, {}, {}, {}] }, [["power"], ["defense"], ["utility"], ["economy"]]),
  )

  out.dominants = { aggr: aggr.dominant, def: def.dominant, econ: econ.dominant, ctrl: ctrl.dominant, risk2Top2: [risk2.dominant, risk2.secondary], adaptTop2: [adapt.dominant, adapt.secondary] }
  out.dominanceOk =
    aggr.dominant === "aggression" &&
    def.dominant === "defense" &&
    econ.dominant === "economy" &&
    ctrl.dominant === "control" &&
    [risk2.dominant, risk2.secondary].includes("risk") &&
    [adapt.dominant, adapt.secondary].includes("adaptation")

  // 2. shape
  const shapeCheck = (r) =>
    AX.every((a) => Number.isInteger(r.scores[a]) && r.scores[a] >= 0 && r.scores[a] <= 100) &&
    (r.dominant === null || AX.includes(r.dominant)) &&
    (r.secondary === null || (AX.includes(r.secondary) && r.secondary !== r.dominant)) &&
    typeof r.blurb === "string" &&
    r.blurb.length > 0 &&
    !r.blurb.includes("\n")
  const empty = evaluatePlaystyle(engine.startRun("tommy"))
  let degOk = true
  try {
    evaluatePlaystyle({})
    evaluatePlaystyle({ bench: [{ key: 1, defId: "__nope__" }] })
  } catch {
    degOk = false
  }
  out.empty = { dominant: empty.dominant, blurb: empty.blurb, allZero: AX.every((a) => empty.scores[a] === 0) }
  out.shapeOk =
    [aggr, def, econ, ctrl, risk2, adapt].every(shapeCheck) &&
    empty.dominant === null &&
    out.empty.allZero &&
    /hasn't taken shape/.test(empty.blurb) &&
    degOk

  // 3. purity / save
  {
    const rs = mkRun(byPrimary("dps", 2), { marketLevel: 3 }, [["power"], ["economy"]])
    const snap = JSON.stringify(rs)
    const a1 = JSON.stringify(evaluatePlaystyle(rs))
    const a2 = JSON.stringify(evaluatePlaystyle(rs))
    const fresh = engine.startRun("tommy")
    out.save = {
      unchanged: JSON.stringify(rs) === snap,
      deterministic: a1 === a2,
      version: engine.RUN_SAVE_VERSION,
      noKey: !("playstyle" in fresh),
    }
    out.saveOk = out.save.unchanged && out.save.deterministic && out.save.version === 3 && out.save.noKey
  }

  return out
})

// screenshots: RunEndOverlay panel + the shop rail compact line
let shotOk = false
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const roles = await import("/src/data/heartwood/roles.js")
    const { UNITS } = await import("/src/data/heartwood/units.js")
    const { RUN_PATH, startRun, serializeRun } = engine
    const dps = Object.values(UNITS)
      .filter((d) => d.role && !d.fusedFrom && !d.evolvedFrom && !d.summonOnly && !d.displayTier && roles.unitProfile(d).primary === "dps")
      .slice(0, 4)
      .map((d) => d.id)
    const bench = dps.map((defId, i) => ({ key: i + 1, defId, upgrades: ["power"], upgradeLevel: 1, wins: 0 }))
    // sit at a shop node so the RunRail (with the compact line) renders
    const idx = RUN_PATH.findIndex((n) => n.type === "shop")
    const s = {
      ...startRun("tommy"),
      bench,
      deployed: [1, 2, 3, 4],
      items: [],
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "shop",
      essence: 800,
      benchKeyCounter: 5,
      marketLevel: 2,
      commanderRank: 2,
      lastSeenAct: 1,
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-playstyle-compact", { timeout: 8000 })
  await page.waitForTimeout(400)
  const rail = await page.$(".hw-run-rail")
  if (rail) await rail.screenshot({ path: `${SHOT}/playstyle_rail.png` })
  const compactText = await page.textContent(".hw-playstyle-compact")

  // now a run-end overlay (defeat)
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const roles = await import("/src/data/heartwood/roles.js")
    const { UNITS } = await import("/src/data/heartwood/units.js")
    const { RUN_PATH, startRun, serializeRun } = engine
    const mix = []
      .concat(Object.values(UNITS).filter((d) => d.role && roles.unitProfile(d).primary === "tank" && !d.fusedFrom && !d.displayTier).slice(0, 2).map((d) => d.id))
      .concat(Object.values(UNITS).filter((d) => d.role && roles.unitProfile(d).primary === "healer" && !d.fusedFrom && !d.displayTier).slice(0, 2).map((d) => d.id))
    const bench = mix.map((defId, i) => ({ key: i + 1, defId, upgrades: ["defense"], upgradeLevel: 1, wins: 0 }))
    const s = {
      ...startRun("tommy"),
      bench,
      deployed: [1, 2, 3, 4],
      items: [],
      nodeIndex: 12,
      path: RUN_PATH.slice(0, 13),
      phase: "defeat",
      deathMemory: { heroName: "Bulwark of Ages", heroClass: null, commanderName: "Tommy", ts: Date.now() },
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  })
  await page.reload()
  await page.waitForSelector(".hw-playstyle-bars", { timeout: 8000 })
  await page.waitForTimeout(2600) // RunEndOverlay staggers its reveals (playstyle ~1.9s in)
  await page.screenshot({ path: `${SHOT}/playstyle_runend.png` })
  console.log("compact line:", compactText?.trim())
  shotOk = true
} catch (e) {
  errs.push(`screenshot: ${e}`.slice(0, 200))
}

await browser.close()
console.log(JSON.stringify(R, null, 2))
console.log("\nscreenshot:", shotOk ? "captured" : "skipped")
console.log("page errors:", errs.length, errs.slice(0, 6))
const checks = ["dominanceOk", "shapeOk", "saveOk"]
const failed = checks.filter((k) => !R[k])
console.log("failed:", failed.length ? failed : "none")
const realErrs = errs.filter((e) => !e.startsWith("screenshot:"))
const pass = failed.length === 0 && realErrs.length === 0
console.log("RESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
