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
//
// Marc, 2026-09-19: ordered chronologically (a run plays intro first,
// then - if it reaches Act V - crownless-throne, then whichever ending
// its allegiances earned, then echo-epilogue right after) rather than
// the grouping-by-kind order this file had before (intro, then all
// three endings, then crownless-throne, then echo-epilogue - which put
// crownless-throne, an Act V OPENING scene, after content that only
// plays at the very end of the run).

export const CINEMATICS = {
  intro: {
    id: "intro",
    fade: "black",
    lines: [
      { speaker: "The forest", tone: "whisper", line: "Before the world there was silence. Then something sang." },
      {
        speaker: "The forest",
        tone: "whisper",
        line: "Light, dark, life and death came out of the Song. But its last verse never ended. It took root, and grew, and became me.",
      },
      { speaker: "The forest", tone: "whisper", line: "Wake up... The roots know you..." },
      {
        speaker: "Spacemonkey",
        line: "Don't mind that. The forest talks to every newcomer. Or... well. Not every one. Only the ones that matter.",
      },
      {
        speaker: "Spacemonkey",
        line: "Everyone here knows a piece of that Song. Nobody knows all of it anymore. Song, Root, Rune, Silence - four old forces, and lately they've stopped keeping to their own sides.",
      },
      {
        speaker: "Spacemonkey",
        line: "Here. Keep this. It's a Seed. It isn't a magic item. It's... a promise.",
      },
      {
        speaker: "Sapling Spirit",
        line: "You hear us, don't you. The roots aren't ours anymore. The Silence is spreading up from below - folk call it the Rot. Something is waking.",
      },
      {
        speaker: "Sapling Spirit",
        line: "Men came here once in longships, looking for the root of all worlds. The forest gave them what they wanted. None of them went home.",
      },
      { speaker: "The forest", tone: "whisper", line: "Is the forest a broken world to mend... or a world left unfinished on purpose? Find out. Before it is sung to the end." },
    ],
  },

  // Act V opening - the throne hall, after the Hollow King falls. From
  // the bible's "The Crownless Throne - extended opening scene".
  "crownless-throne": {
    id: "crownless-throne",
    title: "The Crownless Throne",
    subtitle: "When the king disappears, the crown does not. It waits.",
    fade: "black",
    lines: [
      { speaker: "The forest", tone: "clear", line: "You came." },
      {
        speaker: "The forest",
        line: "I have been silent too long. I have whispered, warned, hidden. But now - now I have to speak.",
      },
      {
        speaker: "The forest",
        line: "The king is gone - the last jarl of the longships, who was promised a kingdom that would never die. He tried to sing my last verse himself, to make his kingdom forever. It broke in his mouth, and the Silence came pouring through the crack.",
      },
      {
        speaker: "The forest",
        line: "The void is sealed. But the verse is still unsung, and the crown cannot stay empty.",
      },
      {
        speaker: "Spacemonkey",
        tone: "quiet",
        line: "Hey. If you're seeing this, it means I'm not there anymore.",
      },
      {
        speaker: "Spacemonkey",
        tone: "quiet",
        line: "I know this place scares you. It scared me. It scared the Hollow King. But someone needs you now.",
      },
      { speaker: "The Crownless", line: "I am not a ruler. I am the last verse - the one nobody finished." },
      { speaker: "The Crownless", line: "You came. Before you choose how I end, I have to see who you are." },
    ],
  },

  "ending-rooted": {
    id: "ending-rooted",
    title: "The Song Restored",
    subtitle: "The old balance returns. Something of this world is changed for good.",
    fade: "green",
    lines: [
      { speaker: "The forest", tone: "gentle", line: "You sang the verses back the way they were." },
      {
        speaker: "Heartwood Warden",
        line: "Song, Root, Rune, Silence - each back on its own side. The heart beats again. I carry the crown - through your choice.",
      },
      { speaker: "The forest", line: "The old balance returns. But a restored song is not the same song. Some paths you walked are gone, and will not grow back." },
      { speaker: "Spacemonkey", tone: "quiet", line: "...You gave it back its shape. I never could." },
    ],
  },

  "ending-ember": {
    id: "ending-ember",
    title: "The Bound Forest",
    subtitle: "Runes burned into the roots. Safe, predictable - and less free.",
    fade: "red",
    lines: [
      { speaker: "The forest", tone: "pulsing", line: "You chose to bind me." },
      {
        speaker: "Ashlord Reborn",
        line: "Peace isn't enough. Growth isn't enough. Burn the runes into every root, and the forest will never break again - because it will never be allowed to.",
      },
      { speaker: "The forest", line: "I am strong now, and I will keep my rules. I will not dream again." },
      { speaker: "Spacemonkey", tone: "quiet", line: "I'd have warned you off this once. Now I think I just watch." },
    ],
  },

  "ending-hollow": {
    id: "ending-hollow",
    title: "The Silence Accepted",
    subtitle: "Part of the forest is let go, so the rest can live.",
    fade: "violet",
    lines: [
      { speaker: "The Crownless", line: "You chose truth." },
      { speaker: "You", line: "...What does that mean?" },
      { speaker: "The Crownless", line: "The Silence isn't an enemy. It is what keeps the Song from growing forever. Part of the forest. Part of you." },
      { speaker: "The forest", tone: "quiet", line: "Let some of me be forgotten, then. The rest of the world can go on living." },
      { speaker: "The forest", tone: "reverent", line: "You carry the crown." },
      { speaker: "The Crownless", line: "The Heartwood lives - through you." },
      { speaker: "Spacemonkey", tone: "whisper", line: "You did what I didn't dare to." },
    ],
  },

  // New Game+ only (forestMemory.js): the PRD's hardest ending.
  "ending-newverse": {
    id: "ending-newverse",
    title: "The New Verse",
    subtitle: "Not the old song. Not silence. Something with room after it.",
    fade: "gold",
    lines: [
      { speaker: "The Crownless", line: "You have been here before. I remember your footsteps. You remember mine." },
      { speaker: "You", line: "I'm not going to finish your song. I'm going to sing a different line." },
      { speaker: "The forest", tone: "whisper", line: "No one has ever answered that way." },
      { speaker: "The Crownless", line: "Then sing. And leave room after it - for the next one who comes." },
      { speaker: "The forest", tone: "gentle", line: "The laws bend. Nothing is perfect. Everything can still grow." },
      { speaker: "Spacemonkey", tone: "quiet", line: "...Huh. So that's what the last verse was for. Leaving it open." },
    ],
  },

  // Plays once, right after the chosen ending cinematic. A teaser for
  // the Echo Age (bible: "explicitly NOT Heartwood 2"), no new
  // gameplay - it just tells you the story isn't quite finished.
  "echo-epilogue": {
    id: "echo-epilogue",
    title: "The Echo Age",
    subtitle: "The forest is safe. The forest remembers.",
    fade: "violet",
    lines: [
      { speaker: "The forest", tone: "quiet", line: "The roots remember. The heart remembers. The void remembers. You remember." },
      {
        speaker: "The forest",
        line: "But memory has weight. And this deep, something has been remembering you back - too hard, and for too long.",
      },
      {
        speaker: "The forest",
        tone: "whisper",
        line: "Where the Veil wore thinnest, a hole is opening. It copies every step you take.",
      },
      { speaker: "Spacemonkey", tone: "whisper", line: "The forest stopped asking to be saved. Now it's asking to be understood." },
      {
        speaker: "Spacemonkey",
        tone: "whisper",
        line: "You came in looking for the way out. Ever wonder if the forest is the only place a world can exist at all?",
      },
      { speaker: "The forest", line: "Rest, for now. The Echo will still be there." },
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

// Act V (The Crownless) makes the ending a deliberate player choice on
// the Forest's Choice screen, not an automatic outcome - so the tally
// above is now a *suggestion* the screen pre-highlights ("the forest
// leans this way"), not the decider. Same maths, clearer name; the old
// export name stays as an alias (HeartwoodBattle + PR3's verify use it).
export const suggestedEndingId = endingIdForRun

export function cinematicById(id) {
  return CINEMATICS[id] || null
}
