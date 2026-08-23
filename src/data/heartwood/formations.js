// Heartwood Trial - multi-piece enemy formations for the grid battle.
// A formation is just data: which enemy defs sit where, and where the
// player starts. `resolveFormation` also accepts a bare ENEMIES id and
// synthesizes a 1-piece formation for it, so the 3 original solo fights
// (Rotwood Husk, Moss Troll, Rune Warden) keep working with zero changes
// to their own data.

export const FORMATIONS = {
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
