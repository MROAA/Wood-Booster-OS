import { chromium } from "playwright"

// Hearthwood - unit upgrade branches (feat/hearthwood-upgrade-branches).
// Marc's PRDs: a unit's level-up stops being "+15% to everything" and
// becomes a choice - Power / Defense / Synergy / Utility / Economy.
// Headless module-import checks against the dev server (units.js pulls
// in image assets, so node can't import it directly).

const PORT = process.env.PORT || 5345
const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const units = await import("/src/data/heartwood/units.js")
  const upg = await import("/src/data/heartwood/upgrades.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const battle = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS, unitDefWithUpgrade, upgradeCost } = units
  const { applyBranch, branchAvailable, UPGRADE_BRANCHES, ECONOMY_WIN_BONUS } = upg
  const { startAutoBattle } = battle
  const out = {}
  const near = (a, b, tol = 1) => Math.abs(a - b) <= tol

  // --- 1. upgradeUnit economics ------------------------------------
  {
    const base = engine.startRun("tommy")
    const rs0 = { ...base, essence: 9999, bench: [{ key: "b1", defId: "the-fool", upgrades: [] }] }
    const l1 = engine.upgradeUnit(rs0, "b1", "power")
    const l2 = engine.upgradeUnit(l1, "b1", "power")
    const l3 = engine.upgradeUnit(l2, "b1", "power")
    const l4 = engine.upgradeUnit(l3, "b1", "power") // capped
    const brokeIn = { ...rs0, essence: 10 }
    const broke = engine.upgradeUnit(brokeIn, "b1", "power")
    const dup = engine.upgradeUnit(engine.upgradeUnit(rs0, "b1", "utility"), "b1", "utility") // utility twice
    const fused = engine.upgradeUnit(
      { ...rs0, bench: [{ key: "b1", defId: "the-fool" + units.TIER2_SUFFIX, upgrades: [] }] },
      "b1",
      "power",
    )
    out.econ = {
      spent1: rs0.essence - l1.essence,
      spent2: l1.essence - l2.essence,
      spent3: l2.essence - l3.essence,
      l3branches: l3.bench[0].upgrades,
      cappedNoop: l4.bench[0].upgrades.length === 3 && l4.essence === l3.essence,
      brokeNoop: broke === brokeIn && broke.essence === 10 && (broke.bench[0].upgrades || []).length === 0,
      dupNoop: dup.bench[0].upgrades.length === 1,
      fusedNoop: (fused.bench[0].upgrades || []).length === 0,
      costs: [upgradeCost(0), upgradeCost(1), upgradeCost(2), upgradeCost(3)],
    }
    out.econOk =
      out.econ.spent1 === 150 &&
      out.econ.spent2 === 300 &&
      out.econ.spent3 === 450 &&
      out.econ.l3branches.join() === "power,power,power" &&
      out.econ.cappedNoop &&
      out.econ.brokeNoop &&
      out.econ.dupNoop &&
      out.econ.fusedNoop &&
      out.econ.costs.join() === "150,300,450,"
  }

  // --- 2/3/6/8. branch def transforms ----------------------------
  {
    const d = UNITS["the-fool"]
    const atk0 = d.movePattern.find((m) => m.type === "attack").amount
    const p2 = unitDefWithUpgrade(d, ["power", "power"])
    const def1 = unitDefWithUpgrade(d, ["defense"])
    const uti1 = unitDefWithUpgrade(d, ["utility"])
    const legacy2 = unitDefWithUpgrade(d, 2) // legacy number path
    const atkOf = (def) => def.movePattern.find((m) => m.type === "attack").amount
    out.transforms = {
      powerHp: [p2.maxHp, Math.round(d.maxHp * 1.44)],
      powerAtk: [atkOf(p2), Math.round(atk0 * 1.44)],
      defHp: [def1.maxHp, Math.round(d.maxHp * 1.3)],
      defAtk: [atkOf(def1), Math.round(atk0 * 0.85)],
      defBulwark: (def1.passive || []).some((p) => p.type === "applyBuff" && p.id === "bulwark"),
      utilWeak: (uti1.passive || []).some((p) => p.type === "addTrigger" && p.effect?.id === "weak"),
      utilAtk: [atkOf(uti1), Math.round(atk0 * 0.9)],
      legacyHp: [legacy2.maxHp, Math.round(d.maxHp * 1.44)],
    }
    out.transformsOk =
      near(p2.maxHp, Math.round(d.maxHp * 1.44)) &&
      near(atkOf(p2), Math.round(atk0 * 1.44)) &&
      near(def1.maxHp, Math.round(d.maxHp * 1.3)) &&
      near(atkOf(def1), Math.round(atk0 * 0.85)) &&
      out.transforms.defBulwark &&
      out.transforms.utilWeak &&
      near(atkOf(uti1), Math.round(atk0 * 0.9)) &&
      near(legacy2.maxHp, Math.round(d.maxHp * 1.44))
  }

  // --- 4. synergy branch = +1 tribe count -----------------------
  {
    // the-fool + the-magician are both Thorn. Find the shared synergy
    // key a 2-Thorn squad grants that a 1-Thorn squad doesn't, then
    // show a 1-unit squad with the synergy branch grants the same.
    const p0 = (b) => startAutoBattle("tommy", b, "twin-watch").playerUnits.find((u) => u.id === "p0")
    const one = p0(["the-fool"]).powers
    const two = p0(["the-fool", "the-magician"]).powers
    const oneSyn = p0([{ defId: "the-fool", upgrades: ["synergy"] }]).powers
    const gainedKeys = Object.keys(two).filter((k) => (two[k] || 0) !== (one[k] || 0))
    const synKeys = Object.keys(oneSyn).filter((k) => (oneSyn[k] || 0) !== (one[k] || 0))
    out.synergy = { one, two, oneSyn, gainedKeys, synKeys, branchField: applyBranch("synergy", UNITS["the-fool"]).synergyBonus }
    out.synergyOk =
      applyBranch("synergy", UNITS["the-fool"]).synergyBonus === 1 &&
      gainedKeys.length > 0 &&
      gainedKeys.every((k) => synKeys.includes(k))
  }

  // --- 5. economy branch in essenceForWin ----------------------
  {
    const base = engine.startRun("tommy")
    const node = { type: "battle" }
    const mk = (deployedEconomyCount, extraBenched) => {
      const bench = []
      const deployed = []
      for (let i = 0; i < deployedEconomyCount; i++) {
        bench.push({ key: `d${i}`, defId: "the-fool", upgrades: ["economy"] })
        deployed.push(`d${i}`)
      }
      if (extraBenched) bench.push({ key: "x", defId: "the-fool", upgrades: ["economy"] }) // not deployed
      return { ...base, bench, deployed }
    }
    const b0 = engine.essenceForWin(mk(0), node)
    const b1 = engine.essenceForWin(mk(1), node)
    const b2 = engine.essenceForWin(mk(2), node)
    const bBench = engine.essenceForWin(mk(0, true), node)
    out.economy = { b0, b1, b2, bBench, bonus: ECONOMY_WIN_BONUS }
    out.economyOk = b1 - b0 === ECONOMY_WIN_BONUS && b2 - b0 === 2 * ECONOMY_WIN_BONUS && bBench === b0
  }

  // --- 7. save round-trip, no version bump ---------------------
  {
    const rs = engine.startRun("tommy")
    rs.bench = [{ key: "b1", defId: "the-fool", upgrades: ["power", "synergy"], upgradeLevel: 2 }]
    const round = engine.deserializeRun(engine.serializeRun(rs))
    out.save = {
      version: engine.RUN_SAVE_VERSION,
      roundTrip: round && round.bench && round.bench[0] && round.bench[0].upgrades,
    }
    out.saveOk =
      engine.RUN_SAVE_VERSION === 3 && !!round && (round.bench[0].upgrades || []).join() === "power,synergy"
  }

  // --- 9. branchAvailable rules -------------------------------
  {
    out.avail = {
      powerAlways: branchAvailable("power", ["power", "power"], 2),
      utilTakenBlocked: branchAvailable("utility", ["utility"], 1),
      utilFresh: branchAvailable("utility", ["power"], 1),
      branchCount: UPGRADE_BRANCHES.length,
      ids: UPGRADE_BRANCHES.map((b) => b.id).join(),
    }
    out.availOk =
      out.avail.powerAlways === true &&
      out.avail.utilTakenBlocked === false &&
      out.avail.utilFresh === true &&
      out.avail.branchCount === 5 &&
      out.avail.ids === "power,defense,synergy,utility,economy"
  }

  return out
})

await browser.close()
console.log(JSON.stringify(R, null, 2))
console.log("\npage errors:", errs.length, errs.slice(0, 5))
const checks = ["econOk", "transformsOk", "synergyOk", "economyOk", "saveOk", "availOk"]
const failed = checks.filter((k) => !R[k])
console.log("failed:", failed.length ? failed : "none")
const pass = failed.length === 0 && errs.length === 0
console.log("\nRESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
