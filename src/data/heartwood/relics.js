// Heartwood Trial - Relics: permanent, run-wide choices picked mid-run
// (see runEngine.js's "relic" node type), the first mechanic in the
// game that isn't "another unit" or "another enemy arrangement" - a
// real structural choice that reshapes the whole rest of a run, same
// role relics/artifacts play in Slay the Spire or Guildrun (the two
// games Marc named as inspiration for this pivot in the first place).
//
// `effects` apply once, to every deployed unit, at battle start - same
// applyEffects/self-targeting mechanism a unit's own `passive` and a
// Commander's `squadPassive` already use (see autoBattleEngine.js).
// `essenceBonus` is handled separately by runEngine.js's win payout,
// since it isn't a battle effect at all.
//
// `cost`: relics were free (pick one or skip) until Marc asked for
// them to cost Essence like everything else in the shop - now a real
// opportunity-cost decision (recruit more units this round, or bank
// for a relic) instead of a pure freebie. Priced at 3, the same as a
// rare unit, since a permanent run-wide effect is worth at least as
// much as the strongest single recruit.
const RELIC_COST = 3

// A relic node only shows up 3 times a run (vs. a shop's unlimited
// visits), so unlike the shop's rising reroll cost, a flat price is
// enough of a rate limit on its own - a second way to spend Essence,
// per Marc's "more mechanics and ways to spend currency" ask, without
// needing its own escalation curve.
export const RELIC_REROLL_COST = 2

export const RELICS = {
  "ember-core": {
    id: "ember-core",
    name: "Ember Core",
    icon: "flame",
    cost: RELIC_COST,
    description: "Every unit strikes a little harder, all fight, every fight.",
    effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  "mosswarden-charm": {
    id: "mosswarden-charm",
    name: "Mosswarden's Charm",
    icon: "leaf",
    cost: RELIC_COST,
    description: "Every unit mends a little at the start of each round.",
    // Two real bugs caught via testing before shipping, not guessed
    // at: first pass was a one-time battle-start heal, useless since
    // units always start every fight at full HP already (confirmed via
    // an engine-level check showing "heal 0" in the log). Second pass
    // swapped to a one-time battle-start Block grant - also useless,
    // since resolveRound() resets ALL player Block to 0 at the top of
    // every round, including round 1, before the enemy ever attacks
    // (confirmed via a second engine-level check: the granted Block
    // never blocked anything). A turnStart addTrigger is the only
    // shape that survives that reset - same mechanism Aatos's and
    // Repo's Commander passives already rely on, which is exactly why
    // both of those already worked and this needed the same fix.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
  },
  "bramble-ward": {
    id: "bramble-ward",
    name: "Bramble Ward",
    icon: "root",
    cost: RELIC_COST,
    description: "Whatever strikes your squad gets struck back.",
    // The relic that introduces onHit/retaliation (effects.js's
    // dealDamage) to the game - a mechanic that didn't exist before
    // this relic system. Every deployed unit gets an onHit trigger
    // that deals flat damage back to whoever just hit them, as long
    // as the hit actually landed (not fully blocked).
    effects: [{ type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 3 } }],
  },
  "sundering-mark": {
    id: "sundering-mark",
    name: "Sundering Mark",
    icon: "rune",
    cost: RELIC_COST,
    description: "Whatever your squad strikes takes deeper wounds after.",
    // Bramble Ward's mirror: introduces onDealDamage (effects.js's
    // dealDamage) and Vulnerable (+25% damage taken, the defensive
    // opposite of Weak) together. Every deployed unit's own hits mark
    // their target Vulnerable - stacks, so a focused target keeps
    // taking worse hits the longer it's attacked, same escalating
    // shape Poison gives the enemy side of the roster.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 },
      },
    ],
  },
  "essence-well": {
    id: "essence-well",
    name: "Essence Well",
    icon: "spark",
    cost: RELIC_COST,
    description: "Every victory is a little more rewarding.",
    effects: [],
    essenceBonus: 1,
  },
  "bulwark-standard": {
    id: "bulwark-standard",
    name: "Bulwark Standard",
    icon: "shield",
    cost: RELIC_COST,
    description: "Whoever stands sturdiest in your formation draws every eye.",
    // Taunt (autoBattleEngine.js) was engine-only until Stoneheart's
    // passive granted it directly - this is the second source, and the
    // first that isn't tied to one specific unit: rather than the
    // uniform "every deployed unit" loop every other relic's `effects`
    // use, this is handled as its own special case in
    // startAutoBattle (same precedent as essenceBonus above, which
    // also isn't a plain battle effect) - Taunt goes to whichever
    // deployed unit has the highest maxHp, so any tank you happen to
    // field becomes the squad's designated target, not just Stoneheart.
    effects: [],
    tauntHighestHp: true,
  },
  "vampiric-bloom": {
    id: "vampiric-bloom",
    name: "Vampiric Bloom",
    icon: "leaf",
    cost: RELIC_COST,
    description: "Every strike your squad lands mends the one who struck it.",
    // Lifesteal - a genuinely new mechanic (not another number on an
    // existing stat), reusing onDealDamage (Sundering Mark's hook)
    // instead of adding new engine machinery: a flat self-heal per hit
    // landed, same "deterministic, not a %, not a dice roll" shape
    // every other trigger effect in the game already uses (Marc: "easy
    // to play but hard to master" - a fixed, readable number rewards
    // deliberate squad-building, not luck). Especially strong on a
    // pattern-attacker (Rook's Charge/Bishop's Slash/Knight's Leap),
    // since applyPatternDamage fires dealDamage - and therefore this
    // trigger - once per target hit, not once per turn.
    effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 2 } }],
  },
  "culling-strike": {
    id: "culling-strike",
    name: "Culling Strike",
    icon: "sword",
    cost: RELIC_COST,
    description: "Your squad finishes a badly wounded enemy faster.",
    // Execute (effects.js's dealDamage) - a flat bonus that only
    // applies once the target is already at or below 30% max HP,
    // rewarding a squad built to finish off a wounded target instead
    // of spreading damage across several. Applies via the same
    // uniform per-unit `effects` loop every other non-special relic
    // uses (Ember Core's Strength grant, e.g.) - a plain applyBuff,
    // nothing new needed in startAutoBattle for this one.
    effects: [{ type: "applyBuff", id: "execute", amount: 3 }],
  },
  "aegis-ward": {
    id: "aegis-ward",
    name: "Aegis Ward",
    icon: "shield",
    cost: RELIC_COST,
    description: "Every unit shrugs off the first real hit it takes, once.",
    // Ward's second source, alongside Thornguard's own passive - same
    // uniform per-unit effects loop as Ember Core/Culling Strike,
    // nothing special-cased needed since Ward only reads
    // powers.ward wherever it came from.
    effects: [{ type: "applyBuff", id: "ward", amount: 1 }],
  },
  "venomous-edge": {
    id: "venomous-edge",
    name: "Venomous Edge",
    icon: "leaf",
    cost: RELIC_COST,
    description: "Whatever your squad strikes carries poison after.",
    // Poison's second player-accessible source, alongside Rootfang's
    // own movePattern debuff - same onDealDamage shape Sundering Mark
    // already uses for Vulnerable, just applying Poison instead. Real
    // synergy with Haste (Swiftclaw): twice the hits per round means
    // twice the onDealDamage triggers, so this relic stacks Poison
    // noticeably faster on a Haste-built squad than a normal one.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "poison", target: "target", amount: 2 },
      },
    ],
  },
  "frostbrand": {
    id: "frostbrand",
    name: "Frostbrand",
    icon: "moonGlyph",
    cost: RELIC_COST,
    description: "Whatever your squad strikes hits softer after, in return.",
    // Weak's first onDealDamage-trigger source - a third relic through
    // the same door Sundering Mark (Vulnerable) and Venomous Edge
    // (Poison) already opened, just weakening the enemy's OWN future
    // damage output instead of marking it to take more or poisoning
    // it. A defensive-leaning pick: every landed hit makes whatever
    // you hit swing softer later, not just take more punishment.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 },
      },
    ],
  },
  "artificers-ledger": {
    id: "artificers-ledger",
    name: "Artificer's Ledger",
    icon: "rune",
    cost: RELIC_COST,
    description: "Every unit carries one more piece of gear.",
    // Deliberately deferred out of the round that shipped Items
    // (items.js) - this needed ITEM_SLOTS to stop being a flat
    // constant and become relic-conditional everywhere it's read
    // (runEngine.js's equipItem slot-range check, SquadDraft.jsx's
    // slot-pip rendering), a real scope increase over "just another
    // relic." Not a uniform per-unit `effects` push like every other
    // relic here - handled as its own special case (same precedent as
    // Bulwark Standard's tauntHighestHp/Essence Well's essenceBonus,
    // neither of which are plain battle effects either), read via
    // runEngine.js's effectiveItemSlots(runState).
    effects: [],
    itemSlotBonus: 1,
  },
  "purifying-bloom": {
    id: "purifying-bloom",
    name: "Purifying Bloom",
    icon: "leaf",
    cost: RELIC_COST,
    description: "Every unit shakes off a lingering ailment at the start of each round.",
    // Cleanse's (effects.js) first squad-wide source - Willowmend
    // carries it as a unit passive already, this is the relic version
    // every other mechanic in the roster eventually got (Ward, Poison,
    // Execute, Weak all have both a relic and a unit/item source by
    // now). A one-time battle-start grant would be a no-op (units
    // start every fight with nothing to cleanse) - same lesson
    // Mosswarden's Charm already taught this session - so this is a
    // turnStart addTrigger instead, same repeating mechanism that
    // relic already established.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } }],
  },
  "bark-ward": {
    id: "bark-ward",
    name: "Bark Ward",
    icon: "shield",
    cost: RELIC_COST,
    description: "Every unit grows a little bark at the start of each round.",
    // Block's first repeating relic source - every existing Block
    // source so far was either a unit's own movePattern step (reset
    // every round like any other Block) or a one-time passive
    // (The Emperor). Same turnStart addTrigger shape Mosswarden's
    // Charm/Purifying Bloom already use, just granting Block instead
    // of heal/cleanse.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
  },
  "berserkers-oath": {
    id: "berserkers-oath",
    name: "Berserker's Oath",
    icon: "flame",
    cost: RELIC_COST,
    description: "Every unit fights harder once it's badly hurt.",
    // Wounded Fury (effects.js's woundedFuryBonus) - previously only
    // reachable via Fenrir's own squadPassive or baked into
    // Thornwarden's kit, never as a run-wide pick any Commander could
    // take. Plain applyBuff - the power is just a flag checked against
    // the unit's own current HP each hit, no new engine work needed.
    effects: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
  },
  "quarrybreak": {
    id: "quarrybreak",
    name: "Quarrybreak",
    icon: "sword",
    cost: RELIC_COST,
    description: "Every unit strikes deeper against a target that's still braced.",
    // Shatter's (effects.js's shatterBonus) first squad-wide source -
    // Stoneknoll carries it as a unit passive already, this is the
    // relic version every mechanic in the roster eventually gets.
    // Plain applyBuff - the power is just a flag checked against the
    // target's current Block each hit, no new engine work needed.
    effects: [{ type: "applyBuff", id: "shatter", amount: 3 }],
  },
}

// Rarity (Marc: "tehdään harvinaisuus systeemi peliin ja siihen
// liittyville" - make a rarity system for the game and related
// things) - every relic is priced the same (RELIC_COST) and is
// already meant to feel like a run-defining pick, so they're all
// "rare" uniformly, same status items.js's own tier derivation gives
// its most expensive tier.
for (const relic of Object.values(RELICS)) {
  relic.tier = "rare"
}

export function relicPool() {
  return Object.values(RELICS)
}
