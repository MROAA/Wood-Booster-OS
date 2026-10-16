// Hearthwood - DOTA DEPTH sprint: item TIERS + BUILD PATHS, ACTIVE items,
// and COUNTERPLAY (enemy kits that demand an answer + the items that
// answer them). Pure data - Studio-editable (Hearthwood Studio > Gear:
// "Build recipes" and "Item actives"). The rules live in
// services/heartwood/itemBuilds.js (forging, build paths, unlocks) and
// services/heartwood/tacticsItems.js (actives + kits in a fight).
//
// As a player reads it:
// - ITEM TIERS: Components (the shop sells them) -> Crafted items ->
//   Masterworks. Bring every part of a recipe (worn or in the bag) and pay
//   the recipe cost at the Market's forge, or Craft it at a camp.
//   Crafted items open in Act II, Masterworks in Act III.
// - BUILD PATHS: every hero picks one of 2-3 paths for its class. The
//   shop then marks the components that path still needs.
// - ACTIVES: some items add a button to the hero's action bar in a fight
//   (AP and/or mana, a recharge, sometimes a few uses).
// - COUNTERPLAY: some enemy families bring a trick (Mist Veil, Runeshell,
//   Mossbloom, Seedcaller, Ironbark, Shadowmoss). Each one has items that
//   answer it - the pre-fight threat panel says what to bring.

export const BUILD_TIERS = {
  1: { id: 1, name: "Component", act: 1, text: "Sold in the shop. Useful alone, better combined." },
  2: { id: 2, name: "Crafted", act: 2, text: "Forged from components + a recipe cost. Opens in Act II." },
  3: { id: 3, name: "Masterwork", act: 3, text: "Forged from crafted items. Opens in Act III." },
}

// Recipe fields: id, parts (item ids - every one is used up), cost (Essence,
// the "recipe" price), result (item id), text (the hint the player reads).
export const BUILD_RECIPES = {
  "foxfire-charm": { id: "foxfire-charm", parts: ["wind-seed", "lucky-charm"], cost: 50, result: "foxfire-charm", text: "A Wind Seed tied to a Lucky Charm burns with foxfire." },
  "gale-bough": { id: "gale-bough", parts: ["oak-staff", "wind-seed"], cost: 50, result: "gale-bough", text: "Graft a Wind Seed onto an Oak Staff and it learns to push." },
  sapdrinker: { id: "sapdrinker", parts: ["spellbreak-thorn", "iron-blade"], cost: 50, result: "sapdrinker", text: "A Spellbreak Thorn set into an Iron Blade drinks magic." },
  "owlsight-charm": { id: "owlsight-charm", parts: ["owl-feather", "lucky-charm"], cost: 50, result: "owlsight-charm", text: "An Owl Feather and a Lucky Charm see through any mist." },
  blightbrand: { id: "blightbrand", parts: ["wither-thorn", "bone-dagger"], cost: 50, result: "blightbrand", text: "A Wither Thorn bound to a Bone Dagger brands what it cuts." },
  barksplitter: { id: "barksplitter", parts: ["bark-wedge", "whetstone"], cost: 50, result: "barksplitter", text: "Hone a Bark Wedge on a Whetstone into a Barksplitter." },
  "reaping-scythe": { id: "reaping-scythe", parts: ["reaping-sickle", "whetstone"], cost: 50, result: "reaping-scythe", text: "A Reaping Sickle honed long becomes a Scythe." },
  "unbinding-bell": { id: "unbinding-bell", parts: ["unbinding-charm", "buckler"], cost: 50, result: "unbinding-bell", text: "Hang an Unbinding Charm inside a Buckler and it rings." },
  "owl-lantern": { id: "owl-lantern", parts: ["glowdust-pouch", "lucky-charm"], cost: 50, result: "owl-lantern", text: "Glowdust in a lantern never stops glowing." },
  "heartoak-aegis": { id: "heartoak-aegis", parts: ["ironbark-guard", "unbinding-bell"], cost: 100, result: "heartoak-aegis", text: "Ironbark Guard + Unbinding Bell: the heart of an oak that will not bend." },
  "whirlwind-seedstaff": { id: "whirlwind-seedstaff", parts: ["gale-bough", "wellspring-staff"], cost: 100, result: "whirlwind-seedstaff", text: "Gale Bough + Wellspring Staff: a staff that carries whirlwinds." },
  "worldseed-scepter": { id: "worldseed-scepter", parts: ["mana-heart", "fortune-rune"], cost: 150, result: "worldseed-scepter", text: "Mana Heart + Fortune Rune: the seed the world grew from." },
  "mistrender-bow": { id: "mistrender-bow", parts: ["owlsight-charm", "keen-blade"], cost: 100, result: "mistrender-bow", text: "Owlsight Charm + Keen Blade: nothing hides from this edge." },
  rootcleaver: { id: "rootcleaver", parts: ["reaping-scythe", "twin-fangs"], cost: 100, result: "rootcleaver", text: "Reaping Scythe + Twin Fangs: cleaves roots and ranks alike." },
}

// Active items. Fields: id, name, icon, text, target ("self" | "ally" |
// "enemy" | "any" | "tile"), range (tiles), ap, mana (a 100-bar amount,
// scaled to small bars), cooldown (own turns), charges (uses - gone for
// good once spent; omit = unlimited), amount / turns (what it does).
export const ITEM_ACTIVES = {
  "foxfire-step": { id: "foxfire-step", name: "Foxfire Step", icon: "✧", target: "tile", range: 4, ap: 1, mana: 10, cooldown: 3, text: "Vanish in foxfire and reappear on a free tile up to 4 away. Ignores zones and blockers (not while rooted)." },
  "gale-push": { id: "gale-push", name: "Gale Push", icon: "≋", target: "any", range: 3, ap: 1, mana: 10, cooldown: 3, amount: 2, text: "Throw a unit (foe or friend) within 3 tiles 2 tiles straight away from you - into hazards, out of danger." },
  "mana-burn": { id: "mana-burn", name: "Sap Burn", icon: "✺", target: "enemy", range: 3, ap: 1, mana: 15, cooldown: 3, amount: 25, text: "Drain up to 25 of a foe's mana and ultimate charge; it takes half the drained amount (at least 4) as damage. Breaks a Runeshell." },
  "cyclone-lift": { id: "cyclone-lift", name: "Cyclone Lift", icon: "🌀", target: "enemy", range: 4, ap: 1, mana: 20, cooldown: 4, text: "Lift a foe in a whirlwind: it can't be hit or targeted and loses its next turn. Not on bosses." },
  "heartoak-bark": { id: "heartoak-bark", name: "Heartoak Bark", icon: "🛡", target: "self", range: 0, ap: 0, mana: 0, cooldown: 5, turns: 2, text: "Free: for 2 turns nothing can root, slow, stun, chill, hex or shove this hero. Clears those right away." },
  salve: { id: "salve", name: "Salve", icon: "✚", target: "ally", range: 1, ap: 1, mana: 0, cooldown: 0, charges: 3, amount: 8, text: "Heal this hero or an ally next to it for 8." },
  moonwell: { id: "moonwell", name: "Moonwell Sip", icon: "☾", target: "self", range: 0, ap: 0, mana: 0, cooldown: 1, charges: 2, amount: 30, text: "Free, once a turn: +30 mana." },
  glowdust: { id: "glowdust", name: "Glowdust", icon: "✦", target: "self", range: 4, ap: 0, mana: 0, cooldown: 1, charges: 2, turns: 2, text: "Free: reveal every Shadowmoss foe within 4 tiles for 2 turns." },
  unbind: { id: "unbind", name: "Unbind", icon: "⊘", target: "any", range: 3, ap: 1, mana: 10, cooldown: 4, turns: 2, text: "Dispel: strip a foe's Runeshell (it can't regrow for 2 turns), Ward and Regen - or free an ally from roots, slows, stuns and hexes." },
  "unbind-peal": { id: "unbind-peal", name: "Unbinding Peal", icon: "🔔", target: "any", range: 4, ap: 1, mana: 10, cooldown: 2, turns: 2, text: "Unbind with more reach and a short recharge." },
}

// The answers a fight can demand. `label` reads after "Bring:".
export const COUNTER_TAGS = {
  "true-strike": { id: "true-strike", label: "true strike", icon: "🦉", text: "basic attacks that can't be dodged" },
  area: { id: "area", label: "area damage", icon: "✶", text: "attacks that hit the foes next to the target" },
  "mana-burn": { id: "mana-burn", label: "mana burn", icon: "✺", text: "hits that drain mana and crack magic shields" },
  dispel: { id: "dispel", label: "dispel", icon: "⊘", text: "an active that strips enemy magic" },
  "heal-cut": { id: "heal-cut", label: "healing cut", icon: "☠", text: "hits that Wither - no healing" },
  shred: { id: "shred", label: "armour shred", icon: "⚒", text: "hits that strip armour" },
  reveal: { id: "reveal", label: "reveal", icon: "✦", text: "dust or a lantern that shows hidden foes" },
  skills: { id: "skills", label: "skills", icon: "✧", text: "class skills (they never miss to a Mist Veil)" },
  // Dota depth 2.
  physical: { id: "physical", label: "basic attacks", icon: "⚔", text: "plain weapon hits (nothing to reflect)" },
  items: { id: "items", label: "item actives", icon: "◈", text: "active items still work under a silence" },
}

// Enemy kits. `enemies` = the families that bring it; `act` = the first Act
// it shows up in (layered: Act I meets only Ironbark). Numbers are read by
// tacticsItems.js. `answers` = COUNTER_TAGS ids.
export const COUNTER_KITS = {
  ironbark: {
    id: "ironbark", name: "Ironbark Hide", icon: "⛨", act: 1, armor: 2,
    text: "Armour 2: every hit on it is 2 smaller (never below 1).",
    answers: ["shred"],
    enemies: ["bark-brute", "moss-troll", "oakshell-warden", "grave-bastion", "bramblehide", "ironroot", "ironmaw", "stonewake", "hollowmarrow-sentinel", "cragfang", "blightheart-troll"],
  },
  mist: {
    id: "mist", name: "Mist Veil", icon: "🌫", act: 2, dodges: 2,
    text: "The first 2 basic attacks on it each turn miss completely. Skills and splash still land.",
    answers: ["true-strike", "area", "skills"],
    enemies: ["mist-growler", "pack-runner", "mossveil", "wraithgale", "veilgnaw", "thinreach-wraith", "wayfarer-scout", "echo-shade", "drowned-siren", "quillfang"],
  },
  bloom: {
    id: "bloom", name: "Mossbloom", icon: "✿", act: 2, heal: 4, radius: 2,
    text: "At the start of each enemy turn it heals every other foe within 2 tiles for 4 (itself for 2).",
    answers: ["heal-cut"],
    enemies: ["mossmender", "dawn-zealot", "duskmoth", "sapling-attendant", "brood-tender", "rootward", "blight-seer", "verge-warden", "tainted-sapling"],
  },
  seed: {
    id: "seed", name: "Seedcaller", icon: "🌱", act: 2, every: 2, cap: 2, minion: "sporelet",
    text: "Every 2nd enemy turn it calls a Seedling next to it (at most 2 alive).",
    answers: ["area"],
    enemies: ["brood-mother", "rootbind-thicket", "ancient-oak", "elder-oak", "rotwood-husk", "mossback-lurker"],
  },
  runeshell: {
    id: "runeshell", name: "Runeshell", icon: "⬡", act: 3, shell: 8,
    text: "A magic shell soaks the first 8 damage and regrows at the start of every enemy turn.",
    answers: ["mana-burn", "dispel"],
    enemies: ["rune-warden", "ritual-warden", "runewisp-acolyte", "hex-acolyte", "silence-weaver", "ritual-adept", "hollowcurse", "witherbound-effigy", "riftmnemon", "ashen-regent", "coven-matron"],
  },
  shroud: {
    id: "shroud", name: "Shadowmoss", icon: "◐", act: 3, reach: 1,
    text: "Hidden: it can only be attacked from the tile next to it - unless revealed.",
    answers: ["reveal"],
    enemies: ["bloomrot-stalker", "fen-stalker", "throat-taker", "duskgnaw", "echo-stalker", "hollowspite", "needlefen", "duskwither"],
  },
  // --- Dota depth 2: five more families (later Acts) ---------------------------
  bloodfang: {
    id: "bloodfang", name: "Bloodfang", icon: "🩸", act: 3, steal: 50,
    text: "Lifesteal: its hits heal it for half the damage they deal.",
    answers: ["heal-cut"],
    enemies: ["ashenmaw", "hollowfang", "witherfang", "gravemaw", "blightfang", "thornmaw"],
  },
  splitter: {
    id: "splitter", name: "Splitting Spores", icon: "❖", act: 3, count: 2, hpFactor: 0.35,
    text: "When it falls it splits into 2 small Sporelings next to where it stood.",
    answers: ["area"],
    enemies: ["gravequill", "briarmaw", "rotbore-grub", "rotgut-crawler", "spore-lurcher", "emberwrack"],
  },
  burrow: {
    id: "burrow", name: "Burrower", icon: "⛰", act: 4,
    text: "Every other turn it digs in: underground it can't be targeted or hurt until it surfaces on its own turn - unless revealed.",
    answers: ["reveal"],
    enemies: ["thornfen", "grimspite", "hollowfen", "duskhollow", "mire-gnat"],
  },
  reflect: {
    id: "reflect", name: "Thornmirror", icon: "⟲", act: 4, pct: 50,
    text: "The first skill that hurts it each turn bounces back: the caster takes half that damage. Basic attacks aren't reflected.",
    answers: ["physical", "dispel"],
    enemies: ["bramblespite", "bonewarden", "thornspite", "echo-warden", "deepwarden"],
  },
  hush: {
    id: "hush", name: "Hushcap", icon: "🔇", act: 5, radius: 2,
    text: "Silence aura: heroes within 2 tiles of it can't cast skills. Basic attacks and item actives still work.",
    answers: ["items", "physical", "dispel"],
    enemies: ["stormroot", "emberthorn-shade", "tithe-warden", "sworn-cultist", "bog-devotee", "echo-archer", "drift-archer"],
  },
}

// Build paths: a name, the items it builds toward (the last one is the
// goal), and the class groups that get it as a choice.
export const BUILD_PATHS = {
  bulwark: { id: "bulwark", name: "Unbending Oak", icon: "🛡", text: "Stand firm: armour, Block, and a Masterwork that shrugs off every control.", items: ["ironbark-guard", "unbinding-bell", "heartoak-aegis"] },
  reaper: { id: "reaper", name: "Reaper", icon: "⚔", text: "Cleave whole packs - the answer to summoners and swarms.", items: ["reaping-scythe", "twin-fangs", "rootcleaver"] },
  marksman: { id: "marksman", name: "Mistpiercer", icon: "🦉", text: "Never miss: true strike, aim and a bow that tears armour.", items: ["owlsight-charm", "keen-blade", "mistrender-bow"] },
  spellbreaker: { id: "spellbreaker", name: "Spellbreaker", icon: "✺", text: "Burn mana, crack shields and blink onto the casters.", items: ["sapdrinker", "foxfire-charm", "unbinding-bell"] },
  galewalker: { id: "galewalker", name: "Gale-walker", icon: "🌀", text: "Push, lift and reposition - control the whole board.", items: ["gale-bough", "wellspring-staff", "whirlwind-seedstaff"] },
  wellspring: { id: "wellspring", name: "Wellspring", icon: "☾", text: "Mana, mana, mana - then a Scepter that upgrades your class.", items: ["mana-heart", "fortune-rune", "worldseed-scepter"] },
  witherward: { id: "witherward", name: "Witherward", icon: "☠", text: "Cut healing and split bark: the answer to healers and armour.", items: ["blightbrand", "barksplitter", "owl-lantern"] },
}

// Class group -> its 3 build paths (the first is the suggested one).
export const GROUP_BUILD_PATHS = {
  frontline: ["bulwark", "reaper", "witherward"],
  damage: ["marksman", "reaper", "spellbreaker"],
  control: ["galewalker", "wellspring", "spellbreaker"],
  support: ["wellspring", "bulwark", "galewalker"],
  summoning: ["wellspring", "witherward", "bulwark"],
  specialist: ["spellbreaker", "galewalker", "marksman"],
  commander: ["bulwark", "wellspring", "galewalker"],
}

// The older gear-sprint items' place in the tree (they predate buildTier).
export const LEGACY_BUILD_TIER = {
  1: ["iron-blade", "bone-dagger", "oak-staff", "whetstone", "mana-gem", "herb-pouch", "empty-flask", "buckler", "padded-vest", "lucky-charm", "rune-stone"],
  2: ["twin-fangs", "keen-blade", "healing-draught", "mana-heart", "wellspring-staff", "grove-censer", "ironbark-guard", "fortune-rune"],
}

// --- Dota depth 2: ENEMY TALENTS -------------------------------------------------
// At higher threat tiers the elites, minibosses and bosses of a fight get
// small visible upgrades (the board's Threat panel lists them). How many:
// ENEMY_TALENT_COUNT[tier] per leader; T4+ also gives the 2nd-strongest foe one.
// Fields read by services/heartwood/tacticsTalents.js.
export const ENEMY_TALENT_COUNT = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 3 }
export const ENEMY_TALENTS = {
  "thick-hide": { id: "thick-hide", name: "Thick Hide", icon: "⛨", text: "Armour +1: every hit on it is 1 smaller.", armor: 1 },
  sharpened: { id: "sharpened", name: "Sharpened", icon: "🗡", text: "+2 attack.", attack: 2 },
  fleet: { id: "fleet", name: "Fleet", icon: "👣", text: "+1 movement.", move: 1 },
  "mana-siphon": { id: "mana-siphon", name: "Mana Siphon", icon: "✺", text: "Its hits drain 15 resource from the hero they land on.", siphon: 15 },
  "second-wind": { id: "second-wind", name: "Second Wind", icon: "❤", text: "Once, at the start of its turn below half HP, it heals 30% of its max HP.", secondWind: 0.3 },
  bloodrage: { id: "bloodrage", name: "Bloodrage", icon: "♨", text: "Once below half HP (at the start of its turn): +3 attack for the rest of the fight.", bloodrage: 3 },
  spellguard: { id: "spellguard", name: "Spellguard", icon: "⬡", text: "Starts with a 6-point magic shell (it doesn't regrow). Mana burn or a dispel breaks it.", shell: 6 },
}
