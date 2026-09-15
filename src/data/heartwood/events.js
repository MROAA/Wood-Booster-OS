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
// `requiresFlag` / `forbidsFlag` (optional storyFlag names): a follow-up
// event only becomes available once an earlier choice set the flag it
// requires, or is hidden once a flag it forbids is set - this is how a
// choice in one event pays off (or comes back to bite you) in a later
// one. pickEvent is handed runState.storyFlags to enforce it.
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
//   { boon: "id" } / { bane: "id" } - gain a permanent Run Modifier
//                               (boons.js): a NAMED consequence that
//                               re-applies its effects at the start of
//                               EVERY remaining battle (not one, like
//                               squadNextBattle), some also carrying an
//                               Essence-per-win %. `boon`/`bane` are the
//                               same channel; the modifier def's `kind`
//                               says which. Ignored if already held.
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
        result: "You set a coin in the bowl and bow your head. Something in the woods goes quiet, then lets you pass. Your squad walks the road ahead a little lighter, and keeps walking that way.",
        effects: [{ essence: -25 }, { boon: "veil-lucid" }],
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
        result: "Your fingers close on a smooth cold thing and pull it free. The tree groans. Whatever it was, it's yours now - and so is the chill that came with it, and the sense of being watched from somewhere deep.",
        effects: [{ relic: "random" }, { bane: "hollow-marked" }],
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
        result: "\"You're the first honest thing I've met out here in a week,\" she says, and tells you where a fighter is holed up who owes her a favour - and puts the word out that you're worth dealing straight with.",
        effects: [{ unit: "random-common" }, { boon: "forager-friend" }],
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
        result: "\"Hit hard, hit first, don't let a fight go long.\" He tightens a strap on your pack, and presses a pinch of something that smells of struck flint into your palm. \"The longer you're out here, the more it learns you.\"",
        effects: [{ boon: "emberfed" }],
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
        result: "The water is colder than ice and tastes of iron and old rain. For a moment you see the forest the way it was - green all the way down. Then it's gone, and you feel steadier for having seen it - and stay that way.",
        effects: [{ boon: "rootblessed" }, { essence: -20 }],
      },
      {
        label: "Look closer at the reflection.",
        result: "You lean out over the water. The other face leans back. Its mouth moves - a word you can't hear - and then it's just you again, and you're holding something you didn't have before, and hearing a faint hum you can't stop hearing.",
        effects: [{ relic: "random" }, { bane: "veil-touched" }],
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
        result: "It takes a long, ugly while, and the root bleeds a sap that smells of rot, and every other growing thing nearby leans away from you afterward. You're through, and you kept your coin - but the forest keeps a ledger, and you're in it now.",
        effects: [{ bane: "root-debt" }, { flag: "cut_the_toll_root" }],
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
        result: "It tastes of nothing at all. From then on your squad sees the world half a beat early - useful, disorienting, and it doesn't wear off.",
        effects: [{ boon: "windfavoured" }],
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
        result: "The water is clean and very cold and settles something in your chest you hadn't noticed was unsettled. Your squad drinks it for days after - it heals, and it dulls, both at once.",
        effects: [{ bane: "sap-heavy" }],
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
        result: "Your squad works in silence, and something in the ground settles as they do. The forest goes still around you in a way that feels, for once, like gratitude - and your squad carries a little of that steadiness from here on.",
        effects: [{ boon: "stoneblood" }, { relic: "random" }],
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
        result: "You say your name, and where you're going, and why. The trees don't move. But from here on, somewhere ahead of you on the path, things that might have gone badly simply don't, quite.",
        effects: [{ boon: "grove-warded" }, { flag: "spoke_to_the_grove" }],
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

  // --- Act I ----------------------------------------------------------
  {
    id: "the-first-milestone",
    act: 1,
    title: "The First Milestone",
    body: "A stone the height of a child stands beside the path, older than the trees around it. Names are cut into it - hundreds, in a dozen hands, going back further than the letters you know. Every one has a small mark scratched through it.",
    choices: [
      {
        label: "Add your own name.",
        result: "You cut it in below the last. It feels like a promise, or a dare. Either way, the road ahead is yours to walk now, and your squad walks it with you like they mean it.",
        effects: [{ boon: "milestone-oath" }],
      },
      {
        label: "Scratch through a name, the old custom.",
        result: "You draw your blade across a name at random, the way the others did. Somewhere a debt is settled that was never yours. A weight you didn't know you carried lifts.",
        effects: [{ essence: 35 }, { flag: "kept_the_custom" }],
      },
      {
        label: "Leave the stone alone.",
        result: "It isn't yours to write on yet.",
        effects: [],
      },
    ],
  },
  {
    id: "the-snare-line",
    act: 1,
    title: "The Snare Line",
    body: "The path runs through a stretch where every third tree has a rope-and-branch snare rigged in it, all sprung, all empty, all old. Someone hunted here hard, once, and then stopped. One snare still holds a scrap of bright cloth.",
    choices: [
      {
        label: "Re-set a snare, take the cloth.",
        result: "The cloth is good wool, dyed with something that hasn't faded. You tie it to your pack. You'll be back this way, maybe, and a set snare feeds whoever finds it.",
        effects: [{ item: "random" }],
      },
      {
        label: "Cut every line down.",
        result: "It takes an hour and it costs you daylight, but nothing living will strangle in the dark here now. Your squad works the tired stretch after in a grim, decent silence.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "weak", amount: 1 }] }, { essence: 25 }, { flag: "cleared_the_snares" }],
      },
    ],
  },

  // --- Act III ------------------------------------------------------
  {
    id: "the-veil-researcher",
    act: 3,
    title: "The Researcher",
    body: "A man in the burned remains of a scholar's coat is sitting with his back to a tree, notebooks spread around him in the mud, most of the pages blank. \"I was on the expedition,\" he says, without looking up. \"We opened it. We thought we were opening a door. I can tell you what's on the other side, if you're sure you want to carry that.\"",
    choices: [
      {
        label: "\"Tell me.\"",
        result: "He talks for a long time. Most of it you can't hold onto - it slides off the mind like water off glass. But one shape stays: a figure that was a person once, and chose not to be. You walk on knowing more, and lighter for none of it.",
        effects: [{ flag: "knows_the_veil" }, { relic: "random" }],
      },
      {
        label: "\"Come with us. You shouldn't be alone out here.\"",
        result: "He shakes his head, but he stands, and he picks up a broken branch, and he walks a little behind your squad from then on. He isn't much of a fighter. He's another set of eyes.",
        effects: [{ unit: "random-common" }],
      },
      {
        label: "Leave him to his notebooks.",
        result: "\"Yes,\" he agrees. \"That's the sensible one.\" He's still writing when you lose sight of him.",
        effects: [{ essence: 30 }],
      },
    ],
  },
  {
    id: "the-name-spreads",
    act: 3,
    requiresFlag: "heard_the_name",
    title: "The Name Spreads",
    body: "You've been saying it in your head since Spacemonkey told you - Hollow King, Hollow King - and now the forest is saying it back. Not in words. In the way the corruption leans toward you at every turn now, like it's finally noticed you noticing it.",
    choices: [
      {
        label: "Say it out loud, right here, and mean it.",
        result: "\"Hollow King.\" The word lands flat and cold. For a heartbeat every corrupted thing in earshot goes rigid - and then comes for you, all at once, harder than before. You've stopped flinching from it. But it's in your head now, and it doesn't leave.",
        effects: [{ bane: "name-burden" }, { flag: "named_it_aloud" }],
      },
      {
        label: "Stop thinking the name. Push it down.",
        result: "You spend the next mile counting your steps, naming trees, anything else. Slowly the forest loses interest again. Whatever the name is, it's a door that opens both ways.",
        effects: [{ essence: 40 }],
      },
    ],
  },
  {
    id: "the-sealed-tree-again",
    act: 3,
    requiresFlag: "sealed_hollow_tree",
    title: "The Tree You Sealed",
    body: "You know this oak. You patched its black wound with bark and clay a long way back, in another Act, and told yourself you'd done something. The patch has held. Around it, in a clean circle ten paces wide, the forest is green - actually green - for the first time since you came in.",
    choices: [
      {
        label: "Rest a while in the green circle.",
        result: "Your squad sits in real grass under real leaves and, for as long as it lasts, remembers what they're fighting to get back. They stand up steadier than they sat down.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "regen", amount: 3 }, { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 1 } }] }],
      },
      {
        label: "Reinforce the seal while it holds.",
        result: "You pack fresh clay over the old, thicker this time. The green circle widens by a pace as you work. It's slow. It's almost nothing. It's not nothing.",
        effects: [{ essence: -20 }, { flag: "reinforced_the_seal" }, { relic: "random" }],
      },
    ],
  },

  // --- Act IV -------------------------------------------------------
  {
    id: "the-throne-road",
    act: 4,
    title: "The Throne Road",
    body: "The path has become a road - flagstones under the leaf mould, straight where a game trail would wander, running arrow-true toward something ahead you can't see yet. It was built. By hands. For a king to ride down. The trees along it are all dead and none have fallen.",
    choices: [
      {
        label: "Walk it at a march, like you belong.",
        result: "Your squad falls into step without being told. Whatever's at the end of this road, you'll meet it standing tall and moving fast, not creeping up on it like prey.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "strength", amount: 1 }, { type: "applyBuff", id: "evade", amount: 1 }] }],
      },
      {
        label: "Leave the road. Push through the dead trees alongside it.",
        result: "It's slower and it's ugly going and you arrive scratched and tired - but you arrive from an angle nothing built this road expecting. Sometimes that's the whole game.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "weak", amount: 1 }] }, { flag: "left_the_throne_road" }, { essence: 50 }],
      },
    ],
  },
  {
    id: "the-chained-ally-speaks",
    act: 4,
    requiresFlag: "freed_the_chained",
    title: "The One You Freed",
    body: "The figure you cut out of the ivy a long way back has been quiet since it joined you. Tonight, on the Throne Road, it finally speaks. \"I knew him,\" it says. \"Before. When he still had a face he'd let you see. He isn't going to fight you like a monster. He's going to fight you like someone who's already grieved for you.\"",
    choices: [
      {
        label: "\"Then how do I beat him?\"",
        result: "\"You don't out-hate him. You can't - he's got a head start of a hundred years. You out-last him. You make it cost more than he's willing to pay.\" It's not much. It's a plan.",
        effects: [{ flag: "knows_how_to_fight_him" }, { squadNextBattle: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] }],
      },
      {
        label: "\"Why are you telling me this now?\"",
        result: "\"Because after tomorrow one of us won't be able to.\" It doesn't say which. It picks up its branch-blade and checks the edge, the way you'd check a tool you meant to use.",
        effects: [{ flag: "the_ally_knows" }, { relic: "random" }],
      },
    ],
  },

  // --- Act V (The Crownless) -------------------------------------
  {
    id: "the-crownless-court",
    act: 5,
    title: "The Empty Court",
    body: "A clearing that used to be a hall. Stone benches in rows, a raised dais, a chair. All of it grown through with the black rot, all of it arranged for an audience that left in a hurry and never came back. The chair on the dais is the only thing the rot won't touch.",
    choices: [
      {
        label: "Sit in the chair.",
        result: "It's cold in a way that has nothing to do with temperature. For as long as you sit there you can feel every corrupted thing in the whole forest, like nerves. You stand up before it feels normal. It was starting to.",
        effects: [{ flag: "sat_the_throne" }, { squadNextBattle: [{ type: "applyBuff", id: "strength", amount: 2 }, { type: "applyBuff", id: "vulnerable", amount: 1 }] }],
      },
      {
        label: "Break the chair.",
        result: "It takes your whole squad and most of an hour and it fights back the entire time, but it goes down in the end, splinters and cold air. The rot creeps in over the bare dais almost gratefully.",
        effects: [{ flag: "broke_the_throne" }, { essence: 45 }, { relic: "random" }],
      },
      {
        label: "Address the empty benches.",
        result: "You tell the missing court what you've come to do. Nothing answers. But saying it in that place, out loud, to those empty seats, makes it real in a way it hadn't quite been.",
        effects: [{ flag: "spoke_to_the_court" }],
      },
    ],
  },
  {
    id: "the-grieving-guardian",
    act: 5,
    title: "The Grieving Guardian",
    body: "A shape the size of a house sits in the path with its back to you, not moving, one of the old forest guardians gone to moss and stillness. It's holding something small and broken in both huge hands and it has clearly been holding it for a very long time.",
    choices: [
      {
        label: "Approach slowly. Let it see you.",
        result: "It turns its head, which takes a long time, and looks at you with two dim green lights. It doesn't attack. It just shifts, a few feet, to let you past - and goes back to its vigil. Something of its grief comes away with you, and stays: your squad fights a little heavier now, and guards itself a little closer.",
        effects: [{ bane: "grief-touched" }, { flag: "passed_the_guardian" }],
      },
      {
        label: "Leave an offering in its reach and go.",
        result: "You set a coin and a ration by its knee and move on quiet. You don't look back to see if it takes them. Some kindnesses are better not watched.",
        effects: [{ essence: -30 }, { relic: "random" }],
      },
    ],
  },

  // --- Act VI (The Echo Rift) -----------------------------------
  {
    id: "the-echo-of-yourself",
    act: 6,
    title: "An Echo of Yourself",
    body: "Coming around a bend you meet your own squad walking the other way - same faces, same gear, same tired set to the shoulders. The other you stops when you stop. Neither group reaches for a weapon. The air between you rings, very faintly, like a struck glass.",
    choices: [
      {
        label: "Walk toward it.",
        result: "You close the distance and it closes the distance and at the point where you should collide there's a cold ringing snap and then just forest, and you, carrying something the other you was carrying.",
        effects: [{ relic: "random" }, { squadNextBattle: [{ type: "applyBuff", id: "vulnerable", amount: 1 }] }],
      },
      {
        label: "Turn and take the other path.",
        result: "You break eye contact and go the long way. Behind you the ringing note holds for a moment and then stops, like a hand laid flat on the glass.",
        effects: [{ essence: 40 }, { flag: "avoided_the_echo" }],
      },
    ],
  },
  {
    id: "the-unmade-road",
    act: 6,
    title: "The Unmade Road",
    body: "The path ahead is coming apart. Not broken - unmade, the way a word stops meaning anything if you say it too many times. Flagstones fade mid-air. A tree flickers between three different trees. Your squad's footsteps land a half-beat before you take them.",
    choices: [
      {
        label: "Fix your eyes on the far side and run.",
        result: "You sprint through the flickering stretch with your squad in a tight knot, not looking down, not looking at the trees. You come out the other side intact and breathing hard, and don't talk about it.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "evade", amount: 1 }] }],
      },
      {
        label: "Stand still and let it settle around you.",
        result: "You wait. Slowly the road decides what it is. It costs you a long, strange hour where nothing quite holds - but on the far side of it you understand something about the shape of all this that you didn't before.",
        effects: [{ flag: "waited_out_the_unmaking" }, { relic: "random" }, { essence: -25 }],
      },
    ],
  },

  // --- Act VII (The Echo Verge) --------------------------------
  {
    id: "the-last-clean-water",
    act: 7,
    title: "The Last Clean Water",
    body: "A spring in a cup of bare rock, and it is the only thing this deep in that the rot has not reached - a hand's width of clear water, welling up slow, ringed by dead ground. It will not last. You can see the black creeping the last few inches toward its edge.",
    choices: [
      {
        label: "Everyone drinks. Fill every skin.",
        result: "Your whole squad kneels and drinks the last clean water in the Hearthwood, and stands up carrying it. Whatever comes next, they go into it with the taste of the real forest in their mouths.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "regen", amount: 3 }, { type: "applyBuff", id: "strength", amount: 1 }] }, { flag: "drank_the_last_water" }],
      },
      {
        label: "Dam the dead ground. Buy the spring another day.",
        result: "You pile stone and pack earth against the creeping black. It's a losing fight and you know it - but the spring is still clear when you leave, and it wasn't going to be. That's the whole job, really. That's the whole run.",
        effects: [{ essence: -40 }, { flag: "saved_the_spring" }, { relic: "random" }],
      },
    ],
  },
  {
    id: "the-quiet-before",
    act: 7,
    title: "The Quiet Before",
    body: "The corruption stops. Not thins - stops, at a clean line across the path, like a tide mark. Beyond it the forest is grey and still and perfectly silent, and somewhere in that silence is the thing you came all this way to end. Your squad checks its gear without being told.",
    choices: [
      {
        label: "Say something to your squad before you cross.",
        result: "You don't remember afterward exactly what you said. Something about the road behind, and the people on the milestone, and what green looks like. They heard it. They cross the line standing tall.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "strength", amount: 1 }, { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] }, { flag: "said_the_words" }],
      },
      {
        label: "Cross in silence. Everyone knows the job.",
        result: "No speech. You step over the tide mark and your squad steps with you and the grey forest swallows the sound of it. Some things don't need saying out loud. You've all read the milestone.",
        effects: [{ squadNextBattle: [{ type: "applyBuff", id: "execute", amount: 1 }] }, { flag: "crossed_in_silence" }],
      },
    ],
  },

  // --- Anywhere ---------------------------------------------------
  {
    id: "the-fungus-shrine",
    title: "The Fungus Shrine",
    body: "A hollow log packed with pale luminous fungus, arranged - definitely arranged - into the rough shape of a figure with too many arms. Small offerings are tucked into the gaps: a tooth, a button, a folded leaf. The fungus pulses faintly, in time with nothing.",
    choices: [
      {
        label: "Add an offering and ask for luck.",
        result: "You tuck a coin into the fungus and say the old words your grandmother used. The light pulses once, harder, like a nod. You feel faintly ridiculous and slightly braver.",
        effects: [{ essence: -20 }, { squadNextBattle: [{ type: "applyBuff", id: "evade", amount: 1 }] }],
      },
      {
        label: "Harvest the fungus. It's worth good coin dried.",
        result: "You strip the log clean. The offerings spill out into your palm - the tooth, the button, the leaf, and three coins some other traveller left. The figure-shape is gone. You try not to think about it.",
        effects: [{ essence: 55 }, { flag: "robbed_the_shrine" }],
      },
      {
        label: "Leave the little god alone.",
        result: "Whatever it is, it was here first.",
        effects: [],
      },
    ],
  },
  {
    id: "the-two-wounded",
    title: "Two Wounded Travellers",
    body: "Two people, propped against opposite sides of the same tree, both hurt, both watching you and each other. \"He did this,\" says one. \"She's lying,\" says the other, tiredly, like they've been at it a while. \"We can't both walk. One of us is coming with you or neither of us sees morning.\"",
    choices: [
      {
        label: "Help the one who spoke first.",
        result: "You get an arm under them and they lean on you gratefully. The other watches you go without a word. You'll never know which of them was telling the truth. Neither will you know it mattered.",
        effects: [{ unit: "random-common" }, { flag: "chose_the_first" }],
      },
      {
        label: "Help the other one.",
        result: "\"Figures,\" mutters the first, as you lift the second to their feet. The one you're carrying doesn't gloat, which is something. They're quiet and they can hold a blade. That's all you need out here.",
        effects: [{ unit: "random-common" }, { flag: "chose_the_second" }],
      },
      {
        label: "Splint them both, leave them both. It's the best you can do.",
        result: "You bind both sets of wounds, leave both a ration, and walk on with neither. It isn't a good answer. Out here there mostly aren't any.",
        effects: [{ essence: 30 }, { squadNextBattle: [{ type: "applyBuff", id: "regen", amount: 1 }] }],
      },
    ],
  },
  {
    id: "the-cache",
    title: "The Buried Cache",
    body: "A patch of ground where nothing grows in a neat rectangle, and it doesn't take long to work out why: something's buried here, packed tight enough to poison the roots. A wooden marker at one end has a symbol burned into it you half recognise from a shop-keeper's ledger, a long way back.",
    choices: [
      {
        label: "Dig it up.",
        result: "A strongbox, waxed against the wet, heavier than one person should carry. Inside: coin, a wrapped bundle, and a note that just says FOR WHOEVER MAKES IT. You make it. It's yours.",
        effects: [{ essence: 70 }, { item: "random" }],
      },
      {
        label: "Dig it up, take only what you can carry easily.",
        result: "You pocket the coin and the wrapped bundle and leave the rest, re-covering the box for the next one through. The note said whoever makes it. Might be more than one of you.",
        effects: [{ essence: 40 }, { relic: "random" }],
      },
      {
        label: "Leave it. Poisoned ground stays poisoned for a reason.",
        result: "You walk around the dead rectangle and don't look back. Some caches are baited.",
        effects: [],
      },
    ],
  },
]

// Deterministic pick for an event-node position: prefer an event whose
// `act` matches the current Act, that hasn't been seen this run, and
// whose flag gates are satisfied (requiresFlag set / forbidsFlag not
// set); fall back to any-Act unseen; last resort, allow a repeat.
// Seeded by the node position so the same run always shows the same
// event at the same place (the save/restore invariant), but different
// positions vary.
export function pickEvent(nodeIndex, act, seenIds = [], storyFlags = {}) {
  const seen = new Set(seenIds)
  const flagOk = (e) =>
    (!e.requiresFlag || storyFlags[e.requiresFlag]) && (!e.forbidsFlag || !storyFlags[e.forbidsFlag])
  const available = EVENTS.filter(flagOk)
  const unseen = available.filter((e) => !seen.has(e.id))
  const pool = unseen.length ? unseen : available.length ? available : EVENTS
  const actMatch = pool.filter((e) => e.act === act)
  const candidates = actMatch.length ? actMatch : pool.filter((e) => e.act == null)
  const final = candidates.length ? candidates : pool
  return final[nodeIndex % final.length]
}
