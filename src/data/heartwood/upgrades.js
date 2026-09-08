// Hearthwood Trial - unit upgrade branches. Marc's PRD (sections 3-11):
// a unit's level-up stops being "pay Essence -> +15% to everything" and
// becomes a CHOICE of direction. The Essence sink + rising-cost curve
// (units.js's upgradeCost / UPGRADE_MAX_LEVEL) is unchanged; each level
// now spends it on ONE of these five branches instead.
//
// bench[].upgrades is the ordered list of chosen branch ids (one per
// level); bench[].upgradeLevel stays as its length. `power` may be
// picked repeatedly; every other branch once. `transform` unlocks only
// as the final pick. That pick-once rule IS the PRD's "Power Budget" -
// no number to tune, and it caps a unit at 3 picks / 900 Essence.
//
// Kept as GENERIC def transforms, not per-unit data - the same
// discipline every content round this session has followed.

export const ECONOMY_WIN_BONUS = 25

// The trivial amount-scaler (units.js's scaleEffect, re-inlined here so
// this module has no import back into units.js - the dependency only
// goes units -> upgrades).
function scaleAmt(effect, factor) {
  return effect.amount != null ? { ...effect, amount: Math.round(effect.amount * factor) } : effect
}

// Scale every numeric field on a def - the same fold unitDefWithUpgrade
// / makeTier2 already use.
function scaleDef(def, factor) {
  return {
    ...def,
    maxHp: Math.round(def.maxHp * factor),
    movePattern: def.movePattern.map((m) => scaleAmt(m, factor)),
    passive: def.passive
      ? def.passive.map((p) => (p.type === "addTrigger" ? { ...p, effect: scaleAmt(p.effect, factor) } : scaleAmt(p, factor)))
      : null,
    rallyAdjacent: def.rallyAdjacent ? scaleAmt(def.rallyAdjacent, factor) : null,
    rallyHeal: def.rallyHeal ? Math.round(def.rallyHeal * factor) : null,
    chainDamage: def.chainDamage ? Math.round(def.chainDamage * factor) : null,
  }
}

// The four paths PRD "Unit Roles, Build System & Strategic Upgrades V1"
// section 15 names (Power / Defense / Synergy / Utility) plus Economy
// from section 10 - each level-up spends the cost curve on ONE of them.
// (Transformation / breakpoint upgrades are that PRD's later phases.)
export const UPGRADE_BRANCHES = [
  {
    id: "power",
    label: "Power",
    accent: "var(--hw-ember)",
    repeatable: true,
    desc: "+20% health and +20% to every number this unit puts out. The straight-ahead pick.",
  },
  {
    id: "defense",
    label: "Defense",
    accent: "var(--hw-rune)",
    desc: "+30% health and a stack of Bulwark (permanent armour) - but it attacks 15% softer. A wall, not a threat.",
  },
  {
    id: "synergy",
    label: "Synergy",
    accent: "var(--hw-moss)",
    desc: "This unit counts as +1 of each of its tribes toward synergy - one pick can push a tier over the line.",
  },
  {
    id: "utility",
    label: "Utility",
    accent: "var(--hw-gale)",
    desc: "Its attacks also apply Weak 1 to the target - but they land 10% softer. A trade, not a straight gain.",
  },
  {
    id: "economy",
    label: "Economy",
    accent: "var(--hw-cosmic)",
    desc: `+${ECONOMY_WIN_BONUS} Essence after every fight this unit is deployed for. Weaker in the fight, richer after it.`,
  },
]

export function branchById(id) {
  return UPGRADE_BRANCHES.find((b) => b.id === id) || null
}

// Pure def -> def. `synergy` / `economy` set marker fields the engine
// reads (autoBattleEngine.js tribeCounts / runEngine.js essenceForWin);
// the rest fold through unitDefWithUpgrade at battle start.
export function applyBranch(id, def) {
  switch (id) {
    case "power":
      return scaleDef(def, 1.2)
    case "utility": {
      const weak = {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 },
      }
      const withWeak = { ...def, passive: [...(def.passive || []), weak] }
      // -10% on attack moves only (the block/heal side is untouched, so
      // a support unit keeps its job) - the deliberate downside.
      return {
        ...withWeak,
        movePattern: withWeak.movePattern.map((m) => (m.type === "attack" ? scaleAmt(m, 0.9) : m)),
      }
    }
    case "defense": {
      // +30% HP, -15% on attack moves only, + a Bulwark stack at
      // battle start (units.js applies `passive` self-targeting).
      const withHp = { ...def, maxHp: Math.round(def.maxHp * 1.3) }
      const softened = {
        ...withHp,
        movePattern: withHp.movePattern.map((m) => (m.type === "attack" ? scaleAmt(m, 0.85) : m)),
      }
      return { ...softened, passive: [...(softened.passive || []), { type: "applyBuff", id: "bulwark", amount: 1 }] }
    }
    case "synergy":
      return { ...def, synergyBonus: (def.synergyBonus || 0) + 1 }
    case "economy":
      return { ...def, economyBonus: (def.economyBonus || 0) + ECONOMY_WIN_BONUS }
    default:
      return def
  }
}

// `upgrades` is the entry's chosen-branch array; `level` its length.
export function branchAvailable(id, upgrades, level) {
  const branch = branchById(id)
  if (!branch) return false
  if (branch.minLevel != null && level < branch.minLevel) return false
  if (!branch.repeatable && (upgrades || []).includes(id)) return false
  return true
}
