// PR3 verify: Wood/Ember/Cosmic tribes + the burn and ascendant
// statuses + the 3 anchor relics.  PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5312
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

  const elem = ["wood", "ember", "cosmic"]
  r.tribesRegistered = elem.every((e) => TRIBES[e] && TRIBES[e].icon === e)
  r.laddersOk = elem.every((e) => {
    const c = (SYNERGY_TIERS[e] || []).map((x) => x.count)
    return c.length === 3 && c[0] === 2 && c[1] === 3 && c[2] === 4
  })
  r.tagCounts = Object.fromEntries(elem.map((e) => [e, Object.values(UNIT_TRIBES).filter((ts) => ts.includes(e)).length]))
  r.tagsOk = elem.every((e) => r.tagCounts[e] >= 4)

  // the-moon mistag fix: was ["thorn"], now grove + cosmic.
  r.theMoon = UNIT_TRIBES["the-moon"]
  r.theMoonOk = Array.isArray(r.theMoon) && r.theMoon.includes("grove") && r.theMoon.includes("cosmic")

  // Burn: halves each round after ticking (8 -> 4 -> 2 -> 1 -> 0), and
  // ignores Block.
  let b = startAutoBattle("tommy", ["ironbark", "the-fool"], "rotwood-husk")
  const bid = b.enemies[0].id
  b = { ...b, enemies: b.enemies.map((e) => (e.id === bid ? { ...e, powers: { ...e.powers, burn: 8 }, hp: 999, maxHp: 999, block: 50 } : e)) }
  const seq = []
  for (let i = 0; i < 5 && b.phase === "player"; i++) {
    b = resolveRound(b)
    const u = b.enemies.find((e) => e.id === bid)
    seq.push(u ? u.powers.burn || 0 : null)
  }
  r.burnSeq = seq
  // after R1 tick: 8 dealt, stack -> 4; R2: -> 2; R3: -> 1; R4: -> 0
  r.burnOk = seq[0] === 4 && seq[1] === 2 && seq[2] === 1 && seq[3] === 0

  // Ascendant: +stack Strength every round, stack unchanged.
  let a = startAutoBattle("tommy", ["ironbark", "the-fool"], "rotwood-husk")
  const aid = a.playerUnits[0].id
  a = { ...a, playerUnits: a.playerUnits.map((u) => (u.id === aid ? { ...u, powers: { ...u.powers, ascendant: 2, strength: 0 } } : u)) }
  const strSeq = []
  for (let i = 0; i < 3 && a.phase === "player"; i++) {
    a = resolveRound(a)
    const u = a.playerUnits.find((x) => x.id === aid)
    strSeq.push(u ? { str: u.powers.strength || 0, asc: u.powers.ascendant || 0 } : null)
  }
  r.ascSeq = strSeq
  r.ascOk = strSeq[0]?.str === 2 && strSeq[1]?.str === 4 && strSeq[2]?.str === 6 && strSeq.every((x) => x.asc === 2)

  // 3 anchor relics: exist, tribeAnchor, uncommon/150.
  const anchors = { "heartwood-bloom": "wood", emberbrand: "ember", "starlit-crown": "cosmic" }
  r.relics = Object.fromEntries(Object.keys(anchors).map((id) => {
    const rel = RELICS[id]
    return [id, rel ? { anchor: rel.tribeAnchor, tier: rel.tier, cost: rel.cost } : null]
  }))
  r.relicsOk = Object.entries(anchors).every(([id, tr]) => RELICS[id]?.tribeAnchor === tr && RELICS[id]?.cost === 150)

  // Engine applies an ember synergy tier: 2 Ember units -> hits Burn.
  let sy = startAutoBattle("tommy", ["forgehowl", "emberwisp"], "rotwood-husk")
  for (let i = 0; i < 3 && sy.phase === "player"; i++) sy = resolveRound(sy)
  r.emberEnemyBurn = Math.max(0, ...sy.enemies.map((e) => e.powers.burn || 0), ...(sy.enemies.every((e) => e.hp <= 0) ? [1] : [0]))
  r.emberSynergyOk = sy.enemies.some((e) => (e.powers.burn || 0) > 0) || sy.enemies.every((e) => e.hp <= 0)

  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.tribesRegistered && out.laddersOk && out.tagsOk && out.theMoonOk &&
  out.burnOk && out.ascOk && out.relicsOk && out.emberSynergyOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
