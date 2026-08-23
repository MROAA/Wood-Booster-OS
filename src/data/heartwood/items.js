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
export const ITEM_SLOTS = 3

export const ITEMS = {
  "twig-charm": {
    id: "twig-charm",
    name: "Twig Charm",
    icon: "shield",
    cost: 1,
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
  "ember-charm": {
    id: "ember-charm",
    name: "Ember Charm",
    icon: "flame",
    cost: 2,
    description: "This unit strikes a little harder, all fight.",
    // Ember Core (relics.js), single-target instead of squad-wide.
    effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  "bark-plating": {
    id: "bark-plating",
    name: "Bark Plating",
    icon: "shield",
    cost: 2,
    description: "This unit shrugs off the first real hit it takes, once.",
    // Aegis Ward (relics.js), single-target.
    effects: [{ type: "applyBuff", id: "ward", amount: 1 }],
  },
  "sapmend-vial": {
    id: "sapmend-vial",
    name: "Sapmend Vial",
    icon: "leaf",
    cost: 2,
    description: "This unit mends a little at the start of each round.",
    // Mosswarden's Charm (relics.js), single-target.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } }],
  },
  "venomed-fang": {
    id: "venomed-fang",
    name: "Venomed Fang",
    icon: "leaf",
    cost: 3,
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
    cost: 2,
    description: "Whatever strikes this unit gets struck back.",
    // Bramble Ward (relics.js), single-target.
    effects: [{ type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 2 } }],
  },
  "duelists-edge": {
    id: "duelists-edge",
    name: "Duelist's Edge",
    icon: "sword",
    cost: 3,
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
    cost: 2,
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
    cost: 2,
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
    cost: 2,
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
    cost: 2,
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
    cost: 3,
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
    cost: 3,
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
    cost: 3,
    description: "This unit turns to mending the squad instead of holding the line.",
    bendsRoleTo: "support",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
  },
  "bloodroot-fang": {
    id: "bloodroot-fang",
    name: "Bloodroot Fang",
    icon: "flame",
    cost: 3,
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
    cost: 3,
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
    cost: 3,
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
    cost: 3,
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
    cost: 3,
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
    cost: 3,
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
    cost: 3,
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
    cost: 2,
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
    cost: 3,
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
    cost: 3,
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
    cost: 3,
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
    cost: 2,
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
    cost: 2,
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
    cost: 3,
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
    cost: 3,
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
    cost: 3,
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
}

// Rarity (Marc: "tehdään harvinaisuus systeemi peliin ja siihen
// liittyville" - make a rarity system for the game and related
// things) - derived from cost the same way units.js's tierFromCost
// already works, applied once here instead of repeating a `tier:`
// field by hand on every entry above.
const ITEM_TIER_BY_COST = { 1: "common", 2: "uncommon", 3: "rare" }
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
