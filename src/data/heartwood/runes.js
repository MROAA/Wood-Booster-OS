// Hearthwood - Runes (First Song PRD §4, docs/hearthwood-first-song-story.md).
// "A rune is a verse held still: a word the world must keep." Runes are
// Hearthwood's own fictional runes (not claims about historical meanings).
//
// Every rune has the PRD's three parts:
//   meaning - what it stands for
//   effect  - what carving it does for you in the next fight
//   cost    - what it takes, risks or changes in return
//
// How a run uses them (rules: services/heartwood/runRunes.js, battle side:
// services/heartwood/tacticsRunes.js):
//   - you start a run with one rune; elites and minibosses drop more
//   - the Rune Pouch holds RUNE_POUCH_MAX; a full pouch leaves the find behind
//   - before a fight you may CARVE one rune (Formation screen); it is
//     spent when the fight starts, its effect AND its cost both apply
// Pure data; every number the rules read lives here.

export const RUNE_POUCH_MAX = 3

export const RUNES = {
  growth: {
    id: "growth",
    name: "Growth",
    glyph: "ᛒ",
    force: "Song",
    color: "#7fb069",
    meaning: "Growth - the Song making something new.",
    effect: "Thick brush grows around your squad (cover), and every hero mends 25% of their health.",
    cost: "The forest's creatures change: one more beast joins the enemy side.",
    numbers: { bushTiles: 4, healPct: 0.25 },
  },
  echo: {
    id: "echo",
    name: "Echo",
    glyph: "ᚨ",
    force: "Root",
    color: "#7f8fe0",
    meaning: "Echo - the Root remembering what happened here.",
    effect: "Your heroes remember old fights: each one starts with a full resource bar and +1 Ward.",
    cost: "You wake an old memory: an Echo of your strongest hero fights against you.",
    numbers: { ward: 1 },
  },
  bond: {
    id: "bond",
    name: "Bond",
    glyph: "ᚷ",
    force: "Rune",
    color: "#c9a24a",
    meaning: "Bond - a word the world must keep.",
    effect: "The strongest enemy is bound: it loses its first 2 turns.",
    cost: "A bond binds both ends: your Commander is rooted for the first 2 turns too.",
    numbers: { bindTurns: 2, rootTurns: 2 },
  },
  shadow: {
    id: "shadow",
    name: "Shadow",
    glyph: "ᛇ",
    force: "Silence",
    color: "#9b7fc7",
    meaning: "Shadow - the Silence hiding what it touches.",
    effect: "Your squad is hidden: every enemy loses its first turn.",
    cost: "The shadows wake the place up: every enemy has +20% health.",
    numbers: { hpMult: 1.2 },
  },
  break: {
    id: "break",
    name: "Break",
    glyph: "ᚺ",
    force: "Silence",
    color: "#d0614a",
    meaning: "Break - shattering what binds.",
    effect: "Every enemy shield, ward and regeneration breaks, and their skills start on cooldown.",
    cost: "Another bond breaks free: your heroes start with empty resource bars.",
    numbers: { skillCd: 2 },
  },
}

export const RUNE_IDS = Object.keys(RUNES)

export function runeById(id) {
  return RUNES[id] || null
}
