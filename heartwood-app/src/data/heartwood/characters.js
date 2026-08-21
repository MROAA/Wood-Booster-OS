// Heartwood Trial - playable characters, now "Commanders" in the
// autobattler. Spacemonkey is the final boss (see enemies.js), and
// Tommy/Aatos/Fenrir are the player's options.
//
// `squadPassive` is what autoBattleEngine.js actually applies - once
// per deployed unit at battle start, same applyEffects/addTrigger
// machinery a unit's own passive already uses (see units.js). Aatos's
// and Fenrir's translate straight over from their old single-hero
// startEffects (a turnStart heal and a conditional damage buff both
// mean exactly the same thing applied to a whole squad). Tommy's old
// "draw 1 extra card" has no equivalent without a hand of cards, so his
// squad passive is a new, thematically-consistent stand-in instead - a
// small universal damage buff for his "always looking for the fast
// opening" identity. `startEffects` is kept as-is, unused, in case the
// turn-based engine is ever revived.
export const CHARACTERS = {
  tommy: {
    id: "tommy",
    name: "Tommy",
    art: "cat",
    maxHp: 60,
    tagline: "Agile and quick - always looking for the fast opening.",
    description: "Cat's Reflexes: every unit in the squad strikes a little harder.",
    startEffects: [{ type: "draw", amount: 1 }],
    squadPassive: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  aatos: {
    id: "aatos",
    name: "Aatos",
    art: "reindeer",
    maxHp: 66,
    tagline: "Steady and patient - built to outlast a fight.",
    description: "Steady Hooves: every unit heals 2 at the start of each round.",
    startEffects: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } },
    ],
    squadPassive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } }],
  },
  fenrir: {
    id: "fenrir",
    name: "Fenrir",
    art: "wolf",
    maxHp: 56,
    tagline: "Dangerous when hurt - the fight gets worse for you the longer it goes.",
    description: "Wounded Fury: every unit hits harder, and harder still below 50% HP.",
    startEffects: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
    // Wounded Fury alone is a conditional bonus (only pays off once a
    // unit is already hurt), so in a long multi-round autobattle it
    // barely contributed compared to Aatos's unconditional every-round
    // heal - found via a 4-run stress test where Aatos won 4/4 and
    // Fenrir lost 4/4 at the same fight. Added a flat Strength buff so
    // Fenrir has a comparable always-on baseline, same as Tommy's,
    // while keeping the "even worse once you're hurt" identity as the
    // extra layer on top rather than the only effect.
    squadPassive: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "applyBuff", id: "woundedFury", amount: 1 },
    ],
  },
}
