// Hearthwood - HERO PERSONALITY (Hero Identity sprint): quirks, bonds,
// scars & honours. Heroes are people, not stat blocks:
// - QUIRKS: every hero rolls 1-2 when it joins - something it LIKES (a
//   small bonus when it gets it), something it FEARS (a small debuff when
//   it faces it), or a social TEMPERAMENT (how it makes friends/rivals).
// - BONDS: heroes who fight side by side become friends (or rivals) over
//   time. Kept for good - across runs, through the Hearth.
// - SCARS & HONOURS: heroes remember near-death, kills, bosses, being saved.
//   Each memory can leave a permanent small trait + a line in its history.
// Pure data - Studio-editable (Hearthwood Studio > ✨ Hero Identity).
// Rules: services/heartwood/heroIdentity.js (run) + tacticsSignatures.js (fight).
//
// Quirk fields:
//   kind  - "like" | "fear" | "social"
//   weight - how common a roll it is (0 = never rolled)
//   when  - the fight condition (likes): "high" (on high ground), "green"
//           (next to forest / tall grass), "early" (turns 1-2), "crowd" (2+
//           enemies next to it), "alone" (no ally next to it), "wounded"
//           (at or below half HP)
//   family - what it fears (fears): an enemy family (see FAMILIES) or "fire"
//   dmg / aim - the bonus (likes) or the penalty (fears, as positives)
//   bondRate - social: friendship points per fight together (default 1)
//   rivalSameRole - social: forms RIVALRIES with heroes of its own role

export const QUIRKS = {
  "loves-heights": { id: "loves-heights", name: "Loves Heights", icon: "⛰", kind: "like", weight: 3, when: "high", dmg: 1, aim: 0, text: "Feels alive up high: +1 damage on high ground." },
  "forest-child": { id: "forest-child", name: "Forest Child", icon: "🌲", kind: "like", weight: 3, when: "green", dmg: 0, aim: 10, text: "At home among trees: +10% to hit next to forest or tall grass." },
  "first-blood": { id: "first-blood", name: "First Blood", icon: "🩸", kind: "like", weight: 2, when: "early", dmg: 1, aim: 0, text: "Hits hardest at the start: +1 damage on turns 1 and 2." },
  "thrill-seeker": { id: "thrill-seeker", name: "Thrill-Seeker", icon: "🎲", kind: "like", weight: 2, when: "crowd", dmg: 1, aim: 0, text: "Loves the thick of it: +1 damage with 2+ enemies next to it." },
  "lone-wolf": { id: "lone-wolf", name: "Lone Wolf", icon: "🐺", kind: "like", weight: 2, when: "alone", dmg: 1, aim: 0, bondRate: 0.5, text: "Fights best alone: +1 damage with no ally next to it. Makes friends slowly." },
  "back-to-wall": { id: "back-to-wall", name: "Back to the Wall", icon: "🧱", kind: "like", weight: 2, when: "wounded", dmg: 0, aim: 10, text: "Steadier when hurt: +10% to hit at or below half HP." },
  "fears-fire": { id: "fears-fire", name: "Afraid of Fire", icon: "🔥", kind: "fear", weight: 3, family: "fire", dmg: 1, aim: 10, text: "Freezes up near flames: -1 damage and -10% to hit next to fire, lava or a fiery enemy." },
  "fears-undead": { id: "fears-undead", name: "Afraid of the Dead", icon: "💀", kind: "fear", weight: 3, family: "undead", dmg: 1, aim: 10, text: "Hates anything that should stay buried: -1 damage and -10% to hit next to the undead." },
  "fears-beasts": { id: "fears-beasts", name: "Afraid of Beasts", icon: "🐾", kind: "fear", weight: 2, family: "beast", dmg: 1, aim: 10, text: "Was bitten as a child: -1 damage and -10% to hit next to fanged beasts." },
  "fears-crawlers": { id: "fears-crawlers", name: "Afraid of Crawlers", icon: "🕷", kind: "fear", weight: 2, family: "crawler", dmg: 1, aim: 10, text: "Skin crawls near bugs: -1 damage and -10% to hit next to crawling things." },
  "fears-rot": { id: "fears-rot", name: "Afraid of Rot", icon: "🍄", kind: "fear", weight: 2, family: "rot", dmg: 1, aim: 10, text: "Can't stand the blight: -1 damage and -10% to hit next to rot and spores." },
  "fears-giants": { id: "fears-giants", name: "Afraid of Giants", icon: "🗿", kind: "fear", weight: 1, family: "giant", dmg: 1, aim: 10, text: "Shrinks before big foes: -1 damage and -10% to hit next to an elite or a boss." },
  loyal: { id: "loyal", name: "Loyal", icon: "🤝", kind: "social", weight: 3, bondRate: 2, text: "Makes friends fast: friendship grows twice as quickly." },
  proud: { id: "proud", name: "Proud", icon: "🦚", kind: "social", weight: 2, rivalSameRole: true, text: "Can't stand an equal: becomes RIVALS with heroes of its own role." },
  "warm-heart": { id: "warm-heart", name: "Warm Heart", icon: "💛", kind: "social", weight: 2, bondRate: 1.5, text: "Easy to like: friendship grows half again as fast." },
}

export const QUIRK_KINDS = {
  like: { name: "Likes", color: "#8fd18b" },
  fear: { name: "Fears", color: "#e07a6a" },
  social: { name: "Heart", color: "#e0b85a" },
}

export const QUIRK_ODDS = { second: 0.5 }
export const MAX_QUIRKS = 2

// Enemy families (fears + grudges) - read off the enemy's id/name.
export const FAMILIES = {
  undead: { id: "undead", name: "the undead", words: ["bone", "grave", "wraith", "lich", "death", "ghoul", "ghost", "wight", "soul", "crypt", "corpse", "skelet", "revenant", "banshee", "reaper", "tomb", "mourn", "barrow", "dread", "hollow", "crownless", "echo"] },
  beast: { id: "beast", name: "beasts", words: ["fang", "maw", "gnaw", "growler", "runner", "pack", "troll", "brute", "wolf", "claw", "throat", "quill"] },
  crawler: { id: "crawler", name: "crawlers", words: ["gnat", "tick", "moth", "grub", "brood", "crawler", "needle", "lurker"] },
  rot: { id: "rot", name: "the rot", words: ["rot", "blight", "spore", "plague", "mire", "bog", "fen", "taint"] },
  fire: { id: "fire", name: "fire", words: ["ember", "ash", "flame", "fire", "burn", "cinder"] },
  cult: { id: "cult", name: "cultists", words: ["coven", "hex", "cult", "ritual", "zealot", "acolyte", "sworn", "devotee", "tithe", "matron"] },
  wild: { id: "wild", name: "the wild wood", words: ["thorn", "bramble", "briar", "root", "oak", "sapling", "moss", "husk", "wood", "spite"] },
}

// Bonds: friendship points between two heroes (negative = rivalry).
export const BONDS = {
  fightTogether: 1, // per won fight both fought in
  adjacentEnd: 1, // ...extra when they ended the fight side by side
  saved: 3, // one saved the other's life
  friendAt: 3, // points for FRIENDS
  swornAt: 6, // points for SWORN (best friends)
  rivalAt: -3, // points for RIVALS
  friendDmg: 1, // fighting next to a friend: +1 damage
  friendAim: 5, // ...and +5% to hit
  swornDmg: 2, // next to a sworn friend: +2 damage
  rivalAim: 10, // next to a rival: +10% to hit (showing off)...
  rivalTaken: 1, // ...but takes 1 more per hit (careless)
}

export const BOND_LEVELS = {
  sworn: { id: "sworn", name: "Sworn", icon: "💞", color: "#ff8fb1", text: "Sworn friends: +2 damage when fighting next to each other." },
  friend: { id: "friend", name: "Friends", icon: "💛", color: "#ffd36b", text: "Friends: +1 damage and +5% to hit when fighting next to each other." },
  rival: { id: "rival", name: "Rivals", icon: "⚡", color: "#ff6a4a", text: "Rivals: +10% to hit next to each other (showing off) but each takes 1 more per hit (careless)." },
}

// Scars & honours: permanent small traits earned in fights.
//   kind  - "scar" (from pain) | "honour" (from glory)
//   when  - in-fight condition for the bonus: "below30" (at or below 30%
//           HP), "always", "vsFamily" (vs the grudge family), "vsBig"
//           (vs elites / bosses), "allyHurt" (an ally next to it at or below half HP)
//   dmg / aim / guard / block / hp / resPct - the bonus
export const SCARS = {
  survivor: { id: "survivor", name: "Survivor", icon: "🩹", kind: "scar", when: "below30", guard: 1, text: "Came back from the brink: takes 1 less per hit at or below 30% HP." },
  grudge: { id: "grudge", name: "Grudge", icon: "😠", kind: "scar", when: "vsFamily", dmg: 1, text: "+1 damage against the kind of foe that nearly killed it." },
  "battle-scarred": { id: "battle-scarred", name: "Battle-Scarred", icon: "🗡", kind: "scar", when: "always", hp: 3, text: "Fell twice and got up again: +3 max HP." },
  slayer: { id: "slayer", name: "Slayer", icon: "⚔", kind: "honour", when: "always", aim: 5, text: "15 foes felled: +5% to hit." },
  giantsbane: { id: "giantsbane", name: "Giantsbane", icon: "👑", kind: "honour", when: "vsBig", dmg: 1, text: "Landed the killing blow on a boss or elite: +1 damage against elites and bosses." },
  "guardian-angel": { id: "guardian-angel", name: "Guardian Angel", icon: "😇", kind: "honour", when: "allyHurt", block: 1, text: "Saved a friend's life: +1 Block at the start of each turn while an ally next to it is at or below half HP." },
  seasoned: { id: "seasoned", name: "Seasoned", icon: "🎖", kind: "honour", when: "always", resPct: 10, text: "10 fights won: starts fights with +10% resource." },
}

// When a memory becomes a scar / honour (career numbers on the hero).
export const SCAR_RULES = {
  nearDeathPct: 0.1, // falling to <= 10% HP and surviving the fight
  slayerKills: 15,
  scarredFalls: 2,
  seasonedFights: 10,
  savedPct: 0.3, // an ally at <= 30% HP counts as "saved" when its attacker dies
}

export const HISTORY_MAX = 8
