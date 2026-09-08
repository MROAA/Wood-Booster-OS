import { chromium } from "playwright"

// Hearthwood - Legendary tier + build-around unit mechanics
// (feat/hearthwood-legendary-units). Marc: "peli tarvitsee lisää
// unitteja ja eri harvinaisuuden tason kortteja" + "unitit tarvii
// lisää mekaniikkoja" -> a Legendary tier (250 Essence anchors) and
// three new hooks: growth (Ascendant at battle start), aura (per-round
// adjacent effect), conditionalPassive (battle-start payoff gated on
// squad / position). All assertions are LOG-based so they're
// deterministic regardless of how a battle plays out.

const PORT = process.env.PORT || 5343
const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const units = await import("/src/data/heartwood/units.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const battleEngine = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS } = units
  const { startAutoBattle, resolveRound } = battleEngine

  const out = {}
  // Base Legendaries only - makeTier2 auto-generates a "<id>+" fusion
  // form for every base unit (fusedFrom set, recruitCost null); those
  // are never shop-recruitable and are excluded here the same way
  // rollShop / reforgeUnit exclude them.
  const LEG_IDS = Object.values(UNITS).filter((u) => u.tier === "legendary" && !u.fusedFrom).map((u) => u.id)
  const RARE_NEW = ["saplingward", "emberbanner", "pack-elder", "stonemoot-sentinel"]

  // 1. tier data ------------------------------------------------------
  out.legendaryIds = LEG_IDS.sort()
  out.legendaryStats = LEG_IDS.map((id) => {
    const u = UNITS[id]
    return { id, tier: u.tier, cost: u.recruitCost, hp: u.maxHp }
  })
  out.tierDataOk =
    LEG_IDS.length === 4 &&
    LEG_IDS.every((id) => UNITS[id].tier === "legendary" && UNITS[id].recruitCost === 250 && UNITS[id].maxHp === 70) &&
    RARE_NEW.every((id) => UNITS[id] && UNITS[id].tier === "rare" && UNITS[id].recruitCost === 150 && UNITS[id].maxHp === 54)

  // 2. growth -------------------------------------------------------
  {
    const b = startAutoBattle("tommy", ["world-ash-elder", "the-fool", "the-magician"], "twin-watch")
    const elder0 = b.playerUnits.find((u) => u.id === "p0")
    const ascOk = elder0.powers.ascendant === 2
    const strAtStart = elder0.powers.strength || 0
    let s = b
    let rounds = 0
    while (s.phase === "player" && rounds < 3) {
      s = resolveRound(s)
      rounds++
    }
    const elderN = s.playerUnits.find((u) => u.id === "p0")
    const gainedPerRound = elderN ? (elderN.powers.strength || 0) - strAtStart : null
    out.growth = { ascendantAtStart: elder0.powers.ascendant, rounds, gainedStrength: gainedPerRound }
    out.growthOk = ascOk && rounds >= 1 && gainedPerRound === 2 * rounds
  }

  // 3. aura (positive + negative in one battle) ---------------------
  {
    // Squad picked so NO tribe hits count 2 (bulwark = warden/stone,
    // the-fool = thorn, pack-elder = fang) - the warden/stone count-2
    // synergy grants a squad-wide `turnStart block 2` that would exactly
    // mask the aura's own block-2 line. Commander = aatos (no block in
    // its squadPassive; tommy/repo both add +2 Block/round squad-wide).
    // p0 bulwark @ slot0(row2,col0); p1 the-fool @ slot1 (adjacent -
    // "Mosskit gain 2 Block" can only be the aura, its own pattern
    // blocks 3); p2 pack-elder @ slot2 (NOT adjacent to slot0; all-
    // attack pattern, so any "gain 2 Block" for it is the aura).
    let s = startAutoBattle("aatos", ["bulwark-of-ages", "the-fool", "pack-elder"], "twin-watch")
    let rounds = 0
    while (s.phase === "player" && rounds < 2) {
      s = resolveRound(s)
      rounds++
    }
    const adjacentGotAura = s.log.some((l) => /Mosskit gain 2 Block/.test(l))
    const farGotAura = s.log.some((l) => /Pack Elder gain 2 Block/.test(l))
    out.aura = { rounds, adjacentGotAura, farGotAura }
    out.auraOk = adjacentGotAura && !farGotAura
  }

  // 4. conditionalPassive: tribeCount (The Thorn Throne) -----------
  {
    const withThree = startAutoBattle("tommy", ["the-thorn-throne", "the-fool", "the-magician"], "twin-watch")
    const withTwo = startAutoBattle("tommy", ["the-thorn-throne", "the-fool", "grovekeeper"], "twin-watch")
    const fired = (b) => b.log.filter((l) => /The Thorn Throne gain 5 strength/.test(l)).length
    out.condTribe = { threeThorn: fired(withThree), twoThorn: fired(withTwo) }
    out.condTribeOk = fired(withThree) === 1 && fired(withTwo) === 0
  }

  // 5. conditionalPassive: frontRow (Deepwood Sovereign) ----------
  {
    // slot 3 == SLOT_POSITIONS[3] == {row:1,col:1} == front row.
    const front = startAutoBattle("tommy", ["the-fool", "the-fool", "the-fool", "deepwood-sovereign"], "twin-watch")
    const back = startAutoBattle("tommy", ["deepwood-sovereign", "the-fool", "the-fool"], "twin-watch")
    const firedStr = (b) => b.log.some((l) => /Deepwood Sovereign gain 4 strength/.test(l))
    const firedExe = (b) => b.log.some((l) => /Deepwood Sovereign gain 3 execute/.test(l))
    out.condPos = { frontStr: firedStr(front), frontExe: firedExe(front), backStr: firedStr(back), backExe: firedExe(back) }
    out.condPosOk = firedStr(front) && firedExe(front) && !firedStr(back) && !firedExe(back)
  }

  // 6. shop bound -------------------------------------------------
  {
    const base = engine.startRun("tommy")
    let hitRolls = 0
    let maxPerRoll = 0
    for (let i = 0; i < 400; i++) {
      const r = engine.rerollShop({ ...base, essence: 999999, rerollCost: 0, marketLevel: 3 })
      const legs = r.shopOffers.filter((id) => LEG_IDS.includes(id))
      if (legs.length) hitRolls++
      if (legs.length > maxPerRoll) maxPerRoll = legs.length
    }
    let hitL2 = 0
    for (let i = 0; i < 400; i++) {
      const r = engine.rerollShop({ ...base, essence: 999999, rerollCost: 0, marketLevel: 2 })
      if (r.shopOffers.some((id) => LEG_IDS.includes(id))) hitL2++
    }
    out.shop = { l3HitRate: hitRolls / 400, l3MaxPerRoll: maxPerRoll, l2Hits: hitL2 }
    out.shopOk = hitRolls / 400 > 0.06 && hitRolls / 400 < 0.2 && maxPerRoll === 1 && hitL2 === 0
  }

  // 7. reforge guard -------------------------------------------
  {
    const base = engine.startRun("tommy")
    const rs = { ...base, essence: 999999, bench: [{ key: "b1", defId: "world-ash-elder", upgradeLevel: 0 }] }
    const after = engine.reforgeUnit(rs, "b1")
    out.reforge = { defId: after.bench[0].defId, essence: after.essence }
    out.reforgeOk = after.bench[0].defId === "world-ash-elder" && after.essence === rs.essence
  }

  // 8. almanac auto-collect ----------------------------------
  {
    const base = engine.startRun("tommy")
    const after = engine.recruitUnit({ ...base, essence: 999999, shopOffers: ["world-ash-elder"] }, "world-ash-elder")
    out.almanac = { seenUnits: (after.seen && after.seen.units) || [] }
    out.almanacOk = !!after.seen && Array.isArray(after.seen.units) && after.seen.units.includes("world-ash-elder")
  }

  // 9. save round-trip + version --------------------------
  {
    const rs = engine.startRun("tommy")
    rs.bench = [{ key: "b1", defId: "the-thorn-throne", upgradeLevel: 0 }]
    const round = engine.deserializeRun(engine.serializeRun(rs))
    out.save = { version: engine.RUN_SAVE_VERSION, roundTripDefId: round && round.bench && round.bench[0] && round.bench[0].defId }
    out.saveOk = engine.RUN_SAVE_VERSION === 3 && !!round && round.bench[0].defId === "the-thorn-throne"
  }

  return out
})

await browser.close()

console.log(JSON.stringify(R, null, 2))
console.log("\npage errors:", errs.length, errs.slice(0, 5))

const checks = ["tierDataOk", "growthOk", "auraOk", "condTribeOk", "condPosOk", "shopOk", "reforgeOk", "almanacOk", "saveOk"]
const failed = checks.filter((k) => !R[k])
console.log("failed checks:", failed.length ? failed : "none")
const pass = failed.length === 0 && errs.length === 0
console.log("\nRESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
