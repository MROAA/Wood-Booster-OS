// Hearthwood - battlefield objects made in the Studio
// ("+ Make a new battlefield object", AddBattleObjectForm.jsx).
// Each entry becomes a destructible tile exactly like the built-in ones
// (tree, barrel, boulder... in tacticsObjects.js): it blocks movement,
// gives cover, has HP, and when it breaks its `onBreak` effect fires.
// The built-in seven keep their own hand-made rules; these are pure data.
//
// Fields:
//   name       shown on the board tooltip and in the battle log
//   icon       emoji drawn on the tile when there is no painting
//   image      optional painting file in src/assets/heartwood/battleObjects/
//   hp         hits it takes before breaking (1-20)
//   onBreak    one of BREAK_EFFECTS below
//   power      damage (blasts/shards) or healing (healBurst) it deals
//   leaves     the ground left behind ("rubble", "moss", "ash", "path"...)
//   perBattle  how many appear on each battle map (0 = none)
//   fromAct    the first Act it can appear in (1-7)
//   note       one line of flavour for the tooltip
// The example below ships switched off (perBattle 0) so real runs stay as
// they were; it still shows in the practice battle (?objects=1).
export const BATTLE_OBJECTS = {
  "wasp-nest": {
    name: "Wasp nest",
    icon: "🐝",
    image: "",
    hp: 1,
    onBreak: "poisonBurst",
    power: 2,
    leaves: "path",
    perBattle: 0,
    fromAct: 2,
    note: "A humming paper nest hanging low. Knock it down near the enemy.",
  },
}

// What can happen when an object breaks - the Studio form's choice list.
export const BREAK_EFFECTS = {
  crumble: { label: "Just breaks", text: "It cracks apart." },
  fireBlast: { label: "Explodes in fire", text: "It explodes: {power} damage to everything in the 3x3 around it, and the ground burns." },
  poisonBurst: { label: "Bursts into a poison cloud", text: "It bursts: {power} damage and +2 Poison to everything in the 3x3 around it." },
  healBurst: { label: "Heals everyone nearby", text: "It pops: heals {power} HP to EVERY unit in the 3x3 around it - yours and theirs." },
  iceShards: { label: "Shatters into ice shards", text: "It shatters: {power} damage and Chill to everyone right next to it." },
  fall: { label: "Topples over like a tree", text: "It falls away from whoever hit it, crushing the next 2 tiles." },
}

// Ground an object can leave behind (form choice list).
export const LEAVES_OPTIONS = {
  rubble: "Rubble (half cover)",
  path: "Nothing - clear ground",
  moss: "Soft moss (heals 1 per turn)",
  ash: "Ash",
  ice: "Slippery ice",
  leaves: "Dry leaves (burns easily)",
}
