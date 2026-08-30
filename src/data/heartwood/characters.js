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
    description: "Cat's Reflexes: every unit in the squad strikes a little harder, lands on its feet, and leaves what it hits swinging softer.",
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
    //
    // The DPS-adaptive enemy HP rework (Marc: "enemies needs to be much
    // stronger and scale with the player") lengthened fights across the
    // board (target 3-6 rounds now, was 2-3.5, and no longer capped) -
    // a fresh fairness pass at the new scaling found Tommy specifically
    // collapsed to 44%, the ONE Commander of the 4 with literally zero
    // sustain (no heal, no block, no ward - just Strength). A longer
    // fight means more rounds of incoming damage to survive regardless
    // of how fast the squad kills, and Tommy had nothing to answer
    // that with. Added a small turnStart Block, matching "lands on its
    // feet" - kept deliberately smaller than Repo's own dedicated
    // Block identity (this is a floor against the new fight length,
    // not a second archetype layered onto Tommy's actual "fast
    // opening" one).
    // Marc: "the game needs to be more diverse to play" - Commander
    // kits had converged toward "signature effect + flat Strength
    // floor" across many fairness passes, reading as different flavor
    // on the same shape. Added one small, build-flavoring effect per
    // Commander (reusing only addTrigger/applyBuff shapes already used
    // elsewhere in this file) without touching the existing floor
    // numbers above, which are load-bearing fairness fixes, not
    // filler - verified via a before/after heartwood-fairness-pass.mjs
    // run that no Commander's win rate moved unfairly out of line with
    // the other 3. Tommy: whatever the fast opener hits swings softer
    // after - a real follow-through on "the fast opening," not just
    // raw speed.
    squadPassive: [
      { type: "applyBuff", id: "strength", amount: 2 },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } },
    ],
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
      // Essence rescale: was 3, now 190 (units.js's TIER_COST comment) -
      // matches RELIC_COST/COMMANDER_RANK_COST/UPGRADE_COST, all four
      // already identically priced at 3 pre-rescale.
      // Rounded to the 50/100/150/200 family (Marc, round numbers).
      cost: 150,
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
    // The Strength+1 half of this description was missing until now -
    // the Rally Cry activePower description below got updated to
    // mention it when squadPassive gained Strength (the Aatos fairness
    // fix), but this MAIN description (character-select screen,
    // HeartwoodBattle.jsx) got missed, leaving it stale and quietly
    // wrong about what the Commander's own kit actually does.
    description: "Steady Hooves: every unit heals 3, strikes a little harder, and shrugs off a lingering ailment each round.",
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
    //
    // A fresh fairness pass (100 simulated runs across all 4 Commanders,
    // after several rounds of new units/items/relics had landed) found
    // Aatos at 56% while Tommy sat at 100% - a 44-point gap, and a real
    // structural reason for it: Fenrir's own Blood Oath comment below
    // already claims "the same flat Strength component Opening Strike/
    // Rally Cry/Brace all already lead with," but Rally Cry never
    // actually got one - Aatos was the only Commander whose full kit
    // (passive AND active) carried zero offense-scaling component,
    // exactly the gap that comment assumed had already been closed.
    // Added the same flat Strength+1 Fenrir's own squadPassive already
    // has, keeping heal as the primary identity (still the biggest
    // single number of any Commander effect) rather than a full rework.
    // Build-diversity pass (see Tommy's own note above): Aatos gets
    // Cleanse - "steady and patient" reads as shrugging off ailments,
    // not just healing through them, and this is the first Commander
    // with Cleanse (previously only via Cleansing Draught/Purifying
    // Bloom) - differentiates him from being "just the heal one."
    squadPassive: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } },
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } },
    ],
    // Rally Cry: an extra turnStart heal for the next battle only, on
    // top of Aatos's always-on one - NOT a flat one-time heal (units
    // always start a fight at full HP, the exact bug this same trigger
    // shape already fixed once for Mosswarden's Charm/Purifying Bloom -
    // see relics.js/items.js), same addTrigger pattern applied up front
    // instead of rediscovering the mistake. Strength+1 added alongside
    // it for the same reason as squadPassive above.
    activePower: {
      id: "rally-cry",
      name: "Rally Cry",
      // Essence rescale: was 3, now 190 (units.js's TIER_COST comment) -
      // matches RELIC_COST/COMMANDER_RANK_COST/UPGRADE_COST, all four
      // already identically priced at 3 pre-rescale.
      // Rounded to the 50/100/150/200 family (Marc, round numbers).
      cost: 150,
      description: "Next battle only: the whole squad mends a little more each round, and strikes a little harder too.",
      effects: [
        { type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } },
        { type: "applyBuff", id: "strength", amount: 1 },
      ],
    },
  },
  fenrir: {
    id: "fenrir",
    name: "Fenrir",
    art: "wolf",
    // Bumped 56 -> 60 (still lowest of the 4, matching Tommy - Aatos's
    // 66 and Repo's 62 stay clearly above) after the new enemy-scaling
    // system's own fairness pass kept landing Fenrir well below the
    // other 3 (32% at n=25) even after the earlier Strength bump this
    // same round. Not a reversal of the glass-cannon identity - just a
    // less extreme version of it, giving his own "worse the longer it
    // goes" a real window to pay off before the fight kills him first,
    // rather than making the identity itself less true.
    maxHp: 60,
    tagline: "Dangerous when hurt - the fight gets worse for you the longer it goes.",
    description: "Wounded Fury: every unit hits harder, and harder still below 50% HP - whatever they hit takes worse hits back, too.",
    startEffects: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
    // A single hard hit, no gimmick of its own - Fenrir's own
    // squadPassive already grants every deployed unit Wounded Fury
    // (himself included, once he's a real deployed unit), so his kit
    // doesn't need to duplicate it. Still the lowest HP of the 4 on
    // purpose: the glass-cannon shape that makes his own "worse the
    // longer it goes" identity bite on himself too, not just his squad.
    movePattern: [{ type: "attack", amount: 8 }],
    // Wounded Fury alone is a conditional bonus (only pays off once a
    // unit is already hurt), so in a long multi-round autobattle it
    // barely contributed compared to Aatos's unconditional every-round
    // heal - found via a 4-run stress test where Aatos won 4/4 and
    // Fenrir lost 4/4 at the same fight. Added a flat Strength buff so
    // Fenrir has a comparable always-on baseline, same as Tommy's,
    // while keeping the "even worse once you're hurt" identity as the
    // extra layer on top rather than the only effect.
    // Bumped Strength 1 -> 2 (matching Tommy's own baseline) after the
    // DPS-adaptive scaling rework lengthened fights across the board -
    // Fenrir's whole identity is "the fight gets worse the longer it
    // goes," so a longer fight structurally hurts him more than the
    // other 3, and his lowest-HP-of-the-4 glass-cannon design means
    // sustain (Tommy/Repo's own fix) would fight his actual concept
    // rather than serve it. Answering with more raw kill speed instead
    // - the fight ending sooner is Fenrir's own real counter to "it's
    // gone on too long," not surviving longer.
    // Build-diversity pass (see Tommy's own note above): Fenrir's
    // "the fight gets worse the longer it goes" now cuts both ways -
    // whatever he hits takes worse hits back too, not just himself
    // getting angrier. First Vulnerable source on a Commander.
    squadPassive: [
      { type: "applyBuff", id: "strength", amount: 2 },
      { type: "applyBuff", id: "woundedFury", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 } },
    ],
    // Blood Oath: a bigger, one-fight-only dose of Fenrir's own signature
    // status - "the fight gets worse for you the longer it goes",
    // deliberately spent on a single decisive battle rather than diluted
    // across the whole run.
    activePower: {
      id: "blood-oath",
      name: "Blood Oath",
      // Essence rescale: was 3, now 190 (units.js's TIER_COST comment) -
      // matches RELIC_COST/COMMANDER_RANK_COST/UPGRADE_COST, all four
      // already identically priced at 3 pre-rescale.
      // Rounded to the 50/100/150/200 family (Marc, round numbers).
      cost: 150,
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
    description: "Fox's Guard: every unit gains Block, strikes a little harder, and strips whatever it strikes of its own strongest edge.",
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
    // Same gap Aatos had (see that Commander's own squadPassive note) -
    // Repo's squad-wide effect was pure Block, zero direct offense-
    // scaling, even though `passive`/activePower both carry Shatter -
    // that's PERSONAL-only/one-fight-only, never applied to the whole
    // squad every round the way Tommy's flat Strength is. Given
    // Shatter's own damage bonus is conditional (only triggers against
    // an already-blocked/warded target, same shape WoundedFury already
    // proved underperforms alone twice), added flat Strength+1 instead
    // of Shatter - a guaranteed floor, keeping Shatter as the
    // flavor/identity layer already present elsewhere in the kit.
    // Build-diversity pass (see Tommy's own note above): first tried
    // an onHit +1 retaliation ("never takes a hit it didn't plan for,"
    // punish-back) - the fairness pass caught a real problem before
    // shipping: Repo jumped 64% -> 84-96% across 2 runs while Aatos/
    // Fenrir stayed flat at 48-52%, a much bigger and less predictable
    // swing than the other 3 Commanders' additions produced. Root
    // cause: Repo's own Block-heavy kit naturally means longer fights
    // (more rounds where enemies keep attacking a squad that's hard to
    // kill), so a per-hit-received trigger procs far more than a
    // per-hit-dealt one does for a faster-fighting Commander - the
    // mechanic's value scales with fight length in a way none of the
    // other 3 picks do. Swapped to Sunder instead (also "exploit an
    // opening," matching his existing Shatter identity, but bounded by
    // what the target actually has to sunder rather than compounding
    // with every round that passes) - re-verified flat/in-line with
    // the other 3 after the swap.
    squadPassive: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } },
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "sunder", target: "target" } },
    ],
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
    // Still last of the 4 after that fix (a fresh fairness pass: 44%
    // no-items / 24% with-items, both clearly lowest) - Repo's
    // guaranteed per-battle Strength (squadPassive + activePower) was
    // only +1, vs. Tommy +4/Fenrir +3/Aatos +2, the same
    // guaranteed-floor gap already closed once for Aatos and once for
    // Fenrir (see their own activePower comments). Shatter's bonus is
    // conditional (only fires vs. an already-blocked/warded target,
    // the same shape WoundedFury already proved underperforms alone
    // twice) so it doesn't substitute for a flat floor. Added
    // Strength+1 on top - keeps the Shatter identity, brings Repo to
    // +2 total, matching Aatos, still deliberately below Fenrir/Tommy
    // (one targeted step, not a leap to parity - re-verify before
    // stacking any further bump).
    activePower: {
      id: "brace",
      name: "Brace",
      // Essence rescale: was 3, now 190 (units.js's TIER_COST comment) -
      // matches RELIC_COST/COMMANDER_RANK_COST/UPGRADE_COST, all four
      // already identically priced at 3 pre-rescale.
      // Rounded to the 50/100/150/200 family (Marc, round numbers).
      cost: 150,
      description: "Next battle only: the whole squad shrugs off one extra hit, strikes a little harder, and strikes deeper against a braced target.",
      effects: [
        { type: "applyBuff", id: "ward", amount: 1 },
        { type: "applyBuff", id: "strength", amount: 1 },
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
// Essence rescale (units.js's TIER_COST comment has the full
// explanation - Marc's "market level up = 250 Essence" ask, scaled
// 62.5x from every old constant): was 3, now 190, matching
// RELIC_COST/UPGRADE_COST/every activePower.cost below - all four were
// already identically priced at 3 pre-rescale.
// Rounded to the 50/100/150/200 family (Marc, round numbers).
const COMMANDER_RANK_COST = 150

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
