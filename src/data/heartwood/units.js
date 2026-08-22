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
import stoneheartImg from "../../assets/heartwood/units/stoneheart.jpg"
import forgehowlImg from "../../assets/heartwood/units/forgehowl.jpg"
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
    // Rally: a battle-start buff that goes to adjacent ALLIES instead
    // of the unit itself (every other passive/relic self-targets) -
    // see autoBattleEngine.js's own special-case handling, same
    // precedent as Bulwark Standard's tauntHighestHp. { id, amount }.
    rallyAdjacent: opts.rallyAdjacent || null,
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
  stoneheart: unit("stoneheart", "Stoneheart", "stoneheart", 3, "tank", [
    { type: "block", amount: 10 },
    { type: "attack", amount: 7 },
  ], {
    // The roster's tankiest turnStart passive yet - 6 Block every
    // round vs. The Emperor's 5 (uncommon) or Grovekeeper's heal-based
    // approach (tank via sustain, not prevention) - justified by rare
    // tier's higher recruit cost. Also the roster's first unit to carry
    // Taunt (applied once at battle start, not a repeating trigger,
    // since it should hold for the whole fight): the wall that
    // actually draws the enemy's fire onto itself instead of just
    // surviving it, giving the rest of the squad a real reason to
    // stand behind Stoneheart rather than just next to it.
    passive: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 6 } },
      { type: "applyBuff", id: "taunt", amount: 1 },
    ],
    image: stoneheartImg,
  }),
  forgehowl: unit("forgehowl", "Forgehowl", "forgehowl", 3, "dps", [
    { type: "attack", amount: 20 },
    { type: "block", amount: 8 },
  ], {
    // A simple heavy hitter, no passive - same "not every rare needs a
    // gimmick" shape as The World/The Tower. The roster's single
    // highest per-hit attack number after The World's 20 (tied) - a
    // slow, hard-swinging identity rather than a sustained one.
    image: forgehowlImg,
  }),
  duskclaw: unit("duskclaw", "Duskclaw", "flame", 3, "dps", [
    { type: "attack", amount: 8 },
  ], {
    // The roster's first unit built around Execute (effects.js's
    // dealDamage) instead of a Strength/Weak/heal-family passive - a
    // second, unit-level way to reach the mechanic alongside the
    // Culling Strike relic (relics.js), for a squad that wants Execute
    // without spending a relic slot on it. No dedicated portrait yet -
    // reuses the "flame" glyph rather than inventing new art this
    // round, same placeholder-first approach earlier forest-creature
    // units started with.
    passive: [{ type: "applyBuff", id: "execute", amount: 4 }],
  }),
  ashenhorn: unit("ashenhorn", "Ashenhorn", "leaf", 2, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 5 },
  ], {
    // Rally: the roster's first positional mechanic (autoBattleEngine.js
    // special-cases rallyAdjacent, same precedent as Bulwark Standard's
    // tauntHighestHp) - grants Strength to every OTHER deployed unit
    // Chebyshev-adjacent to Ashenhorn at battle start, not to itself.
    // The 4 deploy slots aren't all mutually adjacent (the two back
    // corners, SLOT_POSITIONS[0]/[2], are the only non-adjacent pair),
    // so where you place Ashenhorn genuinely changes how many allies it
    // reaches - a real placement decision, not just "recruit it and
    // forget it", matching Marc's "easy to play but hard to master".
    rallyAdjacent: { id: "strength", amount: 2 },
  }),
  rootfang: unit("rootfang", "Rootfang", "root", 3, "dps", [
    { type: "attack", amount: 7 },
    { type: "debuff", id: "poison", amount: 3, target: "target" },
    { type: "attack", amount: 7 },
  ], {
    // Poison (effects.js's tickPoison) has only ever been an enemy
    // weapon (Bloomrot Stalker, Spacemonkey) until now - same
    // debuff-movePattern shape Stormwing already uses for Weak, just a
    // different status id, so no new engine code needed to give the
    // player its own source of the mechanic.
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

export function scaleEffect(effect, factor) {
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
    rallyAdjacent: base.rallyAdjacent ? scaleEffect(base.rallyAdjacent, 1.4) : null,
  }
}

const TIER2_UNITS = Object.fromEntries(
  Object.values(BASE_UNITS).map((base) => [`${base.id}${TIER2_SUFFIX}`, makeTier2(base)]),
)

// Upgrade: a second, independent way to spend Essence on the bench
// besides recruiting/rerolling and (via runEngine.js's relic nodes)
// relics - Marc: "i need to make a build out of relics/upgrades and
// stuff then the game proceeds". Unlike Fusion (needs 3 copies, one
// step, +50%), Upgrade is a per-unit Essence sink you choose to spend
// on any single owned unit, and stacks with Fusion rather than
// replacing it (applied on top of whatever def - base or already-fused
// - the unit currently is). Raised from 2 to 3 max levels after Marc
// asked for "more upgrades content" - the cost curve (COST*(level+1))
// already generalizes to a 3rd level (9 Essence) with no other change.
export const UPGRADE_COST = 3
export const UPGRADE_MAX_LEVEL = 3
const UPGRADE_FACTOR_PER_LEVEL = 0.15

export function upgradeCost(level) {
  return level >= UPGRADE_MAX_LEVEL ? null : UPGRADE_COST * (level + 1)
}

export function unitDefWithUpgrade(def, level) {
  if (!level) return def
  const factor = 1 + level * UPGRADE_FACTOR_PER_LEVEL
  return {
    ...def,
    maxHp: Math.round(def.maxHp * factor),
    movePattern: def.movePattern.map((m) => scaleEffect(m, factor)),
    passive: def.passive
      ? def.passive.map((p) => (p.type === "addTrigger" ? { ...p, effect: scaleEffect(p.effect, factor) } : scaleEffect(p, factor)))
      : null,
    rallyAdjacent: def.rallyAdjacent ? scaleEffect(def.rallyAdjacent, factor) : null,
  }
}

export const UNITS = { ...BASE_UNITS, ...TIER2_UNITS }

export const STARTER_UNITS = ["the-lovers", "justice", "the-hierophant"]
