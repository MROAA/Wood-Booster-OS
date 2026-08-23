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
    // Active Power (Battlegrounds/Guildrun-style "hero power," on top
    // of the always-on squadPassive above): spent once per shop visit
    // (runEngine.js's activateCommanderPower), queued and applied to the
    // whole squad at the START of the very next battle only, same
    // effect shape squadPassive already uses. Tommy's is a bigger,
    // one-fight-only version of his own always-on Strength buff -
    // "opening strike," matching "always looking for the fast opening."
    activePower: {
      id: "opening-strike",
      name: "Opening Strike",
      cost: 3,
      description: "Next battle only: the whole squad strikes noticeably harder.",
      effects: [{ type: "applyBuff", id: "strength", amount: 2 }],
    },
  },
  aatos: {
    id: "aatos",
    name: "Aatos",
    art: "reindeer",
    maxHp: 66,
    tagline: "Steady and patient - built to outlast a fight.",
    description: "Steady Hooves: every unit heals 3 at the start of each round.",
    startEffects: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } },
    ],
    // Block, then heal, then attack - the tankiest Commander (66 HP,
    // highest of the 4), matching "built to outlast a fight" as a real
    // fighting unit, not just a passive.
    movePattern: [
      { type: "block", amount: 5 },
      { type: "heal", amount: 4 },
      { type: "attack", amount: 4 },
    ],
    // Marc: "the game needs to be way more challenging" - the difficulty
    // ramp this pushed to (runEngine.js's difficultyFactorForNode)
    // exposed a real structural issue for sustain identities specifically:
    // a FLAT heal/block amount loses relative value as enemy damage
    // scales up, in a way a burst/offense identity (Tommy's Strength
    // buff) doesn't - a stress test at the new curve showed Aatos
    // cratering hardest of the 4. Bumped 2 -> 3 (matching the
    // description text above) to give the sustain identity a real
    // floor against the new late-run damage, not a full rebalance.
    squadPassive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
    // Rally Cry: an extra turnStart heal for the next battle only, on
    // top of Aatos's always-on one - NOT a flat one-time heal (units
    // always start a fight at full HP, the exact bug this same trigger
    // shape already fixed once for Mosswarden's Charm/Purifying Bloom -
    // see relics.js/items.js), same addTrigger pattern applied up front
    // instead of rediscovering the mistake.
    activePower: {
      id: "rally-cry",
      name: "Rally Cry",
      cost: 3,
      description: "Next battle only: the whole squad mends a little more each round.",
      effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
    },
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
    // Blood Oath: a bigger, one-fight-only dose of Fenrir's own signature
    // status - "the fight gets worse for you the longer it goes",
    // deliberately spent on a single decisive battle rather than diluted
    // across the whole run.
    activePower: {
      id: "blood-oath",
      name: "Blood Oath",
      cost: 3,
      description: "Next battle only: the whole squad hits harder, and harder still once hurt.",
      // Marc: "make it challenging but fair" - a fairness stress test
      // (this session's difficulty ramp + tribes/relics/Market Level
      // all layered on top of each other) resurfaced the same
      // WoundedFury-is-conditional gap this exact matchup already hit
      // once before (see squadPassive's own note above): a purely
      // conditional bonus underperforms Tommy's guaranteed flat one in
      // a long autobattle, especially now that the late-run difficulty
      // ramp adds more incoming damage a wounded squad has to survive
      // before Wounded Fury even starts paying off. Added the same
      // flat Strength component Opening Strike/Rally Cry/Brace all
      // already lead with, so Blood Oath has a guaranteed floor too,
      // not just an upside that depends on getting hurt first.
      effects: [
        { type: "applyBuff", id: "strength", amount: 1 },
        { type: "applyBuff", id: "woundedFury", amount: 2 },
      ],
    },
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
    // (originally 2) as a conservative starting point since full damage
    // prevention could plausibly outperform an equal-sized heal
    // point-for-point; stress-tested against the other 3 below before
    // shipping, not guessed at. Bumped to 3 alongside Aatos's own heal
    // (same note, same reason) once the higher difficulty ramp exposed
    // the same problem for a flat Block amount: it's worth relatively
    // less as enemy damage per hit scales up, unlike Tommy's Strength
    // buff which doesn't lose value the same way.
    squadPassive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
    // Brace: an extra one-time Ward stack for the next battle only -
    // "never takes a hit it didn't plan for," a single fully-prevented
    // hit on top of the always-on repeating Block. Repo was still the
    // weakest Commander (64% at n=25, vs. 88-96% for the other 3) even
    // after the squadPassive bump above - Brace alone (a single-hit
    // Ward, nothing else) was thinner than every other Commander's now
    // 2-effect active power (Tommy/Fenrir both pair a flat buff with
    // their signature status). Added Shatter+2, matching Repo's own
    // "exploit the opening" identity (his passive already carries
    // Shatter) instead of copying another Commander's flavor - Brace
    // now both prevents a hit AND rewards punishing a braced enemy.
    activePower: {
      id: "brace",
      name: "Brace",
      cost: 3,
      description: "Next battle only: the whole squad shrugs off one extra hit, and strikes deeper against a braced target.",
      effects: [
        { type: "applyBuff", id: "ward", amount: 1 },
        { type: "applyBuff", id: "shatter", amount: 2 },
      ],
    },
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
