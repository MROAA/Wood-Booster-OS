// Hearthwood - the Story Journal's data layer. Marc: the run needs "ei
// koukkua eteneä" fixed - a visible, accumulating narrative. PR 1-4 gave
// the run real story weight (permanent boons, Act crossroads, cinematic
// bookends, a route that bends to your choices); this assembles all of
// it into one readable "the story so far" the player can open from the
// map.
//
// Pure: buildJournal(runState) reads the fields those PRs already write
// (eventLog, allegiances, forestState, storyFlags) and returns display
// rows. No engine state of its own.

import { ACT_CROSSROADS } from "./crossroads"
import { runModifierById } from "./boons"

// storyFlags are terse internal ids; `text` turns the ones worth
// surfacing into a sentence. A flag with no entry here is simply not
// shown in the journal (many are just plumbing for follow-up events).
//
// Marc, 2026-09-19: "story osio pitää tehdä kronologiseen järjestykseen"
// (chronological order), then "sen pitää kertoa minulle missä kohtaa
// tarinaa menen ja sen pitää olla selkeä että tiedän muokata sitä" (it
// needs to tell me where I am in the story, clearly enough to edit) -
// `act` is which events.js Act actually sets this flag (cross-
// referenced against that event's own `act` field; omitted, like
// events.js's own convention, for cut_the_toll_root, whose event has no
// Act gate). It's read-only information for buildJournal - the map's
// own key order still drives nothing in-game (that's
// runState.storyFlags' own insertion order, at Object.keys() below) -
// but the Studio surfaces `act` as a normal field, and Marc's own
// eyes now have it to place a new flag correctly instead of guessing
// from surrounding text. A new flag: find which event sets it, copy
// that event's `act`, and insert this entry in that Act's own block
// above (not just appended at the end).
export const FLAG_LABELS = {
  sealed_hollow_tree: { act: 1, text: "You sealed the black wound in the hollow tree." },
  kept_the_custom: { act: 1, text: "You scratched a name from the first milestone, the old custom." },
  cleared_the_snares: { act: 1, text: "You cut down every snare on the old hunting line." },
  heard_the_name: { act: 2, text: "Spacemonkey told you the name: the Hollow King." },
  spoke_to_the_grove: { act: 2, text: "You spoke your name and your purpose to the listening grove." },
  heard_the_grove_voice: { act: 2, text: "You heard the one word the listening grove was straining toward." },
  freed_the_chained: { act: 3, text: "You cut the chained figure loose and it joined your squad." },
  left_the_chained: { act: 3, text: "You left the chained figure where it was." },
  broke_a_fragment: { act: 3, text: "You shattered a fragment of the Veil." },
  knows_the_veil: { act: 3, text: "The burned researcher told you what waits beyond the Veil." },
  named_it_aloud: { act: 3, text: "You said the Hollow King's name out loud." },
  reinforced_the_seal: { act: 3, text: "You went back and reinforced the seal on the hollow tree." },
  faced_the_crownless: { act: 4, text: "You met the Crownless in a vision, and did not look away." },
  left_the_throne_road: { act: 4, text: "You left the Throne Road and came at the end from an angle it never expected." },
  knows_how_to_fight_him: { act: 4, text: "The one you freed told you how the Hollow King fights: outlast him." },
  the_ally_knows: { act: 4, text: "Your freed ally knew the Hollow King, before the crown." },
  sat_the_throne: { act: 5, text: "You sat in the throne the rot would not touch." },
  broke_the_throne: { act: 5, text: "You broke the empty throne in the Crownless court." },
  spoke_to_the_court: { act: 5, text: "You told the missing court what you had come to do." },
  passed_the_guardian: { act: 5, text: "The grieving guardian let you past its vigil." },
  drank_the_last_water: { act: 7, text: "Your squad drank the last clean water in the Hearthwood." },
  saved_the_spring: { act: 7, text: "You dammed the dead ground to buy the last spring another day." },
  said_the_words: { act: 7, text: "You spoke to your squad before crossing into the grey." },
  crossed_in_silence: { act: 7, text: "You crossed into the grey without a word." },
  cut_the_toll_root: { text: "You cut through the toll root instead of paying it." },
}

const FOREST_STATE_LABEL = {
  restless: "Restless — you have not turned the forest one way or the other.",
  purified: "Purified — the green is holding, and spreading, because of your choices.",
  corrupted: "Corrupted — the rot runs with you now, by your own hand.",
}

// choice id -> allegiance modifier id, from crossroads.js (so the
// journal can name the permanent effect a crossroads pick granted).
function allegianceForPick(actIndex, choiceId) {
  const cr = ACT_CROSSROADS[actIndex]
  const choice = cr?.choices.find((c) => c.id === choiceId)
  return choice?.allegiance || null
}

export function buildJournal(runState) {
  if (!runState) return { events: [], crossroads: [], milestones: [], forest: null }

  const events = (runState.eventLog || []).map((e) => ({
    act: e.act || null,
    title: e.title,
    choice: e.choice,
    result: e.result,
  }))

  const crossroads = Object.entries(runState.allegiances || {})
    .map(([actIndex, choiceId]) => {
      const idx = Number(actIndex)
      const cr = ACT_CROSSROADS[idx]
      const choice = cr?.choices.find((c) => c.id === choiceId)
      if (!cr || !choice) return null
      const mod = runModifierById(allegianceForPick(idx, choiceId))
      return {
        act: idx,
        kicker: cr.kicker,
        label: choice.label,
        result: choice.result,
        grant: mod ? { name: mod.name, description: mod.description } : null,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.act - b.act)

  const milestones = Object.keys(runState.storyFlags || {})
    .filter((f) => FLAG_LABELS[f])
    .map((f) => FLAG_LABELS[f].text)

  const forest = {
    state: runState.forestState || "restless",
    label: FOREST_STATE_LABEL[runState.forestState || "restless"],
  }

  return { events, crossroads, milestones, forest }
}
