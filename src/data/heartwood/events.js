// Hearthwood Trial - map events (Slay the Spire's "?" nodes). Marc,
// direct and more than once: "haluan tarinankerronnan kuin slay the
// spiressä. pelaaja kulkee mappia ja vastaan tulee eventtejä" - the
// player walks the map and events come up, and they carry the story.
//
// An event is pure data: a short hand-authored vignette (story text is
// always written, never generated - see the story bible in
// docs/hearthwood-story-acts.md) plus 2-3 choices, each with a result
// line and a small list of consequences. runEngine.js's
// resolveEventChoice applies the consequences and advances the run the
// same way leaving a shop does.
//
// `act` (optional 1-7): the game Act this event belongs to (see
// runEngine.js's actIndexForNode). Omit for "can appear anywhere".
// Events are picked deterministically per event-node position and not
// repeated within a run (runState.seenEvents).
//
// Consequence vocabulary (one object per entry in a choice's `effects`):
//   { essence: N }            - add N Essence (may be negative; floored at 0)
//   { relic: "random" }       - gain a random relic not already owned
//   { item: "random" }        - gain a random item into the bag
//   { unit: "random-common" } - gain a random common-tier unit on the bench
//   { squadNextBattle: [ <applyEffect objects> ] } - the squad enters the
//                               NEXT battle only with these effects
//                               applied (a blessing or a curse), via the
//                               same pendingActiveEffects channel the
//                               Commander's active power already uses
//   { flag: "name" }          - set runState.storyFlags[name] (used by
//                               later events to branch - PR: story chains)
// A choice with an empty `effects: []` is flavour only - a valid, often
// correct, "walk on" option.

export const EVENTS = [
  {
    id: "roadside-shrine",
    act: 1,
    title: "A Roadside Shrine",
    body: "Someone stacked river stones into a rough cairn where the path forks, and left a carved wooden fish on top. The moss has half-swallowed it. A shallow bowl at its base holds a little rainwater and three old coins.",
    choices: [
      {
        label: "Take the coins.",
        result: "You pocket the coins. The carved fish watches you go with its flat, patient eyes.",
        effects: [{ essence: 60 }],
      },
      {
        label: "Leave an offering of your own.",
        result: "You set a coin in the bowl and bow your head. Something in the woods goes quiet, then lets you pass. Your squad walks the next stretch a little lighter.",
        effects: [{ essence: -25 }, { squadNextBattle: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] }],
      },
      {
        label: "Walk on.",
        result: "You leave the shrine as you found it.",
        effects: [],
      },
    ],
  },
  {
    id: "hollow-tree",
    act: 1,
    title: "The Hollow Tree",
    body: "A great oak stands split open down one side, its heartwood gone black and soft. Cold air breathes out of the gap, steady as a sleeping animal. Something pale is wedged deep in the rot.",
    choices: [
      {
        label: "Reach in and take it.",
        result: "Your fingers close on a smooth cold thing and pull it free. The tree groans. Whatever it was, it's yours now - and so is the chill that came with it.",
        effects: [{ relic: "random" }, { squadNextBattle: [{ type: "applyBuff", id: "weak", amount: 1 }] }],
      },
      {
        label: "Seal the gap with bark and clay.",
        result: "You patch the wound as best you can. The breathing slows. You don't know if you helped the tree or only muffled it, but the forest seems to mark it.",
        effects: [{ flag: "sealed_hollow_tree" }, { essence: 20 }],
      },
      {
        label: "Back away.",
        result: "You give the tree a wide berth. The cold follows you for a while, then loses interest.",
        effects: [],
      },
    ],
  },
  {
    id: "trapped-forager",
    act: 1,
    title: "The Trapped Forager",
    body: "A woman is caught to the knee in a snare of living root, and has been for a while by the look of her. She isn't panicking. \"They pull tighter if you fight them,\" she says. \"Cut me loose and I'll pay what I can.\"",
    choices: [
      {
        label: "Cut her loose.",
        result: "The roots part under your blade with a wet snap. She presses a handful of coins and a charm into your hands and is gone into the trees before you can answer.",
        effects: [{ essence: 40 }, { item: "random" }],
      },
      {
        label: "Cut her loose, take nothing.",
        result: "\"You're the first honest thing I've met out here in a week,\" she says, and tells you where a fighter is holed up who owes her a favour.",
        effects: [{ unit: "random-common" }],
      },
      {
        label: "Leave her. The roots know their own.",
        result: "You walk past. She doesn't call after you. That, somehow, is worse.",
        effects: [{ flag: "left_the_forager" }],
      },
    ],
  },
  {
    id: "spacemonkey-warning",
    act: 2,
    title: "Spacemonkey's Warning",
    body: "The little astronaut is sitting on a stump when you arrive, helmet off, turning a black splinter of wood over in his gloved hands. \"You've been finding these,\" he says. It isn't a question. \"There's a name for what's leaking up through the roots. I'd rather not say it out loud this close to it.\"",
    choices: [
      {
        label: "\"Say it anyway.\"",
        result: "\"Hollow King,\" he says, very quietly, and the forest doesn't react at all, which is the part that frightens him. He hands you the splinter. \"Keep it. Know your enemy.\"",
        effects: [{ flag: "heard_the_name" }, { relic: "random" }],
      },
      {
        label: "\"Then don't. Just tell me what to do.\"",
        result: "\"Hit hard, hit first, don't let a fight go long.\" He tightens a strap on your pack. \"The longer you're out here, the more it learns you.\"",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "strength", amount: 1 }] }],
      },
    ],
  },
  {
    id: "still-pool",
    act: 2,
    title: "The Still Pool",
    body: "A pool sits in a ring of white stones, so still it looks solid. Your reflection is a half-second slow to move when you do. Down in the dark water, something that is almost your face looks back up and waits.",
    choices: [
      {
        label: "Drink.",
        result: "The water is colder than ice and tastes of iron and old rain. For a moment you see the forest the way it was - green all the way down. Then it's gone, and you feel steadier for having seen it.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "regen", amount: 3 }] }, { essence: -20 }],
      },
      {
        label: "Look closer at the reflection.",
        result: "You lean out over the water. The other face leans back. Its mouth moves - a word you can't hear - and then it's just you again, and you're holding something you didn't have before.",
        effects: [{ relic: "random" }, { squadNextBattle: [{ type: "applyBuff", id: "vulnerable", amount: 1 }] }],
      },
      {
        label: "Skirt the pool.",
        result: "You keep the white stones at your back until the pool is out of sight.",
        effects: [],
      },
    ],
  },
  {
    id: "abandoned-camp",
    title: "An Abandoned Camp",
    body: "A fire pit gone to cold ash, a bedroll, a pack still leaning against a log. Whoever made camp here left everything and walked into the trees - the footprints go one way only, and don't come back.",
    choices: [
      {
        label: "Take the supplies.",
        result: "The pack holds dried food, a coil of good rope, and a small worked-metal thing you can't name but can clearly use.",
        effects: [{ essence: 50 }, { item: "random" }],
      },
      {
        label: "Follow the footprints.",
        result: "You track them for a hundred paces to where they simply stop, mid-stride, in undisturbed leaf litter. You come back with nothing but a colder feeling than you left with.",
        effects: [{ flag: "followed_the_prints" }],
      },
      {
        label: "Break camp and move on.",
        result: "You scatter the ashes and leave the site cleaner than you found it. Old habit.",
        effects: [{ essence: 15 }],
      },
    ],
  },
  {
    id: "the-toll-root",
    title: "The Toll Root",
    body: "A root as thick as a man's waist has grown clean across the path at chest height, and won't be climbed over or crawled under without a long detour. Coins and small offerings are pressed into its bark all along its length. It seems to expect payment.",
    choices: [
      {
        label: "Pay the toll.",
        result: "You push a coin into the bark. The root shudders, contracts, and sinks into the earth just far enough to step over. It rises again behind you.",
        effects: [{ essence: -50 }],
      },
      {
        label: "Cut through it.",
        result: "It takes a long, ugly while, and the root bleeds a sap that smells of rot, and every other growing thing nearby leans away from you afterward. But you're through, and you kept your coin.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "weak", amount: 1 }] }, { flag: "cut_the_toll_root" }],
      },
    ],
  },
  {
    id: "chained-fighter",
    act: 3,
    title: "The Chained Fighter",
    body: "Someone has bound a figure to a standing stone with what looks like a whole tree's worth of ivy - wrists, chest, ankles. It lifts its head as you approach. Its eyes are clear. \"I'm not what did this,\" it says. \"I'm what tried to stop it. Let me help you finish the job.\"",
    choices: [
      {
        label: "Free it. Take it with you.",
        result: "The ivy comes away in sheets. The figure rolls its shoulders, picks up a fallen branch like it's a blade it's held before, and falls in beside your squad.",
        effects: [{ unit: "random-common" }, { flag: "freed_the_chained" }],
      },
      {
        label: "Free it. Send it on its way.",
        result: "It nods once, presses something into your palm - \"for the road\" - and walks off toward the corruption, not away from it.",
        effects: [{ relic: "random" }],
      },
      {
        label: "Leave it chained. You can't know.",
        result: "\"No,\" it agrees, quietly. \"You can't.\" You're most of a mile down the path before you stop hearing it.",
        effects: [{ essence: 30 }, { flag: "left_the_chained" }],
      },
    ],
  },
  {
    id: "veil-fragment",
    act: 3,
    title: "A Fragment of the Veil",
    body: "A shard of something hangs in the air at head height, turning slowly, throwing no shadow. It isn't glass and it isn't ice. Looking at it too long makes the back of your skull ache. It is very clearly not from this forest, or this anything.",
    choices: [
      {
        label: "Take it.",
        result: "It weighs nothing and it weighs everything. Your squad will carry its hum into the next fight - louder, sharper, harder to hold onto.",
        effects: [{ relic: "random" }, { squadNextBattle: [{ type: "applyBuff", id: "strength", amount: 2 }, { type: "applyBuff", id: "vulnerable", amount: 1 }] }],
      },
      {
        label: "Shatter it.",
        result: "It breaks with a sound like a held breath let go. The ache stops. The forest, for a hundred paces in every direction, seems to exhale with you.",
        effects: [{ flag: "broke_a_fragment" }, { essence: 40 }],
      },
    ],
  },
  {
    id: "the-crownless-vision",
    act: 4,
    title: "The Crownless",
    body: "For one step, the forest is gone. You're standing in a hall with no ceiling, and a figure with a hollow where its crown should be turns to look at you - not with anger. With recognition. \"You've come a long way to lose,\" it says, almost kind. Then you're back on the path, and your hands won't stop shaking.",
    choices: [
      {
        label: "\"I didn't come to lose.\"",
        result: "You say it out loud, to the trees. Nothing answers. But your squad hears the steel in it, and stands a little straighter.",
        effects: [{ flag: "faced_the_crownless" }, { squadNextBattle: [{ type: "applyBuff", id: "strength", amount: 1 }, { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 1 } }] }],
      },
      {
        label: "Say nothing. Keep walking.",
        result: "You put one foot in front of the other until the shaking stops. That's a kind of answer too.",
        effects: [{ flag: "faced_the_crownless" }],
      },
    ],
  },
  {
    id: "mushroom-ring",
    title: "The Mushroom Ring",
    body: "A perfect circle of pale mushrooms, wide enough to stand in. Old stories say a great many contradictory things about what happens if you do. The mushrooms give off a faint, not-unpleasant light.",
    choices: [
      {
        label: "Step inside and wait.",
        result: "Nothing happens for a long moment. Then, all at once, you're on the far side of a ravine you'd have spent an hour going around, and there's grit in your boots that isn't from here.",
        effects: [{ essence: 45 }, { flag: "used_the_ring" }],
      },
      {
        label: "Eat one.",
        result: "It tastes of nothing at all. Your squad spends the next fight seeing the world half a beat early - useful, disorienting, gone by the fight after.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "evade", amount: 1 }] }],
      },
      {
        label: "Step around it. Firmly.",
        result: "You've heard enough stories.",
        effects: [],
      },
    ],
  },
  {
    id: "the-weeping-stone",
    title: "The Weeping Stone",
    body: "A boulder the size of a cottage, and water runs down its face in a steady sheet though there's no spring above it and no rain in a week. Where the water pools at the base, the ground is the greenest you've seen since you entered the forest.",
    choices: [
      {
        label: "Fill your waterskins.",
        result: "The water is clean and very cold and settles something in your chest you hadn't noticed was unsettled.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "regen", amount: 2 }] }],
      },
      {
        label: "Dig at the base for the source.",
        result: "A hand's depth down your fingers close on something hard and worked. You don't find where the water comes from. You stop looking once you're holding the thing.",
        effects: [{ item: "random" }, { essence: -15 }],
      },
      {
        label: "Let the stone weep in peace.",
        result: "Some things are just sad. You leave it be.",
        effects: [],
      },
    ],
  },
  {
    id: "the-gambler",
    title: "The Gambler at the Crossing",
    body: "A thin man with too many teeth has set up a folding table where three paths meet, three carved cups on it, and a smooth black seed under one of them. \"One coin to play,\" he says. \"Guess right, walk away rich. Guess wrong - well. You'll have paid for the lesson.\"",
    choices: [
      {
        label: "Play. Bet big.",
        result: "You slap down a fistful of coin and point at the middle cup. He lifts it. The seed is there - or it is now, anyway. He counts your winnings out with a smile that doesn't reach the rest of his face.",
        effects: [{ essence: 120 }],
      },
      {
        label: "Play. Bet small.",
        result: "You put down a single coin and point. Wrong cup. He shrugs, sweeps the coin away, and is already resetting the cups before you've turned to go.",
        effects: [{ essence: -30 }],
      },
      {
        label: "Don't play. Ask who he is.",
        result: "\"Nobody at all,\" he says, delighted, \"which is the only safe thing to be out here. You're learning.\" He flicks a coin at you as you leave, for no reason he'll give.",
        effects: [{ essence: 20 }, { flag: "met_the_gambler" }],
      },
    ],
  },
  {
    id: "the-old-battleground",
    title: "The Old Battleground",
    body: "The trees here grow crooked around things half-buried in the leaf mould - a shield gone to lace with rust, a helm with moss in the eye slits, the long pale curve of something you decide is a branch. Nobody won here. It was a long time ago.",
    choices: [
      {
        label: "Scavenge the field.",
        result: "Most of it is ruined past use. One piece isn't - it comes up out of the earth almost clean, as if it had been waiting.",
        effects: [{ item: "random" }, { flag: "scavenged_the_field" }],
      },
      {
        label: "Take an hour to bury what you can.",
        result: "Your squad works in silence. It costs you daylight and it costs you strength you'll want later, but the forest goes still around you in a way that feels, for once, like gratitude.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "vulnerable", amount: 1 }] }, { relic: "random" }],
      },
      {
        label: "Pass through without stopping.",
        result: "You don't look down more than you have to.",
        effects: [],
      },
    ],
  },
  {
    id: "the-listening-grove",
    act: 2,
    title: "The Listening Grove",
    body: "A dozen young trees stand in a loose ring, and every one of them has leaned in slightly, as if toward a speaker at the centre. There's nothing at the centre. When you stop walking, the leaves go still all at once, like held breath.",
    choices: [
      {
        label: "Speak to them.",
        result: "You say your name, and where you're going, and why. The trees don't move. But somewhere ahead of you on the path, for the rest of the day, things that might have gone badly simply don't.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "ward", amount: 1 }] }, { flag: "spoke_to_the_grove" }],
      },
      {
        label: "Listen with them.",
        result: "You stand in the ring and strain to hear what they hear. Right at the edge of it, under everything - a voice. One word, over and over. You leave before you can make it out, and you're glad you did.",
        effects: [{ flag: "heard_the_grove_voice" }, { essence: 30 }],
      },
      {
        label: "Leave the grove to its listening.",
        result: "You step back out of the ring. The leaves start moving again the moment you do.",
        effects: [],
      },
    ],
  },
]

// Deterministic pick for an event-node position: prefer an event whose
// `act` matches the current Act and that hasn't been seen this run;
// fall back to any unseen event; last resort, allow a repeat. Seeded by
// the node position so the same run always shows the same event at the
// same place (important for the save/restore invariant), but different
// positions vary.
export function pickEvent(nodeIndex, act, seenIds = []) {
  const seen = new Set(seenIds)
  const unseen = EVENTS.filter((e) => !seen.has(e.id))
  const pool = unseen.length ? unseen : EVENTS
  const actMatch = pool.filter((e) => e.act === act)
  const candidates = actMatch.length ? actMatch : pool.filter((e) => e.act == null)
  const final = candidates.length ? candidates : pool
  return final[nodeIndex % final.length]
}
