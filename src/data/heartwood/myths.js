// Hearthwood - the Four Tellings: conflicting myths of where the forest came
// from (First Song PRD §8: "not every people tells the same history; the
// player can combine evidence and form their own interpretation").
//
// Each telling is told by a people, answers the PRD's central question its
// own way, and leans toward one ending. EVIDENCE comes from choices the run
// already records (story flags) - no extra bookkeeping: siding with a clan,
// reading the barrow, hearing the Rememberer... Every piece supports ONE
// telling. In the Story Journal the player can choose which telling they
// BELIEVE (needs at least one piece of evidence). The belief shows on the
// Forest's Choice and decides the last word of the ending.
// Rules: services/heartwood/myths.js. All text hand-written.

export const TELLINGS = {
  ember: {
    id: "ember",
    name: "The Ember Telling",
    teller: "the Ember Clans",
    icon: "🔥",
    color: "#e07a3a",
    telling: "The forest is a fire that fell asleep. Its roots are cooled embers. It is not broken - it is waiting to be woken, and held.",
    answer: "A sleeping fire: wake it, and bind it.",
    endingId: "ending-ember",
    coda: "Somewhere on the ridge the Ember Clans sing all night. They were right, they say. The forest was a fire, and now it is held.",
  },
  tide: {
    id: "tide",
    name: "The Tide Telling",
    teller: "the Tide Folk",
    icon: "🌊",
    color: "#7fa8e0",
    telling: "The forest rose out of a drowned world. The water remembers everything that was before. It is broken, and it can be mended - if someone remembers how it was.",
    answer: "A drowned world: remember it, and restore it.",
    endingId: "ending-rooted",
    coda: "In Mistfen the Tide Folk lower their nets into water that is clear again. 'It remembered,' they say. 'We only had to help it.'",
  },
  stone: {
    id: "stone",
    name: "The Stone Telling",
    teller: "the Stone Moot",
    icon: "⛰",
    color: "#a8a089",
    telling: "The forest is a grave. The oldest gods were buried here, and the trees grew from them. It should not be finished - only kept quiet.",
    answer: "A grave: let it rest, and let it be forgotten.",
    endingId: "ending-hollow",
    coda: "The Stone Moot sets one more stone on the long ring around the Deepening. 'Let them sleep,' says Kivi. 'Quiet is not the same as gone.'",
  },
  song: {
    id: "song",
    name: "The Seers' Telling",
    teller: "the longship seers",
    icon: "ᛟ",
    color: "#e0b04a",
    telling: "The forest is the last verse of the First Song, never finished. Not broken - left open. Whoever finishes it decides what the world becomes.",
    answer: "An unfinished song: sing a new verse, and leave room after it.",
    endingId: "ending-newverse",
    coda: "Far away, a woman with seer's braids stops on the path and listens. 'Not finished,' she says, smiling. 'Continued.'",
  },
}
export const TELLING_ORDER = ["ember", "tide", "stone", "song"]

// story flag -> the telling it supports, and what you saw.
export const EVIDENCE = {
  sided_ember: { telling: "ember", text: "The flame-elementals told you the forest was born of fire." },
  rite_strengthened: { telling: "ember", text: "When you fed the ritual, the roots ran hot - something down there still burns." },
  sided_tide: { telling: "tide", text: "The tide-elementals told you the forest rose out of the water." },
  heard_the_rememberer: { telling: "tide", text: "The Rememberer in the Tarn keeps memories older than the trees." },
  rite_purified: { telling: "tide", text: "When you mended the ritual, clean water welled up under the roots." },
  sided_stone: { telling: "stone", text: "The stone-elementals told you the forest is a grave." },
  read_the_barrow: { telling: "stone", text: "The barrow-stones are older than the longships - the dead were laid in the forest's bones." },
  hollow_accepted: { telling: "stone", text: "The Silence's crown felt like the quiet of a tomb." },
  read_the_camp_log: { telling: "song", text: "The longship log: the forest answered them - as if it were listening for a verse." },
  knows_the_four_promises: { telling: "song", text: "The seers' heir: the last verse can still be sung." },
  broke_the_jarls_oath: { telling: "song", text: "The jarl's oath broke like a line of a song cut short." },
  echo_taken: { telling: "song", text: "A shard of the Song remembered something that never happened." },
}

// Evidence the belief needs before it is "borne out" at the end.
export const BELIEF_BORNE_OUT = 2
