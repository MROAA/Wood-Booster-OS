// Hearthwood - New Game+: "The forest remembers" (First Song PRD §8, NAR-07:
// "on a new playthrough, places and clues out of reach before open in a
// different order, if the player already knows the forest's rules").
//
// What carries between runs (metaState.js `forestMemory`):
//   cycle      - runs you have WON (New Game+ level: 0 = first journey)
//   lore       - the truths you learned, ever (story flags below, win or lose)
//   endings    - the endings you have seen
//   lastRegard - how the forest saw you when your last run ended
// What it does (rules: services/heartwood/forestMemory.js):
//   - remembered truths count as known for story gates, so a chain's later
//     links can come before its first (you already know the way)
//   - places only a returning traveller finds (requiresFlag "remembers_the_forest")
//   - the forest's regard starts where you left it (a third of it, capped)
//   - +1 rune at the start per cycle (max +2)
//   - the PRD's hardest ending, The New Verse, opens on a return journey
//     once you know enough truths

// The truths. `text` is how the map panel / Forest's Choice names it.
export const LORE_TRUTHS = [
  { flag: "heard_the_name", text: "the Hollow King's name" },
  { flag: "read_the_camp_log", text: "the longship camp's log" },
  { flag: "heard_the_rememberer", text: "what the Rememberer keeps" },
  { flag: "read_the_barrow", text: "the shieldmaiden's oath" },
  { flag: "knows_the_veil", text: "what waits beyond the Veil" },
  { flag: "knows_the_four_promises", text: "the four promises" },
  { flag: "broke_the_jarls_oath", text: "the jarl's broken oath" },
  { flag: "faced_the_crownless", text: "the Crownless's face" },
]
export const LORE_FLAGS = LORE_TRUTHS.map((t) => t.flag)

// The pseudo-flag a returning traveller carries for story gates.
export const RETURNING_FLAG = "remembers_the_forest"

export const NEW_VERSE = {
  endingId: "ending-newverse",
  minCycle: 1, // a return journey
  truthsNeeded: 4, // remembered + learned this run
}

export const REGARD_CARRY = { share: 1 / 3, cap: 20 }
export const RUNE_PER_CYCLE = 1
export const RUNE_CYCLE_MAX = 2

export function truthText(flag) {
  return LORE_TRUTHS.find((t) => t.flag === flag)?.text || flag
}
