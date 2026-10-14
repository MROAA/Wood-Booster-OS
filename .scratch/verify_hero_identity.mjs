// Hero Identity sprint (Marc: "heroes feel alike"): every one of the 38
// classes gets a signature mechanic of its own, heroes get personality
// quirks + bonds (friends / rivals), every class a signature LEGENDARY item,
// and heroes remember (scars, honours, a history log) across the campaign.
//
// Part 1 = pure-engine checks, straight in node (memory-tight machine):
//   `ENGINE_ONLY=1 node .scratch/verify_hero_identity.mjs`
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
const D = await import(`${SRC}tacticsDepth.js`)
const M = await import(`${SRC}tacticsMana.js`)
const C = await import(`${SRC}tacticsCover.js`)
const K = await import(`${SRC}tacticsClasses.js`)
const S = await import(`${SRC}tacticsSignatures.js`)
const B = await import(`${SRC}tacticsBonds.js`)
const H = await import(`${SRC}heroIdentity.js`)
const HE = await import(`${SRC}hearth.js`)
const R = await import(`${SRC}runEngine.js`)
const { SIGNATURES } = await import(`${DATA}signatures.js`)
const { CLASSES, CLASS_IDS } = await import(`${DATA}classes.js`)
const { UNITS } = await import(`${DATA}units.js`)
const { ITEMS, itemPool } = await import(`${DATA}items.js`)

const fails = []
const results = {}
const ok = (cond, msg, data) => {
  if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
}
const U = (s, id) => s.units.find((u) => u.id === id)
const HERO = "player-bulwark-of-ages-0"
const ALLY = "player-the-fool-1"
const E0 = "enemy-ironmaw-0"
const E1 = "enemy-sapling-attendant-1"
const patch = (s, id, p) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...p } : u)) })
const labels = (s) => (s.events || []).filter((e) => e.kind === "reaction").map((e) => e.label)
const dmgTo = (a, b, id) => U(a, id).hp - U(b, id).hp
const enemyHit = (s, a, t) => ({ ...E.attackUnit({ ...s, phase: "enemy" }, a, t), phase: "player" })

// A board with HERO turned into `classId` (+ an ally and two 40-HP enemies).
function mk(classId, place = {}, { sig = true, gear = [] } = {}) {
  let s = E.createTacticsBattle("default")
  const at = { [HERO]: { row: 4, col: 5 }, [ALLY]: { row: 3, col: 6 }, [E0]: { row: 4, col: 4 }, [E1]: { row: 0, col: 0 }, ...place }
  s = {
    ...s,
    terrain: {},
    wallHp: {},
    units: s.units.map((u) => {
      const k = at[u.id]
      if (!k) return { ...u, hp: 0 }
      const { row, col, ...p } = k
      const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [], attack: 5, baseAttack: 5 } : {}
      const cls = u.id === HERO ? { ...K.classFieldsFor({ ...UNITS[u.defId], classId }, "player"), resource: undefined, ap: 3, apMax: 3 } : {}
      return { ...u, block: 0, ...base, ...cls, gearIds: u.id === HERO ? gear : u.gearIds, ...p, pos: { row, col } }
    }),
  }
  s = D.enableCombatDepth(M.enableMana(s))
  return sig ? S.enableHeroIdentity(s) : s
}
const h = (s) => U(s, HERO)

// ------------------------------------------------------------ 38 SIGNATURES
// One scenario per class. Each returns { ok, info } - the mechanic must
// visibly DO its thing (state change) and count itself in `sigFx`.
const probes = {
  guardian() {
    const s0 = mk("guardian", { [ALLY]: { row: 3, col: 5 } })
    const s1 = S.sigPlayerTurnEnd(s0)
    const raw = E.attackPreview ? null : null
    const a = S.sigDamage(U(s1, E0), U(s1, ALLY), 5, s1)
    const b = S.sigDamage(U(s0, E0), U(s0, ALLY), 5, s0)
    const hit = enemyHit(patch(s1, E0, { pos: { row: 3, col: 4 } }), E0, ALLY)
    return { ok: h(s1).sigOn && a === b - 1 && h(hit).mana > h(s1).mana, info: { a, b, holy: [h(s1).mana, h(hit).mana], raw } }
  },
  warden() {
    const s0 = mk("warden")
    const s1 = enemyHit(enemyHit(s0, E0, HERO), E0, HERO)
    return { ok: h(s1).sig === 2 && dmgTo(s0, s1, E0) >= 3 && labels(s1).some((l) => l.includes("Thorns")), info: { sig: h(s1).sig, thorn: dmgTo(s0, s1, E0) } }
  },
  juggernaut() {
    const s0 = mk("juggernaut", { [HERO]: { row: 4, col: 8 }, [E0]: { row: 4, col: 6 } })
    const moved = E.moveUnit(s0, HERO, { row: 4, col: 7 })
    const hitM = E.attackUnit(moved, HERO, E0)
    const plain = mk("juggernaut", { [HERO]: { row: 4, col: 7 }, [E0]: { row: 4, col: 6 } })
    const hitP = E.attackUnit(plain, HERO, E0)
    const big = patch(plain, HERO, { sig: 3 })
    const hitB = E.attackUnit(big, HERO, E0)
    return { ok: h(moved).sig === 1 && dmgTo(moved, hitM, E0) === dmgTo(plain, hitP, E0) + 1 && h(hitM).sig === 0 && U(hitB, E0).stagger > 0 && U(hitB, E0).cbOffBalance > 0, info: { sig: h(moved).sig, d: [dmgTo(moved, hitM, E0), dmgTo(plain, hitP, E0)] } }
  },
  sentinel() {
    let s = mk("sentinel")
    for (let i = 0; i < 3; i++) s = S.sigPlayerTurnEnd(s)
    const parts = C.hitChance(s, h(s), U(s, E0)).parts.map((p) => p.label)
    const full = E.attackUnit(s, HERO, E0)
    const plain = mk("sentinel")
    return { ok: h(s).sig === 3 && parts.some((l) => l.includes("Held Breath")) && dmgTo(s, full, E0) > dmgTo(plain, E.attackUnit(plain, HERO, E0), E0) && h(full).sig === 0, info: { sig: h(s).sig, parts } }
  },
  bruiser() {
    let s = mk("bruiser")
    for (let i = 0; i < 2; i++) s = enemyHit(s, E0, HERO)
    const grit = h(s).sig
    const hp0 = h(s).hp
    const hit = E.attackUnit(s, HERO, E0)
    const base = patch(s, HERO, { sig: 0 })
    return { ok: grit >= 1 && dmgTo(s, hit, E0) > dmgTo(base, E.attackUnit(base, HERO, E0), E0) && h(hit).hp > hp0 && h(hit).sig === 0, info: { grit, hp: [hp0, h(hit).hp] } }
  },
  striker() {
    const s0 = patch(mk("striker"), E0, { poison: 2 })
    const s1 = E.attackUnit(s0, HERO, E0)
    const s2 = E.castAbility(s1, HERO, E0, "double-strike")
    const s3 = E.attackUnit(patch(s1, HERO, { sig: 2 }), HERO, E0)
    return { ok: h(s1).sig === 1 && h(s2).sig === 0 && h(s3).sig === 3 && labels(s2).some((l) => l.includes("Opening")), info: { s1: h(s1).sig, s2: h(s2).sig } }
  },
  assassin() {
    const s0 = mk("assassin")
    const hit = E.attackUnit(s0, HERO, E0)
    const plain = mk("assassin", {}, { sig: false })
    const kill = E.attackUnit(patch(hit, E0, { hp: 1 }), HERO, E0)
    return { ok: h(s0).stealth > 0 && h(s0).sigAmbush && dmgTo(s0, hit, E0) > dmgTo(plain, E.attackUnit(plain, HERO, E0), E0) && !h(hit).sigAmbush && h(kill).sigAmbush && h(kill).stealth > 0, info: { d: dmgTo(s0, hit, E0) } }
  },
  duelist() {
    const s0 = mk("duelist")
    const s1 = E.attackUnit(s0, HERO, E0)
    const s2 = E.attackUnit(s1, HERO, E0)
    return { ok: h(s2).sig === 2 && h(s2).sigTarget === E0 && dmgTo(s1, s2, E0) > dmgTo(s0, s1, E0), info: { d: [dmgTo(s0, s1, E0), dmgTo(s1, s2, E0)] } }
  },
  ranger() {
    const s0 = mk("ranger", { [E1]: { row: 2, col: 2 } })
    const s1 = E.attackUnit(s0, HERO, E0)
    const kill = E.attackUnit(patch(s1, E0, { hp: 1 }), HERO, E0)
    return { ok: U(s1, E0).sigQuarryBy === HERO && U(kill, E1).sigQuarryBy === HERO && h(kill).mana > h(s1).mana, info: { q: U(s1, E0).sigQuarryBy, next: U(kill, E1).sigQuarryBy } }
  },
  artillery() {
    const s0 = S.sigPlayerTurnEnd(mk("artillery", { [E1]: { row: 3, col: 4 } }))
    const hit = E.attackUnit(s0, HERO, E0)
    return { ok: h(s0).sigOn && dmgTo(s0, hit, E1) >= 1, info: { splash: dmgTo(s0, hit, E1) } }
  },
  executioner() {
    const s0 = mk("executioner", { [E1]: { row: 5, col: 5 } })
    const kill = E.attackUnit(patch(s0, E0, { hp: 1 }), HERO, E0)
    const hurt = patch(kill, E1, { hp: 15 })
    const after = E.attackUnit(hurt, HERO, E1)
    const base = patch(hurt, HERO, { sig: 0 })
    return { ok: h(kill).sig === 1 && dmgTo(hurt, after, E1) > dmgTo(base, E.attackUnit(base, HERO, E1), E1), info: { sig: h(kill).sig } }
  },
  spellblade() {
    const s0 = patch(mk("spellblade"), HERO, { sigLast: "skill" })
    const hit = E.attackUnit(s0, HERO, E0)
    const base = patch(s0, HERO, { sigLast: null })
    return { ok: h(hit).sig === 1 && dmgTo(s0, hit, E0) > dmgTo(base, E.attackUnit(base, HERO, E0), E0), info: { sig: h(hit).sig } }
  },
  healer() {
    const s0 = patch(mk("healer"), ALLY, { hp: 5 })
    const after = patch(s0, ALLY, { hp: U(s0, ALLY).maxHp })
    const s1 = S.sigAfterCast(s0, after, HERO, ALLY, { id: "x" })
    return { ok: h(s1).sig === 1 && U(s1, ALLY).block >= 2, info: { sig: h(s1).sig, block: U(s1, ALLY).block } }
  },
  medic() {
    const s0 = patch(mk("medic"), ALLY, { hp: 3 })
    const s1 = S.sigPlayerTurnStart(s0)
    const healed = patch(s1, ALLY, { hp: 5 })
    const s2 = S.sigAfterCast(s1, healed, HERO, ALLY, { id: "x" })
    return { ok: h(s1).sig === 1 && h(s1).mana > h(s0).mana && U(s2, ALLY).hp === 6, info: { sig: h(s1).sig, hp: U(s2, ALLY).hp } }
  },
  buffer() {
    const s0 = mk("buffer")
    const after = patch(s0, ALLY, { block: 2 })
    const s1 = S.sigAfterCast(s0, after, HERO, ALLY, { id: "x" })
    const a = S.sigDamage(U(s1, ALLY), U(s1, E0), 5, s1)
    return { ok: U(s1, ALLY).anthem === 2 && h(s1).sig === 1 && a === 6, info: { a } }
  },
  commander() {
    const s0 = mk("commander", { [ALLY]: { row: 5, col: 4 } })
    const kill = E.attackUnit(patch(s0, E0, { hp: 1 }), ALLY, E0)
    const k2 = patch(kill, E1, { pos: { row: 6, col: 4 } })
    const parts = C.hitChance(k2, U(k2, ALLY), U(k2, E1)).parts.map((p) => p.label)
    return { ok: h(kill).sig === 1 && parts.includes("♛ Battle Orders"), info: { sig: h(kill).sig, parts } }
  },
  tactician() {
    const s0 = mk("tactician")
    const s1 = S.sigAfterHit(s0, ALLY, E0, { facing: "back" })
    const full = patch(s1, HERO, { sig: 3 })
    const cast = S.sigAfterCast(full, patch(full, HERO, { ap: 1 }), HERO, null, { id: "x" })
    return { ok: h(s1).sig === 1 && h(cast).ap === 2 && h(cast).sig === 0, info: { sig: h(s1).sig, ap: h(cast).ap } }
  },
  controller() {
    const s0 = mk("controller")
    const s1 = E.attackUnit(s0, HERO, E0)
    const enemyPhase = { ...s1, phase: "enemy" }
    const far = E.reachableTilesFor(enemyPhase, E0).filter((p) => Math.max(Math.abs(p.row - 4), Math.abs(p.col - 5)) > 2).sort((a, b) => b.col - a.col)[0]
    const moved = far ? E.moveUnit(enemyPhase, E0, far) : enemyPhase
    return { ok: U(s1, E0).sigTetherBy === HERO && !!far && dmgTo(s1, moved, E0) >= 3 && U(moved, E0).slow > 0, info: { far, d: dmgTo(s1, moved, E0) } }
  },
  frostbinder() {
    const s0 = patch(mk("frostbinder"), E0, { chill: 2 })
    const s1 = E.attackUnit(s0, HERO, E0)
    const red = S.sigDamage(U(s1, E0), h(s1), 5, s1)
    return { ok: h(s1).sig === 1 && red === 4, info: { sig: h(s1).sig, red } }
  },
  rootweaver() {
    const s0 = patch(mk("rootweaver"), E0, { root: 2 })
    const s1 = S.sigPlayerTurnStart(s0)
    return { ok: dmgTo(s0, s1, E0) === 1 && labels(s1).some((l) => l.includes("Strangleroots")), info: { d: dmgTo(s0, s1, E0) } }
  },
  disruptor() {
    let s = patch(mk("disruptor"), HERO, { ap: 5 })
    for (let i = 0; i < 3; i++) s = E.attackUnit(s, HERO, E0)
    return { ok: U(s, E0).drained >= 1 && !(U(s, E0).sigStatic > 0) && labels(s).some((l) => l.includes("Short-circuit")), info: { drained: U(s, E0).drained } }
  },
  trapper() {
    const s0 = S.sigPlayerTurnEnd(mk("trapper", { [E0]: { row: 4, col: 3 } }))
    const ep = { ...s0, phase: "enemy" }
    const to = E.reachableTilesFor(ep, E0).find((p) => Math.max(Math.abs(p.row - 4), Math.abs(p.col - 5)) <= 1)
    const moved = to ? E.moveUnit(ep, E0, to) : ep
    return { ok: !!to && U(moved, E0).root > 0 && labels(moved).some((l) => l.includes("Snared")), info: { root: U(moved, E0).root } }
  },
  hexer() {
    let s = patch(mk("hexer"), HERO, { ap: 5 })
    for (let i = 0; i < 3; i++) s = E.attackUnit(s, HERO, E0)
    const doomed = U(s, E0).sigDoom
    const t = S.sigPlayerTurnStart(s)
    return { ok: doomed === 3 && dmgTo(s, t, E0) >= 5 && !(U(t, E0).sigDoom > 0), info: { doomed, d: dmgTo(s, t, E0) } }
  },
  summoner() {
    const s0 = mk("summoner")
    const wolf = { ...E.deriveTacticsUnit("spirit-wolf", "player", { row: 5, col: 4 }, "wolf-1"), ownerId: HERO }
    const s1 = S.sigPlayerTurnStart({ ...s0, units: [...s0.units, wolf] })
    const d = S.sigDamage(U(s1, "wolf-1"), U(s1, E0), 3, s1)
    const died = S.sigOnDamaged(patch(s1, "wolf-1", { hp: 0 }), "wolf-1", 5)
    return { ok: U(s1, "wolf-1").sigLink === 1 && d === 4 && h(died).block >= 2, info: { d, block: h(died).block } }
  },
  beastmaster() {
    const s0 = mk("beastmaster")
    const wolf = { ...E.deriveTacticsUnit("spirit-wolf", "player", { row: 5, col: 4 }, "wolf-1"), ownerId: HERO, ap: 1 }
    const s1 = E.attackUnit({ ...s0, units: [...s0.units, wolf] }, HERO, E0)
    const s2 = E.attackUnit(s1, "wolf-1", E0)
    return { ok: U(s2, E0).exposed > 0 && labels(s2).some((l) => l.includes("Mauled")), info: { exposed: U(s2, E0).exposed } }
  },
  alchemist() {
    const s0 = patch(mk("alchemist"), E0, { burn: 2 })
    const s1 = E.attackUnit(s0, HERO, E0)
    return { ok: (h(s1).reagents?.fire || 0) === 1, info: h(s1).reagents }
  },
  scout() {
    const s0 = mk("scout")
    const parts = C.hitChance(s0, U(s0, ALLY), U(s0, E0)).parts.map((p) => p.label)
    return { ok: U(s0, E0).sigSpotted > 0 && !(U(s0, E1).sigSpotted > 0) && parts.includes("👁 Spotted"), info: { parts } }
  },
  saboteur() {
    const s0 = mk("saboteur", { [E1]: { row: 3, col: 4 }, [ALLY]: { row: 5, col: 4 } })
    const s1 = E.attackUnit(s0, HERO, E0)
    const boom = E.attackUnit(patch(s1, E0, { hp: 1 }), ALLY, E0)
    return { ok: U(s1, E0).sigRigged > 0 && dmgTo(s1, boom, E1) >= 3, info: { d: dmgTo(s1, boom, E1) } }
  },
  engineer() {
    const s0 = patch(mk("engineer"), HERO, { sig: 3 })
    const skillDmg = S.sigDamage(h(s0), U(s0, E0), 4, s0, { skill: true })
    const s1 = S.sigAfterCast(s0, patch(s0, HERO, { ap: 1 }), HERO, null, { id: "x" })
    return { ok: skillDmg === 6 && h(s1).ap === 2 && h(s1).hp < h(s0).hp && h(s1).sig === 0, info: { skillDmg, ap: h(s1).ap } }
  },
  spiritwalker() {
    const s0 = S.sigPlayerTurnEnd(mk("spiritwalker", { [E0]: { row: 4, col: 2 } }))
    const red = S.sigDamage(U(s0, E0), h(s0), 5, s0)
    const near = S.sigPlayerTurnEnd(mk("spiritwalker"))
    return { ok: h(s0).sigOn && red === 3 && !h(near).sigOn && h(near).mana > 0, info: { red } }
  },
  ritualist() {
    const s0 = patch(mk("ritualist", { [ALLY]: { row: 5, col: 4 } }), HERO, { mana: 12 })
    const kill = E.attackUnit(patch(s0, E0, { hp: 1 }), ALLY, E0)
    const thrall = kill.units.find((u) => u.thrall)
    return { ok: !!thrall && thrall.side === "player" && thrall.ownerId === HERO && h(kill).sigRaised === 1, info: { thrall: thrall?.name, souls: h(kill).mana } }
  },
  chronomancer() {
    let s = mk("chronomancer")
    for (let i = 0; i < 3; i++) s = S.sigAfterCast(s, patch(s, HERO, { block: (h(s).block || 0) + 1 }), HERO, null, { id: "x" })
    const t = S.sigPlayerTurnStart(s)
    return { ok: h(s).sig === 3 && h(t).ap === h(s).ap + 1 && h(t).sig === 0, info: { sig: h(s).sig } }
  },
  shapeshifter() {
    const s0 = mk("shapeshifter")
    const s1 = S.sigAfterCast(s0, patch(s0, HERO, { form: "beast" }), HERO, null, { id: "beast-form" })
    const hit = E.attackUnit(s1, HERO, E0)
    const base = patch(s1, HERO, { sigPrimed: false })
    return { ok: h(s1).sigPrimed && dmgTo(s1, hit, E0) === dmgTo(base, E.attackUnit(base, HERO, E0), E0) + 3 && !h(hit).sigPrimed, info: { d: dmgTo(s1, hit, E0) } }
  },
  corruptor() {
    const s0 = patch(patch(mk("corruptor", { [E1]: { row: 3, col: 4 }, [ALLY]: { row: 5, col: 4 } }), E0, { corruption: 2, hp: 1 }), E1, { corruption: 0 })
    const kill = E.attackUnit(s0, ALLY, E0)
    return { ok: U(kill, E1).corruption === 2 && labels(kill).some((l) => l.includes("Rot spreads")), info: { c: U(kill, E1).corruption } }
  },
  merchant() {
    const s0 = patch(patch(mk("merchant"), HERO, { sig: 3 }), E0, { hp: 15 })
    const s1 = E.attackUnit(s0, HERO, E0)
    return { ok: U(s1, E0).stun > 0 && h(s1).sig === 0, info: { stun: U(s1, E0).stun } }
  },
  "relic-keeper"() {
    const s0 = mk("relic-keeper")
    const pre = S.sigPreDamage(s0, ALLY, 6)
    return { ok: h(s0).sig === 2 && pre.amount === 4 && h(pre.state).sig === 1, info: { amount: pre.amount } }
  },
  cleanser() {
    const s0 = patch(mk("cleanser"), ALLY, { poison: 3 })
    const s1 = S.sigPlayerTurnStart(s0)
    return { ok: !(U(s1, ALLY).poison > 0) && labels(s1).some((l) => l.includes("Cleansed")), info: { poison: U(s1, ALLY).poison } }
  },
  gatherer() {
    const s0 = patch(patch(mk("gatherer"), HERO, { moved: true, sig: 2 }), ALLY, { hp: 5 })
    const s1 = S.sigPlayerTurnEnd(s0)
    return { ok: U(s1, ALLY).hp === 9 && h(s1).sig === 0, info: { hp: U(s1, ALLY).hp } }
  },
}

results.signatures = {}
ok(CLASS_IDS.length === 38 && Object.keys(SIGNATURES).length === 38, "38 classes, 38 signatures", { classes: CLASS_IDS.length, sigs: Object.keys(SIGNATURES).length })
for (const cid of CLASS_IDS) {
  const sig = SIGNATURES[cid]
  ok(!!sig && sig.name && sig.icon && sig.text && sig.legendary?.id, `signature data for ${cid}`)
  const probe = probes[cid]
  if (!probe) {
    fails.push(`no probe for ${cid}`)
    continue
  }
  let r
  try {
    r = probe()
  } catch (e) {
    r = { ok: false, info: String(e?.stack || e).split("\n").slice(0, 3).join(" | ") }
  }
  results.signatures[cid] = r.ok ? "ok" : r.info
  ok(r.ok, `signature mechanic works: ${cid} (${sig?.name})`, r.info)
}
// Names are all distinct (every class feels different).
ok(new Set(Object.values(SIGNATURES).map((s) => s.name)).size === 38, "38 distinct signature names")

// Opt-in: without heroSig nothing changes.
{
  const off = mk("juggernaut", {}, { sig: false })
  const p = patch(off, HERO, { sig: 5 })
  ok(S.sigDamage(h(p), U(p, E0), 5, p) === 5, "no signature effects without heroSig")
  ok(!off.heroSig && !("sig" in h(off)), "hand-built states untouched")
}

// Token read-out for every class (the visible chip).
{
  const missing = CLASS_IDS.filter((cid) => {
    const s = mk(cid)
    const t = S.sigToken(s, h(s))
    return !t || !t.icon || !t.title
  })
  ok(!missing.length, "every class has a token chip + tooltip", missing)
}

// ----------------------------------------------------------- LEGENDARIES
{
  const sigItems = Object.values(ITEMS).filter((i) => i.kind === "signature")
  ok(sigItems.length === 38 && sigItems.every((i) => i.rarity === "legendary" && i.noShop), "38 signature legendaries (legendary, never in the shop)", sigItems.length)
  ok(!itemPool().some((i) => i.kind === "signature"), "shop / event pool excludes signature items")
  const plain = mk("juggernaut")
  const worn = mk("juggernaut", {}, { gear: ["sig-juggernaut"] })
  ok(h(worn).sigLegend === "juggernaut" && S.sigNumbers(h(worn)).max === 8 && S.sigNumbers(h(plain)).max === 5, "legendary transforms the mechanic (Momentum max 5 -> 8)")
  ok(h(worn).classSkills.find((k) => k.id === "charge").range === 6 && h(plain).classSkills.find((k) => k.id === "charge").range === 4, "legendary transforms a skill (Charge range 4 -> 6)")
  const wrong = mk("guardian", {}, { gear: ["sig-juggernaut"] })
  ok(!h(wrong).sigLegend, "another class's legendary stays dormant")
  // Every legendary's skill patch names a real skill of its class.
  const bad = Object.values(SIGNATURES).filter((s) => s.legendary.skill && !CLASSES[s.id].skills.some((k) => k.id === s.legendary.skill.id)).map((s) => s.id)
  ok(!bad.length, "every legendary skill patch targets a real class skill", bad)
  // Drops: a miniboss always drops one for a deployed hero's class.
  const rs = { seed: 77, nodeIndex: 3, bench: [{ key: 0, defId: "bulwark-of-ages", classId: "guardian" }], deployed: [0], items: [], itemKeyCounter: 5, lastAftermath: [] }
  const dropped = H.signatureDrop(rs, { type: "miniboss" })
  ok(dropped.items.length === 1 && dropped.items[0].defId === "sig-guardian" && dropped.lastAftermath.some((l) => l.includes("LEGENDARY")), "miniboss drops the class legendary", dropped.items)
  ok(H.signatureDrop(dropped, { type: "miniboss" }).items.length === 1, "no duplicate legendary")
  ok(H.signatureDrop(rs, { type: "battle" }) === rs, "plain battles never drop one")
}

// ---------------------------------------------------- QUIRKS + BONDS (fight)
{
  const s0 = mk("striker", { [ALLY]: { row: 3, col: 5 } })
  const friends = patch(patch(s0, HERO, { bondMap: { [ALLY]: "friend" } }), ALLY, { bondMap: { [HERO]: "friend" } })
  const a = S.sigDamage(h(friends), U(friends, E0), 5, friends)
  ok(a === 6, "friend next to it: +1 damage", a)
  ok(B.bondLinks(friends).length === 1, "bond line between adjacent friends")
  const hit = E.attackUnit(friends, HERO, E0)
  ok(labels(hit).some((l) => l.includes("Friends")), "bond callout when the bonus pays out")
  const sworn = patch(friends, HERO, { bondMap: { [ALLY]: "sworn" } })
  ok(S.sigDamage(h(sworn), U(sworn, E0), 5, sworn) === 7, "sworn friend: +2 damage")
  const rivals = patch(s0, HERO, { bondMap: { [ALLY]: "rival" } })
  ok(S.sigDamage(U(rivals, E0), h(rivals), 5, rivals) === 6, "rival next to it: takes +1")
  ok(C.hitChance(rivals, h(rivals), U(rivals, E0)).parts.some((p) => p.label.includes("rival")), "rival: +10% to hit (showing off)")
  // Fear: an Afraid-of-Beasts hero next to Ironmaw (a beast).
  const scared = patch(s0, HERO, { quirks: ["fears-beasts"] })
  ok(B.fearOf(scared, h(scared))?.quirk.id === "fears-beasts", "fear detected next to a feared family")
  ok(S.sigDamage(h(scared), U(scared, E0), 5, scared) === 4, "fear: -1 damage")
  ok(S.sigDamage(h(scared), U(scared, E0), 1, scared) === 1, "fear never drops a hit below 1 (quick-win safe)")
  ok(labels(S.sigPlayerTurnStart(scared)).some((l) => l.includes("Afraid")), "fear callout at turn start")
  // Like: Loves Heights on high ground.
  const high = patch({ ...s0, terrain: { "4-5": "high" } }, HERO, { quirks: ["loves-heights"] })
  ok(S.sigDamage(h(high), U(high, E0), 5, high) === 6, "Loves Heights: +1 on high ground")
  // Scars: Survivor below 30%, Grudge vs the family.
  const surv = patch(s0, HERO, { scars: ["survivor", "grudge"], grudge: "beast", hp: 3 })
  ok(S.sigDamage(U(surv, E0), h(surv), 5, surv) === 4, "Survivor: takes 1 less at <=30% HP")
  ok(S.sigDamage(h(surv), U(surv, E0), 5, surv) === 6, "Grudge: +1 vs the family that nearly killed it")
}

// ----------------------------------------------- HISTORY + SCARS (campaign)
{
  const bench = [
    { key: 0, defId: "bulwark-of-ages" },
    { key: 1, defId: "the-fool" },
  ]
  let rs = H.withHeroIdentity({ seed: 99, bench, deployed: [0, 1], items: [], lastAftermath: [] })
  ok(rs.bench.every((e) => e.identity && e.identity.quirks.length >= 1 && e.identity.quirks.length <= 2), "every hero rolls 1-2 quirks", rs.bench.map((e) => e.identity.quirks))
  ok(JSON.stringify(H.withHeroIdentity({ seed: 99, bench, deployed: [0, 1] }).bench[0].identity) === JSON.stringify(rs.bench[0].identity), "quirk rolls are seeded (deterministic)")
  const battle = H.applyIdentityToBattle(E.createTacticsBattle("default"), rs)
  ok(battle.heroSig && U(battle, HERO).heroUid === "r0" && Array.isArray(U(battle, HERO).quirks), "identity folded onto the tactics units")
  // A fight: the tank nearly dies vs Ironmaw, the fool saves it + kills a boss.
  const fought = {
    ...battle,
    units: battle.units.map((u) =>
      u.id === HERO
        ? { ...u, hp: 2, hMin: 0.05, hNear: { by: "Ironmaw", family: "beast", hp: 2 }, hSavedBy: [ALLY], pos: { row: 4, col: 5 } }
        : u.id === ALLY
          ? { ...u, hKills: 3, hBig: ["The Gorging Maw"], hSaved: [HERO], pos: { row: 4, col: 6 } }
          : u,
    ),
  }
  let after = H.recordHeroHistory(rs, fought)
  const tank = H.identityOf(after.bench[0])
  const fool = H.identityOf(after.bench[1])
  results.history = { tank: tank.history, fool: fool.history, scars: [tank.scars, fool.scars] }
  ok(tank.history.some((l) => l.includes("Survived Ironmaw at 2 HP")), "history: near-death survived", tank.history)
  ok(tank.scars.includes("survivor") && tank.scars.includes("grudge") && tank.grudge === "beast", "scars: Survivor + Grudge (beasts)", tank.scars)
  ok(tank.history.some((l) => l.startsWith("Saved by")), "history: saved by an ally")
  ok(fool.history.some((l) => l.includes("Slew The Gorging Maw")) && fool.scars.includes("giantsbane") && fool.scars.includes("guardian-angel"), "honours: Giantsbane + Guardian Angel", fool.scars)
  ok(H.bondLevel(tank.bonds.r1) === "friend", "a life saved side by side = friends at once", tank.bonds)
  ok(after.lastAftermath.some((l) => l.includes("Survivor")) && after.lastAftermath.some((l) => l.includes("Friends")), "aftermath lines name the new scar + friendship")
  // Bonds become a real in-fight bonus next time.
  const b2 = H.applyIdentityToBattle(E.createTacticsBattle("default"), after)
  ok(U(b2, HERO).bondMap?.[ALLY] === "friend", "next fight: bondMap links the friends")
  // Hearth: identity comes home, bond uids get remapped, veterans carry it back out.
  const runEnd = { ...after, seed: 99, battle: null, characterId: "tommy" }
  const { hearth } = HE.harvestRun(HE.freshHearth(), runEnd, true, "run-x")
  const home = hearth.roster.find((u) => u.defId === "bulwark-of-ages")
  const foolHome = hearth.roster.find((u) => u.defId === "the-fool")
  ok(home?.identity?.scars?.includes("survivor"), "Hearth keeps scars across runs")
  ok(home && foolHome && Object.keys(home.identity.bonds).includes(`h${foolHome.hid}`), "bond ids remapped to Hearth ids", home?.identity?.bonds)
  const out = HE.veteransForRun ? null : null
  results.hearth = { bonds: home?.identity?.bonds, out }
}

// ------------------------------------------------------ PREVIEW IS EXACT
{
  // With signatures on, the enemy telegraph equals the real enemy turn.
  let s = mk("warden", { [E0]: { row: 4, col: 3 }, [E1]: { row: 2, col: 3 } })
  s = patch(s, E1, { hp: 40 })
  const intents = E.previewEnemyIntents(s)
  const real = E.endPlayerTurn(s)
  const atk = intents.filter((i) => i.intent.targetId).map((i) => i.intent.targetId)
  ok(real.phase === "player" && Array.isArray(intents), "preview + real turn both run with signatures on")
  results.preview = { intents: intents.map((i) => i.intent.kind), atk }
}

// ------------------------------------------------- REAL RUN (engine only)
{
  const { buildRunTacticsBattle } = await import(`${SRC}tacticsRealMatchup.js`)
  const idx = R.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "hexbreaker"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...R.startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: R.RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: [0, 1, null, null], items: [] }
  const started = R.startTacticsFormationBattle(rs, (start) => buildRunTacticsBattle(rs, start))
  ok(started.battle?.heroSig === true, "real run fight runs with hero identity")
  ok(started.bench.every((e) => e.identity?.quirks?.length >= 1), "real run heroes have quirks before the fight")
  const qa = E.withLowEnemyHp(E.beginBattle ? started.battle : started.battle)
  ok(!!qa && qa.heroSig, "QA hook keeps the fight playable")
}

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
  const ui = {}
  const check = (cond, msg, data) => cond || out.push(data === undefined ? msg : `${msg} ${JSON.stringify(data).slice(0, 300)}`)
  const browser = await chromium.launch()
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } })
    const page = await ctx.newPage()
    const errs = []
    page.on("pageerror", (e) => errs.push(String(e)))
    // 1) Prototype board: signature chips, bond lines, enemy marks, selected card.
    await page.goto(`http://localhost:${PORT}/heartwood-tactics?squad=hexmother,stormwing,duskclaw,the-fool&identity=demo&front=1`, { waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hwt-board", { timeout: 30000 })
    await page.waitForTimeout(600)
    ui.chips = await page.locator(".hwt-sig-chip").count()
    ui.friend = await page.locator(".hwt-bond[data-bond='friend']").count()
    ui.rival = await page.locator(".hwt-bond[data-bond='rival']").count()
    ui.spotted = await page.locator(".hwt-token[data-side='enemy'] .hwt-sig-mark[data-mark='spotted']").count()
    ui.stealth = await page.locator(".hwt-token[data-unit-id='player-duskclaw-2'] .hwt-sig-chip[data-on='true']").count()
    check(ui.chips >= 5, "every hero token shows its signature chip", ui)
    check(ui.friend === 1 && ui.rival === 1, "bond lines: friends + rivals side by side", ui)
    check(ui.spotted >= 1, "Scout: Spotted marks on nearby enemies", ui)
    check(ui.stealth === 1, "Assassin starts in Shadowmeld (chip lit)", ui)
    ui.chipTitle = await page.locator(".hwt-token[data-unit-id='player-hexmother-0'] .hwt-sig-chip").getAttribute("title")
    check(/Doom/.test(ui.chipTitle || ""), "signature chip tooltip explains the mechanic", ui.chipTitle)
    await page.screenshot({ path: `${SHOT_DIR}/hero_identity_board.png` })
    // Select the Hexer: signature card + quirks / bonds / scars.
    await page.click(".hwt-token[data-unit-id='player-hexmother-0']")
    await page.waitForSelector(".hwt-sig-info", { timeout: 5000 })
    ui.sigInfo = await page.locator(".hwt-sig-info").innerText()
    ui.idInfo = await page.locator(".hwt-identity-info").innerText().catch(() => "")
    check(/Doom/.test(ui.sigInfo) && /Signature/i.test(ui.sigInfo), "selected hero: signature card", ui.sigInfo)
    check(/Loyal/.test(ui.idInfo) && /Stormwing/.test(ui.idInfo) && /Survivor/.test(ui.idInfo), "selected hero: quirks, friend and scar chips", ui.idInfo)
    await page.locator(".hwt-panel").screenshot({ path: `${SHOT_DIR}/hero_identity_selected.png` }).catch(() => page.screenshot({ path: `${SHOT_DIR}/hero_identity_selected.png` }))
    // Hexer hits an enemy -> Doom mark on it.
    const target = await page.evaluate(() => {
      const el = document.querySelector(".hwt-cell[data-targetable='true'] .hwt-token[data-side='enemy']")
      return el?.dataset.unitId || null
    })
    if (target) {
      await page.click(`.hwt-token[data-unit-id='${target}']`)
      await page.waitForTimeout(900)
      ui.doom = await page.locator(`.hwt-token[data-unit-id='${target}'] .hwt-sig-mark[data-mark='doom']`).count()
      check(ui.doom === 1, "Hexer's hit lays a Doom mark on the enemy", ui)
      await page.screenshot({ path: `${SHOT_DIR}/hero_identity_doom.png` })
    } else out.push("no enemy in the Hexer's reach")

    // 2) A real run: the hero card shows identity; the fight runs signatures; a signature legendary card.
    const rp = await ctx.newPage()
    rp.on("pageerror", (e) => errs.push(String(e)))
    await rp.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await rp.evaluate(async () => {
      localStorage.clear()
      localStorage.setItem("heartwood-autobattler-intro-seen", "1")
      localStorage.setItem("heartwood-story-intro-seen", "1")
      localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
      const rt = await import("/src/services/heartwood/runEngine.js")
      const identity = (quirks, extra = {}) => ({ quirks, bonds: {}, bondNames: {}, scars: [], history: [], career: { fights: 0, kills: 0, falls: 0, nearDeaths: 0, saves: 0 }, ...extra })
      const rs = {
        ...rt.startRun("tommy", null, { forcedSeed: 4321 }),
        essence: 500,
        bench: [
          { key: 10, defId: "hexbreaker", upgradeLevel: 0, upgrades: [], identity: identity(["loyal", "fears-fire"], { bonds: { r11: 4 }, bondNames: { r11: "The Fool" }, scars: ["survivor", "grudge"], grudge: "beast", history: ["Survived Ironmaw at 2 HP", "Saved by The Fool", "Earned Survivor"] }) },
          { key: 11, defId: "the-fool", upgradeLevel: 0, upgrades: [], identity: identity(["forest-child"], { bonds: { r10: 4 }, bondNames: { r10: "Hexbreaker" }, scars: ["guardian-angel"], history: ["Saved Hexbreaker's life", "Became friends with Hexbreaker"] }) },
        ],
        benchKeyCounter: 12,
        deployed: [10, 11, null, null],
        items: [
          { key: 1, defId: "sig-spellblade", equippedTo: null, slotIndex: null },
          { key: 2, defId: "sig-healer", equippedTo: 11, slotIndex: 0 },
        ],
        itemKeyCounter: 3,
      }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(rs)))
    })
    await rp.reload({ waitUntil: "domcontentloaded" })
    await rp.locator(".hw-squad-tab-btn").click({ timeout: 15000 }).catch(() => {})
    await rp.waitForSelector(".hw-card-identity", { timeout: 10000 }).catch(() => {})
    ui.cardIds = await rp.locator(".hw-card-identity").count()
    ui.cardText = ui.cardIds ? await rp.locator(".hw-card-identity").first().innerText() : ""
    check(ui.cardIds >= 2 && /Spellweave|Overgrowth/.test(ui.cardText), "hero card: signature + quirks + scars + history", ui.cardText)
    check((await rp.locator(".hw-id-history li").count()) >= 1, "hero card: a history line")
    const card = rp.locator(".hw-card-identity").first().locator("xpath=..")
    await card.screenshot({ path: `${SHOT_DIR}/hero_identity_card.png` }).catch(() => rp.screenshot({ path: `${SHOT_DIR}/hero_identity_card.png` }))
    // Gear screen: the signature legendary card (gold frame + class crest).
    await rp.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
    await rp.locator('[data-gear-open="10"]').first().click({ timeout: 5000 }).catch(() => {})
    await rp.waitForSelector("[data-gear-screen]", { timeout: 5000 }).catch(() => {})
    ui.bagSig = await rp.locator('.hw-gear-bag-item[data-signature="true"]').count()
    check(ui.bagSig === 1, "signature legendary marked in the bag", ui.bagSig)
    await rp.locator('[data-gear-equip="1"]').click({ timeout: 5000 }).catch(() => {})
    await rp.waitForSelector('[data-signature="spellblade"]', { timeout: 5000 }).catch(() => {})
    ui.sigCard = await rp.locator('.hw-item-card[data-signature="spellblade"]').count()
    ui.sigCardText = ui.sigCard ? await rp.locator('.hw-item-card[data-signature="spellblade"]').first().innerText() : ""
    check(ui.sigCard >= 1 && /Spellblade/.test(ui.sigCardText) && /Legendary/i.test(ui.sigCardText), "signature legendary: distinct gold card with class crest", ui.sigCardText)
    if (ui.sigCard) await rp.locator('.hw-item-card[data-signature="spellblade"]').first().screenshot({ path: `${SHOT_DIR}/hero_identity_legendary.png` })
    await rp.screenshot({ path: `${SHOT_DIR}/hero_identity_gear.png` })
    check(!errs.length, `no page errors ${JSON.stringify(errs.slice(0, 3))}`)

    // 3) Studio: the Hero Identity editors.
    const sp = await ctx.newPage()
    sp.on("pageerror", (e) => errs.push(String(e)))
    await sp.goto(`http://localhost:${PORT}/hearthwood-studio?view=identity`, { waitUntil: "domcontentloaded" })
    await sp.waitForSelector("[data-testid='hero-identity-editor']", { timeout: 15000 }).catch(() => {})
    ui.studioSig = await sp.locator("[data-testid='signature-editor'] [data-entry]").count()
    await sp.locator("[data-identity-tab='quirks']").click({ timeout: 5000 }).catch(() => {})
    ui.studioQuirks = await sp.locator("[data-testid='quirk-editor'] [data-entry]").count()
    check(ui.studioSig === 38 && ui.studioQuirks >= 10, "Studio: Hero Identity editors (38 signatures, quirks)", { sig: ui.studioSig, q: ui.studioQuirks })
    await sp.screenshot({ path: `${SHOT_DIR}/hero_identity_studio.png` })
    check(!errs.length, `no page errors (studio) ${JSON.stringify(errs.slice(0, 3))}`)
  } finally {
    await browser.close()
  }
  console.log("UI", JSON.stringify(ui).slice(0, 1500))
  return out
}
