// Heartwood Trial - multi-piece enemy formations for the grid battle.
// A formation is just data: which enemy defs sit where, and where the
// player starts. `resolveFormation` also accepts a bare ENEMIES id and
// synthesizes a 1-piece formation for it, so the 3 original solo fights
// (Rotwood Husk, Moss Troll, Rune Warden) keep working with zero changes
// to their own data.

export const FORMATIONS = {
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
