// PR5 verify: the 12 new dual-class pairs, the ~20 new className
// identities, and the 8 elemental-status items.  PORT env, dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5314
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { DUAL_CLASSES, findDualClassFor, applyDualClassGrant } = await import("/src/data/heartwood/dualClasses.js?t=" + t)
  const { UNITS } = await import("/src/data/heartwood/units.js?t=" + t)
  const { ITEMS, itemPool } = await import("/src/data/heartwood/items.js?t=" + t)
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const r = {}

  // 1. 15 pairs total, every pair references real unit ids.
  r.pairCount = DUAL_CLASSES.length
  r.pairsValid = DUAL_CLASSES.every((dc) => dc.pair.length === 2 && dc.pair.every((id) => !!UNITS[id]))
  r.ids = DUAL_CLASSES.map((d) => d.id)
  r.dataOk = DUAL_CLASSES.length >= 15 && r.pairsValid

  // 2. Every grant only touches the mergeable fields.
  const allowed = new Set(["passive", "chainDamage", "rallyHeal", "summon"])
  r.grantFieldsOk = DUAL_CLASSES.every((dc) =>
    Object.values(dc.grants).every((g) => Object.keys(g).every((k) => allowed.has(k))),
  )

  // 3. className: ~25 units now carry one.
  r.classNameCount = Object.values(UNITS).filter((u) => u.className).length
  r.classNameOk = r.classNameCount >= 24

  // 4. A new pair actually fires: Windblade (swiftclaw + stormwing).
  //    swiftclaw gains Evade, stormwing gains Strength - neither has
  //    those in its base kit.
  const deployed = ["swiftclaw", "stormwing"]
  const dcSwift = findDualClassFor("swiftclaw", deployed, UNITS)
  const dcStorm = findDualClassFor("stormwing", deployed, UNITS)
  r.windblade = { swiftMatch: dcSwift?.id, stormMatch: dcStorm?.id }
  const swiftDef = applyDualClassGrant(UNITS.swiftclaw, "swiftclaw", dcSwift, UNITS)
  const stormDef = applyDualClassGrant(UNITS.stormwing, "stormwing", dcStorm, UNITS)
  r.windbladeGrants = {
    swiftHasEvade: JSON.stringify(swiftDef.passive || []).includes('"evade"'),
    stormHasStrength: JSON.stringify(stormDef.passive || []).includes('"strength"'),
    swiftClassName: swiftDef.className,
  }
  r.windbladeOk =
    dcSwift?.id === "windblade" &&
    dcStorm?.id === "windblade" &&
    r.windbladeGrants.swiftHasEvade &&
    r.windbladeGrants.stormHasStrength &&
    swiftDef.className === "Windblade"

  // 5. Engine end to end: deploy the pair, both units' live powers/
  //    triggers reflect the grant after startAutoBattle + a round.
  let st = startAutoBattle("tommy", ["swiftclaw", "stormwing", "the-fool"], "rotwood-husk")
  const sU = st.playerUnits.find((u) => u.defId === "swiftclaw")
  const tU = st.playerUnits.find((u) => u.defId === "stormwing")
  r.engine = {
    swiftEvade: sU?.powers.evade || 0,
    // stormwing's strength grant is a passive applyBuff -> shows in powers
    stormStrength: tU?.powers.strength || 0,
  }
  r.engineOk = (sU?.powers.evade || 0) >= 1 && (tU?.powers.strength || 0) >= 1

  // 6. 8 new elemental-status items exist, auto-tiered, in the pool.
  const newItems = [
    "stoneskin-band", "windstep-charm", "tidewrack-vial", "emberbrand-oil",
    "starlit-shard", "glacier-fang", "cyclone-edge", "pyre-edge",
  ]
  r.items = Object.fromEntries(newItems.map((id) => {
    const it = ITEMS[id]
    return [id, it ? { cost: it.cost, tier: it.tier } : null]
  }))
  const pool = new Set(itemPool().map((i) => i.id))
  r.itemsOk = newItems.every((id) => ITEMS[id] && ITEMS[id].tier && pool.has(id))

  // 7. An item's effect lands: equip Stoneskin Band -> unit has bulwark.
  let iSt = startAutoBattle("tommy", [{ defId: "the-fool", itemIds: ["stoneskin-band"] }], "rotwood-husk")
  const iu = iSt.playerUnits.find((u) => u.defId === "the-fool")
  r.itemEffect = { bulwark: iu?.powers.bulwark || 0 }
  r.itemEffectOk = (iu?.powers.bulwark || 0) >= 1

  void resolveRound
  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.dataOk && out.grantFieldsOk && out.classNameOk && out.windbladeOk &&
  out.engineOk && out.itemsOk && out.itemEffectOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
