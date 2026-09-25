import { chromium } from "playwright"

// Sprint lane: relics & items acting DURING a tactics fight
// (tacticsRelics.js). Real runState via startRun + RUN_PATH, real
// startTacticsFormationBattle + buildRunTacticsBattle, then direct
// engine calls (attackUnit / endPlayerTurn) on a hand-positioned board.
const PORT = process.env.PORT || 5443
const browser = await chromium.launch()
const errs = []
const page = await browser.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const rt = await import("/src/services/heartwood/runEngine.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const te = await import("/src/services/heartwood/tacticsEngine.js")
  const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const build = ({ relics = [], items = [], relicLevels = {} }) => {
    const base = rt.startRun("tommy", null, { forcedSeed: 777 })
    const rs = {
      ...base,
      nodeIndex: idx,
      path: rt.RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench: [
        { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] },
        { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
      ],
      deployed: ["b0", "b1", null, null],
      items: items.map((defId) => ({ defId, equippedTo: "b1" })),
      relics,
      relicLevels,
      pendingActiveEffects: [],
      lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    }
    return rt.startTacticsFormationBattle(rs, (start) => buildRunTacticsBattle(rs, start)).battle
  }
  const U = (s, id) => s.units.find((u) => u.id === id)
  const patch = (s, id, p) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...p } : u)) })
  const P = "player-hexbreaker-1"
  const enemies = (s) => s.units.filter((u) => u.side === "enemy")
  // Hexbreaker at (3,5), first enemy adjacent at (3,4) with no shields.
  const stage = (s, extraEnemy = {}) => {
    const e = enemies(s)[0]
    let n = patch(s, P, { pos: { row: 3, col: 5 }, ap: 2, facing: "W" })
    n = patch(n, e.id, { pos: { row: 3, col: 4 }, ward: 0, block: 0, bulwark: 0, revive: 0, ap: 2, facing: "E", ...extraEnemy })
    return { n, eid: e.id }
  }
  const reactions = (s, before) => (s.events || []).filter((ev) => ev.seq > before && ev.kind === "reaction").map((ev) => `${ev.unitId}:${ev.label}`)
  const out = {}

  // 1. onHit (Bramble Ward relic): an enemy hit on the squad strikes back.
  {
    const s = build({ relics: ["bramble-ward"] })
    const { n, eid } = stage(s)
    const tagged = U(n, P).triggers.filter((t) => t.trigger === "onHit").map((t) => t.source)
    const hpBefore = U(n, eid).hp
    const seq = n.eventSeq || 0
    const after = te.attackUnit({ ...n, phase: "enemy" }, eid, P)
    out.onHit = { tagged, enemyLoss: hpBefore - U(after, eid).hp, reactions: reactions(after, seq), log: after.log.slice(-3) }
  }
  // 2. on-kill Chain (Cascading Wound relic) + callout.
  {
    const s = build({ relics: ["cascading-wound"] })
    const { n, eid } = stage(s, { hp: 1 })
    const others = enemies(n).filter((e) => e.id !== eid)
    const low = others.reduce((a, b) => (b.hp < a.hp ? b : a), others[0])
    const clean = patch(n, low.id, { ward: 0, block: 0, bulwark: 0, evade: 0 })
    const seq = clean.eventSeq || 0
    const after = te.attackUnit(clean, P, eid)
    out.chain = { chainPower: U(clean, P).chainDamage, killed: U(after, eid).hp <= 0, lowLoss: U(clean, low.id).hp - U(after, low.id).hp, reactions: reactions(after, seq), hasOthers: others.length }
  }
  // 3. per-turn ticks: Venomous Edge poison on an enemy ticks at the
  //    enemy turn start; Heartsbloom Seed Regen heals the squad at the
  //    player turn start (callout both).
  {
    const s = build({ relics: ["venomous-edge", "heartsbloom-seed"] })
    const { n, eid } = stage(s)
    const hit = te.attackUnit(patch(n, P, { hp: 5 }), P, eid)
    const poisoned = U(hit, eid).poison
    const seq = hit.eventSeq || 0
    const turned = te.endPlayerTurn(hit)
    const enemyName = U(hit, eid).name
    out.ticks = {
      poisoned,
      poisonLine: turned.log.some((l) => l.startsWith(`${enemyName} takes ${poisoned} poison damage`)),
      poisonAfter: U(turned, eid).poison,
      regenStart: U(n, P).regen,
      regenLine: turned.log.some((l) => l.includes("from regeneration")),
      reactions: reactions(turned, seq),
      hitReactions: reactions(hit, n.eventSeq || 0),
      phase: turned.phase,
    }
  }
  // 4. Stun: Silenced Bell stuns the biggest enemy; it skips its turn.
  {
    const s = build({ relics: ["silenced-bell"] })
    const stunned = enemies(s).filter((e) => e.stun > 0)
    const seq = s.eventSeq || 0
    const turned = te.endPlayerTurn(s)
    out.stun = {
      stunnedCount: stunned.length,
      skipLine: stunned.length ? turned.log.includes(`${stunned[0].name} is stunned and skips this turn.`) : false,
      stunAfter: stunned.length ? U(turned, stunned[0].id).stun : null,
      reactions: reactions(turned, seq),
    }
  }
  // 5. Evade (Windstep Charm item): first enemy hit of the round misses,
  //    the second lands.
  {
    const s = build({ items: ["windstep-charm"] })
    const { n, eid } = stage(s)
    const hp0 = U(n, P).hp
    const seq = n.eventSeq || 0
    const a1 = te.attackUnit({ ...n, phase: "enemy" }, eid, P)
    const a2 = te.attackUnit(a1, eid, P)
    out.evade = { evadeStart: U(n, P).evade, hpAfter1: U(a1, P).hp, hp0, hpAfter2: U(a2, P).hp, evadeAfter: U(a1, P).evade, reactions: reactions(a1, seq) }
  }
  // 6. new effect types on hit: Rootbreak Sigil (sunder a Ward stack),
  //    Tideworn Band (Dampen shrinks the enemy's next hit).
  {
    const s = build({ relics: ["rootbreak-sigil", "tideworn-band"] })
    const { n, eid } = stage(s, { attack: 6 })
    const withWard = patch(n, eid, { ward: 0, taunt: 0, execute: 2 })
    const hit = te.attackUnit(withWard, P, eid)
    const back = te.attackUnit(patch({ ...hit, phase: "enemy" }, P, { block: 0 }), eid, P)
    const dealt = U(hit, P).hp - U(back, P).hp
    out.effects = { executeBefore: 2, executeAfter: U(hit, eid).execute, dampen: U(hit, eid).dampen, dealt, reactions: reactions(hit, withWard.eventSeq || 0) }
  }
  // 7. relic levels still scale the carried in-fight trigger.
  {
    const s = build({ relics: ["bramble-ward"], relicLevels: { "bramble-ward": 2 } })
    const { n, eid } = stage(s)
    const hpBefore = U(n, eid).hp
    const after = te.attackUnit({ ...n, phase: "enemy" }, eid, P)
    out.levels = { amount: U(n, P).triggers.find((t) => t.trigger === "onHit")?.effect.amount, enemyLoss: hpBefore - U(after, eid).hp }
  }
  // 8. Ascendant item (Starlit Shard) + Spore Spread (Fungal Spore Sac)
  //    with a poison item (Venomed Fang).
  {
    const s = build({ items: ["starlit-shard", "fungal-spore-sac", "venomed-fang"] })
    const { n, eid } = stage(s)
    const others = enemies(n).filter((e) => e.id !== eid)
    const hit = te.attackUnit(n, P, eid)
    const spread = others.map((e) => U(hit, e.id).poison || 0).reduce((a, b) => a + b, 0)
    const atk0 = U(hit, P).attack
    const turned = te.endPlayerTurn(hit)
    out.ascend = { asc: U(n, P).ascendant, spore: U(n, P).sporeSpread, spread, hasOthers: others.length, atkDelta: turned.phase === "player" ? U(turned, P).attack - atk0 : null, phase: turned.phase }
  }
  return out
})

const checks = []
const c = (name, ok) => checks.push({ name, ok: !!ok })
c("1 onHit relic tagged + retaliates for 3 + 'Bramble Ward!' callout", r.onHit.tagged.includes("Bramble Ward") && r.onHit.enemyLoss === 3 && r.onHit.reactions.some((x) => x.endsWith(":Bramble Ward!")))
c("2 chain on kill hits lowest-HP enemy + 'Cascading Wound!' callout", r.chain.chainPower === 4 && r.chain.killed && (r.chain.hasOthers === 0 || (r.chain.lowLoss === 4 && r.chain.reactions.some((x) => x.endsWith(":Cascading Wound!")))))
c("3 relic poison ticks on enemies; player Regen ticks + callouts", r.ticks.poisoned === 2 && r.ticks.poisonLine && r.ticks.regenStart === 3 && (r.ticks.phase !== "player" || r.ticks.regenLine) && r.ticks.hitReactions.some((x) => x.endsWith(":Venomous Edge!")))
c("4 Silenced Bell stun skips the enemy's turn + callout", r.stun.stunnedCount === 1 && r.stun.skipLine && r.stun.stunAfter === 0 && r.stun.reactions.some((x) => x.endsWith(":Stunned!")))
c("5 Evade item dodges first hit per round only + callout", r.evade.evadeStart === 1 && r.evade.hpAfter1 === r.evade.hp0 && r.evade.evadeAfter === 0 && r.evade.hpAfter2 < r.evade.hp0 && r.evade.reactions.some((x) => x.endsWith(":Windstep Charm!")))
c("6 sunder strips a stack + dampen shrinks the hit", r.effects.executeAfter === 1 && r.effects.dampen === 1 && r.effects.dealt === 5 && r.effects.reactions.some((x) => x.endsWith(":Rootbreak Sigil!")))
c("7 relic level scales the carried onHit trigger", r.levels.amount > 3 && r.levels.enemyLoss === r.levels.amount)
c("8 Ascendant grows attack each turn + Spore Spread poisons another enemy", r.ascend.asc === 1 && r.ascend.spore === 1 && (r.ascend.hasOthers === 0 || r.ascend.spread >= 1) && (r.ascend.phase !== "player" || r.ascend.atkDelta >= 1))

await browser.close()
console.log(JSON.stringify(r, null, 1))
for (const ch of checks) console.log(`${ch.ok ? "PASS" : "FAIL"} ${ch.name}`)
console.log(`pageErrors: ${errs.length}`, errs.slice(0, 5))
const pass = checks.filter((x) => x.ok).length
console.log(`${pass}/${checks.length} PASS`)
process.exit(pass === checks.length && errs.length === 0 ? 0 : 1)
