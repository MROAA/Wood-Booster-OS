// Hearthwood - scripted story cinematics. Marc: "peli tarvitsee lisää
// syvyyttä" -> "ei koukkua eteneä" (no hook to keep going). The story
// bible (docs/hearthwood-story-acts.md, ~3600 lines, all hand-written
// by Marc) has a full opening and three full endings - and almost none
// of it reaches the player. This file carries the two bookends into the
// game: the intro before the first shop, and one of three endings after
// the final boss, chosen by the run's accumulated Act allegiances.
//
// A cinematic is pure data: an ordered list of dialogue lines
// ({ speaker, line, tone? }), plus optional title/subtitle/fade for the
// endings. StoryCinematic.jsx plays it as a click-to-advance reader.
// Text is transcribed/condensed from the bible and genericised - the
// bible addresses the player as "Marc"; here it is second person, the
// same call trials.js already made.

export const CINEMATICS = {
  intro: {
    id: "intro",
    fade: "black",
    lines: [
      { speaker: "The forest", tone: "whisper", line: "Wake up... The roots know you..." },
      {
        speaker: "Spacemonkey",
        line: "Don't mind that. The forest talks to every newcomer. Or... well. Not every one. Only the ones that matter.",
      },
      {
        speaker: "Spacemonkey",
        line: "Here. Keep this. It's a Seed. It isn't a magic item. It's... a promise.",
      },
      {
        speaker: "Sapling Spirit",
        line: "You hear us, don't you. The roots aren't ours anymore. Something is spreading up from below. Something is waking.",
      },
      { speaker: "The forest", tone: "whisper", line: "Don't let it grow." },
    ],
  },

  "ending-rooted": {
    id: "ending-rooted",
    title: "The Rooted King",
    subtitle: "Growth. Peace. A return to the roots.",
    fade: "green",
    lines: [
      { speaker: "The forest", tone: "gentle", line: "You chose peace." },
      {
        speaker: "Heartwood Warden",
        line: "The roots are strong. The heart beats again. I carry the crown - through your choice.",
      },
      { speaker: "The forest", line: "Growth returns. Peace returns. Thank you." },
      { speaker: "Spacemonkey", tone: "quiet", line: "...You gave it back its shape. I never could." },
    ],
  },

  "ending-ember": {
    id: "ending-ember",
    title: "The Ember Sovereign",
    subtitle: "Power. Change. A new beginning.",
    fade: "red",
    lines: [
      { speaker: "The forest", tone: "pulsing", line: "You chose power." },
      {
        speaker: "Ashlord Reborn",
        line: "Peace isn't enough. Growth isn't enough. The forest needs fire - so it can be born again.",
      },
      { speaker: "The forest", line: "Change returns. Power returns. Thank you." },
      { speaker: "Spacemonkey", tone: "quiet", line: "I'd have warned you off this once. Now I think I just watch." },
    ],
  },

  "ending-hollow": {
    id: "ending-hollow",
    title: "The Hollow Crown",
    subtitle: "Truth. Void. You.",
    fade: "violet",
    lines: [
      { speaker: "The Crownless", line: "You chose truth." },
      { speaker: "You", line: "...What does that mean?" },
      { speaker: "The Crownless", line: "The void isn't an enemy. It's part of the forest. Part of you." },
      { speaker: "The forest", tone: "reverent", line: "You carry the crown." },
      { speaker: "The Crownless", line: "The Heartwood lives - through you." },
      { speaker: "Spacemonkey", tone: "whisper", line: "You did what I didn't dare to." },
    ],
  },
}

// Which allegiance leans which way for the ending tally. `rite-untouched`
// is deliberately absent (a non-choice pulls nothing).
const ENDING_AXIS = {
  "rite-purified": "rooted",
  "rite-strengthened": "ember",
  "side-ember": "ember",
  "side-tide": "rooted",
  "side-stone": "rooted",
  "echo-taken": "hollow",
  "echo-refused": "rooted",
  "hollow-accepted": "hollow",
  "hollow-resisted": "rooted",
}

// The ending a finished run has earned. Tallies the Act allegiances
// (the last Act's Hollow choice counts double - it is the decisive one)
// plus a nudge from forestState, and picks the leader. A run that made
// no crossroads picks at all falls to the canonical Rooted King.
export function endingIdForRun(runState) {
  const score = { rooted: 0, ember: 0, hollow: 0 }
  // Read the allegiances off runModifiers (the ids the run actually
  // holds), not runState.allegiances (which stores the raw crossroads
  // choice id like "purify") - ENDING_AXIS is keyed by modifier id.
  for (const id of runState?.runModifiers || []) {
    const axis = ENDING_AXIS[id]
    if (!axis) continue
    score[axis] += id === "hollow-accepted" || id === "hollow-resisted" ? 2 : 1
  }
  if (runState?.forestState === "purified") score.rooted += 1
  if (runState?.forestState === "corrupted") score.hollow += 1

  let best = "rooted"
  for (const axis of ["ember", "hollow"]) {
    if (score[axis] > score[best]) best = axis
  }
  return `ending-${best}`
}

export function cinematicById(id) {
  return CINEMATICS[id] || null
}
