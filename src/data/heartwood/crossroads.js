// Hearthwood - Act Crossroads. Marc, on why the game feels shallow:
// "valinnat eivät tunnu tärkeiltä" and "runit ovat samanlaisia". A
// Crossroads is the answer to both: at every Act boundary the run stops
// for ONE mandatory, run-shaping decision - a narrative interstitial
// (the Act that just closed, the Act now opening) plus a choice drawn
// straight from Marc's story bible's per-Act "Choice consequences"
// (docs/hearthwood-story-acts.md). Each choice grants a permanent Act
// Allegiance (boons.js ACT_ALLEGIANCES - same modifier channel as
// boons/banes), sets the world's `forestState`, and raises a story
// flag later events + the ending read.
//
// Keyed by the Act being ENTERED (2..5): crossing from Act I into Act
// II shows crossroads[2], and so on. Acts VI/VII have no crossroads
// (bible has them only as sketches) - the boundary is crossed silently.
//
// Pure data. runEngine.resolveActCrossroads applies a pick; the engine
// never invents one, and an unknown act/choice id is a no-op that only
// advances `lastSeenAct` so the interstitial can't re-trigger.

export const ACT_CROSSROADS = {
  2: {
    actIndex: 2,
    fromAct: "Act I — The Outer Grove",
    intoAct: "Act II — The Deepening Woods",
    kicker: "The Rootbound Ritual",
    body:
      'Three roots stand up out of the ground where the path forks, coiled around a break in something very old. A Sapling Spirit watches you from the leaf litter. "The ritual is broken," it says. "You can mend it. You can feed it. Or you can leave it be. Whichever you choose, the forest ahead is shaped by it."',
    choices: [
      {
        id: "purify",
        label: "Mend the ritual.",
        result:
          '"Thank you," the Sapling Spirit says. "The forest breathes a little easier." The green around the roots holds, and widens by a pace as you work. The way ahead feels less like enemy ground.',
        allegiance: "rite-purified",
        forestState: "purified",
        flag: "rite_purified",
      },
      {
        id: "strengthen",
        label: "Feed the ritual.",
        result:
          '"Power," the spirit says, and will not look at you. "But dangerous power. The roots will remember this." Something a long way underground shifts, and settles heavier than it was.',
        allegiance: "rite-strengthened",
        forestState: "restless",
        flag: "rite_strengthened",
      },
      {
        id: "leave",
        label: "Leave it be.",
        result:
          '"...Silence is a choice too," the spirit says, and says nothing else. You step around the roots and walk on. Behind you the forest stays exactly as restless as you found it.',
        allegiance: "rite-untouched",
        forestState: "restless",
        flag: "rite_left",
      },
    ],
  },
  3: {
    actIndex: 3,
    fromAct: "Act II — The Deepening Woods",
    intoAct: "Act III — The Wounded Hearthwood",
    kicker: "The Elementals' Dispute",
    body:
      "The forest's own elementals have stopped agreeing with each other, and they have stopped agreeing loudly. Flame, tide and stone each want the deeper woods run their way, and each of them wants your squad's weight behind it. They are all watching you now. You have to pick one.",
    choices: [
      {
        id: "ember",
        label: "Side with Flame.",
        result:
          "The flame-elementals close around your squad, warm and impatient. From here on your strikes carry a spark that keeps burning after they land.",
        allegiance: "side-ember",
        forestState: "restless",
        flag: "sided_ember",
      },
      {
        id: "tide",
        label: "Side with Tide.",
        result:
          "The tide-elementals move through your squad like a held breath. From here on the first blow of every round finds nothing where your fighters were.",
        allegiance: "side-tide",
        forestState: "restless",
        flag: "sided_tide",
      },
      {
        id: "stone",
        label: "Side with Stone.",
        result:
          "The stone-elementals settle around your squad and do not move again. From here on your fighters carry a sliver of that stillness as armour into every round.",
        allegiance: "side-stone",
        forestState: "restless",
        flag: "sided_stone",
      },
    ],
  },
  4: {
    actIndex: 4,
    fromAct: "Act III — The Wounded Hearthwood",
    intoAct: "Act IV — The Reckoning",
    kicker: "The Echo Offered",
    body:
      "Where the Veil has worn thinnest, a piece of it hangs turning in the air, throwing no shadow, and it is offering itself to you. Take its echo into your build and you carry real power the rest of the way - and a hum that never quite lets go. Or turn it down, and go on clean.",
    choices: [
      {
        id: "take",
        label: "Take the echo.",
        result:
          "You close your hand around the shard and it weighs nothing and everything. Your squad hits harder from here on - and opens every fight a half-step behind itself, braced against a sound only it can hear.",
        allegiance: "echo-taken",
        forestState: "corrupted",
        flag: "echo_taken",
      },
      {
        id: "refuse",
        label: "Turn it down.",
        result:
          "You let your hand fall. The shard keeps turning, patient, and you walk past it. Your build stays yours - and something in the forest ahead seems to stand a little more on your side for the choice.",
        allegiance: "echo-refused",
        forestState: "purified",
        flag: "echo_refused",
      },
    ],
  },
  5: {
    actIndex: 5,
    fromAct: "Act IV — The Reckoning",
    intoAct: "Act V — The Crownless",
    kicker: "The Hollow Crown",
    body:
      "The ground is barely ground here. The last fight is close, and the void offers you the shape of a crown - accept it and you go into the end with its power, and its cost. Or resist it, and go in as what you were when you started walking.",
    choices: [
      {
        id: "accept",
        label: "Accept the crown.",
        result:
          "You let the void settle a weight on your head that isn't there. Your squad goes forward Weak at the start of every fight - and the spoils it takes are far, far richer for it.",
        allegiance: "hollow-accepted",
        forestState: "corrupted",
        flag: "hollow_accepted",
      },
      {
        id: "resist",
        label: "Resist it.",
        result:
          "You turn your head away from the crown, and keep turning until the pull of it is behind you. Your squad goes into the end braced, steady, and healing - and entirely itself.",
        allegiance: "hollow-resisted",
        forestState: "purified",
        flag: "hollow_resisted",
      },
    ],
  },
}

export function crossroadsForAct(actIndex) {
  return ACT_CROSSROADS[actIndex] || null
}
