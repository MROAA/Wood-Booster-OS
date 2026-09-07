// Hearthwood - the traveling merchant. Marc: "kehitetään pelin
// kauppasysteemiä" -> "kauppa tuntuu samalta joka kerta" -> "kiertävä
// kauppias hahmona". The shop (SquadDraft.jsx) is mechanically rich but
// silent - the same stall ~40+ times a run. This gives it a face and a
// hand-written line that shifts with the Act you're in, the forest's
// state, and what your squad is built around, tying the market into the
// story spine the intro / endings / Crownless already sit on.
//
// The story bible (docs/hearthwood-story-acts.md) already names a
// distinct shopkeeper per Act - Forest Trader / Heartwood Artisan /
// Veil Trader / Hollow Merchant / Echo Market - and writes the Hollow
// Merchant's line verbatim ("Everything here has a price. None of the
// prices are Essence."). This is that voice, transcribed and extended.
//
// Pure data + pure selectors. `dominantTribe` (crownless.js) already
// keys the Crownless's opening line by tribe - same idea here. Both it
// and actIndexForNode/RUN_PATH come from modules that never import back
// here, so no cycle (same one-directional shape crownless.js uses).

import { dominantTribe } from "./crownless"
import { actIndexForNode, RUN_PATH } from "../../services/heartwood/runEngine"

// Per-Act persona. `accent` tints both the name and the portrait glyph
// (CardGlyph uses currentColor). One `glyph` for all five for now -
// per-Act doodle portraits are a later art pass (placeholder-first).
// Every line pool is an ARRAY, picked by nodeIndex % length, so a
// mono-tribe player revisiting an Act's shop 8-10x doesn't hear one
// identical line. `byTribe` only carries the elemental identities the
// Crownless line speaks to; warden/fang/root/spirit and an empty board
// fall through to `generic` (same fallthrough CROWNLESS_INTRO_BY_TRIBE
// uses).
export const MERCHANTS = {
  1: {
    name: "The Forest Trader",
    accent: "var(--hw-moss)",
    glyph: "merchantGlyph",
    generic: [
      "Sit. Trade. The path's no shorter for standing on it.",
      "Everything on this cloth was carried out of the deep wood. Some of it wanted to stay.",
      "You look like a long road. I sell for long roads.",
      "Coin left in the purse breeds, they say. Mine never does. Yours might.",
    ],
    byForest: {
      purified: ["Clean air today. The wood's grateful - and generous. Look twice at the cheap stock."],
      corrupted: [
        "The rot's in the bark now. I'd take the shield before the sword, if it were me.",
        "The trees have stopped muttering. That's worse. Buy quick.",
      ],
    },
    byTribe: {
      wood: [
        "You travel with green things. Good - they'll tell you what I won't.",
        "Growers. The soil likes you. Stay that way.",
      ],
      grove: [
        "You travel with green things. Good - they'll tell you what I won't.",
        "Growers. The soil likes you. Stay that way.",
      ],
      ember: ["Fire-blooded company. Keep them fed, or keep them far from my stall."],
      tide: ["Water-walkers. You'll want the lighter loads - nothing that rusts."],
      stone: ["You lean on the heavy ones. Here - heavy things, fair prices."],
      cosmic: ["Star-touched, this lot. The wood doesn't trust them. I'll take your Essence anyway."],
      shadow: ["You keep quiet friends. I won't ask. I never ask."],
    },
  },

  2: {
    name: "The Heartwood Artisan",
    accent: "var(--hw-ember)",
    glyph: "merchantGlyph",
    generic: [
      "Every piece here was made, not found. Made means it can be made better.",
      "The Warden lets me set up this close to the heart. Don't make me regret vouching for you.",
      "Handle the stock gently. Some of it's still setting.",
      "A full purse is a tool like any other. Doesn't do much sitting in the drawer.",
    ],
    byForest: {
      purified: ["The crack's knitting. When the heart's calm my hands are steady - everything's a little finer today."],
      corrupted: ["There's a split running the length of the core. I'm selling what I can before it reaches the shelves."],
    },
    byTribe: {
      wood: ["Growers. The heart likes you - rarer than it sounds."],
      grove: ["Growers. The heart likes you - rarer than it sounds."],
      ember: ["You've picked the Ember side. Bold. The forge-stock's yours to pick over first."],
      tide: ["Tide-sworn. The flowing pieces are behind me - mind the ones that leak."],
      stone: ["Stone-sworn. Nothing I sell you will break before you do."],
      cosmic: ["You've been listening to the star-choir. Careful what you build with a head full of that."],
      shadow: ["Quiet allies and a quiet buyer. We'll get along."],
    },
  },

  3: {
    name: "The Veil Trader",
    accent: "#9b8cff",
    glyph: "merchantGlyph",
    generic: [
      "Prices here shift when you look away. Decide fast.",
      "I've had this stall in four places today. The Veil moves it; I stand where it lands.",
      "Don't count your change. It won't help.",
      "Hoard it if you like. Essence keeps better than most things out here - for now.",
    ],
    byForest: {
      purified: ["The Veil's holding its shape for once. Buy now - clarity doesn't keep."],
      corrupted: ["Something's leaking through. Take the wards. Take all the wards."],
    },
    byTribe: {
      wood: ["Roots, this deep? They don't grow here. What you brought is all you'll get."],
      grove: ["Roots, this deep? They don't grow here. What you brought is all you'll get."],
      ember: ["Fire still burns past the Veil - one of the few things that does. Stock up."],
      tide: ["The water out here flows uphill. Your tide-folk won't like it. Arm them anyway."],
      stone: ["Solid things are worth double past the border. I'll still sell. Barely."],
      cosmic: ["Ah. You've touched the Echo. Then you know some of these prices are memories."],
      shadow: ["You walk with shadow and you came to the Veil. Very ready, or very lost."],
    },
  },

  4: {
    name: "The Hollow Merchant",
    accent: "#6b6480",
    glyph: "merchantGlyph",
    generic: [
      "Everything here has a price. None of the prices are Essence.",
      "I don't remember opening this stall. I don't remember closing it. Browse.",
      "You can put it back. It won't be there when you look again, but you can put it back.",
      "You've been saving. The Hollow noticed. It always notices the ones who save.",
    ],
    byForest: {
      purified: ["You've kept something alive down here. The stall's almost warm. Almost."],
      corrupted: ["There's nothing left to corrupt. That's why it's quiet. Take what you like."],
    },
    byTribe: {
      wood: ["Green things, in the Hollow. They shouldn't last. Neither should you. And yet."],
      grove: ["Green things, in the Hollow. They shouldn't last. Neither should you. And yet."],
      ember: ["Your fires are the only light on this road. I'd sell them cheaper if I could feel cold."],
      tide: ["The Hollow doesn't drown. It just stops. Your tide-folk have never met a thing like it."],
      stone: ["You brought walls to a place with nothing to keep out. I respect the habit."],
      cosmic: ["You've carried the Echo all this way. The King's stall and yours have the same supplier now."],
      shadow: ["Shadow-sworn, at the end of the road. Home stretch. Tell it I said nothing."],
    },
  },

  5: {
    name: "The Echo Market",
    accent: "#bcd4e6",
    glyph: "merchantGlyph",
    generic: [
      "We are what the market left behind. We still know how to make a deal.",
      "You don't pay us. You just remember us. It's enough.",
      "Last stall on the last road. Take your time.",
      "Whatever you saved for - this is it. There's no later to keep it for.",
    ],
    byForest: {
      purified: ["It's healing. We can feel it from here. Take something that lasts."],
      corrupted: ["You let the void in. We're the void's shopkeepers. Fair's fair."],
    },
    byTribe: {
      wood: ["You'll rebuild it green. We kept a few seeds. They're yours."],
      grove: ["You'll rebuild it green. We kept a few seeds. They're yours."],
      ember: ["You'll give it a fiercer shape. Here - kindling for the new forest."],
      tide: ["You'll let it flow somewhere new. We saved you a current."],
      stone: ["You'll set it in stone. We have just the stone."],
      cosmic: ["You'll leave the door open. We understand - we came through it too."],
      shadow: ["You already know how this ends. Buy something anyway. For old times."],
    },
  },
}

export function merchantForAct(act) {
  return MERCHANTS[Math.min(5, Math.max(1, act || 1))]
}

// Deterministic in nodeIndex (same run always shows the same line at the
// same shop - the save/restore convention events.js / arenas.js follow).
// Priority: a non-restless forest is a rare, deliberate Act-crossroads
// consequence, so surface it; otherwise the squad's build identity is
// the everyday voice; otherwise a rotating generic line.
export function merchantLine(runState) {
  const act = actIndexForNode(runState.nodeIndex || 0, RUN_PATH.length)
  const m = merchantForAct(act)
  const fs = runState.forestState || "restless"
  const tribe = dominantTribe(runState)
  const pool =
    (fs !== "restless" && m.byForest[fs]) ||
    (tribe && m.byTribe[tribe]) ||
    m.generic
  return pool[(runState.nodeIndex || 0) % pool.length]
}
