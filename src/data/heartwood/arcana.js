// The Major Arcana - Hearthwood's tarot heroes and their card numbers.
//
// Marc: the cards are "kuin tarot kortteja joissa on tietoa yksiköistä".
// The hero ids ARE the Major Arcana (the-fool, the-magician...); this is
// the traditional numbering, shown as a roman numeral at the top of the
// hero's card (UnitCard.jsx, heartwood-cards.css). Fused copies (Tier 2 /
// Tier 3) keep their arcana via `fusedFrom`. Heroes outside the arcana
// simply have no numeral.
// Public API: ARCANA, arcanaNumeral(def) -> "0" | "I" ... "XXI" | null

export const ARCANA = {
  "the-fool": 0,
  "the-magician": 1,
  "the-high-priestess": 2,
  "the-empress": 3,
  "the-emperor": 4,
  "the-hierophant": 5,
  "the-lovers": 6,
  "the-chariot": 7,
  strength: 8,
  "the-hermit": 9,
  "wheel-of-fortune": 10,
  justice: 11,
  "the-hanged-man": 12,
  death: 13,
  temperance: 14,
  "the-devil": 15,
  "the-tower": 16,
  "the-star": 17,
  "the-moon": 18,
  "the-sun": 19,
  judgement: 20,
  "the-world": 21,
}

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"]

export function arcanaNumeral(def) {
  const id = def?.fusedFrom || def?.id
  return id != null && Object.hasOwn(ARCANA, id) ? ROMAN[ARCANA[id]] : null
}
