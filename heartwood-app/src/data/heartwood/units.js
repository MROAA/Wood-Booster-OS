// Heartwood Trial - the recruitable unit roster for the autobattler.
// Every unit is derived mechanically from the old cards.js entry of the
// same id (see the plan's conversion table): an "attack" card's damage
// becomes the unit's repeating attack; a "skill" card's block/heal
// becomes its repeating block/heal; a "power" card's addTrigger effect
// becomes a real passive, applied once when the unit enters battle,
// reusing the exact mechanism characters already use for their own
// signature effects. Same art keys as before - zero new art.
//
// movePattern/moveSelect use the same shape ENEMIES already use
// ("sequence" cycles deterministically, "weightedRandom" rolls each
// time) - a unit's own combat behavior is nothing new, just the
// existing enemy-AI model applied to the player's side too.
//
// attackPattern defaults to "single" (always hits the frontmost living
// enemy - see autoBattleEngine.js). "rook"/"bishop"/"knight" fan out
// across the shape from the unit's own square, same geometry
// targeting.js already provides.

// Bumped ~20-25% from the first pass after testing showed a 3-unit
// starter squad (78 total HP) losing consistently to the 4-piece Rune
// Warden's Escort formation (176 total HP) - see the plan/memory note
// on this. Paired with a 4th deploy slot in runEngine.js.
const TIER_HP = { common: 32, uncommon: 42, rare: 54 }
const TIER_COST = { common: 1, uncommon: 2, rare: 3 }

function tierFromCost(cost) {
  if (cost >= 3) return "rare"
  if (cost === 2) return "uncommon"
  return "common"
}

function unit(id, name, art, cost, role, movePattern, opts = {}) {
  const tier = tierFromCost(cost)
  return {
    id,
    name,
    art,
    tier,
    role,
    recruitCost: TIER_COST[tier],
    maxHp: TIER_HP[tier],
    attackPattern: opts.attackPattern || "single",
    moveSelect: opts.moveSelect || "sequence",
    movePattern,
    passive: opts.passive || null,
  }
}

// Every unit interleaves at least one real attack into its pattern -
// found via testing that a unit with a pure block/heal-only pattern is
// a dead weight in an endless-round autobattle (Block resets every
// round; it never contributes toward actually winning), unlike in the
// old hand-of-cards game where the same effect was a deliberate
// one-time defensive play mixed into a turn full of attack cards.
// Support/tank units still lean defensive (attack shows up every other
// beat, not every beat), they just aren't useless anymore.
const BASE_UNITS = {
  "the-fool": unit("the-fool", "The Fool", "the-fool", 0, "support", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 4 },
  ]),
  "the-magician": unit("the-magician", "The Magician", "the-magician", 1, "hybrid", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 3 },
  ]),
  "the-high-priestess": unit("the-high-priestess", "The High Priestess", "the-high-priestess", 1, "support", [
    { type: "heal", amount: 4 },
    { type: "attack", amount: 5 },
  ]),
  "the-empress": unit("the-empress", "The Empress", "the-empress", 2, "support", [
    { type: "heal", amount: 5 },
    { type: "block", amount: 4 },
    { type: "attack", amount: 6 },
  ]),
  "the-emperor": unit("the-emperor", "The Emperor", "the-emperor", 2, "tank", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 5 } }],
  }),
  "the-hierophant": unit("the-hierophant", "The Hierophant", "the-hierophant", 1, "dps", [
    { type: "attack", amount: 4 },
  ], {
    passive: [{ type: "applyBuff", id: "strength", amount: 1 }],
  }),
  "the-lovers": unit("the-lovers", "The Lovers", "the-lovers", 1, "dps", [{ type: "attack", amount: 6 }]),
  "the-chariot": unit("the-chariot", "The Chariot", "the-chariot", 2, "dps", [{ type: "attack", amount: 14 }]),
  strength: unit("strength", "Strength", "strength", 1, "dps", [{ type: "attack", amount: 5 }], {
    passive: [{ type: "applyBuff", id: "strength", amount: 2 }],
  }),
  "the-hermit": unit("the-hermit", "The Hermit", "the-hermit", 1, "support", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 6 },
  ]),
  "wheel-of-fortune": unit("wheel-of-fortune", "Wheel of Fortune", "wheel-of-fortune", 1, "hybrid", [
    { type: "attack", amount: 10, weight: 1 },
    { type: "block", amount: 10, weight: 1 },
  ], { moveSelect: "weightedRandom" }),
  justice: unit("justice", "Justice", "justice", 1, "tank", [
    { type: "block", amount: 7 },
    { type: "attack", amount: 6 },
  ]),
  "the-hanged-man": unit("the-hanged-man", "The Hanged Man", "the-hanged-man", 0, "dps", [
    { type: "attack", amount: 6 },
  ]),
  death: unit("death", "Death", "death", 1, "dps", [{ type: "attack", amount: 7 }]),
  temperance: unit("temperance", "Temperance", "temperance", 1, "tank", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "block", amount: 3 } }],
  }),
  "the-devil": unit("the-devil", "The Devil", "the-devil", 1, "dps", [{ type: "attack", amount: 16 }]),
  "the-tower": unit("the-tower", "The Tower", "the-tower", 2, "dps", [{ type: "attack", amount: 18 }]),
  "the-star": unit("the-star", "The Star", "the-star", 1, "support", [{ type: "attack", amount: 4 }], {
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "heal", amount: 3 } }],
  }),
  "the-moon": unit("the-moon", "The Moon", "the-moon", 1, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 5 },
  ]),
  "the-sun": unit("the-sun", "The Sun", "the-sun", 2, "dps", [{ type: "attack", amount: 16 }]),
  judgement: unit("judgement", "Judgement", "judgement", 1, "dps", [{ type: "attack", amount: 7 }]),
  "the-world": unit("the-world", "The World", "the-world", 3, "dps", [{ type: "attack", amount: 20 }]),

  "knights-leap": unit("knights-leap", "Knight's Leap", "spark", 2, "dps", [{ type: "attack", amount: 12 }], {
    attackPattern: "knight",
  }),
  "rooks-charge": unit("rooks-charge", "Rook's Charge", "spark", 2, "dps", [{ type: "attack", amount: 6 }], {
    attackPattern: "rook",
  }),
  "bishops-slash": unit("bishops-slash", "Bishop's Slash", "spark", 2, "dps", [{ type: "attack", amount: 5 }], {
    attackPattern: "bishop",
  }),
}

// Fusion (TFT/Guildrun-standard, one level only - bounded, not an
// evolution tree): 3 owned copies of the same base unit combine into
// one Tier 2 copy, generated here rather than hand-authored so every
// base unit automatically has a fusion target. +50% HP, +40% on every
// numeric move/passive amount. `fusedFrom` marks it as a fusion
// product (not directly shop-recruitable); `displayTier: 2` drives the
// UI badge.
export const TIER2_SUFFIX = "+"

function scaleEffect(effect, factor) {
  return effect.amount != null ? { ...effect, amount: Math.round(effect.amount * factor) } : effect
}

function makeTier2(base) {
  return {
    ...base,
    id: `${base.id}${TIER2_SUFFIX}`,
    name: `${base.name}+`,
    fusedFrom: base.id,
    displayTier: 2,
    recruitCost: null,
    maxHp: Math.round(base.maxHp * 1.5),
    movePattern: base.movePattern.map((m) => scaleEffect(m, 1.4)),
    passive: base.passive
      ? base.passive.map((p) => (p.type === "addTrigger" ? { ...p, effect: scaleEffect(p.effect, 1.4) } : scaleEffect(p, 1.4)))
      : null,
  }
}

const TIER2_UNITS = Object.fromEntries(
  Object.values(BASE_UNITS).map((base) => [`${base.id}${TIER2_SUFFIX}`, makeTier2(base)]),
)

export const UNITS = { ...BASE_UNITS, ...TIER2_UNITS }

export const STARTER_UNITS = ["the-lovers", "justice", "the-hierophant"]
