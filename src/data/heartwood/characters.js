// Heartwood Trial - playable characters. Replaces "Spacemonkey is the
// player" from the MVP: Spacemonkey is now the final boss (see
// enemies.js / the plan's own-later-round note on the AI-voiced boss
// fight), and Tommy/Aatos/Fenrir are what the player controls.
//
// Each has one signature effect applied once at battle start, via the
// same applyEffects/addTrigger machinery a Power card already uses -
// no new engine mechanism needed for two of the three. `startEffects`
// runs after the opening hand is drawn.

export const CHARACTERS = {
  tommy: {
    id: "tommy",
    name: "Tommy",
    art: "cat",
    maxHp: 60,
    tagline: "Agile and quick - always looking for the fast opening.",
    description: "Cat's Reflexes: draw 1 extra card on your first turn.",
    startEffects: [{ type: "draw", amount: 1 }],
  },
  aatos: {
    id: "aatos",
    name: "Aatos",
    art: "reindeer",
    maxHp: 66,
    tagline: "Steady and patient - built to outlast a fight.",
    description: "Steady Hooves: heal 2 at the start of each of your turns.",
    startEffects: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } },
    ],
  },
  fenrir: {
    id: "fenrir",
    name: "Fenrir",
    art: "wolf",
    maxHp: 56,
    tagline: "Dangerous when hurt - the fight gets worse for you the longer it goes.",
    description: "Wounded Fury: below 50% HP, your attacks deal +3 damage.",
    startEffects: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
  },
}
