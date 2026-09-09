import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - Economy crew (feat/hearthwood-economy-crew). 4 units whose
// payoff is the run's economy, derived each shop/win from a
// runState.deployed scan (economy.js). Real run-economy change -> the
// RUNS=100 fairness pass is the hard gate; these assertions pin the
// per-effect behaviour + save-safety.

const PORT = process.env.PORT || 5360
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-economy-crew/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const engine = await import("/src/services/heartwood/runEngine.js")
  const eco = await import("/src/data/heartwood/economy.js")
  const roles = await import("/src/data/heartwood/roles.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { tribesOf } = await import("/src/data/heartwood/synergies.js")
  const { economyCrew, economyCrewEffects, ECONOMY_ROLES } = eco
  const {
    startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION,
    effectiveRecruitCost, bankInterest, bankInterestFor, essenceForWin, rerollShop,
  } = engine
  const out = { errors: [] }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  const IDS = ["grove-merchant", "acorn-banker", "hollow-forager", "toll-warden"]
  const EXP = {
    "grove-merchant": { tier: "rare", cost: 150, hp: 54, role: "merchant" },
    "acorn-banker": { tier: "rare", cost: 150, hp: 54, role: "banker" },
    "hollow-forager": { tier: "uncommon", cost: 100, hp: 42, role: "forager" },
    "toll-warden": { tier: "uncommon", cost: 100, hp: 42, role: "toll-warden" },
  }

  // helper: a runState with the given defIds deployed
  const withDeployed = (defIds, extra = {}) => {
    const base = startRun("tommy")
    const bench = defIds.map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0, wins: 0 }))
    return { ...base, bench, deployed: [1, 2, 3, 4].slice(0, defIds.length).concat([null, null, null, null]).slice(0, 4), items: [], ...extra }
  }

  // 1. unit data
  {
    const data = IDS.map((id) => {
      const d = UNITS[id]
      if (!d) return { id, ok: false, reason: "missing" }
      const e = EXP[id]
      return {
        id,
        ok:
          d.tier === e.tier &&
          d.recruitCost === e.cost &&
          d.maxHp === e.hp &&
          d.role === "economy" &&
          d.economyRole === e.role &&
          roles.unitProfile(d).primary === "economy" &&
          tribesOf(id, d).length >= 1,
      }
    })
    out.unitData = data
    if (!data.every((x) => x.ok)) out.errors.push("check1 unit data")
  }

  // 2. economyCrewEffects — each alone, none, bench-not-deployed, stacking, cap
  {
    const def = economyCrewEffects(startRun("tommy"))
    const noneOk = eq(def, { recruitPct: 0, interestThreshold: 150, winBonus: 0, rerollFlat: false })
    const merch = economyCrewEffects(withDeployed(["grove-merchant"]))
    const bank = economyCrewEffects(withDeployed(["acorn-banker"]))
    const forg = economyCrewEffects(withDeployed(["hollow-forager"]))
    const toll = economyCrewEffects(withDeployed(["toll-warden"]))
    // on bench but NOT deployed -> no effect
    const benchOnly = withDeployed(["grove-merchant"])
    benchOnly.deployed = [null, null, null, null]
    const benchNoEffect = economyCrewEffects(benchOnly).recruitPct === 0
    // two foragers stack
    const twoForg = economyCrewEffects(withDeployed(["hollow-forager", "hollow-forager"])).winBonus
    // recruitPct cap: 4 merchants (0.4) is still under; the min(0.45, .)
    // clamp holds for any count
    const four = economyCrewEffects(withDeployed(["grove-merchant", "grove-merchant", "grove-merchant", "grove-merchant"])).recruitPct
    const capped = four <= 0.45 && Math.abs(four - 0.4) < 1e-9
    const crewList = economyCrew(withDeployed(["grove-merchant", "acorn-banker"])).map((c) => c.role).sort()
    out.effects = {
      noneOk,
      merch: merch.recruitPct,
      bank: bank.interestThreshold,
      forg: forg.winBonus,
      toll: toll.rerollFlat,
      benchNoEffect,
      twoForg,
      capped,
      crewList,
    }
    if (
      !(
        noneOk &&
        Math.abs(merch.recruitPct - 0.1) < 1e-9 &&
        bank.interestThreshold === 120 &&
        forg.winBonus === 12 &&
        toll.rerollFlat === true &&
        benchNoEffect &&
        twoForg === 24 &&
        capped &&
        eq(crewList, ["banker", "merchant"])
      )
    )
      out.errors.push("check2 economyCrewEffects")
  }

  // 3. recruit cost
  {
    const def150 = { recruitCost: 150 }
    const plain = effectiveRecruitCost(startRun("tommy"), def150)
    const withMerch = effectiveRecruitCost(withDeployed(["grove-merchant"]), def150)
    const withBoth = effectiveRecruitCost(withDeployed(["grove-merchant"], { recruitDiscount: 0.2 }), def150)
    out.recruit = { plain, withMerch, withBoth }
    // ceil(150*0.90)=135 ; ceil(150*0.70)=105
    if (!(plain === 150 && withMerch === 135 && withBoth === 105)) out.errors.push("check3 recruit cost")
  }

  // 4. interest
  {
    const defAt130 = bankInterest(130)
    const bankedAt130 = bankInterest(130, 120)
    const forRs = bankInterestFor(withDeployed(["acorn-banker"], { essence: 130 }))
    out.interest = { defAt130, bankedAt130, forRs }
    if (!(defAt130 === 0 && bankedAt130 === 13 && forRs === 13)) out.errors.push("check4 interest")
  }

  // 5. win payout
  {
    const node = { type: "battle" }
    const base = essenceForWin(withDeployed([]), node)
    const one = essenceForWin(withDeployed(["hollow-forager"]), node)
    const two = essenceForWin(withDeployed(["hollow-forager", "hollow-forager"]), node)
    // un-deployed forager adds nothing
    const benchRs = withDeployed(["hollow-forager"])
    benchRs.deployed = [null, null, null, null]
    const benchSame = essenceForWin(benchRs, node) === base
    out.win = { base, one, two, benchSame }
    if (!(one - base === 12 && two - base === 24 && benchSame)) out.errors.push("check5 win payout")
  }

  // 6. reroll
  {
    let rs = withDeployed(["toll-warden"], { essence: 99999, rerollCost: 50 })
    const costs = [rs.rerollCost]
    for (let i = 0; i < 3; i++) { rs = rerollShop(rs); costs.push(rs.rerollCost) }
    const flatOk = costs.every((c) => c === 50)
    let rs2 = withDeployed([], { essence: 99999, rerollCost: 50 })
    const costs2 = [rs2.rerollCost]
    for (let i = 0; i < 3; i++) { rs2 = rerollShop(rs2); costs2.push(rs2.rerollCost) }
    const stepOk = eq(costs2, [50, 100, 150, 200])
    out.reroll = { costs, costs2, flatOk, stepOk }
    if (!(flatOk && stepOk)) out.errors.push("check6 reroll")
  }

  // 7. save
  {
    const rs = withDeployed(["grove-merchant"])
    const round = deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))
    const lossless = round != null && round.bench.some((e) => e.defId === "grove-merchant")
    const noKey = startRun("tommy").economyCrew === undefined && startRun("tommy").economyRole === undefined
    out.save = { lossless, noKey, version: RUN_SAVE_VERSION }
    if (!(lossless && noKey && RUN_SAVE_VERSION === 3)) out.errors.push("check7 save")
  }

  // 8. purity
  {
    const rs = withDeployed(["grove-merchant", "acorn-banker"])
    const snap = JSON.stringify(rs)
    economyCrewEffects(rs); economyCrew(rs)
    const unchanged = JSON.stringify(rs) === snap
    const deterministic = eq(economyCrewEffects(rs), economyCrewEffects(rs))
    out.purity = { unchanged, deterministic }
    if (!(unchanged && deterministic)) out.errors.push("check8 purity")
    // sanity: the table has all 4 roles
    if (Object.keys(ECONOMY_ROLES).length !== 4) out.errors.push("check8 ECONOMY_ROLES size")
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_economy_crew PASS" : "\n❌ verify_economy_crew FAIL")
process.exit(pass ? 0 : 1)
