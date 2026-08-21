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

// Placeholder portrait images for the two forest-creature units - see
// units.js's `image` field and UnitCard.jsx. Marc confirmed these are
// temporary reference art, not for anything distributed publicly until
// swapped for real/licensed art before release.
import emberStagImg from "../../assets/heartwood/units/ember-stag.jpg"
import grovekeeperImg from "../../assets/heartwood/units/grovekeeper.jpg"
import stormwingImg from "../../assets/heartwood/units/stormwing.jpg"
import justiceImg from "../../assets/heartwood/units/justice.jpg"
import deathImg from "../../assets/heartwood/units/death.jpg"
import theEmpressImg from "../../assets/heartwood/units/the-empress.jpg"
import theDevilImg from "../../assets/heartwood/units/the-devil.webp"
import theLoversImg from "../../assets/heartwood/units/the-lovers.jpg"
import theEmperorImg from "../../assets/heartwood/units/the-emperor.jpg"
import theSunImg from "../../assets/heartwood/units/the-sun.jpg"
import theTowerImg from "../../assets/heartwood/units/the-tower.jpg"
import theHermitImg from "../../assets/heartwood/units/the-hermit.webp"
import theMoonImg from "../../assets/heartwood/units/the-moon.jpg"
import theWorldImg from "../../assets/heartwood/units/the-world.jpg"
import theStarImg from "../../assets/heartwood/units/the-star.jpg"
import theHangedManImg from "../../assets/heartwood/units/the-hanged-man.jpg"
import theHierophantImg from "../../assets/heartwood/units/the-hierophant.jpg"
import theFoolImg from "../../assets/heartwood/units/the-fool.webp"
import theChariotImg from "../../assets/heartwood/units/the-chariot.webp"
import judgementImg from "../../assets/heartwood/units/judgement.webp"
import theHighPriestessImg from "../../assets/heartwood/units/the-high-priestess.webp"
import wheelOfFortuneImg from "../../assets/heartwood/units/wheel-of-fortune.webp"
import bishopsSlashImg from "../../assets/heartwood/units/bishops-slash.webp"
import temperanceImg from "../../assets/heartwood/units/temperance.webp"
import knightsLeapImg from "../../assets/heartwood/units/knights-leap.webp"
import rooksChargeImg from "../../assets/heartwood/units/rooks-charge.webp"
import theMagicianImg from "../../assets/heartwood/units/the-magician.jpeg"
import strengthImg from "../../assets/heartwood/units/strength.jpg"

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
    // Optional portrait image (see UnitCard.jsx) - falls back to the
    // `art` SVG glyph when absent. Placeholder-quality reference art
    // for now, not final; see cardArt.jsx's note on where it came from.
    image: opts.image || null,
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
  ], { image: theFoolImg }),
  "the-magician": unit("the-magician", "The Magician", "the-magician", 1, "hybrid", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 3 },
  ], { image: theMagicianImg }),
  "the-high-priestess": unit("the-high-priestess", "The High Priestess", "the-high-priestess", 1, "support", [
    { type: "heal", amount: 4 },
    { type: "attack", amount: 5 },
  ], { image: theHighPriestessImg }),
  "the-empress": unit("the-empress", "The Empress", "the-empress", 2, "support", [
    { type: "heal", amount: 5 },
    { type: "block", amount: 4 },
    { type: "attack", amount: 6 },
  ], { image: theEmpressImg }),
  "the-emperor": unit("the-emperor", "The Emperor", "the-emperor", 2, "tank", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 5 } }],
    image: theEmperorImg,
  }),
  "the-hierophant": unit("the-hierophant", "The Hierophant", "the-hierophant", 1, "dps", [
    { type: "attack", amount: 4 },
  ], {
    passive: [{ type: "applyBuff", id: "strength", amount: 1 }],
    image: theHierophantImg,
  }),
  "the-lovers": unit("the-lovers", "The Lovers", "the-lovers", 1, "dps", [{ type: "attack", amount: 6 }], {
    image: theLoversImg,
  }),
  "the-chariot": unit("the-chariot", "The Chariot", "the-chariot", 2, "dps", [{ type: "attack", amount: 14 }], {
    image: theChariotImg,
  }),
  strength: unit("strength", "Strength", "strength", 1, "dps", [{ type: "attack", amount: 5 }], {
    passive: [{ type: "applyBuff", id: "strength", amount: 2 }],
    image: strengthImg,
  }),
  "the-hermit": unit("the-hermit", "The Hermit", "the-hermit", 1, "support", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 6 },
  ], { image: theHermitImg }),
  "wheel-of-fortune": unit("wheel-of-fortune", "Wheel of Fortune", "wheel-of-fortune", 1, "hybrid", [
    { type: "attack", amount: 10, weight: 1 },
    { type: "block", amount: 10, weight: 1 },
  ], { moveSelect: "weightedRandom", image: wheelOfFortuneImg }),
  justice: unit("justice", "Justice", "justice", 1, "tank", [
    { type: "block", amount: 7 },
    { type: "attack", amount: 6 },
  ], { image: justiceImg }),
  "the-hanged-man": unit("the-hanged-man", "The Hanged Man", "the-hanged-man", 0, "dps", [
    { type: "attack", amount: 6 },
  ], { image: theHangedManImg }),
  death: unit("death", "Death", "death", 1, "dps", [{ type: "attack", amount: 7 }], { image: deathImg }),
  temperance: unit("temperance", "Temperance", "temperance", 1, "tank", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "block", amount: 3 } }],
    image: temperanceImg,
  }),
  "the-devil": unit("the-devil", "The Devil", "the-devil", 1, "dps", [{ type: "attack", amount: 16 }], { image: theDevilImg }),
  "the-tower": unit("the-tower", "The Tower", "the-tower", 2, "dps", [{ type: "attack", amount: 18 }], {
    image: theTowerImg,
  }),
  "the-star": unit("the-star", "The Star", "the-star", 1, "support", [{ type: "attack", amount: 4 }], {
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "heal", amount: 3 } }],
    image: theStarImg,
  }),
  "the-moon": unit("the-moon", "The Moon", "the-moon", 1, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 5 },
  ], { image: theMoonImg }),
  "the-sun": unit("the-sun", "The Sun", "the-sun", 2, "dps", [{ type: "attack", amount: 16 }], {
    image: theSunImg,
  }),
  judgement: unit("judgement", "Judgement", "judgement", 1, "dps", [{ type: "attack", amount: 7 }], {
    image: judgementImg,
  }),
  "the-world": unit("the-world", "The World", "the-world", 3, "dps", [{ type: "attack", amount: 20 }], {
    image: theWorldImg,
  }),

  "knights-leap": unit("knights-leap", "Knight's Leap", "spark", 2, "dps", [{ type: "attack", amount: 12 }], {
    attackPattern: "knight",
    image: knightsLeapImg,
  }),
  "rooks-charge": unit("rooks-charge", "Rook's Charge", "spark", 2, "dps", [{ type: "attack", amount: 6 }], {
    attackPattern: "rook",
    image: rooksChargeImg,
  }),
  "bishops-slash": unit("bishops-slash", "Bishop's Slash", "spark", 2, "dps", [{ type: "attack", amount: 5 }], {
    attackPattern: "bishop",
    image: bishopsSlashImg,
  }),

  // First two non-Tarot, non-chess-pattern units - same "new
  // arrangement of an existing idea" spirit as the enemy formations,
  // applied to the recruit pool instead: forest creatures alongside
  // the Arcana, matching the enemy roster's own crude-doodle register
  // rather than the Tarot line-art style.
  "ember-stag": unit("ember-stag", "Ember Stag", "emberStag", 3, "dps", [
    { type: "attack", amount: 11 },
    { type: "attack", amount: 11 },
    { type: "block", amount: 6 },
  ], {
    // Grows stronger the longer it survives a fight - distinct from
    // Fenrir's woundedFury (HP-conditional): this ramps unconditionally
    // every round, "burning brighter" rather than "hurts more when hurt".
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "applyBuff", id: "strength", amount: 1 } }],
    image: emberStagImg,
  }),
  grovekeeper: unit("grovekeeper", "Grovekeeper", "grovekeeper", 2, "tank", [
    { type: "block", amount: 8 },
    { type: "attack", amount: 6 },
  ], {
    image: grovekeeperImg,
    // The Emperor already does turnStart block - this is the roster's
    // first unit with its own unconditional turnStart self-heal
    // (previously only Aatos's Commander passive did that, squad-wide).
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
  }),
  stormwing: unit("stormwing", "Stormwing", "stormwing", 3, "dps", [
    { type: "attack", amount: 9 },
    { type: "debuff", id: "weak", amount: 2, target: "target" },
    { type: "attack", amount: 9 },
  ], {
    // A third rare-tier forest creature, storm/lightning themed rather
    // than fire (Ember Stag) or growth (Grovekeeper) - the roster's
    // first player-side unit with a repeating Weak debuff, previously
    // only an enemy move (Moss Troll, Rune Warden, Mist Growler,
    // Spacemonkey all already use it against the player).
    image: stormwingImg,
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
