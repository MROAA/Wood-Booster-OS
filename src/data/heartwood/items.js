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
}

export function itemPool() {
  return Object.values(ITEMS)
}
