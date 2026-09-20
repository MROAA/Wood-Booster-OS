// Hearthwood - Trials. A Trial is a named narrative wrapper around an
// existing enemy/formation encounter, not a redefinition of its combat.
// This lets a miniboss/boss carry real story identity (title, its own
// intro/victory/defeat lines) without ever touching the balance work
// already done on the underlying enemy def - `enemyId` still resolves
// through ENEMIES exactly as before, only the presentation layer reads
// through the Trial when one wraps the node.
//
// First entry: Rootkeeper (Act I's boss, from Marc's own written story -
// docs/hearthwood-story-acts.md) wraps the existing "deepwarden" miniboss
// (already-tuned stats/moveset, a defensive warden-type enemy - a close
// mechanical fit for a corrupted tree-guardian). Content for more Trials
// (Heartwood Warden/Act II, Veilbound/Act III, Hollow King/Act IV,
// The Crownless/Act V) already exists in full in that same doc - this
// table is the seam they drop into next, one entry each, with zero
// further engine work.
export const TRIALS = {
  rootkeeper: {
    id: "rootkeeper",
    enemyId: "deepwarden",
    title: "Rootkeeper",
    rank: 1,
    act: "The Outer Grove",
    beat: "The forest's oldest guardian, still standing watch - corruption has reached him too.",
    introLine:
      '"Stop. You... stranger... Why do you touch my roots?" He does not move to strike yet - only to be heard.',
    victoryLine:
      '"...You are not the corruption." The roots fall away. Light kindles in his chest. "Listen. The corruption does not come from the roots. It comes from deeper." He is not defeated - he is purified.',
  },
  // Second Trial - Heartwood Warden (Act II's boss) wraps "thornmaw":
  // its own self-Regen+self-Taunt kit (won't go down, forces you to
  // commit) is a real mechanical fit for a guardian who "decides whether
  // you're a protector or a destroyer" and won't be rushed past.
  "heartwood-warden": {
    id: "heartwood-warden",
    enemyId: "thornmaw",
    title: "Heartwood Warden",
    rank: 2,
    act: "The Deepening Woods",
    beat: "The heart's physical guardian - not corrupted, but he doesn't trust you yet.",
    introLine:
      '"You have come too far, stranger." He raises a hand; roots rise with it. "All who touch the heart are either protectors... or destroyers. I decide which you are."',
    victoryLine:
      '"...You are not a destroyer." He looks at you directly. "The heart hides... because it fears the Hollow King. And you... you are the key." He turns toward the deeper woods. "We must go to the Veil."',
  },
  // Third Trial - Veilbound (Act III's boss) wraps "wyrmgall": its own
  // self-Execute+self-Shatter kit already punishes BOTH pure-aggression
  // (Execute finishes a wounded player unit) and pure-defense (Shatter
  // punishes Block-stacking) - a genuine mechanical fit for a being that
  // "doesn't test power, it tests truth" and can't be cheesed one way or
  // the other.
  veilbound: {
    id: "veilbound",
    enemyId: "wyrmgall",
    title: "Veilbound",
    rank: 3,
    act: "The Wounded Heartwood",
    beat: "A being born from the border of reality - not evil, only the Veil's will given shape.",
    introLine:
      '"You have come too far." Its shape will not hold still. "Enemy... friend... those words mean nothing here. The Veil does not test strength. It tests... truth."',
    victoryLine:
      '"...You are not a child of the void." Its shape stabilizes for the first time. "The heart hides... because the Hollow King seeks it. The void is not evil. It is... alone." It closes its eyes. "...We must go to The Hollow."',
  },
  // Fourth Trial - the final boss. Marc, asked directly (his own story
  // treats Hollow King as the real final threat, with Spacemonkey
  // exiting into the void before this fight rather than being the one
  // faced here): confirmed swapping the final boss's identity to Hollow
  // King, wrapping the existing "spacemonkey" boss fight (same unique
  // Revive/AoE kit, already the one fight in the game meant to feel
  // different from every other - see enemies.js's own comment on it).
  // Spacemonkey himself stays in the story as the guide/ally who exits
  // earlier, exactly as written - just no longer who you fight here.
  // "Marc" genericized to "you" per Marc's own clarification that the
  // dialogue's "Marc" means the player generically, not a literal name.
  "hollow-king": {
    id: "hollow-king",
    enemyId: "spacemonkey",
    title: "The Hollow King",
    rank: 4,
    act: "The Reckoning",
    beat: "The void's own child, once the forest's first guardian. Not a tyrant - a guardian who failed.",
    introLine:
      '"...Why did you come?" No face, no crown, no shape - only an absent shape where one should be. "The forest does not need saving. It needs... the truth. Show me why the heart trusts you."',
    victoryLine:
      '"...You... You are not a child of the void." The void around him trembles, as if it were crying. "The heart... hid from me. But it... trusts you." He does not fall. He simply ceases to be.',
  },

  // Act V - The Crownless. Not a RUN_PATH node: wraps the
  // "the-crownless-mirror" formation (formations.js), spun up after the
  // Hollow King falls (runEngine.startCrownlessBattle). It has no single
  // `enemyId`, so applyTrialName (runEngine.js) is a safe no-op - the
  // pieces keep their own names. Text from the bible's "The Crownless -
  // battle dialogue", genericised.
  "the-crownless": {
    id: "the-crownless",
    title: "The Crownless",
    rank: 5,
    act: "The Crownless",
    beat: "Not a king. Not the void. The one who waits - and the shape of every choice you made to get here.",
    introLine:
      '"You came. But not to win. Not to kill. Not to save. You came... to be seen." Its shape will not hold still. "I take nothing from you. I only show you what you carry."',
    victoryLine:
      '"I am ready. The forest is ready. The void is ready." The Crownless folds back into the throne - it does not die, does not vanish, just returns to what it was. "You... are ready. Choose."',
  },
}

export function resolveTrial(id) {
  return TRIALS[id] || null
}
