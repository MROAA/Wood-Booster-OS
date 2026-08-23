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
    attackPattern: opts.attackPattern || "single",
    moveSelect: opts.moveSelect || "sequence",
    movePattern,
    passive: opts.passive || null,
    // Rally: a battle-start buff that goes to adjacent ALLIES instead
    // of the unit itself (every other passive/relic self-targets) -
    // see autoBattleEngine.js's own special-case handling, same
    // precedent as Bulwark Standard's tauntHighestHp. { id, amount }.
    rallyAdjacent: opts.rallyAdjacent || null,
    // rallyHeal: same Chebyshev-adjacency check as rallyAdjacent, but
    // mends adjacent allies' HP every round instead of granting a
    // power stack once at battle start - see autoBattleEngine.js's
    // resolveRound, which ticks it alongside Poison every round
    // (a one-time battle-start heal would be a no-op, since units
    // always start a fight at full HP - the exact bug Mosswarden's
    // Charm hit twice before landing on a repeating trigger instead).
    rallyHeal: opts.rallyHeal || null,
    // Chain: a flat bonus hit on a different living enemy, fired only
    // when this unit's own single-target attack was the killing blow -
    // see autoBattleEngine.js's actSide for the full guard conditions.
    chainDamage: opts.chainDamage || null,
    // Haste: acts a second time in the same round instead of once -
    // see autoBattleEngine.js's actSide. Deliberately paired with a
    // LOWER per-hit amount than a same-tier non-Haste attacker (Marc:
    // "changes cannot be overpowered") - a flat doubling of every
    // round's actions is stronger pound-for-pound than a conditional
    // bonus like Execute/Chain, so the per-hit number has to give
    // something back rather than just stacking on top.
    haste: !!opts.haste,
    // Spore Spread: when this unit's own debuff step applies Poison,
    // the same stack also seeds onto a different living enemy - see
    // autoBattleEngine.js's actSide.
    sporeSpread: !!opts.sporeSpread,
    // Summon: grants the squad a bonus creature at battle start (not a
    // stat buff - a real extra entry in state.playerUnits), spawned
    // into whichever deploy slot the summoner itself didn't take - see
    // autoBattleEngine.js's startAutoBattle. { defId } names a
    // summonOnly unit def. Deliberately a one-shot at battle start,
    // not tied to movePattern - the summoned creature then acts every
    // round on its own like any other unit.
    summon: opts.summon || null,
    // summonOnly: excluded from the shop/reforge pool (this file's
    // rollShop-adjacent filters in runEngine.js) - a summoned creature
    // isn't directly recruitable, only gained via a Summoner's own
    // battle-start passive.
    summonOnly: !!opts.summonOnly,
    // maxHpOverride: lets a def sidestep the tier HP table entirely -
    // used only by summonOnly creatures, whose HP is deliberately
    // modest (a free bonus body, not a second full recruit) rather than
    // whatever HP its nominal cost tier would imply.
    maxHp: opts.maxHpOverride || TIER_HP[tier],
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
  "the-fool": unit("the-fool", "Mosskit", "the-fool", 0, "support", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 4 },
  ], { image: theFoolImg }),
  "the-magician": unit("the-magician", "Duskweaver", "the-magician", 1, "hybrid", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 3 },
  ], { image: theMagicianImg }),
  "the-high-priestess": unit("the-high-priestess", "Silverbloom", "the-high-priestess", 1, "support", [
    { type: "heal", amount: 4 },
    { type: "attack", amount: 5 },
  ], { image: theHighPriestessImg }),
  "the-empress": unit("the-empress", "Thistlequeen", "the-empress", 2, "support", [
    { type: "heal", amount: 5 },
    { type: "block", amount: 4 },
    { type: "attack", amount: 6 },
  ], { image: theEmpressImg }),
  "the-emperor": unit("the-emperor", "Stonecrown", "the-emperor", 2, "tank", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 5 } }],
    image: theEmperorImg,
  }),
  "the-hierophant": unit("the-hierophant", "Goldenbough", "the-hierophant", 1, "dps", [
    { type: "attack", amount: 4 },
  ], {
    passive: [{ type: "applyBuff", id: "strength", amount: 1 }],
    image: theHierophantImg,
  }),
  "the-lovers": unit("the-lovers", "Twinbriar", "the-lovers", 1, "dps", [{ type: "attack", amount: 6 }], {
    image: theLoversImg,
  }),
  "the-chariot": unit("the-chariot", "Thornram", "the-chariot", 2, "dps", [{ type: "attack", amount: 14 }], {
    image: theChariotImg,
  }),
  strength: unit("strength", "Ironclaw", "strength", 1, "dps", [{ type: "attack", amount: 5 }], {
    passive: [{ type: "applyBuff", id: "strength", amount: 2 }],
    image: strengthImg,
  }),
  "the-hermit": unit("the-hermit", "Hollowreed", "the-hermit", 1, "support", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 6 },
  ], { image: theHermitImg }),
  "wheel-of-fortune": unit("wheel-of-fortune", "Windshift", "wheel-of-fortune", 1, "hybrid", [
    { type: "attack", amount: 10, weight: 1 },
    { type: "block", amount: 10, weight: 1 },
  ], { moveSelect: "weightedRandom", image: wheelOfFortuneImg }),
  justice: unit("justice", "Oakwarden", "justice", 1, "tank", [
    { type: "block", amount: 7 },
    { type: "attack", amount: 6 },
  ], { image: justiceImg }),
  "the-hanged-man": unit("the-hanged-man", "Snarevine", "the-hanged-man", 0, "dps", [
    { type: "attack", amount: 6 },
  ], { image: theHangedManImg }),
  death: unit("death", "Bonewither", "death", 1, "dps", [{ type: "attack", amount: 7 }], { image: deathImg }),
  temperance: unit("temperance", "Stillbark", "temperance", 1, "tank", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "block", amount: 3 } }],
    image: temperanceImg,
  }),
  "the-devil": unit("the-devil", "Hollowmaw", "the-devil", 1, "dps", [{ type: "attack", amount: 16 }], { image: theDevilImg }),
  "the-tower": unit("the-tower", "Bramblespire", "the-tower", 2, "dps", [{ type: "attack", amount: 18 }], {
    image: theTowerImg,
  }),
  "the-star": unit("the-star", "Glowmoss", "the-star", 1, "support", [{ type: "attack", amount: 4 }], {
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "heal", amount: 3 } }],
    image: theStarImg,
  }),
  "the-moon": unit("the-moon", "Nightbloom", "the-moon", 1, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 5 },
  ], { image: theMoonImg }),
  "the-sun": unit("the-sun", "Sunthorn", "the-sun", 2, "dps", [{ type: "attack", amount: 16 }], {
    image: theSunImg,
  }),
  judgement: unit("judgement", "Stoneknell", "judgement", 1, "dps", [{ type: "attack", amount: 7 }], {
    image: judgementImg,
  }),
  "the-world": unit("the-world", "Rootcrown", "the-world", 3, "dps", [{ type: "attack", amount: 20 }], {
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
  wraithbriar: unit("wraithbriar", "Wraithbriar", "root", 3, "tank", [
    { type: "block", amount: 8 },
    { type: "attack", amount: 6 },
  ], {
    // Revive (effects.js's dealDamage) - a genuinely new state, not
    // another numeric stack on an existing formula: the first hit that
    // would otherwise drop Wraithbriar to 0 instead leaves it at 1 HP
    // and consumes the stack, once per fight. A real tension for
    // whatever's attacking it - burst past 1 extra life in one hit, or
    // the "kill" doesn't actually land - while staying fully
    // deterministic (no revive chance, no coin flip) per Marc's "easy
    // to play but hard to master".
    passive: [{ type: "applyBuff", id: "revive", amount: 1 }],
  }),
  grimtusk: unit("grimtusk", "Grimtusk", "flame", 3, "dps", [
    { type: "attack", amount: 9 },
    { type: "attack", amount: 9 },
  ], {
    // Chain (autoBattleEngine.js's actSide) - a second, distinct way to
    // reward finishing blows alongside Execute (Culling Strike/
    // Duskclaw), but a bonus hit on a DIFFERENT enemy instead of extra
    // damage on the same one: Execute rewards focusing one target down,
    // Chain rewards it too but then spreads the payoff across the
    // field - real build tension between the two rather than one
    // strictly out-classing the other.
    chainDamage: 6,
  }),
  thornguard: unit("thornguard", "Thornguard", "shield", 2, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    // Ward (effects.js's dealDamage) - a third defensive tool
    // alongside Block (a depleting damage pool) and Revive (only
    // matters once, at the very edge of death): a Ward stack cancels
    // one entire incoming hit outright, whatever its size, then is
    // gone. Granted once at battle start, same convention as every
    // other passive that isn't a repeating trigger - deliberately NOT
    // a turnStart regrant, since powers (unlike Block) don't reset
    // each round, and an unbounded once-per-round Ward stack would let
    // a Thornguard that goes several rounds unattacked (an AoE round,
    // a formation with more targets than attackers) snowball into
    // effective invulnerability rather than the fixed, readable
    // resource every other status stays.
    passive: [{ type: "applyBuff", id: "ward", amount: 2 }],
  }),
  swiftclaw: unit("swiftclaw", "Swiftclaw", "spark", 2, "dps", [{ type: "attack", amount: 4 }], {
    // Haste - a genuinely different shape of DPS from every other
    // attacker: two small hits a round instead of one big one, at
    // uncommon tier (4 dmg/hit = 8 total, in line with other uncommon
    // attackers, not above them - the value of Haste is in variety
    // (more hits landing means more onDealDamage/onHit triggers firing
    // per round with a Vampiric Bloom/Sundering Mark/Bramble Ward
    // build) rather than raw total damage).
    haste: true,
  }),
  emberwisp: unit("emberwisp", "Emberwisp", "spark", 3, "dps", [{ type: "aoe", amount: 5 }], {
    // The roster's first player-side AoE (autoBattleEngine.js's aoe
    // branch, previously only Spacemonkey's signature move) - a real
    // mage identity: every round, it blasts every living enemy at
    // once instead of picking a target. No new engine code needed,
    // the aoe branch already works for either side. Priced at rare
    // and kept modest (5/target, well below Spacemonkey's own 9) since
    // multi-target-every-round is a strong baseline on its own - it
    // also can't combo with Chain or Haste (both scoped to
    // attackPattern "single" attacks only), a natural ceiling that
    // came for free rather than needing its own guard.
  }),
  runeveil: unit("runeveil", "Runeveil", "rune", 2, "dps", [
    { type: "attack", amount: 4 },
    { type: "debuff", id: "vulnerable", amount: 1, target: "target" },
    { type: "attack", amount: 4 },
  ], {
    // A second mage, a curse-caster rather than a blaster - the
    // roster's first unit-level source of Vulnerable (previously only
    // Sundering Mark's onDealDamage trigger granted it). Same
    // debuff-movePattern shape Stormwing (Weak) and Rootfang (Poison)
    // already established, just a third status through the same door.
  }),
  frostbind: unit("frostbind", "Frostbind", "moonGlyph", 3, "support", [
    { type: "attack", amount: 3 },
    { type: "debuff", id: "stun", amount: 1, target: "target" },
    { type: "attack", amount: 3 },
  ], {
    // A third mage, and the roster's first PLAYER-side source of Stun
    // (previously only Rootbind Thicket, an enemy, could skip a
    // unit's whole action). Own damage kept deliberately low (3, below
    // even Rootbind Thicket's 4) for the same reason Rootbind Thicket
    // itself stays low - losing an entire action is a strong effect
    // on its own, this isn't meant to also hit hard.
  }),
  glimmerward: unit("glimmerward", "Glimmerward", "shield", 2, "support", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 3 },
  ], {
    // A fourth mage, a protective-aura caster - reuses Rally
    // (rallyAdjacent, first built for Ashenhorn's Strength aura)
    // verbatim, just granting Ward instead: whichever OTHER deployed
    // units are Chebyshev-adjacent to Glimmerward get a Ward stack at
    // battle start too, not just Glimmerward itself. Zero new engine
    // code - rallyAdjacent was already generic on the buff id, not
    // hardcoded to Strength.
    rallyAdjacent: { id: "ward", amount: 1 },
  }),
  wraithcaller: unit("wraithcaller", "Wraithcaller", "moonGlyph", 3, "hybrid", [{ type: "attack", amount: 6 }], {
    // A fifth mage, a life-drain caster - Lifesteal's first UNIT-level
    // source (previously only Vampiric Bloom, a relic). Every other
    // mechanic that shipped with both a relic and a unit source
    // (Taunt/Stoneheart+Bulwark Standard, Execute/Duskclaw+Culling
    // Strike, Ward/Thornguard+Aegis Ward) already had this pairing -
    // Lifesteal was the one gap left. Same onDealDamage+heal shape
    // Vampiric Bloom already proved, just as a self-targeting passive
    // instead of a relic effect.
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 2 } }],
  }),
  hexmother: unit("hexmother", "Hexmother", "root", 3, "support", [
    { type: "attack", amount: 5 },
    { type: "debuff", id: "poison", amount: 2, target: "target" },
    { type: "debuff", id: "weak", amount: 1, target: "target" },
  ], {
    // The roster's first Witch Doctor - Marc named 5 desired classes
    // (Paladin, Rogue, Warrior, Witch Doctor, Mage); Mage now has 5
    // units, the others already fit loosely by mechanic (Stoneheart/
    // Thornguard's Taunt+Ward+Block reads Paladin, Swiftclaw/Grimtusk/
    // Duskclaw's Haste+Chain+Execute reads Rogue), but nothing yet
    // wore Witch Doctor's curse-stacking identity specifically.
    // Hexmother layers TWO debuffs into its own 3-step cycle instead
    // of the one-attack-one-debuff shape every other debuff unit
    // (Stormwing/Rootfang/Runeveil/Frostbind) uses - poisons, then
    // weakens the same target on consecutive actions, so a focused
    // enemy ends up rotting AND hitting softer at once. No new engine
    // code - both debuffs already exist and the debuff-movePattern
    // shape already supports back-to-back entries.
  }),
  wispkeeper: unit("wispkeeper", "Wispkeeper", "heart", 3, "support", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 4 },
  ], {
    // The first Cleric - reuses Rally (rallyAdjacent, first built for
    // Ashenhorn's Strength aura, already reused for Glimmerward's Ward
    // aura) a third time, granting Revive instead: adjacent allies get
    // a second life at battle start, never Wispkeeper itself
    // (rallyAdjacent explicitly skips self in every use so far) - a
    // support that protects its neighbors, not its own hide. Zero new
    // engine code.
    rallyAdjacent: { id: "revive", amount: 1 },
  }),
  trueshot: unit("trueshot", "Trueshot", "spark", 3, "dps", [{ type: "attack", amount: 6 }], {
    // The first Hunter - a precision tracker rather than a blaster:
    // knight's-leap targeting (bypasses shielding, same as Knight's
    // Leap) finds Execute's bonus damage against a wounded target
    // wherever it's hiding on the field, instead of only whoever's
    // frontmost. Combines two already-proven mechanisms (attackPattern
    // + Execute) in one identity rather than adding a new one.
    attackPattern: "knight",
    passive: [{ type: "applyBuff", id: "execute", amount: 3 }],
  }),
  motley: unit("motley", "Motley", "moonGlyph", 2, "hybrid", [
    { type: "attack", amount: 5 },
    { type: "block", amount: 4 },
    { type: "debuff", id: "weak", amount: 1, target: "target" },
  ], {
    // The first Jester, and the roster's first PLAYER unit with
    // moveSelect: "weightedRandom" instead of "sequence" (previously
    // only enemies/the boss rolled their next move rather than cycling
    // it deterministically) - genuinely unpredictable WHICH of its 3
    // moves comes up next, while each individual move still resolves
    // through the same deterministic math as everything else (no dice
    // roll on damage, just on move order) - chaos in sequencing, not
    // in outcome, matching Marc's "easy to play but hard to master".
    moveSelect: "weightedRandom",
  }),
  thornwarden: unit("thornwarden", "Thornwarden", "root", 2, "dps", [{ type: "attack", amount: 6 }], {
    // The first Bruiser ("saa voimaa vahingoittumisesta" - gains power
    // from being damaged) - WoundedFury's first UNIT-level source
    // (previously only Fenrir's Commander squadPassive granted it).
    // Unconditional out the gate like every WoundedFury carrier, but
    // only actually pays off once Thornwarden is already hurt (below
    // 50% HP) - a real risk/reward tank-adjacent DPS identity, not
    // just a flat number.
    passive: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
  }),
  bloomcaller: unit("bloomcaller", "Bloomcaller", "leaf", 3, "support", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // The first Buffer ("kasvattaa liittolaisten voimaa" - grows
    // allies' power) - reuses Rally a fourth time, but grants Execute
    // to adjacent allies instead of Strength (Ashenhorn) or Ward
    // (Glimmerward)/Revive (Wispkeeper) - a fresh combination of two
    // already-proven mechanisms rather than a new one. Whoever stands
    // next to Bloomcaller finishes wounded enemies faster.
    rallyAdjacent: { id: "execute", amount: 2 },
  }),
  mosswalker: unit("mosswalker", "Mosswalker", "moonGlyph", 2, "support", [{ type: "attack", amount: 4 }], {
    // The first Evasion class ("väistelee ja katoaa taistelusta" -
    // dodges and vanishes from battle) - deliberately NOT a dodge-
    // chance/miss-chance roll (Marc's own "easy to play but hard to
    // master" - a coin flip isn't a build decision). Ward already
    // means exactly "this hit doesn't land" in fully deterministic
    // terms, so Mosswalker grants itself 2 stacks at battle start -
    // the third unit-level Ward source (after Thornguard/Glimmerward),
    // "vanishing" from up to 2 hits' worth of danger instead of one.
    passive: [{ type: "applyBuff", id: "ward", amount: 2 }],
  }),
  ironbark: unit("ironbark", "Ironbark", "shield", 2, "tank", [
    { type: "block", amount: 7 },
    { type: "attack", amount: 4 },
  ], {
    // The first Tank ("kestää vahinkoa ja suojelee muita" - endures
    // damage and protects others) - Taunt at battle start, same
    // mechanism Stoneheart's passive already proved, on its own
    // uncommon-tier unit rather than only existing at rare (Stoneheart)
    // - a cheaper, earlier entry point into the same "draw the fire"
    // role.
    passive: [{ type: "applyBuff", id: "taunt", amount: 1 }],
  }),
  briarblade: unit("briarblade", "Briarblade", "root", 3, "dps", [{ type: "attack", amount: 10 }], {
    // The first Assassin ("iskee heikkoihin kohteisiin" - strikes weak
    // targets) - Chain's second unit-level source (after Grimtusk),
    // with a heavier single hit (10, vs Grimtusk's 9+9 split across two
    // moves) to read as one devastating strike rather than a sustained
    // beatdown - kill the frontmost, the blade is already moving on to
    // whoever's left standing.
    chainDamage: 5,
  }),
  sapkeeper: unit("sapkeeper", "Sapkeeper", "leaf", 2, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 3 },
  ], {
    // The first Healer/Support ("parantaa ja jakaa resursseja" - heals
    // and shares resources) - rallyHeal (autoBattleEngine.js's
    // resolveRound), mending Chebyshev-adjacent allies every round
    // instead of a battle-start grant (which would be a no-op - see
    // the field's own comment in the unit() helper). The first repeat-
    // ing positional effect in the roster, versus Rally's one-time
    // battle-start grants.
    rallyHeal: 2,
  }),
  mycelist: unit("mycelist", "Mycelist", "leaf", 3, "support", [
    { type: "attack", amount: 4 },
    { type: "debuff", id: "poison", amount: 2, target: "target" },
    { type: "attack", amount: 4 },
  ], {
    // The last of Marc's 12 base classes - Mycelist ("sieniverkosto
    // levittää efektejä" - a fungal network spreads effects). Spore
    // Spread (sporeSpread) is a genuinely new mechanic, not a reuse -
    // whenever Mycelist's own debuff step poisons its target, the
    // infection also seeds onto a second living enemy in the same
    // action, so one cast can start rotting two targets rather than
    // one. Rootfang/Venomous Edge/Hexmother all still only poison
    // whoever they directly hit - Mycelist is the roster's first
    // Poison source that spreads on its own.
    sporeSpread: true,
  }),
  // Not shop-recruitable (summonOnly excludes it from rollShop/
  // reforgeUnit's pools) - exists only to be spawned by Beastcaller's
  // summon field. Deliberately modest (half a common-tier unit's HP,
  // one plain attack) since it's a free bonus body on top of whatever
  // Beastcaller itself already costs - see the summon field's own
  // comment in the unit() helper for why this can't be full-strength.
  "spirit-wolf": unit("spirit-wolf", "Spirit Wolf", "wolf", 0, "dps", [
    { type: "attack", amount: 3 },
  ], {
    maxHpOverride: 16,
    summonOnly: true,
  }),
  // Beastcaller ("kutsuu avukseen metsän henkiolentoja" - calls forest
  // spirit-creatures to its aid) - the last of the 12 base classes,
  // and the one that needed genuinely new architecture rather than
  // reuse: `summon` (units.js opts) adds a real second unit to
  // state.playerUnits at battle start instead of a stat buff, see
  // autoBattleEngine.js's startAutoBattle. Kept to plain attacks itself
  // (no Chain/Haste/etc layered on) since the summoned Spirit Wolf is
  // already a second body's worth of value on top of one recruit.
  beastcaller: unit("beastcaller", "Beastcaller", "leaf", 3, "support", [
    { type: "attack", amount: 5 },
    { type: "attack", amount: 5 },
  ], {
    summon: { defId: "spirit-wolf" },
  }),
  // Plain roster reinforcements - all 12 base classes are covered
  // already, so these just add more bodies at common/uncommon tier
  // rather than a new archetype, reusing Chain/Rally exactly as
  // Grimtusk/Ashenhorn already established rather than inventing
  // anything new.
  foxfire: unit("foxfire", "Foxfire", "fox", 1, "dps", [
    { type: "attack", amount: 4 },
    { type: "attack", amount: 4 },
  ], {
    // Chain (autoBattleEngine.js's actSide), scaled down from
    // Grimtusk's rare-tier 6 to a common-tier 3 - same finishing-blow
    // payoff, proportionally smaller at a cheaper recruit cost.
    chainDamage: 3,
  }),
  loamguard: unit("loamguard", "Loamguard", "root", 2, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // Rally (autoBattleEngine.js's startAutoBattle), same mechanism
    // Ashenhorn already established - grants adjacent allies Strength
    // at battle start, not itself.
    rallyAdjacent: { id: "strength", amount: 1 },
  }),
  willowfang: unit("willowfang", "Willowfang", "spark", 2, "dps", [{ type: "attack", amount: 5 }], {
    // Haste (autoBattleEngine.js's actSide), same mechanism Swiftclaw
    // already established - two smaller hits a round instead of one
    // big one.
    haste: true,
  }),
  cragmoss: unit("cragmoss", "Cragmoss", "leaf", 3, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    // rallyHeal (autoBattleEngine.js's resolveRound), same mechanism
    // Sapkeeper already established - a second, tankier unit built
    // around mending adjacent allies every round instead of just once.
    rallyHeal: 2,
  }),
  // Cleanse (effects.js) - Sunder's mirror, the roster's first tool
  // against its OWN negative statuses (Poison/Weak/Vulnerable/Stun)
  // instead of an enemy's positive ones. Willowmend cleanses itself
  // every cycle before healing and attacking - a real answer to a
  // long Poison/Weak fight instead of just outlasting it.
  willowmend: unit("willowmend", "Willowmend", "leaf", 2, "support", [
    { type: "cleanse" },
    { type: "heal", amount: 4 },
    { type: "attack", amount: 4 },
  ]),
  sparrowthorn: unit("sparrowthorn", "Sparrowthorn", "spark", 1, "dps", [{ type: "attack", amount: 6 }]),
  duskwren: unit("duskwren", "Duskwren", "spark", 1, "dps", [
    { type: "attack", amount: 5 },
    { type: "attack", amount: 3 },
  ]),
  rimefang: unit("rimefang", "Rimefang", "moonGlyph", 2, "dps", [{ type: "attack", amount: 7 }], {
    // Chain (autoBattleEngine.js's actSide), same mechanism Grimtusk/
    // Foxfire already established - a bonus hit on a different living
    // enemy when this unit's own attack lands the killing blow.
    chainDamage: 4,
  }),
  hollowquill: unit("hollowquill", "Hollowquill", "rune", 2, "dps", [
    { type: "attack", amount: 8 },
  ]),
  // Shatter (effects.js) - a genuinely new mechanic, Execute's mirror:
  // bonus damage against a target currently holding Block instead of
  // one below an HP threshold. Stoneknoll is the first unit built
  // around it, rewarding a squad that keeps pressing a defensive
  // enemy instead of waiting out its Block.
  stoneknoll: unit("stoneknoll", "Stoneknoll", "shield", 2, "dps", [{ type: "attack", amount: 6 }], {
    passive: [{ type: "applyBuff", id: "shatter", amount: 3 }],
  }),
  quarrywarden: unit("quarrywarden", "Quarrywarden", "shield", 2, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // Rally (autoBattleEngine.js's startAutoBattle), same mechanism
    // Ashenhorn/Glimmerward/Wispkeeper/Bloomcaller already established
    // - a fourth id through that same door, granting Shatter to
    // adjacent allies at battle start instead of Strength/Ward/Revive/
    // Execute.
    rallyAdjacent: { id: "shatter", amount: 2 },
  }),
  // Regen (effects.js's tickRegen) - a genuinely new mechanic this
  // round: a decaying heal-over-time stack, Poison's mirror on the
  // support side. Fernwake is the first unit built around it, spreading
  // it to its neighbors at battle start instead of only healing itself
  // every cycle the way Willowmend/Cragmoss already do.
  fernwake: unit("fernwake", "Fernwake", "leaf", 2, "support", [
    { type: "heal", amount: 3 },
    { type: "attack", amount: 3 },
  ], {
    rallyAdjacent: { id: "regen", amount: 2 },
  }),
  duskbramble: unit("duskbramble", "Duskbramble", "root", 1, "dps", [{ type: "attack", amount: 6 }]),
  hollowmere: unit("hollowmere", "Hollowmere", "shield", 2, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 4 },
  ]),
  thistlemaw: unit("thistlemaw", "Thistlemaw", "spark", 1, "dps", [
    { type: "attack", amount: 4 },
    { type: "attack", amount: 4 },
  ]),
  brackenveil: unit("brackenveil", "Brackenveil", "leaf", 2, "hybrid", [
    { type: "block", amount: 4 },
    { type: "heal", amount: 3 },
    { type: "attack", amount: 3 },
  ]),
  briarkit: unit("briarkit", "Briarkit", "root", 1, "dps", [{ type: "attack", amount: 5 }], {
    // Chain (autoBattleEngine.js's actSide) - a cheap, common-tier
    // source of the mechanic, previously only on 2-cost+ units
    // (Rimefang/Grimtusk/Foxfire).
    chainDamage: 3,
  }),
  hollowspire: unit("hollowspire", "Hollowspire", "leaf", 3, "support", [
    { type: "heal", amount: 5 },
    { type: "attack", amount: 5 },
  ], {
    // rallyHeal (autoBattleEngine.js's resolveRound) - the roster's
    // first RARE-tier mender (Willowmend/Sapkeeper/Cragmoss are all
    // common/uncommon), so a squad leaning support has a real high-roll
    // target in the late shop, not just early picks.
    rallyHeal: 3,
  }),
  // Sunder (effects.js) - the roster's first PLAYER-side source. Every
  // enemy debuff already has a player-side mirror (Cleanse answers
  // Poison/Weak/Vulnerable/Stun), but Sunder itself had only ever run
  // enemy -> player (Witherfang). Thornwisp turns it around: a
  // movePattern move, same shape Willowmend's own "cleanse" move
  // already established, just targeting the enemy instead of the self.
  thornwisp: unit("thornwisp", "Thornwisp", "root", 2, "dps", [
    { type: "sunder" },
    { type: "attack", amount: 5 },
  ]),
  mosshollow: unit("mosshollow", "Mosshollow", "shield", 1, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 3 },
  ]),
  // Marc: "enemies and bosses need to be more challenging" - the enemy
  // side got noticeably tougher (Deepwarden/Thornmaw/Spacemonkey bumps,
  // The Hollow Court) without a matching answer on the player side.
  // Hollowveil is the roster's first RARE-tier self-Ward source (Ember
  // Charm-style items/relics already grant it to any unit, but no unit
  // carries it as a built-in passive at this tier) - a real defensive
  // pick against the newly-elevated burst.
  hollowveil: unit("hollowveil", "Hollowveil", "shield", 3, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "applyBuff", id: "ward", amount: 2 }],
  }),
  // Sunder's second unit source, and its first at rare tier - Thornwisp
  // (2-cost/uncommon) already turns the mechanic around onto the
  // enemy side, but the new self-buffed minibosses/gauntlet (Ironmaw,
  // Stonewake, Deepwarden) all lean on Strength/Ward stacks a single
  // uncommon-tier Sunder can only chip at slowly. Ashcaller hits
  // harder AND stays on the same "sunder then attack" rhythm.
  ashcaller: unit("ashcaller", "Ashcaller", "root", 3, "dps", [
    { type: "sunder" },
    { type: "attack", amount: 8 },
  ]),
  // A common-tier Poison-debuff unit - Rootfang/Hexmother/Mycelist
  // (all 3-cost) were the only ones, so Fungal Spore Sac/Mycotic Bloom
  // (PR #278) had no cheap unit to pair with early in a run.
  witherkit: unit("witherkit", "Witherkit", "root", 1, "dps", [
    { type: "attack", amount: 4 },
    { type: "debuff", id: "poison", amount: 2, target: "target" },
  ]),
  stormveil: unit("stormveil", "Stormveil", "moonGlyph", 2, "dps", [{ type: "attack", amount: 6 }], {
    // Chain (autoBattleEngine.js's actSide), same mechanism Rimefang/
    // Grimtusk/Foxfire already established - a plain uncommon-tier
    // source, cost point variety alongside Briarkit's common-tier one.
    chainDamage: 3,
  }),
  // Spirit tribe density (synergies.js) - flagged as notably smaller
  // than every other tribe (5 base units vs. 10-28), confirmed as a
  // genuinely smaller design space rather than a mistagging bug (the
  // peer session cross-referenced every Ward/Revive/summon carrier
  // against its tag - all correct). Adding real new members instead of
  // force-tagging existing ones. Palefen is a cheaper Mosswalker
  // (self-Ward-as-evasion, common instead of uncommon tier); Mistveil
  // is a cheaper Wraithcaller (Lifesteal, uncommon instead of rare).
  palefen: unit("palefen", "Palefen", "moonGlyph", 1, "dps", [{ type: "attack", amount: 4 }], {
    passive: [{ type: "applyBuff", id: "ward", amount: 1 }],
  }),
  mistveil: unit("mistveil", "Mistveil", "moonGlyph", 2, "support", [{ type: "attack", amount: 5 }], {
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 1 } }],
  }),
  // Closing 2 real gaps left in Spirit's own roster, not just density:
  // the tribe still had zero Taunt and zero Shatter sources, despite
  // both mechanics being common elsewhere - every other tribe has at
  // least one aggro-drawing tank. Wraithguard fills that role slot
  // (Spirit's roles were tank/hybrid/support x3/dps before this -
  // heavily support-skewed with only Wraithbriar holding the line).
  wraithguard: unit("wraithguard", "Wraithguard", "moonGlyph", 3, "tank", [
    { type: "block", amount: 8 },
    { type: "attack", amount: 6 },
  ], {
    // Taunt via passive `applyBuff`, same battle-start-once shape
    // Stoneheart already established (holds for the whole fight,
    // not a repeating trigger) - a spectral guardian standing between
    // the rest of the squad and whatever's attacking it.
    passive: [{ type: "applyBuff", id: "taunt", amount: 1 }],
  }),
  nightveil: unit("nightveil", "Nightveil", "moonGlyph", 2, "dps", [{ type: "attack", amount: 7 }], {
    // Shatter's first Spirit-tribe source (Stoneknoll/Quarrywarden
    // were Warden-tribe) - punishes an enemy still braced behind
    // Block instead of waiting it out, the same identity Stoneknoll
    // established at the same cost tier.
    passive: [{ type: "applyBuff", id: "shatter", amount: 3 }],
  }),
  // Hybrid is the roster's thinnest role by far (5 units against
  // 15-43 for every other role) and only ever touched 4 of the 6
  // tribes (Thorn x2, Spirit, Root, Grove) - Warden and Fang had zero
  // hybrid representation. Closing both gaps at once, each anchored
  // to its own tribe's existing identity (Warden's Bastion: Block;
  // Fang's Mark: Execute) rather than a generic attack+block filler.
  stoneknit: unit("stoneknit", "Stoneknit", "shield", 2, "hybrid", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // Warden's first Regen source - a different defensive identity
    // from Stoneheart's pure block-and-hold: mends steadily instead
    // of just soaking hits, so it keeps contributing even through a
    // fight that outlasts its own Block pool.
    passive: [{ type: "applyBuff", id: "regen", amount: 3 }],
  }),
  snareclaw: unit("snareclaw", "Snareclaw", "sword", 2, "hybrid", [
    { type: "attack", amount: 5 },
    { type: "block", amount: 4 },
  ], {
    // Fang's first hybrid, and its first Execute source outside
    // Duskclaw/Trueshot (both pure dps) - braces behind Block, then
    // its own attack lands harder against an already-wounded target,
    // same Execute math those two already established just at a
    // hybrid's lower per-hit baseline.
    passive: [{ type: "applyBuff", id: "execute", amount: 2 }],
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
    rallyHeal: base.rallyHeal ? Math.round(base.rallyHeal * 1.4) : null,
    chainDamage: base.chainDamage ? Math.round(base.chainDamage * 1.4) : null,
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
    rallyHeal: def.rallyHeal ? Math.round(def.rallyHeal * factor) : null,
    chainDamage: def.chainDamage ? Math.round(def.chainDamage * factor) : null,
  }
}

export const UNITS = { ...BASE_UNITS, ...TIER2_UNITS }
