// Hearthwood - Act V: The Crownless. Marc: "Acts V-VII loppuun" ->
// "Act V + Echo-epilogi". After the Hollow King falls, the run isn't
// over: the forest's true core opens, and the Crownless - not a king,
// not the void, a *choice* - waits on the throne. It shows you your own
// build turned to face you, then the forest offers three paths and you
// pick the ending yourself.
//
// This module is the data for that sequence: the Crownless's opening
// line (which varies by what your squad is built around), a
// dominant-tribe helper, and the three Forest's Choice paths. The
// encounter formation itself lives in formations.js
// (`the-crownless-mirror`); the throne + epilogue scenes live in
// cinematics.js.
//
// Text transcribed / condensed from docs/hearthwood-story-acts.md
// ("The Crownless - battle dialogue"), genericised to second person.

import { deployedTribeCounts } from "../../services/heartwood/runEngine"

// The Crownless's opening line, keyed by the squad's dominant tribe.
// The bible writes six: Wood / Ember / Tide / Stone / Cosmic / Hollow.
// The mechanical tribes (warden/fang/root/grove/spirit/thorn) and an
// empty board fall to `default`.
export const CROWNLESS_INTRO_BY_TRIBE = {
  wood: "Growth without roots is a lie. Show me what you lean on.",
  grove: "Growth without roots is a lie. Show me what you lean on.",
  ember: "Fire without purpose is ruin. Show me why you burn.",
  tide: "Flow without direction is drowning. Show me where you're going.",
  stone: "Hardness without a heart is empty. Show me what you protect.",
  cosmic: "Light without shape is illusion. Show me what you're looking for.",
  shadow: "Void without truth is fear. Show me who you are.",
  default: "You came. Not to win. Not to kill. Not to save. You came to be seen.",
}

// Priority order for breaking a tie / choosing which axis "the build is
// about" - elemental identities first (they're what the Crownless line
// speaks to), then a mechanical fallback.
const TRIBE_PRIORITY = ["shadow", "ember", "cosmic", "tide", "stone", "wood", "grove", "thorn", "fang", "root", "spirit", "warden"]

export function dominantTribe(runState) {
  const counts = deployedTribeCounts(runState) || {}
  let best = null
  let bestN = 0
  for (const t of TRIBE_PRIORITY) {
    const n = counts[t] || 0
    if (n > bestN) {
      best = t
      bestN = n
    }
  }
  return best
}

export function crownlessIntroLine(runState) {
  const t = dominantTribe(runState)
  return CROWNLESS_INTRO_BY_TRIBE[t] || CROWNLESS_INTRO_BY_TRIBE.default
}

// The Forest's Choice - three paths, one ending each. The player's
// accumulated allegiances (cinematics.suggestedEndingId) pre-highlight
// one, but the pick here is final and overrides the tally.
export const FOREST_PATHS = [
  {
    id: "rooted",
    name: "The Rooted Path",
    tagline: "Restore the Song. A return to what was.",
    blurb:
      "Sing the First Song back the way it was. Song, Root, Rune and Silence return to balance and the Warden takes the crown - but a restored song is not the same song, and something of this world changes for good.",
    endingId: "ending-rooted",
  },
  {
    id: "ember",
    name: "The Ember Path",
    tagline: "Bind the forest. Burn the runes in.",
    blurb:
      "Burn runes into every root and hold the forest's forces in check. The Ashlord rises and the Heartwood will never break again - safer, more predictable, and far less free.",
    endingId: "ending-ember",
  },
  {
    id: "hollow",
    name: "The Hollow Path",
    tagline: "Accept the Silence. Truth. You.",
    blurb:
      "Accept the Silence as part of the forest, and let part of it be forgotten so the rest of the world can go on. No new guardian rises. The Heartwood and the emptiness become one thing, and you carry it.",
    endingId: "ending-hollow",
  },
]

// New Game+ (forestMemory.js NEW_VERSE): the PRD's hardest ending. Shown
// on the Forest's Choice locked until a return journey knows enough truths.
FOREST_PATHS.push({
  id: "newverse",
  name: "The New Verse",
  tagline: "Change the forest's laws. Leave room after.",
  blurb:
    "Neither restore the old song nor bind it nor let it go quiet: sing a new verse of your own - not a perfect order, just a different one, with room left after it. Only someone who has walked the forest more than once knows enough to try.",
  endingId: "ending-newverse",
  requiresNewVerse: true,
})

export function forestPathByEndingId(endingId) {
  return FOREST_PATHS.find((p) => p.endingId === endingId) || null
}
