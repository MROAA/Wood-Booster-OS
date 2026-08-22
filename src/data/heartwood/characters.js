import { scaleEffect } from "./units"

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
    // Marc: "haluan että squadissa on päähahmo, se commander on
    // pelattava hahmo pelissä... jota voi synergisoida buildilla ja
    // itemeillä... jokaisella commanderilla on oma uniikki skill
    // settinsä" (I want the squad to have a main character, the
    // Commander should be a playable character in the game, one that
    // can synergize with the build and items, and each Commander has
    // its own unique skill set) - the Commander now deploys as a real
    // 5th unit (autoBattleEngine.js's COMMANDER_POSITION), reusing the
    // exact movePattern/attackPattern/haste/passive vocabulary every
    // recruited unit already uses, equippable with items the same way.
    // Tommy's own kit is Haste - a second, faster hit every round,
    // matching "always looking for the fast opening" directly.
    movePattern: [{ type: "attack", amount: 6 }],
    haste: true,
    // +1 Strength left Tommy strictly weaker than Fenrir on paper once
    // Fenrir got a second effect layered on top of the same +1 baseline
    // (see Fenrir's note below) - confirmed as a real gap, not just
    // theoretical, via a 12-run stress test through the longer run path
    // (Mist Growler Pack + Bark Brute's Stand added): Tommy won 2/12
    // vs. Aatos/Fenrir's ~50% each. Doubled to +2 so Tommy keeps its
    // simple, unconditional identity (no extra condition like Wounded
    // Fury, just a bigger flat number) while closing the gap.
    squadPassive: [{ type: "applyBuff", id: "strength", amount: 2 }],
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
    // Block, then heal, then attack - the tankiest Commander (66 HP,
    // highest of the 4), matching "built to outlast a fight" as a real
    // fighting unit, not just a passive.
    movePattern: [
      { type: "block", amount: 5 },
      { type: "heal", amount: 4 },
      { type: "attack", amount: 4 },
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
    // A single hard hit, no gimmick of its own - Fenrir's own
    // squadPassive already grants every deployed unit Wounded Fury
    // (himself included, once he's a real deployed unit), so his kit
    // doesn't need to duplicate it. Lowest HP of the 4 (56) on purpose:
    // the glass-cannon shape that makes his own "worse the longer it
    // goes" identity bite on himself too, not just his squad.
    movePattern: [{ type: "attack", amount: 8 }],
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
  repo: {
    id: "repo",
    name: "Repo",
    art: "fox",
    maxHp: 62,
    tagline: "Careful and cunning - never takes a hit it didn't plan for.",
    description: "Fox's Guard: every unit gains Block at the start of each round.",
    startEffects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }],
    // Block then strike, carrying its own Shatter (effects.js) - "never
    // takes a hit it didn't plan for" reads as exploiting an opening
    // rather than raw force, the same identity Shatter already gives
    // Stoneknoll/Cragfang/Quarrywarden.
    movePattern: [
      { type: "block", amount: 4 },
      { type: "attack", amount: 5 },
    ],
    passive: [{ type: "applyBuff", id: "shatter", amount: 2 }],
    // The 4th Commander, a defensive archetype none of the other 3
    // cover directly: Tommy is flat unconditional offense, Aatos is
    // unconditional recovery (heal), Fenrir is offense that gets better
    // the worse things go - Repo is unconditional prevention instead of
    // recovery. Same turnStart-trigger machinery as Aatos, same amount
    // (2) as a conservative starting point since full damage prevention
    // could plausibly outperform an equal-sized heal point-for-point;
    // stress-tested against the other 3 below before shipping, not
    // guessed at.
    squadPassive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }],
  },
}

// Rank-Up: a third Essence sink alongside recruiting/relics/Unit
// Upgrade, but spent on the Commander instead of a bench unit - same
// stacking-level shape and cost curve as Unit Upgrade (units.js) for a
// consistent "spend Essence to permanently strengthen X" pattern
// across the whole run, reusing the same scaleEffect helper so a
// squadPassive scales exactly the way a unit's own passive does.
export const COMMANDER_RANK_MAX = 2
const COMMANDER_RANK_COST = 3

export function commanderRankCost(rank) {
  return rank >= COMMANDER_RANK_MAX ? null : COMMANDER_RANK_COST * (rank + 1)
}

export function commanderPassiveWithRank(character, rank) {
  if (!rank || !character?.squadPassive?.length) return character?.squadPassive || []
  const factor = 1 + rank * 0.25
  return character.squadPassive.map((effect) =>
    effect.type === "addTrigger" ? { ...effect, effect: scaleEffect(effect.effect, factor) } : scaleEffect(effect, factor),
  )
}
