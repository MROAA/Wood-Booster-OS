// Heartwood Trial - the guided first-battle tutorial. Each step names a
// real DOM target (a CSS selector matching something already on
// screen, not a separate mockup) and how it's completed: "manual"
// means the player reads it and clicks Next; anything else names a
// real game action (playing a card, ending a turn) that the tutorial
// listens for and advances on automatically - the player learns by
// actually doing the thing, not by reading about it first.

// Kept deliberately short - "I don't want to read loads of text, I'd
// rather play it to learn it" was direct feedback on an earlier, more
// sentence-y draft of these. Label-length, not sentence-length.
export const TUTORIAL_STEPS = [
  {
    target: ".hw-piece",
    text: "Enemy's next move.",
    advanceOn: "manual",
  },
  {
    target: ".hw-side-rail .hw-panel",
    text: "Your HP and Energy.",
    advanceOn: "manual",
  },
  {
    target: ".hw-hand",
    text: "Play a card - click one.",
    advanceOn: "cardPlayed",
  },
  {
    target: ".hw-move-btn",
    text: "Move once per turn.",
    advanceOn: "manual",
  },
  {
    target: ".hw-end-turn",
    text: "End Turn when ready.",
    advanceOn: "endTurn",
  },
  {
    target: null,
    text: "That's it. Good luck!",
    advanceOn: "manual",
    final: true,
  },
]

export const TUTORIAL_SEEN_KEY = "heartwood-tutorial-seen"
