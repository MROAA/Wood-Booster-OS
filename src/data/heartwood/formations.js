// Heartwood Trial - multi-piece enemy formations for the grid battle.
// A formation is just data: which enemy defs sit where, and where the
// player starts. `resolveFormation` also accepts a bare ENEMIES id and
// synthesizes a 1-piece formation for it, so the 3 original solo fights
// (Rotwood Husk, Moss Troll, Rune Warden) keep working with zero changes
// to their own data.

export const FORMATIONS = {
  "rotwood-husk-pair": {
    id: "rotwood-husk-pair",
    name: "Rotwood Husk Pair",
    description: "A Husk and a younger Sapling, side by side. Alone, neither is much - together, they don't let up.",
    // Fight 1 of every run. Solo Husk stat pushes couldn't create real
    // risk for a realistically-recruited squad without also being able
    // to kill a unit outright and snowball into a run-wide collapse via
    // permadeath (see enemies.js's note on "rotwood-husk"). A first
    // attempt at this formation paired two full-strength Husks - also
    // catastrophic (46/100 runs died at fight 1), because both pieces
    // start at moveIndex 0 with no stagger support in the engine, so
    // identical patterns land in perfect sync every round. Pairing the
    // Husk with a deliberately lighter, OFFSET-pattern Sapling
    // (rotwood-sapling: block first where the Husk attacks first) avoids
    // both failure modes: real extra pressure (more total HP to grind
    // through, a second attacker most rounds) without a round-1 double-
    // attack spike. Verify against the full-run fairness bot before
    // touching either piece's stats again - fight-1-only testing missed
    // the earlier collapse entirely, and the first "double it" attempt
    // missed this one too.
    pieces: [
      { defId: "rotwood-husk", pos: { row: 0, col: 0 } },
      { defId: "rotwood-sapling", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "mist-growler-pack": {
    id: "mist-growler-pack",
    synergy: { label: "The pack moves as one", effects: [{ type: "applyBuff", id: "strength", amount: 1 }] },
    name: "Mist Growler Pack",
    description: "Two Growlers, side by side in the same rank. Neither shields the other.",
    // Both in row 0, different columns - a genuine swarm, not a
    // shielding puzzle: either one is a legal single-target from turn
    // one, so the threat is two unpredictable weightedRandom attackers
    // acting each round, not "break through the front piece first".
    pieces: [
      { defId: "mist-growler", pos: { row: 0, col: 0 } },
      { defId: "mist-growler", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "bark-brutes-stand": {
    id: "bark-brutes-stand",
    name: "Bark Brute's Stand",
    description: "The Brute plants itself in front of the Warden, daring you to go through it first.",
    // Same column, Brute strictly in front (row 0 < row 1) - the Warden
    // is shielded from ordinary single-target attacks until the Brute
    // falls or a pattern attack reaches past it, same shielding rule
    // Rune Warden's Escort already uses. Column 2, not the center (1,1)
    // square - see Rune Warden's Escort's own note: no knight move on a
    // 3x3 grid can ever land on (1,1), which would make a shielded
    // piece placed there permanently immune to Knight's Leap.
    pieces: [
      { defId: "bark-brute", pos: { row: 0, col: 2 } },
      { defId: "rune-warden", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "twin-watch": {
    id: "twin-watch",
    synergy: { label: "The wall holds", effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] },
    name: "Twin Watch",
    description: "Two Husks, two Trolls behind them. The center stands empty - go around, or through.",
    // Two independent shielding columns (col 0 and col 2), nothing at
    // col 1 - now that shielding actually does something (see the
    // frontmost()/randomLiving() fix), this is a genuine puzzle rather
    // than the same trick twice: a Bishop's Slash unit placed to reach
    // both diagonals, or a Rook's Charge sharing a row with a Troll,
    // can snipe a shielded backline piece directly without breaking
    // through its Husk first - single-target units have to grind both
    // fronts down instead.
    pieces: [
      { defId: "rotwood-husk", pos: { row: 0, col: 0 } },
      { defId: "moss-troll", pos: { row: 1, col: 0 } },
      { defId: "rotwood-husk", pos: { row: 0, col: 2 } },
      { defId: "moss-troll", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "sirens-bodyguard": {
    id: "sirens-bodyguard",
    name: "Siren's Bodyguard",
    description: "The Brute plants itself in front of her. Break through, or she'll weaken you first.",
    // First formation to use Drowned Siren - Bark Brute shields her the
    // same way it shields Rune Warden in Bark Brute's Stand, but the
    // payoff for breaking through (or sniping her with a pattern unit)
    // is different: she doesn't hit as hard as the Warden, but her
    // signature 3-stack Weak compounds badly if the fight drags on
    // while the Brute is still soaking hits. Column 0, not the center
    // (1,1) square - same reason as every other shielding formation:
    // no knight move on a 3x3 grid can ever land on (1,1).
    pieces: [
      { defId: "bark-brute", pos: { row: 0, col: 0 } },
      { defId: "drowned-siren", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-undertow": {
    id: "the-undertow",
    synergy: { label: "Fog and song, together", effects: [{ type: "applyBuff", id: "evade", amount: 1 }] },
    name: "The Undertow",
    description: "Fog on one side, her song on the other. Neither shields the other - both act every round.",
    // A second swarm formation (same "no shielding, both act" spirit as
    // Mist Growler Pack) but a different threat texture: Growler is
    // weightedRandom raw damage, Siren is a guaranteed sequence-based
    // Weak proc every other beat - Weak's -25% penalty doesn't scale
    // with stack count (see effects.js's weakOf/dealDamage), but left
    // alive she keeps re-triggering it, so ignoring her for even a
    // couple rounds means every attack lands softer the whole fight.
    pieces: [
      { defId: "mist-growler", pos: { row: 0, col: 0 } },
      { defId: "drowned-siren", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "rune-wardens-escort": {
    id: "rune-wardens-escort",
    synergy: { label: "The escort closes ranks", effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] },
    name: "Rune Warden's Escort",
    description: "Two Husks and a Troll hold the front rank, shielding the Warden behind them.",
    // The Warden sits at (1,0), shielded by the Husk directly in front
    // of it at (0,0) - same column, closer to the front. Deliberately
    // NOT the board's center square (1,1): a knight's move can never
    // reach the center of a 3x3 grid from anywhere on it, which would
    // make Knight's Leap unable to ever bypass this piece's shield.
    pieces: [
      { defId: "rotwood-husk", pos: { row: 0, col: 0 } },
      { defId: "moss-troll", pos: { row: 0, col: 1 } },
      { defId: "rotwood-husk", pos: { row: 0, col: 2 } },
      { defId: "rune-warden", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "embers-bulwark": {
    id: "embers-bulwark",
    name: "Ember's Bulwark",
    description: "Bramblehide plants itself in front. Behind it, Emberwrack waits for a clean shot at your whole line.",
    // First formation to use any of the 3 most recent mooks
    // (Thornspite/Bramblehide/Emberwrack) - Bramblehide shields
    // Emberwrack the same way Bark Brute shields Rune Warden/Drowned
    // Siren elsewhere, but the payoff for stalling is worse here:
    // every round spent grinding through Bramblehide's own self-heal
    // is another round Emberwrack's AoE (which ignores shielding and
    // Taunt entirely once it's live) gets to keep swinging at the
    // whole squad. Column 0, not the center (1,1) square - same
    // knight's-move-can-never-land-there reason every shielding
    // formation already follows.
    pieces: [
      { defId: "bramblehide", pos: { row: 0, col: 0 } },
      { defId: "emberwrack", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "quillfangs-warren": {
    id: "quillfangs-warren",
    synergy: { label: "The warren's poison seeps", effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } }] },
    name: "Quillfang's Warren",
    description: "Hollowfen plants itself in front, daring you through before Quillfang's poison piles up.",
    // Same shielding shape as Bark Brute's Stand/Rune Warden's Escort -
    // Hollowfen strictly in front (row 0 < row 1), same column, so it
    // has to fall (or a pattern attack reach past it) before Quillfang
    // becomes a legal single-target. Reuses this session's own newest
    // pair (PR #246) rather than inventing a new enemy just for the
    // pairing - a real reason to grind through the wall fast, since
    // every round spent on Hollowfen's high HP is another stack of
    // Quillfang's Poison building up for free behind it. Column 0, not
    // the center (1,1) square - same knight's-move reason every
    // shielding formation already follows.
    pieces: [
      { defId: "hollowfen", pos: { row: 0, col: 0 } },
      { defId: "quillfang", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
  },

  // --- The Swarm (Enemy Ecosystem PRD 6-7, feat/hearthwood-swarm) ---
  // The first enemy ARCHETYPE, built like a build: four tiny bodies,
  // none shielded (every one a legal single-target from turn 1 - this
  // is a swarm, not a wall puzzle), and a synergy that makes the swarm
  // MORE dangerous the more of it is alive. `synergy.effects` is applied
  // battle-start to every living piece (autoBattleEngine.js), so the
  // `addTrigger turnStart` becomes a PER-PIECE per-round +1 Strength:
  // four alive = +4 collective/round; thin it (fast, via an AoE / chain
  // / pattern attacker) and the ramp drops. Single-target wastes
  // overkill on 14-18 HP bodies while the rest pile up - the archetype's
  // counterplay, using only existing effects (no enemy `summon` /
  // `onDeath` exists). Pieces at cols 0/2 only, never the (1,1) centre.
  "the-brood": {
    id: "the-brood",
    synergy: {
      label: "Strength in numbers",
      // Flat per-piece +1 Strength at battle start (mist-growler-pack's
      // model), NOT a compounding turnStart ramp: a ramp outpaced the
      // outlast Commander's per-round heals for a -6pp lean on the
      // RUNS=100 gate, and "kill bodies fast" is already the archetype's
      // pressure without it. Four bodies each +1 = a real opening
      // threat that FADES as you thin the swarm.
      effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
    },
    name: "The Brood",
    description: "Not one thing to fight. A dozen small ones, and every one of them is still a mouth.",
    pieces: [
      { defId: "sporelet", pos: { row: 0, col: 0 } },
      { defId: "mire-gnat", pos: { row: 0, col: 2 } },
      { defId: "sporelet", pos: { row: 1, col: 0 } },
      { defId: "mire-gnat", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-teeming": {
    id: "the-teeming",
    synergy: {
      label: "Strength in numbers",
      // Flat per-piece +1 Strength at battle start (mist-growler-pack's
      // model), NOT a compounding turnStart ramp: a ramp outpaced the
      // outlast Commander's per-round heals for a -6pp lean on the
      // RUNS=100 gate, and "kill bodies fast" is already the archetype's
      // pressure without it. Four bodies each +1 = a real opening
      // threat that FADES as you thin the swarm.
      effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
    },
    name: "The Teeming",
    description: "The mire empties itself at you all at once. Clear the cloud fast or drown in it.",
    pieces: [
      { defId: "mire-gnat", pos: { row: 0, col: 0 } },
      { defId: "thorn-tick", pos: { row: 0, col: 2 } },
      { defId: "thorn-tick", pos: { row: 1, col: 0 } },
      { defId: "sporelet", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },

  // --- The Fortress (Enemy Ecosystem PRD 8, feat/hearthwood-fortress) ---
  // The Swarm's opposite: THREE very tough bodies that STALL. Two walls
  // in front (row 0) shield a self-mender behind them (row 1) - single-
  // target has to grind a 60-HP warden down before the mender is a legal
  // target; a pattern / reach / AoE attacker snipes past. Deliberately 3
  // pieces, never 4: "4+ bodies" is the Swarm's identity (the-brood /
  // the-teeming) and drives the swarm hint + swarm threat tag - a
  // fortress must stay under it. `synergy` is a FLAT per-round +3 Block
  // to every living piece (block RESETS each round, so `turnStart` is
  // non-compounding by construction - the twin-watch / rune-wardens-
  // escort precedent, not #433's strength ramp). Counter: armour-break
  // (Shatter / Sunder), a damage-over-time, or steady sustained
  // pressure. Cols 0/2 only, never the (1,1) centre.
  "the-bulwark": {
    id: "the-bulwark",
    synergy: {
      label: "The wall holds firm",
      effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
    },
    name: "The Bulwark",
    description: "Two wardens shoulder to shoulder, and a mender behind them stitching every crack shut before you can widen it.",
    pieces: [
      { defId: "oakshell-warden", pos: { row: 0, col: 0 } },
      { defId: "oakshell-warden", pos: { row: 0, col: 2 } },
      { defId: "mossmender", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-bastion": {
    id: "the-bastion",
    synergy: {
      label: "The wall holds firm",
      effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
    },
    name: "The Bastion",
    description: "The Warden takes the blows. The Bastion returns them. And the Mender makes sure neither one stops.",
    pieces: [
      { defId: "oakshell-warden", pos: { row: 0, col: 0 } },
      { defId: "grave-bastion", pos: { row: 0, col: 2 } },
      { defId: "mossmender", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
  },

  // --- The Hunters (Enemy Ecosystem PRD, feat/hearthwood-hunters) ---
  // The Fortress's opposite: a fast pack that IGNORES your wall and piles
  // onto your softest unit (each piece is `hunter: true` - enemies.js -
  // which flips threatTarget's sort to lowest-threat / lowest-HP first).
  // 3 pieces, all row 0, no shielding (hunters rush, they don't hide -
  // also keeps `backline` off the threat read and stays under the Swarm's
  // 4+ gates, the #434 lesson). synergy is a FLAT battle-start +1
  // Strength (the Swarm's model - scales with body count, fades as you
  // thin it; NOT a turnStart ramp - the #433 aatos trap). The identity
  // is the `hunter` flag; the synergy is a small bite and the first
  // fairness lever. Counter: a taunt / decoy, a bodyguard (units.js
  // `guard`), or even HP across the squad.
  "the-pack": {
    id: "the-pack",
    synergy: { label: "They hunt the weak one", effects: [{ type: "applyBuff", id: "strength", amount: 2 }] },
    name: "The Pack",
    description: "Three of them, low and fast, already circling the one of you that looks tired.",
    pieces: [
      { defId: "fen-stalker", pos: { row: 0, col: 0 } },
      { defId: "pack-runner", pos: { row: 0, col: 1 } },
      { defId: "fen-stalker", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-run-down": {
    id: "the-run-down",
    synergy: { label: "They hunt the weak one", effects: [{ type: "applyBuff", id: "strength", amount: 2 }] },
    name: "The Run-Down",
    description: "The runners open the wound. The one behind them decides who doesn't get back up.",
    pieces: [
      { defId: "pack-runner", pos: { row: 0, col: 0 } },
      { defId: "throat-taker", pos: { row: 0, col: 1 } },
      { defId: "pack-runner", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },

  // --- The Rot (Enemy Ecosystem PRD, feat/hearthwood-rot) ---
  // Poison-stacking bodies (enemies.js: rotgut-crawler / spore-lurcher /
  // mire-sworn, + plaguebearer) that punish a slow fight. synergy "The
  // rot won't quit" = a per-living-piece FLAT turnStart → heal 1 (each
  // rot-thing knits itself back 1 HP/round - non-compounding, the
  // mildest repeating effect, the twin-watch / #434 precedent; NOT a
  // strength/regen RAMP, which is the #433 aatos trap). The poison
  // threat is carried entirely by the pieces' own `debuff poison` steps.
  // 3 pieces (stays under the Swarm's >= 4 gate - the #434 lesson).
  // Counter: cleanse (stop the drip), regen (out-heal it), or burst
  // (close it before the stacks + the mend outlast you).
  "the-blight": {
    id: "the-blight",
    synergy: { label: "The rot won't quit", effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 1 } }] },
    name: "The Blight",
    description: "Three of them, low to the ground, and the ground going soft and black behind them.",
    pieces: [
      { defId: "rotgut-crawler", pos: { row: 0, col: 0 } },
      { defId: "spore-lurcher", pos: { row: 0, col: 1 } },
      { defId: "rotgut-crawler", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-festering": {
    id: "the-festering",
    synergy: { label: "The rot won't quit", effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 1 } }] },
    name: "The Festering",
    description: "The lurcher clouds the air. The Mire-Sworn holds the line. And the Plaguebearer, safe behind them, just breathes.",
    pieces: [
      { defId: "spore-lurcher", pos: { row: 0, col: 0 } },
      { defId: "mire-sworn", pos: { row: 0, col: 2 } },
      { defId: "plaguebearer", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
  },

  // --- The Coven (Enemy Ecosystem PRD, feat/hearthwood-coven) ---
  // A shield puzzle where the SHIELDED piece is the priority target: the
  // coven-matron (enemies.js) sits at row 1 behind a front piece and
  // buffs every other living enemy +1 Strength/round (its `covenAura`,
  // ticked by autoBattleEngine.js's applyCovenTick). Reach past the
  // shield and kill it first (a pattern attacker, an executioner, a
  // Sunder) or the front pieces snowball. `synergy` is LABEL-ONLY
  // (effects: []) - the identity is the matron's covenAura, not a squad
  // synergy; the label drives the .hw-coven-hint / coach / badge hooks.
  // 3 pieces (under the Swarm's >= 4 gate - the #434 lesson).
  "the-conclave": {
    id: "the-conclave",
    synergy: { label: "The coven's blessing", effects: [] },
    name: "The Conclave",
    description: "Two of them stand ready, and behind them a third that only ever moves its lips.",
    pieces: [
      { defId: "bog-devotee", pos: { row: 0, col: 0 } },
      { defId: "hex-acolyte", pos: { row: 0, col: 2 } },
      { defId: "coven-matron", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-choir": {
    id: "the-choir",
    synergy: { label: "The coven's blessing", effects: [] },
    name: "The Choir",
    description: "The Acolyte takes the hits. The Devotee returns them. And under both, the Matron keeps the tune going.",
    pieces: [
      { defId: "hex-acolyte", pos: { row: 0, col: 0 } },
      { defId: "bog-devotee", pos: { row: 0, col: 2 } },
      { defId: "coven-matron", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "bonewardens-watch": {
    id: "bonewardens-watch",
    name: "Bonewarden's Watch",
    description: "It doesn't hide anything behind a wall. It just won't let go of your attention.",
    // A genuinely different kind of protection from every prior
    // formation here: Bark Brute's Stand/Quillfang's Warren shield by
    // POSITION (row 0 in front of row 1) - break the front piece and
    // the back one is exposed. Bonewarden protects by MECHANIC instead
    // - its own self-Taunt (autoBattleEngine.js's randomLiving) forces
    // every single-target player attack onto it regardless of where
    // either piece stands, so Gravequill sits in the SAME row, fully
    // "exposed" by position, and still can't be touched while
    // Bonewarden lives. Only once Bonewarden falls does Gravequill's
    // own Execute (punishes a badly wounded player unit) become a real
    // threat - the fight has two distinct phases instead of one.
    pieces: [
      { defId: "bonewarden", pos: { row: 1, col: 0 } },
      { defId: "gravequill", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-hollow-court": {
    id: "the-hollow-court",
    name: "The Hollow Court",
    description: "Three of the deepest Hearthwood's own guardians, standing together for the first time.",
    // Marc: "enemies and bosses need to be more challenging" - a real
    // late-run gauntlet, not another shielding puzzle: no piece hides
    // behind another (a plain 3-across row, no knight's-move blind
    // spots to avoid), so there's no positional trick to lean on. The
    // difficulty comes entirely from 3 self-buffed threats resolving
    // AT ONCE - Ironmaw's Strength, Stonewake's Ward, Needlefen's Stun
    // - reusing 3 already-shipped mooks rather than designing new ones,
    // same "recombine, don't reinvent" discipline every formation here
    // already follows. Placed right before the run's final relic pickup
    // and the boss itself, past the difficulty ramp's 60% threshold, so
    // it stacks with that too.
    pieces: [
      { defId: "ironmaw", pos: { row: 0, col: 0 } },
      { defId: "stonewake", pos: { row: 0, col: 1 } },
      { defId: "needlefen", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-wearing-down": {
    id: "the-wearing-down",
    name: "The Wearing Down",
    description: "One heals faster than you can hurt it. The other makes sure you can't hurt it fast.",
    // A genuine swarm (Mist Growler Pack's own no-shielding shape),
    // reusing 2 already-shipped mooks that had never been paired -
    // Duskhollow's persistent Regen (re-granted every round, not a
    // decaying one-shot) and Needlefen's Stun. Neither piece alone is
    // that dangerous; together, every stunned round is a round
    // Duskhollow's sustain keeps compounding for free - the fight
    // rewards splitting damage to kill Needlefen FIRST (stop losing
    // actions) even though Duskhollow is the tankier, more "obvious"
    // target.
    pieces: [
      { defId: "duskhollow", pos: { row: 0, col: 0 } },
      { defId: "needlefen", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-cursed-thicket": {
    id: "the-cursed-thicket",
    name: "The Cursed Thicket",
    description: "One of them wants your attention. The other doesn't need it.",
    // The same MECHANIC-protection identity Bonewarden's Watch already
    // established (Bramblespite's own self-Taunt forces every single-
    // target attack onto it regardless of position, same as
    // Bonewarden's), but with a genuinely different second phase:
    // Gravequill only threatened a badly wounded player unit once
    // exposed - Hollowcurse instead spends the WHOLE fight, safely
    // untouched, stripping the squad's own buffs and stacking Poison.
    // Bramblespite also gets more dangerous the longer it's fought
    // (Wounded Fury), so racing it down fast still costs more than it
    // looks like - the squad can't stall out Hollowcurse's curse by
    // taking it slow.
    pieces: [
      { defId: "bramblespite", pos: { row: 1, col: 0 } },
      { defId: "hollowcurse", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-unbroken-root": {
    id: "the-unbroken-root",
    name: "The Unbroken Root",
    description: "One of them cannot be worn down. The other doesn't need to be touched at all.",
    // Marc: "the game needs to be difficult without cheap tactics -
    // real tactics, real player decisions, testing intelligence and
    // build, but still fun to play." The tactical answer, not a
    // numbers one: Ironroot's Taunt forces every single-target attack
    // onto it (same mechanic-shielding as Bonewarden's Watch/The
    // Cursed Thicket - both pieces share a row, no positional cover),
    // while its own Cleanse strips whatever debuff the squad just
    // landed - a build leaning on Poison/Weak/Vulnerable/Stun gets
    // NOTHING here, only raw single-target damage matters. Thornfen
    // sits fully exposed and untouchable behind it, swinging freely
    // (8/6 per round) the whole time it takes to grind Ironroot down -
    // every round spent solving "how do I actually hurt this thing"
    // is a round Thornfen gets for free. The real decision this fight
    // tests: does the squad's build have enough RAW single-target
    // damage to end this quickly, or does it lean on exactly the kind
    // of debuff stacking Ironroot was built to shrug off.
    pieces: [
      { defId: "ironroot", pos: { row: 1, col: 0 } },
      { defId: "thornfen", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },
  "the-withering-pact": {
    id: "the-withering-pact",
    name: "The Withering Pact",
    description: "Two rots that don't compete for the same wound. Together they cover all of it.",
    // A genuine swarm (Mist Growler Pack's own no-shielding shape),
    // pairing Hollowspite (Poison + Weak) and Duskwither (Poison +
    // Vulnerable) - both stack Poison independently (compounding the
    // DOT fast), while Weak and Vulnerable together hit the SAME
    // damage-math formula from both directions at once (attacker's own
    // output cut, defender's own damage taken raised) - the two mooks'
    // debuff kits don't overlap, they cover the full spread between
    // them.
    pieces: [
      { defId: "hollowspite", pos: { row: 0, col: 0 } },
      { defId: "duskwither", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
  },

  // Act V - The Crownless (crownless.js / runEngine.startCrownlessBattle).
  // Not a RUN_PATH node: spun up once, after the Hollow King falls, as
  // the finale's "your build, turned to face you" fight. Placeholder
  // first - a curated three-piece set that leaves no single build
  // approach a free ride, rather than a true 1:1 squad clone (that needs
  // engine support to use UNIT defs as enemy pieces - a later pass):
  //   - Ironroot: Taunt + Cleanse -> a debuff-stacking build gets
  //     nothing from it, only raw single-target damage lands.
  //   - Hollowcurse: Sunder + Poison -> a buff-stacking build watches
  //     its buffs stripped and a DOT left behind.
  //   - Grimspite: a plain heavy bruiser -> a glass-cannon build has to
  //     actually survive it.
  // The player CANNOT truly lose this fight (win or loss both lead to
  // the Forest's Choice - "defeat yourself, or accept yourself"), so a
  // slightly punishing set is intentional.
  "the-crownless-mirror": {
    id: "the-crownless-mirror",
    name: "The Crownless",
    description: "It doesn't fight you. It shows you what you carry, and asks if you can beat it.",
    pieces: [
      { defId: "hollowcurse", pos: { row: 0, col: 0 } },
      { defId: "grimspite", pos: { row: 1, col: 1 } },
      { defId: "ironroot", pos: { row: 0, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
    synergy: {
      label: "The Crownless - your build, turned to face you",
      effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }],
    },
  },

  // --- Bodyguard formations (2026-09-07, "lisää sisältöä") ----------
  // Three mid/late-run solo battle nodes (RUN_PATH) become "the same
  // enemy, now with a bodyguard": a lighter Act-appropriate mook
  // SHIELDS the node's original enemy (same shielding rule / off-centre
  // column as Bark Brute's Stand & Rune Warden's Escort - no knight
  // move reaches (1,1), so a shielded piece there would be permanently
  // immune to Knight's Leap). Effective incoming damage stays close to
  // one attacker until the front falls, the lowest-risk way to add
  // formation variety without sliding the difficulty curve (the lesson
  // from the route-variety round: a formation is NOT a solo).
  "emberwracks-guard": {
    id: "emberwracks-guard",
    name: "Emberwrack's Guard",
    description: "A Duskgnaw plants itself in front, giving the Emberwrack a clean line at your whole squad.",
    pieces: [
      { defId: "duskgnaw", pos: { row: 0, col: 0 } },
      { defId: "emberwrack", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
    synergy: { label: "Guard and gunner", effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] },
  },
  "wraithgales-veil": {
    id: "wraithgales-veil",
    name: "Wraithgale's Veil",
    description: "A Needlefen holds the front while the Wraithgale works behind it, out of reach.",
    pieces: [
      { defId: "needlefen", pos: { row: 0, col: 2 } },
      { defId: "wraithgale", pos: { row: 1, col: 2 } },
    ],
    playerStart: { row: 2, col: 1 },
    synergy: { label: "Veiled and covered", effects: [{ type: "applyBuff", id: "evade", amount: 1 }] },
  },
  "hollowfangs-den": {
    id: "hollowfangs-den",
    name: "Hollowfang's Den",
    description: "A Duskwither guards the mouth of the den; the Hollowfang waits in the dark past it.",
    pieces: [
      { defId: "duskwither", pos: { row: 0, col: 0 } },
      { defId: "hollowfang", pos: { row: 1, col: 0 } },
    ],
    playerStart: { row: 2, col: 1 },
    synergy: { label: "The den holds", effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } }] },
  },
}

export function resolveFormation(formationOrEnemyId) {
  if (FORMATIONS[formationOrEnemyId]) return FORMATIONS[formationOrEnemyId]

  // Backward-compat adapter: a bare enemy id becomes a 1-piece formation
  // at the board's center square. `name: null` signals callers to fall
  // back to that single piece's own name instead of a formation name.
  return {
    id: formationOrEnemyId,
    name: null,
    description: null,
    pieces: [{ defId: formationOrEnemyId, pos: { row: 1, col: 1 } }],
    playerStart: { row: 2, col: 1 },
  }
}
