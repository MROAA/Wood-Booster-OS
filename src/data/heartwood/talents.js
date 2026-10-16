// Hearthwood - DOTA DEPTH 2: the TALENT TREE (Dota 2 style).
// At hero Level 2 and Level 4 the level-up choice IS a talent pick: the
// hero takes ONE of two talents for that row (left or right) - for good.
// Lv3 / Lv5 stay the skill-branch-or-perk pick (+ the promotion ceremony),
// so there is never more than one level-up card screen per level.
// Talents change HOW a hero plays (a 2nd charge, a shorter recharge, a
// skill that suddenly hits an area, cheaper casts, mana that comes back),
// and many of them feed the class resource - mana is the core fun system.
//
// Pure data - Studio-editable (Hearthwood Studio > ✦ Talents). Rules live
// in services/heartwood/tacticsTalents.js (applying them in a fight) and
// services/heartwood/unitLevels.js (offering + picking them).
//
// Every class gets a tree built from its GROUP's template (frontline,
// damage, control, support, summoning, specialist), filled in with its own
// skills, plus ONE hand-written class twist (CLASS_TWISTS) on a row.
//
// Talent fields: id, name, icon, text (plain English), fx:
//   sk          index of the class skill the skill-changes below touch
//   cd          recharge change (-1 = one turn sooner)
//   manaCut     % cheaper in the class resource
//   ap          AP cost change (-1)
//   range       +range (numeric-range skills)
//   radius      +radius (skills with an area)
//   charges     2 = cast it twice before it recharges
//   skillFx     a rider after the skill (the classes.js skill-tree `fx` keys:
//               t / splash / self / aura / near / tile / kill)
//   unit-wide:  hp, attack, move, ward, headAp,
//               manaPool (+max AND current, a 100-bar amount),
//               regen (+resource each turn, 100-bar), cheaper (% all skills),
//               castMana (resource back per class-skill cast, 100-bar),
//               hitMana / killMana (resource per basic hit / kill),
//               manaShield (% of damage taken paid from the resource),
//               firstFree (the first class skill each fight costs nothing),
//               killHeal (HP back per kill),
//               mods ([{ when, dmg | aim | heal | guard | skillPct }], see traits.js)

import { CLASSES } from "./classes"
import { RESOURCES, CLASS_RESOURCE_DEFAULT } from "./resources"

// The hero levels that open a talent row (index + 1 = the row / tier).
export const TALENT_LEVELS = [2, 4]

const resName = (cls) => RESOURCES[cls?.resource || CLASS_RESOURCE_DEFAULT[cls?.id]]?.name || "Mana"

// --- builders: one talent from a class + a skill index ------------------------

const sk = (cls, i) => cls.skills[i] || cls.skills[0]
const B = {
  charge: (cls, i) => ({ key: "charge", name: "Second Charge", icon: "⟳", text: `${sk(cls, i).name}: 2 charges - cast it twice before it recharges.`, fx: { sk: i, charges: 2 } }),
  cd: (cls, i) =>
    (sk(cls, i).cooldown || 0) > 1
      ? { key: "cd", name: "Quickened", icon: "⌛", text: `${sk(cls, i).name}: recharges 1 turn sooner.`, fx: { sk: i, cd: -1 } }
      : B.manaCut(cls, i, 40),
  manaCut: (cls, i, pct = 35) =>
    (sk(cls, i).mana || 0) > 0
      ? { key: "manacut", name: "Lean Casting", icon: "✧", text: `${sk(cls, i).name}: costs ${pct}% less ${resName(cls)}.`, fx: { sk: i, manaCut: pct } }
      : B.castMana(cls, 8),
  reach: (cls, i) => {
    const s = sk(cls, i)
    if (typeof s.range === "number") return { key: "reach", name: "Long Reach", icon: "➶", text: `${s.name}: +1 range.`, fx: { sk: i, range: 1 } }
    if (typeof s.radius === "number") return { key: "reach", name: "Wide Reach", icon: "◎", text: `${s.name}: +1 radius.`, fx: { sk: i, radius: 1 } }
    return B.cd(cls, i)
  },
  area: (cls, i) => {
    const s = sk(cls, i)
    if (s.target === "enemy") return { key: "area", name: "Splintering", icon: "✶", text: `${s.name}: also hits every foe next to the target for 2 (area).`, fx: { sk: i, skillFx: { splash: { dmg: 2 } } } }
    if (s.target === "ally") return { key: "area", name: "Shared Gift", icon: "❂", text: `${s.name}: allies next to the hero also heal 2 and get +1 Block.`, fx: { sk: i, skillFx: { aura: { radius: 1, heal: 2, block: 1 } } } }
    if (s.target === "tile") return { key: "area", name: "Shockwave", icon: "✶", text: `${s.name}: foes on and around the tile take 2 more.`, fx: { sk: i, skillFx: { tile: { dmg: 2 } } } }
    return { key: "area", name: "Shockwave", icon: "✶", text: `${s.name}: also hits every foe next to the hero for 2.`, fx: { sk: i, skillFx: { near: { radius: 1, dmg: 2 } } } }
  },
  killAp: (cls, i) => ({ key: "killap", name: "Momentum", icon: "⚡", text: `${sk(cls, i).name}: a kill with it gives +1 AP.`, fx: { sk: i, skillFx: { kill: { ap: 1 } } } }),
  slowRider: (cls, i) =>
    sk(cls, i).target === "enemy"
      ? { key: "slow", name: "Clinging Frost", icon: "❄", text: `${sk(cls, i).name}: also Slows its target and every foe next to it.`, fx: { sk: i, skillFx: { t: { slow: true }, splash: { slow: true } } } }
      : B.area(cls, i),
  castMana: (cls, n = 8) => ({ key: "castmana", name: "Wellspring Echo", icon: "☾", text: `Every class skill cast gives back ${n} ${resName(cls)} (a 100-bar amount).`, fx: { castMana: n } }),
  shield: (cls, pct = 25) => ({ key: "shield", name: "Mana Shield", icon: "⬡", text: `${pct}% of the damage it takes is paid from its ${resName(cls)} instead of HP.`, fx: { manaShield: pct } }),
  pool: (cls, n = 20) => ({ key: "pool", name: "Deep Well", icon: "◍", text: `+${n} max ${resName(cls)}, and it starts that much fuller.`, fx: { manaPool: n } }),
  regen: (cls, n = 6) => ({ key: "regen", name: "Ley Spring", icon: "≋", text: `+${n} ${resName(cls)} at the start of every turn.`, fx: { regen: n } }),
  hitMana: (cls, n = 6) => ({ key: "hitmana", name: "Sap Thief", icon: "✺", text: `Every basic hit it lands gives ${n} ${resName(cls)}.`, fx: { hitMana: n } }),
  killMana: (cls, n = 25) => ({ key: "killmana", name: "Soul Tithe", icon: "☠", text: `Every kill gives ${n} ${resName(cls)}.`, fx: { killMana: n } }),
  firstFree: (cls) => ({ key: "firstfree", name: "Opening Gambit", icon: "✦", text: `The first class skill it casts each fight costs no ${resName(cls)}.`, fx: { firstFree: true } }),
  brim: (cls) => ({ key: "brim", name: "Brimming", icon: "☀", text: `While its ${resName(cls)} is 75%+ full: +2 damage and +10% to hit.`, fx: { mods: [{ when: "res75", dmg: 2, aim: 10, label: "Brimming" }] } }),
  cheaper: (cls, n = 15) => ({ key: "cheaper", name: "Thrift", icon: "⚖", text: `Every skill costs ${n}% less ${resName(cls)}.`, fx: { cheaper: n } }),
}

// Group template: [row 1 (Lv2): [left, right], row 2 (Lv4): [left, right]].
// Each slot is a builder call on the class (skill 0 / skill 1).
export const GROUP_TEMPLATES = {
  frontline: [
    [(c) => B.shield(c, 25), (c) => B.cd(c, 0)],
    [(c) => B.charge(c, 1), (c) => B.area(c, 1)],
  ],
  damage: [
    [(c) => B.hitMana(c, 6), (c) => B.reach(c, 0)],
    [(c) => B.charge(c, 0), (c) => B.killAp(c, 1)],
  ],
  control: [
    [(c) => B.manaCut(c, 0, 35), (c) => B.reach(c, 1)],
    [(c) => B.charge(c, 1), (c) => B.slowRider(c, 0)],
  ],
  support: [
    [(c) => B.castMana(c, 8), (c) => B.cd(c, 0)],
    [(c) => B.charge(c, 0), (c) => B.area(c, 1)],
  ],
  summoning: [
    [(c) => B.pool(c, 20), (c) => B.firstFree(c)],
    [(c) => B.cd(c, 1), (c) => B.charge(c, 0)],
  ],
  specialist: [
    [(c) => B.regen(c, 6), (c) => B.reach(c, 0)],
    [(c) => B.charge(c, 1), (c) => B.brim(c)],
  ],
}

// One hand-made talent per class, replacing a template slot:
// [row (1|2), side ("L"|"R"), talent]. Generic fx keys only.
export const CLASS_TWISTS = {
  guardian: [2, "R", { name: "Oath of the Wall", icon: "⛨", text: "Bodyguard: the guarded ally also gets +2 Block, and it recharges 1 turn sooner.", fx: { sk: 0, cd: -1, skillFx: { t: { block: 2 } } } }],
  warden: [1, "R", { name: "Living Bastion", icon: "⛫", text: "Bastion: free (0 AP) - stance up and still act.", fx: { sk: 2, ap: -1 } }],
  juggernaut: [2, "R", { name: "Unstoppable", icon: "➠", text: "Charge: +2 range, and a kill with it gives +1 AP.", fx: { sk: 0, range: 2, skillFx: { kill: { ap: 1 } } } }],
  sentinel: [2, "R", { name: "Steady Breath", icon: "◎", text: "Sniper's Watch costs no Focus, and while Focus is 75%+ it hits +2.", fx: { sk: 0, manaCut: 100, mods: [{ when: "res75", dmg: 2, label: "Steady Breath" }] } }],
  bruiser: [1, "R", { name: "Red Rush", icon: "♨", text: "Every basic hit it lands gives 10 Rage.", fx: { hitMana: 10 } }],
  striker: [2, "R", { name: "Flurry", icon: "⚔", text: "Double Strike: 2 charges, and each hit also Exposes the target.", fx: { sk: 0, charges: 2, skillFx: { t: { expose: 1 } } } }],
  assassin: [1, "R", { name: "Night Feeder", icon: "☾", text: "Every kill gives 30 Shadow and heals 3.", fx: { killMana: 30, killHeal: 3 } }],
  duelist: [2, "R", { name: "Riposte Dance", icon: "⚔", text: "Lunge: recharges 1 sooner and a kill with it gives +1 AP.", fx: { sk: 2, cd: -1, skillFx: { kill: { ap: 1 } } } }],
  ranger: [2, "R", { name: "Volley Sense", icon: "➶", text: "Hunter's Mark: also marks every foe next to the target.", fx: { sk: 0, skillFx: { splash: { mark: 2 } } } }],
  artillery: [1, "R", { name: "Wide Bore", icon: "✶", text: "Suppression Fire: +1 range, and the foes next to the target are Slowed.", fx: { sk: 1, range: 1, skillFx: { splash: { slow: true } } } }],
  executioner: [2, "R", { name: "Headsman's Due", icon: "☠", text: "Every kill gives 35 Fury.", fx: { killMana: 35 } }],
  spellblade: [1, "L", { name: "Arcane Siphon", icon: "✦", text: "Every basic hit it lands gives 8 Mana - spellblades cast off their sword.", fx: { hitMana: 8 } }],
  healer: [2, "R", { name: "Bloom Cascade", icon: "❦", text: "Lingering Bloom: 2 charges.", fx: { sk: 1, charges: 2 } }],
  medic: [1, "R", { name: "Triage Kit", icon: "✚", text: "Cleanse: recharges 1 sooner and also heals 3.", fx: { sk: 1, cd: -1, skillFx: { t: { heal: 3 } } } }],
  buffer: [2, "R", { name: "Encore", icon: "♫", text: "Empower: 2 charges.", fx: { sk: 0, charges: 2 } }],
  commander: [2, "R", { name: "Battle Rhythm", icon: "⚑", text: "Tactical Order costs 50% less Inspiration and gives back 10 per cast.", fx: { sk: 0, manaCut: 50, castMana: 10 } }],
  tactician: [1, "R", { name: "Read the Field", icon: "⊕", text: "Reveal Weakness: +1 range and recharges 1 sooner.", fx: { sk: 0, range: 1, cd: -1 } }],
  controller: [2, "R", { name: "Hush Field", icon: "⊘", text: "Silence: also Silences every foe next to the target.", fx: { sk: 0, skillFx: { splash: { silence: 1 } } } }],
  frostbinder: [2, "R", { name: "Deep Winter", icon: "❄", text: "Frost Bolt: 2 charges, and it Chills the foes next to the target.", fx: { sk: 0, charges: 2, skillFx: { splash: { chill: 1 } } } }],
  rootweaver: [1, "R", { name: "Grasping Web", icon: "❦", text: "Root Snare: also roots every foe next to the target.", fx: { sk: 0, skillFx: { splash: { root: true } } } }],
  disruptor: [2, "R", { name: "Static Bloom", icon: "⚡", text: "Static Disruption: costs no Mana and recharges 1 sooner.", fx: { sk: 2, manaCut: 100, cd: -1 } }],
  trapper: [1, "R", { name: "Spring Loaded", icon: "⚙", text: "Thorn Trap: 2 charges.", fx: { sk: 2, charges: 2 } }],
  hexer: [2, "R", { name: "Spreading Rot", icon: "⛧", text: "Vulnerability: also Curses every foe next to the target.", fx: { sk: 0, skillFx: { splash: { curse: 2 } } } }],
  summoner: [2, "R", { name: "Spirit Wellspring", icon: "✺", text: "+8 Spirit at the start of every turn, and Summon Spirit recharges 1 sooner.", fx: { sk: 0, cd: -1, regen: 8 } }],
  beastmaster: [2, "R", { name: "Pack Bond", icon: "🐾", text: "Hunt: 2 charges.", fx: { sk: 1, charges: 2 } }],
  alchemist: [1, "R", { name: "Double Batch", icon: "⚗", text: "Poison Flask: 2 charges.", fx: { sk: 0, charges: 2 } }],
  scout: [1, "R", { name: "Far Eyes", icon: "◉", text: "Mark Threat: +2 range.", fx: { sk: 0, range: 2 } }],
  saboteur: [2, "R", { name: "Chain Fuse", icon: "✹", text: "Explosive Charge: recharges 1 sooner.", fx: { sk: 1, cd: -1 } }],
  engineer: [2, "R", { name: "Spare Parts", icon: "⚙", text: "Build Barricade: 2 charges.", fx: { sk: 1, charges: 2 } }],
  spiritwalker: [1, "R", { name: "Ley Stride", icon: "✺", text: "Spirit Step costs no Spirit.", fx: { sk: 0, manaCut: 100 } }],
  ritualist: [2, "R", { name: "Soul Harvest", icon: "☠", text: "Every kill gives 30 Souls, and Spirit Offering recharges 1 sooner.", fx: { sk: 2, cd: -1, killMana: 30 } }],
  chronomancer: [2, "R", { name: "Borrowed Hour", icon: "⌛", text: "Haste Time: 2 charges.", fx: { sk: 0, charges: 2 } }],
  shapeshifter: [1, "R", { name: "Wild Heart", icon: "❦", text: "Every shift gives back 10 Nature - shapeshift freely.", fx: { castMana: 10 } }],
  corruptor: [2, "R", { name: "Contagion", icon: "☣", text: "Spread Corruption: 2 charges.", fx: { sk: 2, charges: 2 } }],
  merchant: [1, "R", { name: "Bulk Discount", icon: "⚖", text: "Every skill costs 25% less Inspiration.", fx: { cheaper: 25 } }],
  "relic-keeper": [2, "R", { name: "Relic Resonance", icon: "✦", text: "+20 max Mana, and every cast gives back 6.", fx: { manaPool: 20, castMana: 6 } }],
  cleanser: [2, "R", { name: "Purity Echo", icon: "✧", text: "Purge: 2 charges.", fx: { sk: 0, charges: 2 } }],
  gatherer: [1, "R", { name: "Forager's Luck", icon: "❦", text: "Every kill gives 20 Nature and Scavenge recharges 1 sooner.", fx: { sk: 0, cd: -1, killMana: 20 } }],
}

// The talent tree of a class: [{ tier, level, L, R }] - L/R are talents
// with a stable id "<classId>:<tier><L|R>".
const cache = new Map()
export function talentTreeFor(classId) {
  if (cache.has(classId)) return cache.get(classId)
  const cls = CLASSES[classId]
  if (!cls) return []
  const tpl = GROUP_TEMPLATES[cls.group] || GROUP_TEMPLATES.specialist
  const twist = CLASS_TWISTS[classId]
  const tree = TALENT_LEVELS.map((level, i) => {
    const tier = i + 1
    const row = { tier, level }
    for (const [j, side] of ["L", "R"].entries()) {
      const custom = twist && twist[0] === tier && twist[1] === side ? { key: "twist", ...twist[2], twist: true } : null
      const t = custom || tpl[i][j](cls)
      const fx = { ...(t.fx || {}) }
      for (const k of Object.keys(fx)) if (fx[k] == null || (Array.isArray(fx[k]) && !fx[k].length)) delete fx[k]
      row[side] = { ...t, fx, id: `${classId}:${tier}${side}`, classId, tier, side }
    }
    return row
  })
  cache.set(classId, tree)
  return tree
}

// One talent by id ("guardian:2R") or null.
export function talentById(id) {
  const m = /^(.+):(\d)([LR])$/.exec(id || "")
  if (!m) return null
  return talentTreeFor(m[1]).find((r) => r.tier === Number(m[2]))?.[m[3]] || null
}

// Studio: the cache is rebuilt after an edit.
export function clearTalentCache() {
  cache.clear()
}
