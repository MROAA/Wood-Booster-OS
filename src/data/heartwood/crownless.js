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
    tagline: "Growth. Peace. A return to what was.",
    blurb:
      "Restore the Heartwood to the shape it held before the rot. The Warden takes the crown, the roots hold, the forest goes quiet and green again.",
    endingId: "ending-rooted",
  },
  {
    id: "ember",
    name: "The Ember Path",
    tagline: "Power. Change. Fire purifies.",
    blurb:
      "Give the forest a new identity - fierce, bright, unafraid. The Ashlord rises, and the Heartwood is reborn as something that will not be caught sleeping again.",
    endingId: "ending-ember",
  },
  {
    id: "hollow",
    name: "The Hollow Path",
    tagline: "Truth. Void. You.",
    blurb:
      "Accept the void as part of the forest, and the crown as part of you. No new guardian rises. The Heartwood and the emptiness become one thing, and you carry it.",
    endingId: "ending-hollow",
  },
]

export function forestPathByEndingId(endingId) {
  return FOREST_PATHS.find((p) => p.endingId === endingId) || null
}
