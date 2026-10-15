// Hearthwood - FATES (between-fights build depth, part 4). An event
// choice can plant a lasting consequence that comes back later: a
// cursed relic, an ally who turns up in a later fight, a rival who
// hunts you, a friendly (or furious) merchant, a debt, a mana tide, or
// a story thread a later event picks up. They are listed in the run
// panel ("Fates") until they resolve.
//
// Pure data. An event effect `{ fate: "<id>" }` plants one (runEngine
// applyEventEffect -> betweenFights.plantFate). Text is hand-written,
// short, in the game's voice - never generated.
//
// kinds:
//   curse  - `effects` hit the squad at the start of each of the next
//            `fights` fights (after `wait`), then the curse lifts.
//            `relic: "random"` grants a relic when planted.
//   ally   - `unit` (UNITS id) fights on your side in ONE fight, `wait`
//            fights from now. Tactics fights only.
//   rival  - a named enemy from the Act's pool joins ONE fight `wait`
//            fights from now, tougher than usual; beating that fight
//            pays `bounty` Essence.
//   price  - shop prices x`mult` for the next `shops` market visits.
//   debt   - `essence` now; `owed` is taken when you leave the
//            `shops`-th market from now.
//   tide   - every fight of the next `fights` starts Overcharged by
//            `overcharge` (mana).
//   thread - sets story flag `flag`; resolved when the event that needs
//            the flag is played.

export const FATE_KINDS = {
  curse: { label: "Curse", icon: "moonGlyph", color: "#9b7fc7" },
  ally: { label: "Ally", icon: "heart", color: "#6f9b4e" },
  rival: { label: "Rival", icon: "sword", color: "#b3503f" },
  price: { label: "Market", icon: "spark", color: "#e0b04a" },
  debt: { label: "Debt", icon: "rune", color: "#c98a4a" },
  tide: { label: "Mana tide", icon: "tide", color: "#7fa8e0" },
  thread: { label: "Story", icon: "leaf", color: "#a8b98a" },
}

export const FATES = {
  "bone-saint-curse": {
    id: "bone-saint-curse",
    kind: "curse",
    title: "The Bone Saint's Price",
    text: "A relic that isn't yours. Your squad starts the next 3 fights Weak.",
    relic: "random",
    wait: 0,
    fights: 3,
    effects: [{ type: "applyBuff", id: "weak", amount: 1 }],
    resolvedText: "The bones go quiet. The relic stays.",
  },
  "black-sap-curse": {
    id: "black-sap-curse",
    kind: "curse",
    title: "Black Sap",
    text: "Your squad starts the next 4 fights poisoned.",
    wait: 0,
    fights: 4,
    effects: [{ type: "applyBuff", id: "poison", amount: 1 }],
    resolvedText: "The sap dries and flakes away.",
  },
  "ferryman-ally": {
    id: "ferryman-ally",
    kind: "ally",
    title: "The Ferryman's Oath",
    text: "After 2 more fights, the ferryman's daughter wades in on your side.",
    unit: "brinecaller",
    allyName: "Ferryman's Daughter",
    wait: 2,
    resolvedText: "She fought, nodded once, and went back to the river.",
  },
  "hunter-ally": {
    id: "hunter-ally",
    kind: "ally",
    title: "A Hunter's Debt",
    text: "On your third fight from here, the hunter you freed comes back with her bow.",
    unit: "trueshot",
    allyName: "Freed Hunter",
    wait: 2,
    resolvedText: "Debt paid, she said. Then she was gone.",
  },
  "wolf-ally": {
    id: "wolf-ally",
    kind: "ally",
    title: "The Grey Wolf Remembers",
    text: "After your next fight, the wolf you freed runs with you.",
    unit: "pack-elder",
    allyName: "Grey Wolf",
    wait: 1,
    resolvedText: "The wolf howled once over the field and left.",
  },
  "poacher-rival": {
    id: "poacher-rival",
    kind: "rival",
    title: "The Poacher's Grudge",
    text: "Something is tracking you. After your next fight, it attacks. Beat it for 120 Essence.",
    rivalName: "the Poacher's Hound",
    wait: 1,
    bounty: 120,
    resolvedText: "The hound is down. Its collar was full of coin.",
  },
  "crowned-rival": {
    id: "crowned-rival",
    kind: "rival",
    title: "The Spurned Crown",
    text: "You humbled a would-be king. On your third fight from here, he comes back for you. Beat him for 200 Essence.",
    rivalName: "the Spurned King",
    wait: 2,
    bounty: 200,
    resolvedText: "The Spurned King won't be back. His purse stayed behind.",
  },
  "merchant-friend": {
    id: "merchant-friend",
    kind: "price",
    title: "A Friend in the Guild",
    text: "Heroes cost 20% less at your next 3 markets.",
    mult: 0.8,
    shops: 3,
    resolvedText: "The guild's goodwill is spent.",
  },
  "merchant-grudge": {
    id: "merchant-grudge",
    kind: "price",
    title: "Word Travels",
    text: "Heroes cost 25% more at your next 2 markets.",
    mult: 1.25,
    shops: 2,
    resolvedText: "The merchants found someone new to gossip about.",
  },
  "moonlender-debt": {
    id: "moonlender-debt",
    kind: "debt",
    title: "The Moonlender",
    text: "150 Essence now. 250 is collected when you leave your 3rd market from here.",
    essence: 150,
    owed: 250,
    shops: 3,
    resolvedText: "The Moonlender took what was owed.",
  },
  "high-tide": {
    id: "high-tide",
    kind: "tide",
    title: "High Tide",
    text: "Your next 3 fights start Overcharged (+25 mana).",
    fights: 3,
    overcharge: 25,
    wait: 0,
    resolvedText: "The tide goes back out.",
  },
  "lantern-thread": {
    id: "lantern-thread",
    kind: "thread",
    title: "The Unlit Lantern",
    text: "You carry the lantern. Someone, somewhere, is waiting for its light.",
    flag: "carries_unlit_lantern",
    resolvedText: "The lantern found its keeper.",
  },
  "drowned-bell-thread": {
    id: "drowned-bell-thread",
    kind: "thread",
    title: "The Drowned Bell",
    text: "You rang the bell under the water. It will be answered.",
    flag: "rang_drowned_bell",
    resolvedText: "The bell's answer came.",
  },
}

export function fateById(id) {
  return FATES[id] || null
}
