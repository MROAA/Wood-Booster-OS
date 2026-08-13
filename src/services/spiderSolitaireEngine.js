const SUITS_BY_DIFFICULTY = {
  1: ["♠"],
  2: ["♠", "♥"],
  4: ["♠", "♥", "♦", "♣"],
}

const RED_SUITS = ["♥", "♦"]

const RANK_LABELS = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
}

function rankLabel(rank) {
  return RANK_LABELS[rank] || String(rank)
}

function isRedSuit(suit) {
  return RED_SUITS.includes(suit)
}

function shuffle(cards) {
  const result = [...cards]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function createShuffledDeck(difficulty) {
  const suits = SUITS_BY_DIFFICULTY[difficulty] || SUITS_BY_DIFFICULTY[1]
  const copiesPerSuit = 8 / suits.length

  const deck = []
  let uid = 0

  for (let copy = 0; copy < copiesPerSuit; copy++) {
    for (const suit of suits) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({
          id: `c${uid++}`,
          suit,
          rank,
          faceUp: false,
        })
      }
    }
  }

  return shuffle(deck)
}

function dealInitialGame(difficulty) {
  const deck = createShuffledDeck(difficulty)
  const tableau = Array.from({ length: 10 }, () => [])

  let idx = 0
  for (let col = 0; col < 10; col++) {
    const count = col < 4 ? 6 : 5
    for (let i = 0; i < count; i++) {
      tableau[col].push(deck[idx++])
    }
    tableau[col][tableau[col].length - 1].faceUp = true
  }

  const stock = deck.slice(idx)

  return {
    difficulty,
    tableau,
    stock,
    completed: [],
    moveCount: 0,
  }
}

function isSequenceRun(column, startIndex) {
  if (startIndex < 0 || startIndex >= column.length) return false

  for (let i = startIndex; i < column.length; i++) {
    if (!column[i].faceUp) return false

    if (i > startIndex) {
      const prev = column[i - 1]
      const curr = column[i]
      if (prev.suit !== curr.suit) return false
      if (prev.rank !== curr.rank + 1) return false
    }
  }

  return true
}

function canDropOn(destColumn, movingTopRank) {
  if (destColumn.length === 0) return true

  const destTop = destColumn[destColumn.length - 1]
  if (!destTop.faceUp) return false

  return destTop.rank === movingTopRank + 1
}

function cloneState(state) {
  return {
    difficulty: state.difficulty,
    tableau: state.tableau.map((col) => col.map((card) => ({ ...card }))),
    stock: state.stock.map((card) => ({ ...card })),
    completed: [...state.completed],
    moveCount: state.moveCount,
  }
}

function moveCards(state, sourceCol, cardIndex, destCol) {
  if (sourceCol === destCol) return null

  const source = state.tableau[sourceCol]
  const dest = state.tableau[destCol]

  if (!isSequenceRun(source, cardIndex)) return null

  const movingCards = source.slice(cardIndex)
  if (!canDropOn(dest, movingCards[0].rank)) return null

  const next = cloneState(state)

  next.tableau[sourceCol] = source.slice(0, cardIndex).map((c) => ({ ...c }))
  if (next.tableau[sourceCol].length > 0) {
    next.tableau[sourceCol][next.tableau[sourceCol].length - 1].faceUp = true
  }

  next.tableau[destCol] = [
    ...dest.map((c) => ({ ...c })),
    ...movingCards.map((c) => ({ ...c })),
  ]

  next.moveCount += 1

  return resolveCompletedRuns(next)
}

function resolveCompletedRuns(state) {
  const next = cloneState(state)

  for (let col = 0; col < next.tableau.length; col++) {
    const column = next.tableau[col]
    if (column.length < 13) continue

    const startIndex = column.length - 13
    if (!isSequenceRun(column, startIndex)) continue

    const run = column.slice(startIndex)
    if (run[0].rank !== 13 || run[run.length - 1].rank !== 1) continue

    next.tableau[col] = column.slice(0, startIndex)
    if (next.tableau[col].length > 0) {
      next.tableau[col][next.tableau[col].length - 1].faceUp = true
    }

    next.completed = [...next.completed, { suit: run[0].suit }]
  }

  return next
}

function canDealFromStock(state) {
  if (state.stock.length === 0) return false
  return state.tableau.every((col) => col.length > 0)
}

function dealFromStock(state) {
  if (!canDealFromStock(state)) return null

  const next = cloneState(state)
  const batch = next.stock.slice(0, 10)
  next.stock = next.stock.slice(10)

  batch.forEach((card, i) => {
    next.tableau[i].push({ ...card, faceUp: true })
  })

  next.moveCount += 1

  return resolveCompletedRuns(next)
}

function isGameWon(state) {
  return state.completed.length === 8
}

const DIFFICULTY_MULTIPLIER = {
  1: 1,
  2: 1.5,
  4: 2,
}

function computeScore({ difficulty, moveCount, seconds }) {
  const base = 5000 - moveCount * 10 - seconds * 2
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1

  return Math.max(0, Math.round(base * multiplier))
}

export {
  createShuffledDeck,
  dealInitialGame,
  isSequenceRun,
  canDropOn,
  moveCards,
  resolveCompletedRuns,
  canDealFromStock,
  dealFromStock,
  isGameWon,
  computeScore,
  cloneState,
  rankLabel,
  isRedSuit,
}
