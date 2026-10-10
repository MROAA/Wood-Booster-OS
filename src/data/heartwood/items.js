// Item icon art (this round's own pass through Marc's kuvia-folder art
// reference, same "curate from what's already saved" approach the
// unit portraits used across their own several rounds) - only items
// with a plausible icon-style match get one; the rest keep def.icon's
// existing SVG glyph (ItemCard.jsx's def.image-vs-glyph branch). These
// render tiny (26x26px, .hw-item-card .hw-card-art) so a busy scene
// photo wouldn't read - every source here is cropped tight around a
// single object (a vial, a charm, a blade) rather than a whole scene.
import bloodrootFangImg from "../../assets/heartwood/items/bloodroot-fang.jpg"
import bramblehideStandardImg from "../../assets/heartwood/items/bramblehide-standard.jpg"
import bulwarksMercyImg from "../../assets/heartwood/items/bulwarks-mercy.jpg"
import cleansingDraughtImg from "../../assets/heartwood/items/cleansing-draught.jpg"
import hexrootVialImg from "../../assets/heartwood/items/hexroot-vial.jpg"
import mossboundChainImg from "../../assets/heartwood/items/mossbound-chain.jpg"
import mossdropVialImg from "../../assets/heartwood/items/mossdrop-vial.jpg"
import wraithfangCharmImg from "../../assets/heartwood/items/wraithfang-charm.jpg"
import barkPlatingImg from "../../assets/heartwood/items/bark-plating.jpg"
import emberrootTalismanImg from "../../assets/heartwood/items/emberroot-talisman.jpg"
import chillingGripImg from "../../assets/heartwood/items/chilling-grip.jpg"
import wanderersLedgerImg from "../../assets/heartwood/items/wanderers-ledger.jpg"
import sapmendVialImg from "../../assets/heartwood/items/sapmend-vial.jpg"
import wardstitchCloakImg from "../../assets/heartwood/items/wardstitch-cloak.jpg"
import mendleafCharmImg from "../../assets/heartwood/items/mendleaf-charm.jpg"
import duelistsEdgeImg from "../../assets/heartwood/items/duelists-edge.jpg"
import fungalSporeSacImg from "../../assets/heartwood/items/fungal-spore-sac.jpg"
import wardensSigilImg from "../../assets/heartwood/items/wardens-sigil.jpg"
import crackingFistImg from "../../assets/heartwood/items/cracking-fist.jpg"
import recklessVowImg from "../../assets/heartwood/items/reckless-vow.jpg"
// New items below (Marc: "kayta kuvia kansiosta vapaasti ja jos
// mahdollista niin luot unitteja/itemeita kuville" - use the folder's
// images freely and, where possible, create items FOR the images) -
// these 6 didn't match any existing item, but were clean enough
// leftover icon-style objects (a crystal, a crown, a lantern, a
// talisman) to build a brand-new item around instead of going unused.
import crimsonShardImg from "../../assets/heartwood/items/crimson-shard.jpg"
import thornbackCrownImg from "../../assets/heartwood/items/thornback-crown.jpg"
import gloamingShardImg from "../../assets/heartwood/items/gloaming-shard.jpg"
import runeboundCofferImg from "../../assets/heartwood/items/runebound-coffer.jpg"
import wayfarersTalismanImg from "../../assets/heartwood/items/wayfarers-talisman.jpg"
import glowmossLanternImg from "../../assets/heartwood/items/glowmoss-lantern.jpg"
import { COLLARS } from "./collars"

// Heartwood - Items: per-UNIT gear, distinct from Relics (relics.js,
// squad-wide) and Upgrade (units.js, a flat level-based stat scale
// with no player choice in what it does). Each bench unit gets
// ITEM_SLOTS equip slots (see runEngine.js's equipItem/unequipItem);
// an item's `effects` apply only to whichever unit has it equipped,
// at battle start, via the exact same self-targeting applyEffects
// mechanism a unit's own passive/a relic/the Commander's squadPassive
// already use (see autoBattleEngine.js's startAutoBattle) - so an
// item is really just a smaller, single-target echo of an existing
// relic, not a new engine mechanic. Bought with Essence (runEngine.js's
// buyItem) into a shared owned bag, then equipped/unequipped for free
// (same "commit Essence once, rearrange freely after" shape a bench
// unit's formation slot already has).
//
// Essence rescale (units.js's TIER_COST comment has the full
// explanation - Marc's "market level up = 250 Essence" ask, scaled
// 62.5x from every old constant): every item below used to cost a
// literal 1, 2, or 3 depending on its tier - those become 65/125/190
// below (same values as units.js's TIER_COST, so a "rare" anything
// costs the same 190 whether it's a unit, an item, or a relic).
// Rounded to the 50/100/150/200 family (Marc, round numbers): item buy
// costs are now 100/150/200 by tier (units.js's TIER_COST recruit
// costs rounded to 50/100/150 instead - buy vs. recruit intentionally
// diverge in Marc's table).
// Gear sprint: every hero (and the Commander) has a ROW of 5 gear slots.
// Any item fits any slot - the ORDER is the puzzle (adjacency, recipes;
// see services/heartwood/gear.js). Old saves' slots 0-2 stay valid.
export const ITEM_SLOTS = 5

export const ITEMS = {
  "twig-charm": {
    id: "twig-charm",
    name: "Twig Charm",
    icon: "shield",
    cost: 100,
    // A near-verbatim duplicate of Stonebound Charm's own description
    // ("grows a little bark") went unnoticed until a text-match pass -
    // same words, different power level (2 Block here vs. 3 at 2 cost)
    // reading identical in the shop was a real "can't tell these apart
    // without checking the cost number" gap. "A sprig" reads smaller
    // than "bark," matching the actual difference in effect.
    description: "This hero grows a sprig of bark at the start of each round.",
    // Polish pass: every item shipped at 2-3 cost, so the rarity
    // system's own "common" band (ITEM_TIER_BY_COST's own 1 -> common
    // entry, below) had zero actual items in it - the tier spread
    // existed in code but was never populated. A cheaper Stonebound
    // Charm (2 -> 1 cost, 3 -> 2 Block) rather than a one-time
    // battle-start grant - resolveRound resets ALL player Block to 0
    // at the top of every round, including round 1, so a flat
    // `{type: "block"}` effect applied at battle start would be a
    // complete no-op before any enemy even attacks (the exact bug
    // Mosswarden's Charm's own comment already documents catching -
    // caught here before shipping by re-reading that comment, not
    // discovered via testing this specific item).
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }],
  },
  "mossdrop-vial": {
    id: "mossdrop-vial",
    name: "Mossdrop Vial",
    icon: "leaf",
    image: mossdropVialImg,
    cost: 100,
    description: "This hero mends a trickle at the start of each round.",
    // Common tier still had only ONE item (Twig Charm) - real variety
    // gap for a Market Level 1 shop, which can only ever offer this
    // tier. Same "cheaper, smaller version of an existing 2-cost item"
    // pattern Twig Charm itself established, applied to Sapmend Vial
    // (2 cost, heal 2/round) this time instead of another Block item -
    // covers the OTHER defensive archetype (sustain, not mitigation)
    // rather than just duplicating Twig Charm's own niche. Strength-
    // based items don't downscale the same way (a flat +1 buff has no
    // smaller non-zero value to shrink to without either being a
    // no-op or exactly duplicating Ember Charm at a lower price - a
    // real "why would you ever buy the 2-cost one" trap), so this
    // round covers heal instead of offense; a common-tier offense item
    // is still an open gap, worth a dedicated look rather than forcing
    // an awkward fit here.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 1 } }],
  },
  "hunters-mark": {
    id: "hunters-mark",
    name: "Hunter's Mark",
    icon: "sword",
    cost: 100,
    description: "This hero finishes a wounded enemy a little faster.",
    // Common tier's first OFFENSE item, closing the gap Mossdrop Vial's
    // own comment flagged - flat Strength buffs (Ember Charm, +1)
    // genuinely can't downscale below their own minimum without either
    // being a no-op or an exact, cheaper duplicate, but Execute is
    // conditional (effects.js's woundedFury mirror - only matters once
    // the TARGET is already below 30% HP) and stack-scaled like
    // Strength IS, not flat-or-nothing - a smaller Execute+1 here is a
    // real, honest downscale of Duelist's Edge's own Execute+3 (3 cost),
    // same relationship Twig Charm/Mossdrop Vial already have to their
    // own 2-cost counterparts, not a duplicate at a cheaper price.
    effects: [{ type: "applyBuff", id: "execute", amount: 1 }],
  },
  "ember-charm": {
    id: "ember-charm",
    name: "Ember Charm",
    icon: "flame",
    cost: 150,
    description: "This hero strikes a little harder, all fight.",
    // Ember Core (relics.js), single-target instead of squad-wide.
    effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  "bark-plating": {
    id: "bark-plating",
    name: "Bark Plating",
    icon: "shield",
    image: barkPlatingImg,
    cost: 150,
    description: "This hero shrugs off the first real hit it takes, once.",
    // Aegis Ward (relics.js), single-target.
    effects: [{ type: "applyBuff", id: "ward", amount: 1 }],
  },
  "sapmend-vial": {
    id: "sapmend-vial",
    name: "Sapmend Vial",
    icon: "leaf",
    image: sapmendVialImg,
    cost: 150,
    description: "This hero mends a little at the start of each round.",
    // Mosswarden's Charm (relics.js), single-target.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } }],
  },
  "venomed-fang": {
    id: "venomed-fang",
    name: "Venomed Fang",
    icon: "leaf",
    cost: 200,
    description: "Whatever this hero strikes carries poison after.",
    // Venomous Edge (relics.js), single-target.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 },
      },
    ],
  },
  "thorned-bracer": {
    id: "thorned-bracer",
    name: "Thorned Bracer",
    icon: "root",
    cost: 150,
    description: "Whatever strikes this hero gets struck back.",
    // Bramble Ward (relics.js), single-target.
    effects: [{ type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 2 } }],
  },
  "duelists-edge": {
    id: "duelists-edge",
    name: "Duelist's Edge",
    icon: "sword",
    image: duelistsEdgeImg,
    cost: 200,
    description: "This hero finishes a badly wounded enemy faster.",
    // Culling Strike (relics.js), single-target - the first ITEM-level
    // source of Execute, alongside the relic (squad-wide) and Duskclaw/
    // Trueshot (baked into one specific unit's own kit). Lets a player
    // choose WHICH recruited unit becomes their finisher instead of
    // being stuck with whatever unit happens to have Execute built in -
    // a real placement/build decision, not just another flat stat.
    effects: [{ type: "applyBuff", id: "execute", amount: 3 }],
  },
  "chilling-grip": {
    id: "chilling-grip",
    name: "Chilling Grip",
    icon: "moonGlyph",
    image: chillingGripImg,
    cost: 150,
    description: "Whatever this hero strikes hits softer after, in return.",
    // Frostbrand (relics.js), single-target - Weak's first item-level
    // source, closing the same "every mechanic gets both a relic and a
    // more targeted source" pattern Execute/Poison/Ward already have.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 },
      },
    ],
  },
  "cleansing-draught": {
    id: "cleansing-draught",
    name: "Cleansing Draught",
    icon: "leaf",
    image: cleansingDraughtImg,
    cost: 150,
    description: "This hero shakes off a lingering ailment at the start of each round.",
    // Purifying Bloom (relics.js), single-target - lets a player put
    // Cleanse specifically on whichever unit is most likely to eat a
    // debuff (a frontline tank, say) instead of only getting it
    // squad-wide via the relic or baked into Willowmend's own kit.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } }],
  },
  "stonebound-charm": {
    id: "stonebound-charm",
    name: "Stonebound Charm",
    icon: "shield",
    cost: 150,
    description: "This hero grows a little bark at the start of each round.",
    // Bark Ward (relics.js), single-target - lets a player put the
    // repeating Block on specifically the unit standing in the front
    // slot, instead of only squad-wide.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
  },
  "feral-charm": {
    id: "feral-charm",
    name: "Feral Charm",
    icon: "flame",
    cost: 150,
    description: "This hero fights harder once it's badly hurt.",
    // Berserker's Oath (relics.js), single-target - lets a player put
    // Wounded Fury specifically on a tanky frontline unit likely to
    // spend real time below half HP, instead of only squad-wide.
    effects: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
  },
  "wardens-sigil": {
    id: "wardens-sigil",
    name: "Warden's Sigil",
    icon: "shield",
    image: wardensSigilImg,
    cost: 200,
    description: "This hero draws every eye.",
    // Taunt's first item-level source - Bulwark Standard (relics.js)
    // already grants it to whichever deployed unit happens to have the
    // highest maxHp, and Ironbark/Stoneheart carry it baked into their
    // own kit, but neither lets a player deliberately choose which
    // specific recruited unit becomes the squad's designated target.
    // Same "give the player the choice" motivation as Duelist's Edge/
    // Feral Charm.
    effects: [{ type: "applyBuff", id: "taunt", amount: 1 }],
  },
  "cracking-fist": {
    id: "cracking-fist",
    name: "Cracking Fist",
    icon: "sword",
    image: crackingFistImg,
    cost: 200,
    description: "This hero strikes deeper against a target that's still braced.",
    // Quarrybreak (relics.js), single-target - lets a player put
    // Shatter specifically on their heaviest hitter instead of only
    // squad-wide.
    effects: [{ type: "applyBuff", id: "shatter", amount: 3 }],
  },

  // Bending items (Guildrun's "hero bending" - Marc: "saman idean
  // haluan heartwoodiin kuin Guildrunissa", confirmed as the one
  // mechanic he explicitly wanted pulled in by name, then again after
  // seeing the first 4 land: "tykkään hero bending ajatuksesta mennään
  // sillä... se on hyvä ja helposti toteutettava muotti" - "I like the
  // hero bending idea, let's go with it, it's a good and easy mold to
  // build"): unlike every item above, which only adds a stat/status, a
  // Bending item also carries `bendsRoleTo` - equipping one visibly
  // overwrites the unit's displayed role (UnitCard.jsx's card-accent
  // color/role label) to match, on top of granting a role-appropriate
  // effect package. A tank that picks up Wardstitch Cloak visibly
  // becomes support-colored on its own card, not just a stronger tank
  // - "the build reshapes who this unit IS," not just what it can
  // survive. Rare tier (3 Essence) across the board - a role change is
  // a bigger build swing than any stat item above.
  //
  // 6 total now (2 per the most contested roles, support/dps) - real
  // Guildrun-style "hero bending" means more than one PATH to the same
  // broad role, not just one fixed recipe: Wardstitch Cloak bends
  // toward a heal-support (Grove-flavored), Hexroot Vial bends toward
  // a curse-support instead (Root-flavored) - same destination role,
  // different identity. Same split for dps: Bloodroot Fang is a
  // burst-finisher (Strength+Execute), Wraithfang Charm is a
  // sustain-drainer instead (Vulnerable+Lifesteal, Spirit-flavored).
  // Tank/hybrid stay at one each for now - still a first pass, not an
  // exhaustive system.
  "wardstitch-cloak": {
    id: "wardstitch-cloak",
    name: "Wardstitch Cloak",
    icon: "leaf",
    image: wardstitchCloakImg,
    cost: 200,
    description: "This hero turns to mending the squad instead of holding the line.",
    bendsRoleTo: "support",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
  },
  "bloodroot-fang": {
    id: "bloodroot-fang",
    name: "Bloodroot Fang",
    icon: "flame",
    image: bloodrootFangImg,
    cost: 200,
    description: "This hero turns aggressive, hunting for the finishing blow.",
    bendsRoleTo: "dps",
    effects: [
      { type: "applyBuff", id: "strength", amount: 2 },
      { type: "applyBuff", id: "execute", amount: 2 },
    ],
  },
  "mossbound-chain": {
    id: "mossbound-chain",
    name: "Mossbound Chain",
    icon: "shield",
    image: mossboundChainImg,
    cost: 200,
    description: "This hero turns to holding the line, drawing every eye.",
    bendsRoleTo: "tank",
    effects: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } },
      { type: "applyBuff", id: "taunt", amount: 1 },
    ],
  },
  "wanderers-ledger": {
    id: "wanderers-ledger",
    name: "Wanderer's Ledger",
    icon: "moonGlyph",
    image: wanderersLedgerImg,
    cost: 200,
    description: "This hero turns versatile, ready for whatever the fight needs.",
    bendsRoleTo: "hybrid",
    effects: [
      { type: "applyBuff", id: "ward", amount: 1 },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 1 } },
    ],
  },
  "hexroot-vial": {
    id: "hexroot-vial",
    name: "Hexroot Vial",
    icon: "root",
    image: hexrootVialImg,
    cost: 200,
    description: "This hero turns to rot and ruin instead of raw defense - every strike lingers.",
    bendsRoleTo: "support",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } },
    ],
  },
  "wraithfang-charm": {
    id: "wraithfang-charm",
    name: "Wraithfang Charm",
    icon: "moonGlyph",
    image: wraithfangCharmImg,
    cost: 200,
    description: "This hero turns bloodthirsty instead of blunt - every strike weakens its target and mends the wound.",
    bendsRoleTo: "dps",
    effects: [
      // target: "target" is required on the Vulnerable half - applyBuff
      // defaults an omitted target to ctx.actorId (self), which would
      // weaken the wearer instead of whoever it just struck (the same
      // guard Chilling Grip/Mycelist's sporeSpread already needed).
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 } },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 2 } },
    ],
  },
  // Closing out the last 2 roles (tank, hybrid) to the same 2-paths-
  // per-role shape support/dps already got - Marc: "i like the idea of
  // having tribes in the game and hero bending", confirmed enough to
  // keep deepening this specific system rather than spreading thin.
  "thornhide-ward": {
    id: "thornhide-ward",
    name: "Thornhide Ward",
    icon: "leaf",
    cost: 200,
    description: "This hero turns evasive instead of unyielding - hits simply don't land, rather than being weathered.",
    bendsRoleTo: "tank",
    // A second, distinct path to "tank" from Mossbound Chain's Block+
    // Taunt aggro-tank: Ward cancels a hit outright rather than
    // absorbing it, and carries no Taunt - this tank survives by not
    // being hit as hard rather than by drawing every hit onto itself,
    // same real design fork Thornguard (Ward, no Taunt) vs. Stoneheart
    // (Block+Taunt) already establishes at the unit level.
    effects: [{ type: "applyBuff", id: "ward", amount: 2 }],
  },
  "emberroot-talisman": {
    id: "emberroot-talisman",
    name: "Emberroot Talisman",
    icon: "flame",
    image: emberrootTalismanImg,
    cost: 200,
    description: "This hero turns opportunistic - braces for a hit, then strikes twice as hard once it lands.",
    bendsRoleTo: "hybrid",
    // A second, distinct path to "hybrid" from Wanderer's Ledger's
    // passive Ward+heal (survive-anything generalist): an aggressive-
    // defensive hybrid instead - Block to actually get hit, Shatter to
    // punish whoever's still braced when it swings back.
    effects: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
      { type: "applyBuff", id: "shatter", amount: 2 },
    ],
  },
  "mendleaf-charm": {
    id: "mendleaf-charm",
    name: "Mendleaf Charm",
    icon: "heart",
    image: mendleafCharmImg,
    cost: 150,
    description: "This hero knits itself back together over the fight's first few rounds.",
    // Heartsbloom Seed (relics.js), single-target - lets a player put
    // Regen (effects.js's tickRegen) specifically on the unit most
    // likely to eat repeated hits, instead of only squad-wide.
    effects: [{ type: "applyBuff", id: "regen", amount: 3 }],
  },
  "sundermaw-fang": {
    id: "sundermaw-fang",
    name: "Sundermaw Fang",
    icon: "root",
    cost: 200,
    description: "Whatever this hero strikes loses its own strongest edge.",
    // Sunder's first ITEM source (effects.js's sunder - strips a
    // target's strongest SUNDERABLE_IDS buff). Thornwisp/Ashcaller
    // (units.js) are still the only unit-level sources; this lets a
    // player put the mechanic on a DIFFERENT recruited unit's own
    // attacks instead, same "give the player the choice" motivation
    // Duelist's Edge/Warden's Sigil already established for Execute/
    // Taunt. Rare tier - stripping a stack every hit, not just once
    // per fight, is a strong, repeatable answer to the newly-elevated
    // self-buffed minibosses (Ironmaw, Stonewake, Deepwarden).
    effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "sunder", target: "target" } }],
  },
  "frostbite-fang": {
    id: "frostbite-fang",
    name: "Frostbite Fang",
    icon: "moonGlyph",
    cost: 200,
    description: "Whatever this hero strikes seizes up, unable to act next round.",
    // Stun's first ITEM source (autoBattleEngine.js decrements a
    // unit's stun stack by 1 and skips its whole turn whenever it's
    // acting) - Frostbind (units.js) was still the roster's ONLY
    // player-side source, a specific unit's own kit rather than
    // something any recruited unit could carry, same gap Sunder had
    // before Sundermaw Fang. Rare tier, same as that item - skipping
    // an enemy's entire turn is a strong effect even applied once
    // (Frostbind's own comment already says so, and keeps its base
    // damage low as the tradeoff for it); on a DIFFERENT unit's every
    // hit it's stronger still, same "item version can out-proc the
    // dedicated unit's own kit" tradeoff Sundermaw Fang already
    // established for Sunder. Deliberately no squad-wide relic
    // version yet: unlike Sunder (which only strips one buff stack),
    // every hit in the squad chaining Stun onto the same focused
    // target could permanently lock an enemy out of acting for an
    // entire fight - a real balance risk worth a dedicated look
    // before shipping, not something to guess at in a routine round.
    effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "stun", target: "target", amount: 1 } }],
  },
  "cascading-claw": {
    id: "cascading-claw",
    name: "Cascading Claw",
    icon: "sword",
    cost: 200,
    description: "Whatever this hero finishes off, it strikes again at someone else.",
    // Chain's first ITEM source (autoBattleEngine.js's actSide) -
    // previously the only mechanic on the roster with no item/relic
    // path at all, since `chainDamage` lived purely as a raw def field
    // (Rimefang/Grimtusk/Foxfire's own baked-in kit), not part of the
    // generic effects/powers vocabulary every other mechanic already
    // goes through. `applyBuff id: "chainDamage"` now ADDS to a unit's
    // own built-in chain instead of replacing it - a unit that already
    // has Chain gets even more from equipping this, same "stacks
    // rather than overrides" precedent Ember Charm/Strength already
    // follows. Self-limiting the same way Chain always has been (only
    // fires on an actual killing blow), so unlike Stun, safe to give a
    // squad-wide relic version too (see Cascading Wound, relics.js).
    effects: [{ type: "applyBuff", id: "chainDamage", amount: 4 }],
  },
  "fungal-spore-sac": {
    id: "fungal-spore-sac",
    name: "Fungal Spore Sac",
    icon: "leaf",
    image: fungalSporeSacImg,
    cost: 150,
    description: "Whatever this hero poisons, it poisons someone standing nearby too.",
    // Spore Spread's first ITEM source (autoBattleEngine.js's actSide -
    // `acting.powers.sporeSpread`, checked as a boolean flag the same
    // "any positive stack counts" shape Taunt/Ward already use). Only
    // matters for a unit whose own movePattern already applies Poison
    // (Rootfang, Hexmother, Mycelist itself) - lets a player extend
    // Mycelist's own signature trick onto a DIFFERENT poison-carrying
    // unit instead of it staying locked to one specific class.
    effects: [{ type: "applyBuff", id: "sporeSpread", amount: 1 }],
  },
  "bloodfen-ring": {
    id: "bloodfen-ring",
    name: "Bloodfen Ring",
    icon: "flame",
    cost: 150,
    description: "This hero fights harder the deeper its own wounds go.",
    // Wounded Fury's 2nd unit-level source (alongside Feral Charm) -
    // same "give the player the choice" motivation Sundermaw Fang/
    // Cascading Claw already established for their own mechanics: a
    // player who already has Feral Charm on one unit can put this on a
    // SECOND unit likely to spend real time below half HP, instead of
    // the mechanic being capped at one item per squad.
    effects: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
  },
  "quarrystrike-gauntlet": {
    id: "quarrystrike-gauntlet",
    name: "Quarrystrike Gauntlet",
    icon: "sword",
    cost: 200,
    description: "This hero hits harder, and hardest of all against a target still braced.",
    // Strength + Shatter together on one item - both stack numerically
    // (unlike Wounded Fury/Taunt's flat, non-stacking shape), so this
    // is a real combined power spike on whichever unit wears it, not
    // just two separate small bonuses. Same dual-mechanic idea Wyrmgall
    // (a miniboss, Execute + Shatter) already proved works as a real
    // build identity, brought down to item scale.
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "applyBuff", id: "shatter", amount: 2 },
    ],
  },
  "reckless-vow": {
    id: "reckless-vow",
    name: "Reckless Vow",
    icon: "sword",
    image: recklessVowImg,
    cost: 200,
    description: "This hero finishes a badly wounded enemy faster, and shrugs off the first real hit while it hunts.",
    // Execute + Ward together - a "glass cannon insurance" identity:
    // Ward's own stack count is a real hit-absorption counter, not a
    // flat boolean (2 stacks shrugs off 2 hits, not just "protected
    // once"), so it stacks meaningfully the same way Execute's own
    // finishing-blow bonus does. Lets an aggressive Execute-focused
    // unit survive long enough to actually land the kill instead of
    // dying to the one hit that would have stopped it first.
    effects: [
      { type: "applyBuff", id: "execute", amount: 3 },
      { type: "applyBuff", id: "ward", amount: 1 },
    ],
  },
  "bulwarks-mercy": {
    id: "bulwarks-mercy",
    name: "Bulwark's Mercy",
    icon: "heart",
    image: bulwarksMercyImg,
    cost: 200,
    description: "This hero shrugs off the first real hit it takes, and mends over the fight's first few rounds.",
    // Regen + Ward together - a pure survivability identity for a
    // frontline unit: Ward cancels the first real hit outright, Regen
    // undoes whatever gets through after. Distinct from Bark Plating's
    // own single Ward (this adds sustain on top) and Mendleaf Charm's
    // own single Regen (this adds a full hit-cancel on top).
    effects: [
      { type: "applyBuff", id: "ward", amount: 1 },
      { type: "applyBuff", id: "regen", amount: 3 },
    ],
  },
  "bramblehide-standard": {
    id: "bramblehide-standard",
    name: "Bramblehide Standard",
    icon: "shield",
    image: bramblehideStandardImg,
    cost: 200,
    description: "This hero draws every eye, and fights harder the deeper its own wounds go.",
    // Taunt + Wounded Fury together - the same bruiser identity this
    // round's own new mook, Bramblespite, established: a tank that
    // both draws every single-target attack AND hits back harder once
    // wounded, letting a player deliberately build ONE unit into that
    // role instead of it only existing on the enemy side. Neither
    // mechanic stacks numerically beyond "present" (same flat shape
    // Wardens Sigil/Feral Charm already have alone), but the pairing
    // is still real value - one item slot doing what used to take two.
    effects: [
      { type: "applyBuff", id: "taunt", amount: 1 },
      { type: "applyBuff", id: "woundedFury", amount: 1 },
    ],
  },
  "ashclaw-fang": {
    id: "ashclaw-fang",
    name: "Ashclaw Fang",
    icon: "sword",
    cost: 200,
    description: "This hero strikes a little harder, and whatever it strikes loses its own strongest edge.",
    // Strength + Sunder together - an aggressive anti-buff identity:
    // every hit both deals more damage AND strips whatever the target
    // is leaning on (Ward/Revive/Taunt/Execute/Shatter/Strength, same
    // priority order Sundermaw Fang already established), instead of
    // needing two separate items to get both effects onto one unit.
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "sunder", target: "target" } },
    ],
  },
  "cripplebite-fang": {
    id: "cripplebite-fang",
    name: "Cripplebite Fang",
    icon: "sword",
    cost: 200,
    description: "Whatever this hero strikes hits softer after, and takes worse hits in return.",
    // Weak + Vulnerable together - the last unpaired combo of the 3
    // core debuffs at the item/relic level. Enemy mooks already cover
    // all 3 pairings (Duskgnaw: Weak+Vulnerable, Hollowspite: Poison+
    // Weak, Duskwither: Poison+Vulnerable), and Witherspite Crown
    // (relics.js) already paired Poison+Weak for the player, but no
    // item or relic had combined Weak+Vulnerable until now. Unlike the
    // Poison pairings, this one hits both sides of dealDamage's own
    // formula at once (effects.js: Weak shrinks the target's own
    // future damage 0.75x, Vulnerable inflates damage IT takes 1.25x)
    // rather than compounding a flat DOT - a pure "make this specific
    // threat stop mattering" pick instead of a damage-race one.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 },
      },
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 },
      },
    ],
  },

  // Build-diversity round (Marc: "the game needs to be more diverse to
  // play") - 4 new items, each mirrored by a squad-wide relic below.
  // Two close asymmetric gaps (a combo that existed as an item but
  // never a relic, or vice versa); two are genuinely new pairings that
  // had never been combined before.
  "witherspite-fang": {
    id: "witherspite-fang",
    name: "Witherspite Fang",
    icon: "leaf",
    cost: 200,
    description: "Whatever this hero strikes carries both rot and weariness after.",
    // Poison + Weak - Witherspite Crown (relics.js) already grants this
    // squad-wide; this was the missing item-level version, letting a
    // player put it on one chosen unit instead of only run-wide.
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } },
    ],
  },
  "thornfen-fang": {
    id: "thornfen-fang",
    name: "Thornfen Fang",
    icon: "flame",
    cost: 200,
    description: "This hero strikes a little harder, and mends off every hit it lands.",
    // Strength + Lifesteal (heal-on-onDealDamage) - a new aggressive-
    // sustain hybrid. Lifesteal previously only existed as Vampiric
    // Bloom (relics.js), alone, never paired with anything - this gives
    // a player a real "hit hard and heal off it" build-around identity,
    // strongest on a unit that already attacks often (Haste, or a
    // multi-target pattern attacker).
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 2 } },
    ],
  },
  "huntclaw-fang": {
    id: "huntclaw-fang",
    name: "Huntclaw Fang",
    icon: "sword",
    cost: 200,
    description: "This hero finishes a badly wounded enemy faster, and strikes again at someone else when it does.",
    // Execute + Chain together - both exist solo (Duelist's Edge/
    // Culling Strike for Execute; Cascading Claw/Cascading Wound for
    // Chain) but had never been paired. A real "finisher squad"
    // identity: Execute makes the kill easier to land, Chain turns
    // that same kill into a second free hit.
    effects: [
      { type: "applyBuff", id: "execute", amount: 2 },
      { type: "applyBuff", id: "chainDamage", amount: 3 },
    ],
  },

  // Kuvia-folder art pass, round 2 (Marc: "kayta kuvia kansiosta
  // vapaasti ja jos mahdollista niin luot unitteja/itemeita kuville" -
  // use the images freely, and where possible make items FOR the
  // images): 6 brand-new items built around leftover icon-style photos
  // that didn't match any existing entry above, rather than leaving
  // good art unused. Every effect here reuses an EXISTING mechanic
  // already proven elsewhere in this file (no new engine work), priced
  // on the same cost/tier ladder every item above already follows -
  // Crimson Shard is common, Thornback Crown a cheaper uncommon Taunt,
  // the rest rare 2-effect combos.
  "crimson-shard": {
    id: "crimson-shard",
    name: "Crimson Shard",
    icon: "leaf",
    image: crimsonShardImg,
    cost: 100,
    // Common tier's first standalone Poison item - every existing
    // Poison source (Venomed Fang, Witherspite Fang) sits at rare, so
    // this is the cheap entry point into the mechanic, same role Twig
    // Charm/Mossdrop Vial/Hunter's Mark already play for Block/Heal/
    // Execute at this tier.
    description: "Whatever this hero strikes carries a faint rot after.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
    ],
  },
  "thornback-crown": {
    id: "thornback-crown",
    name: "Thornback Crown",
    icon: "shield",
    image: thornbackCrownImg,
    cost: 150,
    // A cheaper Taunt than Warden's Sigil's own 190 - same "give the
    // player an earlier price point into a mechanic" downscale Twig
    // Charm/Mossdrop Vial already established for Block/Heal.
    description: "This hero wears its thorns proudly, drawing every eye.",
    effects: [{ type: "applyBuff", id: "taunt", amount: 1 }],
  },
  "gloaming-shard": {
    id: "gloaming-shard",
    name: "Gloaming Shard",
    icon: "moonGlyph",
    image: gloamingShardImg,
    cost: 200,
    // Poison + Vulnerable together - genuinely the last unpaired combo
    // of the 3 core debuffs at the item/relic level (Cripplebite Fang's
    // own comment already closed Weak+Vulnerable and noted Witherspite
    // Fang/Crown already cover Poison+Weak; nothing before this
    // combined Poison+Vulnerable for the player).
    description: "Whatever this hero strikes rots from within, and takes cruelly worse hits after.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 } },
    ],
  },
  "runebound-coffer": {
    id: "runebound-coffer",
    name: "Runebound Coffer",
    icon: "shield",
    image: runeboundCofferImg,
    cost: 200,
    // Ward + Shatter - a new pairing: every existing Shatter combo
    // (Quarrystrike Gauntlet, Emberroot Talisman) pairs it with
    // Strength or repeating Block, never with Ward's own "cancel the
    // first real hit outright" shape.
    description: "This hero shrugs off the first real hit it takes, and strikes deeper against a target still braced.",
    effects: [
      { type: "applyBuff", id: "ward", amount: 1 },
      { type: "applyBuff", id: "shatter", amount: 2 },
    ],
  },
  "wayfarers-talisman": {
    id: "wayfarers-talisman",
    name: "Wayfarer's Talisman",
    icon: "shield",
    image: wayfarersTalismanImg,
    cost: 200,
    // Taunt + Ward - the "pure tank" combo: Mossbound Chain already
    // pairs Taunt with repeating Block instead, and Wanderer's Ledger
    // already pairs Ward with heal - this is the first item to combine
    // Taunt with Ward's own hit-cancel instead.
    description: "This hero draws every eye, and shrugs off the first real hit while it holds the line.",
    effects: [
      { type: "applyBuff", id: "taunt", amount: 1 },
      { type: "applyBuff", id: "ward", amount: 1 },
    ],
  },
  "glowmoss-lantern": {
    id: "glowmoss-lantern",
    name: "Glowmoss Lantern",
    icon: "heart",
    image: glowmossLanternImg,
    cost: 200,
    // Regen + Cleanse - a pure sustain identity: Mendleaf Charm's own
    // Regen and Cleansing Draught's own Cleanse had never been
    // combined onto one item before.
    description: "This hero knits itself back together, and shakes off whatever ails it, every round.",
    effects: [
      { type: "applyBuff", id: "regen", amount: 2 },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } },
    ],
  },

  // --- Elemental-status items (the depth round) ----------------------
  // A single-target entry point for each new status, so a squad that
  // isn't built around an elemental tribe can still splash one in.
  // Same "smaller echo of a relic" shape every item above already has.
  "stoneskin-band": {
    id: "stoneskin-band",
    name: "Stoneskin Band",
    icon: "stone",
    cost: 100,
    description: "This hero carries a sliver of permanent armour that turns aside part of every hit.",
    effects: [{ type: "applyBuff", id: "bulwark", amount: 1 }],
  },
  "windstep-charm": {
    id: "windstep-charm",
    name: "Windstep Charm",
    icon: "gale",
    cost: 100,
    description: "This hero slips aside from the first hit that would land on it.",
    effects: [{ type: "applyBuff", id: "evade", amount: 1 }],
  },
  "tidewrack-vial": {
    id: "tidewrack-vial",
    name: "Tidewrack Vial",
    icon: "tide",
    cost: 100,
    description: "Whatever this hero strikes hits back a little softer afterward.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "dampen", target: "target", amount: 1 } },
    ],
  },
  "emberbrand-oil": {
    id: "emberbrand-oil",
    name: "Emberbrand Oil",
    icon: "ember",
    cost: 100,
    description: "Whatever this hero strikes is left burning.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 2 } },
    ],
  },
  "starlit-shard": {
    id: "starlit-shard",
    name: "Starlit Shard",
    icon: "cosmic",
    cost: 150,
    description: "This hero grows a little stronger with every passing round.",
    effects: [{ type: "applyBuff", id: "ascendant", amount: 1 }],
  },
  "glacier-fang": {
    id: "glacier-fang",
    name: "Glacier Fang",
    icon: "stone",
    cost: 200,
    // Bulwark + Shatter - armour that also punishes an enemy for
    // turtling behind Block.
    description: "This hero shrugs part of every hit aside, and cuts deeper into anything hiding behind Block.",
    effects: [
      { type: "applyBuff", id: "bulwark", amount: 1 },
      { type: "applyBuff", id: "shatter", amount: 2 },
    ],
  },
  "cyclone-edge": {
    id: "cyclone-edge",
    name: "Cyclone Edge",
    icon: "gale",
    cost: 200,
    // Evade + Strength - the Gale identity in one item: dodge a hit,
    // and hit back harder.
    description: "This hero slips the first blow and answers with a heavier one.",
    effects: [
      { type: "applyBuff", id: "evade", amount: 1 },
      { type: "applyBuff", id: "strength", amount: 1 },
    ],
  },
  "pyre-edge": {
    id: "pyre-edge",
    name: "Pyre Edge",
    icon: "ember",
    cost: 200,
    // Burn-on-hit + Execute - a finisher that leaves a fire behind.
    description: "Whatever this hero strikes burns, and burns worse the closer it is to falling.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 2 } },
      { type: "applyBuff", id: "execute", amount: 1 },
    ],
  },

  // --- Elemental combo items (2026-09-07, "lisää sisältöä") ---------
  // The mechanics-depth round added single-mechanic elemental items at
  // common (Stoneskin Band / Windstep Charm / Tidewrack Vial /
  // Emberbrand Oil / Starlit Shard) and a few rares - but the uncommon
  // (150) band had almost no elemental options. These 5 sit there as
  // two-status combos, plus one common ward item. No `image` -
  // ItemCard.jsx falls back to the `icon` glyph.
  "emberflow-oil": {
    id: "emberflow-oil",
    name: "Emberflow Oil",
    icon: "ember",
    cost: 150,
    description: "This hero's strikes leave a burn, and it knits itself back a little each round.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 1 } },
      { type: "applyBuff", id: "regen", amount: 1 },
    ],
  },
  "tidestone-band": {
    id: "tidestone-band",
    name: "Tidestone Band",
    icon: "stone",
    cost: 150,
    description: "This hero carries a sliver of permanent armour, and what it strikes hits back softer.",
    effects: [
      { type: "applyBuff", id: "bulwark", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "dampen", target: "target", amount: 1 } },
    ],
  },
  "galeheart-charm": {
    id: "galeheart-charm",
    name: "Galeheart Charm",
    icon: "gale",
    cost: 150,
    description: "This hero slips the first blow each round, and mends a trickle as the fight goes on.",
    effects: [
      { type: "applyBuff", id: "evade", amount: 1 },
      { type: "applyBuff", id: "regen", amount: 1 },
    ],
  },
  "voidfang-edge": {
    id: "voidfang-edge",
    name: "Voidfang Edge",
    icon: "shadow",
    cost: 150,
    description: "This hero's strikes poison, and it finishes a badly wounded enemy faster.",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
      { type: "applyBuff", id: "execute", amount: 1 },
    ],
  },
  "starbound-shard": {
    id: "starbound-shard",
    name: "Starbound Shard",
    icon: "cosmic",
    cost: 200,
    description: "This hero grows stronger with every round the fight lasts, and its strikes leave a burn.",
    effects: [
      { type: "applyBuff", id: "ascendant", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 1 } },
    ],
  },
  "wardknot-charm": {
    id: "wardknot-charm",
    name: "Wardknot Charm",
    icon: "shield",
    cost: 100,
    description: "This hero shrugs off the first real hit, and grows a sprig of bark each round after.",
    effects: [
      { type: "applyBuff", id: "ward", amount: 1 },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
    ],
  },
  // Mana step 1: CONSUMABLE mana potions. Equip one on a hero; in a
  // tactics fight that hero can drink it (1 AP) to restore mana (extra
  // spills into Overcharge). Drunk = gone from your bag after the fight.
  // No auto-battle effect (`effects` empty).
  "mana-draught": {
    id: "mana-draught",
    name: "Mana Draught",
    icon: "tide",
    image: hexrootVialImg,
    cost: 100,
    consumable: true,
    description: "Consumable: in a fight, this hero can drink it (1 AP) to restore 25 mana. Used up once drunk.",
    effects: [],
    mana: { restore: 25 },
  },
  "deepwell-tonic": {
    id: "deepwell-tonic",
    name: "Deepwell Tonic",
    icon: "tide",
    image: mossdropVialImg,
    cost: 150,
    consumable: true,
    description: "Consumable: in a fight, this hero can drink it (1 AP) to restore 45 mana - extra spills into Overcharge. Used up once drunk.",
    effects: [],
    mana: { restore: 45 },
  },

  // --- GEAR SPRINT (Backpack Battles adjacency + resource gear) --------
  // These items work in tactics fights through `fx` (the same number
  // vocabulary mutations use - see services/heartwood/gear.js GEAR_FX):
  //   kind   weapon | offhand | armor | charm | collar (what it is)
  //   tags   ["blade"], ["staff"], ["gem"]... what a neighbour can match
  //   fx     what it gives the wearer
  //   adj    { match: { kind | tag }, bonus: {fx} | boost: % , text }
  //          - a bonus to the wearer while an item it matches sits NEXT
  //            TO it in the hero's gear row (boost = the neighbour's own
  //            numbers grow by that %)
  //   aura   { type: aim | res | noFlank | guard, amount, text } - helps
  //          allies standing next to the wearer on the battle board
  //   res    ["rage", ...] - its resource numbers work in full only on a
  //          hero running that resource (half strength otherwise)
  //   noShop true = only made by a recipe (recipes.js)
  // `effects` stays [] - none of these touch the auto-battle fallback.
  "iron-blade": {
    id: "iron-blade", name: "Iron Blade", icon: "sword", cost: 100, kind: "weapon", tags: ["blade"],
    description: "A plain, honest blade. +1 attack.",
    effects: [], fx: { attack: 1 },
  },
  "bone-dagger": {
    id: "bone-dagger", name: "Bone Dagger", icon: "sword", cost: 100, kind: "weapon", tags: ["blade", "dagger"],
    description: "Light and quick. +1 attack, +5% to hit. Two side by side become Twin Fangs.",
    effects: [], fx: { attack: 1, aim: 5 },
  },
  "oak-staff": {
    id: "oak-staff", name: "Oak Staff", icon: "root", cost: 100, kind: "weapon", tags: ["staff"],
    description: "A walking staff that hums with sap. +5 max resource, +1 resource each turn.",
    effects: [], fx: { manaMax: 5, manaRegen: 1 },
  },
  whetstone: {
    id: "whetstone", name: "Whetstone", icon: "stone", cost: 100, kind: "offhand", tags: ["tool"],
    description: "Next to a blade in the gear row: +2 attack. Next to a plain Iron Blade it grinds it into a Keen Blade.",
    effects: [], fx: {},
    adj: { match: { tag: "blade" }, bonus: { attack: 2 }, text: "+2 attack next to a blade" },
  },
  "mana-gem": {
    id: "mana-gem", name: "Mana Gem", icon: "tide", cost: 100, kind: "offhand", tags: ["gem"],
    description: "+10 max resource. Next to a staff: +2 resource each turn.",
    effects: [], fx: { manaMax: 10 },
    adj: { match: { tag: "staff" }, bonus: { manaRegen: 2 }, text: "+2 resource each turn next to a staff" },
  },
  "herb-pouch": {
    id: "herb-pouch", name: "Herb Pouch", icon: "leaf", cost: 100, kind: "offhand", tags: ["herb"],
    description: "Chewing leaves between blows. Mends 1 HP each turn.",
    effects: [], fx: { regen: 1 },
  },
  "empty-flask": {
    id: "empty-flask", name: "Empty Flask", icon: "tide", cost: 100, kind: "offhand", tags: ["flask"],
    description: "Starts each fight with +15% resource. Next to a Herb Pouch it brews a Healing Draught.",
    effects: [], fx: { manaStartPct: 15 },
  },
  buckler: {
    id: "buckler", name: "Buckler", icon: "shield", cost: 100, kind: "offhand", tags: ["shield"],
    description: "A small round shield. +1 Block at the start of each turn.",
    effects: [], fx: { block: 1 },
  },
  "padded-vest": {
    id: "padded-vest", name: "Padded Vest", icon: "shield", cost: 100, kind: "armor", tags: ["cloth"],
    description: "Quilted and warm. +4 max HP.",
    effects: [], fx: { hp: 4 },
  },
  "lucky-charm": {
    id: "lucky-charm", name: "Lucky Charm", icon: "cosmic", cost: 100, kind: "charm", tags: ["charm"],
    description: "A rabbit's foot, or something like one. +5% to hit.",
    effects: [], fx: { aim: 5 },
  },
  "rune-stone": {
    id: "rune-stone", name: "Rune Stone", icon: "rune", cost: 150, kind: "charm", tags: ["rune"],
    description: "Next to a charm in the gear row: that charm works 50% stronger.",
    effects: [], fx: {},
    adj: { match: { kind: "charm" }, boost: 50, text: "the charm next to it works 50% stronger" },
  },
  "bark-mail": {
    id: "bark-mail", name: "Bark Mail", icon: "shield", cost: 150, kind: "armor", tags: ["bark"],
    description: "Overlapping plates of living bark. +6 max HP, strikes back for 1 when hit.",
    effects: [], fx: { hp: 6, thorns: 1 },
  },
  // Board auras - help the allies standing next to the wearer.
  "war-banner": {
    id: "war-banner", name: "War Banner", icon: "rune", cost: 150, kind: "offhand", tags: ["banner"],
    description: "Aura: allies standing next to this hero get +10% to hit.",
    effects: [], fx: {},
    aura: { type: "aim", amount: 10, text: "+10% to hit for allies next to it" },
  },
  "incense-burner": {
    id: "incense-burner", name: "Incense Burner", icon: "flame", cost: 150, kind: "charm", tags: ["incense"],
    description: "Aura: allies standing next to this hero gain +5 resource at the start of each turn.",
    effects: [], fx: {},
    aura: { type: "res", amount: 5, text: "+5 resource each turn for allies next to it" },
  },
  "watch-lantern": {
    id: "watch-lantern", name: "Watch Lantern", icon: "cosmic", cost: 150, kind: "offhand", tags: ["lantern"],
    description: "Aura: allies standing next to this hero can't be flanked - side and back hits count as front hits.",
    effects: [], fx: {},
    aura: { type: "noFlank", amount: 1, text: "allies next to it can't be flanked" },
  },
  "warding-bell": {
    id: "warding-bell", name: "Warding Bell", icon: "shield", cost: 200, kind: "charm", tags: ["bell"],
    description: "Aura: allies standing next to this hero take 1 less damage from every hit.",
    effects: [], fx: {},
    aura: { type: "guard", amount: 1, text: "allies next to it take 1 less damage per hit" },
  },
  // Resource gear (Mana & Resource PRD's resource modifiers).
  "wellspring-torc": {
    id: "wellspring-torc", name: "Wellspring Torc", icon: "tide", cost: 150, kind: "charm", tags: ["torc"],
    description: "Every time this hero builds resource by playing (hits, focus, guarding...), +2 more.",
    effects: [], fx: { resGain: 2 },
  },
  "focus-lens": {
    id: "focus-lens", name: "Focus Lens", icon: "cosmic", cost: 150, kind: "charm", tags: ["lens"],
    description: "While this hero's resource bar is at least half full: +1 damage and +5% to hit.",
    effects: [], fx: { highAt: 50, highDmg: 1, highAim: 5 },
  },
  "overflow-chalice": {
    id: "overflow-chalice", name: "Overflow Chalice", icon: "tide", cost: 150, kind: "offhand", tags: ["chalice"],
    description: "Resource gained past a full bar is stored (up to 15) and spent as bonus power on the next skill.",
    effects: [], fx: { overflow: 15 },
  },
  "bloodletters-lancet": {
    id: "bloodletters-lancet", name: "Bloodletter's Lancet", icon: "sword", cost: 150, kind: "weapon", tags: ["blade"],
    description: "HP into power: at the start of each turn this hero pays 2 HP (never below 1) for +12 resource. +1 attack.",
    effects: [], fx: { attack: 1, tapHp: 2, tapRes: 12 },
  },
  "ancestor-beads": {
    id: "ancestor-beads", name: "Ancestor Beads", icon: "moonGlyph", cost: 150, kind: "charm", tags: ["beads"], res: ["spirit"],
    description: "Spirit heroes: each summon holds back 5 less Spirit. +10 max resource. (Half strength on other resources.)",
    effects: [], fx: { upkeep: 5, manaMax: 10 },
  },
  "rage-drum": {
    id: "rage-drum", name: "Rage Drum", icon: "flame", cost: 150, kind: "offhand", tags: ["drum"], res: ["rage", "fury"],
    description: "Rage and Fury heroes: +4 resource every time they are hit, and start fights with +25%. (Half strength on other resources.)",
    effects: [], fx: { hurtGain: 4, manaStartPct: 25 },
  },
  "shadow-veil": {
    id: "shadow-veil", name: "Shadow Veil", icon: "shadow", cost: 150, kind: "armor", tags: ["cloth"], res: ["shadow", "combo"],
    description: "Slips the first hit of each fight. Shadow and Combo heroes start fights with +30% resource. (Half on others.)",
    effects: [], fx: { evade: 1, manaStartPct: 30 },
  },
  "quickening-ring": {
    id: "quickening-ring", name: "Quickening Ring", icon: "cosmic", cost: 200, kind: "charm", tags: ["ring"],
    description: "This hero's skills cost 15% less resource.",
    effects: [], fx: { cheaper: 15 },
  },
  // Legendaries (Act IV+ / high market level only).
  "heartwood-crown": {
    id: "heartwood-crown", name: "Heartwood Crown", icon: "root", cost: 300, kind: "charm", tags: ["crown"],
    description: "A crown grown, not made. +6 max HP, +2 attack, +3 resource each turn.",
    effects: [], fx: { hp: 6, attack: 2, manaRegen: 3 },
  },
  "stormcaller-banner": {
    id: "stormcaller-banner", name: "Stormcaller Banner", icon: "gale", cost: 300, kind: "offhand", tags: ["banner"],
    description: "Aura: allies next to this hero get +15% to hit. The bearer gets +1 attack.",
    effects: [], fx: { attack: 1 },
    aura: { type: "aim", amount: 15, text: "+15% to hit for allies next to it" },
  },
  "worldroot-mail": {
    id: "worldroot-mail", name: "Worldroot Mail", icon: "shield", cost: 300, kind: "armor", tags: ["bark"],
    description: "Roots that remember every blow. +12 max HP, strikes back for 2, shrugs off the first hit.",
    effects: [], fx: { hp: 12, thorns: 2, ward: 1 },
  },
  // Recipe results (recipes.js) - never in the shop, only crafted.
  "twin-fangs": {
    id: "twin-fangs", name: "Twin Fangs", icon: "sword", cost: 200, kind: "weapon", tags: ["blade", "dagger"], noShop: true,
    description: "Two daggers, one rhythm. +3 attack, +10% to hit.",
    effects: [], fx: { attack: 3, aim: 10 },
  },
  "keen-blade": {
    id: "keen-blade", name: "Keen Blade", icon: "sword", cost: 200, kind: "weapon", tags: ["blade"], noShop: true,
    description: "Ground to a whisper of an edge. +4 attack, +5% to hit.",
    effects: [], fx: { attack: 4, aim: 5 },
  },
  "healing-draught": {
    id: "healing-draught", name: "Healing Draught", icon: "leaf", cost: 150, kind: "offhand", tags: ["flask", "herb"], noShop: true,
    description: "Sipped between blows. Mends 3 HP each turn and starts fights with +10% resource.",
    effects: [], fx: { regen: 3, manaStartPct: 10 },
  },
  "mana-heart": {
    id: "mana-heart", name: "Mana Heart", icon: "tide", cost: 200, kind: "charm", tags: ["gem"], noShop: true,
    description: "Two gems grown into one beating heart. +25 max resource, +3 resource each turn.",
    effects: [], fx: { manaMax: 25, manaRegen: 3 },
  },
  "wellspring-staff": {
    id: "wellspring-staff", name: "Wellspring Staff", icon: "root", cost: 200, kind: "weapon", tags: ["staff"], noShop: true,
    description: "+15 max resource, +4 resource each turn.",
    effects: [], fx: { manaMax: 15, manaRegen: 4 },
  },
  "grove-censer": {
    id: "grove-censer", name: "Grove Censer", icon: "leaf", cost: 200, kind: "charm", tags: ["incense"], noShop: true,
    description: "Aura: allies next to this hero gain +8 resource each turn. The bearer mends 1 HP each turn.",
    effects: [], fx: { regen: 1 },
    aura: { type: "res", amount: 8, text: "+8 resource each turn for allies next to it" },
  },
  "ironbark-guard": {
    id: "ironbark-guard", name: "Ironbark Guard", icon: "shield", cost: 200, kind: "armor", tags: ["bark", "shield"], noShop: true,
    description: "+8 max HP, +2 Block at the start of each turn.",
    effects: [], fx: { hp: 8, block: 2 },
  },
  "fortune-rune": {
    id: "fortune-rune", name: "Fortune Rune", icon: "rune", cost: 200, kind: "charm", tags: ["rune", "charm"], noShop: true,
    description: "+10% to hit. Next to another charm: that charm works 50% stronger.",
    effects: [], fx: { aim: 10 },
    adj: { match: { kind: "charm" }, boost: 50, text: "the charm next to it works 50% stronger" },
  },
}

// Class Collars (collars.js COLLARS) join the item table as kind "collar".
for (const c of Object.values(COLLARS)) {
  ITEMS[c.id] = { icon: "moonGlyph", cost: 200, effects: [], fx: {}, ...c, kind: "collar", tags: ["collar"], rarity: "epic" }
}

// Rarity (Marc: "tehdään harvinaisuus systeemi peliin ja siihen
// liittyville" - make a rarity system for the game and related
// things) - derived from cost the same way units.js's tierFromCost
// already works, applied once here instead of repeating a `tier:`
// field by hand on every entry above.
// Essence rescale: keys were 1/2/3, now 65/125/190 (this file's own
// header comment) - must stay in lockstep with every `cost:` literal
// above, since tier derivation keys off the exact scaled value.
// Rounded to the 50/100/150/200 family (Marc, round numbers): keys and
// every `cost:` literal above moved 65->100, 125->150, 190->200.
const ITEM_TIER_BY_COST = { 100: "common", 150: "uncommon", 200: "rare" }
// Gear sprint rarity (shop frames + Act/market-level odds): Common / Rare
// / Epic / Legendary. Derived from cost unless an item sets `rarity`.
export const RARITIES = ["common", "rare", "epic", "legendary"]
export const RARITY_INFO = {
  common: { name: "Common", color: "#b9b2a3" },
  rare: { name: "Rare", color: "#5fa8e0" },
  epic: { name: "Epic", color: "#b07ae0" },
  legendary: { name: "Legendary", color: "#f0b23c" },
}
const RARITY_BY_COST = { 100: "common", 150: "rare", 200: "epic", 300: "legendary" }
// What kind of gear an older item is (they predate `kind`): read off its name.
function guessKind(item) {
  const n = item.name || ""
  if (/Edge|Fang|Claw|Fist|Gauntlet|Blade|Dagger/.test(n)) return "weapon"
  if (/Vial|Draught|Tonic|Oil|Sac|Coffer|Ledger|Lantern|Standard/.test(n)) return "offhand"
  if (/Plating|Cloak|Band|Bracer|Ward|Chain|Mercy|Mail|Hide/.test(n)) return "armor"
  return "charm"
}
export const GEAR_KINDS = {
  weapon: { name: "Weapon", icon: "sword" },
  offhand: { name: "Offhand", icon: "shield" },
  armor: { name: "Armor", icon: "stone" },
  charm: { name: "Charm", icon: "cosmic" },
  collar: { name: "Collar", icon: "moonGlyph" },
}
for (const item of Object.values(ITEMS)) {
  item.tier = ITEM_TIER_BY_COST[item.cost] || "rare"
  if (!item.rarity) item.rarity = RARITY_BY_COST[item.cost] || (item.cost > 200 ? "legendary" : "epic")
  if (!item.kind) item.kind = guessKind(item)
  if (!item.tags) item.tags = item.kind === "weapon" && /Edge|Blade|Dagger/.test(item.name) ? ["blade"] : []
}

// What the shop / events / the Gamble can hand out: no recipe-only
// results, no Class Collars (those drop from elites, events, and rarely
// the gear shop's own collar roll).
export function itemPool() {
  return Object.values(ITEMS).filter((i) => !i.noShop && i.kind !== "collar")
}
export function collarPool() {
  return Object.values(ITEMS).filter((i) => i.kind === "collar")
}

// Hero Bending display helper (see the "Bending items" block above):
// the LAST equipped item that carries `bendsRoleTo` wins if more than
// one somehow does (a unit only has ITEM_SLOTS/effectiveItemSlots
// slots, so this is rare, but deterministic beats arbitrary). Purely a
// display concern - combat itself never reads a unit's `role` at all
// (see UnitCard.jsx's ROLE_ACCENT, its only consumer), so bending a
// unit's role doesn't need any autoBattleEngine.js change: the actual
// power comes from the item's own `effects`, applied exactly like any
// other item already is.
export function effectiveRole(baseRole, itemDefIds = []) {
  let role = baseRole
  for (const itemId of itemDefIds) {
    const bend = ITEMS[itemId]?.bendsRoleTo
    if (bend) role = bend
  }
  return role
}
