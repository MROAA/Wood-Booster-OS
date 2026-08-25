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

  // Tribe-anchor relics (synergies.js) - Marc: "i like the idea of
  // having tribes in the game" - every relic above applies uniformly
  // to the whole squad; these 6 instead target only units of ONE
  // specific tribe (`tribeAnchor`, read by autoBattleEngine.js's relic
  // loop the same way `essenceBonus`/`tauntHighestHp`/`itemSlotBonus`
  // are already special-cased there), a real Battlegrounds/TFT-style
  // reward for actually committing to a tribe rather than a flat
  // squad-wide bonus everyone gets regardless of composition. Priced
  // and rarity-tagged identically to every other relic, but each
  // grants a noticeably BIGGER per-unit effect than the squad-wide
  // equivalent (e.g. Thorn's Wrath's +3 Strength vs. Ember Core's +1)
  // since it only ever reaches a fraction of the squad - narrower
  // should feel stronger, not just different.
  "wardens-bastion": {
    id: "wardens-bastion",
    name: "Warden's Bastion",
    icon: "shield",
    cost: RELIC_COST,
    description: "Every Warden in your squad grows a lot of bark at the start of each round.",
    tribeAnchor: "warden",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 5 } }],
  },
  "fangs-mark": {
    id: "fangs-mark",
    name: "Fang's Mark",
    icon: "sword",
    cost: RELIC_COST,
    description: "Every Fang in your squad finishes a badly wounded enemy much faster.",
    tribeAnchor: "fang",
    effects: [{ type: "applyBuff", id: "execute", amount: 4 }],
  },
  "rootbound-curse": {
    id: "rootbound-curse",
    name: "Rootbound Curse",
    icon: "root",
    cost: RELIC_COST,
    description: "Whatever a Root in your squad strikes carries a heavy poison after.",
    tribeAnchor: "root",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 3 } },
    ],
  },
  "groves-blessing": {
    id: "groves-blessing",
    name: "Grove's Blessing",
    icon: "leaf",
    cost: RELIC_COST,
    description: "Every Grove in your squad mends generously at the start of each round.",
    tribeAnchor: "grove",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 4 } }],
  },
  "spirits-veil": {
    id: "spirits-veil",
    name: "Spirit's Veil",
    icon: "moonGlyph",
    cost: RELIC_COST,
    description: "Every Spirit in your squad shrugs off two real hits before either lands.",
    tribeAnchor: "spirit",
    effects: [{ type: "applyBuff", id: "ward", amount: 2 }],
  },
  "thorns-wrath": {
    id: "thorns-wrath",
    name: "Thorn's Wrath",
    icon: "flame",
    cost: RELIC_COST,
    description: "Every Thorn in your squad strikes considerably harder, all fight.",
    tribeAnchor: "thorn",
    effects: [{ type: "applyBuff", id: "strength", amount: 3 }],
  },
  "heartsbloom-seed": {
    id: "heartsbloom-seed",
    name: "Heartsbloom Seed",
    icon: "heart",
    cost: RELIC_COST,
    description: "Every unit knits itself back together over the fight's first few rounds.",
    // Regen (effects.js's tickRegen) - a decaying heal-over-time stack,
    // Poison's mirror, granted squad-wide at battle start via the same
    // applyBuff every other stat relic already uses. Front-loaded and
    // bounded (fades after a few rounds, same as Poison) rather than a
    // forever-sustain - Mosswarden's Charm already owns that space.
    effects: [{ type: "applyBuff", id: "regen", amount: 3 }],
  },
  "rootbreak-sigil": {
    id: "rootbreak-sigil",
    name: "Rootbreak Sigil",
    icon: "root",
    cost: RELIC_COST,
    description: "Whatever your squad strikes loses its own strongest edge.",
    // Sunder's first RELIC source - Sundermaw Fang (items.js) puts it
    // on one chosen unit's attacks; this puts it on EVERY deployed
    // unit's, the same squad-wide upgrade Bramble Ward already is to
    // Thorned Bracer. A real, repeatable answer to the difficulty
    // round's self-buffed threats (Ironmaw, Stonewake, Deepwarden) -
    // every hit from every unit chips away at whatever they're
    // leaning on, not just Thornwisp/Ashcaller's own dedicated turns.
    effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "sunder", target: "target" } }],
  },
  "cascading-wound": {
    id: "cascading-wound",
    name: "Cascading Wound",
    icon: "sword",
    cost: RELIC_COST,
    description: "Whatever your squad finishes off, it strikes again at someone else.",
    // Chain's first RELIC source - Cascading Claw (items.js) puts it
    // on one chosen unit; this puts it on the whole squad, same
    // squad-wide upgrade every mechanic's relic version already is to
    // its item counterpart. Safe as a relic (unlike Stun's own
    // deliberately-withheld relic version) because Chain only ever
    // fires on an actual killing blow, not every hit - it can't chain-
    // lock a single enemy the way a squad-wide Stun proc could.
    effects: [{ type: "applyBuff", id: "chainDamage", amount: 4 }],
  },
  "mycotic-bloom": {
    id: "mycotic-bloom",
    name: "Mycotic Bloom",
    icon: "leaf",
    cost: RELIC_COST,
    description: "Whatever your squad poisons, it poisons someone standing nearby too.",
    // Spore Spread's first RELIC source - Fungal Spore Sac (items.js)
    // puts it on one chosen unit; this puts it on the whole squad.
    // Deliberately narrow in practice (only matters for a unit that
    // already applies Poison - Rootfang/Hexmother/Mycelist), same
    // "genuinely situational, not a trap pick" spirit tribe-anchor
    // relics already have - a squad built around 2+ poison-appliers
    // gets real value, one without any gets none.
    effects: [{ type: "applyBuff", id: "sporeSpread", amount: 1 }],
  },
  "witherspite-crown": {
    id: "witherspite-crown",
    name: "Witherspite Crown",
    icon: "root",
    cost: RELIC_COST,
    description: "Whatever your squad strikes carries both rot and weariness after.",
    // A fresh double-debuff combo (Poison + Weak) squad-wide - the same
    // pairing this round's own new mook, Hollowspite, uses, given to
    // the player instead. No existing relic combined these two on the
    // same hit before - Venomous Edge/Rootbound Curse only ever grant
    // Poison alone, Frostbrand only Weak alone.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 },
      },
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 },
      },
    ],
  },
  "quarry-vanguard": {
    id: "quarry-vanguard",
    name: "Quarry Vanguard",
    icon: "sword",
    cost: RELIC_COST,
    description: "Every unit hits harder, and hardest of all against a target still braced.",
    // Strength + Shatter together, squad-wide - the same dual-mechanic
    // pairing Quarrystrike Gauntlet (items.js) just established, spread
    // across the whole squad instead of one chosen unit. Both stack
    // numerically with any existing Strength/Shatter sources (Ember
    // Core, Quarrybreak) rather than being redundant with them.
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "applyBuff", id: "shatter", amount: 1 },
    ],
  },
  "reckless-oath": {
    id: "reckless-oath",
    name: "Reckless Oath",
    icon: "sword",
    cost: RELIC_COST,
    description: "Every unit finishes a badly wounded enemy faster, and shrugs off the first real hit while it hunts.",
    // Execute + Ward together, squad-wide - the same "glass cannon
    // insurance" pairing Reckless Vow (items.js) just established,
    // spread across the whole squad. Both stack numerically with any
    // existing Execute/Ward sources rather than being redundant.
    effects: [
      { type: "applyBuff", id: "execute", amount: 2 },
      { type: "applyBuff", id: "ward", amount: 1 },
    ],
  },
  "sanctuary-vow": {
    id: "sanctuary-vow",
    name: "Sanctuary Vow",
    icon: "heart",
    cost: RELIC_COST,
    description: "Every unit shrugs off the first real hit it takes, and mends over the fight's first few rounds.",
    // Regen + Ward together, squad-wide - the same pure survivability
    // pairing Bulwark's Mercy (items.js) just established, spread
    // across the whole squad instead of one chosen unit.
    effects: [
      { type: "applyBuff", id: "ward", amount: 1 },
      { type: "applyBuff", id: "regen", amount: 2 },
    ],
  },
  "ashclaw-standard": {
    id: "ashclaw-standard",
    name: "Ashclaw Standard",
    icon: "sword",
    cost: RELIC_COST,
    description: "Every unit strikes a little harder, and whatever it strikes loses its own strongest edge.",
    // Strength + Sunder together, squad-wide - the same aggressive
    // anti-buff pairing Ashclaw Fang (items.js) just established,
    // spread across the whole squad instead of one chosen unit.
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "sunder", target: "target" } },
    ],
  },
  "cripplebite-standard": {
    id: "cripplebite-standard",
    name: "Cripplebite Standard",
    icon: "sword",
    cost: RELIC_COST,
    description: "Whatever your squad strikes hits softer after, and takes worse hits in return.",
    // Weak + Vulnerable together, squad-wide - the same last-unpaired
    // combo Cripplebite Fang (items.js) just established, spread
    // across every deployed unit's own hits instead of one chosen
    // unit's. Same "hits both sides of the damage formula" identity:
    // whatever the squad focuses down deals less and takes more, a
    // pure target-neutralizing pick rather than a race-the-clock DOT.
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
  // play") - squad-wide mirrors for the same 4 new items.js entries,
  // same pattern every prior dual-mechanic combo already follows
  // (Quarrystrike Gauntlet <-> Quarry Vanguard, Ashclaw Fang <->
  // Ashclaw Standard, etc).
  "bramblehide-banner": {
    id: "bramblehide-banner",
    name: "Bramblehide Banner",
    icon: "shield",
    cost: RELIC_COST,
    description: "Every unit draws every eye, and fights harder the deeper its own wounds go.",
    // Taunt + Wounded Fury, squad-wide - the missing relic mirror for
    // items.js's existing bramblehide-standard item (an asymmetric gap:
    // every other dual-mechanic item already had a relic counterpart).
    effects: [
      { type: "applyBuff", id: "taunt", amount: 1 },
      { type: "applyBuff", id: "woundedFury", amount: 1 },
    ],
  },
  "thornfen-standard": {
    id: "thornfen-standard",
    name: "Thornfen Standard",
    icon: "flame",
    cost: RELIC_COST,
    description: "Every unit strikes a little harder, and mends off every hit it lands.",
    // Strength + Lifesteal, squad-wide - the relic mirror for items.js's
    // new thornfen-fang. Both stack numerically with any existing
    // Strength/Lifesteal sources (Ember Core, Vampiric Bloom) rather
    // than being redundant with them.
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 1 } },
    ],
  },
  "huntclaw-standard": {
    id: "huntclaw-standard",
    name: "Huntclaw Standard",
    icon: "sword",
    cost: RELIC_COST,
    description: "Every unit finishes a badly wounded enemy faster, and strikes again at someone else when it does.",
    // Execute + Chain, squad-wide - the relic mirror for items.js's new
    // huntclaw-fang.
    effects: [
      { type: "applyBuff", id: "execute", amount: 2 },
      { type: "applyBuff", id: "chainDamage", amount: 3 },
    ],
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
