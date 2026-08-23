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

  "duskgnaw": {
    id: "duskgnaw",
    name: "Duskgnaw",
    maxHp: 42,
    art: "root",
    description: "First it saps your strength. Then it makes every hit after count double.",
    // 13th mook, first to stack BOTH major debuffs on the same target -
    // every prior debuffer picked one (Weak or Vulnerable, never both).
    // Weak lowers what the target deals, Vulnerable raises what it
    // takes - together they compound in both directions on whoever
    // Duskgnaw keeps hitting, same "ignore it and the whole fight gets
    // worse" pressure Drowned Siren's repeating Weak already teaches,
    // just doubled.
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 5 },
      { type: "debuff", id: "weak", amount: 2, target: "player" },
      { type: "attack", amount: 5 },
      { type: "debuff", id: "vulnerable", amount: 1, target: "player" },
    ],
  },

  "cragfang": {
    id: "cragfang",
    name: "Cragfang",
    maxHp: 44,
    art: "root",
    description: "It doesn't care that you're braced. It just hits harder because of it.",
    // 14th mook, and the first with a battle-start passive at all
    // (autoBattleEngine.js's startAutoBattle - enemies could never
    // carry one before this round). Comes pre-armed with Shatter
    // (effects.js), the roster's newest mechanic - punishes a squad
    // leaning on Block (Ironbark/Oakwarden/Loamguard/Cragmoss and
    // friends) the same way Duskgnaw punishes a squad that ignores its
    // stacking debuffs: the defensive answer that works everywhere
    // else stops being free here.
    passive: [{ type: "applyBuff", id: "shatter", amount: 3 }],
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 8 },
      { type: "block", amount: 6 },
    ],
  },

  "stormroot": {
    id: "stormroot",
    name: "Stormroot",
    maxHp: 38,
    art: "root",
    description: "It never settles into a rhythm you can plan around.",
    // 15th mook - weightedRandom (Rune Warden/Mist Growler's own
    // unpredictability), leaning on Weak instead of a signature gimmick
    // of its own. A plain reinforcement for the run's variety, same
    // reuse-only spirit as the player roster's own recent additions.
    moveSelect: "weightedRandom",
    movePattern: [
      { type: "attack", amount: 8, weight: 2 },
      { type: "debuff", id: "weak", amount: 2, target: "player", weight: 1 },
      { type: "block", amount: 8, weight: 1 },
    ],
  },

  "duskmoth": {
    id: "duskmoth",
    name: "Duskmoth",
    maxHp: 40,
    art: "moonGlyph",
    description: "It shrugs off the opening rounds like they never happened.",
    // 16th mook, and the first to carry Regen (effects.js's tickRegen)
    // instead of Bramblehide's repeating heal step - front-loaded and
    // decaying rather than forever, so the fight against it is really
    // about the OPENING rounds: burst past what its Regen can undo
    // before it fades, or the middling attack (6) alone won't matter
    // either way.
    passive: [{ type: "applyBuff", id: "regen", amount: 4 }],
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 6 },
      { type: "block", amount: 5 },
    ],
  },

  "hollowfen": {
    id: "hollowfen",
    name: "Hollowfen",
    maxHp: 52,
    art: "husk",
    description: "It doesn't do anything clever. It doesn't need to.",
    // 17th mook - a plain, heavy-HP reinforcement (Stormroot/Rimefang's
    // own "run variety, no signature gimmick" spirit) rather than
    // another mechanic-carrier - the roster's late-game mooks have
    // leaned heavily gimmick-first these last several rounds, so a
    // straightforward high-HP block-and-swing wall earns its slot on
    // raw stats alone.
    moveSelect: "sequence",
    movePattern: [
      { type: "block", amount: 7 },
      { type: "attack", amount: 8 },
    ],
  },

  "quillfang": {
    id: "quillfang",
    name: "Quillfang",
    maxHp: 36,
    art: "root",
    description: "Every quill it sheds keeps working long after it's pulled loose.",
    // 18th mook - Poison's second enemy source (Bloomrot Stalker's own
    // pattern, different numbers/name) - the same "run variety within
    // an already-proven mechanic" reuse discipline Thornspite/Duskgnaw
    // already established for Vulnerable/Weak.
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 5 },
      { type: "debuff", id: "poison", amount: 2, target: "player" },
      { type: "attack", amount: 5 },
    ],
  },

  "ironmaw": {
    id: "ironmaw",
    name: "Ironmaw",
    maxHp: 46,
    art: "husk",
    description: "It doesn't flinch. It just hits back harder every time.",
    // 19th mook, and the first to carry a battle-start SELF-buff other
    // than Shatter (Cragfang) or Regen (Duskmoth) - Strength, via the
    // same generic `applyBuff` passive every player unit already uses.
    // Every enemy debuff (Weak/Poison/Vulnerable/Sunder) already has a
    // source; every PLAYER buff mechanic (Ward/Revive/Taunt/Execute/
    // Shatter/Strength) has only ever existed on the player's own side
    // - so `effects.js`'s SUNDERABLE_IDS list has always had nothing to
    // actually strip on the enemy side of the board. Ironmaw is the
    // first real target for a player-side Sunder tool (Thornwisp,
    // units.js).
    passive: [{ type: "applyBuff", id: "strength", amount: 3 }],
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 5 },
      { type: "block", amount: 5 },
    ],
  },

  "gravemaw": {
    id: "gravemaw",
    name: "Gravemaw",
    maxHp: 42,
    art: "husk",
    description: "It's slow to anger. Once it's hurt, it isn't slow anymore.",
    // 20th mook, and the first enemy source of Wounded Fury
    // (effects.js's woundedFuryBonus - +3 damage once below 50% HP) -
    // Feral Charm/Berserker's Oath already give a player unit this
    // exact same threat, but no mook had ever turned it around before.
    // Not in SUNDERABLE_IDS (unlike Ironmaw's Strength), so Thornwisp
    // can't strip it away - the only real answer is finishing it before
    // it crosses the threshold, or simply outracing the bonus with
    // enough raw damage that the extra 3 never matters.
    passive: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
    moveSelect: "sequence",
    movePattern: [{ type: "attack", amount: 6 }],
  },

  "duskhollow": {
    id: "duskhollow",
    name: "Duskhollow",
    maxHp: 48,
    art: "moonGlyph",
    description: "Every round it stands, the last one is already forgotten.",
    // 21st mook - Regen's first PERSISTENT enemy source, distinct from
    // Duskmoth's one-shot decaying passive (a fixed stack that fades
    // over a few rounds). A turnStart trigger re-grants Regen every
    // round it acts instead of only once at battle start - same
    // mechanism Mosswarden's Charm/Bramblehide's own repeating heal
    // already use, just feeding Regen's decaying stack instead of a
    // flat heal, so it never actually runs out on its own. The real
    // answer isn't outlasting it (Bramblehide's own weakness) or
    // racing the first few rounds (Duskmoth's) - it's simply
    // out-damaging what a full stack heals back every single round.
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "applyBuff", id: "regen", amount: 4 } }],
    moveSelect: "sequence",
    movePattern: [{ type: "attack", amount: 5 }],
  },

  "needlefen": {
    id: "needlefen",
    name: "Needlefen",
    maxHp: 40,
    art: "root",
    description: "It doesn't need to hit hard. It just needs one moment where you can't answer.",
    // 22nd mook - Stun's second enemy source (Rootbind Thicket's own
    // pattern, different numbers/name) - the same "run variety within
    // an already-proven mechanic" reuse discipline every other core
    // debuff has already gotten (Poison x2, Weak x1 + double-debuff,
    // Vulnerable x1). Kept damage low (3/3), same reasoning Rootbind
    // Thicket's own note gives - losing a whole action is strong on
    // its own.
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 3 },
      { type: "debuff", id: "stun", amount: 1, target: "player" },
      { type: "attack", amount: 3 },
    ],
  },

  "wraithgale": {
    id: "wraithgale",
    name: "Wraithgale",
    maxHp: 44,
    art: "moonGlyph",
    description: "It doesn't do anything you haven't already seen. It just doesn't stop doing it.",
    // 23rd mook - a plain weightedRandom reinforcement (Rune Warden/
    // Stormroot's own "run variety, no signature gimmick" spirit)
    // rather than another mechanic-carrier.
    moveSelect: "weightedRandom",
    movePattern: [
      { type: "attack", amount: 7, weight: 2 },
      { type: "block", amount: 6, weight: 1 },
      { type: "attack", amount: 4, weight: 1 },
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
