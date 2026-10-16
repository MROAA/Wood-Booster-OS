// Mana sprint 3 (data/heartwood/manaColours.js, services/heartwood/
// tacticsManaColours.js + tacticsManaFeed.js + campaignLey.js):
//   1. mana COLOURS (Ember / Tide / Root / Void) + 6 colour combo spells,
//   2. OVERCHANNEL (HP for missing mana) + a deterministic BACKLASH meter,
//   3. the campaign LEY NETWORK (lines, Ley Breach, Ward/Drain),
//   4. MANA-FED enemies + the Gorging Maw's Mana Nova.
// Part 1 = pure-engine checks, straight in node (memory-tight machine):
//   `ENGINE_ONLY=1 node .scratch/verify_mana_3.mjs`
// Part 2 = a few UI checks + screenshots (vite on PORT, default 5451).
import { registerHooks } from "node:module"
import { mkdir } from "node:fs/promises"

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
const DATA = `${ROOT}src/data/heartwood/`
const E = await import(`${SRC}tacticsEngine.js`)
const M = await import(`${SRC}tacticsMana.js`)
const C = await import(`${SRC}tacticsManaColours.js`)
const F = await import(`${SRC}tacticsManaFeed.js`)
const L = await import(`${SRC}campaignLey.js`)
const CE = await import(`${SRC}campaignEngine.js`)
const rt = await import(`${SRC}runEngine.js`)
const { buildRunTacticsBattle } = await import(`${SRC}tacticsRealMatchup.js`)
const D = await import(`${DATA}manaColours.js`)
const { CLASSES } = await import(`${DATA}classes.js`)
const { LEY_LINES, LEY } = await import(`${DATA}campaign.js`)
const REL = await import(`${DATA}relics.js`)

const fails = []
const results = {}
let n = 0
const ok = (cond, label, data) => {
  n++
  if (!cond) fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 400) : ""}`)
}
const U = (s, id) => s.units.find((u) => u.id === id)
const HB = "player-hexbreaker-0"
const FOOL = "player-the-fool-1"
const BUL = "player-bulwark-of-ages-2"
// A hand-placed board with mana on (heroes at the right, enemies left).
function board(enemyDefIds, place = {}, { relics = [], terrain = {} } = {}) {
  let s = E.createRealMatchupBattle(["hexbreaker", "the-fool", "bulwark-of-ages"], enemyDefIds, null, 0, {})
  s = {
    ...s,
    phase: "player",
    terrain,
    wallHp: {},
    noGraze: true,
    units: s.units.map((u) => {
      const p = place[u.id]
      if (!p) return u.side === "enemy" ? { ...u, pos: { row: 8, col: 0 }, hp: 0 } : { ...u, pos: { row: 0, col: 11 }, hp: 0 }
      const { row, col, mana: _m, ...patch } = p
      const base = u.side === "enemy" ? { ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [], block: 0, evade: 0 } : { block: 0 }
      return { ...u, ...base, ...patch, pos: { row, col } }
    }),
  }
  s = M.enableMana(s, relics)
  return {
    ...s,
    units: s.units.map((u) => {
      const p = place[u.id]
      return p && p.mana != null ? { ...u, mana: p.mana === "full" ? u.manaMax : p.mana } : u
    }),
  }
}
const set = (s, id, patch) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) })

// ============================================================ A. Colour tagging
{
  const ids = Object.keys(CLASSES)
  const noAff = ids.filter((id) => !D.COLOUR_IDS.includes(D.CLASS_AFFINITY[id]))
  ok(ids.length >= 38 && noAff.length === 0, "A1 every class has an affinity (Ember/Tide/Root/Void)", noAff)
  const counts = {}
  for (const id of ids) counts[D.CLASS_AFFINITY[id]] = (counts[D.CLASS_AFFINITY[id]] || 0) + 1
  ok(D.COLOUR_IDS.every((c) => counts[c] >= 8), "A2 the four affinities are roughly even", counts)
  let untagged = 0
  let twoColour = 0
  for (const c of Object.values(CLASSES)) {
    const fake = { side: "player", classId: c.id }
    const cols = new Set((c.skills || []).map((sk) => C.skillColourOf({ ...sk, classId: c.id }, fake)))
    if ([...cols].some((x) => !D.COLOUR_IDS.includes(x))) untagged++
    if (cols.size >= 2) twoColour++
  }
  ok(untagged === 0, "A3 every class skill carries a colour", untagged)
  ok(twoColour >= 30, "A4 most classes hold two colours (can combo alone)", twoColour)
  results.twoColour = twoColour
  const s = board(["hollowfen"], { [HB]: { row: 4, col: 9 }, [FOOL]: { row: 3, col: 10 }, "enemy-hollowfen-0": { row: 4, col: 6 } })
  ok(C.affinityOf(U(s, HB)) === "ember" && C.affinityOf(U(s, FOOL)) === "root", "A5 spellblade = Ember, healer = Root", [C.affinityOf(U(s, HB)), C.affinityOf(U(s, FOOL))])
  ok(D.comboForColours("tide", "ember").id === "steam" && D.comboForColours("void", "root").id === "blight" && D.comboForColours("ember", "ember") === null, "A6 six pairs, order-free, same colour = none")
  ok(Object.keys(D.COLOUR_COMBOS).length === 6, "A7 6 colour combos")
}

// ============================================================ B. All combos trigger
{
  const E0 = "enemy-hollowfen-0"
  const E1 = "enemy-duskmoth-1"
  const base = () => board(["hollowfen", "duskmoth"], { [HB]: { row: 4, col: 8 }, [FOOL]: { row: 4, col: 9, hp: 10, poison: 2 }, [BUL]: { row: 6, col: 11 }, [E0]: { row: 4, col: 5, hp: 40, maxHp: 40 }, [E1]: { row: 5, col: 5, hp: 40, maxHp: 40 } })
  const pairs = { steam: ["ember", "tide"], wildfire: ["root", "ember"], hellflare: ["void", "ember"], lifespring: ["root", "tide"], undertow: ["void", "tide"], blight: ["root", "void"] }
  const out = {}
  for (const [id, [a, b]] of Object.entries(pairs)) {
    const s0 = base()
    const s1 = C.registerColour(s0, HB, E0, a)
    ok(!(s1.events || []).some((e) => e.colourCombo), `B-${id} first colour alone: no combo`)
    const s2 = C.registerColour(s1, HB, E0, b)
    const ev = (s2.events || []).filter((e) => e.kind === "combo" && e.colourCombo === id)
    const e0 = U(s2, E0)
    const e1 = U(s2, E1)
    out[id] = { ev: ev.map((e) => e.label), e0: [e0.hp, e0.exposed || 0, e0.burn || 0, e0.poison || 0, e0.slow || 0, e0.mana], e1hp: e1.hp, fool: [U(s2, FOOL).hp, U(s2, FOOL).poison] }
    ok(ev.length === 1 && C.combosThisTurn(s2).includes(id) && C.coloursThisTurn(s2).every((x) => x.used), `B-${id} fires once with a callout + tile flash`, out[id])
  }
  const s0 = base()
  ok(out.steam.e0[0] < 40 && out.steam.e0[1] === 2 && out.steam.e1hp < 40, "B1 Steam Burst: damage + Exposed in the 3x3", out.steam)
  ok(out.wildfire.e0[2] > 0, "B2 Wildfire Bloom: Burning", out.wildfire)
  const hf = C.registerColour(C.registerColour(base(), HB, E0, "void"), HB, E0, "ember")
  ok(out.hellflare.e0[0] < out.steam.e0[0] && (hf.events || []).some((e) => e.kind === "mana" && e.label === "hellflare" && e.unitId === E0 && e.amount < 0) && out.hellflare.e1hp === 40, "B3 Hellflare: a heavy single hit + mana burned", out.hellflare)
  ok(out.lifespring.fool[0] > 10 && out.lifespring.fool[1] === 0, "B4 Lifespring: allies near the caster heal + cleanse", out.lifespring)
  ok(out.undertow.e0[4] === 2 && out.undertow.e0[5] < U(s0, E0).mana, "B5 Undertow: Slow 2 + mana burn", out.undertow)
  ok(out.blight.e0[3] >= 3, "B6 Blight Bloom: Poison 3", out.blight)
  results.combos = out
  // Real casts: Ember (Elemental Strike) then Tide (the healer's Group Renewal) = Steam Burst.
  let s = base()
  const a = E.castAbility(s, HB, E0, "elemental-strike")
  ok(a !== s && C.coloursThisTurn(a).map((x) => x.colour).join() === "ember", "B7 a real cast logs its colour", C.coloursThisTurn(a))
  ok(C.comboIfCast(a, "tide")?.id === "steam", "B8 the UI hint knows the next Tide cast finishes Steam Burst")
  const b = E.castAbility(a, FOOL, null, "group-renewal")
  ok(b !== a && C.combosThisTurn(b).join() === "steam" && (b.events || []).some((e) => e.colourCombo === "steam"), "B9 two heroes, two colours, one turn = a combo", C.combosThisTurn(b))
  // Same colour twice: nothing.
  const c2 = C.registerColour(C.registerColour(base(), HB, E0, "ember"), FOOL, E0, "ember")
  ok(!C.combosThisTurn(c2).length, "B10 same colour twice = no combo")
  // The tracker resets with the turn.
  const next = E.endPlayerTurn(b)
  ok(next.phase !== "player" || C.coloursThisTurn(next).length === 0, "B11 the colour tracker is per turn", C.coloursThisTurn(next))
  // Mana Wells are coloured and prime their colour at the turn start.
  const well = { "4-8": "manawell" }
  let w = board(["hollowfen"], { [HB]: { row: 4, col: 8 }, [E0]: { row: 0, col: 0, move: 0 } }, { terrain: well })
  const wc = C.wellColourAt(w, { row: 4, col: 8 })
  w = E.endPlayerTurn(w)
  ok(D.COLOUR_IDS.includes(wc) && C.coloursThisTurn(w).some((x) => x.well && x.colour === wc), "B12 a coloured Mana Well primes its colour", { wc, t: C.coloursThisTurn(w) })
  // Prism of Four Winds: +50% combo power.
  const plain = C.comboPower(base(), U(base(), HB))
  const prism = board(["hollowfen"], { [HB]: { row: 4, col: 8 } }, { relics: ["four-winds-prism"] })
  ok(C.comboPower(prism, U(prism, HB)) === Math.round(plain * 1.5), "B13 Prism of Four Winds: combos +50%", [plain, C.comboPower(prism, U(prism, HB))])
  ok(["four-winds-prism", "stormglass-phial"].every((id) => REL.relicPool().some((r) => r.id === id)), "B14 2 new relics in the pool")
  // Synthetic (mana off) states are untouched.
  const off = E.createRealMatchupBattle(["hexbreaker"], ["hollowfen"], null, 0, {})
  ok(!off.manaRules && C.coloursThisTurn(off).length === 0, "B15 mana-off states have no colours")
}

// ============================================================ C. Overchannel + Backlash
{
  const E0 = "enemy-hollowfen-0"
  const mk = (extra = {}) => board(["hollowfen"], { [HB]: { row: 4, col: 8, mana: 5, ...extra }, [E0]: { row: 4, col: 5, hp: 60, maxHp: 60, move: 0, range: 1, attack: 0 } })
  const s = mk()
  const sk = { ...CLASSES.spellblade.skills.find((x) => x.id === "arcane-lance"), classId: "spellblade" }
  const live = (st) => U(st, HB)
  const lance = (st) => E.castAbility(st, HB, E0, "arcane-lance")
  ok(lance(s) === s, "C1 can't afford, not armed: refused")
  const armed = C.armOverchannel(s, HB, true)
  const plan = C.overchannelPlan(live(armed), sk, armed)
  const pct = Math.round(((plan.cost - 5) / live(s).manaMax) * 100)
  // Spellblade is a mage class: Backlash x0.8.
  ok(plan && plan.missing === plan.cost - 5 && plan.hp === Math.max(2, Math.ceil(pct / 4)) && plan.backlash === Math.round((20 + pct) * 0.8), "C2 the price: 1 HP per 4% short, Backlash 20 + % short (mage x0.8)", { plan, pct })
  const a = lance(armed)
  results.overchannel = { plan, hp: [live(s).hp, live(a).hp], backlash: live(a).backlash, mana: live(a).mana, armed: live(a).overchannelArmed }
  ok(a !== armed && live(a).hp === live(s).hp - plan.hp && live(a).backlash === plan.backlash && live(a).mana < 5 && !live(a).overchannelArmed, "C3 armed: it casts, pays HP, fills Backlash, disarms", results.overchannel)
  ok((a.events || []).some((e) => e.kind === "reaction" && /Overchannel/.test(e.label)), "C4 Overchannel callout")
  const a2 = lance(C.armOverchannel(s, HB, true))
  ok(JSON.stringify(live(a2)) === JSON.stringify(live(a)), "C5 deterministic: same state, same result")
  // Fill the meter: stunned + hurt at the start of its next turn.
  const full = set(a, HB, { backlash: 100, ap: 2 })
  const nt = E.endPlayerTurn(full)
  ok(nt.phase === "player" && live(nt).ap === 0 && live(nt).backlashStunned && live(nt).backlash === 0 && live(nt).hp === live(full).hp - D.OVERCHANNEL.backlashDamage, "C6 full Backlash: stunned + 4 damage next turn, meter empties", [live(nt).ap, live(nt).hp, live(full).hp, live(nt).backlash])
  ok((nt.events || []).some((e) => /BACKLASH/.test(e.label || "")), "C7 Backlash callout")
  const decay = E.endPlayerTurn(set(a, HB, { backlash: 50 }))
  ok(live(decay).backlash === 35, "C8 below full the meter drains 15 a turn", live(decay).backlash)
  const fullMeter = set(armed, HB, { backlash: 100 })
  ok(C.overchannelPlan(live(fullMeter), sk, armed)?.why && lance(fullMeter) === fullMeter, "C9 a full meter refuses more overchannel")
  const lowHp = set(armed, HB, { hp: plan.hp })
  ok(lance(lowHp) === lowHp, "C10 never kills: needs more HP than the price")
  // Interactions: Void affinity (backlash x0.6), Stormglass Phial (-35%, -1 HP).
  const voidPlan = C.overchannelPlan({ ...live(armed), affinity: "void" }, sk, armed)
  ok(voidPlan.backlash === Math.round(plan.backlash * 0.6), "C11 Void affinity: Backlash 40% slower", [voidPlan.backlash, plan.backlash])
  const glass = board(["hollowfen"], { [HB]: { row: 4, col: 8, mana: 5 }, [E0]: { row: 4, col: 5 } }, { relics: ["stormglass-phial"] })
  const gPlan = C.overchannelPlan(live(glass), sk, glass)
  ok(gPlan.hp === plan.hp - 1 && gPlan.backlash === Math.round(plan.backlash * 0.65), "C12 Stormglass Phial: -1 HP, Backlash 35% slower", gPlan)
  ok(M.canAfford({ ...live(armed) }, sk) && !M.canAfford({ ...live(s) }, sk), "C13 canAfford honours an armed overchannel only")
  ok(C.overchannelPlan({ ...live(s), side: "enemy" }, sk, s) === null, "C14 enemies never overchannel")
}

// ============================================================ D. Mana-fed enemies
{
  const E0 = "enemy-hollowfen-0"
  const E1 = "enemy-duskmoth-1"
  const mk = (p = {}) => board(["hollowfen", "duskmoth"], { [HB]: { row: 4, col: 8, mana: "full" }, [FOOL]: { row: 1, col: 11, mana: "full" }, [E0]: { row: 4, col: 5, hp: 60, maxHp: 60 }, [E1]: { row: 8, col: 0, hp: 40, maxHp: 40 }, ...p })
  const s = mk()
  ok(U(s, E0).manaFeed?.family === "ley-leech" && U(s, E1).manaFeed?.family === "manamoth" && U(s, E0).hunger === 0, "D1 Ley Leech + Manamoth get the feed kit", U(s, E0).manaFeed)
  const atk0 = U(s, E0).attack
  const a = E.castAbility(s, HB, E0, "elemental-strike")
  ok(U(a, E0).hunger === 1 && U(a, E0).attack === atk0 + 1, "D2 a cast within reach: +1 Hunger, +1 attack", [U(a, E0).hunger, U(a, E0).attack, atk0])
  ok(U(a, E1).hunger === 0, "D3 a feeder out of reach doesn't feed (starve it)")
  ok((a.events || []).some((e) => /Hunger 1/.test(e.text || "")), "D4 Hunger callout")
  // A basic attack doesn't feed.
  const atk = E.attackUnit(set(s, HB, { pos: { row: 4, col: 6 } }), HB, E0)
  ok(U(atk, E0).hunger === 0, "D5 attacks don't feed")
  // Burn strips Hunger; full = Gorged.
  let g = s
  for (let i = 0; i < 4; i++) g = F.feedGain(g, E0, 1)
  ok(U(g, E0).hunger === 4 && U(g, E0).attack === atk0 + 4 + 2 && (g.events || []).some((e) => e.label === "GORGED!"), "D6 full Hunger = Gorged (+2 more)", [U(g, E0).hunger, U(g, E0).attack])
  const burned = M.burnMana(g, E0, 10).next
  ok(U(burned, E0).hunger === 2 && U(burned, E0).attack === atk0 + 2, "D7 mana burn removes Hunger (1 per 5) and the bonus", [U(burned, E0).hunger, U(burned, E0).attack])
  // A big cast (25%+ of the bar) feeds 2.
  const big = E.castAbility(s, HB, E0, "arcane-lance")
  ok(U(big, E0).hunger === 2 && U(big, HB).castHeat === 2, "D8 a big cast feeds 2 (and heats the caster)", [U(big, E0).hunger, U(big, HB).castHeat])
  // The Maw: full Hunger -> Mana Nova at the enemy phase start, previewed exactly.
  const MAW = "enemy-the-gorging-maw-0"
  let m = E.createRealMatchupBattle(["hexbreaker", "the-fool", "bulwark-of-ages"], ["the-gorging-maw"], null, 0, {})
  m = M.enableMana({ ...m, phase: "player", terrain: {}, noGraze: true, units: m.units.map((u) => (u.id === MAW ? { ...u, pos: { row: 4, col: 7 }, move: 0, attack: 0, enemySkills: [] } : u.id === HB ? { ...u, pos: { row: 4, col: 9 } } : u.id === FOOL ? { ...u, pos: { row: 0, col: 11 } } : u.side === "player" ? { ...u, pos: { row: 8, col: 11 } } : u)) })
  ok(U(m, MAW)?.manaFeed?.boss && U(m, MAW).manaFeed.max === 6, "D9 the Gorging Maw has the boss feed kit", U(m, MAW)?.manaFeed)
  let full = m
  for (let i = 0; i < 6; i++) full = F.feedGain(full, MAW, 1)
  ok(F.feedNovaTiles(full).length === 25, "D10 a gorged Maw marks its Nova tiles (5x5)", F.feedNovaTiles(full).length)
  const preview = E.previewEnemyIntents(full)
  const hp0 = U(full, HB).hp
  const after = E.endPlayerTurn(full)
  results.nova = { hp0, hp: U(after, HB).hp, fool: [U(full, FOOL).hp, U(after, FOOL).hp], hunger: U(after, MAW).hunger, preview }
  ok(U(after, HB).hp === hp0 - 8 && U(after, FOOL).hp === U(full, FOOL).hp && U(after, MAW).hunger === 1, "D11 Mana Nova: 8 to heroes within 2, Hunger back to 1", results.nova)
  ok((after.events || []).some((e) => e.combo === "colour-nova"), "D12 Mana Nova callout")
  ok(JSON.stringify(E.previewEnemyIntents(full)) === JSON.stringify(preview), "D13 preview is a pure, repeatable dry run")
  // AI: a feeder walks toward the hero that casts the most.
  const ai = board(["hollowfen"], { [HB]: { row: 0, col: 6, castHeat: 0 }, [FOOL]: { row: 8, col: 6, castHeat: 4 }, [E0]: { row: 4, col: 2, hp: 60, maxHp: 60, enemySkills: [] } })
  const intent = E.previewEnemyIntents(ai).find((x) => x.enemyId === E0)?.intent
  const to = intent?.to || U(ai, E0).pos
  const cold = board(["hollowfen"], { [HB]: { row: 0, col: 6, castHeat: 4 }, [FOOL]: { row: 8, col: 6, castHeat: 0 }, [E0]: { row: 4, col: 2, hp: 60, maxHp: 60, enemySkills: [] } })
  const to2 = E.previewEnemyIntents(cold).find((x) => x.enemyId === E0)?.intent?.to || U(cold, E0).pos
  results.ai = { to, to2 }
  ok(to.row > 4 && to2.row < 4, "D14 feeders walk toward the heavy caster", results.ai)
  // The real turn does what the preview said.
  const realTurn = E.endPlayerTurn(ai)
  ok(U(realTurn, E0).pos.row === to.row && U(realTurn, E0).pos.col === to.col, "D15 the preview is exact (real move = previewed move)", [U(realTurn, E0).pos, to])
  // Families + boss: data.
  ok(Object.keys(D.FEED_FAMILIES).length >= 3 && Object.keys(D.FEED_BOSSES).length >= 1, "D16 3 enemy families + 1 boss feed on mana")
  const read = F.feedReadFor(["hollowfen", "duskmoth", "hollowspite", "ironmaw"])
  ok(read.feeders.length === 2 && /burn/.test(read.answer), "D17 the Bring: line reads feeders + answer", read)
}

// ============================================================ E. QA hook
{
  const E0 = "enemy-hollowfen-0"
  const s = board(["hollowfen"], { [HB]: { row: 4, col: 8 }, [E0]: { row: 4, col: 5 } })
  const g = F.feedGain(F.feedGain(s, E0, 1), E0, 1)
  const qa = E.withLowEnemyHp(g)
  ok(!U(qa, E0).manaFeed && U(qa, E0).hunger === 0 && U(qa, E0).attack === U(s, E0).attack, "E1 QA hook strips the feed kit (and its bonus)", [U(qa, E0).attack, U(s, E0).attack])
  const raw = E.withLowEnemyHp(E.createRealMatchupBattle(["hexbreaker"], ["hollowfen"], null, 0, {}))
  ok(!U(M.enableMana(raw), E0).manaFeed, "E2 mana enabled after the QA hook adds no feed kit")
}

// ============================================================ F. Ley network
{
  const open = CE.regionLive
  let c = CE.createCampaign({ seed: 7 })
  const net0 = L.leyNetwork(c, open)
  ok(net0.size === 2 && net0.strength === 2 && net0.startMana === 2 * LEY.startPerStrength && net0.regen === 1 && net0.colours.join() === "root,tide", "F1 Chapter 1: 2 lines (Hearthstead-Grove-Mistfen)", net0)
  // Chapter 2 opens two more lines.
  const safe = (cc) => ({ ...cc, regions: cc.regions.map((r) => ({ ...r, threat: 10 })) })
  c = safe({ ...c, chapter: 2 })
  const net2 = L.leyNetwork(c, open)
  ok(net2.size === 4 && net2.colours.join() === "ember,root,tide" && net2.startMana === 16 && net2.regen === 2, "F2 a bigger network = more start mana + regen", net2)
  // A threatened region drops its lines (and whatever hangs off them).
  const thr = { ...c, regions: c.regions.map((r) => (r.id === "outer-grove" ? { ...r, threat: 55 } : r)) }
  const net3 = L.leyNetwork(thr, open)
  ok(net3.size === 2 && !net3.lines.find((l) => l.id === "grove-mist").connected, "F3 a Threatened region breaks its lines", net3.lines.filter((l) => l.connected).map((l) => l.id))
  // Fight bonus flows into the mission fight.
  const m = c.missions[0]
  const keys = c.roster.slice(0, 4).map((h) => h.key)
  const run = CE.missionRunState(c, m.id, keys)
  ok(run.leyNet.startMana === 16 && run.leyNet.regen === 2 && run.campOvercharge >= 16, "F4 missionRunState carries the network bonus", { leyNet: run.leyNet, oc: run.campOvercharge })
  const launched = CE.launchMission(c, m.id, keys, (rs) => rt.startTacticsFormationBattle(rs, (st) => buildRunTacticsBattle(rs, st)))
  const battle = launched.activeMission?.run?.battle
  const heroes = (battle?.units || []).filter((u) => u.side === "player" && u.classSkills?.length && u.leyColours)
  let hero = heroes[0]
  let sk = null
  for (const h of heroes) {
    const found = h.classSkills.find((x) => net2.colours.includes(C.skillColourOf(x, h)) && M.manaCostOf(x, { ...h, leyColours: [] }) >= 7)
    if (found) {
      hero = h
      sk = found
      break
    }
  }
  results.leyFight = { leyNet: battle?.leyNet, hero: hero?.id, colours: hero?.leyColours, regen: hero?.manaRegenBonus, sk: sk?.id }
  ok(battle?.leyNet?.strength === 4 && hero?.leyColours?.join() === "ember,root,tide" && hero.manaRegenBonus >= 2, "F5 the fight: ley colours on heroes + regen", results.leyFight)
  if (sk) ok(M.manaCostOf(sk, hero) < M.manaCostOf(sk, { ...hero, leyColours: [] }), "F6 a skill of a ley colour costs less", [M.manaCostOf(sk, hero), M.manaCostOf(sk, { ...hero, leyColours: [] })])
  else ok(false, "F6 found a ley-coloured skill to price")
  // Ley Breach: spawns on a network line, expires -> the line is CUT.
  let b = CE.createCampaign({ seed: 7 })
  let breach = null
  for (let i = 0; i < 6 && !breach; i++) {
    b = CE.advanceDay(safe(b))
    breach = b.missions.find((x) => x.type === "breach")
  }
  ok(breach && LEY_LINES.some((l) => l.id === breach.lineId) && breach.expiresDay - b.day >= 2 && breach.reward.leyShards === 1, "F7 a Ley Breach mission appears on a network line", breach)
  const before = L.leyNetwork(b, open).size
  let cut = b
  while (cut.day <= breach.expiresDay) cut = CE.advanceDay(safe(cut))
  const after = L.leyNetwork(safe(cut), open)
  ok(cut.ley.cut.includes(breach.lineId) && after.size < before && cut.lastDayReport.lines.some((l) => /CUT/.test(l)), "F8 ignored: the line is cut, the network shrinks", { cut: cut.ley.cut, before, after: after.size })
  // Lost breach cuts; won breach holds; a Ley Site win mends.
  const lost = L.leyMissionResult(b, breach, false)
  ok(lost.c.ley.cut.includes(breach.lineId), "F9 a lost breach cuts its line")
  const won = L.leyMissionResult(b, breach, true)
  ok(!won.c.ley.cut.includes(breach.lineId) && won.lines.some((l) => /holds/.test(l)), "F10 a won breach holds the line")
  const mend = L.leyMissionResult({ ...b, ley: { cut: ["grove-mist"] } }, { type: "ley", regionId: "mistfen" }, true)
  ok(!mend.c.ley.cut.includes("grove-mist"), "F11 a Ley Site win mends a cut line next to it")
  results.breach = { breach: breach?.title, cutDay: cut.day }
  // Ward / Drain.
  const story = (cc, flags, mods) => ({ ...cc, story: { ...cc.story, flags: { ...cc.story.flags, ...flags }, regionMods: { ...cc.story.regionMods, ...mods } } })
  const base = CE.createCampaign({ seed: 7 })
  const ward = story(base, { ley: "ward" }, { mistfen: "warded", "hollow-ley": "warded" })
  const wn = L.leyNetwork(ward, open)
  ok(wn.strength === 3 && wn.lines.find((l) => l.id === "grove-mist").warded, "F12 Warded lines count double", wn.strength)
  const wardCut = L.leyOnStoryChoice({ ...ward, ley: { cut: ["grove-mist"] } }, base)
  ok(!wardCut.ley.cut.includes("grove-mist"), "F13 Warding mends the warded lines")
  // Warded lines are never breached.
  let wb = { ...ward }
  let wBreach = null
  for (let i = 0; i < 9 && !wBreach; i++) {
    wb = CE.advanceDay(safe(wb))
    wBreach = wb.missions.find((x) => x.type === "breach")
  }
  ok(!wBreach || wBreach.lineId !== "grove-mist", "F14 Ley Breach never targets a Warded line", wBreach?.lineId)
  const drain = L.leyOnStoryChoice(story(base, { ley: "drain" }, { mistfen: "drained" }), base)
  const dn = L.leyNetwork(drain, open)
  ok(drain.ley.drainDay === drain.day && dn.surge === LEY.drainSurge && dn.strength === 2 + LEY.drainSurge, "F15 Drained: the network SURGES (+3 strength)", dn.strength)
  let dd = drain
  for (let i = 0; i < LEY.drainSurgeDays + 1; i++) dd = CE.advanceDay(safe(dd))
  const ddn = L.leyNetwork(safe(dd), open)
  ok(ddn.surge === 0 && dd.ley.cut.some((id) => ["grove-mist", "mist-hollow"].includes(id)), "F16 ...then the drained lines decay", { cut: dd.ley.cut, day: dd.day, drainDay: dd.ley.drainDay })
  // Save round-trip keeps the ley.
  const saved = CE.deserializeCampaign(JSON.parse(JSON.stringify(CE.serializeCampaign(cut))))
  ok(saved && saved.ley.cut.join() === cut.ley.cut.join(), "F17 the ley state survives a save/load")
}

console.log(JSON.stringify(results, null, 1).slice(0, 3000))
console.log(`ENGINE: ${n - fails.length}/${n} pass`)
for (const f of fails) console.log("  FAIL", f)

if (!process.env.ENGINE_ONLY) {
  const uiFails = await uiChecks()
  console.log(`UI: ${uiFails.length ? `${uiFails.length} FAIL` : "all pass"}`)
  for (const f of uiFails) console.log("  FAIL", f)
  process.exitCode = fails.length || uiFails.length ? 1 : 0
} else process.exitCode = fails.length ? 1 : 0

async function uiChecks() {
  return ["UI checks not written yet"]
}
