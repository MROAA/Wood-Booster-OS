// Heartwood Trial - the recruitable unit roster for the autobattler.
// Every unit is derived mechanically from the old cards.js entry of the
// same id (see the plan's conversion table): an "attack" card's damage
// becomes the unit's repeating attack; a "skill" card's block/heal
// becomes its repeating block/heal; a "power" card's addTrigger effect
// becomes a real passive, applied once when the unit enters battle,
// reusing the exact mechanism characters already use for their own
// signature effects. Same art keys as before - zero new art.
//
// movePattern/moveSelect use the same shape ENEMIES already use
// ("sequence" cycles deterministically, "weightedRandom" rolls each
// time) - a unit's own combat behavior is nothing new, just the
// existing enemy-AI model applied to the player's side too.
//
// attackPattern defaults to "single" (always hits the frontmost living
// enemy - see autoBattleEngine.js). "rook"/"bishop"/"knight" fan out
// across the shape from the unit's own square, same geometry
// targeting.js already provides.

// Placeholder portrait images for the two forest-creature units - see
// units.js's `image` field and UnitCard.jsx. Marc confirmed these are
// temporary reference art, not for anything distributed publicly until
// swapped for real/licensed art before release.
import emberStagImg from "../../assets/heartwood/units/ember-stag.jpg"
import grovekeeperImg from "../../assets/heartwood/units/grovekeeper.jpg"
import stormwingImg from "../../assets/heartwood/units/stormwing.jpg"
import justiceImg from "../../assets/heartwood/units/justice.jpg"
import deathImg from "../../assets/heartwood/units/death.jpg"
import theEmpressImg from "../../assets/heartwood/units/the-empress.jpg"
import theDevilImg from "../../assets/heartwood/units/the-devil.webp"
import theLoversImg from "../../assets/heartwood/units/the-lovers.jpg"
import theEmperorImg from "../../assets/heartwood/units/the-emperor.jpg"
import theSunImg from "../../assets/heartwood/units/the-sun.jpg"
import theTowerImg from "../../assets/heartwood/units/the-tower.jpg"
import theHermitImg from "../../assets/heartwood/units/the-hermit.webp"
import theMoonImg from "../../assets/heartwood/units/the-moon.jpg"
import theWorldImg from "../../assets/heartwood/units/the-world.jpg"
import theStarImg from "../../assets/heartwood/units/the-star.jpg"
import theHangedManImg from "../../assets/heartwood/units/the-hanged-man.jpg"
import theHierophantImg from "../../assets/heartwood/units/the-hierophant.jpg"
import theFoolImg from "../../assets/heartwood/units/the-fool.webp"
import theChariotImg from "../../assets/heartwood/units/the-chariot.webp"
import judgementImg from "../../assets/heartwood/units/judgement.webp"
import theHighPriestessImg from "../../assets/heartwood/units/the-high-priestess.webp"
import wheelOfFortuneImg from "../../assets/heartwood/units/wheel-of-fortune.webp"
import bishopsSlashImg from "../../assets/heartwood/units/bishops-slash.webp"
import temperanceImg from "../../assets/heartwood/units/temperance.webp"
import knightsLeapImg from "../../assets/heartwood/units/knights-leap.webp"
import rooksChargeImg from "../../assets/heartwood/units/rooks-charge.webp"
import theMagicianImg from "../../assets/heartwood/units/the-magician.jpeg"
import stoneheartImg from "../../assets/heartwood/units/stoneheart.jpg"
import forgehowlImg from "../../assets/heartwood/units/forgehowl.jpg"
import strengthImg from "../../assets/heartwood/units/strength.jpg"
// Round 2 of Marc's curated placeholder art (his own scraped-image
// folder, see the task log) - covering the previously-unimaged half of
// the roster. Same placeholder-first convention as the block above:
// reference art, not final, to be swapped before any public release.
import spiritWolfImg from "../../assets/heartwood/units/spirit-wolf.jpg"
import foxfireImg from "../../assets/heartwood/units/foxfire.jpg"
import duskbrambleImg from "../../assets/heartwood/units/duskbramble.jpg"
import witherkitImg from "../../assets/heartwood/units/witherkit.jpg"
import briarkitImg from "../../assets/heartwood/units/briarkit.jpg"
import palefenImg from "../../assets/heartwood/units/palefen.jpg"
import mosshollowImg from "../../assets/heartwood/units/mosshollow.jpg"
import ashenhornImg from "../../assets/heartwood/units/ashenhorn.jpg"
import ironbarkImg from "../../assets/heartwood/units/ironbark.jpg"
import nightveilImg from "../../assets/heartwood/units/nightveil.jpg"
import frostbindImg from "../../assets/heartwood/units/frostbind.jpg"
import wraithcallerImg from "../../assets/heartwood/units/wraithcaller.jpg"
import rootfangImg from "../../assets/heartwood/units/rootfang.jpg"
import wraithguardImg from "../../assets/heartwood/units/wraithguard.jpg"
import cragmossImg from "../../assets/heartwood/units/cragmoss.jpg"
import hexmotherImg from "../../assets/heartwood/units/hexmother.jpg"
// Round 3 (this session) - Marc's kuvia/ folder had grown past 438
// files since round 2, enough new material to close most of the
// remaining gap. Same placeholder-first convention: reference art, not
// final. A few images arrived with a small AI-tool logo baked into one
// corner (Craiyon's orange crayon icon) or a stock-site credit line -
// those go through the same "-channel A -fx" alpha-punch round 1/2
// already established (see the PR body) rather than a visible crop,
// since cropping a JPEG can't remove a corner without reshaping the
// whole portrait. 3 units (Trueshot, Sparrowthorn, Beastcaller) got no
// image this round - nothing in the pool plausibly reads as "ranged
// archer", "songbird", or "beast-summoner", and Marc's own bar is a
// reasonable placeholder, not a forced mismatch.
import wraithbriarImg from "../../assets/heartwood/units/wraithbriar.jpg"
import grimtuskImg from "../../assets/heartwood/units/grimtusk.jpg"
import thornguardImg from "../../assets/heartwood/units/thornguard.jpg"
import hollowveilImg from "../../assets/heartwood/units/hollowveil.jpg"
import quarrywardenImg from "../../assets/heartwood/units/quarrywarden.jpg"
import hollowmereImg from "../../assets/heartwood/units/hollowmere.jpg"
import stoneknitImg from "../../assets/heartwood/units/stoneknit.jpg"
import stoneknollImg from "../../assets/heartwood/units/stoneknoll.jpg"
import fernwakeImg from "../../assets/heartwood/units/fernwake.jpg"
import brackenveilImg from "../../assets/heartwood/units/brackenveil.jpg"
import hollowspireImg from "../../assets/heartwood/units/hollowspire.jpg"
import mycelistImg from "../../assets/heartwood/units/mycelist.jpg"
import mosswalkerImg from "../../assets/heartwood/units/mosswalker.jpg"
import bloomcallerImg from "../../assets/heartwood/units/bloomcaller.jpg"
import willowmendImg from "../../assets/heartwood/units/willowmend.jpg"
import willowfangImg from "../../assets/heartwood/units/willowfang.jpg"
import loamguardImg from "../../assets/heartwood/units/loamguard.jpg"
// Marc specifically saved 2 real songbird photos (blackbird, great
// tit) after this pass first went out with no bird art at all -
// arrived in kuvia/ mid-task, so Duskwren/Sparrowthorn both get
// swapped from a placeholder onto an actual on-theme photo.
import duskwrenImg from "../../assets/heartwood/units/duskwren.jpg"
import sparrowthornImg from "../../assets/heartwood/units/sparrowthorn.jpg"
// Last 7 of the 85-unit roster - closes out this round's image pass.
import emberwispImg from "../../assets/heartwood/units/emberwisp.jpg"
import wispkeeperImg from "../../assets/heartwood/units/wispkeeper.jpg"
import motleyImg from "../../assets/heartwood/units/motley.jpg"
import thornwispImg from "../../assets/heartwood/units/thornwisp.jpg"
import ashcallerImg from "../../assets/heartwood/units/ashcaller.jpg"
import stormveilImg from "../../assets/heartwood/units/stormveil.jpg"
import mistveilImg from "../../assets/heartwood/units/mistveil.jpg"
// These 2 got wired into their unit() calls early (alongside batch 2's
// loamguard/willowfang edits) but the import lines were missed at the
// time - caught by a runtime Playwright check (a bare "XImg is not
// defined" ReferenceError that `npm run build`'s static bundling
// alone never surfaces, since an undefined free identifier is still
// syntactically valid JS).
import rimefangImg from "../../assets/heartwood/units/rimefang.jpg"
import hollowquillImg from "../../assets/heartwood/units/hollowquill.jpg"
// Marc's follow-up scope: "käytä kaikki kuvat...luot unitteja/
// itemeitä kuville" (use all the images, create units/items for them)
// - 6 brand-new units built around striking leftover art that didn't
// match any existing unimaged def, rather than letting good portraits
// go unused. Same unit() helper, same mechanic vocabulary (nothing
// invented) - each one's kit/tier/tribe picked to fit its own image's
// theme, same as every curated pick above.
import chimeraImg from "../../assets/heartwood/units/chimera.jpg"
import sunscaleImg from "../../assets/heartwood/units/sunscale.jpg"
import abyssongImg from "../../assets/heartwood/units/abyssong.jpg"
import huldraImg from "../../assets/heartwood/units/huldra.jpg"
import rootwingImg from "../../assets/heartwood/units/rootwing.jpg"
import marshlightImg from "../../assets/heartwood/units/marshlight.jpg"
import swiftclawImg from "../../assets/heartwood/units/swiftclaw.jpg"
import thistlemawImg from "../../assets/heartwood/units/thistlemaw.jpg"
import briarbladeImg from "../../assets/heartwood/units/briarblade.jpg"
import snareclawImg from "../../assets/heartwood/units/snareclaw.jpg"
// These 5 arrived with a small AI-tool logo (Craiyon's orange crayon
// icon) or a stock-site credit line baked into one corner - punched
// transparent via the same "-channel A -fx" technique round 1/2
// established (see PR body), so PNG instead of JPG to actually carry
// the alpha instead of flattening it back to a visible box.
import sapkeeperImg from "../../assets/heartwood/units/sapkeeper.png"
import glimmerwardImg from "../../assets/heartwood/units/glimmerward.png"
import thornwardenImg from "../../assets/heartwood/units/thornwarden.png"
import duskclawImg from "../../assets/heartwood/units/duskclaw.png"
import runeveilImg from "../../assets/heartwood/units/runeveil.png"
// Marc, direct: "kaikella pitää olla kuva" (everything needs an
// image), even if only a loose placeholder - these had no
// thematically-close match anywhere in the pool at first (no archer,
// no beast-summoner art exists in kuvia/), so they get the nearest
// available substitute instead of staying on the bare glyph. Also:
// Marc separately said watermarks don't matter on placeholder art
// ("ne on alkuun vain placeholdereita") - these (and everything from
// here on) skip the alpha-punch crop step other imports above went
// through, plain resize only.
import trueshotImg from "../../assets/heartwood/units/trueshot.jpg"
import beastcallerImg from "../../assets/heartwood/units/beastcaller.jpg"
import { applyBranch } from "./upgrades"

// Bumped ~20-25% from the first pass after testing showed a 3-unit
// starter squad (78 total HP) losing consistently to the 4-piece Rune
// Warden's Escort formation (176 total HP) - see the plan/memory note
// on this. Paired with a 4th deploy slot in runEngine.js.
// `legendary` (feat/hearthwood-legendary-units): the first band above
// `rare`, added for the build-around anchor units. HP ~40% over rare
// (54 -> 76) but their real weight is a conditional/aura/growth hook,
// not the stat line - see the PRD north-star doc
// (docs/hearthwood-strategic-upgrades-prd.md) and autoBattleEngine.js's
// growth/aura/conditionalPassive handling. Deliberately NOT wired into
// MARKET_LEVEL_UNLOCKS (runEngine.js) - a Legendary reaches the shop
// only via rollShop's own bounded LEGENDARY_SHOP_CHANCE injection, so
// Fusion / base-roll / reforge math all stay exactly as they were.
// HP settled at 70 (down from a first pass at 76) after the fairness
// RUNS=100 gate: 76 + the hooks pushed tommy/aatos +13/+18pp; 70 plus
// the trimmed hook numbers below and a lower shop rate brought it back
// inside +-8pp. Still a clear step over rare's 54, just not a free
// bodyguard for a bot that recruits on price alone.
const TIER_HP = { common: 32, uncommon: 42, rare: 54, legendary: 70 }
// Essence rescale (Marc, direct: "haluan että marketin nouseminen
// maksaa 250 essenceä ja ekonomian pitää vastata sitä" - I want
// leveling the Market to cost 250 Essence and the economy needs to
// match that; "se vaikuttaa myös unitteihin jne" - it affects units
// too). Marc's own Copilot concept-art plaques show a "Purchase 250"
// button and a "Quick Sale 150" button - anchored the whole rescale on
// marketLevelCost(1) (runEngine.js), whose old value was
// MARKET_LEVEL_BASE_COST(4) * level(1) = 4, landing the scale factor
// at exactly 250/4 = 62.5x. That SAME 62.5x factor is applied to every
// essence constant in the game (runEngine.js/relics.js/items.js/
// characters.js all cite this same comment) - every one of them
// happened to already be a small integer in {1, 2, 3, 4} pre-rescale,
// which turns into a clean, uniform family post-rescale:
//   1 * 62.5 = 62.5 -> rounds to  65
//   2 * 62.5 = 125.0 -> exactly  125
//   3 * 62.5 = 187.5 -> rounds to 190
//   4 * 62.5 = 250.0 -> exactly  250
// Unit prices were never per-entity literals (every unit() call below
// only ever fed its cost hint through tierFromCost to pick a tier -
// the real recruit price always came from this one shared table), so
// rescaling the whole 85+-unit roster is this one table edit, not a
// per-line change.
// Rounded to the 50/100/150/200 family (Marc, round numbers). Legendary
// at 250 = one marketLevelCost(1) (runEngine.js) - a real multi-win
// save, the "saving as strategy" the PRD wants that decision to be.
const TIER_COST = { common: 50, uncommon: 100, rare: 150, legendary: 250 }

// NOTE: `cost` here is the small integer RARITY HINT passed by each
// unit() call below (0/1/2/3/4), NOT an Essence value - it only ever
// selects a tier name, which then indexes TIER_COST for the real
// price. The 50/100/150 rounding above changes TIER_COST's values
// only; these hint thresholds stay as-is so every unit keeps the exact
// tier it had before. `4` was added for the `legendary` band.
function tierFromCost(cost) {
  if (cost >= 4) return "legendary"
  if (cost === 3) return "rare"
  if (cost === 2) return "uncommon"
  return "common"
}

function unit(id, name, art, cost, role, movePattern, opts = {}) {
  const tier = tierFromCost(cost)
  return {
    id,
    name,
    art,
    tier,
    role,
    recruitCost: TIER_COST[tier],
    attackPattern: opts.attackPattern || "single",
    moveSelect: opts.moveSelect || "sequence",
    movePattern,
    passive: opts.passive || null,
    // Rally: a battle-start buff that goes to adjacent ALLIES instead
    // of the unit itself (every other passive/relic self-targets) -
    // see autoBattleEngine.js's own special-case handling, same
    // precedent as Bulwark Standard's tauntHighestHp. { id, amount }.
    rallyAdjacent: opts.rallyAdjacent || null,
    // rallyHeal: same Chebyshev-adjacency check as rallyAdjacent, but
    // mends adjacent allies' HP every round instead of granting a
    // power stack once at battle start - see autoBattleEngine.js's
    // resolveRound, which ticks it alongside Poison every round
    // (a one-time battle-start heal would be a no-op, since units
    // always start a fight at full HP - the exact bug Mosswarden's
    // Charm hit twice before landing on a repeating trigger instead).
    rallyHeal: opts.rallyHeal || null,
    // Chain: a flat bonus hit on a different living enemy, fired only
    // when this unit's own single-target attack was the killing blow -
    // see autoBattleEngine.js's actSide for the full guard conditions.
    chainDamage: opts.chainDamage || null,
    // Haste: acts a second time in the same round instead of once -
    // see autoBattleEngine.js's actSide. Deliberately paired with a
    // LOWER per-hit amount than a same-tier non-Haste attacker (Marc:
    // "changes cannot be overpowered") - a flat doubling of every
    // round's actions is stronger pound-for-pound than a conditional
    // bonus like Execute/Chain, so the per-hit number has to give
    // something back rather than just stacking on top.
    haste: !!opts.haste,
    // Spore Spread: when this unit's own debuff step applies Poison,
    // the same stack also seeds onto a different living enemy - see
    // autoBattleEngine.js's actSide.
    sporeSpread: !!opts.sporeSpread,
    // Summon: grants the squad a bonus creature at battle start (not a
    // stat buff - a real extra entry in state.playerUnits), spawned
    // into whichever deploy slot the summoner itself didn't take - see
    // autoBattleEngine.js's startAutoBattle. { defId } names a
    // summonOnly unit def. Deliberately a one-shot at battle start,
    // not tied to movePattern - the summoned creature then acts every
    // round on its own like any other unit.
    summon: opts.summon || null,
    // summonOnly: excluded from the shop/reforge pool (this file's
    // rollShop-adjacent filters in runEngine.js) - a summoned creature
    // isn't directly recruitable, only gained via a Summoner's own
    // battle-start passive.
    summonOnly: !!opts.summonOnly,
    // maxHpOverride: lets a def sidestep the tier HP table entirely -
    // used only by summonOnly creatures, whose HP is deliberately
    // modest (a free bonus body, not a second full recruit) rather than
    // whatever HP its nominal cost tier would imply.
    maxHp: opts.maxHpOverride || TIER_HP[tier],
    // Optional portrait image (see UnitCard.jsx) - falls back to the
    // `art` SVG glyph when absent. Placeholder-quality reference art
    // for now, not final; see cardArt.jsx's note on where it came from.
    image: opts.image || null,
    // Guild Identity v1 (Marc's PRD): a named Class identity layered on
    // top of the existing role/tribe system, not a replacement for
    // either - `role` still drives the card's accent color and combat
    // math, `className` is purely a display label naming what that
    // role+kit combination actually IS in the fiction (e.g. a `tank`
    // with a battle-start Taunt is an "Ironbark", not just "a tank").
    // Optional and additive, same precedent as `image` above - every
    // unit without one keeps rendering exactly as before. Deliberately
    // NOT auto-derived from role (only 5 units earn one this pass, the
    // ones whose existing kit already matches a class from Marc's PRD
    // without forcing it - see UnitCard.jsx for the render).
    className: opts.className || null,
    // evolvedFrom (evolutions.js): the base unit id this is an evolved
    // form of. Excludes it from the shop / reforge / random-unit pools
    // (runEngine.js filters, same as fusedFrom / summonOnly) - an
    // evolved unit only ever arrives by evolving in place after a win.
    evolvedFrom: opts.evolvedFrom || null,
    // --- Build-around hooks (feat/hearthwood-legendary-units) ---------
    // Three new optional fields carrying the Legendary tier's identity.
    // All three reuse the existing effect vocabulary (applyEffects) and
    // are PLAYER-SIDE ONLY, the same v1 limitation rallyAdjacent's own
    // comment records - enemies never carry them.
    //
    // growth: { amount } - at battle start the unit gains Ascendant
    // `amount` (effects.js's tickAscendant then adds that many Strength
    // every round). A thin authoring/display alias for "scales the
    // longer the fight runs" - no new tick, tickAscendant already runs
    // in resolveRoundInner. See autoBattleEngine.js's startAutoBattle.
    growth: opts.growth || null,
    // aura: { effect } - every round, `effect` (any single applyEffects
    // entry: { type:"block"|"heal"|"applyBuff", ... }) is applied to
    // each OTHER deployed unit whose grid pos is Chebyshev-adjacent to
    // this one. The per-round mirror of rallyAdjacent's one-shot grant -
    // see autoBattleEngine.js's applyAuraTick (built off applyRallyHealTick).
    aura: opts.aura || null,
    // guard (feat/hearthwood-hunters): a bodyguard. When a HUNTING pack
    // (enemies.js `hunter`) would pick a soft target that has a living
    // guard Chebyshev-adjacent, the guard steps in front and takes the
    // hit instead - see autoBattleEngine.js's threatTarget. No damage
    // math, no new status: purely a targeting redirect, and hunt-mode
    // only for v1 (a general targeting redirect is a bigger fairness
    // lever, deferred). Player-side only, like every hook above.
    guard: opts.guard || null,
    // synergyScaled (feat/hearthwood-player-power): { id, amount } - at
    // battle start the unit self-buffs `id` by `amount * <active tribe
    // synergy count>`. Makes playerPower.js's BuildCoherence mechanical:
    // ordinary in a 1-tribe squad, a real carry in a 2-3 synergy board.
    // Player-side only; see autoBattleEngine.js's coherence-rewards block.
    synergyScaled: opts.synergyScaled || null,
    // conditionalPassive: { when, effect } - `effect` (an array of
    // applyEffects entries) applies once at battle start, self-target,
    // ONLY if `when` holds. `when` is one of:
    //   { tribeCount: { tribe, min } }  - >= min of that tribe in the recruited squad
    //   { frontRow: true }              - this unit deployed to slot 3 (row 1)
    //   { backRow: true }               - this unit deployed to a back-row slot (row 2)
    //   { squadSize: { min } }          - >= min recruited units deployed
    // Evaluated by evalUnitCondition in autoBattleEngine.js, right after
    // the squad's tribeCounts are tallied.
    conditionalPassive: opts.conditionalPassive || null,
    // economyRole (Economy System PRD 30-31, feat/hearthwood-economy-crew):
    // "merchant" | "banker" | "forager" | "toll-warden". A RUN-LAYER
    // marker only - the autobattler engine never reads it. economy.js's
    // economyCrewEffects scans runState.deployed for it and applies a
    // flat effect (cheaper recruits / earlier interest / bigger win
    // payout / flat reroll) while the unit is deployed. Nothing
    // persisted; no save-version bump.
    economyRole: opts.economyRole || null,
  }
}

// Every unit interleaves at least one real attack into its pattern -
// found via testing that a unit with a pure block/heal-only pattern is
// a dead weight in an endless-round autobattle (Block resets every
// round; it never contributes toward actually winning), unlike in the
// old hand-of-cards game where the same effect was a deliberate
// one-time defensive play mixed into a turn full of attack cards.
// Support/tank units still lean defensive (attack shows up every other
// beat, not every beat), they just aren't useless anymore.
const BASE_UNITS = {
  // Marc: "I open the game and see the market, I buy units without
  // feeling anything... they need to have more status effects and
  // things that make them unique and fun to play." An audit found 17
  // of the 26 common-tier units - the ones seen constantly, every
  // shop visit - had zero identity beyond flat attack/block numbers.
  // Giving each a real, distinct hook below, reusing the game's own
  // proven mechanic vocabulary (nothing invented from scratch) rather
  // than a from-scratch new system - the same discipline every combo
  // item/relic/enemy this session has followed.
  "the-fool": unit("the-fool", "Mosskit", "the-fool", 0, "support", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 4 },
  ], {
    // Regen - a free-tier unit's first taste of sustain, fitting
    // "moss" (things that regrow).
    passive: [{ type: "applyBuff", id: "regen", amount: 2 }],
    image: theFoolImg,
  }),
  "the-magician": unit("the-magician", "Duskweaver", "the-magician", 1, "hybrid", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 3 },
  ], {
    // Weak on hit - a weaver of illusions/curses draining a target's
    // own strength, not raw force.
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } }],
    image: theMagicianImg,
    // Guild Identity v1: Dreamweaver (Illusions/Control) - the existing
    // "weaver of illusions/curses" flavor above already IS Marc's
    // Dreamweaver class, word for word. No kit change, just naming
    // what was already there.
    className: "Dreamweaver",
  }),
  "the-high-priestess": unit("the-high-priestess", "Silverbloom", "the-high-priestess", 1, "support", [
    { type: "heal", amount: 4 },
    { type: "attack", amount: 5 },
  ], {
    className: "Oracle",
    // Self-Cleanse every round - "purification" reads directly off
    // the name, and gives Grove tribe its first Cleanse carrier
    // (previously only Rootward on the enemy side, Willowmend
    // uncommon on the player side).
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "cleanse" } }],
    image: theHighPriestessImg,
  }),
  "the-empress": unit("the-empress", "Thistlequeen", "the-empress", 2, "support", [
    { type: "heal", amount: 5 },
    { type: "block", amount: 4 },
    { type: "attack", amount: 6 },
  ], { image: theEmpressImg }),
  "the-emperor": unit("the-emperor", "Stonecrown", "the-emperor", 2, "tank", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 5 },
  ], {
    className: "Crownguard",
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 5 } }],
    image: theEmperorImg,
  }),
  "the-hierophant": unit("the-hierophant", "Goldenbough", "the-hierophant", 1, "dps", [
    { type: "attack", amount: 4 },
  ], {
    passive: [{ type: "applyBuff", id: "strength", amount: 1 }],
    image: theHierophantImg,
  }),
  "the-lovers": unit("the-lovers", "Twinbriar", "the-lovers", 1, "dps", [{ type: "attack", amount: 6 }], {
    // Chain - "twin" as a bonus strike on a second target, the
    // cheapest possible read of the name.
    chainDamage: 3,
    image: theLoversImg,
  }),
  "the-chariot": unit("the-chariot", "Thornram", "the-chariot", 2, "dps", [{ type: "attack", amount: 14 }], {
    image: theChariotImg,
  }),
  strength: unit("strength", "Ironclaw", "strength", 1, "dps", [{ type: "attack", amount: 5 }], {
    passive: [{ type: "applyBuff", id: "strength", amount: 2 }],
    image: strengthImg,
  }),
  "the-hermit": unit("the-hermit", "Hollowreed", "the-hermit", 1, "support", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 6 },
  ], {
    // Self-Ward - "hermit" bends and retreats rather than breaking.
    passive: [{ type: "applyBuff", id: "ward", amount: 1 }],
    image: theHermitImg,
  }),
  "wheel-of-fortune": unit("wheel-of-fortune", "Windshift", "wheel-of-fortune", 1, "hybrid", [
    { type: "attack", amount: 10, weight: 1 },
    { type: "block", amount: 10, weight: 1 },
  ], { moveSelect: "weightedRandom", image: wheelOfFortuneImg }),
  justice: unit("justice", "Oakwarden", "justice", 1, "tank", [
    { type: "block", amount: 7 },
    { type: "attack", amount: 6 },
    // Sunder - "justice" stripping away an ill-gotten edge, added as
    // a 3rd move rather than an on-hit trigger (Warden's own first
    // common-tier Sunder source).
    { type: "sunder" },
  ], { image: justiceImg }),
  "the-hanged-man": unit("the-hanged-man", "Snarevine", "the-hanged-man", 0, "dps", [
    { type: "attack", amount: 6 },
  ], {
    // Vulnerable on hit - "snare" reads directly as marking a target
    // for what comes after.
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 } }],
    image: theHangedManImg,
  }),
  death: unit("death", "Bonewither", "death", 1, "dps", [{ type: "attack", amount: 7 }], {
    // Poison on hit - "wither" is decay given a mechanic.
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } }],
    image: deathImg,
  }),
  temperance: unit("temperance", "Stillbark", "temperance", 1, "tank", [
    { type: "block", amount: 3 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "block", amount: 3 } }],
    image: temperanceImg,
  }),
  "the-devil": unit("the-devil", "Hollowmaw", "the-devil", 1, "dps", [{ type: "attack", amount: 16 }], {
    // Already the roster's biggest single hit at its cost - kept that
    // glass-cannon identity intact and added only a small Execute,
    // the roster's first COMMON-tier source (previously rare-only:
    // Duskclaw/Trueshot) - "the devil claims what's already dying."
    passive: [{ type: "applyBuff", id: "execute", amount: 2 }],
    image: theDevilImg,
  }),
  "the-tower": unit("the-tower", "Bramblespire", "the-tower", 2, "dps", [{ type: "attack", amount: 18 }], {
    image: theTowerImg,
  }),
  "the-star": unit("the-star", "Glowmoss", "the-star", 1, "support", [{ type: "attack", amount: 4 }], {
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "heal", amount: 3 } }],
    image: theStarImg,
  }),
  "the-moon": unit("the-moon", "Nightbloom", "the-moon", 1, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 5 },
  ], {
    // rallyHeal - moonlight mending nearby allies each round, a
    // common-tier taste of the mechanic (previously uncommon+:
    // Willowmend/Cragmoss).
    rallyHeal: 2,
    image: theMoonImg,
  }),
  "the-sun": unit("the-sun", "Sunthorn", "the-sun", 2, "dps", [{ type: "attack", amount: 16 }], {
    image: theSunImg,
  }),
  judgement: unit("judgement", "Stoneknell", "judgement", 1, "dps", [{ type: "attack", amount: 7 }], {
    // Shatter - "judgement" as a reckoning against whatever's still
    // hiding behind its own guard.
    passive: [{ type: "applyBuff", id: "shatter", amount: 3 }],
    image: judgementImg,
  }),
  "the-world": unit("the-world", "Rootcrown", "the-world", 3, "dps", [{ type: "attack", amount: 20 }], {
    image: theWorldImg,
  }),

  "knights-leap": unit("knights-leap", "Knight's Leap", "spark", 2, "dps", [{ type: "attack", amount: 12 }], {
    attackPattern: "knight",
    image: knightsLeapImg,
  }),
  "rooks-charge": unit("rooks-charge", "Rook's Charge", "spark", 2, "dps", [{ type: "attack", amount: 6 }], {
    attackPattern: "rook",
    image: rooksChargeImg,
  }),
  "bishops-slash": unit("bishops-slash", "Bishop's Slash", "spark", 2, "dps", [{ type: "attack", amount: 5 }], {
    attackPattern: "bishop",
    image: bishopsSlashImg,
  }),

  // First two non-Tarot, non-chess-pattern units - same "new
  // arrangement of an existing idea" spirit as the enemy formations,
  // applied to the recruit pool instead: forest creatures alongside
  // the Arcana, matching the enemy roster's own crude-doodle register
  // rather than the Tarot line-art style.
  "ember-stag": unit("ember-stag", "Ember Stag", "emberStag", 3, "dps", [
    { type: "attack", amount: 11 },
    { type: "attack", amount: 11 },
    { type: "block", amount: 6 },
  ], {
    // Grows stronger the longer it survives a fight - distinct from
    // Fenrir's woundedFury (HP-conditional): this ramps unconditionally
    // every round, "burning brighter" rather than "hurts more when hurt".
    passive: [{ type: "addTrigger", trigger: "turnEnd", effect: { type: "applyBuff", id: "strength", amount: 1 } }],
    image: emberStagImg,
  }),
  grovekeeper: unit("grovekeeper", "Grovekeeper", "grovekeeper", 2, "tank", [
    { type: "block", amount: 8 },
    { type: "attack", amount: 6 },
  ], {
    image: grovekeeperImg,
    // The Emperor already does turnStart block - this is the roster's
    // first unit with its own unconditional turnStart self-heal
    // (previously only Aatos's Commander passive did that, squad-wide).
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 3 } }],
  }),
  stormwing: unit("stormwing", "Stormwing", "stormwing", 3, "dps", [
    { type: "attack", amount: 9 },
    { type: "debuff", id: "weak", amount: 2, target: "target" },
    { type: "attack", amount: 9 },
  ], {
    className: "Galewing",
    // A third rare-tier forest creature, storm/lightning themed rather
    // than fire (Ember Stag) or growth (Grovekeeper) - the roster's
    // first player-side unit with a repeating Weak debuff, previously
    // only an enemy move (Moss Troll, Rune Warden, Mist Growler,
    // Spacemonkey all already use it against the player).
    image: stormwingImg,
  }),
  stoneheart: unit("stoneheart", "Stoneheart", "stoneheart", 3, "tank", [
    { type: "block", amount: 10 },
    { type: "attack", amount: 7 },
  ], {
    className: "Stonewarden",
    // The roster's tankiest turnStart passive yet - 6 Block every
    // round vs. The Emperor's 5 (uncommon) or Grovekeeper's heal-based
    // approach (tank via sustain, not prevention) - justified by rare
    // tier's higher recruit cost. Also the roster's first unit to carry
    // Taunt (applied once at battle start, not a repeating trigger,
    // since it should hold for the whole fight): the wall that
    // actually draws the enemy's fire onto itself instead of just
    // surviving it, giving the rest of the squad a real reason to
    // stand behind Stoneheart rather than just next to it.
    passive: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 6 } },
      { type: "applyBuff", id: "taunt", amount: 1 },
    ],
    image: stoneheartImg,
  }),
  forgehowl: unit("forgehowl", "Forgehowl", "forgehowl", 3, "dps", [
    { type: "attack", amount: 20 },
    { type: "block", amount: 8 },
  ], {
    className: "Berserker",
    // A simple heavy hitter, no passive - same "not every rare needs a
    // gimmick" shape as The World/The Tower. The roster's single
    // highest per-hit attack number after The World's 20 (tied) - a
    // slow, hard-swinging identity rather than a sustained one.
    image: forgehowlImg,
  }),
  duskclaw: unit("duskclaw", "Duskclaw", "flame", 3, "dps", [
    { type: "attack", amount: 8 },
  ], {
    className: "Nightblade",
    // The roster's first unit built around Execute (effects.js's
    // dealDamage) instead of a Strength/Weak/heal-family passive - a
    // second, unit-level way to reach the mechanic alongside the
    // Culling Strike relic (relics.js), for a squad that wants Execute
    // without spending a relic slot on it.
    passive: [{ type: "applyBuff", id: "execute", amount: 4 }],
    image: duskclawImg,
  }),
  ashenhorn: unit("ashenhorn", "Ashenhorn", "leaf", 2, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 5 },
  ], {
    // Rally: the roster's first positional mechanic (autoBattleEngine.js
    // special-cases rallyAdjacent, same precedent as Bulwark Standard's
    // tauntHighestHp) - grants Strength to every OTHER deployed unit
    // Chebyshev-adjacent to Ashenhorn at battle start, not to itself.
    // The 4 deploy slots aren't all mutually adjacent (the two back
    // corners, SLOT_POSITIONS[0]/[2], are the only non-adjacent pair),
    // so where you place Ashenhorn genuinely changes how many allies it
    // reaches - a real placement decision, not just "recruit it and
    // forget it", matching Marc's "easy to play but hard to master".
    rallyAdjacent: { id: "strength", amount: 2 },
    image: ashenhornImg,
  }),
  rootfang: unit("rootfang", "Rootfang", "root", 3, "dps", [
    { type: "attack", amount: 7 },
    { type: "debuff", id: "poison", amount: 3, target: "target" },
    { type: "attack", amount: 7 },
  ], {
    className: "Venomtongue",
    // Poison (effects.js's tickPoison) has only ever been an enemy
    // weapon (Bloomrot Stalker, Spacemonkey) until now - same
    // debuff-movePattern shape Stormwing already uses for Weak, just a
    // different status id, so no new engine code needed to give the
    // player its own source of the mechanic.
    image: rootfangImg,
  }),
  wraithbriar: unit("wraithbriar", "Wraithbriar", "root", 3, "tank", [
    { type: "block", amount: 8 },
    { type: "attack", amount: 6 },
  ], {
    // Revive (effects.js's dealDamage) - a genuinely new state, not
    // another numeric stack on an existing formula: the first hit that
    // would otherwise drop Wraithbriar to 0 instead leaves it at 1 HP
    // and consumes the stack, once per fight. A real tension for
    // whatever's attacking it - burst past 1 extra life in one hit, or
    // the "kill" doesn't actually land - while staying fully
    // deterministic (no revive chance, no coin flip) per Marc's "easy
    // to play but hard to master".
    passive: [{ type: "applyBuff", id: "revive", amount: 1 }],
    image: wraithbriarImg,
  }),
  grimtusk: unit("grimtusk", "Grimtusk", "flame", 3, "dps", [
    { type: "attack", amount: 9 },
    { type: "attack", amount: 9 },
  ], {
    className: "Reaver",
    // Chain (autoBattleEngine.js's actSide) - a second, distinct way to
    // reward finishing blows alongside Execute (Culling Strike/
    // Duskclaw), but a bonus hit on a DIFFERENT enemy instead of extra
    // damage on the same one: Execute rewards focusing one target down,
    // Chain rewards it too but then spreads the payoff across the
    // field - real build tension between the two rather than one
    // strictly out-classing the other.
    chainDamage: 6,
    // Round 3: a lava-demon image finally read close enough to "tusked
    // brute" to retire round 2's skip note above.
    image: grimtuskImg,
  }),
  thornguard: unit("thornguard", "Thornguard", "shield", 2, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    className: "Bulwark",
    // Ward (effects.js's dealDamage) - a third defensive tool
    // alongside Block (a depleting damage pool) and Revive (only
    // matters once, at the very edge of death): a Ward stack cancels
    // one entire incoming hit outright, whatever its size, then is
    // gone. Granted once at battle start, same convention as every
    // other passive that isn't a repeating trigger - deliberately NOT
    // a turnStart regrant, since powers (unlike Block) don't reset
    // each round, and an unbounded once-per-round Ward stack would let
    // a Thornguard that goes several rounds unattacked (an AoE round,
    // a formation with more targets than attackers) snowball into
    // effective invulnerability rather than the fixed, readable
    // resource every other status stays.
    passive: [{ type: "applyBuff", id: "ward", amount: 2 }],
    image: thornguardImg,
  }),
  swiftclaw: unit("swiftclaw", "Swiftclaw", "spark", 2, "dps", [{ type: "attack", amount: 4 }], {
    className: "Skirmisher",
    // Haste - a genuinely different shape of DPS from every other
    // attacker: two small hits a round instead of one big one, at
    // uncommon tier (4 dmg/hit = 8 total, in line with other uncommon
    // attackers, not above them - the value of Haste is in variety
    // (more hits landing means more onDealDamage/onHit triggers firing
    // per round with a Vampiric Bloom/Sundering Mark/Bramble Ward
    // build) rather than raw total damage).
    haste: true,
    image: swiftclawImg,
  }),
  emberwisp: unit("emberwisp", "Emberwisp", "spark", 3, "dps", [{ type: "aoe", amount: 5 }], {
    // The roster's first player-side AoE (autoBattleEngine.js's aoe
    // branch, previously only Spacemonkey's signature move) - a real
    // mage identity: every round, it blasts every living enemy at
    // once instead of picking a target. No new engine code needed,
    // the aoe branch already works for either side. Priced at rare
    // and kept modest (5/target, well below Spacemonkey's own 9) since
    // multi-target-every-round is a strong baseline on its own - it
    // also can't combo with Chain or Haste (both scoped to
    // attackPattern "single" attacks only), a natural ceiling that
    // came for free rather than needing its own guard.
    image: emberwispImg,
  }),
  runeveil: unit("runeveil", "Runeveil", "rune", 2, "dps", [
    { type: "attack", amount: 4 },
    { type: "debuff", id: "vulnerable", amount: 1, target: "target" },
    { type: "attack", amount: 4 },
  ], {
    // A second mage, a curse-caster rather than a blaster - the
    // roster's first unit-level source of Vulnerable (previously only
    // Sundering Mark's onDealDamage trigger granted it). Same
    // debuff-movePattern shape Stormwing (Weak) and Rootfang (Poison)
    // already established, just a third status through the same door.
    image: runeveilImg,
  }),
  frostbind: unit("frostbind", "Frostbind", "moonGlyph", 3, "support", [
    { type: "attack", amount: 3 },
    { type: "debuff", id: "stun", amount: 1, target: "target" },
    { type: "attack", amount: 3 },
  ], {
    className: "Frostbinder",
    // A third mage, and the roster's first PLAYER-side source of Stun
    // (previously only Rootbind Thicket, an enemy, could skip a
    // unit's whole action). Own damage kept deliberately low (3, below
    // even Rootbind Thicket's 4) for the same reason Rootbind Thicket
    // itself stays low - losing an entire action is a strong effect
    // on its own, this isn't meant to also hit hard.
    image: frostbindImg,
  }),
  glimmerward: unit("glimmerward", "Glimmerward", "shield", 2, "support", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 3 },
  ], {
    // A fourth mage, a protective-aura caster - reuses Rally
    // (rallyAdjacent, first built for Ashenhorn's Strength aura)
    // verbatim, just granting Ward instead: whichever OTHER deployed
    // units are Chebyshev-adjacent to Glimmerward get a Ward stack at
    // battle start too, not just Glimmerward itself. Zero new engine
    // code - rallyAdjacent was already generic on the buff id, not
    // hardcoded to Strength.
    rallyAdjacent: { id: "ward", amount: 1 },
    image: glimmerwardImg,
  }),
  wraithcaller: unit("wraithcaller", "Wraithcaller", "moonGlyph", 3, "hybrid", [{ type: "attack", amount: 6 }], {
    className: "Soulbinder",
    // A fifth mage, a life-drain caster - Lifesteal's first UNIT-level
    // source (previously only Vampiric Bloom, a relic). Every other
    // mechanic that shipped with both a relic and a unit source
    // (Taunt/Stoneheart+Bulwark Standard, Execute/Duskclaw+Culling
    // Strike, Ward/Thornguard+Aegis Ward) already had this pairing -
    // Lifesteal was the one gap left. Same onDealDamage+heal shape
    // Vampiric Bloom already proved, just as a self-targeting passive
    // instead of a relic effect.
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 2 } }],
    image: wraithcallerImg,
  }),
  hexmother: unit("hexmother", "Hexmother", "root", 3, "support", [
    { type: "attack", amount: 5 },
    { type: "debuff", id: "poison", amount: 2, target: "target" },
    { type: "debuff", id: "weak", amount: 1, target: "target" },
  ], {
    className: "Hexweaver",
    // The roster's first Witch Doctor - Marc named 5 desired classes
    // (Paladin, Rogue, Warrior, Witch Doctor, Mage); Mage now has 5
    // units, the others already fit loosely by mechanic (Stoneheart/
    // Thornguard's Taunt+Ward+Block reads Paladin, Swiftclaw/Grimtusk/
    // Duskclaw's Haste+Chain+Execute reads Rogue), but nothing yet
    // wore Witch Doctor's curse-stacking identity specifically.
    // Hexmother layers TWO debuffs into its own 3-step cycle instead
    // of the one-attack-one-debuff shape every other debuff unit
    // (Stormwing/Rootfang/Runeveil/Frostbind) uses - poisons, then
    // weakens the same target on consecutive actions, so a focused
    // enemy ends up rotting AND hitting softer at once. No new engine
    // code - both debuffs already exist and the debuff-movePattern
    // shape already supports back-to-back entries.
    image: hexmotherImg,
  }),
  wispkeeper: unit("wispkeeper", "Wispkeeper", "heart", 3, "support", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 4 },
  ], {
    // The first Cleric - reuses Rally (rallyAdjacent, first built for
    // Ashenhorn's Strength aura, already reused for Glimmerward's Ward
    // aura) a third time, granting Revive instead: adjacent allies get
    // a second life at battle start, never Wispkeeper itself
    // (rallyAdjacent explicitly skips self in every use so far) - a
    // support that protects its neighbors, not its own hide. Zero new
    // engine code.
    rallyAdjacent: { id: "revive", amount: 1 },
    image: wispkeeperImg,
  }),
  trueshot: unit("trueshot", "Trueshot", "spark", 3, "dps", [{ type: "attack", amount: 6 }], {
    className: "Marksman",
    // The first Hunter - a precision tracker rather than a blaster:
    // knight's-leap targeting (bypasses shielding, same as Knight's
    // Leap) finds Execute's bonus damage against a wounded target
    // wherever it's hiding on the field, instead of only whoever's
    // frontmost. Combines two already-proven mechanisms (attackPattern
    // + Execute) in one identity rather than adding a new one.
    attackPattern: "knight",
    passive: [{ type: "applyBuff", id: "execute", amount: 3 }],
    // No dedicated archer/ranged-hunter art turned up in the pool even
    // after an exhaustive pass - Marc's "even a loose placeholder"
    // bar (kaikella pitää olla kuva) still calls for something over
    // the bare glyph, so this borrows a battle-mage casting a bolt of
    // arcane light: not literally "true shot," but a precision ranged
    // strike is the closest visual read available.
    image: trueshotImg,
  }),
  motley: unit("motley", "Motley", "moonGlyph", 2, "hybrid", [
    { type: "attack", amount: 5 },
    { type: "block", amount: 4 },
    { type: "debuff", id: "weak", amount: 1, target: "target" },
  ], {
    // The first Jester, and the roster's first PLAYER unit with
    // moveSelect: "weightedRandom" instead of "sequence" (previously
    // only enemies/the boss rolled their next move rather than cycling
    // it deterministically) - genuinely unpredictable WHICH of its 3
    // moves comes up next, while each individual move still resolves
    // through the same deterministic math as everything else (no dice
    // roll on damage, just on move order) - chaos in sequencing, not
    // in outcome, matching Marc's "easy to play but hard to master".
    moveSelect: "weightedRandom",
    image: motleyImg,
  }),
  thornwarden: unit("thornwarden", "Thornwarden", "root", 2, "dps", [{ type: "attack", amount: 6 }], {
    className: "Bruiser",
    // The first Bruiser ("saa voimaa vahingoittumisesta" - gains power
    // from being damaged) - WoundedFury's first UNIT-level source
    // (previously only Fenrir's Commander squadPassive granted it).
    // Unconditional out the gate like every WoundedFury carrier, but
    // only actually pays off once Thornwarden is already hurt (below
    // 50% HP) - a real risk/reward tank-adjacent DPS identity, not
    // just a flat number.
    passive: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
    image: thornwardenImg,
  }),
  bloomcaller: unit("bloomcaller", "Bloomcaller", "leaf", 3, "support", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    className: "Bloomcaller",
    // The first Buffer ("kasvattaa liittolaisten voimaa" - grows
    // allies' power) - reuses Rally a fourth time, but grants Execute
    // to adjacent allies instead of Strength (Ashenhorn) or Ward
    // (Glimmerward)/Revive (Wispkeeper) - a fresh combination of two
    // already-proven mechanisms rather than a new one. Whoever stands
    // next to Bloomcaller finishes wounded enemies faster.
    rallyAdjacent: { id: "execute", amount: 2 },
    image: bloomcallerImg,
  }),
  mosswalker: unit("mosswalker", "Mosswalker", "moonGlyph", 2, "support", [{ type: "attack", amount: 4 }], {
    // The first Evasion class ("väistelee ja katoaa taistelusta" -
    // dodges and vanishes from battle) - deliberately NOT a dodge-
    // chance/miss-chance roll (Marc's own "easy to play but hard to
    // master" - a coin flip isn't a build decision). Ward already
    // means exactly "this hit doesn't land" in fully deterministic
    // terms, so Mosswalker grants itself 2 stacks at battle start -
    // the third unit-level Ward source (after Thornguard/Glimmerward),
    // "vanishing" from up to 2 hits' worth of danger instead of one.
    passive: [{ type: "applyBuff", id: "ward", amount: 2 }],
    image: mosswalkerImg,
  }),
  ironbark: unit("ironbark", "Ironbark", "shield", 2, "tank", [
    { type: "block", amount: 7 },
    { type: "attack", amount: 4 },
  ], {
    // The first Tank ("kestää vahinkoa ja suojelee muita" - endures
    // damage and protects others) - Taunt at battle start, same
    // mechanism Stoneheart's passive already proved, on its own
    // uncommon-tier unit rather than only existing at rare (Stoneheart)
    // - a cheaper, earlier entry point into the same "draw the fire"
    // role.
    passive: [{ type: "applyBuff", id: "taunt", amount: 1 }],
    // Guild Identity v1: Ironbark (Defense/Tank) - the unit's own id/
    // name already are "Ironbark", and its kit (highest block in the
    // uncommon tier + battle-start Taunt) is exactly Marc's
    // Defense/Tank class. Naming what was already built, not a stretch.
    className: "Ironbark",
    image: ironbarkImg,
  }),
  briarblade: unit("briarblade", "Briarblade", "root", 3, "dps", [{ type: "attack", amount: 10 }], {
    // The first Assassin ("iskee heikkoihin kohteisiin" - strikes weak
    // targets) - Chain's second unit-level source (after Grimtusk),
    // with a heavier single hit (10, vs Grimtusk's 9+9 split across two
    // moves) to read as one devastating strike rather than a sustained
    // beatdown - kill the frontmost, the blade is already moving on to
    // whoever's left standing.
    chainDamage: 5,
    // Guild Identity v1: Briarblade (Assassin/Critical) - same id/name
    // match as Ironbark above; a single massive hit plus a finishing-
    // blow Chain bonus is this roster's closest existing analogue to
    // "assassin/critical" (no true crit-chance mechanic exists yet).
    className: "Briarblade",
    image: briarbladeImg,
  }),
  sapkeeper: unit("sapkeeper", "Sapkeeper", "leaf", 2, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 3 },
  ], {
    // The first Healer/Support ("parantaa ja jakaa resursseja" - heals
    // and shares resources) - rallyHeal (autoBattleEngine.js's
    // resolveRound), mending Chebyshev-adjacent allies every round
    // instead of a battle-start grant (which would be a no-op - see
    // the field's own comment in the unit() helper). The first repeat-
    // ing positional effect in the roster, versus Rally's one-time
    // battle-start grants.
    rallyHeal: 2,
    // Guild Identity v1: Sapkeeper (Healing/Support) - id/name match
    // again; rallyHeal every round to adjacent allies is a direct hit
    // on Marc's Healing/Support class description.
    className: "Sapkeeper",
    image: sapkeeperImg,
  }),
  mycelist: unit("mycelist", "Mycelist", "leaf", 3, "support", [
    { type: "attack", amount: 4 },
    { type: "debuff", id: "poison", amount: 2, target: "target" },
    { type: "attack", amount: 4 },
  ], {
    className: "Sporelord",
    // The last of Marc's 12 base classes - Mycelist ("sieniverkosto
    // levittää efektejä" - a fungal network spreads effects). Spore
    // Spread (sporeSpread) is a genuinely new mechanic, not a reuse -
    // whenever Mycelist's own debuff step poisons its target, the
    // infection also seeds onto a second living enemy in the same
    // action, so one cast can start rotting two targets rather than
    // one. Rootfang/Venomous Edge/Hexmother all still only poison
    // whoever they directly hit - Mycelist is the roster's first
    // Poison source that spreads on its own.
    sporeSpread: true,
    image: mycelistImg,
  }),
  // Not shop-recruitable (summonOnly excludes it from rollShop/
  // reforgeUnit's pools) - exists only to be spawned by Beastcaller's
  // summon field. Deliberately modest (half a common-tier unit's HP,
  // one plain attack) since it's a free bonus body on top of whatever
  // Beastcaller itself already costs - see the summon field's own
  // comment in the unit() helper for why this can't be full-strength.
  "spirit-wolf": unit("spirit-wolf", "Spirit Wolf", "wolf", 0, "dps", [
    { type: "attack", amount: 3 },
  ], {
    maxHpOverride: 16,
    summonOnly: true,
    image: spiritWolfImg,
  }),
  // Beastcaller ("kutsuu avukseen metsän henkiolentoja" - calls forest
  // spirit-creatures to its aid) - the last of the 12 base classes,
  // and the one that needed genuinely new architecture rather than
  // reuse: `summon` (units.js opts) adds a real second unit to
  // state.playerUnits at battle start instead of a stat buff, see
  // autoBattleEngine.js's startAutoBattle. Kept to plain attacks itself
  // (no Chain/Haste/etc layered on) since the summoned Spirit Wolf is
  // already a second body's worth of value on top of one recruit.
  beastcaller: unit("beastcaller", "Beastcaller", "leaf", 3, "support", [
    { type: "attack", amount: 5 },
    { type: "attack", amount: 5 },
  ], {
    summon: { defId: "spirit-wolf" },
    // Guild Identity v1: Beastcaller (Pets/Nature) - id/name match; the
    // ability that calls a Spirit Wolf into the fight is literally
    // Marc's Pets/Nature class already, no reinterpretation needed.
    className: "Beastcaller",
    // No literal "summons an animal" art in the pool - closest
    // available read is a figure confronting/calling forth a beast
    // version of themselves, a loose placeholder per Marc's "even a
    // placeholder, but everything needs an image" bar.
    image: beastcallerImg,
  }),
  // Plain roster reinforcements - all 12 base classes are covered
  // already, so these just add more bodies at common/uncommon tier
  // rather than a new archetype, reusing Chain/Rally exactly as
  // Grimtusk/Ashenhorn already established rather than inventing
  // anything new.
  foxfire: unit("foxfire", "Foxfire", "fox", 1, "dps", [
    { type: "attack", amount: 4 },
    { type: "attack", amount: 4 },
  ], {
    // Chain (autoBattleEngine.js's actSide), scaled down from
    // Grimtusk's rare-tier 6 to a common-tier 3 - same finishing-blow
    // payoff, proportionally smaller at a cheaper recruit cost.
    chainDamage: 3,
    image: foxfireImg,
  }),
  loamguard: unit("loamguard", "Loamguard", "root", 2, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // Rally (autoBattleEngine.js's startAutoBattle), same mechanism
    // Ashenhorn already established - grants adjacent allies Strength
    // at battle start, not itself.
    rallyAdjacent: { id: "strength", amount: 1 },
    image: loamguardImg,
  }),
  willowfang: unit("willowfang", "Willowfang", "spark", 2, "dps", [{ type: "attack", amount: 5 }], {
    // Haste (autoBattleEngine.js's actSide), same mechanism Swiftclaw
    // already established - two smaller hits a round instead of one
    // big one.
    haste: true,
    image: willowfangImg,
  }),
  cragmoss: unit("cragmoss", "Cragmoss", "leaf", 3, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    // rallyHeal (autoBattleEngine.js's resolveRound), same mechanism
    // Sapkeeper already established - a second, tankier unit built
    // around mending adjacent allies every round instead of just once.
    rallyHeal: 2,
    image: cragmossImg,
  }),
  // Cleanse (effects.js) - Sunder's mirror, the roster's first tool
  // against its OWN negative statuses (Poison/Weak/Vulnerable/Stun)
  // instead of an enemy's positive ones. Willowmend cleanses itself
  // every cycle before healing and attacking - a real answer to a
  // long Poison/Weak fight instead of just outlasting it.
  willowmend: unit("willowmend", "Willowmend", "leaf", 2, "support", [
    { type: "cleanse" },
    { type: "heal", amount: 4 },
    { type: "attack", amount: 4 },
  ], { image: willowmendImg }),
  sparrowthorn: unit("sparrowthorn", "Sparrowthorn", "spark", 1, "dps", [{ type: "attack", amount: 6 }], {
    // Wounded Fury - a scrappy fighter that gets meaner once it's
    // cornered, fitting "sparrow" over a heavier bruiser identity.
    passive: [{ type: "applyBuff", id: "woundedFury", amount: 1 }],
    // A real great-tit photo Marc saved specifically for this unit -
    // swapped in over the initial dragon-golem placeholder.
    image: sparrowthornImg,
  }),
  duskwren: unit("duskwren", "Duskwren", "spark", 1, "dps", [
    { type: "attack", amount: 5 },
    { type: "attack", amount: 3 },
  ], {
    // Self-Strength - synergizes directly with its own existing
    // 2-hit pattern rather than needing a new move type.
    passive: [{ type: "applyBuff", id: "strength", amount: 1 }],
    image: duskwrenImg,
  }),
  rimefang: unit("rimefang", "Rimefang", "moonGlyph", 2, "dps", [{ type: "attack", amount: 7 }], {
    className: "Frostblade",
    // Chain (autoBattleEngine.js's actSide), same mechanism Grimtusk/
    // Foxfire already established - a bonus hit on a different living
    // enemy when this unit's own attack lands the killing blow.
    chainDamage: 4,
    image: rimefangImg,
  }),
  hollowquill: unit("hollowquill", "Hollowquill", "rune", 2, "dps", [
    { type: "attack", amount: 8 },
  ], { image: hollowquillImg }),
  // Shatter (effects.js) - a genuinely new mechanic, Execute's mirror:
  // bonus damage against a target currently holding Block instead of
  // one below an HP threshold. Stoneknoll is the first unit built
  // around it, rewarding a squad that keeps pressing a defensive
  // enemy instead of waiting out its Block.
  stoneknoll: unit("stoneknoll", "Stoneknoll", "shield", 2, "dps", [{ type: "attack", amount: 6 }], {
    passive: [{ type: "applyBuff", id: "shatter", amount: 3 }],
    image: stoneknollImg,
  }),
  quarrywarden: unit("quarrywarden", "Quarrywarden", "shield", 2, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // Rally (autoBattleEngine.js's startAutoBattle), same mechanism
    // Ashenhorn/Glimmerward/Wispkeeper/Bloomcaller already established
    // - a fourth id through that same door, granting Shatter to
    // adjacent allies at battle start instead of Strength/Ward/Revive/
    // Execute.
    rallyAdjacent: { id: "shatter", amount: 2 },
    image: quarrywardenImg,
  }),
  // Regen (effects.js's tickRegen) - a genuinely new mechanic this
  // round: a decaying heal-over-time stack, Poison's mirror on the
  // support side. Fernwake is the first unit built around it, spreading
  // it to its neighbors at battle start instead of only healing itself
  // every cycle the way Willowmend/Cragmoss already do.
  fernwake: unit("fernwake", "Fernwake", "leaf", 2, "support", [
    { type: "heal", amount: 3 },
    { type: "attack", amount: 3 },
  ], {
    rallyAdjacent: { id: "regen", amount: 2 },
    image: fernwakeImg,
  }),
  duskbramble: unit("duskbramble", "Duskbramble", "root", 1, "dps", [{ type: "attack", amount: 6 }], {
    // Sunder on hit - a dps-side echo of Oakwarden's identity at a
    // different cost/role context, strips a target's own buff.
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "sunder", target: "target" } }],
    image: duskbrambleImg,
  }),
  hollowmere: unit("hollowmere", "Hollowmere", "shield", 2, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 4 },
  ], {
    // Self-Ward - a 2nd "Hollow-" unit sharing Hollowreed's defensive
    // motif, at tank role/uncommon cost instead of support/common.
    passive: [{ type: "applyBuff", id: "ward", amount: 1 }],
    image: hollowmereImg,
  }),
  thistlemaw: unit("thistlemaw", "Thistlemaw", "spark", 1, "dps", [
    { type: "attack", amount: 4 },
    { type: "attack", amount: 4 },
  ], {
    // Chain - a 2-hit unit where either swing can trigger the bonus,
    // "thistle catches on everything nearby."
    chainDamage: 3,
    image: thistlemawImg,
  }),
  brackenveil: unit("brackenveil", "Brackenveil", "leaf", 2, "hybrid", [
    { type: "block", amount: 4 },
    { type: "heal", amount: 3 },
    { type: "attack", amount: 3 },
  ], { image: brackenveilImg }),
  briarkit: unit("briarkit", "Briarkit", "root", 1, "dps", [{ type: "attack", amount: 5 }], {
    // Chain (autoBattleEngine.js's actSide) - a cheap, common-tier
    // source of the mechanic, previously only on 2-cost+ units
    // (Rimefang/Grimtusk/Foxfire).
    chainDamage: 3,
    image: briarkitImg,
  }),
  hollowspire: unit("hollowspire", "Hollowspire", "leaf", 3, "support", [
    { type: "heal", amount: 5 },
    { type: "attack", amount: 5 },
  ], {
    // rallyHeal (autoBattleEngine.js's resolveRound) - the roster's
    // first RARE-tier mender (Willowmend/Sapkeeper/Cragmoss are all
    // common/uncommon), so a squad leaning support has a real high-roll
    // target in the late shop, not just early picks.
    rallyHeal: 3,
    image: hollowspireImg,
  }),
  // Sunder (effects.js) - the roster's first PLAYER-side source. Every
  // enemy debuff already has a player-side mirror (Cleanse answers
  // Poison/Weak/Vulnerable/Stun), but Sunder itself had only ever run
  // enemy -> player (Witherfang). Thornwisp turns it around: a
  // movePattern move, same shape Willowmend's own "cleanse" move
  // already established, just targeting the enemy instead of the self.
  thornwisp: unit("thornwisp", "Thornwisp", "root", 2, "dps", [
    { type: "sunder" },
    { type: "attack", amount: 5 },
  ], { image: thornwispImg }),
  mosshollow: unit("mosshollow", "Mosshollow", "shield", 1, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 3 },
  ], {
    // Self-Regen - "moss that regrows," the tank-role echo of
    // Mosskit's sustain identity at a different role/context.
    passive: [{ type: "applyBuff", id: "regen", amount: 2 }],
    image: mosshollowImg,
  }),
  // Marc: "enemies and bosses need to be more challenging" - the enemy
  // side got noticeably tougher (Deepwarden/Thornmaw/Spacemonkey bumps,
  // The Hollow Court) without a matching answer on the player side.
  // Hollowveil is the roster's first RARE-tier self-Ward source (Ember
  // Charm-style items/relics already grant it to any unit, but no unit
  // carries it as a built-in passive at this tier) - a real defensive
  // pick against the newly-elevated burst.
  hollowveil: unit("hollowveil", "Hollowveil", "shield", 3, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    passive: [{ type: "applyBuff", id: "ward", amount: 2 }],
    image: hollowveilImg,
  }),
  // Sunder's second unit source, and its first at rare tier - Thornwisp
  // (2-cost/uncommon) already turns the mechanic around onto the
  // enemy side, but the new self-buffed minibosses/gauntlet (Ironmaw,
  // Stonewake, Deepwarden) all lean on Strength/Ward stacks a single
  // uncommon-tier Sunder can only chip at slowly. Ashcaller hits
  // harder AND stays on the same "sunder then attack" rhythm.
  ashcaller: unit("ashcaller", "Ashcaller", "root", 3, "dps", [
    { type: "sunder" },
    { type: "attack", amount: 8 },
  ], { image: ashcallerImg }),
  // A common-tier Poison-debuff unit - Rootfang/Hexmother/Mycelist
  // (all 3-cost) were the only ones, so Fungal Spore Sac/Mycotic Bloom
  // (PR #278) had no cheap unit to pair with early in a run.
  witherkit: unit("witherkit", "Witherkit", "root", 1, "dps", [
    { type: "attack", amount: 4 },
    { type: "debuff", id: "poison", amount: 2, target: "target" },
  ], {
    image: witherkitImg,
  }),
  stormveil: unit("stormveil", "Stormveil", "moonGlyph", 2, "dps", [{ type: "attack", amount: 6 }], {
    // Chain (autoBattleEngine.js's actSide), same mechanism Rimefang/
    // Grimtusk/Foxfire already established - a plain uncommon-tier
    // source, cost point variety alongside Briarkit's common-tier one.
    chainDamage: 3,
    image: stormveilImg,
  }),
  // Spirit tribe density (synergies.js) - flagged as notably smaller
  // than every other tribe (5 base units vs. 10-28), confirmed as a
  // genuinely smaller design space rather than a mistagging bug (the
  // peer session cross-referenced every Ward/Revive/summon carrier
  // against its tag - all correct). Adding real new members instead of
  // force-tagging existing ones. Palefen is a cheaper Mosswalker
  // (self-Ward-as-evasion, common instead of uncommon tier); Mistveil
  // is a cheaper Wraithcaller (Lifesteal, uncommon instead of rare).
  palefen: unit("palefen", "Palefen", "moonGlyph", 1, "dps", [{ type: "attack", amount: 4 }], {
    passive: [{ type: "applyBuff", id: "ward", amount: 1 }],
    image: palefenImg,
  }),
  mistveil: unit("mistveil", "Mistveil", "moonGlyph", 2, "support", [{ type: "attack", amount: 5 }], {
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "heal", amount: 1 } }],
    image: mistveilImg,
  }),
  // Closing 2 real gaps left in Spirit's own roster, not just density:
  // the tribe still had zero Taunt and zero Shatter sources, despite
  // both mechanics being common elsewhere - every other tribe has at
  // least one aggro-drawing tank. Wraithguard fills that role slot
  // (Spirit's roles were tank/hybrid/support x3/dps before this -
  // heavily support-skewed with only Wraithbriar holding the line).
  wraithguard: unit("wraithguard", "Wraithguard", "moonGlyph", 3, "tank", [
    { type: "block", amount: 8 },
    { type: "attack", amount: 6 },
  ], {
    className: "Graveguard",
    // Taunt via passive `applyBuff`, same battle-start-once shape
    // Stoneheart already established (holds for the whole fight,
    // not a repeating trigger) - a spectral guardian standing between
    // the rest of the squad and whatever's attacking it.
    passive: [{ type: "applyBuff", id: "taunt", amount: 1 }],
    image: wraithguardImg,
  }),
  nightveil: unit("nightveil", "Nightveil", "moonGlyph", 2, "dps", [{ type: "attack", amount: 7 }], {
    className: "Umbramancer",
    // Shatter's first Spirit-tribe source (Stoneknoll/Quarrywarden
    // were Warden-tribe) - punishes an enemy still braced behind
    // Block instead of waiting it out, the same identity Stoneknoll
    // established at the same cost tier.
    passive: [{ type: "applyBuff", id: "shatter", amount: 3 }],
    image: nightveilImg,
  }),
  // Hybrid is the roster's thinnest role by far (5 units against
  // 15-43 for every other role) and only ever touched 4 of the 6
  // tribes (Thorn x2, Spirit, Root, Grove) - Warden and Fang had zero
  // hybrid representation. Closing both gaps at once, each anchored
  // to its own tribe's existing identity (Warden's Bastion: Block;
  // Fang's Mark: Execute) rather than a generic attack+block filler.
  stoneknit: unit("stoneknit", "Stoneknit", "shield", 2, "hybrid", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // Warden's first Regen source - a different defensive identity
    // from Stoneheart's pure block-and-hold: mends steadily instead
    // of just soaking hits, so it keeps contributing even through a
    // fight that outlasts its own Block pool.
    passive: [{ type: "applyBuff", id: "regen", amount: 3 }],
    image: stoneknitImg,
  }),
  snareclaw: unit("snareclaw", "Snareclaw", "sword", 2, "hybrid", [
    { type: "attack", amount: 5 },
    { type: "block", amount: 4 },
  ], {
    // Fang's first hybrid, and its first Execute source outside
    // Duskclaw/Trueshot (both pure dps) - braces behind Block, then
    // its own attack lands harder against an already-wounded target,
    // same Execute math those two already established just at a
    // hybrid's lower per-hit baseline.
    passive: [{ type: "applyBuff", id: "execute", amount: 2 }],
    image: snareclawImg,
  }),
  // 6 brand-new units (not a base-class rename or a fusion) added for
  // striking leftover art in Marc's kuvia/ pool that didn't match any
  // existing unimaged def - see the import block's comment above.
  // Each reuses the roster's own established mechanic vocabulary
  // (Chain/Ward/Taunt/Weak/Poison), just applied to a fresh id/name/
  // tribe fitting its own portrait, same as every curated unit above.
  chimera: unit("chimera", "Chimera", "sword", 3, "dps", [{ type: "attack", amount: 9 }], {
    // Three heads, one extra bite - Chain's flavor already IS "a bonus
    // hit when this kill lands," so a second/third head finishing off
    // whoever's left standing needs no new mechanic.
    chainDamage: 6,
    image: chimeraImg,
  }),
  sunscale: unit("sunscale", "Sunscale", "shield", 2, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 4 },
  ], {
    // A regal, armored guardian - repeating Block every round, the
    // same turnStart-trigger shape The Emperor already established.
    passive: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
    image: sunscaleImg,
  }),
  abyssong: unit("abyssong", "Abyssong", "moonGlyph", 2, "support", [
    { type: "heal", amount: 3 },
    { type: "attack", amount: 4 },
  ], {
    // A siren's song saps its target's own strength on every hit -
    // Weak-on-hit, the same onDealDamage shape Duskweaver established.
    passive: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } }],
    image: abyssongImg,
  }),
  huldra: unit("huldra", "Huldra", "root", 2, "dps", [
    { type: "attack", amount: 5 },
    { type: "debuff", id: "poison", amount: 2, target: "target" },
  ], {
    image: huldraImg,
  }),
  rootwing: unit("rootwing", "Rootwing", "shield", 3, "tank", [
    { type: "block", amount: 7 },
    { type: "attack", amount: 5 },
  ], {
    // A world-tree guardian planting itself between the squad and
    // whatever's attacking - Taunt at battle start, same mechanism
    // Stoneheart/Ironbark already established.
    passive: [{ type: "applyBuff", id: "taunt", amount: 1 }],
    image: rootwingImg,
  }),
  marshlight: unit("marshlight", "Marshlight", "heart", 2, "support", [
    { type: "block", amount: 4 },
    { type: "heal", amount: 3 },
  ], {
    // A will-o'-the-wisp - self-Ward-as-evasion, Spirit tribe's own
    // established identity (Mosswalker/Palefen already carry it).
    passive: [{ type: "applyBuff", id: "ward", amount: 1 }],
    image: marshlightImg,
  }),

  // --- Elemental-tribe roster fill (2026-09-07, "lisää sisältöä") ----
  // The 7 element tribes (synergies.js) sat at 5-6 units each - too thin
  // to build around. 12 new units, ~2 per element, each carrying that
  // element's own status (wood->regen, ember->burn, tide->dampen,
  // stone->bulwark, gale->evade, shadow->execute/poison, cosmic->
  // ascendant) so elemental builds have real bodies, not just synergy
  // ladders and anchor relics. Numbers held inside the same-tier band
  // of the existing roster (TIER_HP 32/42/54, common attacks ~4-6,
  // uncommon ~5-7, no passive amount above 2). No portrait art -
  // UnitCard falls back to the `art` glyph (placeholder-first).
  barkwarden: unit("barkwarden", "Barkwarden", "wood", 2, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // Wood = growth + endurance: a wall that also knits itself back.
    passive: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
      { type: "applyBuff", id: "regen", amount: 1 },
    ],
  }),
  sapthorn: unit("sapthorn", "Sapthorn", "wood", 1, "dps", [{ type: "attack", amount: 5 }], {
    // A bruiser the wood pulls back together between rounds.
    passive: [{ type: "applyBuff", id: "regen", amount: 2 }],
  }),
  cinderpaw: unit("cinderpaw", "Cinderpaw", "ember", 1, "dps", [{ type: "attack", amount: 5 }], {
    // Ember = burning damage: every hit leaves a burn.
    passive: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 1 } },
    ],
  }),
  ashmaw: unit("ashmaw", "Ashmaw", "ember", 2, "dps", [{ type: "attack", amount: 4 }], {
    // A fast ember striker - two small hits a round (same Haste shape /
    // per-hit restraint as Swiftclaw), so its burn stacks add up quick.
    haste: true,
    passive: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 1 } },
    ],
  }),
  tidewarden: unit("tidewarden", "Tidewarden", "tide", 2, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 3 },
  ], {
    // Tide = erosion: whatever it strikes back hits softer for a while
    // (Dampen - a flat attacker cut, CLEANSABLE).
    passive: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "dampen", target: "target", amount: 1 } },
    ],
  }),
  brinecaller: unit("brinecaller", "Brinecaller", "tide", 1, "support", [
    { type: "block", amount: 4 },
    { type: "heal", amount: 2 },
  ], {
    // Mends the adjacent line every round (rallyHeal, Sapkeeper's shape).
    rallyHeal: 1,
  }),
  stoneward: unit("stoneward", "Stoneward", "stone", 2, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], {
    // Stone = unshakeable armour: Bulwark persists between rounds.
    passive: [{ type: "applyBuff", id: "bulwark", amount: 1 }],
  }),
  cairnfist: unit("cairnfist", "Cairnfist", "stone", 1, "dps", [
    { type: "attack", amount: 5 },
    { type: "block", amount: 3 },
  ], {
    passive: [{ type: "applyBuff", id: "bulwark", amount: 1 }],
  }),
  galeblade: unit("galeblade", "Galeblade", "gale", 1, "dps", [{ type: "attack", amount: 6 }], {
    // Gale = strikes that slip aside: dodges the first blow each round.
    passive: [{ type: "applyBuff", id: "evade", amount: 1 }],
  }),
  windveil: unit("windveil", "Windveil", "gale", 2, "dps", [{ type: "attack", amount: 5 }], {
    // A knight-pattern skirmisher (same geometry as Knight's Leap) that
    // also slips the first hit each round.
    attackPattern: "knight",
    passive: [{ type: "applyBuff", id: "evade", amount: 1 }],
  }),
  shadefang: unit("shadefang", "Shadefang", "shadow", 2, "dps", [{ type: "attack", amount: 6 }], {
    // Shadow = rot and a finishing dark: hits carry poison, and it
    // finishes the wounded faster (Execute).
    passive: [
      { type: "applyBuff", id: "execute", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
    ],
  }),
  starcaller: unit("starcaller", "Starcaller", "cosmic", 2, "support", [
    { type: "block", amount: 4 },
    { type: "heal", amount: 2 },
  ], {
    // Cosmic = growing, unbounded power: Ascendant adds Strength every
    // round for the whole fight, and it opens warded.
    passive: [
      { type: "applyBuff", id: "ascendant", amount: 1 },
      { type: "applyBuff", id: "ward", amount: 1 },
    ],
  }),

  // --- Evolved forms (2026-09-07, "yksiköiden evoluutio") ----------
  // A deployed unit in a squad that leans its tribe GROWS into one of
  // these after 3-4 wins (evolutions.js / runEngine.applyEvolutions).
  // `evolvedFrom` keeps them out of the shop / reforge / random-unit
  // pools (same filter as `fusedFrom` / `summonOnly`); they only ever
  // arrive by evolving. One tier up from the base + a kit step toward
  // the element's "guardian" identity - kept slightly UNDER a Tier-2
  // fusion (which costs 3 recruits; evolution is free). Glyph-fallback
  // art (base's own glyph).
  "wood-elemental": unit("wood-elemental", "Wood Elemental", "wood", 2, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    evolvedFrom: "sapthorn",
    passive: [
      { type: "applyBuff", id: "regen", amount: 2 },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
    ],
  }),
  "ember-elemental": unit("ember-elemental", "Ember Elemental", "ember", 2, "dps", [{ type: "attack", amount: 7 }], {
    evolvedFrom: "cinderpaw",
    passive: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 2 } },
      { type: "applyBuff", id: "strength", amount: 1 },
    ],
  }),
  "tide-elemental": unit("tide-elemental", "Tide Elemental", "tide", 2, "support", [
    { type: "block", amount: 5 },
    { type: "heal", amount: 3 },
  ], {
    evolvedFrom: "brinecaller",
    rallyHeal: 2,
    passive: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "dampen", target: "target", amount: 1 } },
    ],
  }),
  "stone-elemental": unit("stone-elemental", "Stone Elemental", "stone", 2, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    evolvedFrom: "cairnfist",
    passive: [{ type: "applyBuff", id: "bulwark", amount: 2 }],
  }),
  "storm-elemental": unit("storm-elemental", "Storm Elemental", "gale", 2, "dps", [{ type: "attack", amount: 8 }], {
    evolvedFrom: "galeblade",
    passive: [
      { type: "applyBuff", id: "evade", amount: 1 },
      { type: "applyBuff", id: "strength", amount: 1 },
    ],
  }),
  "void-herald": unit("void-herald", "Void Herald", "shadow", 3, "dps", [{ type: "attack", amount: 9 }], {
    evolvedFrom: "shadefang",
    passive: [
      { type: "applyBuff", id: "execute", amount: 2 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
    ],
  }),
  "star-herald": unit("star-herald", "Star Herald", "cosmic", 3, "support", [
    { type: "block", amount: 5 },
    { type: "heal", amount: 3 },
  ], {
    evolvedFrom: "starcaller",
    passive: [
      { type: "applyBuff", id: "ascendant", amount: 1 },
      { type: "applyBuff", id: "ward", amount: 1 },
    ],
  }),
  "goldenbough-ascendant": unit("goldenbough-ascendant", "Goldenbough Ascendant", "leaf", 2, "dps", [{ type: "attack", amount: 7 }], {
    evolvedFrom: "the-hierophant",
    chainDamage: 3,
    passive: [{ type: "applyBuff", id: "strength", amount: 2 }],
  }),

  // --- Legendary tier (feat/hearthwood-legendary-units) --------------
  // The first band above rare: build-around anchors, cost 250 / 76 HP.
  // Each carries exactly ONE of the three new hooks (growth / aura /
  // conditionalPassive) and a deliberately modest stat line - the pick
  // is "which direction is my squad going," not "biggest numbers." All
  // three hooks reuse the existing effect vocabulary; nothing invented.
  // Placeholder glyph art (cardArt.jsx fallback), no new image assets.
  "world-ash-elder": unit("world-ash-elder", "World-Ash Elder", "wood", 4, "support", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
    { type: "heal", amount: 3 },
    { type: "attack", amount: 4 },
  ], {
    // Growth: +2 Strength every round (via Ascendant - effects.js's
    // tickAscendant). Low opening attack on purpose; a stall/sustain
    // squad that can survive to round 4-5 turns this into the run's
    // biggest hitter. Wants Grove menders and Warden walls around it.
    // (+3 was too strong for a bot's long fights - see TIER_HP note.)
    growth: { amount: 2 },
  }),
  "the-thorn-throne": unit("the-thorn-throne", "The Thorn Throne", "flame", 4, "dps", [
    { type: "attack", amount: 7 },
    { type: "attack", amount: 5 },
  ], {
    // Conditional (mono-Thorn payoff): +5 Strength only when the
    // recruited squad is 3+ Thorn. A raw finisher on its own (base
    // Chain 2), a wrecking ball if you commit the whole board to Thorn.
    chainDamage: 2,
    conditionalPassive: {
      when: { tribeCount: { tribe: "thorn", min: 3 } },
      effect: [{ type: "applyBuff", id: "strength", amount: 5 }],
    },
  }),
  "bulwark-of-ages": unit("bulwark-of-ages", "Bulwark of Ages", "stone", 4, "tank", [
    { type: "block", amount: 7 },
    { type: "attack", amount: 5 },
    { type: "block", amount: 5 },
  ], {
    // Aura: every round, each Chebyshev-adjacent ally gains 2 Block -
    // a moving wall that hardens whoever stands next to it. Rewards a
    // clumped formation (deploy carries beside it, not spread out).
    // (block 3 stacked too much attrition value for a generic squad.)
    aura: { effect: { type: "block", amount: 2 } },
  }),
  "deepwood-sovereign": unit("deepwood-sovereign", "Deepwood Sovereign", "shadow", 4, "dps", [
    { type: "attack", amount: 7 },
    { type: "attack", amount: 6 },
  ], {
    // Conditional (position payoff): +4 Strength and Execute 3, but
    // only when deployed to the forward slot (slot 3 / row 1). A
    // lane-breaker you choose to send to the front, echoing the
    // front/back-row weight the positional synergies already added.
    conditionalPassive: {
      when: { frontRow: true },
      effect: [
        { type: "applyBuff", id: "strength", amount: 4 },
        { type: "applyBuff", id: "execute", amount: 3 },
      ],
    },
  }),

  // --- Rare additions: smaller tastes of the same three hooks --------
  // So the tier below also gets the new toys (Marc: "eri harvinaisuuden
  // tason kortteja"). Cost 150 / 54 HP, same as every other rare.
  "saplingward": unit("saplingward", "Saplingward", "leaf", 3, "support", [
    { type: "block", amount: 4 },
    { type: "attack", amount: 4 },
    { type: "heal", amount: 2 },
  ], {
    // Growth, rare-scale: +1 Strength/round. A slow build that pays off
    // in a long fight without warping the squad the way the Elder does.
    growth: { amount: 1 },
  }),
  "emberbanner": unit("emberbanner", "Emberbanner", "ember", 3, "hybrid", [
    { type: "attack", amount: 5 },
    { type: "block", amount: 3 },
    { type: "attack", amount: 4 },
  ], {
    // Aura, rare-scale: adjacent allies gain +1 Strength every round -
    // a rallying warcry that compounds over a fight instead of a
    // one-shot battle-start buff (that's rallyAdjacent's job).
    aura: { effect: { type: "applyBuff", id: "strength", amount: 1 } },
  }),
  "pack-elder": unit("pack-elder", "Pack Elder", "wolf", 3, "dps", [
    { type: "attack", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    // Conditional, rare-scale: Chain 2 when the squad has 2+ Fang -
    // a light nudge toward doubling down on the tribe, not a hard
    // build-around.
    conditionalPassive: {
      when: { tribeCount: { tribe: "fang", min: 2 } },
      effect: [{ type: "applyBuff", id: "chainDamage", amount: 2 }],
    },
  }),
  "stonemoot-sentinel": unit("stonemoot-sentinel", "Stonemoot Sentinel", "warden", 3, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 4 },
    { type: "block", amount: 5 },
  ], {
    // Conditional, rare-scale: Bulwark 1 only in a full 4-unit
    // formation - "fights harder when the whole line is held," a reason
    // to run a complete board rather than a lean 2-3 squad.
    conditionalPassive: {
      when: { squadSize: { min: 4 } },
      effect: [{ type: "applyBuff", id: "bulwark", amount: 1 }],
    },
  }),

  // --- Economy crew (Economy System PRD 30-31, feat/hearthwood-economy-crew) ---
  // Four units whose payoff is the RUN'S ECONOMY, not the fight. Each
  // carries one `economyRole` (economy.js's ECONOMY_ROLES) that runEngine
  // reads off the DEPLOYED board - a cheaper recruit, an earlier interest
  // tier, a bigger win payout, a reroll that stops climbing - and each
  // has the SMALLEST combat numbers in its tier on purpose: deploying one
  // is trading a real fighter for the economy edge (PRD 21). No new
  // status, no engine hook - the autobattler never looks at economyRole.
  // Combat numbers: the SMALLEST real fighter in the tier, not a
  // passenger. A first fairness pass (feeble bodies + a greedy bot that
  // fields whatever it recruits) cost the aggressive Commander ~-5.5pp
  // because a dead slot in fights 1-3 lost the opening; bumped one step
  // + a hair of team block on the two walls so a fielded economy unit
  // still earns its slot. It stays a trade - just not a cliff.
  "grove-merchant": unit("grove-merchant", "Grove Merchant", "merchantGlyph", 3, "economy", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
    { type: "block", amount: 4 },
  ], { economyRole: "merchant", aura: { effect: { type: "block", amount: 1 } } }),
  "acorn-banker": unit("acorn-banker", "Acorn Banker", "stone", 3, "economy", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 4 },
    { type: "block", amount: 4 },
  ], { economyRole: "banker" }),
  "hollow-forager": unit("hollow-forager", "Hollow Forager", "leaf", 2, "economy", [
    { type: "attack", amount: 5 },
    { type: "block", amount: 3 },
    { type: "attack", amount: 4 },
  ], { economyRole: "forager" }),
  "toll-warden": unit("toll-warden", "Toll-Warden", "warden", 2, "economy", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 4 },
  ], { economyRole: "toll-warden", aura: { effect: { type: "block", amount: 1 } } }),

  // --- The Hunters, player answers (feat/hearthwood-hunters) ---------
  // Three ways to blunt a hunting pack (enemies.js the-pack / the-run-
  // down), each reusing an existing hook: a bodyguard, a decoy, and an
  // even-out-the-HP aura.
  "oathshield": unit("oathshield", "Oathshield", "shield", 3, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 4 },
  ], {
    className: "Bulwark",
    // guard (autoBattleEngine.js's threatTarget): in a hunt fight the
    // pack hits Oathshield instead of the ally beside it. Inert against
    // any non-hunting enemy - a targeted answer, not a general buff.
    guard: {},
    // A little team block on top so it earns its slot in the ~90% of
    // fights with no hunters in them.
    aura: { effect: { type: "block", amount: 1 } },
  }),
  "lure-warden": unit("lure-warden", "Lure-Warden", "warden", 2, "tank", [
    { type: "block", amount: 5 },
    { type: "attack", amount: 3 },
  ], {
    className: "Decoy",
    // Taunt 2 at battle start (Stoneheart / wardens-sigil precedent):
    // the pack - and everything else - piles onto the Lure-Warden. Two
    // stacks so it holds through a round it's stunned or skipped.
    passive: [{ type: "applyBuff", id: "taunt", amount: 2 }],
  }),
  "evenwood-elder": unit("evenwood-elder", "Evenwood Elder", "grovekeeper", 3, "support", [
    { type: "heal", amount: 3 },
    { type: "attack", amount: 3 },
  ], {
    // aura (#417): every round each adjacent ally gets Bulwark 1, so the
    // units around the Elder stop being the obvious soft target. Also a
    // small per-round mend from the heal step in its own pattern.
    aura: { effect: { type: "applyBuff", id: "bulwark", amount: 1 } },
  }),

  // --- Coherence content (feat/hearthwood-player-power) --------------
  "keystone-warden": unit("keystone-warden", "Keystone Warden", "warden", 3, "tank", [
    { type: "block", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    className: "Keystone",
    // synergyScaled: +1 Strength per active tribe synergy at battle
    // start. Ordinary in a scattered squad, a real carry in a board
    // that's actually built around 2-3 tribes.
    synergyScaled: { id: "strength", amount: 1 },
  }),
  "driftwood-vagrant": unit("driftwood-vagrant", "Driftwood Vagrant", "wood", 2, "dps", [
    { type: "attack", amount: 6 },
    { type: "attack", amount: 5 },
  ], {
    // A plain, tribe-flexible body for shop-pool breadth (2 tribes so it
    // slots into more boards) - no hook.
  }),
}

// Fusion (TFT/Guildrun-standard, one level only - bounded, not an
// evolution tree): 3 owned copies of the same base unit combine into
// one Tier 2 copy, generated here rather than hand-authored so every
// base unit automatically has a fusion target. +50% HP, +40% on every
// numeric move/passive amount. `fusedFrom` marks it as a fusion
// product (not directly shop-recruitable); `displayTier: 2` drives the
// UI badge.
export const TIER2_SUFFIX = "+"

export function scaleEffect(effect, factor) {
  return effect.amount != null ? { ...effect, amount: Math.round(effect.amount * factor) } : effect
}

function makeTier2(base) {
  return {
    ...base,
    id: `${base.id}${TIER2_SUFFIX}`,
    name: `${base.name}+`,
    fusedFrom: base.id,
    displayTier: 2,
    recruitCost: null,
    maxHp: Math.round(base.maxHp * 1.5),
    movePattern: base.movePattern.map((m) => scaleEffect(m, 1.4)),
    passive: base.passive
      ? base.passive.map((p) => (p.type === "addTrigger" ? { ...p, effect: scaleEffect(p.effect, 1.4) } : scaleEffect(p, 1.4)))
      : null,
    rallyAdjacent: base.rallyAdjacent ? scaleEffect(base.rallyAdjacent, 1.4) : null,
    rallyHeal: base.rallyHeal ? Math.round(base.rallyHeal * 1.4) : null,
    chainDamage: base.chainDamage ? Math.round(base.chainDamage * 1.4) : null,
  }
}

const TIER2_UNITS = Object.fromEntries(
  Object.values(BASE_UNITS).map((base) => [`${base.id}${TIER2_SUFFIX}`, makeTier2(base)]),
)

// Upgrade: a second, independent way to spend Essence on the bench
// besides recruiting/rerolling and (via runEngine.js's relic nodes)
// relics - Marc: "i need to make a build out of relics/upgrades and
// stuff then the game proceeds". Unlike Fusion (needs 3 copies, one
// step, +50%), Upgrade is a per-unit Essence sink you choose to spend
// on any single owned unit, and stacks with Fusion rather than
// replacing it (applied on top of whatever def - base or already-fused
// - the unit currently is). Raised from 2 to 3 max levels after Marc
// asked for "more upgrades content" - the cost curve (COST*(level+1))
// already generalizes to a 3rd level (9 Essence) with no other change.
// Essence rescale (see TIER_COST's own comment above): was 3, part of
// the "3-family" that also included RELIC_COST/COMMANDER_RANK_COST/
// every Commander's activePower.cost - all four were already
// identically priced at 3 Essence pre-rescale, so rounding all four to
// the same 190 keeps that existing invariant intact rather than
// letting independent rounding drift them apart. This is now spent
// exclusively on Relic Upgrade (runEngine.js's upgradeRelic) - the
// direct per-unit Upgrade purchase this curve originally described was
// removed in favor of Fusion (see SquadDraft.jsx's own note on that).
// Rounded to the 50/100/150/200 family (Marc, round numbers).
export const UPGRADE_COST = 150
export const UPGRADE_MAX_LEVEL = 3

export function upgradeCost(level) {
  return level >= UPGRADE_MAX_LEVEL ? null : UPGRADE_COST * (level + 1)
}

// Upgrade branches (feat/hearthwood-upgrade-branches): `upgrades` is the
// entry's ordered array of chosen branch ids (upgrades.js's
// UPGRADE_BRANCHES). Folded on top of the base/fused def at battle
// start (effectiveUnitDef). Legacy: a bare NUMBER is treated as that
// many `power` picks - covers the dormant `upgradeLevel` field this
// used to read (no shipped save carries one > 0) and any external
// caller that still passes a level.
export function unitDefWithUpgrade(def, upgrades) {
  if (typeof upgrades === "number") {
    let d = def
    for (let i = 0; i < upgrades; i++) d = applyBranch("power", d)
    return d
  }
  if (!Array.isArray(upgrades) || upgrades.length === 0) return def
  return upgrades.reduce((d, id) => applyBranch(id, d), def)
}

export const UNITS = { ...BASE_UNITS, ...TIER2_UNITS }
