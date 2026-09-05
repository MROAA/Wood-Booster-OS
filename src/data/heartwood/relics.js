// Heartwood Trial - Relics: permanent, run-wide choices picked mid-run
// (see runEngine.js's "relic" node type), the first mechanic in the
// game that isn't "another unit" or "another enemy arrangement" - a
// real structural choice that reshapes the whole rest of a run, same
// role relics/artifacts play in Slay the Spire or Guildrun (the two
// games Marc named as inspiration for this pivot in the first place).
//
// `effects` apply once, to every deployed unit, at battle start - same
// applyEffects/self-targeting mechanism a unit's own `passive` and a
// Commander's `squadPassive` already use (see autoBattleEngine.js).
// `essenceBonus` is handled separately by runEngine.js's win payout,
// since it isn't a battle effect at all.
//
// `cost`: relics were free (pick one or skip) until Marc asked for
// them to cost Essence like everything else in the shop - now a real
// opportunity-cost decision (recruit more units this round, or bank
// for a relic) instead of a pure freebie. Priced at 3, the same as a
// rare unit, since a permanent run-wide effect is worth at least as
// much as the strongest single recruit.
// Essence rescale (units.js's TIER_COST carries the full explanation -
// Marc's "market level up = 250 Essence" ask, scaled 62.5x from every
// old constant): was 3, now 190 - the same rounded value as
// TIER_COST.rare, keeping "priced the same as a rare unit" literally
// true post-rescale instead of just true in spirit.
// Rarity pass (Marc: "tee itemeille, reliceille, ja hahmoille oma
// tier systeemi joka vaihtelee niiden harvinaisuudesta" - make a tier
// system for items, relics, and characters that varies by their
// rarity, then "harvinaiset on parempia" - rare ones are better): the
// flat 190-for-everyone price above stops being the whole story below
// - it's now RARE's price specifically, one of three (see
// RELIC_TIER_COST near the bottom of this file, right where `tier`
// itself is actually assigned per relic).
// Relic icon art (same kuvia-folder pass that already covered units and
// items - Marc, raising the bar mid-pass: "jokainen item ja unit ja
// relic etc niillä pitää olla kuva... vaikka vain placeholderi mut
// kaikella pitää olla kuva" - every relic gets a real image here, no
// exceptions, even if it's just the closest reasonable placeholder
// rather than a perfect thematic match. Same def.image-vs-glyph
// fallback ItemCard.jsx/UnitCard.jsx already established, wired into
// RelicChoice.jsx's pick screen and SquadDraft.jsx's owned-relics
// badge - relics render in both places, so both needed the branch.
import emberCoreImg from "../../assets/heartwood/relics/ember-core.jpg"
import mosswardenCharmImg from "../../assets/heartwood/relics/mosswarden-charm.jpg"
import brambleWardImg from "../../assets/heartwood/relics/bramble-ward.jpg"
import sunderingMarkImg from "../../assets/heartwood/relics/sundering-mark.jpg"
import essenceWellImg from "../../assets/heartwood/relics/essence-well.jpg"
import bulwarkStandardImg from "../../assets/heartwood/relics/bulwark-standard.jpg"
import vampiricBloomImg from "../../assets/heartwood/relics/vampiric-bloom.jpg"
import cullingStrikeImg from "../../assets/heartwood/relics/culling-strike.jpg"
import aegisWardImg from "../../assets/heartwood/relics/aegis-ward.jpg"
import venomousEdgeImg from "../../assets/heartwood/relics/venomous-edge.jpg"
import frostbrandImg from "../../assets/heartwood/relics/frostbrand.jpg"
import artificersLedgerImg from "../../assets/heartwood/relics/artificers-ledger.jpg"
import purifyingBloomImg from "../../assets/heartwood/relics/purifying-bloom.jpg"
import barkWardImg from "../../assets/heartwood/relics/bark-ward.jpg"
import berserkersOathImg from "../../assets/heartwood/relics/berserkers-oath.jpg"
import quarrybreakImg from "../../assets/heartwood/relics/quarrybreak.jpg"
import wardensBastionImg from "../../assets/heartwood/relics/wardens-bastion.jpg"
import fangsMarkImg from "../../assets/heartwood/relics/fangs-mark.jpg"
import rootboundCurseImg from "../../assets/heartwood/relics/rootbound-curse.jpg"
import grovesBlessingImg from "../../assets/heartwood/relics/groves-blessing.jpg"
import spiritsVeilImg from "../../assets/heartwood/relics/spirits-veil.jpg"
import thornsWrathImg from "../../assets/heartwood/relics/thorns-wrath.jpg"
import heartsbloomSeedImg from "../../assets/heartwood/relics/heartsbloom-seed.jpg"
import rootbreakSigilImg from "../../assets/heartwood/relics/rootbreak-sigil.jpg"
import cascadingWoundImg from "../../assets/heartwood/relics/cascading-wound.jpg"
import mycoticBloomImg from "../../assets/heartwood/relics/mycotic-bloom.jpg"
import witherspiteCrownImg from "../../assets/heartwood/relics/witherspite-crown.jpg"
import quarryVanguardImg from "../../assets/heartwood/relics/quarry-vanguard.jpg"
import recklessOathImg from "../../assets/heartwood/relics/reckless-oath.jpg"
import sanctuaryVowImg from "../../assets/heartwood/relics/sanctuary-vow.jpg"
import ashclawStandardImg from "../../assets/heartwood/relics/ashclaw-standard.jpg"
import cripplebiteStandardImg from "../../assets/heartwood/relics/cripplebite-standard.jpg"
import bramblehideBannerImg from "../../assets/heartwood/relics/bramblehide-banner.jpg"
import thornfenStandardImg from "../../assets/heartwood/relics/thornfen-standard.jpg"
import huntclawStandardImg from "../../assets/heartwood/relics/huntclaw-standard.jpg"

// A relic node only shows up 3 times a run (vs. a shop's unlimited
// visits), so unlike the shop's rising reroll cost, a flat price is
// enough of a rate limit on its own - a second way to spend Essence,
// per Marc's "more mechanics and ways to spend currency" ask, without
// needing its own escalation curve.
// Essence rescale: was 2, now 125 (units.js's TIER_COST comment).
// Rounded to the 50/100/150/200 family (Marc, round numbers).
export const RELIC_REROLL_COST = 100

export const RELICS = {
  "ember-core": {
    id: "ember-core",
    image: emberCoreImg,
    name: "Ember Core",
    icon: "flame",
    description: "Every unit strikes a little harder, all fight, every fight.",
    effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  "mosswarden-charm": {
    id: "mosswarden-charm",
    image: mosswardenCharmImg,
    name: "Mosswarden's Charm",
    icon: "leaf",
    description: "Every unit mends a little at the start of each round.",
    // Two real bugs caught via testing before shipping, not guessed
    // at: first pass was a one-time battle-start heal, useless since
    // units always start every fight at full HP already (confirmed via
    // an engine-level check showing "heal 0" in the log). Second pass
    // swapped to a one-time battle-start Block grant - also useless,
    // since resolveRound() resets ALL player Block to 0 at the top of
    // every round, including round 1, before the enemy ever attacks
    // (confirmed via a second engine-level check: the granted Block
    // never blocked anything). A turnStart addTrigger is the only
    // shape that survives that reset - same mechanism Aatos's and
    // Repo's Commander passives already rely on, which is exactly why
    // both of those already worked and this needed the same fix.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
  },
  "bramble-ward": {
    id: "bramble-ward",
    image: brambleWardImg,
    name: "Bramble Ward",
    icon: "root",
    description: "Whatever strikes your squad gets struck back.",
    // The relic that introduces onHit/retaliation (effects.js's
    // dealDamage) to the game - a mechanic that didn't exist before
    // this relic system. Every deployed unit gets an onHit trigger
    // that deals flat damage back to whoever just hit them, as long
    // as the hit actually landed (not fully blocked).
    effects: [{ type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 3 } }],
  },
  "sundering-mark": {
    id: "sundering-mark",
    image: sunderingMarkImg,
    name: "Sundering Mark",
    icon: "rune",
    description: "Whatever your squad strikes takes deeper wounds after.",
    // Bramble Ward's mirror: introduces onDealDamage (effects.js's
    // dealDamage) and Vulnerable (+25% damage taken, the defensive
    // opposite of Weak) together. Every deployed unit's own hits mark
    // their target Vulnerable - stacks, so a focused target keeps
    // taking worse hits the longer it's attacked, same escalating
    // shape Poison gives the enemy side of the roster.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 },
      },
    ],
  },
  "essence-well": {
    id: "essence-well",
    image: essenceWellImg,
    name: "Essence Well",
    icon: "spark",
    description: "Every victory is a little more rewarding.",
    effects: [],
    // Essence rescale (units.js's TIER_COST comment has the full
    // explanation): was 1, now 65 (the "1-family") - this is a real
    // per-win Essence payout (runEngine.js's essenceForWin reduces
    // every owned relic's essenceBonus into the win total), not a
    // battle effect, so it scales the same as WIN_ESSENCE itself.
    // Rounded to the 50/100/150/200 family (Marc, round numbers).
    essenceBonus: 50,
  },
  "bulwark-standard": {
    id: "bulwark-standard",
    image: bulwarkStandardImg,
    name: "Bulwark Standard",
    icon: "shield",
    description: "Whoever stands sturdiest in your formation draws every eye.",
    // Taunt (autoBattleEngine.js) was engine-only until Stoneheart's
    // passive granted it directly - this is the second source, and the
    // first that isn't tied to one specific unit: rather than the
    // uniform "every deployed unit" loop every other relic's `effects`
    // use, this is handled as its own special case in
    // startAutoBattle (same precedent as essenceBonus above, which
    // also isn't a plain battle effect) - Taunt goes to whichever
    // deployed unit has the highest maxHp, so any tank you happen to
    // field becomes the squad's designated target, not just Stoneheart.
    effects: [],
    tauntHighestHp: true,
  },
  "vampiric-bloom": {
    id: "vampiric-bloom",
    image: vampiricBloomImg,
    name: "Vampiric Bloom",
    icon: "leaf",
    description: "Every strike your squad lands mends the one who struck it.",
    // Lifesteal - a genuinely new mechanic (not another number on an
    // existing stat), reusing onDealDamage (Sundering Mark's hook)
    // instead of adding new engine machinery: a flat self-heal per hit
    // landed, same "deterministic, not a %, not a dice roll" shape
    // every other trigger effect in the game already uses (Marc: "easy
    // to play but hard to master" - a fixed, readable number rewards
    // deliberate squad-building, not luck). Especially strong on a
    // pattern-attacker (Rook's Charge/Bishop's Slash/Knight's Leap),
    // since applyPatternDamage fires dealDamage - and therefore this
    // trigger - once per target hit, not once per turn.
    effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 2 } }],
  },
  "culling-strike": {
    id: "culling-strike",
    image: cullingStrikeImg,
    name: "Culling Strike",
    icon: "sword",
    description: "Your squad finishes a badly wounded enemy faster.",
    // Execute (effects.js's dealDamage) - a flat bonus that only
    // applies once the target is already at or below 30% max HP,
    // rewarding a squad built to finish off a wounded target instead
    // of spreading damage across several. Applies via the same
    // uniform per-unit `effects` loop every other non-special relic
    // uses (Ember Core's Strength grant, e.g.) - a plain applyBuff,
    // nothing new needed in startAutoBattle for this one.
    effects: [{ type: "applyBuff", id: "execute", amount: 3 }],
  },
  "aegis-ward": {
    id: "aegis-ward",
    image: aegisWardImg,
    name: "Aegis Ward",
    icon: "shield",
    description: "Every unit shrugs off the first real hit it takes, once.",
    // Ward's second source, alongside Thornguard's own passive - same
    // uniform per-unit effects loop as Ember Core/Culling Strike,
    // nothing special-cased needed since Ward only reads
    // powers.ward wherever it came from.
    effects: [{ type: "applyBuff", id: "ward", amount: 1 }],
  },
  "venomous-edge": {
    id: "venomous-edge",
    image: venomousEdgeImg,
    name: "Venomous Edge",
    icon: "leaf",
    description: "Whatever your squad strikes carries poison after.",
    // Poison's second player-accessible source, alongside Rootfang's
    // own movePattern debuff - same onDealDamage shape Sundering Mark
    // already uses for Vulnerable, just applying Poison instead. Real
    // synergy with Haste (Swiftclaw): twice the hits per round means
    // twice the onDealDamage triggers, so this relic stacks Poison
    // noticeably faster on a Haste-built squad than a normal one.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "poison", target: "target", amount: 2 },
      },
    ],
  },
  "frostbrand": {
    id: "frostbrand",
    image: frostbrandImg,
    name: "Frostbrand",
    icon: "moonGlyph",
    description: "Whatever your squad strikes hits softer after, in return.",
    // Weak's first onDealDamage-trigger source - a third relic through
    // the same door Sundering Mark (Vulnerable) and Venomous Edge
    // (Poison) already opened, just weakening the enemy's OWN future
    // damage output instead of marking it to take more or poisoning
    // it. A defensive-leaning pick: every landed hit makes whatever
    // you hit swing softer later, not just take more punishment.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 },
      },
    ],
  },
  "artificers-ledger": {
    id: "artificers-ledger",
    image: artificersLedgerImg,
    name: "Artificer's Ledger",
    icon: "rune",
    description: "Every unit carries one more piece of gear.",
    // Deliberately deferred out of the round that shipped Items
    // (items.js) - this needed ITEM_SLOTS to stop being a flat
    // constant and become relic-conditional everywhere it's read
    // (runEngine.js's equipItem slot-range check, SquadDraft.jsx's
    // slot-pip rendering), a real scope increase over "just another
    // relic." Not a uniform per-unit `effects` push like every other
    // relic here - handled as its own special case (same precedent as
    // Bulwark Standard's tauntHighestHp/Essence Well's essenceBonus,
    // neither of which are plain battle effects either), read via
    // runEngine.js's effectiveItemSlots(runState).
    effects: [],
    itemSlotBonus: 1,
  },
  "purifying-bloom": {
    id: "purifying-bloom",
    image: purifyingBloomImg,
    name: "Purifying Bloom",
    icon: "leaf",
    description: "Every unit shakes off a lingering ailment at the start of each round.",
    // Cleanse's (effects.js) first squad-wide source - Willowmend
    // carries it as a unit passive already, this is the relic version
    // every other mechanic in the roster eventually got (Ward, Poison,
    // Execute, Weak all have both a relic and a unit/item source by
    // now). A one-time battle-start grant would be a no-op (units
    // start every fight with nothing to cleanse) - same lesson
    // Mosswarden's Charm already taught this session - so this is a
    // turnStart addTrigger instead, same repeating mechanism that
    // relic already established.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } }],
  },
  "bark-ward": {
    id: "bark-ward",
    image: barkWardImg,
    name: "Bark Ward",
    icon: "shield",
    description: "Every unit grows a little bark at the start of each round.",
    // Block's first repeating relic source - every existing Block
    // source so far was either a unit's own movePattern step (reset
    // every round like any other Block) or a one-time passive
    // (The Emperor). Same turnStart addTrigger shape Mosswarden's
    // Charm/Purifying Bloom already use, just granting Block instead
    // of heal/cleanse.
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
  },
  "berserkers-oath": {
    id: "berserkers-oath",
    image: berserkersOathImg,
    name: "Berserker's Oath",
    icon: "flame",
    description: "Every unit fights harder once it's badly hurt.",
    // Wounded Fury (effects.js's woundedFuryBonus) - previously only
    // reachable via Fenrir's own squadPassive or baked into
    // Thornwarden's kit, never as a run-wide pick any Commander could
    // take. Plain applyBuff - the power is just a flag checked against
    // the unit's own current HP each hit, no new engine work needed.
    effects: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
  },
  "quarrybreak": {
    id: "quarrybreak",
    image: quarrybreakImg,
    name: "Quarrybreak",
    icon: "sword",
    description: "Every unit strikes deeper against a target that's still braced.",
    // Shatter's (effects.js's shatterBonus) first squad-wide source -
    // Stoneknoll carries it as a unit passive already, this is the
    // relic version every mechanic in the roster eventually gets.
    // Plain applyBuff - the power is just a flag checked against the
    // target's current Block each hit, no new engine work needed.
    effects: [{ type: "applyBuff", id: "shatter", amount: 3 }],
  },

  // Tribe-anchor relics (synergies.js) - Marc: "i like the idea of
  // having tribes in the game" - every relic above applies uniformly
  // to the whole squad; these 6 instead target only units of ONE
  // specific tribe (`tribeAnchor`, read by autoBattleEngine.js's relic
  // loop the same way `essenceBonus`/`tauntHighestHp`/`itemSlotBonus`
  // are already special-cased there), a real Battlegrounds/TFT-style
  // reward for actually committing to a tribe rather than a flat
  // squad-wide bonus everyone gets regardless of composition. Priced
  // and rarity-tagged identically to every other relic, but each
  // grants a noticeably BIGGER per-unit effect than the squad-wide
  // equivalent (e.g. Thorn's Wrath's +3 Strength vs. Ember Core's +1)
  // since it only ever reaches a fraction of the squad - narrower
  // should feel stronger, not just different.
  "wardens-bastion": {
    id: "wardens-bastion",
    image: wardensBastionImg,
    name: "Warden's Bastion",
    icon: "shield",
    description: "Every Warden in your squad grows a lot of bark at the start of each round.",
    tribeAnchor: "warden",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 5 } }],
  },
  "fangs-mark": {
    id: "fangs-mark",
    image: fangsMarkImg,
    name: "Fang's Mark",
    icon: "sword",
    description: "Every Fang in your squad finishes a badly wounded enemy much faster.",
    tribeAnchor: "fang",
    effects: [{ type: "applyBuff", id: "execute", amount: 4 }],
  },
  "rootbound-curse": {
    id: "rootbound-curse",
    image: rootboundCurseImg,
    name: "Rootbound Curse",
    icon: "root",
    description: "Whatever a Root in your squad strikes carries a heavy poison after.",
    tribeAnchor: "root",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 3 } },
    ],
  },
  "groves-blessing": {
    id: "groves-blessing",
    image: grovesBlessingImg,
    name: "Grove's Blessing",
    icon: "leaf",
    description: "Every Grove in your squad mends generously at the start of each round.",
    tribeAnchor: "grove",
    effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 4 } }],
  },
  "spirits-veil": {
    id: "spirits-veil",
    image: spiritsVeilImg,
    name: "Spirit's Veil",
    icon: "moonGlyph",
    description: "Every Spirit in your squad shrugs off two real hits before either lands.",
    tribeAnchor: "spirit",
    effects: [{ type: "applyBuff", id: "ward", amount: 2 }],
  },
  "thorns-wrath": {
    id: "thorns-wrath",
    image: thornsWrathImg,
    name: "Thorn's Wrath",
    icon: "flame",
    description: "Every Thorn in your squad strikes considerably harder, all fight.",
    tribeAnchor: "thorn",
    effects: [{ type: "applyBuff", id: "strength", amount: 3 }],
  },
  // Elemental tribe anchors (synergies.js's elemental tribes). Same
  // "narrower reach, bigger per-unit effect" doctrine as the 6
  // mechanical anchors above. Placeholder art for now - the closest
  // existing relic image - see each `image:` line; TODO real art.
  "tides-embrace": {
    id: "tides-embrace",
    image: frostbrandImg, // TODO: own art
    name: "Tide's Embrace",
    icon: "tide",
    description: "Every Tide in your squad knits itself back together each round, and its hits leave the enemy striking weakly.",
    tribeAnchor: "tide",
    effects: [
      { type: "applyBuff", id: "regen", amount: 3 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "dampen", target: "target", amount: 1 } },
    ],
  },
  "galeforce-banner": {
    id: "galeforce-banner",
    image: huntclawStandardImg, // TODO: own art
    name: "Galeforce Banner",
    icon: "gale",
    description: "Every Gale in your squad slips aside from the first two hits that would land on it.",
    tribeAnchor: "gale",
    effects: [{ type: "applyBuff", id: "evade", amount: 2 }],
  },
  "bastion-of-stone": {
    id: "bastion-of-stone",
    image: bulwarkStandardImg, // TODO: own art
    name: "Bastion of Stone",
    icon: "stone",
    description: "Every Stone in your squad carries heavy permanent armour that turns aside part of every hit, all fight.",
    tribeAnchor: "stone",
    effects: [{ type: "applyBuff", id: "bulwark", amount: 3 }],
  },
  "shroud-of-shadow": {
    id: "shroud-of-shadow",
    image: witherspiteCrownImg, // TODO: own art
    name: "Shroud of Shadow",
    icon: "shadow",
    description: "Every Shadow in your squad finishes a wounded enemy far faster, and its hits carry a heavy poison.",
    tribeAnchor: "shadow",
    effects: [
      { type: "applyBuff", id: "execute", amount: 4 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 2 } },
    ],
  },
  "heartsbloom-seed": {
    id: "heartsbloom-seed",
    image: heartsbloomSeedImg,
    name: "Heartsbloom Seed",
    icon: "heart",
    description: "Every unit knits itself back together over the fight's first few rounds.",
    // Regen (effects.js's tickRegen) - a decaying heal-over-time stack,
    // Poison's mirror, granted squad-wide at battle start via the same
    // applyBuff every other stat relic already uses. Front-loaded and
    // bounded (fades after a few rounds, same as Poison) rather than a
    // forever-sustain - Mosswarden's Charm already owns that space.
    effects: [{ type: "applyBuff", id: "regen", amount: 3 }],
  },
  "rootbreak-sigil": {
    id: "rootbreak-sigil",
    image: rootbreakSigilImg,
    name: "Rootbreak Sigil",
    icon: "root",
    description: "Whatever your squad strikes loses its own strongest edge.",
    // Sunder's first RELIC source - Sundermaw Fang (items.js) puts it
    // on one chosen unit's attacks; this puts it on EVERY deployed
    // unit's, the same squad-wide upgrade Bramble Ward already is to
    // Thorned Bracer. A real, repeatable answer to the difficulty
    // round's self-buffed threats (Ironmaw, Stonewake, Deepwarden) -
    // every hit from every unit chips away at whatever they're
    // leaning on, not just Thornwisp/Ashcaller's own dedicated turns.
    effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "sunder", target: "target" } }],
  },
  "cascading-wound": {
    id: "cascading-wound",
    image: cascadingWoundImg,
    name: "Cascading Wound",
    icon: "sword",
    description: "Whatever your squad finishes off, it strikes again at someone else.",
    // Chain's first RELIC source - Cascading Claw (items.js) puts it
    // on one chosen unit; this puts it on the whole squad, same
    // squad-wide upgrade every mechanic's relic version already is to
    // its item counterpart. Safe as a relic (unlike Stun's own
    // deliberately-withheld relic version) because Chain only ever
    // fires on an actual killing blow, not every hit - it can't chain-
    // lock a single enemy the way a squad-wide Stun proc could.
    effects: [{ type: "applyBuff", id: "chainDamage", amount: 4 }],
  },
  "mycotic-bloom": {
    id: "mycotic-bloom",
    image: mycoticBloomImg,
    name: "Mycotic Bloom",
    icon: "leaf",
    description: "Whatever your squad poisons, it poisons someone standing nearby too.",
    // Spore Spread's first RELIC source - Fungal Spore Sac (items.js)
    // puts it on one chosen unit; this puts it on the whole squad.
    // Deliberately narrow in practice (only matters for a unit that
    // already applies Poison - Rootfang/Hexmother/Mycelist), same
    // "genuinely situational, not a trap pick" spirit tribe-anchor
    // relics already have - a squad built around 2+ poison-appliers
    // gets real value, one without any gets none.
    effects: [{ type: "applyBuff", id: "sporeSpread", amount: 1 }],
  },
  "witherspite-crown": {
    id: "witherspite-crown",
    image: witherspiteCrownImg,
    name: "Witherspite Crown",
    icon: "root",
    description: "Whatever your squad strikes carries both rot and weariness after.",
    // A fresh double-debuff combo (Poison + Weak) squad-wide - the same
    // pairing this round's own new mook, Hollowspite, uses, given to
    // the player instead. No existing relic combined these two on the
    // same hit before - Venomous Edge/Rootbound Curse only ever grant
    // Poison alone, Frostbrand only Weak alone.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 },
      },
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 },
      },
    ],
  },
  "quarry-vanguard": {
    id: "quarry-vanguard",
    image: quarryVanguardImg,
    name: "Quarry Vanguard",
    icon: "sword",
    description: "Every unit hits harder, and hardest of all against a target still braced.",
    // Strength + Shatter together, squad-wide - the same dual-mechanic
    // pairing Quarrystrike Gauntlet (items.js) just established, spread
    // across the whole squad instead of one chosen unit. Both stack
    // numerically with any existing Strength/Shatter sources (Ember
    // Core, Quarrybreak) rather than being redundant with them.
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "applyBuff", id: "shatter", amount: 1 },
    ],
  },
  "reckless-oath": {
    id: "reckless-oath",
    image: recklessOathImg,
    name: "Reckless Oath",
    icon: "sword",
    description: "Every unit finishes a badly wounded enemy faster, and shrugs off the first real hit while it hunts.",
    // Execute + Ward together, squad-wide - the same "glass cannon
    // insurance" pairing Reckless Vow (items.js) just established,
    // spread across the whole squad. Both stack numerically with any
    // existing Execute/Ward sources rather than being redundant.
    effects: [
      { type: "applyBuff", id: "execute", amount: 2 },
      { type: "applyBuff", id: "ward", amount: 1 },
    ],
  },
  "sanctuary-vow": {
    id: "sanctuary-vow",
    image: sanctuaryVowImg,
    name: "Sanctuary Vow",
    icon: "heart",
    description: "Every unit shrugs off the first real hit it takes, and mends over the fight's first few rounds.",
    // Regen + Ward together, squad-wide - the same pure survivability
    // pairing Bulwark's Mercy (items.js) just established, spread
    // across the whole squad instead of one chosen unit.
    effects: [
      { type: "applyBuff", id: "ward", amount: 1 },
      { type: "applyBuff", id: "regen", amount: 2 },
    ],
  },
  "ashclaw-standard": {
    id: "ashclaw-standard",
    image: ashclawStandardImg,
    name: "Ashclaw Standard",
    icon: "sword",
    description: "Every unit strikes a little harder, and whatever it strikes loses its own strongest edge.",
    // Strength + Sunder together, squad-wide - the same aggressive
    // anti-buff pairing Ashclaw Fang (items.js) just established,
    // spread across the whole squad instead of one chosen unit.
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "sunder", target: "target" } },
    ],
  },
  "cripplebite-standard": {
    id: "cripplebite-standard",
    image: cripplebiteStandardImg,
    name: "Cripplebite Standard",
    icon: "sword",
    description: "Whatever your squad strikes hits softer after, and takes worse hits in return.",
    // Weak + Vulnerable together, squad-wide - the same last-unpaired
    // combo Cripplebite Fang (items.js) just established, spread
    // across every deployed unit's own hits instead of one chosen
    // unit's. Same "hits both sides of the damage formula" identity:
    // whatever the squad focuses down deals less and takes more, a
    // pure target-neutralizing pick rather than a race-the-clock DOT.
    effects: [
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 },
      },
      {
        type: "addTrigger",
        trigger: "onDealDamage",
        effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 },
      },
    ],
  },

  // Build-diversity round (Marc: "the game needs to be more diverse to
  // play") - squad-wide mirrors for the same 4 new items.js entries,
  // same pattern every prior dual-mechanic combo already follows
  // (Quarrystrike Gauntlet <-> Quarry Vanguard, Ashclaw Fang <->
  // Ashclaw Standard, etc).
  "bramblehide-banner": {
    id: "bramblehide-banner",
    image: bramblehideBannerImg,
    name: "Bramblehide Banner",
    icon: "shield",
    description: "Every unit draws every eye, and fights harder the deeper its own wounds go.",
    // Taunt + Wounded Fury, squad-wide - the missing relic mirror for
    // items.js's existing bramblehide-standard item (an asymmetric gap:
    // every other dual-mechanic item already had a relic counterpart).
    effects: [
      { type: "applyBuff", id: "taunt", amount: 1 },
      { type: "applyBuff", id: "woundedFury", amount: 1 },
    ],
  },
  "thornfen-standard": {
    id: "thornfen-standard",
    image: thornfenStandardImg,
    name: "Thornfen Standard",
    icon: "flame",
    description: "Every unit strikes a little harder, and mends off every hit it lands.",
    // Strength + Lifesteal, squad-wide - the relic mirror for items.js's
    // new thornfen-fang. Both stack numerically with any existing
    // Strength/Lifesteal sources (Ember Core, Vampiric Bloom) rather
    // than being redundant with them.
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 1 } },
    ],
  },
  "huntclaw-standard": {
    id: "huntclaw-standard",
    image: huntclawStandardImg,
    name: "Huntclaw Standard",
    icon: "sword",
    description: "Every unit finishes a badly wounded enemy faster, and strikes again at someone else when it does.",
    // Execute + Chain, squad-wide - the relic mirror for items.js's new
    // huntclaw-fang.
    effects: [
      { type: "applyBuff", id: "execute", amount: 2 },
      { type: "applyBuff", id: "chainDamage", amount: 3 },
    ],
  },
}

// Rarity (Marc: "tehdään harvinaisuus systeemi peliin ja siihen
// liittyville" - make a rarity system for the game and related
// things), then, once relics/items/Commanders all had the concept:
// "harvinaiset on parempia" (rare ones are better) - every relic was
// forced to "rare" right here regardless of its own actual power, a
// real bug flagged earlier (RELIC_COST was flat 190 for all of them
// too, so "rare" carried no weight at all: literally every relic was
// priced and labeled identically, "rare" meaning nothing). Reclassified
// below by actual mechanical strength, reusing the exact common/
// uncommon/rare vocabulary and 65/125/190 cost family units.js's own
// tierFromCost/TIER_COST already established for the unit roster
// (see that file's own 62.5x-rescale comment for where those three
// numbers come from) - RELIC_COST(190) was the one anchor point this
// pass was told to keep, so it stays exactly as-is, just demoted from
// "the only price" to "rare's price."
//
// The dividing line isn't "does it have a cool effect" (every relic
// here does) - it's whether that effect is GUARANTEED every fight or
// only PAYS OFF once some condition is met, the same distinction this
// very roster's own characters.js sibling already draws in plain
// language for Wounded Fury/Shatter/Chain ("a purely conditional bonus
// underperforms a guaranteed flat one," proven twice over there across
// real fairness passes, not asserted):
//
//   COMMON - the effect only fires reactively (an onHit/onDealDamage
//   trigger needs a hit landed or taken first) or only pays off past a
//   threshold: Execute's 30% HP floor, Wounded Fury's 50% HP floor,
//   Shatter's "target already blocked/warded" gate, Chain's
//   killing-blow-only gate, Spore Spread's "only matters if something
//   else in the squad is already applying Poison." Real value, but
//   conditional, same shape as those Commander mechanics.
//
//   UNCOMMON - one mechanic, unconditionally active every fight: a
//   flat applyBuff grant at battle start, or a turnStart trigger that
//   fires every single round no matter what happens in the fight -
//   every single-mechanic relic that doesn't carry one of the COMMON
//   gates above. Tribe-anchor relics land here too: unconditional for
//   whichever units qualify, the tribe-commitment itself is the
//   "cost" being paid, not a per-hit RNG gate on top.
//
//   RARE - two mechanics stacked into one relic (a genuine 2-for-1
//   over any single-mechanic pick above, even when both halves are
//   individually conditional - e.g. Witherspite Crown's Poison+Weak
//   both need a landed hit, but landing ONE hit now buys both), or a
//   pure compounding-value utility relic with zero downside and no
//   gate at all (Essence Well's per-win Essence, Artificer's Ledger's
//   extra item slot on every unit) - both scale with the whole rest of
//   the run, not just one fight.
const RELIC_TIER_COST = { common: 100, uncommon: 150, rare: 200 }

// Conditional/reactive single-mechanic relics (see COMMON's definition
// above) - the roster's weakest-per-pick tier, priced to match.
const COMMON_RELICS = [
  "bramble-ward", "sundering-mark", "vampiric-bloom", "culling-strike",
  "venomous-edge", "frostbrand", "purifying-bloom", "berserkers-oath",
  "quarrybreak", "fangs-mark", "rootbound-curse", "rootbreak-sigil",
  "cascading-wound", "mycotic-bloom",
]
// Unconditional single-mechanic relics, including every tribe-anchor
// (see UNCOMMON's definition above) - the middle tier.
const UNCOMMON_RELICS = [
  "ember-core", "mosswarden-charm", "bulwark-standard", "aegis-ward",
  "bark-ward", "wardens-bastion", "groves-blessing", "spirits-veil",
  "thorns-wrath", "heartsbloom-seed",
  // Elemental tribe anchors - priced with the other anchors (150), even
  // the two-mechanic ones: they only ever reach a fraction of the squad.
  "tides-embrace", "galeforce-banner", "bastion-of-stone", "shroud-of-shadow",
]
// Everything NOT listed above (every dual-mechanic combo from
// quarry-vanguard down, plus essence-well/artificers-ledger/
// witherspite-crown) is RARE by default, rather than a third explicit
// list - a new relic added later without being sorted into one of the
// two lists above still gets a real tier assigned instead of silently
// falling through untagged, and RARE is the correct place for anything
// this pass didn't already have a specific conditional/single-mechanic
// reason to demote.
// Rounded to the 50/100/150/200 family (Marc, round numbers).
for (const [id, relic] of Object.entries(RELICS)) {
  relic.tier = COMMON_RELICS.includes(id) ? "common" : UNCOMMON_RELICS.includes(id) ? "uncommon" : "rare"
  relic.cost = RELIC_TIER_COST[relic.tier]
}

export function relicPool() {
  return Object.values(RELICS)
}
