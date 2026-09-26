// Hearthwood Frontier - enemy active skills (sprint 2). Data only: which
// enemy has which skill. The engine (tacticsEngine.js) scores, telegraphs
// and applies them. Most regular enemies derive a skill from their own
// auto-battler movePattern; elites/minibosses/the boss get a hand-picked kit.

import { ENEMIES } from "../../data/heartwood/enemies"

// kind -> shared defaults. `cooldown` = enemy turns between uses.
export const ENEMY_SKILL_KINDS = {
  mend: { icon: "✚", cooldown: 2, range: 3 },
  shield: { icon: "⛨", cooldown: 2, range: 3 },
  hex: { icon: "☠", cooldown: 3, range: 3 },
  slam: { icon: "✹", cooldown: 3, range: 2 },
  pounce: { icon: "»", cooldown: 2 },
  summon: { icon: "❖", cooldown: 3, cap: 2 },
  enrage: { icon: "♨", cooldown: 99, threshold: 0.6 },
}

const HEX_NAMES = { weak: "Sapping Curse", vulnerable: "Mark of Ruin", poison: "Blight Spit", root: "Grasping Roots", burn: "Ember Spit", chill: "Rime Breath" }
const DEBUFF_TO_STATUS = { weak: "weak", dampen: "weak", vulnerable: "vulnerable", poison: "poison", stun: "root" }

const mk = (kind, props = {}) => ({ kind, cooldown: ENEMY_SKILL_KINDS[kind].cooldown, ...props, id: props.id || kind })
const hex = (status, amount = 1, name) => mk("hex", { status, amount, name: name || HEX_NAMES[status] })

// Hand-picked kits: elites, minibosses, the boss.
const EXPLICIT = {
  deepwarden: [mk("slam", { name: "Deep Quake", amount: 8 }), hex("vulnerable", 1, "Mark of the Deep")],
  thornmaw: [mk("summon", { name: "Thornbrood", minion: "thorn-tick" }), mk("mend", { name: "Sap Surge", amount: 8 })],
  wyrmgall: [mk("pounce", { name: "Wyrm Dive", bonus: 4 }), mk("slam", { name: "Tail Sweep", amount: 9 })],
  spacemonkey: [mk("slam", { name: "Void Crush", amount: 12 }), mk("summon", { name: "Echo Spawn", minion: "mire-gnat" })],
  "the-gorging-maw": [mk("summon", { name: "Disgorge", minion: "sporelet" }), mk("mend", { name: "Gorge", amount: 10 })],
  "the-iron-sentinel": [mk("shield", { name: "Iron Aegis", amount: 10 }), mk("slam", { name: "Anvil Fall", amount: 8 })],
  "the-bramble-lash": [hex("root", 1, "Bramble Snare"), mk("pounce", { name: "Lash", bonus: 3 })],
  "the-ashfall-herald": [mk("slam", { name: "Ashfall", amount: 8 }), hex("burn", 3, "Cinder Brand")],
}

// Regular enemies: one skill from the def's own non-attack moves, plus
// Frenzy for a def whose passive already grows its damage.
function deriveSkills(def) {
  const moves = def.movePattern || []
  const find = (type) => moves.find((m) => m.type === type)
  let primary = null
  if (find("heal")) primary = mk("mend", { name: "Sap Mend", amount: find("heal").amount + 2 })
  else if (find("aoe")) primary = mk("slam", { name: "Ground Slam", amount: find("aoe").amount + 2 })
  else if (find("debuff") && DEBUFF_TO_STATUS[find("debuff").id]) {
    const d = find("debuff")
    const status = DEBUFF_TO_STATUS[d.id]
    primary = hex(status, status === "poison" ? d.amount : 1)
  } else if (find("sunder")) primary = hex("vulnerable")
  else if (find("cleanse")) primary = mk("shield", { name: "Bark Ward", amount: 8 })
  else if (moves.some((m) => m.type === "block" && m.amount >= 5)) {
    primary = mk("shield", { name: "Bark Ward", amount: Math.max(...moves.filter((m) => m.type === "block").map((m) => m.amount)) })
  } else if (moves.length && moves.every((m) => m.type === "attack")) primary = mk("pounce", { name: "Pounce", bonus: 2 })
  const skills = primary ? [primary] : []
  const fury = (def.passive || []).some((p) => p.type === "applyBuff" && (p.id === "strength" || p.id === "woundedFury"))
  if (fury) skills.push(mk("enrage", { name: "Frenzy", amount: 3 }))
  return skills
}

// Element combos (sprint 3): fire/frost-flavored enemies also carry an
// element hex (Fire = Burn, Frost = Chill; 2 Chill freezes).
const elementHex = (status, amount, name) => ({ ...hex(status, amount, name), id: "element-hex" })
const ELEMENT_HEXES = {
  emberwrack: elementHex("burn", 2),
  ashenmaw: elementHex("burn", 2),
  "emberthorn-shade": elementHex("burn", 2, "Cinder Lash"),
  "drowned-siren": elementHex("chill", 1, "Drowning Chill"),
  "mist-growler": elementHex("chill", 1, "Freezing Mist"),
  wraithgale: elementHex("chill", 1, "Rime Gale"),
}

const TABLE = Object.fromEntries(
  Object.values(ENEMIES).map((def) => [def.id, [...(EXPLICIT[def.id] || deriveSkills(def)), ...(ELEMENT_HEXES[def.id] ? [ELEMENT_HEXES[def.id]] : [])]]),
)

// A unit's skills: an explicit `enemySkills` on the unit wins (summons,
// synthetic test states), else the def's table entry.
export function enemySkillsFor(unit) {
  if (!unit || unit.side !== "enemy") return []
  return unit.enemySkills || TABLE[unit.defId] || []
}

export function enemySkillTable() {
  return TABLE
}

const STATUS_WORD = { weak: "Weak", vulnerable: "Vulnerable", poison: "Poison", root: "Rooted + Entangled", burn: "Burn", chill: "Chill" }

// Tooltip for a telegraphed skill intent. `nameOf(id)` resolves unit names.
export function describeSkillIntent(intent, nameOf) {
  const t = intent.targetId ? nameOf(intent.targetId) : ""
  switch (intent.skillKind) {
    case "mend": return `${intent.name}: will heal ${t} for ${intent.amount}`
    case "shield": return `${intent.name}: will shield ${t} (+${intent.amount} Block)`
    case "hex": return `${intent.name}: will afflict ${t} with ${STATUS_WORD[intent.status]}${["poison", "burn", "chill"].includes(intent.status) ? ` ${intent.amount}` : ""}`
    case "pounce": return `${intent.name}: will leap onto ${t} and strike (+${intent.bonus} damage)`
    case "summon": return `${intent.name}: will call a ${intent.minionName} to its side`
    case "slam":
      return intent.phase === "release"
        ? `${intent.name}: will crush the marked 3x3 tiles for ${intent.amount} - step out!`
        : `${intent.name}: winding up - the marked 3x3 tiles get crushed for ${intent.amount} NEXT turn`
    case "enrage": return `${intent.name}: will enrage (+${intent.amount} attack), then act`
    default: return intent.name || "Skill"
  }
}
