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

// storyFlags are terse internal ids; these turn the ones worth
// surfacing into a sentence. A flag with no entry here is simply not
// shown in the journal (many are just plumbing for follow-up events).
export const FLAG_LABELS = {
  sealed_hollow_tree: "You sealed the black wound in the hollow tree.",
  reinforced_the_seal: "You went back and reinforced the seal on the hollow tree.",
  heard_the_name: "Spacemonkey told you the name: the Hollow King.",
  named_it_aloud: "You said the Hollow King's name out loud, and meant it.",
  knows_the_veil: "The burned researcher told you what waits beyond the Veil.",
  freed_the_chained: "You cut the chained figure loose and it joined your squad.",
  left_the_chained: "You left the chained figure where it was.",
  knows_how_to_fight_him: "The one you freed told you how the Hollow King fights: outlast him.",
  the_ally_knows: "Your freed ally knew the Hollow King, before the crown.",
  faced_the_crownless: "You met the Crownless in a vision, and did not look away.",
  broke_a_fragment: "You shattered a fragment of the Veil.",
  broke_the_throne: "You broke the empty throne in the Crownless court.",
  sat_the_throne: "You sat in the throne the rot would not touch.",
  spoke_to_the_court: "You told the missing court what you had come to do.",
  cut_the_toll_root: "You cut through the toll root instead of paying it.",
  spoke_to_the_grove: "You spoke your name and your purpose to the listening grove.",
  heard_the_grove_voice: "You heard the one word the listening grove was straining toward.",
  passed_the_guardian: "The grieving guardian let you past its vigil.",
  drank_the_last_water: "Your squad drank the last clean water in the Hearthwood.",
  saved_the_spring: "You dammed the dead ground to buy the last spring another day.",
  said_the_words: "You spoke to your squad before crossing into the grey.",
  crossed_in_silence: "You crossed into the grey without a word.",
  kept_the_custom: "You scratched a name from the first milestone, the old custom.",
  cleared_the_snares: "You cut down every snare on the old hunting line.",
  left_the_throne_road: "You left the Throne Road and came at the end from an angle it never expected.",
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
    .map((f) => FLAG_LABELS[f])

  const forest = {
    state: runState.forestState || "restless",
    label: FOREST_STATE_LABEL[runState.forestState || "restless"],
  }

  return { events, crossroads, milestones, forest }
}
