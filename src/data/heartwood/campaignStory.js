// The Long Campaign, part 2 - THE BIG BRANCHING STORY. Pure data; the
// rules live in services/heartwood/campaignStoryEngine.js (+ the hooks
// in campaignEngine.js). Every word here is hand-written - nothing is
// generated at runtime.
//
// As a player reads it:
// - Every chapter's story mission ends in a CHOICE scene (2-3 options,
//   each with its stakes written on the card).
// - Choices set story flags. The flags decide:
//     * which chapter variant comes next (title, line, which region the
//       story mission is in, sometimes a region opening early),
//     * which ally faction joins (a unique hero + warriors who fight
//       beside you in their home region and every story mission),
//     * which nemesis hunts you (Hunter missions + a stronger enemy in
//       story fights),
//     * the world map (allied / warded / drained / sunk regions),
//     * and which ENDINGS are within reach at the Last Root.
// - Each ending unlocks something for the next campaign.
//
// Branch axes (story flags):
//   herald : spared | broken | captive | ally | regent | betrayed | gone | slain
//            (mercy vs ruthlessness toward Maura the Rot-Herald, Ch1 + Ch5)
//   ally   : ember | tide | stone      (the elemental schism, Ch2)
//   ley    : ward | drain              (the ley wound - MANA, Ch3)
//   void   : sunk | carried | shared   (the Hollow King's flood - the map, Ch4)
//   echo   : carried | rest | burned   (Spacemonkey's memory, Ch6)
//   mercy  : a running number (+1 kind, -1 ruthless)
//
// Requirement shape (`when` / `requires`): { flag: [allowed values] },
// every key must match; `any: [req, req]` = at least one must match.
//
// Effect shape (an option's `effects`), all optional:
//   flags {k: v}, mercy n, essence n, leyShards n, doom n, relic id,
//   xpAll n, healAll true, hero <UNIQUE_HEROES id>, nemesis <NEMESES id>,
//   endNemesis <id>, regionMods {regionId: mod}, threat {regionId: n},
//   threatAll n, open [regionId], ending <ENDINGS id>.

// ---------------------------------------------------------------------------
// Factions, unique heroes, nemeses, map marks
// ---------------------------------------------------------------------------

export const FACTIONS = {
  ember: {
    id: "ember",
    name: "The Ember Clans",
    short: "Ember Clans",
    icon: "🔥",
    region: "emberwrack",
    hero: "hehku",
    allyUnit: "ashmaw",
    allyName: "Ember-Clan Warrior",
    blurb: "Burn the Rot out, and grow back stronger.",
  },
  tide: {
    id: "tide",
    name: "The Tide Folk",
    short: "Tide Folk",
    icon: "🌊",
    region: "mistfen",
    hero: "merra",
    allyUnit: "brinecaller",
    allyName: "Tide-Singer",
    blurb: "Wash it out slowly. The tide always wins.",
  },
  stone: {
    id: "stone",
    name: "The Stone Moot",
    short: "Stone Moot",
    icon: "⛰",
    region: "deepening",
    hero: "kivi",
    allyUnit: "stoneward",
    allyName: "Moot Shieldbearer",
    blurb: "Wall it in. Nothing gets past stone.",
  },
}

// The Ley Wardens are not a schism faction - they come with the Ley choice.
export const LEY_WARDEN_ALLY = { unit: "glimmerward", name: "Ley Warden" }

// Story heroes: they join with a fixed name. `defId` is a UNITS id.
export const UNIQUE_HEROES = {
  hehku: { id: "hehku", name: "Hehku", defId: "emberwisp", title: "Firstblade of the Ember Clans", line: "\"Point me at it. I'll do the rest.\"" },
  merra: { id: "merra", name: "Merra", defId: "tidewarden", title: "Tide-Singer of Mistfen", line: "\"I've waited longer for less.\"" },
  kivi: { id: "kivi", name: "Kivi", defId: "stonemoot-sentinel", title: "Speaker of the Stone Moot", line: "\"Where you stand, I stand. That's the whole oath.\"" },
  saarni: { id: "saarni", name: "Saarni", defId: "starcaller", title: "Ley Warden", line: "\"The lines hum when you walk over them. Did you know?\"" },
  maura: { id: "maura", name: "Maura", defId: "hexmother", title: "the Unhooded, last of the longship seers", line: "\"I know how the Rot thinks. Let me show you.\"" },
  ilta: { id: "ilta", name: "Ilta", defId: "witherkit", title: "the Herald's Apprentice", line: "\"She told me about you. All of it.\"" },
}

// Nemeses: they hunt you. `enemies` = the enemy each Act sends (index =
// Act-1); its name is replaced by `rivalName`. Beat them HUNTS_TO_ROUT
// times to drive them off.
export const NEMESES = {
  herald: {
    id: "herald",
    name: "Maura the Rot-Herald",
    rivalName: "Maura the Rot-Herald",
    title: "The Herald's Grudge",
    icon: "🥀",
    blurb: "You broke her staff. She has not forgotten.",
    enemies: ["drowned-siren", "hollowfen", "hollowspite", "hollowcurse", "crownless-revenant", "echo-stalker", "verge-warden"],
    routed: "Maura's Brood scatters into the mist. The hunts stop - for now.",
  },
  wardens: {
    id: "wardens",
    name: "Saarni of the Broken Ley",
    rivalName: "Saarni of the Broken Ley",
    title: "The Wardens' Reckoning",
    icon: "✦",
    blurb: "You drank the ley dry. The Wardens want it back - out of you.",
    enemies: ["mist-growler", "rune-warden", "bonewarden", "rootward", "ironroot", "riftmnemon", "verge-warden"],
    routed: "Saarni lowers her staff. \"Keep it, then. Choke on it.\" The Wardens go home.",
  },
  echo: {
    id: "echo",
    name: "The Echo That Wears Your Face",
    rivalName: "Your Own Echo",
    title: "The Echo",
    icon: "🌑",
    blurb: "You carry the void. Something in it learned your face.",
    enemies: ["mossback-lurker", "duskmoth", "veilgnaw", "duskwither", "ashen-regent", "echo-stalker", "mnemosyne-colossus"],
    routed: "The Echo flickers, smiles your smile, and goes out like a candle.",
  },
}
export const HUNTS_TO_ROUT = 2
export const HUNT_EVERY_DAYS = 6
export const HUNT_FIRST_DELAY = 3
export const HUNT_THREAT_BONUS = 6 // DifficultyEngine score on a Hunter mission
export const HUNT_IGNORED_DOOM = 1

// Map marks a story choice leaves on a region.
export const REGION_MODS = {
  allied: { id: "allied", label: "Allied", threatMult: 0.5, text: "An allied faction holds it. Threat grows half as fast, and their warriors fight beside you here." },
  warded: { id: "warded", label: "Warded", threatMult: 0.5, text: "The Ley Wardens watch it. Threat grows half as fast." },
  drained: { id: "drained", label: "Drained", threatMult: 1.5, text: "You drained its ley dry. No more Ley Sites; the dead marsh rots faster." },
  sunk: { id: "sunk", label: "Sunk", threatMult: 0, text: "The Silence the Hollow King let loose lies here now. Nothing lives there; nothing comes out." },
}

// Ley choice (Ch3) numbers.
export const LEY_WARD_SHARD_BONUS = 1
export const LEY_DRAIN_OVERCHARGE = 20
export const HOLLOW_ROAD_OVERCHARGE = 10

// ---------------------------------------------------------------------------
// Chapter beats - the story mission each chapter offers. First matching
// variant wins; the last one (no `when`) is the default.
// ---------------------------------------------------------------------------

export const STORY_BEATS = {
  1: [{ title: "The Rootkeeper's Gate", line: "Something old guards the first gate. It does not want you through.", region: "outer-grove" }],
  2: [
    { when: { herald: ["captive"] }, title: "Maura's Hidden Way", line: "Your prisoner knows a road the Rot uses. She swears it's the quickest way to the heart.", region: "hollow-ley" },
    { when: { herald: ["broken"] }, title: "The Herald's Ambush", line: "Maura got there first. The Deepening is full of her Brood.", region: "deepening" },
    { title: "Heart of the Deepening", line: "The forest's heart is hiding. Find what it hides from.", region: "deepening" },
  ],
  3: [
    { when: { ally: ["ember"] }, title: "The Ley Fire", line: "The ley under Emberwrack has caught fire. The clans want it out - one way or another.", region: "emberwrack" },
    { when: { ally: ["tide"] }, title: "The Ley Flood", line: "The ley under Mistfen has burst its banks. Mana pours through the reeds like light.", region: "mistfen" },
    { when: { ally: ["stone"] }, title: "The Ley Fault", line: "The ground under the Deepening has cracked along a ley line. The Moot can't hold it shut.", region: "deepening" },
    { title: "The Wounded Hearthwood", line: "Reality is thin here. Hold your squad together.", region: "deepening" },
  ],
  4: [
    { when: { ley: ["drain"] }, title: "The Dry Reckoning", line: "You come to the centre full of stolen ley. The guardian there can smell it on you.", region: "hollow-ley" },
    { when: { ley: ["ward"] }, title: "The Reckoning", line: "The Wardens walk with you to the centre. The guardian there never wanted this.", region: "hollow-ley" },
    { title: "The Reckoning", line: "The guardian at the centre never wanted this. Neither did you.", region: "hollow-ley" },
  ],
  5: [
    { when: { herald: ["broken"] }, title: "The Thorn Throne", line: "Maura has taken the empty crown. Her Brood holds the Reach.", region: "crownless" },
    { title: "The Empty Throne", line: "The crown is still warm. Someone must take it from the dark.", region: "crownless" },
  ],
  6: [
    { when: { void: ["carried"] }, title: "The Echo Within", line: "The dark you carry knows this place. It hums like it's coming home.", region: "deepening" },
    { title: "The Echo Rift", line: "The forest remembers you too hard. Break the echo.", region: "deepening" },
  ],
  7: [
    { when: { herald: ["regent"] }, title: "The Last Root", line: "Maura keeps the empty throne for you. Go down to the last root. Finish it.", region: "crownless" },
    { title: "The Last Root", line: "The end of the road, and the last verse. Win, and decide how the Song ends.", region: "crownless" },
  ],
}

// Which choice scene a chapter's story win opens (first match wins).
export const CHAPTER_SCENES = {
  1: [{ scene: "rootkeeper-gate" }],
  2: [{ scene: "elemental-schism" }],
  3: [{ scene: "ley-wound" }],
  4: [{ scene: "hollow-flood" }],
  5: [
    { when: { herald: ["broken"] }, scene: "thorn-throne" },
    { when: { herald: ["captive"] }, scene: "chained-herald" },
    { scene: "empty-throne" },
  ],
  6: [{ scene: "echo-rift" }],
  7: [{ scene: "last-root" }],
}

// ---------------------------------------------------------------------------
// Choice scenes. `lines` = [speaker, text] (speaker null = narration).
// Option stakes = [tone, text], tone: good | bad | story.
// ---------------------------------------------------------------------------

export const STORY_SCENES = {
  "rootkeeper-gate": {
    id: "rootkeeper-gate",
    chapter: 1,
    title: "The Rootkeeper's Gate",
    icon: "🌳",
    lines: [
      ["The Rootkeeper", "...You. You are not the corruption."],
      ["The Rootkeeper", "Listen. The Rot does not come from the roots. It comes from deeper. It is the Silence, out of balance - forgetting eating at the forest's memory. And I am that memory. The heart is hiding."],
      [null, "At his feet, tangled in his own roots, kneels a hooded woman with a staff of black sap and the braided hair of the old longship seers. She was feeding the Rot into him, drop by drop."],
      ["Maura", "Well? Go on. My people were promised every answer, and the only answer was Silence. You won't stop what's coming by stopping me."],
      [null, "A verse of the First Song stirs in the Rootkeeper's bark: \"First there was silence, and the silence was whole. Then something sang - and the first sound was a root.\""],
    ],
    options: [
      {
        id: "spare",
        label: "Let her go",
        say: "\"Go. Tell whoever sent you the Hearth still burns.\"",
        stakes: [["story", "She walks free - and she'll remember who spared her"], ["good", "No hunter on your trail"]],
        result: "Maura looks at you a long time. Then she pulls up her hood and is gone into the mist. Behind you the Rootkeeper sighs, like old wood settling.",
        effects: { flags: { herald: "spared" }, mercy: 1 },
      },
      {
        id: "break",
        label: "Break her staff and drive her out",
        say: "\"Not one more drop.\"",
        stakes: [["good", "+200 Essence from the cache she guarded"], ["good", "Relic: Sundering Mark"], ["bad", "She will hunt you - Hunter missions from Chapter 2"]],
        result: "The staff snaps like a bone. Maura doesn't scream. She looks at you once, and runs - and you know you'll see that look again.",
        effects: { flags: { herald: "broken" }, mercy: -1, essence: 200, relic: "sundering-mark", nemesis: "herald" },
      },
      {
        id: "captive",
        label: "Take her back to the Hearth in chains",
        say: "\"You're coming with us. You'll have plenty of time to talk.\"",
        stakes: [["good", "Doom -1: her raiders scatter without her"], ["story", "She knows the Rot's hidden roads - Chapter 2 takes another way, and the Hollow Ley opens early"]],
        result: "She doesn't fight the chains. On the road home she hums an old Warden song, and won't say where she learned it.",
        effects: { flags: { herald: "captive" }, doom: -1, open: ["hollow-ley"] },
      },
    ],
  },

  "elemental-schism": {
    id: "elemental-schism",
    chapter: 2,
    title: "The Elemental Schism",
    icon: "✷",
    lines: [
      ["Heartwood Warden", "The heart is not sick. It is hiding. And its children are at each other's throats."],
      [null, "Three elementals stand in the clearing, none of them looking at the others."],
      ["Hehku of the Ember Clans", "Burn the Rot out. All of it. What grows back will be ours."],
      ["Merra of the Tide Folk", "Burn, burn. Always burning. Wash it out slowly. The tide always wins."],
      ["Kivi of the Stone Moot", "Neither. Wall it in. Nothing gets past stone."],
      ["Heartwood Warden", "Each of them tells a different tale of where the forest came from. None of them is wholly wrong. They will follow whoever you stand with. Choose."],
      [null, "A verse of the First Song hums between the three of them: \"Out of the Song came fire, and water, and stone - and each one swore that it came first.\""],
    ],
    options: [
      {
        id: "ember",
        label: "Stand with the Ember Clans",
        say: "\"Fire, then. We burn it out.\"",
        stakes: [["good", "Hehku joins your roster (Spellblade)"], ["good", "Clan warriors fight beside you in Emberwrack and every story mission"], ["good", "Emberwrack is Allied: its threat grows half as fast"], ["bad", "The Tide Folk close their fords: Mistfen threat +20"]],
        result: "Hehku grins like a struck match. Behind her the ridge lights up with clan fires, one after another, all the way to the sky.",
        effects: { flags: { ally: "ember" }, hero: "hehku", regionMods: { emberwrack: "allied" }, threat: { mistfen: 20 } },
      },
      {
        id: "tide",
        label: "Stand with the Tide Folk",
        say: "\"Slow and patient. We wash it out.\"",
        stakes: [["good", "Merra joins your roster (Juggernaut)"], ["good", "Tide-singers fight beside you in Mistfen and every story mission"], ["good", "Mistfen is Allied: its threat grows half as fast"], ["bad", "The Ember Clans sulk on their ridge: Emberwrack threat +20"]],
        result: "Merra bows, low and unhurried. That night the fog over Mistfen sings, and the Rot in the reeds goes quiet.",
        effects: { flags: { ally: "tide" }, hero: "merra", regionMods: { mistfen: "allied" }, threat: { emberwrack: 20 } },
      },
      {
        id: "stone",
        label: "Stand with the Stone Moot",
        say: "\"We hold. Nothing else gets through.\"",
        stakes: [["good", "Kivi joins your roster (Sentinel)"], ["good", "Moot shieldbearers fight beside you in the Deepening and every story mission"], ["good", "The Deepening is Allied: its threat grows half as fast"], ["bad", "Fire and tide both feel snubbed: Emberwrack and Mistfen threat +10"]],
        result: "Kivi nods once, which from a Moot-speaker is a speech. By morning a wall of standing stones rings the Deepening.",
        effects: { flags: { ally: "stone" }, hero: "kivi", regionMods: { deepening: "allied" }, threat: { emberwrack: 10, mistfen: 10 } },
      },
    ],
  },

  "ley-wound": {
    id: "ley-wound",
    chapter: 3,
    title: "The Ley Wound",
    icon: "✦",
    lines: [
      [null, "The ley line under the forest has split open. Mana bleeds into the air like light through a cracked lantern."],
      ["Saarni, Ley Warden", "We have watched these lines since before the Hearth was lit. Help us close the wound, and the ley will remember you."],
      ["Spacemonkey", "Or - hear me out - you drink it. All of it. That's the war won right there. Probably. Mostly."],
      ["Saarni, Ley Warden", "These lines are the veins of the First Song. Drink it, and there's nothing left to heal the forest with. Ever."],
      [null, "A verse of the First Song glows in the bleeding ley: \"Under the ground the Song ran in bright veins, and where it ran, the world remembered how to be.\""],
    ],
    options: [
      {
        id: "ward",
        label: "Stand with the Ley Wardens",
        say: "\"Close it. We'll win without stealing from the forest.\"",
        stakes: [["good", "Saarni joins your roster (Ritualist)"], ["good", "Mistfen and the Hollow Ley are Warded: threat grows half as fast"], ["good", `Ley Site missions pay +1 Ley Shard, and a Warden fights beside you there`], ["story", "The forest will remember this"]],
        result: "You hold the wound shut while the Wardens sing it closed. When it's done the ground hums under your boots - not loud, but steady, like a heartbeat.",
        effects: { flags: { ley: "ward" }, hero: "saarni", regionMods: { mistfen: "warded", "hollow-ley": "warded" } },
      },
      {
        id: "drain",
        label: "Drain the ley for power",
        say: "\"We need it more than the dirt does.\"",
        stakes: [["good", "+5 Ley Shards now"], ["good", "Every fight for the rest of the campaign starts +20 Overcharge"], ["bad", "Doom +3"], ["bad", "Mistfen is Drained: no more Ley Sites there, and it rots faster"], ["bad", "The Ley Wardens will hunt you"]],
        result: "The mana comes up into you like cold water, then like fire. Mistfen goes grey around the edges. Saarni says nothing at all - she just turns and walks away.",
        effects: { flags: { ley: "drain" }, leyShards: 5, doom: 3, regionMods: { mistfen: "drained" }, nemesis: "wardens", mercy: -1 },
      },
    ],
  },

  "hollow-flood": {
    id: "hollow-flood",
    chapter: 4,
    title: "The Hollow Flood",
    icon: "🌑",
    lines: [
      ["The Hollow King", "A kingdom that would never die... that's what it promised us. I only wanted to finish the Song, so it would last forever... I only wanted..."],
      [null, "The last jarl of the longships comes apart like smoke. But the dark he held doesn't vanish. It spills out over the roots like floodwater, looking for somewhere to go."],
      ["Spacemonkey", "That's the Silence. Not evil - just the thing that stops a song going on forever. He tried to sing past it. It has to go somewhere. It always has to go somewhere."],
      [null, "A verse of the First Song rises out of the dark flood: \"Silence follows every song as night follows day - not to end it, but to let it rest.\""],
    ],
    options: [
      {
        id: "sink",
        label: "Sink it into the Hollow Ley",
        say: "\"Down. Bury it where it came from.\"",
        stakes: [["bad", "The Hollow Ley is lost for good - it sinks, and no mission goes there again"], ["good", "Doom -2"], ["story", "No one has to carry it"]],
        result: "The dark pours into the Hollow Ley and the ground closes over it like water over a stone. On the map, a whole region goes quiet. Forever.",
        effects: { flags: { void: "sunk" }, doom: -2, regionMods: { "hollow-ley": "sunk" } },
      },
      {
        id: "carry",
        label: "Carry it yourself",
        say: "\"Give it to me. I'll hold it.\"",
        stakes: [["good", "Every hero +6 XP"], ["good", "+2 Ley Shards"], ["bad", "Doom +2"], ["bad", "Something in the dark learns your face - and hunts you"]],
        result: "It goes into you quietly, like breath. Your heroes feel it too - sharper, faster, a little colder. Somewhere behind you, something starts to walk the way you walk.",
        effects: { flags: { void: "carried" }, xpAll: 6, leyShards: 2, doom: 2, nemesis: "echo", mercy: -1 },
      },
      {
        id: "share",
        label: "Ask the whole forest to hold it",
        say: "\"Not one place. Everywhere, a little.\"",
        requires: { ley: ["ward"] },
        locked: "Only the Ley Wardens could spread it that thin. You'd need to have stood with them.",
        stakes: [["good", "Doom -1"], ["good", "Every region's threat -15"], ["story", "The forest holds a little of the dark, everywhere, and doesn't mind"]],
        result: "The Wardens open every ley line at once. The dark runs thin through all of them, until it's no more than a shade under the leaves. The forest hardly notices.",
        effects: { flags: { void: "shared" }, doom: -1, threatAll: -15, mercy: 1 },
      },
    ],
  },

  "empty-throne": {
    id: "empty-throne",
    chapter: 5,
    title: "The Empty Throne",
    icon: "♛",
    lines: [
      [null, "The throne in the Crownless Reach is empty. Someone is standing beside it, hood down."],
      ["Maura", "You let me go, at the Rootkeeper's gate. I've been trying to work out why ever since."],
      ["Maura", "The Rot doesn't want me anymore. I'm not sure what I want. Tell me."],
      [null, "A verse of the First Song is cut into the throne's steps: \"A rune is a verse held still: a word the world must keep.\""],
    ],
    options: [
      {
        id: "join",
        label: "Ask her to fight beside you",
        say: "\"Walk with us. See it through.\"",
        stakes: [["good", "Maura joins your roster (Hexer)"], ["story", "Mercy, twice over"]],
        result: "She laughs - a short, surprised sound, like she'd forgotten how. Then she picks up her bag and falls in behind your heroes.",
        effects: { flags: { herald: "ally" }, hero: "maura", mercy: 1 },
      },
      {
        id: "regent",
        label: "Ask her to guard the empty throne",
        say: "\"Keep it empty. Don't let anyone sit there. Not even you.\"",
        stakes: [["good", "Doom -2: the Rot loses its herald"], ["story", "The throne gets a keeper who doesn't want it"]],
        result: "Maura sits down on the steps, not on the throne. \"No one,\" she says. \"Not even me.\" The Rot in the Reach pulls back like a held breath.",
        effects: { flags: { herald: "regent" }, doom: -2, mercy: 1 },
      },
      {
        id: "strike",
        label: "Strike her down while she's unready",
        say: "\"I should have done this the first time.\"",
        stakes: [["good", "+250 Essence"], ["bad", "She survives - and hunts you from now on"]],
        result: "She's faster than you thought. Bleeding, she backs into the shadows behind the throne. \"So that's why,\" she says. \"You just hadn't decided yet.\"",
        effects: { flags: { herald: "betrayed" }, essence: 250, nemesis: "herald", mercy: -2 },
      },
    ],
  },

  "chained-herald": {
    id: "chained-herald",
    chapter: 5,
    title: "The Chained Herald",
    icon: "⛓",
    lines: [
      [null, "You've brought Maura all this way in chains. At the foot of the empty throne, she finally asks for something."],
      ["Maura", "Let me go. Or don't. But stop making me watch you wonder."],
      [null, "A verse of the First Song is cut into the throne's steps: \"A rune is a verse held still: a word the world must keep.\""],
    ],
    options: [
      {
        id: "free",
        label: "Unlock her chains",
        say: "\"You've earned it. Walk with us, if you want.\"",
        stakes: [["good", "Maura joins your roster (Hexer)"], ["story", "Mercy, late but real"]],
        result: "The chains fall. She rubs her wrists for a while without a word. Then she stands up and takes her place among your heroes.",
        effects: { flags: { herald: "ally" }, hero: "maura", mercy: 1 },
      },
      {
        id: "keep",
        label: "Keep her chained",
        say: "\"Not yet. Maybe not ever.\"",
        stakes: [["good", "+300 Essence: her Brood pays to keep her alive"], ["story", "She stays your prisoner to the end"]],
        result: "A bag of coin arrives at the Hearth that night, with no note. Another will come next season, and the season after.",
        effects: { flags: { herald: "captive" }, essence: 300, mercy: -1 },
      },
      {
        id: "keeper",
        label: "Leave her here as the throne's keeper",
        say: "\"Stay. Guard it. Let no one sit there.\"",
        stakes: [["good", "Doom -2"], ["story", "The throne gets a keeper who doesn't want it"]],
        result: "You leave the key in her hand. She doesn't use it on the throne. She sits on the steps and watches the road, and the Rot stays back.",
        effects: { flags: { herald: "regent" }, doom: -2, mercy: 1 },
      },
    ],
  },

  "thorn-throne": {
    id: "thorn-throne",
    chapter: 5,
    title: "The Thorn Throne",
    icon: "🥀",
    lines: [
      [null, "Maura sits on the empty throne with a crown of black thorns on her head. Her Brood fills the hall behind her."],
      ["Maura", "You broke my staff. So I found a bigger one."],
      ["Maura", "I'm tired, though. Aren't you?"],
      [null, "A verse of the First Song is cut into the throne's steps: \"A rune is a verse held still: a word the world must keep.\""],
    ],
    options: [
      {
        id: "peace",
        label: "Offer her peace",
        say: "\"Take off the crown and go. Nobody follows you.\"",
        stakes: [["good", "The Herald's hunts end"], ["good", "Doom -1"], ["story", "Mercy, at the very last"]],
        result: "For a long moment nothing happens. Then she lifts the thorns off her head and sets them on the seat, very gently, and walks out past your heroes without looking back.",
        effects: { flags: { herald: "gone" }, endNemesis: "herald", doom: -1, mercy: 2 },
      },
      {
        id: "end",
        label: "End it",
        say: "\"No more running. For either of us.\"",
        stakes: [["good", "The Herald's hunts end"], ["good", "+300 Essence and a relic from her hoard"], ["bad", "There's no coming back from this one"]],
        result: "It's over quickly. The thorn crown rolls down the steps and stops at your feet. You leave it there.",
        effects: { flags: { herald: "slain" }, endNemesis: "herald", essence: 300, relic: "witherspite-crown", mercy: -1 },
      },
    ],
  },

  "echo-rift": {
    id: "echo-rift",
    chapter: 6,
    title: "Spacemonkey's Memory",
    icon: "✧",
    lines: [
      ["The forest", "He is in here. What is left of him."],
      [null, "A blue-violet shape flickers in the rift: a tail, a crooked grin, a hand that won't keep still."],
      ["Spacemonkey's memory", "Don't look at me like that. I'm not asking you to forgive me. I'm asking you to keep going."],
      ["Spacemonkey's memory", "You can take me with you, if you want. I'm not heavy. Mostly regret, and that's light stuff."],
      [null, "A verse of the First Song flickers through the rift: \"What the root remembers, it can remember wrong - and then the wrong thing is true.\""],
    ],
    options: [
      {
        id: "carry",
        label: "Carry his memory",
        say: "\"Come on, then. You never got to see the end.\"",
        stakes: [["good", "+2 Ley Shards"], ["story", "He walks with you to the Last Root"]],
        result: "The memory curls up somewhere behind your ribs, warm and a little smug. Now and then you catch yourself humming a song you don't know.",
        effects: { flags: { echo: "carried" }, leyShards: 2, mercy: 1 },
      },
      {
        id: "rest",
        label: "Let him rest",
        say: "\"You've done enough. Sleep.\"",
        stakes: [["good", "Doom -2"], ["good", "Every hero healed to full"]],
        result: "He grins one last time and comes apart into light. The rift closes softly behind him, and your heroes wake up feeling lighter than they have in months.",
        effects: { flags: { echo: "rest" }, doom: -2, healAll: true },
      },
      {
        id: "burn",
        label: "Burn the memory for power",
        say: "\"Sorry, old friend. We need everything.\"",
        requires: { ley: ["drain"] },
        locked: "Only someone who already drank the ley would know how.",
        stakes: [["good", "+4 Ley Shards"], ["good", "Every hero +6 XP"], ["bad", "Doom +1"]],
        result: "He doesn't fight it. That's the worst part. The light goes into your heroes, and the rift goes dark, and nobody says anything for a long time.",
        effects: { flags: { echo: "burned" }, leyShards: 4, xpAll: 6, doom: 1, mercy: -2 },
      },
    ],
  },

  "last-root": {
    id: "last-root",
    chapter: 7,
    title: "The Last Root",
    icon: "🌱",
    final: true,
    lines: [
      ["The forest", "The roots remember. The heart remembers. The void remembers. You remember."],
      [null, "The Crownless stands at the last root - not a ruler, but the last verse of the First Song, never sung. It doesn't speak. It only waits."],
      [null, "The last verse of the First Song begins: \"And the forest...\" - and there it stops."],
      ["The forest", "Am I a broken world to mend, or a world left unfinished on purpose? Who leads us now? How does the Song end?"],
    ],
    // One option per ending; the flags decide which are open.
    options: [
      {
        id: "rooted",
        label: "Sing the Song back as it was",
        say: "\"Grow back. Just the way you were.\"",
        requires: { ley: ["ward"], void: ["sunk", "shared"] },
        locked: "You'd need the Ley Wardens' trust - and no dark of your own to carry.",
        stakes: [["story", "Ending: The Song Restored"]],
        result: "",
        effects: { ending: "rooted" },
      },
      {
        id: "ember",
        label: "Bind the forest with burning runes",
        say: "\"Not what it was. Stronger.\"",
        requires: { any: [{ ally: ["ember"] }, { ley: ["drain"] }] },
        locked: "Only the Ember Clans - or someone full of stolen ley - would dare.",
        stakes: [["story", "Ending: The Bound Forest"]],
        result: "",
        effects: { ending: "ember" },
      },
      {
        id: "hollow",
        label: "Let the Silence keep part of the forest",
        say: "\"It's been in me all this time. It can live here too.\"",
        requires: { void: ["carried"] },
        locked: "Only someone who carried the Hollow King's dark could offer it a home.",
        stakes: [["story", "Ending: The Silence Accepted"]],
        result: "",
        effects: { ending: "hollow" },
      },
      {
        id: "echo",
        label: "Sing a new verse with Spacemonkey's memory",
        say: "\"You wanted to see this. Look.\"",
        requires: { echo: ["carried"] },
        locked: "You'd need to have carried his memory this far.",
        stakes: [["story", "Ending: The New Verse"]],
        result: "",
        effects: { ending: "echo" },
      },
      {
        id: "peace",
        label: "Leave the crown empty, with Maura to guard it",
        say: "\"Nobody rules here. Not anymore.\"",
        requires: { herald: ["ally", "regent"] },
        locked: "You'd need someone who learned what mercy means. Twice.",
        stakes: [["story", "Ending: The Crownless Peace"]],
        result: "",
        effects: { ending: "peace" },
      },
      {
        id: "watch",
        label: "Leave the Song unfinished, and go home",
        say: "\"It isn't mine to decide. We'll keep the Hearth lit.\"",
        stakes: [["story", "Ending: The Unfinished Song"]],
        result: "",
        effects: { ending: "watch" },
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// Endings - the epilogue screen + what each unlocks for the next campaign.
// ---------------------------------------------------------------------------

export const ENDINGS = {
  rooted: {
    id: "rooted",
    title: "The Song Restored",
    color: "#7fb069",
    light: "green",
    epilogue: [
      "You sing the verses back the way they were, and the forest remembers its old shape. Not all at once - a grove here, a stream there - but it remembers. Song, Root, Rune and Silence go back to their own sides.",
      "The Heartwood Warden takes the empty seat. He doesn't call it a throne. He calls it a stump, and sits on it like one.",
      "The Ley Wardens walk the lines every spring. The ground still hums when your heroes pass. But a restored song is not the same song: some of the paths you walked are gone, and they will not grow back.",
      "Somewhere in the green, Spacemonkey's memory smiles. Me jatkamme puun tarinaa.",
    ],
    unlock: "commander:lehva",
  },
  ember: {
    id: "ember",
    title: "The Bound Forest",
    color: "#e07a3a",
    light: "red",
    epilogue: [
      "Runes are burned into every root, and the forest comes back red. New bark, hard as iron. New leaves the colour of coals. It keeps its rules now - all of them, always.",
      "The Ashlord Reborn takes the crown. The Ember Clans sing all night on the ridge.",
      "It is a stronger forest now, and a predictable one. It is not a freer one - it has stopped dreaming. Your heroes notice the difference, and say nothing.",
      "Spacemonkey's memory frowns, and warns you - and then, because it's you, accepts it.",
    ],
    unlock: "relic:emberbrand",
  },
  hollow: {
    id: "hollow",
    title: "The Silence Accepted",
    color: "#9b7fc7",
    light: "violet",
    epilogue: [
      "You set down the dark you've carried since the Reckoning, and the forest takes it in.",
      "Violet light runs through the roots, and whole groves fade out of the world - forgotten, so the rest can go on living. The Silence isn't an enemy anymore. It's just the quiet part of the forest - the part that keeps the Song from growing forever.",
      "The Crownless kneels, and the crown it never wore settles on you instead.",
      "Spacemonkey's memory whispers: \"You did what I didn't dare to.\"",
    ],
    unlock: "variant:hollow-road",
  },
  echo: {
    id: "echo",
    title: "The New Verse",
    color: "#7f8fe0",
    light: "blue-violet",
    epilogue: [
      "You bring his memory down to the last root, and together you sing something no one has sung before - not the old last verse, and not a new perfect order. Just a new verse, with room left after it.",
      "The crown comes apart into blue-violet light and doesn't come back together. You aren't a king. You're the one who carried the memory that saved the forest.",
      "Leaves grow with a blue edge now. Flowers open only as you pass.",
      "\"I didn't run anymore,\" the memory says. \"And you didn't leave me.\" The forest doesn't remember kings. It remembers those who didn't run.",
    ],
    unlock: "variant:echo",
  },
  peace: {
    id: "peace",
    title: "The Crownless Peace",
    color: "#c9b37a",
    light: "gold",
    epilogue: [
      "No one takes the crown. Maura keeps the throne empty, as she promised, sitting on the steps with her hood down.",
      "The Rot doesn't end. It just stops having anyone to speak for it. Without a herald, the Silence is only weather.",
      "Every season someone comes to the Reach to ask who rules the forest. Maura sends them home with the same answer: the forest does.",
      "Puun ehdoilla. On the tree's own terms.",
    ],
    unlock: "variant:unhooded",
  },
  watch: {
    id: "watch",
    title: "The Unfinished Song",
    color: "#a8b98a",
    light: "ember-gold",
    epilogue: [
      "You don't sing the last verse. The Crownless waits a while longer, then sinks back into the root to wait for someone who will. Maybe the forest was meant to stay unfinished.",
      "The forest lives. It is tired, and patched, and stubborn, and it lives.",
      "You go home. The Hearth stays lit. On quiet nights your heroes still take turns at the window, watching the treeline.",
      "Somewhere down there, the story is waiting for the next one who comes.",
    ],
    unlock: "relic:weathered-standard",
  },
}
export const ENDING_ORDER = ["rooted", "ember", "hollow", "echo", "peace", "watch"]

// ---------------------------------------------------------------------------
// Story starts (unlocked by endings) - pick one when lighting a new Hearth.
// ---------------------------------------------------------------------------

export const START_VARIANTS = {
  "hollow-road": {
    id: "hollow-road",
    name: "The Hollow Road",
    icon: "🌑",
    blurb: "You remember the void. Start with 4 Ley Shards and every fight +10 Overcharge - but doom starts at 2.",
    log: "The void hums at the edge of hearing. You've walked this road before.",
  },
  echo: {
    id: "echo",
    name: "Spacemonkey's Echo",
    icon: "✧",
    blurb: "A blue-violet echo walks with you. The Ley Well starts built (Level 1), and you have 2 Ley Shards.",
    log: "A blue-violet flicker at the window. \"Again? Fine. I'll get the kettle.\"",
  },
  unhooded: {
    id: "unhooded",
    name: "Maura Unhooded",
    icon: "🕯",
    blurb: "The Herald's apprentice, Ilta, joins you from day one. The first story mission needs one win fewer.",
    log: "A girl in Herald's grey is waiting by the Hearth. \"She sent me,\" she says. \"She said you'd understand.\"",
  },
}
