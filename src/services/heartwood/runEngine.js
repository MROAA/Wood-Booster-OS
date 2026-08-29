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
import { RELICS, relicPool, RELIC_REROLL_COST } from "../../data/heartwood/relics"
import { ITEMS, ITEM_SLOTS, itemPool } from "../../data/heartwood/items"
import { CHARACTERS, commanderRankCost } from "../../data/heartwood/characters"
import { tribesOf } from "../../data/heartwood/synergies"
import { resolveTrial } from "../../data/heartwood/trials"
import { startAutoBattle, resolveRound, autoResolveBattle } from "./autoBattleEngine"

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
export const RUN_PATH = [
  { type: "shop" },
  { type: "battle", formationId: "rotwood-husk-pair" },
  { type: "shop" },
  { type: "battle", enemyId: "drowned-siren" },
  { type: "shop" },
  { type: "battle", enemyId: "mist-growler" },
  { type: "shop" },
  { type: "battle", formationId: "mist-growler-pack" },
  { type: "relic" },
  { type: "shop" },
  { type: "miniboss", enemyId: "deepwarden", trialId: "rootkeeper" },
  { type: "shop" },
  { type: "battle", enemyId: "bark-brute" },
  { type: "shop" },
  { type: "battle", enemyId: "moss-troll" },
  { type: "shop" },
  { type: "battle", enemyId: "bloomrot-stalker" },
  { type: "shop" },
  { type: "battle", enemyId: "rootbind-thicket" },
  { type: "shop" },
  { type: "battle", enemyId: "witherfang" },
  { type: "shop" },
  { type: "battle", enemyId: "thornspite" },
  { type: "shop" },
  { type: "battle", enemyId: "bramblehide" },
  { type: "shop" },
  { type: "battle", enemyId: "emberwrack" },
  { type: "shop" },
  { type: "battle", formationId: "embers-bulwark" },
  { type: "shop" },
  { type: "battle", enemyId: "duskgnaw" },
  { type: "shop" },
  { type: "battle", enemyId: "cragfang" },
  { type: "shop" },
  { type: "battle", enemyId: "stormroot" },
  { type: "shop" },
  { type: "battle", enemyId: "duskmoth" },
  { type: "shop" },
  { type: "battle", enemyId: "hollowfen" },
  { type: "shop" },
  { type: "battle", enemyId: "quillfang" },
  { type: "shop" },
  { type: "battle", enemyId: "ironmaw" },
  { type: "shop" },
  { type: "battle", enemyId: "gravemaw" },
  { type: "shop" },
  { type: "miniboss", enemyId: "thornmaw", trialId: "heartwood-warden" },
  { type: "shop" },
  { type: "battle", enemyId: "duskhollow" },
  { type: "shop" },
  { type: "battle", enemyId: "needlefen" },
  { type: "shop" },
  { type: "battle", formationId: "the-wearing-down" },
  { type: "shop" },
  { type: "battle", enemyId: "wraithgale" },
  { type: "shop" },
  { type: "battle", enemyId: "stonewake" },
  { type: "shop" },
  { type: "battle", enemyId: "gravequill" },
  { type: "shop" },
  { type: "battle", enemyId: "bonewarden" },
  { type: "shop" },
  { type: "battle", enemyId: "mossveil" },
  { type: "shop" },
  { type: "battle", enemyId: "hollowspite" },
  { type: "shop" },
  { type: "battle", enemyId: "ashenmaw" },
  { type: "shop" },
  { type: "battle", enemyId: "duskwither" },
  { type: "shop" },
  { type: "battle", enemyId: "hollowfang" },
  { type: "shop" },
  { type: "battle", enemyId: "rootward" },
  { type: "shop" },
  { type: "battle", enemyId: "briarmaw" },
  { type: "shop" },
  { type: "battle", enemyId: "bramblespite" },
  { type: "shop" },
  { type: "battle", enemyId: "thornfen" },
  { type: "shop" },
  { type: "battle", enemyId: "hollowcurse" },
  { type: "shop" },
  { type: "battle", enemyId: "grimspite" },
  { type: "shop" },
  { type: "battle", enemyId: "ironroot" },
  { type: "shop" },
  { type: "battle", formationId: "bark-brutes-stand" },
  { type: "shop" },
  { type: "battle", formationId: "sirens-bodyguard" },
  { type: "relic" },
  { type: "shop" },
  { type: "battle", formationId: "the-undertow" },
  { type: "shop" },
  { type: "battle", formationId: "twin-watch" },
  { type: "shop" },
  { type: "battle", formationId: "rune-wardens-escort" },
  { type: "relic" },
  { type: "shop" },
  { type: "battle", formationId: "quillfangs-warren" },
  { type: "shop" },
  { type: "battle", formationId: "bonewardens-watch" },
  { type: "shop" },
  { type: "miniboss", enemyId: "wyrmgall", trialId: "veilbound" },
  { type: "shop" },
  { type: "battle", formationId: "the-hollow-court" },
  { type: "shop" },
  { type: "battle", formationId: "the-cursed-thicket" },
  { type: "battle", formationId: "the-unbroken-root" },
  { type: "battle", formationId: "the-withering-pact" },
  { type: "shop" },
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
// already 4 pre-rescale (same value as MARKET_LEVEL_BASE_COST), so the
// strict rescale landed all three on the same clean 250 - the exact
// same RATIO as before (start with, and earn per win, exactly one
// Level-Up's worth). Marc, playing it: "aloitus essencea pitää saada
// enemmän kun kaikki maksaa nyt reilusti enemmän" (starting Essence
// needs to be more now that everything costs a lot more) - the ratio
// was preserved correctly, but it never felt right to begin with:
// spending the ENTIRE starting pool on one single Level-Up (with
// nothing left for even one recruit) reads as a worse opening now that
// 250 is a real, felt number instead of an abstract "4". Bumped
// START_ESSENCE alone, independent of the other three (which stay
// exactly matched to the reference plaques) - enough to Level Up once
// AND still recruit something, or skip leveling and recruit ~6-7
// common units instead. WIN_ESSENCE is untouched - this is about
// opening flexibility, not the ongoing per-battle income rate.
//
// 450 turned out too generous once actually played - Marc, right
// after: "alkuessenceä on nyt liikaa vähennetään sitä puolella" (there's
// too much starting Essence now, cut it in half), then refined to an
// explicit number: "tai vähennetään alkuessence 200" (or reduce
// starting essence to 200). Using his explicit number over the
// half-of-450 math (225) - still comfortably above one common recruit
// (65) with change left, but no longer stretches to a free Level-Up.
const START_ESSENCE = 200
const WIN_ESSENCE = 250
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
const FORMATION_BONUS_ESSENCE = 125
// Minibosses (Deepwarden, Thornmaw, Wyrmgall) are a harder win than even a
// formation fight - a bigger payout than FORMATION_BONUS_ESSENCE, same
// "reward matches difficulty" reasoning essenceForWin's own note gives.
// Essence rescale: was 3, now 190 (units.js's TIER_COST "3-family").
const MINIBOSS_BONUS_ESSENCE = 190
const SHOP_SIZE = 4
// Essence rescale: was 1, now 65 (units.js's TIER_COST "1-family" -
// same value as a common unit's recruit cost). REROLL_INCREMENT (used
// by rerollShop below) was an inline `+ 1` matching this same base
// value - pulled into its own named constant, still equal to
// REROLL_BASE_COST, so a reroll's rising cost keeps stepping by
// exactly one "common unit's worth" of Essence each time within a
// shop visit, same relative shape as before.
const REROLL_BASE_COST = 65
const REROLL_INCREMENT = 65
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
export const MEMORY_ESSENCE_BONUS = 65

function currentNode(runState) {
  return runState.path[runState.nodeIndex]
}

function phaseForNode(node) {
  if (node?.type === "shop") return "shop"
  if (node?.type === "relic") return "relic"
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
function battleSlotsOf(runPath) {
  return runPath.filter((n) => n.type === "battle")
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
function rollRelics(ownedRelicIds, tribeCounts = {}) {
  const pool = relicPool().filter((r) => !ownedRelicIds.includes(r.id))
  const matchingAnchor = pool.filter((r) => r.tribeAnchor && (tribeCounts[r.tribeAnchor] || 0) > 0)
  const anyAnchor = pool.filter((r) => r.tribeAnchor)
  const guaranteedPool = matchingAnchor.length ? matchingAnchor : anyAnchor
  const guaranteed = shuffled(guaranteedPool).slice(0, Math.min(1, guaranteedPool.length))
  const guaranteedIds = new Set(guaranteed.map((r) => r.id))
  const rest = shuffled(pool.filter((r) => !guaranteedIds.has(r.id))).slice(0, 3 - guaranteed.length)
  return shuffled([...guaranteed, ...rest]).map((r) => r.id)
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
function rollShop(marketLevel, tribeCounts = {}) {
  const allowedTiers = MARKET_LEVEL_UNLOCKS[marketLevel] || MARKET_LEVEL_UNLOCKS[1]
  const pool = Object.values(UNITS).filter((u) => !u.fusedFrom && !u.summonOnly && allowedTiers.includes(u.tier))
  const matching = pool.filter((u) => tribesOf(u.id, u).some((t) => (tribeCounts[t] || 0) > 0))
  const guaranteed = shuffled(matching).slice(0, Math.min(1, matching.length))
  const guaranteedIds = new Set(guaranteed.map((u) => u.id))
  const rest = shuffled(pool.filter((u) => !guaranteedIds.has(u.id))).slice(0, SHOP_SIZE - guaranteed.length)
  return shuffled([...guaranteed, ...rest]).map((u) => u.id)
}

function shuffled(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
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
// SHOP_SIZE (the unit row, below) so both rows read as the same
// weight of decision rather than the item row visually dominating.
const ITEM_SHOP_SIZE = 4

function rollItemShop() {
  const all = itemPool()
  const bending = all.filter((i) => i.bendsRoleTo)
  const guaranteed = shuffled(bending).slice(0, Math.min(1, bending.length))
  const guaranteedIds = new Set(guaranteed.map((i) => i.id))
  const rest = shuffled(all.filter((i) => !guaranteedIds.has(i.id))).slice(0, ITEM_SHOP_SIZE - guaranteed.length)
  return shuffled([...guaranteed, ...rest]).map((i) => i.id)
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
export function startRun(characterId, carriedMemory = null) {
  return {
    characterId,
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
    // ready to be offered as choices as the run reaches each battle
    // position.
    path: [RUN_PATH[0]],
    battlePool: battleSlotsOf(RUN_PATH),
    floorChoices: null,
    nodeIndex: 0,
    phase: "shop",
    marketLevel: 1,
    shopOffers: rollShop(1),
    // Item shop rotation (rollItemShop above) - regenerates alongside
    // shopOffers at every new shop visit (chooseRelic/
    // resolveBattleOutcome below), but deliberately NOT on a paid unit
    // Reroll (rerollShop) - that button pays to reroll the UNIT
    // offers specifically, not a free item refresh riding along with it.
    itemOffers: rollItemShop(),
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
    // Items (items.js): a shared owned bag, separate from the bench -
    // `equippedTo`/`slotIndex` point at a bench key + slot index (see
    // equipItem/unequipItem below) or sit null while unequipped.
    items: [],
    itemKeyCounter: 0,
  }
}

export function recruitUnit(runState, unitDefId) {
  const def = UNITS[unitDefId]
  if (!def || runState.essence < def.recruitCost || !runState.shopOffers.includes(unitDefId)) return runState

  // RESERVE_CAP (above): buying a 3rd copy of an already-2-owned unit
  // fuses immediately and shrinks the bench by 2, so it's exempt -
  // the cap exists to stop pure hoarding, not to block the one
  // purchase that actively relieves it. Total room is DEPLOY_SLOTS (the
  // fighting "bench," in Marc's own terms) plus RESERVE_CAP (the
  // non-fighting reserve) - a full deployed squad still leaves the
  // full reserve free, rather than the deployed squad eating into it.
  const alreadyOwned = runState.bench.filter((e) => e.defId === unitDefId).length
  const willFuse = alreadyOwned >= 2
  if (!willFuse && runState.bench.length >= DEPLOY_SLOTS + RESERVE_CAP) return runState

  const newKey = runState.benchKeyCounter
  const withNew = [...runState.bench, { key: newKey, defId: unitDefId, upgradeLevel: 0 }]
  const fused = fuseAll(withNew, runState.deployed, runState.items, runState.benchKeyCounter + 1)

  // Auto-deploy: a bought unit used to sit inert on the bench until a
  // SEPARATE click placed it into one of the 4 battlefield slots on
  // FormationScreen - a real "I bought units and they did nothing in
  // the fight" trap (Marc, live), since only DEPLOYED units actually
  // join a battle. Fills every open slot from the bench automatically,
  // same convention Battlegrounds-style autobattlers use when board
  // space is scarce - the player can still bench a unit again with the
  // usual click if they'd rather deploy something else instead.
  // Deliberately a general "sweep any undeployed bench entry into any
  // open slot" rather than just placing the one unit just bought:
  // fuseAll above (tryFuseOnce) clears the deploy slot of any consumed
  // unit when 3 copies fuse into a Tier 2, so a fusion can silently
  // UN-deploy 2 already-fighting units and leave the result sitting on
  // the bench - the exact same "owned but not fighting" trap, just
  // reached a different way. One sweep after fusion settles fixes both
  // cases at once instead of tracking the new unit's key through fusion.
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
    ...runState,
    essence: runState.essence - def.recruitCost,
    bench: fused.bench,
    deployed,
    items: fused.items,
    benchKeyCounter: fused.nextKey,
    shopOffers: runState.shopOffers.filter((id) => id !== unitDefId),
  }
}

// Essence rescale (see START_ESSENCE's own comment above): was 2, now
// 125 (units.js's TIER_COST "2-family").
export const REFORGE_COST = 125

// A fifth Essence sink (after recruit/reroll, Unit Upgrade, Commander
// Rank-Up, Relic Upgrade/Reroll): swaps one bench unit for a different
// random unit of the same tier, flat cost - "I don't want this one
// after all, but I've already committed the recruit cost" without a
// full reroll of the whole shop. Deliberately resets upgradeLevel to 0
// - it's a genuinely different unit afterward, not the same one
// wearing a new name, so carrying prior Essence investment over would
// be an odd fit. Fused (Tier 2) units can't be reforged - swapping
// away three units' worth of recruiting/fusing effort for a random
// base unit would be a strict downgrade trap, not a real choice.
export function reforgeUnit(runState, benchKey) {
  const entry = runState.bench.find((e) => e.key === benchKey)
  if (!entry || runState.essence < REFORGE_COST) return runState
  const currentDef = UNITS[entry.defId]
  if (!currentDef || currentDef.displayTier === 2) return runState
  const pool = Object.values(UNITS).filter((u) => !u.fusedFrom && !u.summonOnly && u.tier === currentDef.tier && u.id !== entry.defId)
  if (!pool.length) return runState
  const newDef = pool[Math.floor(Math.random() * pool.length)]
  return {
    ...runState,
    essence: runState.essence - REFORGE_COST,
    bench: runState.bench.map((e) => (e.key === benchKey ? { ...e, defId: newDef.id, upgradeLevel: 0 } : e)),
    // Same "a genuinely different unit afterward" rule as the
    // upgradeLevel reset above - any equipped items return to the bag
    // rather than staying attached to a unit that's no longer the one
    // the player geared up.
    items: runState.items.map((it) => (it.equippedTo === benchKey ? { ...it, equippedTo: null, slotIndex: null } : it)),
  }
}

// Essence rescale (see START_ESSENCE's own comment above): the old
// flat 50%-back rate produced sell values nowhere near Marc's own
// "Quick Sale 150" reference plaque once recruit costs themselves grew
// to 65/125/190 (half of even the priciest rare recruit is only 95) -
// bumped the rate to 80%, a deliberate, documented design call (this
// pass is meant to be numbers-only, but the sell formula's own SHAPE
// was explicitly called out as fair game if the flat 50% couldn't hit
// the reference on its own): selling a rare-tier unit (190) now refunds
// 152, landing right on the "~150" target; a common (65) refunds 52,
// an uncommon (125) refunds 100 - still a real "you lose something by
// selling" tax (20%), just a lighter one now that every number in the
// shop is bigger and losing half of a 190-cost recruit felt like a
// harsher tax than losing half of the old 3-cost one ever did.
const SELL_REFUND_RATE = 0.8
// A fused Tier 2 unit has no recruitCost of its own (it's never
// directly purchasable) - flat fallback, bumped from 2 to a clean 150
// so THIS is the sale a player is most likely to see land squarely on
// Marc's own reference number: a Tier 2 unit represents 3 real recruits
// plus a fusion, the closest thing in this economy to a "quality asset"
// worth a satisfying lump-sum Quick Sale.
const TIER2_SELL_FALLBACK = 150

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
    ...runState,
    essence: runState.essence + refund,
    bench: runState.bench.filter((e) => e.key !== benchKey),
    deployed: runState.deployed.map((k) => (k === benchKey ? null : k)),
    items: runState.items.map((it) => (it.equippedTo === benchKey ? { ...it, equippedTo: null, slotIndex: null } : it)),
  }
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
  return ITEM_SLOTS + bonus
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

export function toggleFreeze(runState) {
  return { ...runState, frozen: !runState.frozen }
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

export function rerollShop(runState) {
  if (runState.essence < runState.rerollCost) return runState
  return {
    ...runState,
    essence: runState.essence - runState.rerollCost,
    shopOffers: rollShop(runState.marketLevel || 1, benchTribeCounts(runState)),
    // Essence rescale: was a bare `+ 1`, now REROLL_INCREMENT (65,
    // same "1-family" value REROLL_BASE_COST itself scaled to) - see
    // REROLL_BASE_COST's own comment above.
    rerollCost: runState.rerollCost + REROLL_INCREMENT,
    // A paid Reroll always overrides Freeze (see startRun's own note on
    // `frozen`) - an explicit purchase supersedes it, and there's
    // nothing left to "keep" once the player has deliberately replaced
    // the offers themselves.
    frozen: false,
  }
}

export function leaveShop(runState) {
  return { ...runState, ...advanceToNextNode(runState) }
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
// the SAME 4 entries rather than a parallel story structure, so the
// difficulty readout and the narrative one can never drift apart (one
// says "The Reckoning," the other can't say something different for
// the same stretch of the run). `tagline` is the short line shown next
// to the difficulty badge itself (SquadDraft.jsx); `lore` is the
// longer paragraph shown once, the first time a run actually crosses
// into that tier (FormationScreen.jsx's own Act-intro banner) - not
// shown again on every fight within the same tier, just the crossing.
export const DIFFICULTY_TIERS = [
  {
    threshold: 0,
    name: "The Outer Grove",
    color: "var(--hw-moss)",
    tagline: "Where the paths still remember being walked.",
    lore: "The trees here still let the light through. Whatever watches from the Hearthwood's own heart hasn't noticed you yet - or hasn't decided you're worth noticing. Either way, the ground is easy underfoot. It won't stay that way.",
  },
  {
    threshold: 0.3,
    name: "The Deepening Woods",
    color: "var(--hw-rune)",
    tagline: "The paths stop agreeing with each other.",
    lore: "The canopy closes overhead. What lives here doesn't scatter when you approach - it turns to look. Somewhere past this point, the Hearthwood stopped being a place you were walking through and started being a place walking back.",
  },
  {
    threshold: 0.65,
    name: "The Wounded Hearthwood",
    color: "var(--hw-ember)",
    tagline: "Something here has been hurt for a very long time.",
    lore: "The moss burns amber instead of green. Every root you cross has already been fought over, by something that didn't win cleanly. Whatever's waiting deeper in remembers every one of those fights - and it's still standing.",
  },
  {
    threshold: 0.85,
    name: "The Reckoning",
    color: "var(--hw-curse)",
    tagline: "It knows you're coming now.",
    lore: "There's no pretending anymore that this is still a walk through the woods. Spacemonkey is close, and everything left standing between you and him already knows exactly why you're here.",
  },
]

export function difficultyTierForNode(nodeIndex, pathLength) {
  const progress = pathLength > 1 ? nodeIndex / (pathLength - 1) : 0
  return [...DIFFICULTY_TIERS].reverse().find((t) => progress >= t.threshold) || DIFFICULTY_TIERS[0]
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
function difficultyFactorForNode(nodeIndex, pathLength) {
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
  return 1 + (0.75 * progress + 0.25 * Math.sqrt(progress)) * 0.75
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
      itemIds: runState.items.filter((it) => it.equippedTo === entry.key).map((it) => it.defId),
    }))
}

export function startFormationBattle(runState) {
  const node = currentNode(runState)
  const commanderItemIds = runState.items.filter((it) => it.equippedTo === "commander").map((it) => it.defId)
  const battle = startAutoBattle(
    runState.characterId,
    deployedUnitsFor(runState),
    node.enemyId || node.formationId,
    runState.relics,
    runState.commanderRank || 0,
    runState.relicLevels || {},
    commanderItemIds,
    // Commander Active Power (activateCommanderPower above): consumed here,
    // exactly once, by the very next battle that starts - RUN_PATH
    // never places a "relic" node directly after a "shop" node (every
    // relic node sits between a battle and the following shop), so a
    // queued effect from a shop visit is always guaranteed to reach
    // this call with nothing able to strand it in between.
    runState.pendingActiveEffects || [],
    difficultyFactorForNode(runState.nodeIndex, runState.path.length),
  )
  return { ...runState, phase: "battle", battle: applyTrialName(battle, node), pendingActiveEffects: [] }
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
export function previewBattleEnemies(runState) {
  const node = currentNode(runState)
  const commanderItemIds = runState.items.filter((it) => it.equippedTo === "commander").map((it) => it.defId)
  const battle = startAutoBattle(
    runState.characterId,
    deployedUnitsFor(runState),
    node.enemyId || node.formationId,
    runState.relics,
    runState.commanderRank || 0,
    runState.relicLevels || {},
    commanderItemIds,
    runState.pendingActiveEffects || [],
    difficultyFactorForNode(runState.nodeIndex, runState.path.length),
  )
  return applyTrialName(battle, node).enemies
}

// A relic node only ever offers 3 choices, rolled once - this lets the
// player pay to see a fresh 3 instead, the same "spend Essence for
// another option" shape rerollShop already gives the unit shop.
export function rerollRelicOffers(runState) {
  if (runState.essence < RELIC_REROLL_COST) return runState
  return {
    ...runState,
    essence: runState.essence - RELIC_REROLL_COST,
    relicOffers: rollRelics(runState.relics, benchTribeCounts(runState)),
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
  const advanced = advanceToNextNode(runState)
  // A pending "choice" (see advanceToNextNode above) is never a shop -
  // it's always a battle position mid-decision - so the shop-entry
  // side effects below always correctly no-op for it.
  const nextNode = advanced.phase === "choice" ? null : advanced.path[advanced.path.length - 1]
  const enteringShop = nextNode?.type === "shop"
  return {
    ...runState,
    ...advanced,
    essence,
    relics,
    // Freeze (startRun's own note): kept as-is when entering a shop
    // instead of re-rolling, then consumed (cleared) regardless -
    // one-shot, not persistent.
    shopOffers: enteringShop ? (runState.frozen ? runState.shopOffers : rollShop(runState.marketLevel || 1, benchTribeCounts(runState))) : runState.shopOffers,
    itemOffers: enteringShop ? rollItemShop() : runState.itemOffers,
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
  const difficultyBonus = node?.type === "miniboss" ? MINIBOSS_BONUS_ESSENCE : node?.formationId ? FORMATION_BONUS_ESSENCE : 0
  return WIN_ESSENCE + difficultyBonus + essenceBonus
}

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
    if (node.type === "boss") return { ...runState, phase: "victory" }

    const advanced = advanceToNextNode(runState)
    // A pending "choice" (see advanceToNextNode above) is never a shop
    // or relic node - it's always a battle position mid-decision - so
    // the shop/relic-entry side effects below always correctly no-op.
    const nextNode = advanced.phase === "choice" ? null : advanced.path[advanced.path.length - 1]
    const enteringShop = nextNode?.type === "shop"
    return {
      ...runState,
      ...advanced,
      essence: runState.essence + essenceForWin(runState, node),
      shopOffers: enteringShop ? (runState.frozen ? runState.shopOffers : rollShop(runState.marketLevel || 1, benchTribeCounts(runState))) : runState.shopOffers,
      itemOffers: enteringShop ? rollItemShop() : runState.itemOffers,
      frozen: enteringShop ? false : runState.frozen,
      relicOffers: nextNode?.type === "relic" ? rollRelics(runState.relics, benchTribeCounts(runState)) : runState.relicOffers,
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
export const RUN_SAVE_VERSION = 2

export function serializeRun(runState) {
  if (!runState) return null
  return { version: RUN_SAVE_VERSION, savedAt: Date.now(), run: runState }
}

const VALID_PHASES = new Set(["shop", "relic", "formation", "battle", "choice", "victory", "defeat"])

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
