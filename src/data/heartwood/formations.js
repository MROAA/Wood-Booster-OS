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
