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
}

export function itemPool() {
  return Object.values(ITEMS)
}
