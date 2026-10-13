// Hearthwood Frontier - the DifficultyEngine (Progressive Challenge PRD
// §4-§36, §41). Marc: "the fights are too easy". One number per fight -
// the Difficulty Score (Act + how deep into the Act + elite/boss) - picks
// a THREAT TIER T0..T5, and the tier scales the fight on top of the run's
// own HP/damage ramp (runEngine difficultyFactorForNode):
//   - enemy HP and damage            (base power, PRD layer 1)
//   - extra enemies, built as a      (encounter complexity, layer 2,
//     frontline + backline + support   PRD §13 "Tank + DPS + Support")
//   - enemy skills: faster / stronger (counterplay, layer 4)
//   - the AI's INTELLIGENCE tier     (enemy intelligence, layer 3, §14)
//   - enemy mana ULTIMATES           (boss pressure, layer 7 -
//                                     tacticsUltimates.js)
//   - contested Mana Wells           (environment, layer 5)
// Act I stays gentle (T0-T1: no extra enemies, no ultimates); later Acts
// demand real planning. Everything is visible: the board shows the tier,
// what scaled, and what the enemy now does (PRD §41 transparency).
//
// Pure, state in -> state out, deterministic (a fight's seed key picks
// the escorts and the wells). Engine helpers are imported back from
// tacticsEngine.js (circular, call-time only - the tacticsMana pattern).
import { ENEMIES, ACT_ENEMIES } from "../../data/heartwood/enemies"
import { deriveTacticsUnit } from "./tacticsEngine"
import { roleOf, BATTLE_ROLES } from "./tacticsRoles"
import { enemySkillsFor } from "./tacticsEnemyAbilities"
import { TERRAIN } from "./tacticsTerrain"
import { assignUltimates } from "./tacticsUltimates"
import { behaviorOf } from "./tacticsSmartAi"

// --- Score -> tier ------------------------------------------------------------------

// ===== THE ONE TUNING TABLE ==================================================
// Marc: Hearthwood is a ~20-hour, XCOM-like campaign, not a short run - so
// the threat ramps GRADUALLY and CONTINUOUSLY across all 7 Acts: a fight's
// score is its Act's base score plus how deep into the Act it sits
// (depth 0 -> 1 slides linearly to the NEXT Act's base, so there is no
// cliff between Acts), plus a bonus for elites/bosses. Every number below
// is a placeholder for playtesting (PRD §6) - retune HERE, nothing else
// in the code needs to change.
//   actScore  - score at the start of each Act (index 8 = the very end)
//   kindBonus - added for an elite / miniboss / boss fight
//   tiers     - min score + what each tier does to the fight:
//     hp       enemy HP multiplier (on top of the run's own ramp)
//     atk      + enemy attack
//     extra    extra enemies [normal fight, elite fight]
//     ai       intelligence tier (AI_TRAITS below)
//     ult      who gets a mana ultimate (boss/miniboss/elite + one
//              "caster" entry per caster)
//     wells    Mana Wells on the board
//     skillCd  enemy skill cooldowns shorter by this
//     skillAmp enemy skill numbers x this
//     ultStart ultimate bar at the start of the fight (%)
//     ultGain  ultimate bar gained per enemy turn
export const DIFFICULTY_CURVE = {
  actScore: { 1: 0, 2: 14, 3: 28, 4: 42, 5: 57, 6: 72, 7: 86, 8: 100 },
  kindBonus: { battle: 0, elite: 10, miniboss: 12, boss: 15 },
  tiers: [
    { tier: 0, id: "T0", name: "Introduction", min: 0, hp: 1, atk: 0, extra: [0, 0], ai: 0, ult: [], wells: 0, skillCd: 0, skillAmp: 1, ultStart: 0, ultGain: 0 },
    { tier: 1, id: "T1", name: "Learning", min: 10, hp: 1.05, atk: 0, extra: [0, 0], ai: 1, ult: ["boss"], wells: 1, skillCd: 0, skillAmp: 1, ultStart: 0, ultGain: 20 },
    { tier: 2, id: "T2", name: "Developing", min: 25, hp: 1.1, atk: 1, extra: [1, 0], ai: 2, ult: ["boss", "miniboss", "elite"], wells: 2, skillCd: 0, skillAmp: 1, ultStart: 0, ultGain: 20 },
    { tier: 3, id: "T3", name: "Advanced", min: 42, hp: 1.15, atk: 1, extra: [1, 1], ai: 3, ult: ["boss", "miniboss", "elite", "caster"], wells: 2, skillCd: 1, skillAmp: 1, ultStart: 0, ultGain: 25 },
    { tier: 4, id: "T4", name: "Elite", min: 60, hp: 1.25, atk: 2, extra: [2, 1], ai: 4, ult: ["boss", "miniboss", "elite", "caster", "caster"], wells: 2, skillCd: 1, skillAmp: 1.25, ultStart: 0, ultGain: 25 },
    { tier: 5, id: "T5", name: "Mastery", min: 80, hp: 1.35, atk: 2, extra: [2, 1], ai: 5, ult: ["boss", "miniboss", "elite", "caster", "caster"], wells: 2, skillCd: 1, skillAmp: 1.25, ultStart: 30, ultGain: 30 },
  ],
}
export const THREAT_TIERS = DIFFICULTY_CURVE.tiers

// What the enemy AI does at each intelligence tier (PRD §14 levels 1-5).
// Shown on the board so the player knows what they're up against.
export const AI_TRAITS = [
  { id: "focus", tier: 1, icon: "◎", label: "Focus fire on wounded heroes" },
  { id: "retreat", tier: 2, icon: "↩", label: "Badly hurt enemies fall back" },
  { id: "cover", tier: 2, icon: "⛨", label: "Take cover from your shooters" },
  { id: "flank", tier: 3, icon: "↪", label: "Go around your tanks" },
  { id: "protect", tier: 3, icon: "✚", label: "Guard their healers and casters" },
  { id: "spread", tier: 3, icon: "⁘", label: "Spread out against area attacks" },
  { id: "ambush", tier: 4, icon: "👁", label: "Lie in ambush" },
]

// Most enemies a tier can bring to one board.
export const MAX_ENEMIES = 6

export function difficultyScore({ act = 1, kind = "battle", depth = 0 } = {}) {
  const { actScore, kindBonus } = DIFFICULTY_CURVE
  const a = Math.max(1, Math.min(7, act || 1))
  const d = Math.max(0, Math.min(1, depth || 0))
  const from = actScore[a] || 0
  const to = actScore[a + 1] ?? from
  return Math.round(from + d * (to - from) + (kindBonus[kind] || 0))
}

export function tierForScore(score) {
  let row = THREAT_TIERS[0]
  for (const t of THREAT_TIERS) if (score >= t.min) row = t
  return row
}

// The full spec for one fight. `tier` forces a tier (QA / the prototype).
export function difficultySpec({ act = 1, kind = "battle", depth = 0, factor = 1, seedKey = "", tier = null } = {}) {
  const score = tier != null ? THREAT_TIERS[Math.max(0, Math.min(5, tier))].min : difficultyScore({ act, kind, depth })
  const row = tier != null ? THREAT_TIERS[Math.max(0, Math.min(5, tier))] : tierForScore(score)
  return { act, kind, depth: Math.round((depth || 0) * 100) / 100, factor, seedKey: String(seedKey), score, ...row }
}

// --- Small deterministic helpers ------------------------------------------------------

function hashOf(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const keyOf = (p) => `${p.row}-${p.col}`

function tileOpen(state, pos, taken) {
  if (pos.row < 0 || pos.col < 0 || pos.row >= state.grid.rows || pos.col >= state.grid.cols) return false
  if (taken.has(keyOf(pos))) return false
  const t = TERRAIN[(state.terrain || {})[keyOf(pos)] || "path"] || TERRAIN.path
  return t.cost !== Infinity && !t.grantPoison && !t.burn && !t.slide
}

// Frontline / backline / support - the composition word for a role.
export function lineOf(unit) {
  const role = roleOf(unit)
  if (role === "healer" || role === "support" || role === "control") return "support"
  if (role === "tank" || (unit.range || 1) <= 1) return "frontline"
  return "backline"
}
export const LINE_INFO = {
  frontline: { label: "Frontline", icon: "⛨" },
  backline: { label: "Backline", icon: "➶" },
  support: { label: "Support", icon: "✚" },
}

// --- Escorts: extra enemies that complete a frontline + backline + support ---------

// Most Act pools are melee-only, so shooters and menders from this Act or
// earlier can join as a backline / support escort too.
export const ESCORT_EXTRAS = ["drift-archer", "coven-matron", "blight-seer", "echo-archer", "rotbore-grub", "bramblehide", "dawn-zealot", "plaguebearer", "mossmender", "brood-tender"]

// Every solo-battle-eligible enemy of the Act (+ extras), with its line.
function escortPool(act) {
  const extras = ESCORT_EXTRAS.filter((id) => ENEMIES[id] && (ENEMIES[id].act || 1) <= act)
  const ids = [...new Set([...(ACT_ENEMIES[act] || ACT_ENEMIES[1] || []), ...extras])]
  return ids
    .filter((id) => ENEMIES[id] && !ENEMIES[id].summonOnly)
    .map((id) => {
      const probe = deriveTacticsUnit(id, "enemy", { row: 0, col: 0 }, `probe-${id}`)
      return { id, line: lineOf(probe), role: roleOf(probe) }
    })
}

// What the composition is missing, in the order it gets filled.
function wantedLines(enemies, count) {
  const have = { frontline: 0, backline: 0, support: 0 }
  for (const u of enemies) have[lineOf(u)]++
  const out = []
  for (let i = 0; i < count; i++) {
    const next = ["frontline", "support", "backline"].find((l) => have[l] === 0) || ["backline", "frontline", "support"][i % 3]
    out.push(next)
    have[next]++
  }
  return out
}

// Where an escort stands: frontline in the column nearest the heroes,
// backline/support behind - rows closest to the middle first.
function escortTile(state, line, taken) {
  const cols = line === "frontline" ? [2, 1, 0] : [0, 1, 2]
  const mid = Math.floor(state.grid.rows / 2)
  const rows = Array.from({ length: state.grid.rows }, (_, r) => r).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b)
  for (const col of cols) for (const row of rows) if (tileOpen(state, { row, col }, taken)) return { row, col }
  return null
}

function addEscorts(state, spec, count) {
  if (!(count > 0)) return state
  const enemies = state.units.filter((u) => u.side === "enemy" && u.hp > 0 && !u.structure)
  const room = Math.max(0, MAX_ENEMIES - enemies.length)
  const n = Math.min(count, room)
  if (!n) return state
  const pool = escortPool(spec.act)
  if (!pool.length) return state
  const taken = new Set(state.units.filter((u) => u.hp > 0).map((u) => keyOf(u.pos)))
  let index = state.units.filter((u) => u.side === "enemy").length
  const added = []
  wantedLines(enemies, n).forEach((line, i) => {
    const fits = pool.filter((p) => p.line === line)
    const list = fits.length ? fits : pool
    const pick = list[hashOf(`${spec.seedKey}:escort:${i}`) % list.length]
    const pos = escortTile(state, line, taken)
    if (!pos) return
    taken.add(keyOf(pos))
    const base = deriveTacticsUnit(pick.id, "enemy", pos, `enemy-${pick.id}-${index++}`)
    const f = spec.factor || 1
    const maxHp = Math.max(1, Math.round(base.maxHp * f))
    const attack = base.attack > 0 ? Math.round(base.attack * f) : base.attack
    added.push({ ...base, hp: maxHp, maxHp, attack, baseAttack: attack, escort: lineOf(base), facing: "E" })
  })
  return added.length ? { ...state, units: [...state.units, ...added] } : state
}

// --- Stats + skills -----------------------------------------------------------------------

function scaleEnemy(u, spec) {
  if (u.side !== "enemy" || u.structure || u.npc) return u
  const maxHp = Math.max(1, Math.round(u.maxHp * spec.hp))
  const hp = Math.max(1, Math.round(u.hp * spec.hp))
  const attack = u.attack > 0 ? u.attack + spec.atk : u.attack
  const patch = { maxHp, hp, attack, baseAttack: (u.baseAttack ?? u.attack) + (u.attack > 0 ? spec.atk : 0), threatScaled: { hp: spec.hp, atk: spec.atk } }
  if (spec.skillCd > 0 || spec.skillAmp !== 1) {
    const skills = enemySkillsFor(u)
    if (skills.length) {
      patch.enemySkills = skills.map((s) => ({
        ...s,
        cooldown: s.kind === "enrage" ? s.cooldown : Math.max(1, (s.cooldown || 1) - spec.skillCd),
        ...(typeof s.amount === "number" && spec.skillAmp !== 1 ? { amount: Math.max(1, Math.round(s.amount * spec.skillAmp)) } : {}),
      }))
    }
  }
  return { ...u, ...patch }
}

// --- Mana Wells ------------------------------------------------------------------------------

// Contested tiles in the middle of the board: whoever ends near... no -
// whoever STANDS on one at the start of its turn draws extra resource
// (tacticsMana sideTurnRegen); an enemy charging an ultimate charges faster.
export function placeWells(state, count, seedKey = "") {
  if (!(count > 0)) return state
  const terrain = { ...(state.terrain || {}) }
  const taken = new Set(state.units.filter((u) => u.hp > 0).map((u) => keyOf(u.pos)))
  const rows = state.grid.rows
  const mid = Math.floor(state.grid.cols / 2)
  // Candidate tiles: the two middle columns, plain ground only.
  const cands = []
  for (let row = 1; row < rows - 1; row++) {
    for (const col of [mid - 1, mid]) {
      const k = `${row}-${col}`
      if (terrain[k] && terrain[k] !== "forest" && terrain[k] !== "path") continue
      if (taken.has(k)) continue
      cands.push({ row, col })
    }
  }
  if (!cands.length) return state
  const placed = []
  let i = 0
  let guard = 0
  while (placed.length < count && guard++ < 40) {
    const c = cands[hashOf(`${seedKey}:well:${i++}`) % cands.length]
    if (placed.some((p) => cheb(p, c) < 3)) continue
    placed.push(c)
  }
  for (const p of placed) terrain[keyOf(p)] = "manawell"
  return { ...state, terrain }
}

// --- Apply -------------------------------------------------------------------------------------

// One call per fight (real runs: tacticsRealMatchup.buildRunTacticsBattle;
// the prototype: ?threat=N). Run BEFORE enableMana so escorts get a bar.
export function applyDifficulty(state, spec) {
  if (!state?.units || !spec) return state
  const isEliteFight = spec.kind === "elite" || spec.kind === "miniboss" || spec.kind === "boss"
  // Boss arenas bring their own adds; escorts join normal fights + elites.
  const extra = state.boss || spec.kind === "boss" || spec.kind === "miniboss" ? 0 : spec.extra[isEliteFight ? 1 : 0]
  let next = addEscorts(state, spec, extra)
  next = { ...next, units: next.units.map((u) => scaleEnemy(u, spec)) }
  next = placeWells(next, spec.wells, spec.seedKey)
  next = assignUltimates(next, spec)
  // Behaviour profiles (Berserker, Assassin, Guardian...) fixed per fight.
  const withProfiles = next
  next = { ...next, units: next.units.map((u) => (u.side === "enemy" && !u.structure && !u.npc ? { ...u, behavior: behaviorOf(u, withProfiles) } : u)) }
  const escorts = next.units.filter((u) => u.escort).length
  return {
    ...next,
    difficulty: {
      tier: spec.tier,
      id: spec.id,
      name: spec.name,
      score: spec.score,
      act: spec.act,
      kind: spec.kind,
      depth: spec.depth,
      ai: spec.ai,
      hp: spec.hp,
      atk: spec.atk,
      escorts,
      wells: spec.wells,
      skillCd: spec.skillCd,
      skillAmp: spec.skillAmp,
    },
    log: [...(next.log || []), `Threat ${spec.id} - ${spec.name}.${escorts ? ` ${escorts} more enem${escorts === 1 ? "y joins" : "ies join"} the fight.` : ""}`],
  }
}

// --- Reads (AI + UI) ----------------------------------------------------------------------------

export function aiTier(state) {
  return state?.difficulty?.ai || 0
}

export function hasAiTrait(state, id) {
  const t = AI_TRAITS.find((x) => x.id === id)
  return !!t && aiTier(state) >= t.tier
}

// Everything the board's threat panel shows. null = no difficulty on.
export function describeDifficulty(state) {
  const d = state?.difficulty
  if (!d) return null
  const enemies = state.units.filter((u) => u.side === "enemy" && u.hp > 0 && !u.structure)
  const lines = { frontline: 0, backline: 0, support: 0 }
  for (const u of enemies) lines[lineOf(u)]++
  const scaled = []
  if (d.hp > 1) scaled.push(`HP +${Math.round((d.hp - 1) * 100)}%`)
  if (d.atk > 0) scaled.push(`damage +${d.atk}`)
  if (d.escorts > 0) scaled.push(`+${d.escorts} enem${d.escorts === 1 ? "y" : "ies"}`)
  if (d.skillCd > 0) scaled.push("skills recharge faster")
  if (d.skillAmp > 1) scaled.push(`skills +${Math.round((d.skillAmp - 1) * 100)}%`)
  const ults = enemies.filter((u) => u.ult).length
  if (ults) scaled.push(`${ults} ultimate${ults === 1 ? "" : "s"}`)
  return {
    tier: d.tier,
    id: d.id,
    name: d.name,
    score: d.score,
    act: d.act,
    kind: d.kind,
    pips: d.tier,
    scaled,
    traits: AI_TRAITS.filter((t) => (d.ai || 0) >= t.tier),
    lines: Object.entries(lines)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => ({ id, n, ...LINE_INFO[id] })),
    roles: enemies.map((u) => ({ id: u.id, role: roleOf(u), icon: BATTLE_ROLES[roleOf(u)].icon })),
    qa: !!d.qa,
  }
}

// QA hook companion (withLowEnemyHp): the smarter AI is switched off -
// a 1-HP enemy would otherwise "retreat when low" from every QA bot.
export function difficultyQa(state) {
  return state?.difficulty ? { ...state, difficulty: { ...state.difficulty, ai: 0, qa: true } } : state
}
