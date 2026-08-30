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
export const ITEM_SLOTS = 3

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
    description: "This unit grows a sprig of bark at the start of each round.",
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
    description: "This unit mends a trickle at the start of each round.",
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
    description: "This unit finishes a wounded enemy a little faster.",
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
    description: "This unit strikes a little harder, all fight.",
    // Ember Core (relics.js), single-target instead of squad-wide.
    effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  "bark-plating": {
    id: "bark-plating",
    name: "Bark Plating",
    icon: "shield",
    image: barkPlatingImg,
    cost: 150,
    description: "This unit shrugs off the first real hit it takes, once.",
    // Aegis Ward (relics.js), single-target.
    effects: [{ type: "applyBuff", id: "ward", amount: 1 }],
  },
  "sapmend-vial": {
    id: "sapmend-vial",
    name: "Sapmend Vial",
    icon: "leaf",
    image: sapmendVialImg,
    cost: 150,
    description: "This unit mends a little at the start of each round.",
    // Mosswarden's Charm (relics.js), single-target.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } }],
  },
  "venomed-fang": {
    id: "venomed-fang",
    name: "Venomed Fang",
    icon: "leaf",
    cost: 200,
    description: "Whatever this unit strikes carries poison after.",
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
    description: "Whatever strikes this unit gets struck back.",
    // Bramble Ward (relics.js), single-target.
    effects: [{ type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 2 } }],
  },
  "duelists-edge": {
    id: "duelists-edge",
    name: "Duelist's Edge",
    icon: "sword",
    image: duelistsEdgeImg,
    cost: 200,
    description: "This unit finishes a badly wounded enemy faster.",
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
    description: "Whatever this unit strikes hits softer after, in return.",
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
    description: "This unit shakes off a lingering ailment at the start of each round.",
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
    description: "This unit grows a little bark at the start of each round.",
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
    description: "This unit fights harder once it's badly hurt.",
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
    description: "This unit draws every eye.",
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
    description: "This unit strikes deeper against a target that's still braced.",
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
    description: "This unit turns to mending the squad instead of holding the line.",
    bendsRoleTo: "support",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
  },
  "bloodroot-fang": {
    id: "bloodroot-fang",
    name: "Bloodroot Fang",
    icon: "flame",
    image: bloodrootFangImg,
    cost: 200,
    description: "This unit turns aggressive, hunting for the finishing blow.",
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
    description: "This unit turns to holding the line, drawing every eye.",
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
    description: "This unit turns versatile, ready for whatever the fight needs.",
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
    description: "This unit turns to rot and ruin instead of raw defense - every strike lingers.",
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
    description: "This unit turns bloodthirsty instead of blunt - every strike weakens its target and mends the wound.",
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
    description: "This unit turns evasive instead of unyielding - hits simply don't land, rather than being weathered.",
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
    description: "This unit turns opportunistic - braces for a hit, then strikes twice as hard once it lands.",
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
    description: "This unit knits itself back together over the fight's first few rounds.",
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
    description: "Whatever this unit strikes loses its own strongest edge.",
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
    description: "Whatever this unit strikes seizes up, unable to act next round.",
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
    description: "Whatever this unit finishes off, it strikes again at someone else.",
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
    description: "Whatever this unit poisons, it poisons someone standing nearby too.",
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
    description: "This unit fights harder the deeper its own wounds go.",
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
    description: "This unit hits harder, and hardest of all against a target still braced.",
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
    description: "This unit finishes a badly wounded enemy faster, and shrugs off the first real hit while it hunts.",
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
    description: "This unit shrugs off the first real hit it takes, and mends over the fight's first few rounds.",
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
    description: "This unit draws every eye, and fights harder the deeper its own wounds go.",
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
    description: "This unit strikes a little harder, and whatever it strikes loses its own strongest edge.",
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
    description: "Whatever this unit strikes hits softer after, and takes worse hits in return.",
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
    description: "Whatever this unit strikes carries both rot and weariness after.",
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
    description: "This unit strikes a little harder, and mends off every hit it lands.",
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
    description: "This unit finishes a badly wounded enemy faster, and strikes again at someone else when it does.",
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
    description: "Whatever this unit strikes carries a faint rot after.",
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
    description: "This unit wears its thorns proudly, drawing every eye.",
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
    description: "Whatever this unit strikes rots from within, and takes cruelly worse hits after.",
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
    description: "This unit shrugs off the first real hit it takes, and strikes deeper against a target still braced.",
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
    description: "This unit draws every eye, and shrugs off the first real hit while it holds the line.",
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
    description: "This unit knits itself back together, and shakes off whatever ails it, every round.",
    effects: [
      { type: "applyBuff", id: "regen", amount: 2 },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } },
    ],
  },
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
for (const item of Object.values(ITEMS)) {
  item.tier = ITEM_TIER_BY_COST[item.cost] || "rare"
}

export function itemPool() {
  return Object.values(ITEMS)
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
