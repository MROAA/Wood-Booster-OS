// Hearthwood Frontier - XCOM part 1: the 5 battle roles (Tank, Healer,
// DPS, Support, Control). Every unit on the board - player AND enemy -
// maps to exactly one, so the board can colour/iconify it and the enemy
// AI can play its part. Pure; reads the unit (+ its enemy def moves).
import { CLASSES } from "../../data/heartwood/classes"
import { ENEMIES } from "../../data/heartwood/enemies"
import { enemySkillsFor } from "./tacticsEnemyAbilities"

// Okabe-Ito based (colour-blind safe), lifted for a dark board. Every
// role also has its own icon, so colour is never the only cue.
export const BATTLE_ROLES = {
  tank: { id: "tank", label: "Tank", icon: "⛨", color: "#56b4e9", what: "Stands in front and soaks the hits so the squad survives." },
  healer: { id: "healer", label: "Healer", icon: "✚", color: "#2fbf8f", what: "Keeps allies alive - stay behind the tank and heal." },
  dps: { id: "dps", label: "DPS", icon: "⚔", color: "#ef7a3c", what: "Deals the damage - focus the biggest threat first." },
  support: { id: "support", label: "Support", icon: "✦", color: "#f0e442", what: "Makes allies stronger: buffs, shields and extra actions." },
  control: { id: "control", label: "Control", icon: "⛓", color: "#d687b8", what: "Locks enemies down: roots, slows, stuns and curses." },
}
export const ROLE_IDS = Object.keys(BATTLE_ROLES)

// Class group default, then per-class exceptions.
const GROUP_ROLE = { frontline: "tank", damage: "dps", support: "support", control: "control", summoning: "support", specialist: "support" }
const CLASS_ROLE = {
  bruiser: "dps",
  healer: "healer",
  medic: "healer",
  cleanser: "healer",
  alchemist: "dps",
  scout: "dps",
  saboteur: "dps",
  shapeshifter: "dps",
  chronomancer: "control",
  corruptor: "control",
}

export function classRole(classId) {
  const cls = CLASSES[classId]
  if (!cls) return null
  return CLASS_ROLE[classId] || GROUP_ROLE[cls.group] || "dps"
}

// A def whose own moves block a lot for what it hits (a real "wall").
function blockHeavy(defId) {
  const moves = ENEMIES[defId]?.movePattern || []
  const block = Math.max(0, ...moves.filter((m) => m.type === "block").map((m) => m.amount || 0))
  const hit = Math.max(0, ...moves.filter((m) => m.type === "attack").map((m) => m.amount || 0))
  return block >= 5 && block >= 0.75 * hit
}

// Enemy kit: taunt -> tank, mend -> healer, a melee wall (heavy block or
// a huge body) -> tank, hex -> control, summon/shield -> support, else DPS.
function enemyRole(unit) {
  const kinds = new Set(enemySkillsFor(unit).filter((s) => s.id !== "element-hex").map((s) => s.kind))
  if (unit.taunt > 0) return "tank"
  if (kinds.has("mend")) return "healer"
  if (unit.range === 1 && (unit.maxHp >= 56 || (unit.maxHp >= 40 && blockHeavy(unit.defId)))) return "tank"
  if (kinds.has("hex")) return "control"
  if (kinds.has("summon") || kinds.has("shield")) return "support"
  return "dps"
}

// One role id for any unit (never null for a unit).
export function roleOf(unit) {
  if (!unit) return "dps"
  if (unit.structure) return "support"
  if (unit.side === "enemy") return enemyRole(unit)
  if (unit.classId) return classRole(unit.classId) || "dps"
  if (unit.npc) return "support"
  if (unit.ability?.kind === "heal") return "healer"
  return unit.range === 1 && unit.maxHp >= 40 ? "tank" : "dps"
}

export function roleInfo(unit) {
  return BATTLE_ROLES[roleOf(unit)]
}

// How far a healer's heals reach (Chebyshev tiles), 0 = cannot heal.
// Signature heal = adjacent; a class heal skill = its range (self = 1).
export function healReach(unit) {
  if (!unit) return 0
  let reach = unit.ability?.kind === "heal" ? 1 : 0
  for (const sk of unit.classSkills || []) {
    if (!(sk.amount > 0)) continue
    if (sk.target === "ally") reach = Math.max(reach, Number(sk.range) || 1)
    else if (sk.target === "self") reach = Math.max(reach, 1)
  }
  return reach
}
