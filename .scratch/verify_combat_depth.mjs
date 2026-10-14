// Combat depth sprint (Marc: "every turn is the same move-and-hit"): the
// turn-order timeline with Delay / Stagger, hero COMBOS (setup -> cash-in,
// feeding mana), STANCES (Aggressive / Defensive / Focus) and REACTIONS
// (Parry / Counter / Interrupt, next to Overwatch). Enemies mirror it
// cheaply (wounded ones brace + parry, Berserkers go Aggressive).
//
// Part 1 = pure-engine checks, run straight in node (no browser - the
// machine is memory-tight): `node .scratch/verify_combat_depth.mjs`.
// Part 2 = a few UI checks + screenshots on the prototype page (needs vite
// on PORT, default 5451). `ENGINE_ONLY=1` skips part 2.
import { registerHooks } from "node:module"
import { mkdir } from "node:fs/promises"

// Let node import the Vite-style source (extensionless imports, images).
registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx)
    } catch (e) {
      if ((spec.startsWith(".") || spec.startsWith("/")) && !/\.(m?js|jsx|json)$/.test(spec)) {
        for (const ext of [".js", "/index.js"]) {
          try {
            return next(spec + ext, ctx)
          } catch {
            // try the next extension
          }
        }
      }
      throw e
    }
  },
  load(url, ctx, next) {
    if (/\.(png|jpe?g|svg|webp|gif|mp3|wav|ogg|css)$/.test(url)) return { format: "module", source: `export default ${JSON.stringify(url)}`, shortCircuit: true }
    return next(url, ctx)
  },
})

const ROOT = new URL("..", import.meta.url).pathname
const SRC = `${ROOT}src/services/heartwood/`
const E = await import(`${SRC}tacticsEngine.js`)
const D = await import(`${SRC}tacticsDepth.js`)
const M = await import(`${SRC}tacticsMana.js`)
const X = await import(`${SRC}tacticsUltimates.js`)
const C = await import(`${SRC}tacticsCover.js`)

const fails = []
const results = {}
const ok = (cond, msg, data) => {
  if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
}
const U = (s, id) => s.units.find((u) => u.id === id)
const TANK = "player-bulwark-of-ages-0" // tank, melee -> Off-balance
const HEAL = "player-the-fool-1" // healer, melee -> Marked
const HEX = "player-hexbreaker-2" // ranged dps (Reaver burst) -> Off-balance
const OATH = "player-oathshield-3" // tank
const CMD = "player-commander"
const E0 = "enemy-ironmaw-0"
const E1 = "enemy-sapling-attendant-1"
const E2 = "enemy-hoardling-2"

// Synthetic board: only placed units live; enemies get a flat 40 HP kit.
function board(place, { depth = true, mana = false } = {}) {
  let s = E.createTacticsBattle("default")
  s = {
    ...s,
    terrain: {},
    wallHp: {},
    units: s.units.map((u) => {
      const k = place[u.id]
      if (!k) return { ...u, hp: 0 }
      const { row, col, ...patch } = k
      const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [] } : {}
      return { ...u, block: 0, ...base, ...patch, pos: { row, col } }
    }),
  }
  if (mana) s = M.enableMana(s)
  return depth ? D.enableCombatDepth(s) : s
}
const dmgTo = (before, after, id) => U(before, id).hp - U(after, id).hp
const newEvents = (before, after) => (after.events || []).filter((e) => e.seq > (before.eventSeq || 0))

// ---------------------------------------------------------------- STANCES
{
  const s0 = board({ [OATH]: { row: 4, col: 5 }, [E0]: { row: 4, col: 4 } })
  const base = E.attackUnit(s0, OATH, E0)
  const aggr = D.setStance(s0, OATH, "aggressive")
  ok(U(aggr, OATH).stance === "aggressive", "stance: Aggressive set")
  const hitA = E.attackUnit(aggr, OATH, E0)
  results.stanceDmg = { balanced: dmgTo(s0, base, E0), aggressive: dmgTo(aggr, hitA, E0) }
  ok(dmgTo(aggr, hitA, E0) > dmgTo(s0, base, E0), "stance: Aggressive deals more", results.stanceDmg)
  ok(D.setStance(hitA, OATH, "defensive") === hitA, "stance: locked once the hero acted")
  const back = D.setStance(aggr, OATH, "aggressive")
  ok(U(back, OATH).stance == null, "stance: clicking the active stance returns to Balanced")
  ok(D.setStance(board({ [OATH]: { row: 4, col: 5 } }, { depth: false }), OATH, "aggressive").units.every((u) => !u.stance), "stance: no-op without combatDepth")
  // Taken: an Aggressive hero takes +25% from an enemy hit.
  const enemyTurn = (s) => E.attackUnit({ ...s, phase: "enemy" }, E0, OATH)
  ok(dmgTo(aggr, enemyTurn(aggr), OATH) > dmgTo(s0, enemyTurn(s0), OATH), "stance: Aggressive takes more")
  // Focus: -25% damage.
  const foc = D.setStance(s0, OATH, "focus")
  ok(dmgTo(foc, E.attackUnit(foc, OATH, E0), E0) < dmgTo(s0, base, E0), "stance: Focus deals less")
  // Defensive: -1 move, +4 Block (tank) at end of turn -> absorbs the enemy hit.
  const far = board({ [OATH]: { row: 4, col: 8 }, [E0]: { row: 4, col: 2 } })
  const def = D.setStance(far, OATH, "defensive")
  ok(E.reachableTilesFor(def, OATH).length < E.reachableTilesFor(far, OATH).length, "stance: Defensive moves less")
  const adj = board({ [OATH]: { row: 4, col: 5 }, [E0]: { row: 4, col: 4 } })
  const adjDef = D.setStance(adj, OATH, "defensive")
  const tA = E.endPlayerTurn(adj)
  const tD = E.endPlayerTurn(adjDef)
  results.defensive = { balanced: dmgTo(adj, tA, OATH), defensive: dmgTo(adjDef, tD, OATH) }
  ok(dmgTo(adjDef, tD, OATH) < dmgTo(adj, tA, OATH), "stance: Defensive Block soaks the enemy hit", results.defensive)
  ok((tD.events || []).some((e) => e.label === "🛡 +4 Block"), "stance: tank's Defensive gives +4 Block (callout)")
  // Focus: +15 resource for a healer at end of turn (mana on).
  const mb = board({ [HEAL]: { row: 4, col: 9 }, [E0]: { row: 4, col: 0 } }, { mana: true })
  const low = { ...mb, units: mb.units.map((u) => (u.id === HEAL ? { ...u, mana: 10 } : u)) }
  const f1 = E.endPlayerTurn(D.setStance(low, HEAL, "focus"))
  const f0 = E.endPlayerTurn(low)
  results.focusMana = { balanced: U(f0, HEAL).mana, focus: U(f1, HEAL).mana }
  ok(U(f1, HEAL).mana - U(f0, HEAL).mana === 15, "stance: Focus gives a healer +15 resource", results.focusMana)
}

// ----------------------------------------------------------------- COMBOS
{
  const s0 = board({ [TANK]: { row: 4, col: 5 }, [CMD]: { row: 5, col: 4 }, [E0]: { row: 4, col: 4 } }, { mana: true })
  const a = E.attackUnit(s0, TANK, E0)
  ok(U(a, E0).cbOffBalance === 2 && U(a, E0).cbBy?.offBalance === TANK, "combo: a tank's hit leaves Off-balance", U(a, E0))
  ok(newEvents(s0, a).some((e) => e.label === "⤵ Off-balance"), "combo: Off-balance callout")
  ok(D.comboFor(a, U(a, TANK), U(a, E0)) === null, "combo: the setter can't cash in its own setup")
  ok(D.comboFor(a, U(a, CMD), U(a, E0))?.id === "finisher", "combo: another melee hero sees the Finisher")
  const prev = E.attackPreview(a, CMD, E0)
  const plain = E.attackPreview(s0, CMD, E0)
  ok(prev.full > plain.full, "combo: attack preview shows the +50%", { prev: prev.full, plain: plain.full })
  const lowCmd = { ...a, units: a.units.map((u) => (u.id === CMD ? { ...u, mana: 0 } : u)) }
  const b = E.attackUnit(lowCmd, CMD, E0)
  // (Tommy has Haste: the first damage event is the Finisher itself.)
  const firstHit = newEvents(lowCmd, b).find((e) => e.kind === "damage" && e.targetId === E0)?.amount
  results.finisher = { dmg: firstHit, preview: prev.full, plain: plain.full, stagger: U(b, E0).stagger, mana: U(b, CMD).mana }
  ok(firstHit === prev.full, "combo: the Finisher lands the previewed damage", results.finisher)
  ok(newEvents(lowCmd, b).some((e) => e.kind === "heroCombo" && e.combo === "finisher"), "combo: heroCombo (COMBO!) event")
  ok(!(U(b, E0).cbOffBalance > 0), "combo: the setup is consumed")
  ok(U(b, E0).stagger === 1, "combo: a Finisher Staggers the enemy")
  ok(U(b, CMD).mana > 0, "combo: cashing in gives mana", U(b, CMD).mana)
  // No combo without the flag.
  const off = board({ [TANK]: { row: 4, col: 5 }, [CMD]: { row: 5, col: 4 }, [E0]: { row: 4, col: 4 } }, { depth: false })
  const offA = E.attackUnit(off, TANK, E0)
  ok(!(U(offA, E0).cbOffBalance > 0), "combo: no setups without combatDepth")

  // Marked (healer, melee) + ranged hit (hexbreaker at range 3) = Called Shot.
  const m0 = C.withHitRolls(board({ [HEAL]: { row: 4, col: 5 }, [HEX]: { row: 4, col: 7 }, [E0]: { row: 4, col: 4 } }))
  const m1 = E.attackUnit(m0, HEAL, E0)
  ok(U(m1, E0).cbMarked === 2, "combo: a healer's hit Marks")
  ok(D.comboFor(m1, U(m1, HEX), U(m1, E0))?.id === "called-shot", "combo: ranged hero sees a Called Shot")
  const hc = C.hitChance(m1, U(m1, HEX), U(m1, E0), "front")
  ok(hc.parts.some((p) => /Called Shot/.test(p.label) && p.value === 20), "combo: Called Shot +20% to hit", hc.parts)
  const m2 = E.attackUnit(m1, HEX, E0)
  ok(newEvents(m1, m2).some((e) => e.kind === "heroCombo" && e.combo === "called-shot"), "combo: Called Shot fires")

  // Soaked + a skill = Shock (hexbreaker's Burst signature).
  const k0 = board({ [HEX]: { row: 4, col: 6 }, [E0]: { row: 4, col: 4 } })
  const k1 = D.applySetup(k0, E0, "soaked", HEAL)
  ok(D.comboFor(k1, U(k1, HEX), U(k1, E0)) === null, "combo: a basic attack doesn't Shock")
  const k2 = E.castAbility(k1, HEX, E0)
  ok(k2 !== k1 && newEvents(k1, k2).some((e) => e.kind === "heroCombo" && e.combo === "shock"), "combo: Soaked + skill = Shock")
  ok(U(k2, E0).stagger === 1, "combo: a Shock Staggers")
  // Frost soaks.
  const EL = await import(`${SRC}tacticsElements.js`)
  ok(U(EL.applyElement(k0, E0, "frost", 1), E0).cbSoaked === 2, "combo: Frost soaks an enemy")

  // Rooted + an area skill (cleave) = Crush.
  const cleaver = { id: "test-cleave", name: "Wide Swing", kind: "cleave", cost: 1, cooldown: 0 }
  const r0 = board({ [CMD]: { row: 4, col: 5, ability: cleaver, cooldownRemaining: 0 }, [E0]: { row: 4, col: 4, root: 2 }, [E1]: { row: 3, col: 4 } })
  const r1 = E.castAbility(r0, CMD, E0)
  ok(r1 !== r0 && newEvents(r0, r1).some((e) => e.kind === "heroCombo" && e.combo === "crush"), "combo: Rooted + area skill = Crush", newEvents(r0, r1).map((e) => e.label || e.kind))

  // A hero's knockback (push) leaves Off-balance + Stagger.
  const pusher = { id: "test-push", name: "Shove", kind: "push", cost: 1, cooldown: 0, bonus: 2 }
  const p0 = board({ [CMD]: { row: 4, col: 5, ability: pusher, cooldownRemaining: 0 }, [E0]: { row: 4, col: 4 } })
  const p1 = E.castAbility(p0, CMD, E0)
  ok(U(p1, E0).pos.col === 3 && U(p1, E0).cbOffBalance === 2 && U(p1, E0).stagger === 1, "combo: knockback = Off-balance + Stagger", U(p1, E0))

  // Setups expire: applied turn N, gone by the start of turn N+2.
  const x0 = board({ [TANK]: { row: 1, col: 10 }, [E0]: { row: 8, col: 0 } })
  const x1 = D.applySetup(x0, E0, "marked", TANK)
  const x2 = E.endPlayerTurn(x1)
  const x3 = E.endPlayerTurn(x2)
  ok(U(x2, E0).cbMarked === 1 && !(U(x3, E0).cbMarked > 0), "combo: setups last this turn and the next", [U(x2, E0).cbMarked, U(x3, E0).cbMarked])
}

// ------------------------------------------------------ TURN ORDER / STAGGER
{
  // Order: staggered enemies act last, with 1 AP.
  const s0 = board({ [HEAL]: { row: 4, col: 6 }, [E0]: { row: 4, col: 3 }, [E1]: { row: 1, col: 1 }, [E2]: { row: 7, col: 1 } })
  ok(D.enemyQueue(s0).join() === [E0, E1, E2].join(), "order: board order by default")
  const s1 = D.staggerUnit(s0, E0, 1)
  ok(D.enemyQueue(s1).join() === [E1, E2, E0].join(), "order: a staggered enemy acts last", D.enemyQueue(s1))
  const pv = E.previewEnemyIntents(s1)
  ok(pv.map((i) => i.enemyId).join() === [E1, E2, E0].join() && pv[2].intent.staggered, "order: the preview shows the real order + Staggered", pv.map((i) => [i.enemyId, i.intent.kind]))
  // ironmaw 4 tiles away: normally move+attack; staggered (1 AP) it can only move.
  const pvBase = E.previewEnemyIntents(s0).find((i) => i.enemyId === E0).intent
  const pvStag = pv.find((i) => i.enemyId === E0).intent
  results.staggerIntent = { base: pvBase.kind, staggered: pvStag.kind }
  ok(pvBase.kind === "move-attack" && pvStag.kind === "move", "order: 1 AP - a staggered enemy can't move AND strike", results.staggerIntent)
  const real = E.endPlayerTurn(s1)
  ok(!(U(real, E0).stagger > 0), "order: the stagger is spent")
  ok(!newEvents(s1, real).some((e) => e.kind === "strike" && e.actorId === E0), "order: the staggered enemy really didn't strike")
  // Reeling (staggered twice): its action slides into the next round.
  const s2 = D.staggerUnit(s1, E0, 1)
  ok(U(s2, E0).stagger === 2, "order: stagger stacks to 2 (Reeling)")
  const near = board({ [OATH]: { row: 4, col: 5 }, [E0]: { row: 4, col: 4, stagger: 2 } })
  const pvR = E.previewEnemyIntents(near)
  ok(pvR[0]?.intent.kind === "reeling", "order: preview shows Reeling", pvR)
  const realR = E.endPlayerTurn(near)
  ok(U(realR, OATH).hp === U(near, OATH).hp && !(U(realR, E0).stagger > 0), "order: a Reeling enemy loses its action")
  // Preview exactness: strikes in the preview = strikes in the real turn.
  const big = board({ [OATH]: { row: 4, col: 6 }, [CMD]: { row: 5, col: 6 }, [TANK]: { row: 3, col: 6 }, [E0]: { row: 4, col: 3, stagger: 1 }, [E1]: { row: 2, col: 4 }, [E2]: { row: 6, col: 4 } })
  const pvB = E.previewEnemyIntents(big)
  const realB = E.endPlayerTurn(big)
  const realStrikes = newEvents(big, realB).filter((e) => e.kind === "strike" && e.actorId.startsWith("enemy")).map((e) => `${e.actorId}>${e.targetId}`)
  const pvStrikes = pvB.filter((i) => i.intent.kind === "attack" || i.intent.kind === "move-attack").map((i) => `${i.enemyId}>${i.intent.targetId}`)
  results.exact = { pvStrikes, realStrikes }
  ok(pvStrikes.join() === realStrikes.join(), "order: preview == real enemy turn (strikes, in order)", results.exact)
  // Timeline view model.
  const tl = D.turnTimeline(big, pvB)
  ok(tl.enemies.length === 3 && tl.enemies[2].id === E0 && tl.enemies[2].staggered && tl.nextEnemyId === pvB[0].enemyId, "timeline: enemies in real order, staggered flagged, next enemy", tl.enemies.map((e) => e.id))
}

// ------------------------------------------------------------------ DELAY
{
  const s0 = board({ [OATH]: { row: 4, col: 9 }, [E0]: { row: 4, col: 0 } })
  ok(D.canDelay(s0, U(s0, OATH)), "delay: available with AP left")
  const d1 = D.delayAction(s0, OATH)
  ok(U(d1, OATH).ap === 0 && U(d1, OATH).delayed === 1, "delay: ends the activation, banks 1")
  const tl = D.turnTimeline(d1, E.previewEnemyIntents(d1))
  ok(tl.delayed.some((h) => h.id === OATH) && !tl.heroes.some((h) => h.id === OATH), "delay: timeline moves the hero after the enemies")
  const d2 = E.endPlayerTurn(d1)
  ok(U(d2, OATH).ap === U(d2, OATH).apMax + 1 && U(d2, OATH).delayLock, "delay: next round opens with +1 AP", U(d2, OATH).ap)
  ok(!D.canDelay(d2, U(d2, OATH)), "delay: not two rounds in a row")
  const d3 = E.endPlayerTurn(d2)
  ok(D.canDelay(d3, U(d3, OATH)) && U(d3, OATH).ap === U(d3, OATH).apMax, "delay: lock clears the round after")
  const r = D.readyReaction(s0, OATH, "parry")
  ok(!D.canDelay(r, U(r, OATH)), "delay: not while holding a reaction")
}

// -------------------------------------------------------------- REACTIONS
{
  // Parry: a non-tank halves, a tank negates; the attacker is Staggered.
  const s0 = board({ [CMD]: { row: 4, col: 5 }, [E0]: { row: 4, col: 4 } })
  const p = D.readyReaction(s0, CMD, "parry")
  ok(U(p, CMD).reaction === "parry" && U(p, CMD).ap === U(s0, CMD).ap - 1, "reaction: Parry holds 1 AP")
  ok(U(D.readyReaction(p, CMD, "parry"), CMD).ap === U(s0, CMD).ap, "reaction: clicking it again stands down (AP back)")
  const pv = E.previewEnemyIntents(p)
  ok(pv[0]?.intent.reactions?.some((r) => r.kind === "parry" && r.heroId === CMD), "reaction: preview marks the action a Parry fires on", pv[0]?.intent)
  const t0 = E.endPlayerTurn(s0)
  const t1 = E.endPlayerTurn(p)
  results.parry = { plain: dmgTo(s0, t0, CMD), parried: dmgTo(p, t1, CMD) }
  ok(dmgTo(p, t1, CMD) === Math.floor(dmgTo(s0, t0, CMD) / 2), "reaction: Parry halves the hit", results.parry)
  ok(newEvents(p, t1).some((e) => e.depthReaction === "parry"), "reaction: Parry callout")
  ok(U(t1, E0).stagger === 1 && !U(t1, CMD).reaction, "reaction: attacker Staggered, Parry spent")
  const tank = board({ [OATH]: { row: 4, col: 5 }, [E0]: { row: 4, col: 4 } })
  const tp = E.endPlayerTurn(D.readyReaction(tank, OATH, "parry"))
  ok(U(tp, OATH).hp === U(tank, OATH).hp, "reaction: a tank's Parry negates the hit")
  // Counter: strike back.
  const c = D.readyReaction(s0, CMD, "counter")
  const ct = E.endPlayerTurn(c)
  ok(newEvents(c, ct).some((e) => e.depthReaction === "counter") && U(ct, E0).hp < U(c, E0).hp, "reaction: Counter strikes back")
  ok(E.previewEnemyIntents(c)[0]?.intent.reactions?.some((r) => r.kind === "counter"), "reaction: preview marks the Counter")
  // Overwatch is one of the reactions.
  ok(E.overwatchAction(c, CMD) === c, "reaction: no Overwatch while holding a reaction")
  ok(D.reactionBlockReason(E.overwatchAction(s0, CMD), U(E.overwatchAction(s0, CMD), CMD), "parry"), "reaction: none while on Overwatch")
  // Interrupt: cancels an ultimate release within 4 tiles, pays mana.
  const ult = { ...X.ENEMY_ULTS["dread-nova"], amount: 9, gain: 10 }
  let u0 = board({ [HEX]: { row: 4, col: 6 }, [E0]: { row: 4, col: 4, ult, ultCharge: 100, ultArmed: { turn: 0, tiles: [], center: { row: 4, col: 4 } } } }, { mana: true })
  const pvU = E.previewEnemyIntents(u0)
  ok(pvU[0]?.intent.kind === "ultimate" && pvU[0].intent.phase === "release", "reaction: test ultimate releases", pvU[0]?.intent)
  const i1 = D.readyReaction(u0, HEX, "interrupt")
  ok(U(i1, HEX).reaction === "interrupt", "reaction: Interrupt ready (has mana)")
  ok(E.previewEnemyIntents(i1)[0]?.intent.reactions?.some((r) => r.kind === "interrupt"), "reaction: preview marks the Interrupt")
  const ut = E.endPlayerTurn(u0)
  const it = E.endPlayerTurn(i1)
  results.interrupt = { ultHit: dmgTo(u0, ut, HEX), interrupted: dmgTo(i1, it, HEX), charge: U(it, E0).ultCharge, mana: [U(i1, HEX).mana, U(it, HEX).mana] }
  ok(dmgTo(u0, ut, HEX) > 0 && dmgTo(i1, it, HEX) === 0, "reaction: Interrupt cancels the ultimate", results.interrupt)
  ok(U(it, E0).ultCharge <= X.ULT_BROKEN_LEFT && !U(it, E0).ultArmed, "reaction: ultimate broken (charge knocked back)")
  ok(newEvents(i1, it).some((e) => e.kind === "mana" && e.unitId === HEX && e.amount < 0), "reaction: Interrupt pays its mana")
  const broke = { ...u0, units: u0.units.map((x) => (x.id === HEX ? { ...x, mana: 5 } : x)) }
  ok(D.reactionBlockReason(broke, U(broke, HEX), "interrupt"), "reaction: Interrupt needs the mana")
}

// --------------------------------------------------------- ENEMY STANCES / QA
{
  const s0 = board({ [OATH]: { row: 4, col: 5 }, [E0]: { row: 4, col: 4, hp: 10 } })
  const t = E.endPlayerTurn({ ...s0, units: s0.units.map((u) => (u.id === OATH ? { ...u, ap: 0 } : u)) })
  ok(U(t, E0).stance === "defensive" && U(t, E0).parryReady && U(t, E0).block >= 2, "enemy: a wounded enemy braces (Defensive + parry)", U(t, E0))
  const hit = E.attackUnit(t, OATH, E0)
  ok(newEvents(t, hit).some((e) => e.label === "🛡 Parry!"), "enemy: it parries your first melee hit")
  const qa = E.withLowEnemyHp(s0)
  const tq = E.endPlayerTurn(qa)
  ok(!U(tq, E0)?.stance && qa.depthQa, "enemy: QA hook switches enemy stances off")
}

results.fails = fails
console.log(JSON.stringify(results, null, 1))
console.log(`ENGINE: ${fails.length ? `${fails.length} FAIL` : "all pass"}`)
for (const f of fails) console.log("  FAIL", f)

// ------------------------------------------------------------------ UI PART
if (!process.env.ENGINE_ONLY) {
  const uiFails = await uiChecks()
  console.log(`UI: ${uiFails.length ? `${uiFails.length} FAIL` : "all pass"}`)
  for (const f of uiFails) console.log("  FAIL", f)
  process.exitCode = fails.length || uiFails.length ? 1 : 0
} else process.exitCode = fails.length ? 1 : 0

async function uiChecks() {
  const { chromium } = await import("playwright")
  const PORT = process.env.PORT || 5451
  const SHOT_DIR = `${ROOT}.scratch/shots`
  await mkdir(SHOT_DIR, { recursive: true })
  const out = []
  const check = (cond, msg) => cond || out.push(msg)
  const browser = await chromium.launch()
  try {
    const page = await (await browser.newContext({ viewport: { width: 1400, height: 950 } })).newPage()
    const errs = []
    page.on("pageerror", (e) => errs.push(String(e)))
    page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
    await page.goto(`http://localhost:${PORT}/heartwood-tactics?front=1`, { waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hwt-board", { timeout: 30000 })
    // The round timeline.
    await page.waitForSelector(".hwt-timeline", { timeout: 10000 })
    const tl = await page.evaluate(() => ({
      heroes: document.querySelectorAll(".hwt-timeline [data-tl-side='player']").length,
      enemies: document.querySelectorAll(".hwt-timeline [data-tl-side='enemy']").length,
      next: document.querySelectorAll(".hwt-timeline [data-tl-next='true']").length,
    }))
    check(tl.heroes >= 4 && tl.enemies >= 2 && tl.next === 1, `timeline renders heroes + enemies + next ${JSON.stringify(tl)}`)
    // Select the tank, pick Defensive, ready a Parry.
    await page.click(".hwt-token[data-unit-id='player-bulwark-of-ages-0']")
    await page.waitForSelector("[data-action='stance-defensive']")
    await page.click("[data-action='stance-defensive']")
    check(await page.locator(".hwt-token[data-unit-id='player-bulwark-of-ages-0'] .hwt-hero-stance[data-stance='defensive']").count() === 1, "stance icon on the token")
    await page.click("[data-action='react-parry']")
    check(await page.locator(".hwt-token[data-unit-id='player-bulwark-of-ages-0'] .hwt-react-badge[data-reaction='parry']").count() === 1, "reaction-ready icon on the token")
    await page.screenshot({ path: `${SHOT_DIR}/combat_depth_stance_reaction.png` })
    // Hit an enemy with the commander (melee) so its setup shows, then select a ranged hero: combo highlight.
    await page.click(".hwt-token[data-unit-id='player-commander']")
    const target = await page.evaluate(() => document.querySelector(".hwt-cell[data-targetable='true'] .hwt-token[data-side='enemy']")?.dataset.unitId || null)
    if (target) {
      await page.click(`.hwt-token[data-unit-id='${target}']`)
      await page.waitForTimeout(600)
      check(await page.locator(`.hwt-token[data-unit-id='${target}'] .hwt-setup-badge`).count() >= 1, "setup badge on the struck enemy")
      await page.click(".hwt-token[data-unit-id='player-hexbreaker-2']")
      await page.waitForTimeout(300)
      const comboCells = await page.locator(".hwt-cell[data-combo]").count()
      check(comboCells >= 1, "combo-available highlight for the ranged hero")
      await page.screenshot({ path: `${SHOT_DIR}/combat_depth_combo_ready.png` })
      const ct = await page.evaluate(() => document.querySelector(".hwt-cell[data-combo] .hwt-token[data-side='enemy']")?.dataset.unitId || null)
      if (ct) {
        await page.click(`.hwt-token[data-unit-id='${ct}']`)
        await page.waitForTimeout(500)
        check(await page.locator(".hwt-combo-banner").count() === 1, "big COMBO! banner")
        await page.screenshot({ path: `${SHOT_DIR}/combat_depth_combo_banner.png` })
      } else out.push("no combo target to click")
    } else out.push("no enemy in the commander's reach (?front=1)")
    // Delay a hero: it moves to the 'after the enemies' slot.
    await page.click(".hwt-token[data-unit-id='player-oathshield-3']")
    await page.click("[data-action='delay']")
    check(await page.locator(".hwt-timeline [data-tl-delayed='true']").count() >= 1, "delayed hero shown after the enemies")
    await page.screenshot({ path: `${SHOT_DIR}/combat_depth_timeline.png` })
    await page.click(".hwt-end-turn")
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${SHOT_DIR}/combat_depth_after_turn.png` })
    check(!errs.length, `no page errors ${JSON.stringify(errs.slice(0, 3))}`)
  } finally {
    await browser.close()
  }
  return out
}
