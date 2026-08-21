// Heartwood Trial - grid geometry and targeting. Small, pure, reusable
// functions - same "primitives, not bespoke code per card" philosophy as
// effects.js. Nothing here mutates state; everything reads it.
//
// Board orientation is fixed, not player-relative: row 0 is the front
// rank (closest to where the player enters), row 2 is the back rank.

export function isOnBoard(pos, grid) {
  return pos.row >= 0 && pos.row < grid.rows && pos.col >= 0 && pos.col < grid.cols
}

export function samePos(a, b) {
  return a.row === b.row && a.col === b.col
}

// Chebyshev (8-directional) adjacency - used both for melee-range card
// filtering and for the free one-square move action.
export function kingAdjacent(a, b) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) <= 1 && !samePos(a, b)
}

function livingEnemyAt(state, pos) {
  return state.enemies.find((e) => e.hp > 0 && samePos(e.pos, pos))
}

// The array a piece actually belongs to - used only by isShielded
// below, so shielding is checked strictly within one side's own
// formation. Deliberately NOT used by piecesAtPositions/livingEnemyAt,
// which stay enemy-only: those resolve pattern-damage targets for the
// player's own attacks, and mixing sides in there would let a
// player's Rook's Charge hit its own squad.
function sideArrayFor(state, pieceId) {
  if (state.playerUnits?.some((u) => u.id === pieceId)) return state.playerUnits
  if (state.player?.id === pieceId) return [state.player]
  return state.enemies
}

// A living piece is shielded - not a legal target for an ordinary
// single-target attack - if another living piece on the SAME SIDE
// occupies the same column, strictly closer to row 0 (a lower row
// number). Cross-side never shields: an enemy sitting "in front of"
// a player unit by absolute row doesn't protect it from other
// enemies, and the reverse would be equally nonsensical - found via
// a real bug where Rune Warden's Escort's row-0 Moss Troll ended up
// falsely shielding the player's own row-1 front-center unit before
// this was scoped to same-side-only. This is what already let Rune
// Warden's Escort's Husks protect the Warden behind them, and applies
// exactly as-is to the player's own formation now that SLOT_POSITIONS
// has one forward slot (row 1, col 1) in front of the three back
// slots (row 2) - a unit placed forward in the same column shields
// whichever unit is placed behind it. Recomputed fresh from current
// HP every call; there's no separate "unshield" step.
export function isShielded(state, pieceId) {
  const side = sideArrayFor(state, pieceId)
  const piece = side.find((p) => p.id === pieceId)
  if (!piece || piece.hp <= 0) return false
  return side.some(
    (other) =>
      other.id !== pieceId && other.hp > 0 && other.pos.col === piece.pos.col && other.pos.row < piece.pos.row,
  )
}

// Legal targets for an ordinary (non-pattern) single-target card: living,
// unshielded, and - if the card requires melee range - adjacent to the
// player. Pattern cards never call this; they resolve targets from shape
// functions instead, which is what lets them bypass shielding.
export function legalSingleTargets(state, card) {
  return state.enemies.filter((e) => {
    if (e.hp <= 0) return false
    if (isShielded(state, e.id)) return false
    if (card?.range === "melee" && !kingAdjacent(state.player.pos, e.pos)) return false
    return true
  })
}

export function rookLine(origin, grid) {
  const squares = []
  for (let col = 0; col < grid.cols; col++) {
    if (col !== origin.col) squares.push({ row: origin.row, col })
  }
  return squares
}

export function bishopDiagonal(origin, grid) {
  const squares = []
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (row === origin.row && col === origin.col) continue
      if (Math.abs(row - origin.row) === Math.abs(col - origin.col)) squares.push({ row, col })
    }
  }
  return squares
}

export function knightOffsets(origin, grid) {
  const deltas = [
    [1, 2], [1, -2], [-1, 2], [-1, -2],
    [2, 1], [2, -1], [-2, 1], [-2, -1],
  ]
  return deltas
    .map(([dr, dc]) => ({ row: origin.row + dr, col: origin.col + dc }))
    .filter((pos) => isOnBoard(pos, grid))
}

const PATTERN_SHAPES = { rook: rookLine, bishop: bishopDiagonal, knight: knightOffsets }

export function resolvePattern(state, patternName, origin) {
  const shapeFn = PATTERN_SHAPES[patternName]
  return shapeFn ? shapeFn(origin, state.grid) : []
}

export function piecesAtPositions(state, positions) {
  return positions.map((pos) => livingEnemyAt(state, pos)).filter(Boolean).map((e) => e.id)
}

// A card needs a resolved enemy target if any of its effects damages
// something, or explicitly reads "target" (e.g. Zugzwang's debuff).
export function cardNeedsTarget(def) {
  return def.effects.some((e) => e.type === "damage" || e.target === "target")
}

export function emptyAdjacentSquares(state, origin) {
  const squares = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const pos = { row: origin.row + dr, col: origin.col + dc }
      if (!isOnBoard(pos, state.grid)) continue
      if (livingEnemyAt(state, pos)) continue
      if (samePos(pos, state.player.pos)) continue
      squares.push(pos)
    }
  }
  return squares
}
