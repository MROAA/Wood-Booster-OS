// Heartwood Trial - the run layer for the autobattler. Pure functions
// only, same pattern as the rest of this engine. Drives the fixed path
// (shop -> formation -> auto-battle, repeated, ending on the Spacemonkey
// boss) and owns the player's bench/deployment/Essence/fusion - none of
// which autoBattleEngine.js knows or cares about; it only ever sees a
// plain list of deployed unit ids.
//
// Bench entries are `{ key, defId }`, not bare unit ids: fusion removes
// and adds bench entries (three copies -> one Tier 2 copy), which would
// silently corrupt a plain array-index-based deploy scheme the moment
// it spliced. `deployed` stores those stable keys instead, so a slot
// still points at the right unit (or clears itself) no matter how the
// bench array reshuffles underneath it.

import { UNITS, TIER2_SUFFIX, upgradeCost } from "../../data/heartwood/units"
import { branchAvailable, branchById, ECONOMY_WIN_BONUS } from "../../data/heartwood/upgrades"
import { RELICS, relicPool, RELIC_REROLL_COST } from "../../data/heartwood/relics"
import { ITEMS, ITEM_SLOTS, itemPool } from "../../data/heartwood/items"
import { CHARACTERS, commanderRankCost } from "../../data/heartwood/characters"
import { tribesOf } from "../../data/heartwood/synergies"
import { resolveTrial } from "../../data/heartwood/trials"
import { ENEMIES, actEnemyForNode } from "../../data/heartwood/enemies"
import { FORMATIONS } from "../../data/heartwood/formations"
import { pickEvent } from "../../data/heartwood/events"
import { runModifierById, expandRunModifierEffects, runModifierWinPct } from "../../data/heartwood/boons"
import { evolutionReady } from "../../data/heartwood/evolutions"
import { crossroadsForAct } from "../../data/heartwood/crossroads"
import { arenaForNode, arenaById } from "../../data/heartwood/arenas"
import { applyMetaPerks } from "../../data/heartwood/metaPerks"
import { depthModifiersFor } from "../../data/heartwood/depths"
import { streamRng } from "../../data/heartwood/seed"
import { economyCrew, economyCrewEffects } from "../../data/heartwood/economy"
import { startAutoBattle, resolveRound, autoResolveBattle } from "./autoBattleEngine"

// RAMP_CAP - the difficulty ramp's TOTAL enemy-scaling budget: enemies
// end a run scaled to roughly 1 + RAMP_CAP of their base stats (+75%
// today). This one constant is the game's single "how hard is it"
// knob - there is deliberately no difficulty menu. It is consumed in
// THREE places that MUST move together:
//   1. difficultyFactorForNode() below - the trailing `* RAMP_CAP`
//      that turns a 0..1 run-progress into the actual enemy multiplier.
//   2. autoBattleEngine.js's scaleEnemyHpToSquadDps() - which divides
//      `(difficultyFactor - 1)` by this same number to read back "how
//      far into the ramp is this fight" for its DPS-adaptive layer.
//      It imports RAMP_CAP from here; hard-coding a second copy there
//      would silently max that layer out early the moment this moves.
//   3. START_ESSENCE (below) is now a formula of it too - see there.
// Raising this is the intended way to make the whole game harder.
export const RAMP_CAP = 0.75

// enemies.js's 7 mooks are used both solo and recombined into
// formations.js's 6 multi-piece encounters - "Mist Growler Pack" and
// "The Undertow" (no shielding - real swarms), "Bark Brute's Stand",
// "Twin Watch" and "Siren's Bodyguard" (shielding puzzles - now that
// shielding actually does something, see the frontmost()/
// randomLiving() fix in autoBattleEngine.js) sit between the existing
// solo fights so a run escalates from solo -> solo -> swarm -> solo ->
// solo -> poison solo -> single shield puzzle -> Siren shield puzzle ->
// second swarm -> double shield puzzle -> full escort -> boss. Three
// "relic" nodes (relics.js) are spaced through the run - a real
// structural choice mechanic, not just more units/enemies, added after
// Marc said the game still felt "boring and simple" despite several
// content rounds: volume alone wasn't the gap, a genuine new layer was.
// Exported now that it doubles as the run's fixed SHAPE reference
// (RunEndOverlay.jsx's own totalFights count needs the whole run's
// fight-type count, not just how far a given run got - see
// advanceToNextNode's comment above for why the type/position
// sequence here stays authoritative even though a battle SLOT's exact
// enemyId content is now decided at play-time, not fixed here).
// `beat` (optional, per node): one short pre-battle line, shown on the
// FormationScreen in place of the encounter's generic description and
// intended for the run map / hover cards too (via nodeNarrative in
// runNarrative.js). Only a handful of nodes carry one so far - the rest
// fall back cleanly to the enemy/formation description. Marc authors the
// remaining beats (and the per-Act story text) in the content pass; see
// docs/hearthwood-story-acts.md. The three below are samples proving the
// pipeline renders end to end (early / mid / late in the run).
export const RUN_PATH = [
  { type: "shop" },
  {
    type: "battle",
    formationId: "rotwood-husk-pair",
    beat: "The rot got here first. A husk and the sick sapling beside it, still standing guard over ground the forest already gave up on.",
  },
  { type: "shop" },
  { type: "battle", enemyId: "drowned-siren" },
  { type: "shop" },
  { type: "battle", enemyId: "mist-growler" },
  { type: "shop" },
  { type: "battle", formationId: "mist-growler-pack" },
  { type: "relic" },
  { type: "shop" },
  { type: "miniboss", enemyId: "deepwarden", trialId: "rootkeeper" },
  { type: "event" },
  {
    type: "battle",
    enemyId: "bark-brute",
    beat: "Bark grown thick as a door, and about as interested in talking. It has stood in this gap so long the path bends around it.",
  },
  { type: "shop" },
  { type: "battle", enemyId: "moss-troll" },
  { type: "shop" },
  { type: "battle", enemyId: "bloomrot-stalker" },
  { type: "shop" },
  { type: "battle", enemyId: "rootbind-thicket" },
  { type: "shop" },
  { type: "battle", enemyId: "witherfang" },
  { type: "event" },
  { type: "battle", enemyId: "thornspite" },
  { type: "shop" },
  { type: "elite", enemyId: "the-gorging-maw" }, // was: bramblehide
  { type: "shop" },
  { type: "battle", formationId: "the-pack" }, // feat/hearthwood-hunters (was: emberwracks-guard)
  { type: "shop" },
  { type: "battle", formationId: "the-blight" }, // feat/hearthwood-rot (was: embers-bulwark)
  { type: "shop" },
  { type: "battle", enemyId: "duskgnaw" },
  { type: "shop" },
  { type: "battle", enemyId: "cragfang" },
  { type: "shop" },
  { type: "battle", enemyId: "stormroot" },
  { type: "event" },
  { type: "battle", enemyId: "duskmoth" },
  { type: "shop" },
  { type: "battle", enemyId: "hollowfen" },
  { type: "shop" },
  { type: "battle", enemyId: "quillfang" },
  { type: "shop" },
  { type: "elite", enemyId: "the-iron-sentinel" }, // was: ironmaw
  { type: "shop" },
  { type: "battle", enemyId: "gravemaw" },
  { type: "shop" },
  { type: "miniboss", enemyId: "thornmaw", trialId: "heartwood-warden" },
  { type: "shop" },
  { type: "battle", enemyId: "duskhollow" },
  { type: "event" },
  { type: "battle", enemyId: "needlefen" },
  { type: "shop" },
  { type: "battle", formationId: "the-communion" }, // feat/hearthwood-cult (was: the-wearing-down)
  { type: "shop" },
  { type: "battle", formationId: "the-brood" },
  { type: "shop" },
  { type: "battle", enemyId: "stonewake" },
  { type: "shop" },
  { type: "battle", enemyId: "gravequill" },
  { type: "shop" },
  { type: "battle", enemyId: "bonewarden" },
  { type: "shop" },
  { type: "elite", formationId: "the-ancient-grove" }, // feat/hearthwood-ancients (was: the-bramble-lash / mossveil)
  { type: "event" },
  { type: "battle", enemyId: "hollowspite" },
  { type: "shop" },
  { type: "battle", enemyId: "ashenmaw" },
  { type: "shop" },
  { type: "battle", enemyId: "duskwither" },
  { type: "shop" },
  { type: "battle", formationId: "the-run-down" }, // feat/hearthwood-hunters (was: hollowfangs-den)
  { type: "shop" },
  { type: "battle", enemyId: "rootward" },
  { type: "shop" },
  { type: "battle", enemyId: "briarmaw" },
  { type: "shop" },
  { type: "battle", enemyId: "bramblespite" },
  { type: "event" },
  { type: "battle", formationId: "the-tithe" }, // feat/hearthwood-collectors (was: thornfen)
  { type: "shop" },
  { type: "battle", enemyId: "hollowcurse" },
  { type: "shop" },
  { type: "elite", formationId: "the-elder-hollow" }, // feat/hearthwood-ancients (was: the-ashfall-herald / grimspite)
  { type: "shop" },
  { type: "battle", enemyId: "ironroot" },
  { type: "shop" },
  { type: "battle", formationId: "the-conclave" }, // feat/hearthwood-coven (was: bark-brutes-stand)
  { type: "shop" },
  { type: "battle", formationId: "the-bastion" },
  { type: "relic" },
  { type: "event" },
  { type: "battle", formationId: "the-teeming" },
  { type: "shop" },
  { type: "battle", formationId: "the-bulwark" },
  { type: "shop" },
  { type: "battle", formationId: "rune-wardens-escort" },
  { type: "relic" },
  { type: "shop" },
  { type: "battle", formationId: "the-festering" }, // feat/hearthwood-rot (was: quillfangs-warren)
  { type: "event" },
  { type: "battle", formationId: "the-choir" }, // feat/hearthwood-coven (was: bonewardens-watch)
  { type: "shop" },
  { type: "miniboss", enemyId: "wyrmgall", trialId: "veilbound" },
  { type: "shop" },
  { type: "battle", formationId: "the-hoard" }, // feat/hearthwood-collectors (was: the-hollow-court, beat dropped)
  { type: "event" },
  { type: "battle", formationId: "the-long-chant" }, // feat/hearthwood-cult (was: the-cursed-thicket)
  { type: "battle", formationId: "the-clutch" }, // feat/hearthwood-brood (was: the-unbroken-root)
  { type: "battle", formationId: "the-hatchery" }, // feat/hearthwood-brood (was: the-withering-pact)
  { type: "event" },
  { type: "boss", enemyId: "spacemonkey", trialId: "hollow-king" },
]

// Marc: "essenceä on liian vähän siinä pitää olla ekonomia" (there's
// too little Essence, there needs to be a real economy) - raised
// right after Items became an 8th thing to spend on (recruit/reroll,
// Upgrade, Commander Rank-Up, Relic Upgrade/Reroll, Reforge, Retrain,
// now Items), on top of an income rate that hadn't moved since the
// original shop/formation/auto-resolve pivot. Bumped both the starting
// stake and the per-win payout by 50% so a run has real room to spend
// across units, items, and relics without every purchase feeling like
// the last affordable one - same "just give more, don't rebalance
// every individual cost" lever already used once before for HP (see
// TIER_HP's own note in units.js) when the game felt too tight.
// Marc: "the game needs to feel like there is an opportunity cost to
// money spend" - with a now much-longer run (~39 fights) and a flat
// per-win income, Essence piled up fast enough by the run's second
// half that a player could just buy everything offered rather than
// choosing between it (confirmed by this session's own stress-test
// bots: a fully-engaged "greedy" bot routinely had bench sizes in the
// 40s-50s by the boss - buying nearly every shop offer it ever saw,
// not making trade-offs). Cut from 5/6 to 4/4 - a smaller number
// change than it looks, since it compounds across every one of ~39
// wins in a full run, not just the opening. This DOES partially
// reverse the earlier +50% bump the comment just above describes -
// that bump was a reaction
// to a much shorter run with far fewer sinks; today's run is roughly
// 3x longer with several new sinks (Market Level, Commander Active,
// tribe-anchor relics) layered on since, so the same flat income no
// longer produces the same felt scarcity.
// Essence rescale (Marc, direct: "haluan että marketin nouseminen
// maksaa 250 essenceä ja ekonomian pitää vastata sitä" - I want
// leveling the Market to cost 250 Essence and the economy needs to
// match that; "se vaikuttaa myös unitteihin jne" - it affects units
// too; "tee pelin ekonomia vastaamaan nappien hintaa" - make the
// game's economy match the buttons' prices). Marc's own Copilot
// concept-art plaques show a "Purchase 250" button and a "Quick Sale
// 150" button. Anchored the whole rescale on marketLevelCost(1) below
// (MARKET_LEVEL_BASE_COST(4) * level(1) = 4 pre-rescale), landing the
// scale factor at exactly 250/4 = 62.5x - applied uniformly to EVERY
// essence constant in the game (see units.js's TIER_COST comment for
// the full family table). START_ESSENCE and WIN_ESSENCE were both
// already 4 pre-rescale (same value as MARKET_LEVEL_BASE_COST), so all
// three land on the same clean 250 post-rescale - a run now starts
// with, and earns per win, exactly one Market Level-Up's worth of
// Essence, same relative weight as before.
//
// START_ESSENCE was tuned twice after that (450, then 200 - see PR
// #360/#362) and then SILENTLY REVERTED back to 250 by a mistake of
// my own in PR #363: rescuing that PR's stale-branch ancestry via a
// raw `git diff origin/development origin/<branch> -- src/` scoped
// too broadly (should have been scoped to just the item-art files),
// so the diff picked up this unrelated line reverting to whatever
// value the item-art branch's own stale base happened to have, and
// applying it silently undid #362 with no conflict to flag it. Caught
// only when Marc asked for a third explicit number and the file
// didn't match what either of us expected. Set directly to his
// explicit number this time, no arithmetic: "aseta alku essence
// määräksi 350" (set the starting Essence to 350).
// Round-economy pass (Marc, round numbers): recruit costs dropped to
// 50/100/150 while these stayed 350/250, which an n=100 fairness pass
// showed made the run ~17 points easier on average (test bot: ~20% ->
// ~37% win rate). Marc's call: cut income to compensate - start
// 350 -> 300, per-win 250 -> 200. Both stay in the 50-family.
//
// Start-Essence-from-ramp pass (Marc, direct: the game has NO
// difficulty menu and none is wanted - it's meant to be inherently
// hard - but "if I later make it harder, the opening shouldn't need
// re-tuning by hand"). START_ESSENCE is no longer a hand-set number:
// it's a formula of RAMP_CAP (the ramp's total enemy-scaling budget,
// see difficultyFactorForNode below - currently +75% by run's end).
//
// Shape: START_ESSENCE = roundTo50(OPENING_BASE * RAMP_CAP).
// Rationale - the enemy's growth budget across a whole run IS
// RAMP_CAP; the starting war-chest is the player's one-time
// counterweight to that budget, so it scales in direct proportion.
// Double the enemy's growth budget (a "twice as hard" knob) and the
// opening head-start doubles with it - the opening self-adjusts
// instead of needing a hand-set number every time difficulty moves.
// OPENING_BASE is the single calibration constant: its value is fixed
// so that at today's RAMP_CAP = 0.75 the formula lands EXACTLY on 300
// (400 * 0.75 = 300, no rounding needed) - i.e. this is
// behaviour-neutral until RAMP_CAP is actually changed.
//   RAMP_CAP 0.75 -> 400 * 0.75 = 300
//   RAMP_CAP 0.90 -> 400 * 0.90 = 360 -> roundTo50 -> 350
// NOTE (fairness harness, n=100, .scratch/heartwood-fairness-pass.mjs):
// the test-bot's opening is bimodal, not "narrow" - it loses fight 1
// (rotwood-husk-pair) ~40-50% of runs at ANY START_ESSENCE from 300
// up, then coasts fights 2-3 (~85% squad HP) if it survives. Raising
// START_ESSENCE past ~500 flips the whole opening to a walkover with
// no middle "narrow win with attrition" band. So this formula makes
// the opening lever TRACK difficulty automatically (proven: +90% cap
// -> 350 measurably eases fight 1 for 3 of 4 commanders), but the
// "won but narrowly" feel itself is gated by the fight 1-3 ENEMY
// tuning, not by the economy - that's a separate lever.
const OPENING_BASE = 400
const roundTo50 = (n) => Math.round(n / 50) * 50
const START_ESSENCE = roundTo50(OPENING_BASE * RAMP_CAP)
// WIN_ESSENCE stays FLAT (deliberately NOT coupled to RAMP_CAP): it's
// per-fight income that compounds across ~43 fights, so coupling it
// would swing the whole-run difficulty curve hard - exactly what the
// round-economy pass just calibrated and what this pass must leave
// intact. START_ESSENCE is a one-time opening lever with a negligible
// whole-run footprint; that's why it's the one that carries the
// coupling. If the whole-run curve ever needs to track RAMP_CAP too,
// that's a separate calibration lever, not this one.
const WIN_ESSENCE = 200
// Marc: "now it doesn't feel like anything purchasing the units or
// items" - the Essence RATE has already been tuned back and forth
// this session (bumped +50%, then cut 5/6->4/4 for "opportunity
// cost"), but a fresh stress-test run (heartwood-stress-test.mjs)
// showed the real, untouched root cause: with no bench limit at all,
// a fully-engaged bot ends a run with 36-47 owned units - every
// purchase was accumulating bench filler, never actually competing
// against anything already owned. TFT/Guildrun-standard autobattlers
// (Marc's own named reference) all cap the bench for exactly this
// reason - scarcity of SLOTS, not just of Essence, is what makes each
// individual recruit a real decision. Marc's own explicit number:
// "bench size 12 is too big, i want parties of 5 as max" - only 1
// slot beyond the 4 deployable ones, a genuinely tight economy where
// building toward a fusion means deliberately pulling a unit OUT of
// the active party to make room, a real trade-off rather than free
// hoarding space on the side. Buying a 3rd copy of an already-2-owned
// unit is exempt (recruitUnit below) since that purchase immediately
// fuses and nets the bench SMALLER, not bigger - it should never be
// blocked by the same cap it's about to shrink under.
//
// Marc, direct, after being asked to clarify his own "reservi ja bench
// on 2 erillistä asiaa minulle" (bench and reserve are 2 separate
// things to me): "bench" is the 4 units fighting alongside the
// Commander (this file's `deployed`); "reservi"/reserve is the
// non-fighting units held for later (recruited but not deployed) -
// specifically so duplicate copies can be collected toward Fusion
// without competing with the deployed squad's own slots. The old
// BENCH_CAP=5 total (4 deployed + only 1 free slot) left almost no
// room to actually hoard a duplicate while still fielding a full
// squad. Confirmed via AskUserQuestion: 6 reserve slots (not 10, not
// unlimited) - enough to collect 2 units' worth of fusion fodder at
// once without returning to the old "36-47 owned units" hoarding
// problem this cap was originally introduced to fix (see this
// constant's own history above). Total ownable units is now
// DEPLOY_SLOTS + RESERVE_CAP, not RESERVE_CAP alone - deployed units
// were always "owned" too, this just stops counting them against the
// reserve's own room.
export const RESERVE_CAP = 6
// Essence rescale (see START_ESSENCE's own comment above): was 2, now
// 125 (units.js's TIER_COST "2-family" - same value as an uncommon
// unit's recruit cost).
// Rounded to the 50/100/150/200 family (Marc, round numbers) - not in
// Marc's explicit table (an Essence reward, not a price); rounded
// 125->100 to match how his table rounds 125 elsewhere.
const FORMATION_BONUS_ESSENCE = 100
// Minibosses (Deepwarden, Thornmaw, Wyrmgall) are a harder win than even a
// formation fight - a bigger payout than FORMATION_BONUS_ESSENCE, same
// "reward matches difficulty" reasoning essenceForWin's own note gives.
// Essence rescale: was 3, now 190 (units.js's TIER_COST "3-family").
// Rounded to the 50/100/150/200 family (Marc, round numbers) - not in
// Marc's explicit table (an Essence reward, not a price); rounded
// 190->150 to match how his table rounds 190 elsewhere.
const MINIBOSS_BONUS_ESSENCE = 150
// Elites (feat/hearthwood-elites): a harder win than a formation, not
// as hard as a Trial miniboss - the reward sits between the two.
const ELITE_BONUS_ESSENCE = 120
// Market-scale-up pass (Marc, verbatim burst: "heartwood market ja your
// squad pitää olla ainakin tuplasti isommat" / "kortit on pieniä
// infopalasia jotka kertoo paljon silmäyksellä" - the Market/Squad
// cards must be at least 2x bigger, and each is a small info-dense
// piece that says a lot at a glance). That collides head-on with the
// still-standing "kaiken pitää mahtua nätisti" zero-scroll budget, and
// this repo's card-frames pass already resolved that exact tension the
// same way: fewer offers, not smaller elements. Was 4 (matched to
// ITEM_SHOP_SIZE below) - dropped to 3 so the featured grid has real
// width/height to grow the portrait and switch to a wider, denser card
// layout without wrapping to a second row (which would cost far more
// vertical budget than one fewer offer does). Also lines up with
// Marc's own repeated "too many cards / visual noise" complaints (see
// ITEM_SHOP_SIZE's history below) - a real economy touch, not just a
// CSS trick: one fewer roll to look at per visit.
const SHOP_SIZE = 3
// Essence rescale: was 1, now 65 (units.js's TIER_COST "1-family" -
// same value as a common unit's recruit cost). REROLL_INCREMENT (used
// by rerollShop below) was an inline `+ 1` matching this same base
// value - pulled into its own named constant, still equal to
// REROLL_BASE_COST, so a reroll's rising cost keeps stepping by
// exactly one "common unit's worth" of Essence each time within a
// shop visit, same relative shape as before.
// Rounded to the 50/100/150/200 family (Marc, round numbers).
const REROLL_BASE_COST = 50
const REROLL_INCREMENT = 50
export const DEPLOY_SLOTS = 4
// Death Memory (Marc's PRD: a lost hero should leave something behind
// instead of just vanishing) - deliberately tiny relative to
// START_ESSENCE/WIN_ESSENCE above (4 each): a one-time nudge honoring
// the PREVIOUS run's fallen hero, not a real economy lever, so it
// can't collide with the balance tuning already happening elsewhere in
// this file. See buildDeathMemory/startRun below. Exported so
// RunEndOverlay.jsx can display the real figure (the legacy-boon
// reveal on the defeat screen) without a second hardcoded copy
// silently drifting out of sync with the one actually applied here.
// Essence rescale (see START_ESSENCE's own comment above): was 1, now
// 65 (units.js's TIER_COST "1-family") - stays deliberately tiny
// relative to START_ESSENCE/WIN_ESSENCE (250 each) post-rescale too,
// same "a nudge, not a real economy lever" relationship as before
// (1 vs. 4, now 65 vs. 250).
// Rounded to the 50/100/150/200 family (Marc, round numbers).
export const MEMORY_ESSENCE_BONUS = 50

function currentNode(runState) {
  return runState.path[runState.nodeIndex]
}

function phaseForNode(node) {
  if (node?.type === "shop") return "shop"
  if (node?.type === "relic") return "relic"
  if (node?.type === "event") return "event"
  return "formation"
}

// Branching path (Marc, direct, twice: "haluan tarinankerronnan kuin
// slay the spiressä. pelaaja etenee tietä pitkin missä on eri
// tapahtumia ja vihollisia ja minibosseja" - I want storytelling like
// Slay the Spire, the player advances along a path with different
// events/enemies/minibosses to choose between - and later "peli on
// vielä todella tylsä pelata" - the game is still really boring to
// play). RUN_PATH's own SHAPE (which position is shop/relic/battle/
// miniboss/boss, and every miniboss/boss Trial's fixed identity/
// position) stays completely untouched - deliberately, since that
// shape carries a lot of separately fairness-tested difficulty pacing
// (see DIFFICULTY_TIERS/difficultyFactorForNode's own extensive
// history below) and every Trial's story beat is tied to an exact
// position in the run. Only "battle" SLOTS become real choices: at
// `startRun`, every battle-type RUN_PATH entry is pulled out into
// `battlePool`, in original order. Reaching a battle-type position now
// offers the front 2 pool entries as a real pick between two different
// upcoming fights - whichever ISN'T picked returns to the front of the
// pool and is offered again at the very next battle-type position,
// instead of being lost. That guarantees every battle RUN_PATH already
// defines still gets fought exactly once somewhere in the run (no
// content lost, no fight count changed, no shop/essence cadence
// changed) - only the ORDER becomes a real player decision, which is
// what actually makes it "a path with different enemies to choose
// between" rather than a re-skinned linear corridor.
//
// `path` keeps meaning exactly what it always meant (`path[nodeIndex]`
// is the current/most-recently-resolved node, growing by one entry per
// position advanced) - it's just no longer reattachable from the
// static RUN_PATH on load, since which battle landed at which position
// is now a real per-run, choice-driven outcome. See serializeRun's own
// updated note below.
// Small deterministic RNG (mulberry32) + shuffle - used for the per-run
// route seed. Deterministic in `seed` so a save/reload or a fairness
// re-run reproduces the exact same run.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle(list, rng) {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// enemyId / formationId -> Act, from RUN_PATH's fixed shape. Content-keyed
// (not object identity) so it still resolves for battle nodes that came
// back through a JSON save/restore as fresh objects. Built lazily on
// first use - actIndexForNode / DIFFICULTY_TIERS are declared further
// down this module, so this can't run at module-eval time.
let _battleNodeAct = null
function actOfBattleNode(node) {
  if (!_battleNodeAct) {
    _battleNodeAct = new Map()
    RUN_PATH.forEach((n, i) => {
      if (n.type !== "battle") return
      const key = n.enemyId || n.formationId
      if (key && !_battleNodeAct.has(key)) _battleNodeAct.set(key, actIndexForNode(i, RUN_PATH.length))
    })
  }
  return _battleNodeAct.get(node.enemyId || node.formationId) || 1
}

// Act-scoped reorder of a battle list. Two guardrails, both learned from
// a fairness run that showed a naive full shuffle slid the difficulty
// curve (it diluted the deliberately-hard opening wall, inflating win
// rate ~15pp):
//   1. Act I is NEVER reordered - it's short and its exact pacing (a
//      hard formation first) is what makes the opening tight.
//   2. In every later Act the FIRST authored battle is pinned as the
//      Act's entry fight (its tuned "step up" moment); only the rest of
//      that Act's battles shuffle among themselves.
// Everything still stays WITHIN its Act, so difficultyFactorForNode /
// ACT_STAT_FLOOR pacing is untouched, and formations (which
// resolveEncounterId never Act-swaps) stay in-band.
function actScopedReorder(battles, rng) {
  const byAct = new Map()
  for (const n of battles) {
    const act = actOfBattleNode(n)
    if (!byAct.has(act)) byAct.set(act, [])
    byAct.get(act).push(n)
  }
  const out = []
  for (const act of [...byAct.keys()].sort((x, y) => x - y)) {
    const group = byAct.get(act)
    if (act <= 1 || group.length <= 2) {
      out.push(...group) // Act I, or too small to meaningfully shuffle
    } else {
      out.push(group[0], ...seededShuffle(group.slice(1), rng))
    }
  }
  return out
}

// Route variety (Marc: "runit ovat samanlaisia"). The battle pool used
// to be RUN_PATH's battle nodes in authored order, identical every run;
// now it's reordered per-run via actScopedReorder. The player still
// picks 1-of-2 at each battle position (advanceToNextNode) - the seed
// just decides which pairs come up. `seed` omitted (old saves, some
// tests) -> authored order, unchanged.
function battleSlotsOf(runPath, seed) {
  const battles = runPath.filter((n) => n.type === "battle")
  if (seed == null) return battles
  return actScopedReorder(battles, mulberry32(seed))
}

// Re-shuffle only the battles still ahead in the pool, Act-scoped, with
// a seed mixed from the run seed and a label (a crossroads folds its
// chosen forestState in here so an Act I choice visibly changes which
// enemies Acts II+ present). Battles already fought are untouched.
export function reshuffleBattlePool(pool, seed, label = "") {
  if (seed == null || !Array.isArray(pool) || pool.length < 2) return pool
  let mixed = seed >>> 0
  for (let i = 0; i < label.length; i++) mixed = (Math.imul(mixed, 31) + label.charCodeAt(i)) >>> 0
  return actScopedReorder(pool, mulberry32(mixed))
}

// Shared by leaveShop/chooseRelic/resolveBattleOutcome below - all 3
// used to just do `nodeIndex + 1; path[nodeIndex]` inline, identically.
// Non-battle positions (shop/relic/miniboss/boss) resolve immediately,
// unchanged from before. A battle position with 2+ pool entries left
// stops short of resolving - sets `phase: "choice"` and stashes the 2
// options in `floorChoices`, WITHOUT advancing nodeIndex/path yet, so
// `path.length === nodeIndex + 1` still holds the instant a choice is
// pending (nothing has been "entered" yet - the player is still
// standing at the previous node, deciding). chooseFloorEncounter below
// is the only thing that actually resolves a pending choice.
function advanceToNextNode(runState) {
  const nextIndex = runState.nodeIndex + 1
  const template = RUN_PATH[nextIndex]
  if (template?.type !== "battle") {
    return { nodeIndex: nextIndex, path: [...runState.path, template], battlePool: runState.battlePool, floorChoices: null, phase: phaseForNode(template) }
  }
  const pool = runState.battlePool
  if (pool.length <= 1) {
    const chosen = pool[0] ?? template
    return { nodeIndex: nextIndex, path: [...runState.path, chosen], battlePool: [], floorChoices: null, phase: phaseForNode(chosen) }
  }
  const [a, b, ...rest] = pool
  return { nodeIndex: runState.nodeIndex, path: runState.path, battlePool: rest, floorChoices: [a, b], phase: "choice" }
}

// Resolves a pending "choice" phase (see advanceToNextNode above) - the
// chosen option joins `path` for real; the other one returns to the
// FRONT of `battlePool` so it's offered again at the next battle
// position rather than lost, keeping every RUN_PATH battle guaranteed
// to happen exactly once somewhere in the run.
export function chooseFloorEncounter(runState, choiceIndex) {
  if (runState.phase !== "choice" || !runState.floorChoices) return runState
  const chosen = runState.floorChoices[choiceIndex]
  if (!chosen) return runState
  const other = runState.floorChoices[1 - choiceIndex]
  return {
    ...runState,
    nodeIndex: runState.nodeIndex + 1,
    path: [...runState.path, chosen],
    battlePool: other ? [other, ...runState.battlePool] : runState.battlePool,
    floorChoices: null,
    phase: "formation",
  }
}

// 3 choices, never a relic already owned (relics don't stack with
// themselves, just with each other). `tribeCounts` (runEngine.js's own
// benchTribeCounts, passed in by every call site below) drives the
// same guarantee rollItemShop already gives Bending items: one slot is
// reserved for a tribe-anchor relic (relics.js) - preferring one that
// actually matches a tribe already on the bench, so "here's a relic
// that fits your build" is a real promise, not a coincidence, falling
// back to any tribe-anchor relic if the player hasn't committed to a
// tribe yet, and to nothing special if every tribe-anchor relic is
// already owned.
// `rng` = the seed engine's `loot` stream. Call sites pass
// `streamRng(seed, "loot", "<nodeIndex>:<relicRerolls>")` so the three
// offers are reproducible and a paid reroll (rerollRelicOffers, which
// bumps runState.relicRerolls) shows a genuinely different three.
function rollRelics(ownedRelicIds, tribeCounts = {}, rng = Math.random) {
  const pool = relicPool().filter((r) => !ownedRelicIds.includes(r.id))
  const matchingAnchor = pool.filter((r) => r.tribeAnchor && (tribeCounts[r.tribeAnchor] || 0) > 0)
  const anyAnchor = pool.filter((r) => r.tribeAnchor)
  const guaranteedPool = matchingAnchor.length ? matchingAnchor : anyAnchor
  const guaranteed = shuffled(guaranteedPool, rng).slice(0, Math.min(1, guaranteedPool.length))
  const guaranteedIds = new Set(guaranteed.map((r) => r.id))
  const rest = shuffled(pool.filter((r) => !guaranteedIds.has(r.id)), rng).slice(0, 3 - guaranteed.length)
  return shuffled([...guaranteed, ...rest], rng).map((r) => r.id)
}

// Market Level (Battlegrounds/Guildrun-style "tavern tier"): pay
// Essence to raise the shop's rarity ceiling. Reuses the existing 3-band
// common/uncommon/rare tier (units.js's tierFromCost) rather than
// inventing new rarity bands - a 4th/5th band would mean rebalancing
// every unit's HP/cost/Fusion math, a much bigger job than this feature
// needs. That caps Market Level at 3 steps, not Battlegrounds' 6 - a
// deliberate, smaller-scope version of the same idea. Named
// "marketLevel", never "tier" - "tier" already means 3 different things
// in this codebase (a unit's rarity band, Fusion's displayTier, and the
// old per-unit Upgrade's level), and a 4th meaning would only confuse.
export const MARKET_LEVEL_MAX = 3
// Essence rescale anchor (Marc, direct: "haluan että marketin
// nouseminen maksaa 250 essenceä" - I want leveling the Market to cost
// 250 Essence): marketLevelCost(1) below is BASE_COST * level, so this
// constant alone fixes the whole rescale's 250/4 = 62.5x scale factor
// - every other essence constant in the game was scaled by this SAME
// factor (see units.js's TIER_COST comment for the full table).
const MARKET_LEVEL_BASE_COST = 250
export const MARKET_LEVEL_UNLOCKS = {
  1: ["common"],
  2: ["common", "uncommon"],
  3: ["common", "uncommon", "rare"],
}

export function marketLevelCost(level) {
  return level >= MARKET_LEVEL_MAX ? null : MARKET_LEVEL_BASE_COST * level
}

// Market TIER (feat/hearthwood-market-tiers, Market/Money-Sinks PRD Phase 1).
// A SECOND market axis, orthogonal to marketLevel above:
//   marketLevel = the shop's RARITY ceiling (common -> uncommon -> rare).
//   marketTier  = WHICH KINDS OF UNIT the shop can offer at all - a
//                 tier-gated "specialist" sub-pool layered on top of the
//                 rarity-band pool (see rollShop below). Advancing a Tier
//                 costs Essence (the PRD's headline money sink) and unlocks
//                 new OPTIONS, never flat stats (PRD 40 "NO FREE POWER
//                 SPIKE"). A unit with no `tierGate` (i.e. the entire
//                 roster that exists today) is unaffected -> the Tier-1
//                 shop pool is byte-identical to before this feature.
export const MARKET_TIER_MAX = 3
const MARKET_TIER_BASE_COST = 300 // 300 then 600 - a real save-vs-spend, above marketLevelCost's 250/500
export const MARKET_TIERS = {
  1: { name: "Clearing", unlocks: ["The base roster"] },
  2: { name: "Woodland Market", unlocks: ["A Guardian and a debuff-striker specialist"] },
  3: { name: "Grove Market", unlocks: ["A synergy-scaled mender + a summoner", "Legendaries roll more often"] },
}

export function marketTierCost(tier) {
  return tier >= MARKET_TIER_MAX ? null : MARKET_TIER_BASE_COST * tier
}

// The shop's "Next Tier unlocks: ..." line (PRD 49). Pure.
export function marketTierPreview(tier) {
  const t = tier || 1
  const next = MARKET_TIERS[t + 1]
  return next ? { name: next.name, unlocks: next.unlocks, cost: marketTierCost(t) } : null
}

// The tier the shop actually rolls at = the run's marketTier plus any
// Market Charter (SHOP_INVESTMENTS below - a ledgerOnly relic that opens
// the shop one Tier higher), capped at MARKET_TIER_MAX. Every rollShop
// call site passes this, not the raw key, so the relic rides for free.
export function effectiveMarketTier(runState) {
  const base = runState?.marketTier || 1
  const charter = (runState?.relics || []).includes("market-charter") ? 1 : 0
  return Math.min(MARKET_TIER_MAX, base + charter)
}

// Only base-tier units are ever purchasable - a Tier 2 unit has
// recruitCost: null (it's only reachable by fusing three base copies),
// so it must never appear as a shop offer. summonOnly units (e.g.
// Spirit Wolf) are excluded the same way - they're only gained via a
// Summoner's own battle-start passive, never bought directly. Filtered
// further by marketLevel (above) - at level 1 only common-tier units
// can appear at all, same as every run has always started.
// `tribeCounts` (benchTribeCounts, passed by every call site below):
// completes the same "guaranteed, not just likely" pattern rollItemShop
// (Bending items) and rollRelics (tribe-anchor relics) already give -
// if the player has committed to a tribe, one slot is reserved for a
// unit of that tribe. Deliberately no "any tribe" fallback the way the
// other two have (an item/relic guarantee needs a fallback since most
// items/relics AREN'T tribe-tagged; nearly every unit already has a
// tribe, so guaranteeing "any tribe-tagged unit" with no investment
// yet would be meaningless - the shop just stays fully random until
// the player actually has a tribe to reinforce.
// `slotBonus` (runState.shopSlotBonus, from the Wider Stall Ledger buy):
// widens the roll to SHOP_SIZE + slotBonus offers. Every call site passes
// it so the shop size never flickers between visits.
// Legendary tier shop rate (feat/hearthwood-legendary-units): a
// Legendary never sits in rollShop's normal `pool` (MARKET_LEVEL_UNLOCKS
// stops at rare, left untouched so Fusion / reforge / base-roll math
// stay exactly as they were). Once the shop hits max market level, one
// non-guaranteed slot has this chance of being swapped for a random
// Legendary - a lucky high-roll on the 250-Essence build-around anchors,
// capped at one per visit. Primary fairness lever for the tier: a first
// pass at 0.22 (plus richer hook numbers) pushed tommy/aatos +13/+18pp
// on the RUNS=100 gate - dropped to 0.12 and paired with the trimmed
// hook values in units.js to land back inside +-8pp.
const LEGENDARY_SHOP_CHANCE = 0.12

// `rng` (default Math.random) is the seed engine's `shop` stream - see
// seed.js. Every call site that has a runState passes
// `streamRng(seed, "shop", "<nodeIndex>:<rerolls>")` so the offers are
// reproducible from the seed; a bare call still rolls live.
function rollShop(marketLevel, tribeCounts = {}, slotBonus = 0, rng = Math.random, marketTier = 1) {
  const allowedTiers = MARKET_LEVEL_UNLOCKS[marketLevel] || MARKET_LEVEL_UNLOCKS[1]
  const recruitable = (u) => !u.fusedFrom && !u.summonOnly && !u.evolvedFrom
  // The rarity-band pool - the ENTIRE roster that exists today (nothing
  // carries `tierGate` before feat/hearthwood-market-tiers, so `!u.tierGate`
  // is a no-op filter at Tier 1 and the pool is byte-identical to before).
  const bandPool = Object.values(UNITS).filter((u) => recruitable(u) && !u.tierGate && allowedTiers.includes(u.tier))
  // The Tier-gated "specialist" sub-pool: bypasses the rarity band
  // entirely (PRD 32 "Tier != Rarity"), purely gated by marketTier.
  const specialistPool = Object.values(UNITS).filter((u) => recruitable(u) && u.tierGate && u.tierGate <= marketTier)
  const pool = [...bandPool, ...specialistPool]
  const matching = pool.filter((u) => tribesOf(u.id, u).some((t) => (tribeCounts[t] || 0) > 0))
  const guaranteed = shuffled(matching, rng).slice(0, Math.min(1, matching.length))
  const guaranteedIds = new Set(guaranteed.map((u) => u.id))
  const rest = shuffled(pool.filter((u) => !guaranteedIds.has(u.id)), rng).slice(0, SHOP_SIZE + slotBonus - guaranteed.length)

  // Grove Market (marketTier 3, PRD 9): "Legendaries roll more often" -
  // a small bounded bump on the existing max-market-level Legendary swap,
  // no new machinery.
  const legendaryChance = marketTier >= MARKET_TIER_MAX ? 0.18 : LEGENDARY_SHOP_CHANCE
  if (marketLevel >= MARKET_LEVEL_MAX && rest.length && rng() < legendaryChance) {
    const legendaries = Object.values(UNITS).filter(
      (u) => u.tier === "legendary" && !u.fusedFrom && !u.summonOnly && !u.evolvedFrom,
    )
    if (legendaries.length) {
      rest[rest.length - 1] = legendaries[Math.floor(rng() * legendaries.length)]
    }
  }

  return shuffled([...guaranteed, ...rest], rng).map((u) => u.id)
}

function shuffled(array, rng = Math.random) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Item shop rotation (Marc: "gameplay from Guildrun" - Hero Bending is
// this game's own version of Guildrun's headline "hero bending" idea,
// but every item - Bending or not - sat in one flat, always-fully-
// visible catalog, so a Bending item never felt like something you
// discovered mid-run, just one more line in a big static list).
// ITEM_SHOP_SIZE offers, re-rolled fresh every shop visit the same way
// unit offers already are, with one slot GUARANTEED to be a Bending
// item whenever one exists - "you will see a real build-defining
// choice this visit," not just "maybe, if the dice cooperate."
//
// Was 6 - Marc, direct, looking at the shop: "siinä on liikaa
// kortteja sitä pitää vähentää" / "visuaalista meteliä pitää
// vähentää" (too many cards, too much visual noise). Matched to
// SHOP_SIZE (the unit row, above) so both rows read as the same
// weight of decision rather than the item row visually dominating.
// Market-scale-up pass: dropped again, 4 -> 3, the same "fewer,
// bigger" trade SHOP_SIZE's own comment above explains - stays matched
// to SHOP_SIZE for the same reason.
const ITEM_SHOP_SIZE = 3

// `rng` = the seed engine's `item` stream. Call sites pass
// `streamRng(seed, "item", "<nodeIndex>")` - the item shop regenerates
// with the unit shop on a new visit, but deliberately NOT on a paid unit
// reroll (see rerollShop), so nodeIndex alone is the right salt.
function rollItemShop(rng = Math.random) {
  const all = itemPool()
  const bending = all.filter((i) => i.bendsRoleTo)
  const guaranteed = shuffled(bending, rng).slice(0, Math.min(1, bending.length))
  const guaranteedIds = new Set(guaranteed.map((i) => i.id))
  const rest = shuffled(all.filter((i) => !guaranteedIds.has(i.id)), rng).slice(0, ITEM_SHOP_SIZE - guaranteed.length)
  return shuffled([...guaranteed, ...rest], rng).map((i) => i.id)
}

// Three owned copies of the same base unit combine into one Tier 2
// copy (see units.js's makeTier2) - repeats until no group of 3+
// remains, so recruiting a unit that completes two fusions at once
// (rare, but possible after a lucky bench) resolves fully in one step.
// Any deploy slot pointing at a consumed copy is cleared, not silently
// reassigned - fusing takes a unit off the field, the player re-places
// the upgraded version deliberately.
// `items` (runEngine.js's item bag - see equipItem/unequipItem) is
// threaded through fusion the same way `deployed` already is: any
// item equipped to a consumed bench key returns to the bag (unequipped,
// not destroyed) instead of being left pointing at a key that no
// longer exists on the bench - same "investment doesn't carry over"
// rule Reforge already applies to upgradeLevel.
function tryFuseOnce(bench, deployed, items, nextKey) {
  const groups = {}
  for (const entry of bench) {
    if (UNITS[entry.defId].displayTier === 2) continue
    ;(groups[entry.defId] ||= []).push(entry)
  }
  for (const [defId, entries] of Object.entries(groups)) {
    if (entries.length < 3) continue
    const consumed = new Set(entries.slice(0, 3).map((e) => e.key))
    const nextBench = [
      ...bench.filter((e) => !consumed.has(e.key)),
      { key: nextKey, defId: `${defId}${TIER2_SUFFIX}`, upgradeLevel: 0 },
    ]
    const nextDeployed = deployed.map((k) => (consumed.has(k) ? null : k))
    const nextItems = items.map((it) => (consumed.has(it.equippedTo) ? { ...it, equippedTo: null, slotIndex: null } : it))
    return { bench: nextBench, deployed: nextDeployed, items: nextItems, nextKey: nextKey + 1, changed: true }
  }
  return { bench, deployed, items, nextKey, changed: false }
}

function fuseAll(bench, deployed, items, nextKey) {
  let state = { bench, deployed, items, nextKey, changed: true }
  while (state.changed) {
    state = tryFuseOnce(state.bench, state.deployed, state.items, state.nextKey)
  }
  return state
}

// Marc: "peli alkaa siitä että commander on yksin, ja siitä
// rakennetaan ostamalla hahmoja ja itemeitä" (the game starts with the
// Commander alone, and you build from there by buying units and
// items) - the bench starts empty now that the Commander is a real
// 5th deployed unit (autoBattleEngine.js's COMMANDER_POSITION) capable
// of fighting solo. STARTER_UNITS is no longer used to pre-seed a
// squad, only as the shop's own recruit pool.
// `carriedMemory` (Death Memory - see buildDeathMemory below): the
// previous run's saved memory, if any, loaded by the page from
// runSaveState.js's loadLastRun() and passed in here once when a new
// run begins. Grants a small one-time Essence nudge (MEMORY_ESSENCE_BONUS)
// and is stashed on the new runState purely for display (the intro
// screen's "in memory of..." line) - it does not persist past this one
// grant; the page clears the saved memory the moment it's honored, so
// a fallen hero is remembered once, not forever.
// `meta` (metaState.js's loadMeta result): between-run progression.
// Its `chosenPerks` are applied once here, right after the base run is
// built, by metaPerks.js's applyMetaPerks - each perk is a plain
// always-on head start (extra starting Essence, a higher Market Level,
// a wider bench, ...), never a mid-run effect.
export function startRun(characterId, carriedMemory = null, meta = null) {
  // Per-run seed. A player types one in on commander-select (parsed via
  // seed.js), a test/tool pins it via meta.forcedSeed, otherwise it's
  // random per run. It drives the route (battleSlotsOf) AND every named
  // RNG stream (seed.js's streamRng) - shop / item / loot / event rolls
  // are all reproducible from it. `seed` already persists in the save,
  // so nothing here needs a RUN_SAVE_VERSION bump.
  const seed = Number.isFinite(meta?.forcedSeed) ? meta.forcedSeed >>> 0 : (Math.random() * 0x7fffffff) >>> 0
  const base = {
    characterId,
    seed,
    bench: [],
    benchKeyCounter: 0,
    deployed: Array.from({ length: DEPLOY_SLOTS }, () => null),
    essence: START_ESSENCE + (carriedMemory ? MEMORY_ESSENCE_BONUS : 0),
    honoredMemory: carriedMemory || null,
    // Branching path (see advanceToNextNode's own comment above): path
    // now starts with just the fixed first node (always a shop -
    // RUN_PATH[0]) and grows one real entry at a time as the run is
    // actually played, rather than being the whole static RUN_PATH
    // up front. battlePool holds every battle-type RUN_PATH entry,
    // Act-scoped-shuffled by the route seed, ready to be offered as
    // choices as the run reaches each battle position.
    path: [RUN_PATH[0]],
    battlePool: battleSlotsOf(RUN_PATH, seed),
    floorChoices: null,
    nodeIndex: 0,
    phase: "shop",
    marketLevel: 1,
    // Market Tier (feat/hearthwood-market-tiers) - an additive key, read
    // `|| 1` everywhere, carried verbatim by serialize/deserialize; an
    // old v3 save without it reads 1. No RUN_SAVE_VERSION bump.
    marketTier: 1,
    // Market Events (feat/hearthwood-market-events) - the first shop is
    // never a special market (MARKET_EVENT_MIN_NODE); explicit here.
    marketEvent: null,
    shopOffers: rollShop(1, {}, 0, streamRng(seed, "shop", "0:0"), 1),
    // Item shop rotation (rollItemShop above) - regenerates alongside
    // shopOffers at every new shop visit (chooseRelic/
    // resolveBattleOutcome below), but deliberately NOT on a paid unit
    // Reroll (rerollShop) - that button pays to reroll the UNIT
    // offers specifically, not a free item refresh riding along with it.
    itemOffers: rollItemShop(streamRng(seed, "item", "0")),
    // Freeze: keeps the current shopOffers into the next shop visit
    // instead of letting it re-roll automatically - a one-shot flag,
    // consumed (see chooseRelic/resolveBattleOutcome below) the next
    // time shopOffers would otherwise regenerate, not a persistent
    // toggle. A paid Reroll always ignores/clears it - an explicit
    // purchase supersedes a freeze, and freezing offers you're about to
    // discard yourself would be meaningless.
    frozen: false,
    rerollCost: REROLL_BASE_COST,
    battle: null,
    relics: [],
    relicOffers: null,
    relicLevels: {},
    // Paid relic-offer rerolls so far (rerollRelicOffers). Salts the
    // seed engine's `loot` stream so each fresh three genuinely differs
    // from the last. Additive key, read `|| 0`, no RUN_SAVE_VERSION
    // bump - an old v3 save just starts it at zero.
    relicRerolls: 0,
    commanderRank: 0,
    // Commander Active Power (characters.js's activePower): once per
    // shop visit (activePowerUsedThisShop resets alongside rerollCost -
    // see chooseRelic/resolveBattleOutcome, the same "a new shop visit
    // has begun" boundary), queues its effects (pendingActiveEffects)
    // to apply at the START of the very next battle only, then they're
    // discarded (see startFormationBattle below) - deferred by one
    // phase transition instead of applied immediately, same effect
    // shape squadPassive/relics already use once they land.
    activePowerUsedThisShop: false,
    pendingActiveEffects: [],
    // Map events (events.js): storyFlags accumulate across the run and
    // let later events branch on earlier choices; seenEvents keeps an
    // event from repeating within one run.
    storyFlags: {},
    seenEvents: [],
    // Story journal record of event choices (storyLog.js) - see
    // resolveEventChoice. Defaulted on read; old saves lack it.
    eventLog: [],
    // Act V - The Crownless (crownless.js). Runs as a sequence AFTER
    // `phase` is already "victory": `actFive` steps
    // null -> "throne" -> "crownless" -> "choice" -> "done"; `chosenEnding`
    // is the ending the player picked on the Forest's Choice screen (it
    // overrides the cinematics.suggestedEndingId tally); `echoEpilogueSeen`
    // gates the one-time Echo Age teaser. All defaulted on read - no
    // RUN_SAVE_VERSION bump; `phase` never leaves "victory" during Act V.
    actFive: null,
    chosenEnding: null,
    echoEpilogueSeen: false,
    // Unit Evolution (evolutions.js): [{ from, to }] of any units that
    // evolved on the most recent won battle - shown as a one-shot hint
    // on the next shop screen, cleared on leaveShop. Defaulted on read.
    lastEvolved: [],
    // The Ledger (SHOP_INVESTMENTS / buyInvestment): one-time run-wide
    // shop buys. All additive + guarded on every read (|| 0 / ?), so an
    // old save without them behaves as "none bought" - no version bump.
    recruitDiscount: 0, // Regular's Discount -> 0.2
    shopSlotBonus: 0, // Wider Stall -> 1 (extra shop offer)
    ledgerWinBonus: 0, // Ledger Account -> 40 Essence/win
    // Buyback (sellUnit / reclaimBuyback): the last unit sold, reclaimable
    // next shop at its refund price. null until you sell something.
    buyback: null,
    // Playstyle history (playstyle.js's evaluatePlaystyle - PR #426
    // follow-up): a small cumulative tally of decisions the profile
    // can't read from a state snapshot - rerolls, mid-run unit swaps
    // (sell/reforge), long grind wins, and the run's peak Essence.
    // Additive + read `|| 0` everywhere, so an old save without it just
    // starts the tally from zero - no RUN_SAVE_VERSION bump. NOTHING in
    // the combat path reads it; only the run-end / rail display does.
    styleLog: { rerolls: 0, pivots: 0, grinds: 0, maxEssence: START_ESSENCE + (carriedMemory ? MEMORY_ESSENCE_BONUS : 0) },
    // Scout Ahead (scoutAhead / scoutReport - DifficultyEngine Phase 1,
    // PR #436): the highest RUN_PATH index the player has paid Essence to
    // scout. RunMap shows a threat glyph + a "for your build" read for
    // battle nodes at or before it. Additive + read `|| 0`; NOTHING in
    // the combat path reads it - no RUN_SAVE_VERSION bump.
    scoutedThrough: 0,
    // The Almanac (almanac.js): ids this run has encountered - unioned
    // into meta.almanac when the run ends (HeartwoodBattle). Additive +
    // defaulted on read (noteSeen tolerates undefined), so an old save
    // just starts recording from now - no RUN_SAVE_VERSION bump.
    seen: { units: [], enemies: [], relics: [], events: [] },
    // Run Modifiers (boons.js): NAMED permanent consequences of map-event
    // choices - an array of modifier ids. Unlike `pendingActiveEffects`
    // (consumed after one battle) these are re-applied at the start of
    // EVERY battle for the rest of the run (see startFormationBattle) and
    // some also carry an Essence-per-win % (see essenceForWin). Old saves
    // predate this field; every read is `runState.runModifiers || []`.
    runModifiers: [],
    // Act Crossroads (crossroads.js): the one mandatory run-shaping choice
    // at each Act boundary. `allegiances` maps Act number -> chosen id (for
    // the ending tally); `forestState` ("restless" | "purified" |
    // "corrupted") is the world posture a crossroads sets, read by later
    // content passes (event/enemy pools); `lastSeenAct` is how the UI
    // knows a boundary is newly crossed and the interstitial is due. All
    // defaulted on read - no save-version bump.
    allegiances: {},
    forestState: "restless",
    lastSeenAct: 1,
    // Items (items.js): a shared owned bag, separate from the bench -
    // `equippedTo`/`slotIndex` point at a bench key + slot index (see
    // equipItem/unequipItem below) or sit null while unequipped.
    items: [],
    itemKeyCounter: 0,
  }

  let rs = applyMetaPerks(base, meta?.chosenPerks || [])

  // Depths (depths.js) - the challenge ladder. `selectedDepth` is kept
  // on the run so encounterAndFactorFor can scale enemies by it, and
  // its Essence penalty / first-battle curse land here at start.
  const selectedDepth = Math.max(0, meta?.selectedDepth || 0)
  if (selectedDepth > 0) {
    const mods = depthModifiersFor(selectedDepth)
    rs = {
      ...rs,
      selectedDepth,
      essence: Math.max(0, rs.essence + mods.essenceDelta),
      pendingActiveEffects: [...(rs.pendingActiveEffects || []), ...mods.startCurse],
    }
  } else {
    rs = { ...rs, selectedDepth: 0 }
  }

  // Traveler's Kit (metaPerks.js) leaves a `metaStartItem` signal for
  // startRun to resolve into a real bag entry (a data file can't import
  // ITEMS without a cycle). Consumed here, not kept on runState.
  if (rs.metaStartItem === "random-common") {
    const pool = itemPool().filter((i) => i.tier === "common").map((i) => i.id)
    const id = pool.length ? pool[Math.floor(streamRng(seed, "loot", "metaStartItem")() * pool.length)] : null
    const { metaStartItem, ...rest } = rs
    void metaStartItem
    rs = id
      ? { ...rest, items: [{ key: rest.itemKeyCounter, defId: id, equippedTo: null, slotIndex: null }], itemKeyCounter: rest.itemKeyCounter + 1 }
      : rest
  }

  // Forager (metaPerks.js) - same signal shape: start with a common
  // unit already on the bench (auto-deploys via the same fuseAll +
  // sweep recruitUnit uses).
  if (rs.metaStartUnit === "random-common") {
    const pool = Object.values(UNITS)
      .filter((u) => u.tier === "common" && !u.fusedFrom && !u.summonOnly && !u.evolvedFrom)
      .map((u) => u.id)
    const id = pool.length ? pool[Math.floor(streamRng(seed, "loot", "metaStartUnit")() * pool.length)] : null
    const { metaStartUnit, ...rest } = rs
    void metaStartUnit
    if (id) {
      const newKey = rest.benchKeyCounter
      const fused = fuseAll([{ key: newKey, defId: id, upgradeLevel: 0 }], rest.deployed, rest.items, newKey + 1)
      let deployed = fused.deployed
      const emptySlot = deployed.indexOf(null)
      if (emptySlot !== -1 && fused.bench[0]) {
        deployed = [...deployed]
        deployed[emptySlot] = fused.bench[0].key
      }
      rs = { ...rest, bench: fused.bench, deployed, items: fused.items, benchKeyCounter: fused.nextKey }
    } else {
      rs = rest
    }
  }

  return rs
}

// Regular's Discount (SHOP_INVESTMENTS / buyInvestment): a one-time
// Ledger buy that shaves every future recruit. `runState.recruitDiscount`
// is 0 unless bought. This is the ONE place a unit's price is derived -
// the affordability gate, the deduction, and the for-sale card label
// all read it, so a discount can never make the UI lie or overspend.
export function effectiveRecruitCost(runState, def) {
  const base = def?.recruitCost
  if (base == null) return base
  // Regular's Discount (Ledger) + any deployed Grove Merchant
  // (economy.js), combined and capped so a stacked discount can never
  // run away.
  const discount = Math.min(0.6, (runState.recruitDiscount || 0) + economyCrewEffects(runState).recruitPct)
  // Market Events (feat/hearthwood-market-events): a special market flatly
  // scales every recruit price this stop (Golden Market ×1.35, Wandering
  // Merchant ×0.75, Blackroot ×0.5). marketEventPriceMult(null) === 1.
  return Math.ceil(base * (1 - discount) * marketEventPriceMult(runState.marketEvent))
}

// The Almanac (almanac.js): fold ids into runState.seen[category],
// deduped. Pure, tolerates a missing `seen` (old save), combat never
// reads it - it only rides along until the run ends.
function noteSeen(seen, category, ...ids) {
  const cur = (seen && seen[category]) || []
  let next = cur
  for (const id of ids) {
    if (id && !next.includes(id)) {
      if (next === cur) next = cur.slice()
      next.push(id)
    }
  }
  if (next === cur) return seen || { units: [], enemies: [], relics: [], events: [] }
  return { ...(seen || { units: [], enemies: [], relics: [], events: [] }), [category]: next }
}

// Shared bench-insert used by recruitUnit AND reclaimBuyback: the
// RESERVE_CAP check (with the "a 3rd copy fuses, so it's exempt"
// carve-out), then fuseAll (3 copies -> one Tier 2), then the
// auto-deploy sweep (fill open slots, and re-place any unit a fusion
// just un-deployed - see the long note this comment replaced). Returns
// { ok, runState }; ok:false when the bench + reserve is full and the
// copy wouldn't fuse.
function addUnitToBench(runState, defId, upgradeLevel = 0) {
  const alreadyOwned = runState.bench.filter((e) => e.defId === defId).length
  const willFuse = alreadyOwned >= 2
  if (!willFuse && runState.bench.length >= DEPLOY_SLOTS + RESERVE_CAP + (runState.benchCapBonus || 0)) {
    return { ok: false, runState }
  }
  const newKey = runState.benchKeyCounter
  const withNew = [...runState.bench, { key: newKey, defId, upgradeLevel, upgrades: [] }]
  const fused = fuseAll(withNew, runState.deployed, runState.items, runState.benchKeyCounter + 1)
  let deployed = fused.deployed
  const deployedKeys = new Set(deployed.filter((k) => k !== null))
  for (const entry of fused.bench) {
    if (deployedKeys.has(entry.key)) continue
    const emptySlot = deployed.indexOf(null)
    if (emptySlot === -1) break
    deployed = [...deployed]
    deployed[emptySlot] = entry.key
    deployedKeys.add(entry.key)
  }
  return {
    ok: true,
    runState: {
      ...runState,
      bench: fused.bench,
      deployed,
      items: fused.items,
      benchKeyCounter: fused.nextKey,
      // Almanac: the recruited id + any "+" a fusion just formed.
      seen: noteSeen(runState.seen, "units", ...fused.bench.map((e) => e.defId)),
    },
  }
}

export function recruitUnit(runState, unitDefId) {
  const def = UNITS[unitDefId]
  const cost = effectiveRecruitCost(runState, def)
  if (!def || cost == null || runState.essence < cost || !runState.shopOffers.includes(unitDefId)) return runState
  const { ok, runState: withUnit } = addUnitToBench(runState, unitDefId, 0)
  if (!ok) return runState
  return {
    ...withUnit,
    essence: withUnit.essence - cost,
    shopOffers: withUnit.shopOffers.filter((id) => id !== unitDefId),
  }
}

// Essence rescale (see START_ESSENCE's own comment above): was 2, now
// 125 (units.js's TIER_COST "2-family").
// Rounded to the 50/100/150/200 family (Marc, round numbers).
export const REFORGE_COST = 100

// A fifth Essence sink (after recruit/reroll, Unit Upgrade, Commander
// Rank-Up, Relic Upgrade/Reroll): swaps one bench unit for a different
// random unit of the same tier, flat cost - "I don't want this one
// after all, but I've already committed the recruit cost" without a
// full reroll of the whole shop. Deliberately resets upgradeLevel to 0
// - it's a genuinely different unit afterward, not the same one
// wearing a new name, so carrying prior Essence investment over would
// be an odd fit. Fused (Tier 2) units can't be reforged - swapping
// away three units' worth of recruiting/fusing effort for a random
// base unit would be a strict downgrade trap, not a real choice. Nor
// can Legendaries (feat/hearthwood-legendary-units): a flat REFORGE_COST
// reroll of a committed 250-Essence pick into another random Legendary
// is a churn exploit, the same reason Tier 2 is blocked.
export function reforgeUnit(runState, benchKey) {
  const entry = runState.bench.find((e) => e.key === benchKey)
  if (!entry || runState.essence < REFORGE_COST) return runState
  const currentDef = UNITS[entry.defId]
  if (!currentDef || currentDef.displayTier === 2 || currentDef.tier === "legendary") return runState
  const pool = Object.values(UNITS).filter((u) => !u.fusedFrom && !u.summonOnly && !u.evolvedFrom && u.tier === currentDef.tier && u.id !== entry.defId)
  if (!pool.length) return runState
  // Seed engine's `shop` stream, salted by the bench key + how many
  // pivots (reforges/sells) have happened so far - so each reforge of
  // the same slot lands a genuinely different unit, reproducibly.
  const rng = streamRng(runState.seed, "shop", `reforge:${benchKey}:${styleN(runState, "pivots")}`)
  const newDef = pool[Math.floor(rng() * pool.length)]
  return {
    ...bumpStyle(runState, { pivots: styleN(runState, "pivots") + 1 }),
    essence: runState.essence - REFORGE_COST,
    bench: runState.bench.map((e) => (e.key === benchKey ? { ...e, defId: newDef.id, upgradeLevel: 0 } : e)),
    // Same "a genuinely different unit afterward" rule as the
    // upgradeLevel reset above - any equipped items return to the bag
    // rather than staying attached to a unit that's no longer the one
    // the player geared up.
    items: runState.items.map((it) => (it.equippedTo === benchKey ? { ...it, equippedTo: null, slotIndex: null } : it)),
  }
}

// Marc: "unit maksaa 50 ja myy 40 ei mitaan jarkea" - an 80% refund
// on the 50/100/150 recruit costs made buy-then-sell nearly free, no
// real cost to churning the shop. Cut to 33%: buy a common (50) and
// sell it back for 17, an uncommon (100) for 33, a rare (150) for 50.
// Recruiting is now a committing decision. (Recruit costs unchanged.)
const SELL_REFUND_RATE = 0.33
// A fused Tier 2 unit has no recruitCost of its own (never directly
// purchasable). Scaled with the 33% refund rate: a Tier 2 is 3 common
// recruits (150) fused, ~33% of that is 50.
const TIER2_SELL_FALLBACK = 50

// Shared by sellUnit below and SquadDraft.jsx's own sell-refund preview
// (the bench card's "sell for N" label) - both used to compute this
// formula independently, a real drift risk the moment either one's
// rate/fallback changed without the other noticing. One function now,
// imported by both.
export function sellRefundFor(def) {
  return def?.recruitCost != null ? Math.ceil(def.recruitCost * SELL_REFUND_RATE) : TIER2_SELL_FALLBACK
}

// Marc: "rahan tienaamista myös pitää saada... ja muuta rahaan
// liittyvään" (there needs to be more ways to earn money... and other
// money-related things) - Selling is the first way to turn a bench
// unit BACK into Essence instead of only ever spending it. Clears the
// unit from its deploy slot if it was deployed, and returns any
// equipped items to the bag rather than destroying them - same
// "investment doesn't carry over, but isn't wasted either" rule
// Reforge/Fusion already apply to items.
export function sellUnit(runState, benchKey) {
  const entry = runState.bench.find((e) => e.key === benchKey)
  if (!entry) return runState
  const def = UNITS[entry.defId]
  const refund = sellRefundFor(def)
  return {
    ...bumpStyle(runState, { pivots: styleN(runState, "pivots") + 1 }),
    essence: runState.essence + refund,
    bench: runState.bench.filter((e) => e.key !== benchKey),
    deployed: runState.deployed.map((k) => (k === benchKey ? null : k)),
    items: runState.items.map((it) => (it.equippedTo === benchKey ? { ...it, equippedTo: null, slotIndex: null } : it)),
    // Buyback (reclaimBuyback / the Ledger rail): remember the LAST unit
    // sold so the next shop can offer it back at the same price. Selling
    // again overwrites it. Makes selling reversible-ish (undo a misclick /
    // "sold too early") without being a storage locker - reclaim is
    // Essence-neutral and the unit comes back at upgradeLevel 0.
    buyback: { defId: entry.defId, price: refund },
  }
}

// Reclaim the last-sold unit (sellUnit's `buyback`) at the price it
// refunded. upgradeLevel resets to 0 (its items already returned to the
// bag on sale - "investment doesn't carry over", the reforge/fusion
// rule). No-op with no buyback, not enough Essence, or a full bench.
export function reclaimBuyback(runState) {
  const bb = runState.buyback
  if (!bb || !UNITS[bb.defId] || runState.essence < bb.price) return runState
  const { ok, runState: withUnit } = addUnitToBench(runState, bb.defId, 0)
  if (!ok) return runState
  return { ...withUnit, essence: withUnit.essence - bb.price, buyback: null }
}

// The Ledger (SquadDraft.jsx's left rail): one-time, run-wide buys that
// compete with units / Market Level / Rank for the same Essence - the
// competition IS the depth, and last round's interest lever gives you
// something big to save toward. Fairness: the sim bot's shop loop only
// levels market, activates power and recruits - it never buys these, so
// they're inert for it. Costs are tuned by reasoning: a focused player
// takes ~1-2 per run, not all three early; ledger-account (+40/win)
// needs ~11 wins to earn back its 450.
export const SHOP_INVESTMENTS = {
  "regulars-discount": {
    name: "Regular's Discount",
    cost: 300,
    desc: "Every unit you recruit costs 20% less for the rest of the run.",
  },
  "wider-stall": {
    name: "Wider Stall",
    cost: 350,
    desc: "The market shows one more unit every visit.",
  },
  "ledger-account": {
    name: "Ledger Account",
    cost: 450,
    desc: "+40 Essence every battle win, permanently.",
  },
  // The Rearguard (feat/hearthwood-hunters): the first Ledger buy that
  // isn't economy - a combat effect, delivered as a run-wide relic
  // ("rearguard-standard", relics.js `guardLowestHp`) pushed onto
  // runState.relics so it rides the existing relic path with zero new
  // plumbing. The answer to The Hunters: your frailest unit starts every
  // fight with Bulwark (one incoming hit shrugged off).
  "rearguard": {
    name: "The Rearguard",
    cost: 400,
    desc: "Your frailest unit starts every battle with Bulwark - one hit shrugged off.",
  },
  // The Marked Coin (feat/hearthwood-coven): the enemy-side mirror of
  // The Rearguard - a run-wide relic ("marked-coin", relics.js
  // `markLowestEnemyHp`) that puts Vulnerable on the frailest enemy
  // (the Coven Matron, or whatever key piece is softest) every fight.
  "marked-coin": {
    name: "The Marked Coin",
    cost: 400,
    desc: "The frailest thing on the enemy line starts every battle Vulnerable - it takes the hits harder.",
  },
  // Market Charter (feat/hearthwood-market-tiers): a shop-LAYER Ledger buy
  // (no battle effect). The relic "market-charter" makes effectiveMarketTier
  // read one Tier higher (capped at 3), so the shop offers the next
  // specialist sub-pool without paying the Tier-advance cost.
  "market-charter": {
    name: "The Market Charter",
    cost: 350,
    desc: "The shop opens one Market Tier higher for the rest of the run.",
  },
  // Trader's Compass (feat/hearthwood-market-events): the relic
  // "traders-compass" doubles pickMarketEvent's chance for the rest of
  // the run - special markets (Golden / Wandering Merchant / Blackroot)
  // turn up twice as often. Shop-LAYER, no battle effect.
  "traders-compass": {
    name: "The Trader's Compass",
    cost: 300,
    desc: "Special markets - the Golden Market and its kin - turn up twice as often for the rest of the run.",
  },
  // The Silenced Bell (feat/hearthwood-cult): the relic "silenced-bell"
  // (relics.js `stunHighestHp`) stuns the largest enemy on the line at
  // the start of every battle - the Ritual Warden in a Cult fight (so
  // its first ritual charge is stalled), the tankiest body anywhere else.
  "silenced-bell": {
    name: "The Silenced Bell",
    cost: 400,
    desc: "The largest thing on the enemy line starts every battle stunned - one turn lost, one ritual charge missed.",
  },
  // The Weathered Standard (feat/hearthwood-ancients): the relic
  // "weathered-standard" (relics.js `bracedSquad`) gives every deployed
  // unit Bulwark 1 at the start of every battle - one incoming hit
  // shrugged off. Generically useful, and the "you came braced" answer to
  // The Ancients' squad-wide charge payoff.
  "weathered-standard": {
    name: "The Weathered Standard",
    cost: 400,
    desc: "Every unit you field starts each battle with Bulwark - one incoming hit shrugged off.",
  },
}

export function investmentOwned(runState, id) {
  if (id === "regulars-discount") return (runState.recruitDiscount || 0) > 0
  if (id === "wider-stall") return (runState.shopSlotBonus || 0) > 0
  if (id === "ledger-account") return (runState.ledgerWinBonus || 0) > 0
  if (id === "rearguard") return (runState.relics || []).includes("rearguard-standard")
  if (id === "marked-coin") return (runState.relics || []).includes("marked-coin")
  if (id === "market-charter") return (runState.relics || []).includes("market-charter")
  if (id === "traders-compass") return (runState.relics || []).includes("traders-compass")
  if (id === "silenced-bell") return (runState.relics || []).includes("silenced-bell")
  if (id === "weathered-standard") return (runState.relics || []).includes("weathered-standard")
  return false
}

export function buyInvestment(runState, id) {
  const inv = SHOP_INVESTMENTS[id]
  if (!inv || investmentOwned(runState, id) || runState.essence < inv.cost) return runState
  const patch =
    id === "regulars-discount"
      ? { recruitDiscount: 0.2 }
      : id === "wider-stall"
        ? { shopSlotBonus: 1 }
        : id === "ledger-account"
          ? { ledgerWinBonus: 40 }
          : id === "rearguard"
            ? { relics: [...(runState.relics || []), "rearguard-standard"] }
            : id === "marked-coin"
              ? { relics: [...(runState.relics || []), "marked-coin"] }
              : id === "market-charter"
                ? { relics: [...(runState.relics || []), "market-charter"] }
                : id === "traders-compass"
                  ? { relics: [...(runState.relics || []), "traders-compass"] }
                  : id === "silenced-bell"
                    ? { relics: [...(runState.relics || []), "silenced-bell"] }
                    : { relics: [...(runState.relics || []), "weathered-standard"] }
  return { ...runState, essence: runState.essence - inv.cost, ...patch }
}

// A seventh Essence sink, and the first that isn't "strengthen
// something you already committed to" - buying an item just adds it
// to the owned bag (items.js's ITEMS), unequipped. Equipping/moving/
// unequipping afterward is free (see equipItem/unequipItem below),
// same "pay once, rearrange freely" shape a deployed unit's formation
// slot already has via assignToSlot/clearSlot.
export function buyItem(runState, itemDefId) {
  const def = ITEMS[itemDefId]
  if (!def || runState.essence < def.cost) return runState
  return {
    ...runState,
    essence: runState.essence - def.cost,
    items: [...runState.items, { key: runState.itemKeyCounter, defId: itemDefId, equippedTo: null, slotIndex: null }],
    itemKeyCounter: runState.itemKeyCounter + 1,
  }
}

// Relics (relics.js) can grant every unit extra slots (Artificer's
// Ledger, itemSlotBonus) on top of the flat ITEM_SLOTS base - read
// here rather than inlined at both call sites (equipItem's range
// check, SquadDraft.jsx's slot-pip rendering) so the two can never
// drift out of sync with each other.
export function effectiveItemSlots(runState) {
  const bonus = runState.relics.reduce((sum, id) => sum + (RELICS[id]?.itemSlotBonus || 0), 0)
  // Deep Pockets (metaPerks.js) - a permanent +1 on top of the relic bonus.
  return ITEM_SLOTS + bonus + (runState.metaItemSlotBonus || 0)
}

// Equips an owned item onto one of a bench unit's item slots (see
// effectiveItemSlots above - may be more than the base ITEM_SLOTS with
// Artificer's Ledger owned). Free - the Essence cost was already paid
// on purchase. If the target slot already holds a different item, that
// one is bumped back to the bag first (a slot can only ever hold one
// item), same "drop something new in, the old one comes out" swap
// FormationScreen.jsx's deploy slots already do.
export function equipItem(runState, itemKey, benchKey, slotIndex) {
  const item = runState.items.find((it) => it.key === itemKey)
  // "commander" is a fixed sentinel key, not a real bench entry - the
  // Commander is always part of the squad, never recruited, so it has
  // no bench row to look up.
  const validTarget = benchKey === "commander" || runState.bench.some((e) => e.key === benchKey)
  if (!item || slotIndex < 0 || slotIndex >= effectiveItemSlots(runState) || !validTarget) return runState
  return {
    ...runState,
    items: runState.items.map((it) => {
      if (it.key === itemKey) return { ...it, equippedTo: benchKey, slotIndex }
      if (it.equippedTo === benchKey && it.slotIndex === slotIndex) return { ...it, equippedTo: null, slotIndex: null }
      return it
    }),
  }
}

// Returns an equipped item to the bag. Free, same reasoning as
// equipItem above.
export function unequipItem(runState, itemKey) {
  return {
    ...runState,
    items: runState.items.map((it) => (it.key === itemKey ? { ...it, equippedTo: null, slotIndex: null } : it)),
  }
}

// Raises marketLevel (see rollShop above) - affects the pool the NEXT
// shop roll draws from (a fresh visit, or a paid Reroll), not the
// currently-shown offers - same "pay now, benefit compounds later"
// shape Rank-Up/Relic Upgrade already have, rather than an instant
// reroll that would conflate two separate paid actions.
export function levelUpMarket(runState) {
  const level = runState.marketLevel || 1
  const cost = marketLevelCost(level)
  if (cost === null || runState.essence < cost) return runState
  return { ...runState, essence: runState.essence - cost, marketLevel: level + 1 }
}

// Raises marketTier (feat/hearthwood-market-tiers) - the exact mirror of
// levelUpMarket above, on the other market axis. Unlocks the next
// specialist sub-pool in future shop rolls (rollShop); the PRD's headline
// money sink, competing with recruit / reroll / levelUpMarket / the
// Ledger for the same Essence.
export function advanceMarketTier(runState) {
  const tier = runState.marketTier || 1
  const cost = marketTierCost(tier)
  if (cost === null || runState.essence < cost) return runState
  return { ...runState, essence: runState.essence - cost, marketTier: tier + 1 }
}

export function toggleFreeze(runState) {
  if (marketEventLocksReroll(runState)) return runState
  return { ...runState, frozen: !runState.frozen }
}

// Market Events (feat/hearthwood-market-events, Market/Money-Sinks PRD
// 43-44). Some shop stops are a SPECIAL market with its own risk/reward
// - not the same three offers every time. Pure shop-layer: no combat
// change. `runState.marketEvent` (additive key, `|| null`, no
// RUN_SAVE_VERSION bump) is set at shop entry from a SEEDED pick and
// re-derivable from seed + nodeIndex + whether the Trader's Compass is
// owned, so a reload reproduces it.
export const MARKET_EVENTS = {
  merchant: {
    name: "The Wandering Merchant",
    blurb: "A cart, a tarp, everything cut-price - decide fast.",
    effect: "Only 2 unit offers · recruits 25% off",
    tone: "moss",
    slotDelta: -1,
    tierOverride: null,
    priceMult: 0.75,
    lockReroll: false,
  },
  blackroot: {
    name: "The Blackroot Market",
    blurb: "Cheap. All of it, cheap. That should worry you.",
    effect: "Recruits half price · no Reroll or Freeze this stop",
    tone: "curse",
    slotDelta: 0,
    tierOverride: null,
    priceMult: 0.5,
    lockReroll: true,
  },
  golden: {
    name: "The Golden Market",
    blurb: "Every stall is open - and priced like it.",
    effect: "Stocks the top Market Tier · recruits cost 35% more",
    tone: "gold",
    slotDelta: 0,
    tierOverride: MARKET_TIER_MAX,
    priceMult: 1.35,
    lockReroll: false,
  },
}
const MARKET_EVENT_MIN_NODE = 12 // never on the opening stops
const MARKET_EVENT_CHANCE = 0.18 // ~1 in 5.5 eligible shop stops

export function hasTradersCompass(runState) {
  return (runState?.relics || []).includes("traders-compass")
}

export function marketEventPriceMult(id) {
  return MARKET_EVENTS[id]?.priceMult ?? 1
}

export function marketEventLocksReroll(runState) {
  const ev = MARKET_EVENTS[runState?.marketEvent]
  return !!ev?.lockReroll
}

// The `slotBonus` and `marketTier` args to feed rollShop while a market
// event is in effect - the same computation for all 4 shop-roll sites
// (the 3 entry points + rerollShop). `marketEvent` is passed explicitly
// (not read off runState) because at a shop-entry point it's the
// freshly-picked event, not the one still on runState.
export function marketEventRollArgs(marketEvent, runState) {
  const ev = MARKET_EVENTS[marketEvent]
  return {
    // Floor at 1 - SHOP_SIZE so a negative slotDelta (Wandering Merchant's
    // -1) still leaves >= 1 offer. The Merchant cut yields 2 offers on a
    // plain run; a Wider Stall (+1) cancels it back to 3.
    slotBonus: Math.max(1 - SHOP_SIZE, (runState?.shopSlotBonus || 0) + (ev?.slotDelta || 0)),
    tier: ev?.tierOverride ?? effectiveMarketTier(runState),
  }
}

// Deterministic in (seed, nodeIndex, hasCompass) - all persisted, so a
// save/reload reproduces the same event. Two draws off the `shop`
// stream: one "does an event happen", one "which".
export function pickMarketEvent(seed, nodeIndex, hasCompass = false) {
  if (!Number.isFinite(nodeIndex) || nodeIndex < MARKET_EVENT_MIN_NODE) return null
  const rng = streamRng(seed, "shop", `${nodeIndex}:mktevent`)
  if (rng() >= MARKET_EVENT_CHANCE * (hasCompass ? 2 : 1)) return null
  const r = rng()
  return r < 0.45 ? "merchant" : r < 0.8 ? "blackroot" : "golden"
}

// Commander Active Power (characters.js's activePower) - an Essence
// sink, once per shop visit, that queues its effects for the very next
// battle only (see startFormationBattle below) rather than applying
// immediately - a "hero power" on top of the Commander's always-on
// squadPassive.
export function activateCommanderPower(runState) {
  const character = CHARACTERS[runState.characterId]
  const power = character?.activePower
  if (!power || runState.activePowerUsedThisShop || runState.essence < power.cost) return runState
  return {
    ...runState,
    essence: runState.essence - power.cost,
    activePowerUsedThisShop: true,
    pendingActiveEffects: power.effects,
  }
}

// Tribe counts (synergies.js) for the UI's synergy tracker (see
// FormationScreen.jsx) - counted from DEPLOYED bench units only (not
// every owned unit, not the Commander, which has no tribe of its own)
// so it reflects what's actually about to fight, the same scope
// autoBattleEngine.js's own tribe-synergy loop uses for the real
// in-battle effect - kept here as a small shared helper so the two can
// never drift apart on what "counts."
export function deployedTribeCounts(runState) {
  const counts = {}
  for (const key of runState.deployed) {
    if (key === null) continue
    const entry = runState.bench.find((e) => e.key === key)
    const def = entry && UNITS[entry.defId]
    if (!def) continue
    for (const t of tribesOf(entry.defId, def)) counts[t] = (counts[t] || 0) + 1
  }
  return counts
}

// Unit Evolution (evolutions.js). Called once after a won battle
// (resolveBattleOutcome): every DEPLOYED bench entry whose evolution
// condition is now met is swapped to its evolved defId IN PLACE - same
// bench key, `upgradeLevel` and equipped items kept (evolution is
// growth, not a new unit, unlike reforgeUnit). Deterministic: the only
// inputs are `entry.wins`, the deployed tribe counts, and forestState.
// Returns { runState, evolved: [{ from, to }] } for the UI hint.
function applyEvolutions(runState) {
  const tribeCounts = deployedTribeCounts(runState)
  const deployedKeys = new Set(runState.deployed.filter((k) => k !== null))
  const evolved = []
  let seen = runState.seen
  const bench = runState.bench.map((e) => {
    if (!deployedKeys.has(e.key)) return e
    const to = evolutionReady(e, tribeCounts, runState.forestState || "restless")
    if (!to || !UNITS[to]) return e
    evolved.push({ from: UNITS[e.defId]?.name || e.defId, to: UNITS[to].name })
    seen = noteSeen(seen, "units", to) // Almanac
    return { ...e, defId: to }
  })
  return { runState: { ...runState, bench, seen }, evolved }
}

// Same idea as deployedTribeCounts above, but scoped to the whole
// BENCH (every owned unit, deployed or not) - used by the shop to
// highlight an offer that would deepen a tribe the player has already
// invested in, before they've necessarily finished deploying this
// visit. A real Battlegrounds/TFT convention ("this fits your board")
// this codebase didn't have a scouting-info source for yet.
export function benchTribeCounts(runState) {
  const counts = {}
  for (const entry of runState.bench) {
    const def = UNITS[entry.defId]
    if (!def) continue
    for (const t of tribesOf(entry.defId, def)) counts[t] = (counts[t] || 0) + 1
  }
  return counts
}

// An Essence sink spent on the Commander instead of a bench unit -
// same rising-cost, capped-levels shape upgradeRelic below uses, see
// characters.js's commanderRankCost/commanderPassiveWithRank.
export function rankUpCommander(runState) {
  const rank = runState.commanderRank || 0
  const cost = commanderRankCost(rank)
  if (cost === null || runState.essence < cost) return runState
  return { ...runState, essence: runState.essence - cost, commanderRank: rank + 1 }
}

// Essence rescale (see START_ESSENCE's own comment above): was 4, now
// 250 (units.js's TIER_COST "4-family" - same value as
// MARKET_LEVEL_BASE_COST/START_ESSENCE/WIN_ESSENCE).
export const RETRAIN_COST = 250

// A sixth Essence sink, but a genuinely different kind from the other
// five (all of which strengthen something you already have): Retrain
// lets a player pivot the whole run's identity mid-draft, switching to
// a different Commander if the bench they've drawn doesn't fit the one
// they started with. commanderRank resets to 0 - it was Essence spent
// scaling up the OLD Commander's specific squadPassive, which has no
// meaning against a different one, same "no carried investment"
// precedent Reforge already established for a bench unit's
// upgradeLevel.
export function retrainCommander(runState, newCharacterId) {
  if (newCharacterId === runState.characterId || !CHARACTERS[newCharacterId]) return runState
  if (runState.essence < RETRAIN_COST) return runState
  return {
    ...runState,
    essence: runState.essence - RETRAIN_COST,
    characterId: newCharacterId,
    commanderRank: 0,
    // A queued Active Power effect (see activateCommanderPower above)
    // belonged to the OLD Commander's kit - switching mid-visit
    // invalidates it, same "no carried investment" precedent
    // commanderRank's own reset just above already established.
    pendingActiveEffects: [],
    activePowerUsedThisShop: false,
  }
}

// An Essence sink: spend on an owned relic - a rising-cost, capped-
// levels curve (units.js's upgradeCost/UPGRADE_MAX_LEVEL), scaling
// that relic's effect via autoBattleEngine.js's per-relic-level
// factor. Only affects a relic you already own - relics.js's
// rollRelics already prevents owning a duplicate, so relicId here
// always maps to at most one entry.
export function upgradeRelic(runState, relicId) {
  if (!runState.relics.includes(relicId)) return runState
  const level = runState.relicLevels[relicId] || 0
  const cost = upgradeCost(level)
  if (cost === null || runState.essence < cost) return runState
  return {
    ...runState,
    essence: runState.essence - cost,
    relicLevels: { ...runState.relicLevels, [relicId]: level + 1 },
  }
}

// The first real per-unit Upgrade (feat/hearthwood-upgrade-branches):
// spends the same rising cost curve as upgradeRelic, but each level
// picks ONE branch (upgrades.js's UPGRADE_BRANCHES) recorded in
// entry.upgrades. entry.upgradeLevel is kept synced to its length for
// any code that still reads a level. Fused (Tier 2) units can't be
// upgraded, same as reforge - they're already a committed endpoint.
export function upgradeUnit(runState, benchKey, branchId) {
  const entry = runState.bench.find((e) => e.key === benchKey)
  if (!entry) return runState
  const def = UNITS[entry.defId]
  if (!def || def.displayTier === 2) return runState
  const upgrades = entry.upgrades || []
  const level = upgrades.length || entry.upgradeLevel || 0
  const cost = upgradeCost(level)
  if (cost === null || runState.essence < cost) return runState
  if (!branchById(branchId) || !branchAvailable(branchId, upgrades, level)) return runState
  const nextUpgrades = [...upgrades, branchId]
  return {
    ...runState,
    essence: runState.essence - cost,
    bench: runState.bench.map((e) =>
      e.key === benchKey ? { ...e, upgrades: nextUpgrades, upgradeLevel: nextUpgrades.length } : e,
    ),
  }
}

// Playstyle history tally (see startRun's `styleLog`). Merges a partial
// patch onto the current counters, tolerating a missing styleLog.
function bumpStyle(runState, patch) {
  return { ...runState, styleLog: { ...(runState.styleLog || {}), ...patch } }
}
const styleN = (runState, k) => runState.styleLog?.[k] || 0

export function rerollShop(runState) {
  if (runState.essence < runState.rerollCost) return runState
  if (marketEventLocksReroll(runState)) return runState // Blackroot Market: take what's shown
  return {
    ...bumpStyle(runState, { rerolls: styleN(runState, "rerolls") + 1 }),
    essence: runState.essence - runState.rerollCost,
    shopOffers: rollShop(
      runState.marketLevel || 1,
      benchTribeCounts(runState),
      marketEventRollArgs(runState.marketEvent, runState).slotBonus,
      streamRng(runState.seed, "shop", `${runState.nodeIndex}:${styleN(runState, "rerolls") + 1}`),
      marketEventRollArgs(runState.marketEvent, runState).tier,
    ),
    // Essence rescale: was a bare `+ 1`, now REROLL_INCREMENT (50,
    // same value REROLL_BASE_COST itself carries) - see
    // REROLL_BASE_COST's own comment above. A deployed Toll-Warden
    // (economy.js) holds the cost flat instead of letting it climb.
    rerollCost: economyCrewEffects(runState).rerollFlat
      ? runState.rerollCost
      : runState.rerollCost + REROLL_INCREMENT,
    // A paid Reroll always overrides Freeze (see startRun's own note on
    // `frozen`) - an explicit purchase supersedes it, and there's
    // nothing left to "keep" once the player has deliberately replaced
    // the offers themselves.
    frozen: false,
  }
}

export function leaveShop(runState) {
  // The one-shot "X evolved into Y" hint (evolutions.js) has been shown
  // on this shop screen - clear it as the player moves on.
  const cleared = runState.lastEvolved?.length ? { ...runState, lastEvolved: [] } : runState
  // Market Events (feat/hearthwood-market-events): this shop stop is
  // over - clear the special-market flag. It's re-derived from the seed
  // at the NEXT shop entry.
  return { ...cleared, marketEvent: null, ...advanceToNextNode(cleared) }
}

// --- Map events (events.js) ---------------------------------------------
// The event shown at the current event-node position. Deterministic in
// nodeIndex + Act + which events have already been seen, so the same
// run always shows the same event at the same place (the save/restore
// invariant depends on it).
export function eventForNode(runState) {
  const act = actIndexForNode(runState.nodeIndex, RUN_PATH.length)
  return pickEvent(runState.nodeIndex, act, runState.seenEvents || [], runState.storyFlags || {})
}

function randomFromList(list, rng = Math.random) {
  return list.length ? list[Math.floor(rng() * list.length)] : null
}

// Applies ONE consequence object from a chosen event option. Kept
// deliberately small - each key maps to an existing run mechanic, no
// new state shape beyond storyFlags (declared in startRun).
// `effIndex` salts the seed engine's `event` stream so a "random relic"
// consequence is reproducible from the seed and the run's position.
function applyEventEffect(runState, eff, effIndex = 0) {
  const rng = streamRng(runState.seed, "event", `${runState.nodeIndex}:${effIndex}`)
  if (typeof eff.essence === "number") {
    return { ...runState, essence: Math.max(0, runState.essence + eff.essence) }
  }
  if (eff.relic) {
    const owned = new Set(runState.relics)
    const id = eff.relic === "random" ? randomFromList(relicPool().map((r) => r.id).filter((rid) => !owned.has(rid)), rng) : eff.relic
    if (!id || owned.has(id)) return runState
    return { ...runState, relics: [...runState.relics, id] }
  }
  if (eff.item) {
    const id = eff.item === "random" ? randomFromList(itemPool().map((i) => i.id), rng) : eff.item
    if (!id || !ITEMS[id]) return runState
    return {
      ...runState,
      items: [...runState.items, { key: runState.itemKeyCounter, defId: id, equippedTo: null, slotIndex: null }],
      itemKeyCounter: runState.itemKeyCounter + 1,
    }
  }
  if (eff.unit) {
    if (runState.bench.length >= DEPLOY_SLOTS + RESERVE_CAP + (runState.benchCapBonus || 0)) return runState
    let id = eff.unit
    if (eff.unit === "random-common") {
      id = randomFromList(
        Object.values(UNITS)
          .filter((u) => u.tier === "common" && !u.fusedFrom && !u.summonOnly && !u.evolvedFrom)
          .map((u) => u.id),
        rng,
      )
    }
    if (!id || !UNITS[id]) return runState
    const newKey = runState.benchKeyCounter + 1
    const withNew = [...runState.bench, { key: newKey, defId: id, upgradeLevel: 0 }]
    const fused = fuseAll(withNew, runState.deployed, runState.items, newKey)
    return { ...runState, bench: fused.bench, deployed: fused.deployed, items: fused.items, benchKeyCounter: newKey }
  }
  if (Array.isArray(eff.squadNextBattle)) {
    // Same one-battle channel the Commander's active power uses - applied
    // at the start of the next battle by startFormationBattle, then
    // discarded. A blessing or a curse, depending on the effects.
    return { ...runState, pendingActiveEffects: [...(runState.pendingActiveEffects || []), ...eff.squadNextBattle] }
  }
  if (eff.flag) {
    return { ...runState, storyFlags: { ...runState.storyFlags, [eff.flag]: true } }
  }
  // Run Modifier (boons.js): a permanent boon/bane. `{ boon: "id" }` and
  // `{ bane: "id" }` are the same channel - `kind` on the modifier def
  // itself says which it is; the two keys just read naturally in the
  // event data. Ignored if the id is unknown or already held (they
  // don't stack with themselves).
  if (eff.boon || eff.bane) {
    const id = eff.boon || eff.bane
    const held = runState.runModifiers || []
    if (!runModifierById(id) || held.includes(id)) return runState
    return { ...runState, runModifiers: [...held, id] }
  }
  return runState
}

// Resolves a pending "event" phase: applies the chosen option's
// consequences, records the event as seen, and advances the run the
// same way leaving a shop does.
export function resolveEventChoice(runState, choiceIndex) {
  if (runState.phase !== "event") return runState
  const event = eventForNode(runState)
  const choice = event?.choices?.[choiceIndex]
  if (!choice) return runState
  let next = runState
  ;(choice.effects || []).forEach((eff, i) => {
    next = applyEventEffect(next, eff, i)
  })
  next = {
    ...next,
    seenEvents: [...(next.seenEvents || []), event.id],
    // Almanac (almanac.js): lifetime "encountered" list, unioned into
    // meta on run end. `seenEvents` above is this run's dedup list for
    // pickEvent; this is the cross-run one.
    seen: noteSeen(next.seen, "events", event.id),
    // Story journal (storyLog.js): a readable record of what you chose,
    // separate from `seenEvents` (which stays a bare id list for
    // pickEvent's dedup). Defaulted on read; no save-version bump.
    eventLog: [
      ...(next.eventLog || []),
      { id: event.id, title: event.title, choice: choice.label, result: choice.result, act: actIndexForNode(runState.nodeIndex, RUN_PATH.length) },
    ],
  }
  return { ...next, ...advanceToNextNode(next) }
}

// Act Crossroads (crossroads.js): the mandatory choice at an Act
// boundary. Unlike a map event this is NOT a run node - `nodeIndex` /
// `path` / `phase` are untouched. It only records the pick
// (`allegiances[actIndex]`), grants its permanent Act Allegiance into
// the same `runModifiers` list boons/banes use, sets `forestState`,
// raises the story flag, and bumps `lastSeenAct` so the interstitial
// can't re-trigger. An unknown act or choice id is a safe no-op that
// still bumps `lastSeenAct` (a boundary with no crossroads - Acts
// VI/VII - is crossed silently the same way).
export function resolveActCrossroads(runState, actIndex, choiceId) {
  const seen = Math.max(runState.lastSeenAct || 1, actIndex)
  const cr = crossroadsForAct(actIndex)
  const choice = cr?.choices.find((c) => c.id === choiceId)
  if (!choice) return { ...runState, lastSeenAct: seen }
  const held = runState.runModifiers || []
  const runModifiers =
    choice.allegiance && !held.includes(choice.allegiance) ? [...held, choice.allegiance] : held
  const forestState = choice.forestState || runState.forestState || "restless"
  return {
    ...runState,
    runModifiers,
    allegiances: { ...(runState.allegiances || {}), [actIndex]: choiceId },
    forestState,
    storyFlags: choice.flag ? { ...runState.storyFlags, [choice.flag]: true } : runState.storyFlags,
    lastSeenAct: seen,
    // Route variety: the crossroads re-shuffles the battles still ahead
    // (Act-scoped, so still in difficulty band) with the chosen
    // forestState folded into the seed - your Act I choice visibly
    // changes which enemies the later Acts put in front of you.
    battlePool: reshuffleBattlePool(runState.battlePool, runState.seed, `act${actIndex}:${forestState}`),
  }
}

// Bump `lastSeenAct` without a choice - used when the UI crosses an Act
// boundary that has no crossroads defined (Acts VI/VII).
export function markActSeen(runState, actIndex) {
  return { ...runState, lastSeenAct: Math.max(runState.lastSeenAct || 1, actIndex) }
}

export function assignToSlot(runState, slotIndex, benchKey) {
  const deployed = runState.deployed.map((k) => (k === benchKey ? null : k))
  deployed[slotIndex] = benchKey
  return { ...runState, deployed }
}

export function clearSlot(runState, slotIndex) {
  const deployed = [...runState.deployed]
  deployed[slotIndex] = null
  return { ...runState, deployed }
}

// Difficulty scaling (autoBattleEngine.js's difficultyFactor param) -
// Marc: "pelin pitää olla vaikea mutta ei mahdoton... pelaajan pitää
// tehdä toimiva build voittaakseen" (the game needs to be hard but not
// impossible - the player needs to build a working build to win),
// confirmed after a stress test showed a bot that ignores every system
// this session built (Market Level, tribes, relics, Commander Active)
// won exactly as often as one that uses all of them - the base
// recruited squad alone already cleared the whole run, so none of it
// had real pressure behind it. Ramps ONLY in the run's back half
// (progress > 0.5) - the opening was already separately tuned earlier
// this session's history (see units.js's TIER_HP note) and shouldn't
// get harder, this specifically targets "difficulty hasn't kept pace
// with what a real build accumulates by the second half," capping at
// +50% HP/damage on the very last fight (the boss).
// Marc: "make it challenging but fair." A fairness stress test
// (per-fight death tracking, not just win/loss) found deaths
// clustering on 2 specific formation fights (Rune Warden's Escort,
// Twin Watch) rather than spreading across the late run - tried
// dampening the ramp specifically for formations (multi-piece fights
// already carry more total enemy HP/damage than a solo fight at the
// same run position, so the same percentage bonus lands as a bigger
// absolute increase there). That overcorrected hard: this engine's
// combat is fully deterministic (no dice on damage, only shop-offer
// RNG varies a run), so difficulty here behaves as a threshold, not a
// smooth probability curve - even a 25% dampening flipped EVERY
// realistic-bot run from sometimes-lethal to zero deaths anywhere,
// across all 4 Commanders. Reverted the dampening entirely - formations
// being the hardest fights is the intended shape (they're deliberately
// the "did you actually build well" test before the final relic/boss
// stretch, not a bug), and the un-dampened ramp already produces real,
// non-zero challenge (58-67% win rate for a bot that ignores every
// system this session built, 80-100% per-Commander for a realistic
// bot) without being a coin flip. See the Commander win-rate spread
// itself (characters.js) as the more clearly UNFAIR remaining gap,
// not this.
// A player-facing name for how far into the difficulty ramp this point
// in the run is - Marc: "the game has to have progressive feel to it
// so it becomes more difficult." The ramp itself (difficultyFactorForNode
// below) was a pure backend multiplier with zero visible component,
// breaking the same "every mechanic needs something the player can
// actually see" rule this session has enforced everywhere else (Bent
// badges, tribe icons, frost overlays...). Same breakpoints as the
// ramp's own progress > 0.45 start, so the label is an honest read of
// what's actually happening, not decoration layered on top of a
// number it doesn't track.
// Marc: "make a progressive story" - each tier already had a real name
// and a color for the difficulty badge above; `tagline`/`lore` extend
// the SAME entries rather than a parallel story structure, so the
// difficulty readout and the narrative one can never drift apart (one
// says "The Reckoning," the other can't say something different for
// the same stretch of the run). `tagline` is the short line shown next
// to the difficulty badge itself (SquadDraft.jsx); `lore` is the
// longer paragraph shown once, the first time a run actually crosses
// into that tier (FormationScreen.jsx's own Act-intro banner) - not
// shown again on every fight within the same tier, just the crossing.
//
// STRUCTURE: expanded 4 -> 7 tiers (feat/hearthwood-7-act-structure) so
// each of Marc's 7 story Acts owns a stretch of the run. Names/taglines/
// lore are drawn from docs/hearthwood-story-acts.md:
//   I ROOTS / II HEARTWOOD / III THE VEIL / IV THE HOLLOW / V THE CROWNLESS
// are Marc's own fully-written Acts. Acts VI (THE ECHO RIFT) and VII
// (THE ECHO VERGE) are only sketched in that doc as post-epilogue "Echo
// Age" / "Echo Verge" eras - their lore here is a minimal placeholder
// derived from those sketches, flagged TODO(marc) for the content pass.
//
// Thresholds are re-spread across run progress 0..1 (nodeIndex /
// (RUN_PATH.length - 1)) - the 7 land at 0 / 0.14 / 0.44 / 0.6 / 0.75 /
// 0.88 / 0.95. They are tuned so the run's three miniboss nodes and its
// final boss land in sensible Acts: RUN_PATH's miniboss at progress
// ~0.09 (Rootkeeper) sits at the end of Act I; the miniboss at ~0.42
// (Heartwood Warden) at the end of Act II; the last band is a short
// final-boss approach.
//
// These are STORY/lore bands only - difficultyFactorForNode's enemy-
// scaling math below is deliberately untouched by this pass, so the act
// boundaries and the ramp's own breakpoints are currently independent.
// A later enemy-tuning pass that wants "each act is a step up in
// pressure on the build" should align the ramp's steps to these seven
// thresholds (Marc's intent), not the other way around.
//
// KNOWN MISMATCH for Marc's content pass: RUN_PATH currently ends on
// the Hollow King (the Act IV boss in the story) as its single final
// node at progress 1.0, so that fight lands in the Act VII band here.
// The 3rd miniboss (Veilbound, an Act III being) also currently sits
// near the run's very end (~0.93), inside the Act VI band. Resolving
// this needs either a RUN_PATH rework (real Act V-VII encounters) or a
// deliberate decision to let the late Acts be pure difficulty/lore
// bands with no dedicated boss node - a call for Marc, not this
// structural pass. `trials.js`'s per-Trial `act` label is descriptive
// text only (nothing reads it), left as-is on purpose.
export const DIFFICULTY_TIERS = [
  {
    threshold: 0,
    name: "Act I · The Outer Grove",
    color: "var(--hw-moss)",
    tagline: "The roots have started to whisper. They know your name.",
    lore: "The trees here still let the light through. But the roots no longer belong only to the forest - something is spreading up through them from below, and the creatures that live off them have turned mean. Whatever is wrong, it did not start in the roots.",
  },
  {
    threshold: 0.14,
    name: "Act II · The Deepening Woods",
    color: "var(--hw-rune)",
    tagline: "The heart is still beating. It beats like something afraid.",
    lore: "Deeper in, the light turns gold and will not hold steady. The forest's own elementals have stopped agreeing with each other, and half of them will not meet your eye. The heart is down here somewhere, and it is hiding - not from the sickness. From you.",
  },
  {
    threshold: 0.44,
    name: "Act III · The Wounded Hearthwood",
    color: "var(--hw-ember)",
    tagline: "Reality has worn thin here. Something looks back through it.",
    lore: "The air trembles like static and the forest shows through it wrong - folded, too far away, seen from an angle that should not exist. This was never rot climbing up from the roots. What crosses your path from here has stopped testing your squad and started testing what holds it together.",
  },
  {
    threshold: 0.6,
    name: "Act IV · The Reckoning",
    color: "var(--hw-hp)",
    tagline: "The forest cannot reach you here. Nothing can.",
    lore: "The ground is not ground anymore, only the memory of it. Every root that tied this place to the living forest has already snapped. What waits at the centre was a guardian once, and it never wanted any of this - and it will turn whatever you have built this far against you all the same.",
  },
  {
    threshold: 0.75,
    name: "Act V · The Crownless",
    color: "var(--hw-curse)",
    tagline: "The king is gone. The crown is still warm.",
    lore: "It is quiet the way a room is quiet just after something has left it. The fighting is over and the forest's heart is beating again - slow, careful, not sure it is allowed to. Someone has to decide what it grows back into, and there is no one else left to ask.",
  },
  {
    // TODO(marc): Act VI lore - placeholder derived from the "Echo Age"
    // sketch in docs/hearthwood-story-acts.md, not a written Act yet.
    threshold: 0.88,
    name: "Act VI · The Echo Rift",
    color: "var(--hw-rune)",
    tagline: "The forest is remembering you now. Remembering you too hard.",
    lore: "The light has gone blue-violet and the roots move to a rhythm that is not fear and is not the crown's command - it is you, breathing. Somewhere ahead a memory has grown heavy enough to tear a hole in the world, and it copies every step you take.",
  },
  {
    // TODO(marc): Act VII lore - placeholder derived from the "Echo
    // Verge" sketch in docs/hearthwood-story-acts.md, not a written Act.
    threshold: 0.95,
    name: "Act VII · The Echo Verge",
    color: "var(--hw-text)",
    tagline: "Memory and the world have stopped being separate things.",
    lore: "This deep there is no line left between what happened and what is here. The forest has stopped asking to be saved and started asking to be understood. Whatever stands at the end of this is waiting for an answer, not a fight - and it may not get one.",
  },
]

export function difficultyTierForNode(nodeIndex, pathLength) {
  const progress = pathLength > 1 ? nodeIndex / (pathLength - 1) : 0
  return [...DIFFICULTY_TIERS].reverse().find((t) => progress >= t.threshold) || DIFFICULTY_TIERS[0]
}

// The 1-based Act number (1..7) for a run position - the index of
// difficultyTierForNode's own result within DIFFICULTY_TIERS, so the
// story Act and the difficulty band can never disagree. Callers pass
// RUN_PATH.length as the denominator (same as every difficultyTierForNode
// call site in the UI: RunMap / SquadDraft / FormationScreen), NOT the
// dynamic runState.path.length.
export function actIndexForNode(nodeIndex, pathLength) {
  const tier = difficultyTierForNode(nodeIndex, pathLength)
  const i = DIFFICULTY_TIERS.indexOf(tier)
  return i < 0 ? 1 : i + 1
}

// "Later Acts are tougher" (feat/hearthwood-act-enemy-sets): a small
// per-Act stat FLOOR multiplier, applied to enemy HP / move damage /
// passive amounts at battle start ON TOP OF difficultyFactorForNode's
// run-progress ramp - it does NOT touch that function's math (see the
// long note on it below), it multiplies its already-computed result at
// the two call sites (startFormationBattle / previewBattleEnemies).
// Deliberately gentle - this pass establishes the SHAPE (a flat-then-
// rising floor across the post-climax Acts); the Act V-VII SAMPLE
// ENEMIES (enemies.js) carry the "meaningfully tougher" weight via
// higher base stats + an extra status mechanic each, and a later
// balance pass tunes both. Acts I-IV are 1.0 (the original game, already
// tuned by difficultyFactorForNode); only the three post-Reckoning Acts
// get a floor, climbing +1% per Act to +3% by Act VII. Tuned against
// .scratch/heartwood-fairness-pass.mjs at n=100 (RUNS=100, 4 Commanders
// = 400 runs): pre-change baseline totalled 87/90/94/94 wins across four
// re-runs; this setting totalled 81/82/88/89. The ~6-win gap in the
// means is inside the harness's own zero-change run-to-run noise (the
// baseline itself swings 87<->94). Per-Commander it stays on the known
// baseline shape (Tommy ~46, Aatos ~9, Fenrir ~20, Repo ~13). If a
// future pass makes it bite, dial these DOWN toward 1.0 - the shape
// matters here, not the size of the step.
export const ACT_STAT_FLOOR = { 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.01, 6: 1.02, 7: 1.03 }

// The battle a node actually fights, Act-corrected. A plain solo
// `battle` node names a fixed enemyId, but the branching path (see
// advanceToNextNode / chooseFloorEncounter above) can carry that fight
// into a LATER or EARLIER battle position than the one RUN_PATH placed
// it at, i.e. into a different Act than its enemyId belongs to. When
// that happens this swaps in an Act-appropriate enemy (enemies.js's
// deterministic actEnemyForNode, seeded by nodeIndex so a reload / a
// fairness re-run resolves the same fight). Formations (no enemyId) and
// miniboss/boss nodes (enemyId bound to a Trial identity) are returned
// exactly as authored - never swapped.
function resolveEncounterId(node, nodeIndex, act, warn = false) {
  if (node.type !== "battle" || !node.enemyId) return node.enemyId || node.formationId
  const belongs = ENEMIES[node.enemyId]?.act
  if (belongs === act) return node.enemyId
  const swapped = actEnemyForNode(act, nodeIndex, null)
  if (!swapped || swapped === node.enemyId) return node.enemyId
  if (warn && typeof console !== "undefined") {
    console.warn(
      `[heartwood] Act-mismatch swap at node ${nodeIndex}: position is Act ${act}, ` +
        `but "${node.enemyId}" belongs to Act ${belongs ?? "?"} - fighting "${swapped}" instead.`,
    )
  }
  return swapped
}

// Shared by startFormationBattle and previewBattleEnemies so the
// pre-battle preview and the real fight can never disagree on which
// enemy or how scaled (there's a whole comment on previewBattleEnemies
// below about that exact drift risk).
function encounterAndFactorFor(runState, warn = false) {
  const node = currentNode(runState)
  const act = actIndexForNode(runState.nodeIndex, RUN_PATH.length)
  // Depths (depths.js): the selected Depth's cumulative enemy multiplier
  // rides on top of the run-progress ramp and the per-Act floor - one
  // more factor on the number startAutoBattle already treats as "how
  // much harder than baseline is this fight."
  const depthMult = depthModifiersFor(runState.selectedDepth || 0).enemyMult
  return {
    encounterId: resolveEncounterId(node, runState.nodeIndex, act, warn),
    difficultyFactor:
      difficultyFactorForNode(runState.nodeIndex, runState.path.length) * (ACT_STAT_FLOOR[act] || 1) * depthMult,
  }
}

// Dev-only: on module load, list every RUN_PATH node whose enemy content
// does not line up with the Act its position falls in - so any future
// RUN_PATH edit or new enemy that breaks Act alignment is visible to
// Marc without anyone having to re-audit by hand. As of this pass the
// static RUN_PATH is fully Act-aligned (every fixed enemyId, and every
// formation piece, belongs to the Act its node sits in) so this logs
// nothing today - it is a regression guard, not a live to-do list. The
// dynamic branching path can still displace a fixed fight into another
// Act at runtime; that case is caught and swapped (with its own warn)
// in startFormationBattle via resolveEncounterId below. Guarded hard so
// it never runs in a production build or a bare-Node import.
if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) {
  try {
    const rows = []
    RUN_PATH.forEach((n, i) => {
      if (n.type === "shop" || n.type === "relic") return
      const act = actIndexForNode(i, RUN_PATH.length)
      if (n.enemyId) {
        const ea = ENEMIES[n.enemyId]?.act
        if (ea !== act)
          rows.push(
            `  node ${i} [${n.type}] "${n.enemyId}" is Act ${ea ?? "?"}, position is Act ${act}` +
              (n.trialId ? ` (Trial "${n.trialId}")` : ""),
          )
      } else if (n.formationId) {
        const pieces = FORMATIONS[n.formationId]?.pieces || []
        const later = [...new Set(pieces.map((p) => p.defId).filter((id) => (ENEMIES[id]?.act ?? 0) > act))]
        if (later.length)
          rows.push(`  node ${i} [formation "${n.formationId}"] has later-Act pieces ${later.join(", ")}, position is Act ${act}`)
      }
    })
    if (rows.length)
      console.warn(`[heartwood] RUN_PATH does not yet fully respect Act enemy sets (${rows.length} node(s)):\n` + rows.join("\n"))
  } catch {
    /* never break module load over a dev diagnostic */
  }
}

// Marc, live, right after the auto-deploy fix (recruitUnit above) shipped:
// "balancing is off now the units destroy enemies so fast." Makes sense -
// every difficulty number in this file was always stress-tested with a
// bot that auto-deployed correctly, so a properly-deployed 5-unit squad
// was the assumption behind every "fair" win-rate this whole session.
// Marc himself never actually got to experience that assumption until
// the auto-deploy fix just now - his real felt-difficulty up to this
// point was closer to a near-solo-Commander run, much harder than
// intended, which is exactly why "make it more challenging" repeatedly
// worked earlier despite a bot already reporting 76-96% win rates for a
// full squad. Now that he's finally seeing the real, correctly-deployed
// game, the SAME numbers read as too easy.
//
// First attempt (0.3 start / +75% cap) was a real overcorrection,
// caught by the same fairness pass before shipping: Tommy stayed at
// 88% (his flat Strength buff scales with damage dealt, so it barely
// notices a harder ramp) while Aatos/Fenrir/Repo's sustain-leaning
// kits collapsed to 48-56% and deaths clustered hard on one specific
// early fight (rune-wardens-escort, 19 of ~100 deaths) - the same
// "flat heal/block loses relative value as enemy damage scales" shape
// documented earlier in this file, just retriggered at a steeper
// setting. A GLOBAL ramp increase widens the Tommy-vs-everyone-else
// gap, it doesn't close it. Backed off to a smaller step (0.45 -> 0.4
// start, +55% -> +65% cap) - still earlier/harder than before, but a
// measured step rather than the same over-aggressive mistake repeated
// at a new pair of numbers.
// Strengthened again (0.4 start/+65% cap -> 0.3 start/+90% cap) after
// autoBattleEngine.js's scaleEnemyHpToSquadDps got loosened (Marc:
// "the game doesnt feel challenging enough it feels like my decisions
// have no impact" - that function used to target a FIXED fight
// length regardless of squad strength, quietly erasing the payoff for
// building well; loosened so it only backstops truly extreme builds
// now). This base ramp is the PRIMARY difficulty driver again as a
// result, same as it was before the DPS-adaptive layer existed, so it
// needs to carry real weight on its own rather than leaning on the
// other mechanism to make up the difference. Re-verified against the
// documented "a global ramp increase widens the Tommy-gap, it doesn't
// close it" risk from the last time this exact lever moved - this
// time the damage-scaling fix (PR #303) means enemies hit harder as
// the ramp climbs too, not just tankier, which changes how sustain-
// vs-offense Commanders each experience a steeper ramp; verified via
// the fairness pass at this exact setting before shipping, not
// assumed safe by analogy to the old HP-only version.
// Marc, live, right after the "decisions matter" rebalance:
// "http://localhost:5173/heartwood is still the same the game is too
// easy." A direct check against that exact server found why - the
// very FIRST fight of every run (Rotwood Husk) came back completely
// unscaled (40 HP, same as the original pre-difficulty-work baseline),
// because this ramp still didn't start until 30% progress. With the
// run now ~43 fights long, that's roughly the first 13 fights with
// ZERO difference from the very beginning of this whole session's
// difficulty work - exactly the fights a player actually experiences
// first and judges "did anything change" by, especially on a fresh
// run. The DPS-adaptive layer (autoBattleEngine.js) didn't
// meaningfully cover for it either at this stage - its own loosened
// 1.5-round floor rarely triggers against an early, still-small
// squad. Removed the flat "no scaling" zone entirely - the ramp now
// starts from node 0, so even the very first fight gets a real,
// felt increase, growing smoothly across the whole run instead of
// snapping on partway through.
export function difficultyFactorForNode(nodeIndex, pathLength) {
  const progress = pathLength > 1 ? nodeIndex / (pathLength - 1) : 0
  // Removing the flat zone (above) technically made the ramp "start"
  // at node 0, but with a run this long (~86 nodes, ~43 fights) a
  // PLAIN linear ramp gives fight 1 a progress of roughly 1/85 - too
  // small a fraction of even a 90% cap to survive Math.round against a
  // real HP number (40 * 1.011 still rounds right back down to 40). A
  // pure sqrt(progress) curve fixed fight 1 (a real, felt ~10% bump
  // immediately) but front-loaded WAY too much of the total budget
  // into the early-mid game - a fresh fairness pass crashed 3 of 4
  // Commanders to 12-44%, including the items-heavy scenario, because
  // sustain/build-up-based kits (Repo especially) need real time to
  // establish their advantage and a front-loaded curve doesn't give
  // them any. A 50/50 blend of sqrt and plain linear was STILL too
  // front-loaded (Repo 28% no-items). Settled on a lighter 25% sqrt /
  // 75% linear blend - still gives fight 1 a real, felt bump (not the
  // literal zero a pure linear ramp gives), just a smaller one, while
  // spending most of the difficulty budget the way the original linear
  // curve did: gradually, across the whole run, not concentrated
  // before the run's own systems (Market Level, relics, item
  // stacking) have had a chance to pay off.
  // Even the lighter blend above (25% sqrt) still ran too hot overall
  // at the +90% cap this whole arc had climbed to (0.4start/+65% ->
  // 0.3start/+90% -> this) - 2 repeat fairness passes both showed the
  // SAME shape, not just noise: Tommy consistently 84-96% while the
  // other 3 sat at 24-44%, his flat Strength scaling with literally
  // everything the ramp throws at it in a way the others' more
  // conditional/sustain kits don't. Pulled the cap back down to +65%
  // (the last value that produced a genuinely even spread, from the
  // "decisions matter" round) while KEEPING the sqrt front-loading -
  // the two problems (fight 1 being flat, and the overall ceiling
  // being too high) turned out to be independent and needed separate
  // fixes, not one bigger number doing both jobs at once.
  //
  // Marc, live: "peli tuntuu vieläkin liian helpolta se voi olla
  // tuplasti vaikeampi" (still feels too easy, could be twice as
  // hard). Doubled the cap (0.65 -> 1.3), matching his own framing
  // literally - the blend shape above stays untouched, only the
  // overall budget the ramp spends grows. See
  // scaleEnemyHpToSquadDps (autoBattleEngine.js) for the matching
  // `/0.65` -> `/1.3` fix this same change requires - that function
  // normalizes THIS factor back to a 0-1 progress using the same cap
  // constant, so the two must move together or the DPS-adaptive layer
  // silently maxes out partway through a run instead of at the real
  // end. Verified via a 100-run fairness pass before/after, per this
  // file's own established discipline for this exact lever - see the
  // Hearthwood master memory log for the actual before/after numbers
  // and whether this specific value (1.3) survived unchanged or got
  // dialed back.
  // Trailing factor is the ramp's total budget - extracted to the
  // RAMP_CAP constant (top of file) so autoBattleEngine.js's
  // normalizer reads back the exact same number. The 0.75 / 0.25
  // inside the parens is the separate linear/sqrt blend weight and is
  // NOT the cap - leave it alone.
  return 1 + (0.75 * progress + 0.25 * Math.sqrt(progress)) * RAMP_CAP
}

// Shared by startFormationBattle and previewBattleEnemies below - both
// need the exact same "bench entry -> startAutoBattle's deployedUnits
// shape" translation, and duplicating it risks the two silently
// drifting apart over time.
function deployedUnitsFor(runState) {
  return runState.deployed
    .filter((key) => key !== null)
    .map((key) => runState.bench.find((e) => e.key === key))
    .filter(Boolean)
    .map((entry) => ({
      defId: entry.defId,
      upgradeLevel: entry.upgradeLevel || 0,
      // Upgrade branches (upgrades.js): the chosen-branch array the
      // battle engine folds via unitDefWithUpgrade.
      upgrades: entry.upgrades || [],
      itemIds: runState.items.filter((it) => it.equippedTo === entry.key).map((it) => it.defId),
    }))
}

export function startFormationBattle(runState) {
  const node = currentNode(runState)
  const commanderItemIds = runState.items.filter((it) => it.equippedTo === "commander").map((it) => it.defId)
  // Act-corrected encounter + per-Act stat floor (see encounterAndFactorFor
  // / ACT_STAT_FLOOR above). warn:true so a branching-path Act mismatch
  // shows once, in dev, when the fight actually starts.
  const { encounterId, difficultyFactor } = encounterAndFactorFor(runState, true)
  const arenaId = arenaForNode(runState.nodeIndex, actIndexForNode(runState.nodeIndex, RUN_PATH.length))
  const battle = startAutoBattle(
    runState.characterId,
    deployedUnitsFor(runState),
    encounterId,
    runState.relics,
    runState.commanderRank || 0,
    runState.relicLevels || {},
    commanderItemIds,
    // Commander Active Power (activateCommanderPower above): consumed here,
    // exactly once, by the very next battle that starts - RUN_PATH
    // never places a "relic" node directly after a "shop" node (every
    // relic node sits between a battle and the following shop), so a
    // queued effect from a shop visit is always guaranteed to reach
    // this call with nothing able to strand it in between. Run Modifiers
    // (boons.js) ride the SAME channel but are permanent - re-expanded
    // and appended here at the start of every battle, never consumed.
    [...(runState.pendingActiveEffects || []), ...expandRunModifierEffects(runState.runModifiers)],
    difficultyFactor,
    arenaId,
    // Forest Mood (moods.js) - the world posture the Act crossroads set
    // now drives a live per-battle meter.
    runState.forestState || "restless",
  )
  const named = applyTrialName(battle, node)
  return {
    ...runState,
    phase: "battle",
    battle: named,
    pendingActiveEffects: [],
    // Almanac: every piece the fight actually resolved (mooks, minibosses,
    // bosses, formation pieces - startAutoBattle flattens them all).
    seen: noteSeen(runState.seen, "enemies", ...named.enemies.map((e) => e.defId)),
  }
}

// A Trial (trials.js) wraps an existing enemy's combat with a real story
// identity - this is the one place that identity reaches the actual
// fight: renaming the matching piece(s) so the battlefield says
// "Rootkeeper," not "Deepwarden," while every stat/move/passive on the
// piece stays exactly what the wrapped enemy def already has.
function applyTrialName(battle, node) {
  const trial = resolveTrial(node.trialId)
  if (!trial) return battle
  return {
    ...battle,
    enemies: battle.enemies.map((e) => (e.defId === trial.enemyId ? { ...e, name: trial.title } : e)),
  }
}

// FormationScreen.jsx's pre-battle enemy preview used to always show
// ENEMIES[defId]'s raw, unscaled maxHp - the difficulty ramp and (now)
// scaleEnemyHpToSquadDps (autoBattleEngine.js) have only ever applied
// once startAutoBattle actually runs, so the preview could promise one
// HP number and the real fight show a very different one the moment it
// started, especially now that a strong squad's own DPS can push
// enemy HP well past the ramp's own number - reads as a bug ("the
// enemy just got way tankier") rather than the intended "your build
// is being taken seriously." Rather than re-implement the squad-DPS
// estimate a second time in the UI layer (a real drift risk as either
// copy evolves), this runs the EXACT SAME startAutoBattle a real
// battle would, with the exact same arguments startFormationBattle
// above uses, and hands back just the resulting enemies - a real dry
// run, not an approximation, discarded immediately after. Pure/
// side-effect-free like every other read in this file, safe to call
// on every render.
// The arena hazard for the fight the run is currently standing in front
// of, resolved id -> full arena object (arenas.js). Pure - safe for the
// FormationScreen preview to call on every render, and it uses the
// exact same arenaForNode(nodeIndex, act) the real fight does so the
// preview and the battle can never disagree.
export function arenaForRun(runState) {
  if (!runState) return null
  const id = arenaForNode(runState.nodeIndex, actIndexForNode(runState.nodeIndex, RUN_PATH.length))
  return arenaById(id)
}

export function previewBattleEnemies(runState) {
  const node = currentNode(runState)
  const commanderItemIds = runState.items.filter((it) => it.equippedTo === "commander").map((it) => it.defId)
  // Same Act-corrected encounter + per-Act stat floor the real fight
  // uses (encounterAndFactorFor above) - warn:false so this render-time
  // dry run stays silent.
  const { encounterId, difficultyFactor } = encounterAndFactorFor(runState, false)
  const arenaId = arenaForNode(runState.nodeIndex, actIndexForNode(runState.nodeIndex, RUN_PATH.length))
  const battle = startAutoBattle(
    runState.characterId,
    deployedUnitsFor(runState),
    encounterId,
    runState.relics,
    runState.commanderRank || 0,
    runState.relicLevels || {},
    commanderItemIds,
    runState.pendingActiveEffects || [],
    difficultyFactor,
    arenaId,
    runState.forestState || "restless",
  )
  return applyTrialName(battle, node).enemies
}

// Scout Ahead (DifficultyEngine Phase 1, PRD "Progressiivinen haasteen
// nousu ja skaalaus" sections 42-43 - the long-queued "pay to scout").
// Spend Essence to reveal the NEXT battle node's threat band + your
// power read RELATIVE to that fight, on the Run Map, before you commit.
// Pure info: nothing here touches combat. Cost scales flat per Act.
export const SCOUT_BASE_COST = 60

export function scoutCost(runState) {
  return SCOUT_BASE_COST * actIndexForNode(runState.nodeIndex || 0, RUN_PATH.length)
}

// The RUN_PATH index of the next fight after the player's position, or
// null if there is none left. "Fight" = battle / elite / miniboss / boss.
export function nextBattleNodeIndex(runState) {
  const FIGHT = new Set(["battle", "elite", "miniboss", "boss"])
  for (let i = (runState.nodeIndex || 0) + 1; i < RUN_PATH.length; i++) {
    if (FIGHT.has(RUN_PATH[i]?.type)) return i
  }
  return null
}

export function scoutAhead(runState) {
  const next = nextBattleNodeIndex(runState)
  if (next == null || next <= (runState.scoutedThrough || 0)) return runState
  const cost = scoutCost(runState)
  if ((runState.essence || 0) < cost) return runState
  return { ...runState, essence: runState.essence - cost, scoutedThrough: next }
}

// Field Antidote (feat/hearthwood-rot - the answer to The Rot's poison
// drip): a shop CONSUMABLE, not a permanent Ledger investment or a
// unit/item. Pay Essence to queue a squad-wide `regen 2` for the NEXT
// battle only, riding the existing pendingActiveEffects channel (the
// Commander-Active-Power / event-`squadNextBattle` shape) - consumed +
// cleared by startFormationBattle. One queued at a time; cost scales
// flat per Act (the scoutCost shape). No new save key.
export const ANTIDOTE_BASE_COST = 50
const ANTIDOTE_EFFECT = { type: "applyBuff", id: "regen", amount: 2 }

export function antidoteCost(runState) {
  return ANTIDOTE_BASE_COST * actIndexForNode(runState.nodeIndex || 0, RUN_PATH.length)
}

export function antidoteQueued(runState) {
  return (runState.pendingActiveEffects || []).some(
    (e) => e.type === "applyBuff" && e.id === "regen" && e.amount === ANTIDOTE_EFFECT.amount,
  )
}

export function buyAntidote(runState) {
  if (antidoteQueued(runState)) return runState
  const cost = antidoteCost(runState)
  if ((runState.essence || 0) < cost) return runState
  return {
    ...runState,
    essence: runState.essence - cost,
    pendingActiveEffects: [...(runState.pendingActiveEffects || []), { ...ANTIDOTE_EFFECT }],
  }
}

// A relic node only ever offers 3 choices, rolled once - this lets the
// player pay to see a fresh 3 instead, the same "spend Essence for
// another option" shape rerollShop already gives the unit shop.
export function rerollRelicOffers(runState) {
  if (runState.essence < RELIC_REROLL_COST) return runState
  const nextRerolls = (runState.relicRerolls || 0) + 1
  return {
    ...runState,
    essence: runState.essence - RELIC_REROLL_COST,
    relicRerolls: nextRerolls,
    relicOffers: rollRelics(
      runState.relics,
      benchTribeCounts(runState),
      streamRng(runState.seed, "loot", `${runState.nodeIndex}:${nextRerolls}`),
    ),
  }
}

// Leaving a "relic" node: `relicId` is null for Skip. Relics don't
// stack with themselves, so rollRelics already excludes anything
// already owned - no need to guard against picking a duplicate here.
// `relicId: null` is always Skip, free. A real pick costs Essence
// (relics.js's RELIC_COST) - if the player can't afford it, treat the
// click as a no-op rather than silently letting them take it anyway
// (same "just don't respond" guard recruitUnit already uses for an
// unaffordable unit).
export function chooseRelic(runState, relicId) {
  if (relicId) {
    const relic = RELICS[relicId]
    if (!relic || runState.essence < relic.cost) return runState
  }

  const essence = relicId ? runState.essence - RELICS[relicId].cost : runState.essence
  const relics = relicId ? [...runState.relics, relicId] : runState.relics
  const seen = relicId ? noteSeen(runState.seen, "relics", relicId) : runState.seen // Almanac
  const advanced = advanceToNextNode(runState)
  // A pending "choice" (see advanceToNextNode above) is never a shop -
  // it's always a battle position mid-decision - so the shop-entry
  // side effects below always correctly no-op for it.
  const nextNode = advanced.phase === "choice" ? null : advanced.path[advanced.path.length - 1]
  const enteringShop = nextNode?.type === "shop"
  // Market Events (feat/hearthwood-market-events): pick the special
  // market (if any) for this shop, seeded from the node position.
  const mktEvent = enteringShop ? pickMarketEvent(runState.seed, advanced.nodeIndex, hasTradersCompass(runState)) : null
  const mktArgs = marketEventRollArgs(mktEvent, runState)
  return {
    ...runState,
    ...advanced,
    essence,
    relics,
    seen,
    marketEvent: enteringShop ? mktEvent : null,
    // Freeze (startRun's own note): kept as-is when entering a shop
    // instead of re-rolling, then consumed (cleared) regardless -
    // one-shot, not persistent.
    shopOffers: enteringShop
      ? runState.frozen
        ? runState.shopOffers
        : rollShop(
            runState.marketLevel || 1,
            benchTribeCounts(runState),
            mktArgs.slotBonus,
            streamRng(runState.seed, "shop", `${advanced.nodeIndex}:${styleN(runState, "rerolls")}`),
            mktArgs.tier,
          )
      : runState.shopOffers,
    itemOffers: enteringShop ? rollItemShop(streamRng(runState.seed, "item", String(advanced.nodeIndex))) : runState.itemOffers,
    frozen: enteringShop ? false : runState.frozen,
    rerollCost: REROLL_BASE_COST,
    // Commander Active Power (activateCommanderPower above): a new shop
    // visit means a fresh use, same boundary rerollCost's own reset
    // just above already marks.
    activePowerUsedThisShop: false,
    relicOffers: null,
  }
}

export function advanceRound(runState) {
  return { ...runState, battle: resolveRound(runState.battle) }
}

// --- Act V: The Crownless (crownless.js / trials.js "the-crownless") ---
// The whole sequence runs while `phase` stays "victory" - it is a
// post-run finale, not a run node. `actFive` drives which screen
// HeartwoodBattle renders on top of the victory state; the functions
// below only ever touch Act V fields (+ `battle` for the one fight),
// never `phase` / `nodeIndex` / `path`, so nothing about the finished
// run can be disturbed.

// Armed by HeartwoodBattle's victory effect. Guarded so it can only
// begin from a real victory and only once (the effect also checks
// `!runState.actFive`).
export function startActFive(runState) {
  if (runState.phase !== "victory" || runState.actFive) return runState
  return { ...runState, actFive: "throne" }
}

// The build-mirror fight. Same startAutoBattle a real battle uses, with
// the run's actual deployed squad / relics / permanent Run Modifiers,
// scaled to the run's final difficulty. `arenaId` null (no arena this
// deep). `phase` stays "victory".
export function startCrownlessBattle(runState) {
  const commanderItemIds = runState.items.filter((it) => it.equippedTo === "commander").map((it) => it.defId)
  const squad = deployedUnitsFor(runState)
  const battle = startAutoBattle(
    runState.characterId,
    squad,
    // Fallback formation (formations.js) for the edge case of an empty
    // deployed squad; normally the mirror below is what fights.
    "the-crownless-mirror",
    runState.relics,
    runState.commanderRank || 0,
    runState.relicLevels || {},
    commanderItemIds,
    expandRunModifierEffects(runState.runModifiers),
    difficultyFactorForNode(RUN_PATH.length - 1, RUN_PATH.length),
    null,
    runState.forestState || "restless",
    // The Crownless IS your build: a real 1:1 clone of your deployed
    // squad on the enemy side (autoBattleEngine builds it from UNIT
    // defs). Empty -> falls back to the curated formation above.
    squad,
  )
  return { ...runState, actFive: "crownless", battle: applyTrialName(battle, { trialId: "the-crownless" }) }
}

// Ends the Crownless fight - win OR loss both move on to the Forest's
// Choice ("defeat yourself, or accept yourself"). `crownlessWon` only
// colours the epilogue framing.
export function endCrownlessBattle(runState) {
  return { ...runState, actFive: "choice", crownlessWon: runState.battle?.phase === "won", battle: null }
}

// The player's final call on the Forest's Choice screen - overrides the
// cinematics.suggestedEndingId tally.
export function chooseForestPath(runState, endingId) {
  return { ...runState, actFive: "done", chosenEnding: endingId }
}

export function markEchoEpilogueSeen(runState) {
  return { ...runState, echoEpilogueSeen: true }
}

export function autoResolve(runState) {
  return { ...runState, battle: autoResolveBattle(runState.battle) }
}

// Permadeath: any loss ends the run. A regular win banks Essence and
// moves to the next node; the boss's win ends the run in victory.
// A formation fight (multiple pieces, often a shielding puzzle) is a
// harder win than a solo mook - Marc asked for the game to feel more
// rewarding, and a flat payout regardless of difficulty never
// reflected that. Exported so the UI can show "you'll earn N Essence"
// on the victory screen itself (see ResultOverlay.jsx), not just apply
// it silently - the same number resolveBattleOutcome actually pays out.
export function essenceForWin(runState, node) {
  const essenceBonus = runState.relics.reduce((sum, id) => sum + (RELICS[id]?.essenceBonus || 0), 0)
  const difficultyBonus =
    node?.type === "miniboss"
      ? MINIBOSS_BONUS_ESSENCE
      : node?.type === "elite"
        ? ELITE_BONUS_ESSENCE
        : node?.formationId
          ? FORMATION_BONUS_ESSENCE
          : 0
  // Essence Flow (metaPerks.js) - a flat per-win bonus from the meta board.
  // ledgerWinBonus: the Ledger Account investment (buyInvestment) - a
  // flat per-win bump, same shape as the meta board's Essence Flow perk.
  // economyBranchBonus: the Economy upgrade branch (upgrades.js) - each
  // deployed unit that took it adds ECONOMY_WIN_BONUS. Read here so the
  // pre-battle "you'll earn N" preview shows it too.
  const economyBranchBonus = (runState.deployed || [])
    .filter((k) => k !== null)
    .map((k) => runState.bench.find((e) => e.key === k))
    .filter((e) => e && (e.upgrades || []).includes("economy"))
    .reduce((sum) => sum + ECONOMY_WIN_BONUS, 0)
  // Economy crew (economy.js): a deployed Hollow Forager adds a flat
  // per-non-boss-win payout. Same "read from the deployed board" shape
  // as economyBranchBonus, and flows into the pre-battle preview too.
  const economyCrewWinBonus = economyCrewEffects(runState).winBonus
  const flat =
    WIN_ESSENCE +
    difficultyBonus +
    essenceBonus +
    (runState.metaWinBonus || 0) +
    (runState.ledgerWinBonus || 0) +
    economyBranchBonus +
    economyCrewWinBonus
  // Run Modifiers (boons.js): some boons/banes carry an Essence-per-win %
  // (e.g. Hollow-Marked trades a Weak start for +30% spoils) - a real
  // risk/reward lever, applied last on top of the flat total.
  const modPct = runModifierWinPct(runState.runModifiers)
  return modPct ? Math.round(flat * (1 + modPct)) : flat
}

// Essence interest (Marc: "kehitetään kauppaan lisää syvyyttä" ->
// "säästä vai käytä -jännite" -> "korko koko saldolle, TFT-tyyli").
// The Essence you carry INTO a fight grows a little on a win, capped -
// so every shop is now "spend this down, or let the pile compound".
// Deterministic, pure, arithmetic on a balance; paid once in the
// post-win resolve (resolveBattleOutcome), never mid-combat, never on a
// boss win (the run ends there). No new runState field - the Essence
// balance IS the bank, exactly like TFT gold.
export const INTEREST_RATE = 0.1 // 10% (TFT standard)
export const INTEREST_THRESHOLD = 150 // ~3 banked commons before it kicks in
export const INTEREST_CAP = 150 // one rare's worth per win - bounds the snowball

export function bankInterest(essence, threshold = INTEREST_THRESHOLD) {
  if (!essence || essence < threshold) return 0
  return Math.min(INTEREST_CAP, Math.floor(essence * INTEREST_RATE))
}

// bankInterest with a deployed Acorn Banker (economy.js) taken into
// account - it lowers the threshold at which interest starts. Every
// runState-having call site uses this so the badge, the coach trigger,
// the pre-battle preview and the post-win payout all agree.
export function bankInterestFor(runState) {
  return bankInterest(runState.essence, economyCrewEffects(runState).interestThreshold)
}

// Re-exported so the UI has one import site for the economy-crew read
// (mirrors how the shop components already pull bankInterest / the
// Ledger helpers from this module).
export { economyCrew, economyCrewEffects }

// Death Memory (Marc's PRD: a lost hero should leave something behind
// instead of just vanishing) - built once, at the exact moment
// described in the "Permadeath" comment above: a LOST FIGHT, which is
// the only kind of hero loss that's actually permanent in this engine.
// An individual unit hitting 0 HP mid-fight (autoBattleEngine.js's own
// `hp <= 0` checks) is NOT what this hooks - that unit simply stops
// acting for the rest of THAT fight and returns at full HP next battle
// (see units.js's unit() comment: "units always start a fight at full
// HP"); nothing is permanently removed from the bench on a mid-fight
// KO, so there is nothing there worth memorializing. A run-ending
// defeat is the one moment this roster actually, permanently ends.
//
// Picks whichever deployed unit best represents what was lost: prefer
// a squad member with a named Class identity (units.js's className,
// Guild Identity v1 above) since that's the thing worth naming in the
// memory, falling back to the Commander (always present, the one
// constant identity across the whole run) when the fallen squad had
// none. Highest recruitCost among class-bearing candidates reads as
// "most invested-in" - a reasonable stand-in for "most mourned"
// without inventing new per-unit death tracking this small a pass
// shouldn't need.
function buildDeathMemory(runState) {
  const commander = CHARACTERS[runState.characterId]
  const deployedDefs = runState.deployed
    .map((key) => (key === null ? null : runState.bench.find((e) => e.key === key)))
    .filter(Boolean)
    .map((entry) => UNITS[entry.defId])
    .filter(Boolean)
  const classed = deployedDefs.filter((d) => d.className)
  const pool = classed.length ? classed : deployedDefs
  const pick = pool.length ? pool.reduce((best, d) => ((d.recruitCost || 0) > (best.recruitCost || 0) ? d : best)) : null

  return {
    heroName: pick?.name || commander?.name || "The squad",
    heroClass: pick?.className || null,
    commanderName: commander?.name || null,
    ts: Date.now(),
  }
}

export function resolveBattleOutcome(runState) {
  const battle = runState.battle
  if (!battle) return runState

  // deathMemory: attached here (not written to localStorage - this
  // module is pure, see the file-header comment) so the page can both
  // show it immediately on RunEndOverlay.jsx and persist it via
  // runSaveState.js's saveLastRun for the NEXT run to honor.
  if (battle.phase === "lost") return { ...runState, phase: "defeat", deathMemory: buildDeathMemory(runState) }

  if (battle.phase === "won") {
    const node = currentNode(runState)
    // The boss win ends the run before Evolution runs (nothing left to
    // grow into) - deliberate.
    if (node.type === "boss") return { ...runState, phase: "victory" }

    // Unit Evolution (evolutions.js): tally this win onto every deployed
    // bench entry, then let any that now meet their condition grow in
    // place. Everything after this reads the post-evolution `rs`.
    const withWins = {
      ...runState,
      bench: runState.bench.map((e) =>
        runState.deployed.includes(e.key) ? { ...e, wins: (e.wins || 0) + 1 } : e,
      ),
    }
    const { runState: evoRs, evolved } = applyEvolutions(withWins)
    const rs = evolved.length ? { ...evoRs, lastEvolved: evolved } : evoRs

    const advanced = advanceToNextNode(rs)
    // A pending "choice" (see advanceToNextNode above) is never a shop
    // or relic node - it's always a battle position mid-decision - so
    // the shop/relic-entry side effects below always correctly no-op.
    const nextNode = advanced.phase === "choice" ? null : advanced.path[advanced.path.length - 1]
    const enteringShop = nextNode?.type === "shop"
    // Market Events (feat/hearthwood-market-events): the seeded special
    // market (if any) for the shop being entered after this win.
    const mktEvent = enteringShop ? pickMarketEvent(rs.seed, advanced.nodeIndex, hasTradersCompass(rs)) : null
    const mktArgs = marketEventRollArgs(mktEvent, rs)
    // Interest (bankInterest) is on the balance carried INTO this
    // fight - rs.essence here, before the win payout is added on top
    // (TFT order: interest on held gold, then round income).
    const wonEssence = rs.essence + essenceForWin(rs, node) + bankInterestFor(rs)
    // Playstyle history (styleLog): a grind = a win that ran 8+ rounds;
    // maxEssence tracks the run's peak balance (a steadier "hoarder"
    // signal than the instantaneous number).
    const styleLog = {
      ...(rs.styleLog || {}),
      grinds: (rs.styleLog?.grinds || 0) + ((runState.battle?.round || 0) >= 8 ? 1 : 0),
      maxEssence: Math.max(rs.styleLog?.maxEssence || 0, wonEssence),
    }
    return {
      ...rs,
      ...advanced,
      styleLog,
      essence: wonEssence,
      marketEvent: enteringShop ? mktEvent : null,
      shopOffers: enteringShop
        ? rs.frozen
          ? rs.shopOffers
          : rollShop(
              rs.marketLevel || 1,
              benchTribeCounts(rs),
              mktArgs.slotBonus,
              streamRng(rs.seed, "shop", `${advanced.nodeIndex}:${styleN(rs, "rerolls")}`),
              mktArgs.tier,
            )
        : rs.shopOffers,
      itemOffers: enteringShop ? rollItemShop(streamRng(rs.seed, "item", String(advanced.nodeIndex))) : rs.itemOffers,
      frozen: enteringShop ? false : rs.frozen,
      relicOffers:
        nextNode?.type === "relic"
          ? rollRelics(rs.relics, benchTribeCounts(rs), streamRng(rs.seed, "loot", `${advanced.nodeIndex}:${rs.relicRerolls || 0}`))
          : rs.relicOffers,
      rerollCost: REROLL_BASE_COST,
      activePowerUsedThisShop: false,
      battle: null,
    }
  }

  return runState
}

// Persistence (Marc, direct: reloading the page loses all run progress,
// "that needs to change"). Storage MECHANICS (localStorage get/set,
// try/catch) live in runSaveState.js; this module owns the SHAPE, since
// it already owns startRun's shape and is the one place that knows what
// a valid runState looks like.
//
// `path` USED to be droppable and rebuilt on load by just re-attaching
// the static RUN_PATH constant, since every run produced the exact
// same one. That's no longer true (see advanceToNextNode's own comment
// above) - which battle landed at which position is now a real,
// choice-driven, per-run outcome, so `path` (and the still-pending
// `battlePool`/`floorChoices`) must be saved for real. Bumped
// RUN_SAVE_VERSION so an old (pre-branching) save fails the version
// check cleanly and falls through to character select instead of being
// misread as a graph-shaped one - not a sign persistence itself broke.
//
// Saving mid-battle (battle is NOT stripped) is deliberate, not an
// oversight: skipping battle saves would let a reload re-roll a losing
// fight before it resolves - a real hole in a permadeath game. A reload
// mid-fight resumes the exact same fight; a reload right after death
// still shows the death. Confirmed the battle state startAutoBattle
// produces (autoBattleEngine.js) is plain data throughout - grid,
// commanderDef, enemyDefs are all plain objects/arrays, never functions
// or class instances - so a JSON round-trip is lossless.
// Bumped 2 -> 3: RUN_PATH gained "event" nodes and runState gained
// storyFlags/seenEvents, so a pre-event save can't be read by this build.
export const RUN_SAVE_VERSION = 3

export function serializeRun(runState) {
  if (!runState) return null
  return { version: RUN_SAVE_VERSION, savedAt: Date.now(), run: runState }
}

const VALID_PHASES = new Set(["shop", "relic", "event", "formation", "battle", "choice", "victory", "defeat"])

// Any failure here - wrong version, corrupted JSON, a shape that
// doesn't match what this build of the game expects - returns null and
// falls through to character select. Never throws, never crashes the
// app on a stale or hand-edited save.
export function deserializeRun(saved) {
  if (!saved || saved.version !== RUN_SAVE_VERSION) return null
  const run = saved.run
  if (!run || typeof run !== "object") return null
  if (!CHARACTERS[run.characterId]) return null
  if (!VALID_PHASES.has(run.phase)) return null
  if (typeof run.nodeIndex !== "number" || run.nodeIndex < 0 || run.nodeIndex >= RUN_PATH.length) return null
  if (!Array.isArray(run.path) || run.path.length !== run.nodeIndex + 1) return null
  if (!Array.isArray(run.battlePool)) return null
  return run
}
