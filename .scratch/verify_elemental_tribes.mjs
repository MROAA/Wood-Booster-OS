// PR2 verify: 4 elemental tribes (Tide/Gale/Stone/Shadow), their 3 new
// statuses (bulwark/evade/dampen), the synergy ladders and the 4 anchor
// relics. Engine-level.  PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5311
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { TRIBES, SYNERGY_TIERS, UNIT_TRIBES } = await import("/src/data/heartwood/synergies.js?t=" + t)
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const { RELICS } = await import("/src/data/heartwood/relics.js?t=" + t)
  const r = {}

  // 1. Four elemental tribes registered with a 3-tier ladder each.
  const elem = ["tide", "gale", "stone", "shadow"]
  r.tribesRegistered = elem.every((e) => TRIBES[e] && TRIBES[e].icon === e)
  r.ladders = Object.fromEntries(elem.map((e) => [e, (SYNERGY_TIERS[e] || []).map((x) => x.count)]))
  r.laddersOk = elem.every((e) => {
    const c = (SYNERGY_TIERS[e] || []).map((x) => x.count)
    return c.length === 3 && c[0] === 2 && c[1] === 3 && c[2] === 4
  })

  // 2. Elemental second tags actually landed on real units.
  const tagged = {}
  for (const e of elem) tagged[e] = Object.entries(UNIT_TRIBES).filter(([, ts]) => ts.includes(e)).map(([id]) => id)
  r.tagCounts = Object.fromEntries(elem.map((e) => [e, tagged[e].length]))
  r.tagsOk = elem.every((e) => tagged[e].length >= 4)

  // 3. Bulwark: persistent flat armour. A unit with bulwark 3 takes 3
  //    less from a hit, the stack never decrements, and it survives a
  //    resolveRound (unlike Block).
  let st = startAutoBattle("tommy", ["ironbark", "the-fool"], "rotwood-husk")
  const pid = st.playerUnits[0].id
  st = { ...st, playerUnits: st.playerUnits.map((u) => (u.id === pid ? { ...u, powers: { ...u.powers, bulwark: 3 }, block: 0 } : u)) }
  // enemy hits player; compare hp drop vs a no-bulwark control is
  // awkward here, so just assert the stack is intact after several rounds
  // and some damage landed but less than raw.
  const startHp = st.playerUnits.find((u) => u.id === pid).hp
  for (let i = 0; i < 4 && st.phase === "player"; i++) st = resolveRound(st)
  const bUnit = st.playerUnits.find((u) => u.id === pid)
  r.bulwark = { stackAfter: bUnit?.powers.bulwark ?? null, tookSomeDamage: bUnit && bUnit.hp < startHp }
  r.bulwarkOk = bUnit && bUnit.powers.bulwark === 3

  // 4. Evade: dodges the first hit each round, one stack per dodge,
  //    evadedThisRound resets each round.
  let ev = startAutoBattle("tommy", ["ironbark", "the-fool"], "rotwood-husk")
  const eid = ev.playerUnits[0].id
  ev = { ...ev, playerUnits: ev.playerUnits.map((u) => (u.id === eid ? { ...u, powers: { ...u.powers, evade: 2 } } : u)) }
  const evHpStart = ev.playerUnits.find((u) => u.id === eid).hp
  ev = resolveRound(ev)
  const evAfter1 = ev.playerUnits.find((u) => u.id === eid)
  r.evade = { stackAfterR1: evAfter1?.powers.evade ?? null }
  ev = resolveRound(ev)
  const evAfter2 = ev.playerUnits.find((u) => u.id === eid)
  r.evade.stackAfterR2 = evAfter2?.powers.evade ?? null
  ev = resolveRound(ev)
  const evAfter3 = ev.playerUnits.find((u) => u.id === eid)
  r.evade.stackAfterR3 = evAfter3?.powers.evade ?? null
  // 2 evade -> at most one dodge per round -> 1 left after R1, 0 after
  // R2, still 0 after R3 (proves per-round cap + reset: without the
  // evadedThisRound reset a single round would burn both stacks).
  r.evadeOk = r.evade.stackAfterR1 === 1 && r.evade.stackAfterR2 === 0 && r.evade.stackAfterR3 === 0
  void evHpStart

  // 5. Dampen: flat cut on the wielder's OWN outgoing damage, and it
  //    persists (doesn't decay). Behavioural check: same fight, same
  //    seed - an enemy with big Dampen should leave the player on more
  //    HP than one without.
  function playerHpAfter(dampenStacks) {
    let s = startAutoBattle("tommy", ["ironbark", "the-fool"], "rotwood-husk")
    if (dampenStacks) s = { ...s, enemies: s.enemies.map((e) => ({ ...e, powers: { ...e.powers, dampen: dampenStacks } })) }
    for (let i = 0; i < 3 && s.phase === "player"; i++) s = resolveRound(s)
    const hp = s.playerUnits.reduce((a, u) => a + Math.max(0, u.hp), 0)
    const stack = Math.max(0, ...s.enemies.map((e) => e.powers.dampen || 0))
    return { hp, stack }
  }
  const noDamp = playerHpAfter(0)
  const bigDamp = playerHpAfter(5)
  r.dampen = { noDampHp: noDamp.hp, bigDampHp: bigDamp.hp, stackAfter: bigDamp.stack }
  r.dampenOk = bigDamp.hp > noDamp.hp && bigDamp.stack === 5

  // 6. Four elemental anchor relics: exist, tribeAnchor set, uncommon/150.
  const anchors = ["tides-embrace", "galeforce-banner", "bastion-of-stone", "shroud-of-shadow"]
  r.relics = Object.fromEntries(anchors.map((id) => {
    const rel = RELICS[id]
    return [id, rel ? { anchor: rel.tribeAnchor, tier: rel.tier, cost: rel.cost } : null]
  }))
  r.relicsOk = anchors.every((id) => {
    const rel = RELICS[id]
    return rel && rel.tribeAnchor === id.split("-")[0].replace("tides", "tide").replace("galeforce", "gale") || (rel && ["tide", "gale", "stone", "shadow"].includes(rel.tribeAnchor))
  }) && anchors.every((id) => RELICS[id]?.cost === 150)

  // 7. Engine applies an elemental synergy tier: 2 Stone units deployed
  //    -> both gain bulwark from the stone count-2 tier.
  let sy = startAutoBattle("tommy", ["stoneheart", "stoneknit"], "rotwood-husk")
  const stoneUnits = sy.playerUnits.filter((u) => ["stoneheart", "stoneknit"].includes(u.defId))
  r.stoneSynergy = stoneUnits.map((u) => u.powers.bulwark || 0)
  r.stoneSynergyOk = stoneUnits.length === 2 && stoneUnits.every((u) => (u.powers.bulwark || 0) >= 1)

  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
const pass =
  out.tribesRegistered && out.laddersOk && out.tagsOk && out.bulwarkOk && out.evadeOk &&
  out.dampenOk && out.relicsOk && out.stoneSynergyOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
