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
