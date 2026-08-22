// Heartwood Trial - enemy definitions. Original forest/rune lore
// creatures, not existing Boosterverse "named agents".
//
// moveSelect: "sequence" cycles movePattern deterministically.
// moveSelect: "weightedRandom" picks among movePattern by weight each
// time an intent is computed, then commits to it (still telegraphed one
// turn ahead, just less predictable to plan around).

export const ENEMIES = {
  "rotwood-husk": {
    id: "rotwood-husk",
    name: "Rotwood Husk",
    maxHp: 40,
    art: "husk",
    description:
      "A hollowed trunk, moving on roots long since gone soft. Slow, but it does not tire.",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 8 },
      { type: "attack", amount: 8 },
      { type: "block", amount: 6 },
    ],
  },
  "moss-troll": {
    id: "moss-troll",
    name: "Moss Troll",
    maxHp: 46,
    art: "troll",
    description:
      "Thick with lichen and old grudges. Its grip saps the strength from a struck limb.",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 10 },
      { type: "debuff", id: "weak", amount: 2, target: "player" },
      { type: "attack", amount: 6 },
      { type: "block", amount: 8 },
    ],
  },
  "rune-warden": {
    id: "rune-warden",
    name: "Rune Warden",
    maxHp: 50,
    art: "warden",
    description:
      "Carved to guard the deep runes. What it does next is never quite certain.",
    moveSelect: "weightedRandom",
    movePattern: [
      { type: "attack", amount: 12, weight: 2 },
      { type: "block", amount: 12, weight: 1 },
      { type: "debuff", id: "weak", amount: 2, target: "player", weight: 1 },
    ],
  },
  "bark-brute": {
    id: "bark-brute",
    name: "Bark Brute",
    maxHp: 48,
    art: "barkBrute",
    description: "A knotted fist of root and stone. It only knows one move, and it is heavy.",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 15 },
      { type: "attack", amount: 5 },
      { type: "block", amount: 10 },
    ],
  },
  "mist-growler": {
    id: "mist-growler",
    name: "Mist Growler",
    maxHp: 36,
    art: "mistGrowler",
    description: "Fog with teeth. It snaps before you see it coming.",
    moveSelect: "weightedRandom",
    movePattern: [
      { type: "attack", amount: 9, weight: 2 },
      { type: "debuff", id: "weak", amount: 2, target: "player", weight: 1 },
      { type: "attack", amount: 6, weight: 1 },
    ],
  },

  "drowned-siren": {
    id: "drowned-siren",
    name: "Drowned Siren",
    maxHp: 38,
    art: "drownedSiren",
    description: "Her song promises rest. Take it, and your strikes go soft.",
    // A 6th mook - deliberately leans harder into Weak than any
    // existing enemy (3 instead of the usual 2, matching only
    // Spacemonkey's own boss-tier debuff), on a predictable sequence
    // rather than weightedRandom - the threat is telegraphed but still
    // painful if ignored, a different flavor of pressure from Bark
    // Brute's raw damage or Mist Growler's unpredictability.
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 7 },
      { type: "debuff", id: "weak", amount: 3, target: "player" },
      { type: "attack", amount: 7 },
    ],
  },

  "bloomrot-stalker": {
    id: "bloomrot-stalker",
    name: "Bloomrot Stalker",
    maxHp: 40,
    art: "bloomrotStalker",
    description: "It doesn't hit hard. It doesn't need to - not anymore.",
    // A 7th mook, first to use Poison - the new tickPoison mechanic in
    // effects.js/autoBattleEngine.js. Its own hits are the weakest of
    // any mook (6, below even Drowned Siren's 7), but every other
    // strike stacks Poison instead - a unit that ignores it stays
    // healthy round to round, but every point of Poison left standing
    // is guaranteed future damage no Block or dodge can stop. Reuses
    // the existing "debuff" intent → applyBuff pipeline verbatim (same
    // one Weak already uses) - id: "poison" instead of id: "weak" is
    // the entire difference, tickPoison is what makes the stat do
    // something new.
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 6 },
      { type: "debuff", id: "poison", amount: 3, target: "player" },
      { type: "attack", amount: 6 },
    ],
  },

  "rootbind-thicket": {
    id: "rootbind-thicket",
    name: "Rootbind Thicket",
    maxHp: 44,
    art: "rootbindThicket",
    description: "Its roots don't reach far. When they catch you, though, you don't move.",
    // 8th mook, first to use Stun - a genuinely different kind of
    // mechanic from every status so far (Weak/Vulnerable/Poison all
    // just change a number; Stun skips the target's action outright,
    // see actSide() in autoBattleEngine.js). Kept its own damage low
    // (4, the lowest of any mook) since losing a whole action is a
    // strong effect on its own - this isn't meant to also hit hard.
    // The real strategic question it asks: focus this down first to
    // stop the lockdown, or tank through it and hope the stunned unit
    // wasn't your key piece that round.
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 4 },
      { type: "debuff", id: "stun", amount: 1, target: "player" },
      { type: "attack", amount: 4 },
    ],
  },

  "witherfang": {
    id: "witherfang",
    name: "Witherfang",
    maxHp: 42,
    art: "rootbindThicket",
    description: "It doesn't want your strength. It just doesn't want you to have it either.",
    // 9th mook, first to use Sunder (effects.js) - the enemy side's own
    // answer to how many buffs a squad can now be carrying (Ward,
    // Revive, Taunt, Execute, Strength all live on player units by
    // this point in the roster). Strips one stack of whichever the
    // target actually has, prioritizing the defensive tools
    // (Ward/Revive/Taunt) before Strength - real counterplay in the
    // same spirit as Spacemonkey's AoE countering Taunt-stacking, just
    // available outside the boss fight too. Kept its own damage low
    // (5, matching Bloomrot/Rootbind's precedent) since the gimmick
    // carries the fight's real weight, not the hit itself.
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 5 },
      { type: "sunder", target: "player" },
      { type: "attack", amount: 5 },
    ],
  },

  "thornspite": {
    id: "thornspite",
    name: "Thornspite",
    maxHp: 40,
    art: "root",
    description: "Every thorn it plants makes the next blow land harder.",
    // 10th mook, first enemy source of Vulnerable (+25% damage taken) -
    // the one core debuff (Weak/Poison/Stun/Sunder all already have an
    // enemy source) that had never appeared on this side of the board.
    // Genuinely dangerous stacked with a hard-hitting ally mook, so it
    // rewards focusing it down early rather than ignoring it the way a
    // low-damage debuffer sometimes can be.
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 6 },
      { type: "debuff", id: "vulnerable", amount: 1, target: "player" },
      { type: "attack", amount: 6 },
    ],
  },

  "bramblehide": {
    id: "bramblehide",
    name: "Bramblehide",
    maxHp: 50,
    art: "troll",
    description: "Wounds close almost as fast as they open. Almost.",
    // 11th mook, first enemy to heal itself - every other mook's block
    // step just delays damage, this one actively undoes it. A real
    // race: out-damage the regen or the fight drags on past what its
    // own middling attack (7) would suggest.
    moveSelect: "sequence",
    movePattern: [
      { type: "block", amount: 6 },
      { type: "heal", amount: 5 },
      { type: "attack", amount: 7 },
    ],
  },

  "emberwrack": {
    id: "emberwrack",
    name: "Emberwrack",
    maxHp: 44,
    art: "flame",
    description: "It doesn't pick a target. It doesn't have to.",
    // 12th mook, first non-boss AoE source - Spacemonkey's own AoE
    // (autoBattleEngine.js) has always bypassed Taunt/shielding
    // entirely, but only ever showed up in the final fight, so "stack
    // the whole squad behind one taunting tank" stayed a safe answer
    // for every solo mook along the way. This is the same real threat
    // showing up earlier - priced the same way Spacemonkey's own AoE
    // is (roughly half a single-target hit, since it can land on the
    // whole squad at once).
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 10 },
      { type: "aoe", amount: 5 },
      { type: "block", amount: 8 },
    ],
  },

  // The run's final boss - not a mook, so it gets a bit more presence:
  // a real intro line and a spoken line on defeat (read by RunEndOverlay,
  // see runEngine.js). His "pikku-paholainen" alter-ego lore already
  // implies he was never purely benevolent - this doesn't retcon
  // anything, just plays it straight.
  spacemonkey: {
    id: "spacemonkey",
    name: "Spacemonkey",
    maxHp: 90,
    art: "spacemonkeyBoss",
    isBoss: true,
    description: "The little devil behind the curtain. He was never only on your side.",
    victoryLine: "\"...Well played.\" The grin doesn't quite reach his eyes.",
    moveSelect: "weightedRandom",
    movePattern: [
      { type: "attack", amount: 18, weight: 2 },
      { type: "debuff", id: "weak", amount: 3, target: "player", weight: 1 },
      { type: "block", amount: 14, weight: 1 },
      // AoE (autoBattleEngine.js): hits every living player unit
      // directly, bypassing frontmost/randomLiving entirely - Taunt
      // (Stoneheart, Bulwark Standard) and shielding both work by
      // steering or filtering a single-target pick, so neither does
      // anything here. Only Spacemonkey has this move: the boss fight
      // is the one place "hide the squad behind one tank" should stop
      // being a guaranteed answer. Priced below the single-target hit
      // (9 vs 18) since it can land on up to 4 units at once.
      { type: "aoe", amount: 9, weight: 1 },
    ],
  },
}
