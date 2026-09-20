// Hearthwood - the first branching NPC conversation system. Marc chose
// this as the first big piece to build from his "Hearthwood Studio
// Universal Editor" PRD (docs/hearthwood-studio-universal-editor-prd.md,
// §22-23 Dialogue Editor / Character Relationship Editor).
//
// A dialogue is triggered from an existing map event's choice (that
// choice gets a `dialogueId` field instead of resolving immediately -
// see events.js's own comment on the convention, and DialogueScreen.jsx
// for how it plays). No new map-node type, no new run-save shape.
//
// Deliberately a NESTED ARRAY shape (`exchanges` -> each entry's own
// `followUps`), not a single embedded "next" object - Hearthwood
// Studio's content reader already understands nested arrays-of-records
// natively (the same mechanism that makes an Event's own choices or a
// Crossroads' own choices individually editable), so this needed zero
// new Studio capability. `effects` uses the exact same vocabulary an
// event choice's `effects` already does (see events.js's own comment
// block: {essence}, {relic:"random"}, {item:"random"},
// {unit:"random-common"}, {squadNextBattle}, {flag}, {boon}/{bane}).
export const DIALOGUES = {
  "grieving-guardian": {
    npc: "The Grieving Guardian",
    greeting: "It doesn't look away from what it's holding. But it speaks, low, like stone settling.",
    exchanges: [
      {
        id: "ask-what-it-holds",
        question: "What are you holding?",
        answer: "It opens its huge hands, just enough to show you. A sapling, snapped at the stem, roots and all - small enough to have fit in a child's fist once. \"Mine,\" it says. \"Before I was this.\"",
        effects: [],
        followUps: [
          {
            id: "ask-what-happened",
            question: "What happened to it?",
            answer: "\"The rot came through fast, one bad season. I was the grove before I was its guardian. I couldn't be both in time.\" It closes its hands again, careful, like the sapling could still feel it.",
            effects: [{ flag: "knows_the_guardians_grief" }],
            followUps: [],
          },
        ],
      },
      {
        id: "ask-why-here",
        question: "Why do you still stand guard, if there's nothing left to guard?",
        answer: "\"There's you,\" it says. \"And whoever comes after you. The grove is gone. The reason for the grove isn't.\"",
        effects: [],
        followUps: [],
      },
      {
        id: "say-nothing",
        question: "(Say nothing. Sit with it a while.)",
        answer: "You sit. The guardian doesn't ask you to leave, and doesn't fill the quiet with anything. After a while that feels like the whole point of coming this way, you get up, and it lets you go.",
        effects: [{ flag: "sat_with_the_guardian" }],
        followUps: [],
      },
    ],
  },
}
