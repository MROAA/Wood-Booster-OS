// Hearthwood - the runtime economy's tunable levers, extracted out of
// runEngine.js (2026-09-19). Marc: "dev studiossa pitää olla mukana
// myös ekonomia ja kaikki muu peliin liittyvä... säädän itse sillä
// pelin vaikeustasoa" (the dev studio needs to include the economy
// too... I will use it myself to adjust the game's difficulty) -
// runEngine.js itself is HIGH risk (Hearthwood Studio only allows live
// edits to plain data files under src/data/heartwood/), so these
// values live here instead, PURE DATA with zero logic of their own,
// and runEngine.js imports them back (re-exporting the ones other
// files already imported FROM runEngine.js directly, so nothing
// outside this file and runEngine.js needed to change). Every value
// below is moved byte-for-byte from its old spot, comments and all -
// nothing here changed meaning, only location.

// All 8 scalar levers below live in ONE object map - Hearthwood
// Studio's entity reader only knows how to walk a single object-map/
// array export per registered type, not several loose top-level
// consts, so grouping them here is what makes them individually
// browsable/editable there. runEngine.js destructures each key back
// into its own old local name (WIN_ESSENCE, GAMBLE_COST, ...) right
// after importing this map, so nothing else about how it reads or
// re-exports them changed.
export const ECONOMY_LEVERS = {
  // WIN_ESSENCE stays FLAT (deliberately NOT coupled to RAMP_CAP): it's
  // per-fight income that compounds across ~43 fights, so coupling it
  // would swing the whole-run difficulty curve hard - exactly what the
  // round-economy pass just calibrated and what this pass must leave
  // intact. START_ESSENCE is a one-time opening lever with a negligible
  // whole-run footprint; that's why it's the one that carries the
  // coupling. If the whole-run curve ever needs to track RAMP_CAP too,
  // that's a separate calibration lever, not this one.
  // Economy tightening pass (Marc, 2026-09-18): "kehitä pelin ekonomiaa
  // tiukemmaksi ... rahan arvo tuntuu enemmän ... enemmän opportunity
  // cost" (make the economy tighter, money's value should feel more,
  // spending should carry more opportunity cost) - separately, "peli
  // tuntuu liian helpolta" (the game feels too easy), from his own real
  // play. Asked directly which lever (base win payout / interest / flat
  // per-win bonuses) - first picked all three at a 25-30% cut, but a
  // RUNS=100 fairness-bot before/after check of all three together
  // collapsed 3 of 4 Commanders' win rates to near-zero (compounding
  // hard across ~40 fights/run - even the base payout cut ALONE did
  // this). Marc's own read: the bot plays too mediocrely to be a
  // trustworthy difficulty signal for this kind of change, so its
  // win-rate collapse isn't itself disqualifying - but scoped down to
  // ONE lever anyway (this one), at the fuller 25% cut, to keep this
  // round's real blast radius small enough for his own play to actually
  // judge, rather than shipping all 3 at once on an unvalidated
  // assumption. Was 200 (see this constant's own history above -
  // deliberately NOT touched by several PRIOR economy passes) - this is
  // the first round Marc has directly asked to move it. If this still
  // reads as too easy (or now too hard) once he's played it further,
  // that real feedback is the actual calibration signal here, not the
  // bot.
  winEssence: 150,

  // Essence rescale (see START_ESSENCE's own comment above): was 2, now
  // 125 (units.js's TIER_COST "2-family" - same value as an uncommon
  // unit's recruit cost).
  // Rounded to the 50/100/150/200 family (Marc, round numbers) - not in
  // Marc's explicit table (an Essence reward, not a price); rounded
  // 125->100 to match how his table rounds 125 elsewhere.
  // Economy tightening pass (see winEssence's own comment): same 25%
  // cut, scaled proportionally so a formation win still pays the same
  // RELATIVE premium over a plain fight it always has.
  formationBonusEssence: 75,

  // Minibosses (Deepwarden, Thornmaw, Wyrmgall) are a harder win than even a
  // formation fight - a bigger payout than formationBonusEssence, same
  // "reward matches difficulty" reasoning essenceForWin's own note gives.
  // Essence rescale: was 3, now 190 (units.js's TIER_COST "3-family").
  // Rounded to the 50/100/150/200 family (Marc, round numbers) - not in
  // Marc's explicit table (an Essence reward, not a price); rounded
  // 190->150 to match how his table rounds 190 elsewhere.
  // Economy tightening pass (see winEssence's own comment): ~25% cut
  // (150 -> 115), same proportional-premium reasoning as the formation/
  // elite bonuses.
  minibossBonusEssence: 115,

  // Elites (feat/hearthwood-elites): a harder win than a formation, not
  // as hard as a Trial miniboss - the reward sits between the two.
  // Economy tightening pass (see winEssence's own comment): 25% cut.
  eliteBonusEssence: 90,

  // The Gamble (Marc: "the game needs also gamble mechanic" - a request
  // alongside/beyond The Gambler economy unit, which only reweights
  // which random Market Event shows up. This one is an ACTIVE wager the
  // player takes themselves): a standing shop action, the same
  // spend-Essence-for-an-unchosen-outcome shape Reroll already has, just
  // aimed at the item/relic pool instead of the 3 unit offers. The
  // VARIANCE is the gamble, not a binary win/lose - a common item is a
  // real loss against the flat gambleCost, a pricier item is roughly a
  // wash, and a relic is the jackpot: relics are otherwise ONLY ever a
  // free node-choice reward, never purchasable at all, so this is the
  // single way Essence can buy one outright. Repeatable, like Reroll -
  // each pull is a fresh independent roll off the seeded shop stream.
  gambleCost: 150,

  // Essence interest (Marc: "kehitetään kauppaan lisää syvyyttä" ->
  // "säästä vai käytä -jännite" -> "korko koko saldolle, TFT-tyyli").
  // The Essence you carry INTO a fight grows a little on a win, capped -
  // so every shop is now "spend this down, or let the pile compound".
  // Deterministic, pure, arithmetic on a balance; paid once in the
  // post-win resolve (resolveBattleOutcome), never mid-combat, never on a
  // boss win (the run ends there). No new runState field - the Essence
  // balance IS the bank, exactly like TFT gold.
  interestRate: 0.1, // 10% (TFT standard)

  interestThreshold: 150, // ~3 banked commons before it kicks in

  // Economy tightening pass (Marc, 2026-09-18): tried cutting this too,
  // alongside the base win payout - a RUNS=100 fairness-bot check showed
  // a severe combined swing, though Marc's own read is that the bot
  // isn't a trustworthy difficulty signal here (it plays too mediocrely
  // to represent a real run). Scoped down to ONE lever anyway (the base
  // win payout above) to keep this round's real-world blast radius
  // small and legible for his own playtesting to judge - left this at
  // its original value, untouched, for now.
  interestCap: 150, // one rare's worth per win - bounds the snowball
}

// The Ledger (SquadDraft.jsx's left rail): one-time, run-wide buys that
// compete with units / Market Level / Rank for the same Essence - the
// competition IS the depth, and last round's interest lever gives you
// something big to save toward. Fairness: the sim bot's shop loop only
// levels market, activates power and recruits - it never buys these, so
// they're inert for it. Costs are tuned by reasoning: a focused player
// takes ~1-2 per run, not all three early; ledger-account (+40/win)
// needs ~11 wins to earn back its 450.
// Marc: "se on pitkä lista nyt ja minusta liikaa kerralla harkittavaksi"
// (it's a long list now, too much to weigh at once) -> "niitä voi
// porrastaa molempiin market lvl ja tier lvl missä se loogisimmillaan
// voisi olla" (stage them across BOTH Market Level and Market Tier,
// whichever is more logical per item). Split by KIND, not evenly: the
// 4 pure-economy buys (discount/slot/win-bonus/sell-bonus) gate on
// `unlockLevel` (Market LEVEL, the general "the shop grows" meter);
// the 6 combat-counter + shop-structure buys gate on `unlockTier`
// (Market TIER, the "specialist recruit pools deepen" meter) - a
// combat counter or a shop-reshaping tool becoming available as the
// fights get harder/deeper is the more logical pairing than tying it
// to the economy meter. Both read via investmentUnlocked below;
// exactly one of unlockLevel/unlockTier is ever set per entry.
//
// Both meters actually START at 1 (startRun) and cap at MARKET_LEVEL_
// MAX/MARKET_TIER_MAX (3) - so 0 and 1 are BOTH "available from the
// very start of a run" (0 is only used where "no real gate" reads more
// honestly than duplicating the value 1). The real reachable stages are
// 1/2/3, and the 10 entries are balanced across them as 3 at the
// start (Regular's Discount, Trader's Compass, The Rearguard), 4 at
// the middle stage, 3 at the max stage - not a per-axis-independent
// split, a COMBINED one across both meters together (a player who
// pushes Tier and ignores Level, or vice versa, still only ever sees
// one new stage's worth land at a time, never a jump of 4+).
export const SHOP_INVESTMENTS = {
  "regulars-discount": {
    name: "Regular's Discount",
    cost: 300,
    desc: "Every unit you recruit costs 20% less for the rest of the run.",
    unlockLevel: 0,
  },
  "wider-stall": {
    name: "Wider Stall",
    cost: 350,
    desc: "The market shows one more unit every visit.",
    unlockLevel: 2,
  },
  "ledger-account": {
    name: "Ledger Account",
    cost: 450,
    // Economy tightening pass (Marc, 2026-09-18): tried cutting this
    // too alongside the base win payout, but a RUNS=100 fairness check
    // of ALL 3 chosen levers together collapsed 3 of 4 Commanders to
    // near-zero win rates - Marc chose to keep only ONE lever (the
    // base win payout) at the fuller cut instead. Left at its
    // original value.
    desc: "+40 Essence every battle win, permanently.",
    unlockLevel: 3,
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
    unlockTier: 1,
  },
  // The Marked Coin (feat/hearthwood-coven): the enemy-side mirror of
  // The Rearguard - a run-wide relic ("marked-coin", relics.js
  // `markLowestEnemyHp`) that puts Vulnerable on the frailest enemy
  // (the Coven Matron, or whatever key piece is softest) every fight.
  "marked-coin": {
    name: "The Marked Coin",
    cost: 400,
    desc: "The frailest thing on the enemy line starts every battle Vulnerable - it takes the hits harder.",
    unlockTier: 2,
  },
  // Market Charter (feat/hearthwood-market-tiers): a shop-LAYER Ledger buy
  // (no battle effect). The relic "market-charter" makes effectiveMarketTier
  // read one Tier higher (capped at 3), so the shop offers the next
  // specialist sub-pool without paying the Tier-advance cost.
  "market-charter": {
    name: "The Market Charter",
    cost: 350,
    desc: "The shop opens one Market Tier higher for the rest of the run.",
    unlockTier: 2,
  },
  // Trader's Compass (feat/hearthwood-market-events): the relic
  // "traders-compass" doubles pickMarketEvent's chance for the rest of
  // the run - special markets (Golden / Wandering Merchant / Blackroot)
  // turn up twice as often. Shop-LAYER, no battle effect.
  "traders-compass": {
    name: "The Trader's Compass",
    cost: 300,
    desc: "Special markets - the Golden Market and its kin - turn up twice as often for the rest of the run.",
    unlockTier: 0,
  },
  // The Silenced Bell (feat/hearthwood-cult): the relic "silenced-bell"
  // (relics.js `stunHighestHp`) stuns the largest enemy on the line at
  // the start of every battle - the Ritual Warden in a Cult fight (so
  // its first ritual charge is stalled), the tankiest body anywhere else.
  "silenced-bell": {
    name: "The Silenced Bell",
    cost: 400,
    desc: "The largest thing on the enemy line starts every battle stunned - one turn lost, one ritual charge missed.",
    unlockTier: 3,
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
    unlockTier: 3,
  },
  // The Appraiser's Eye (this round): the first Ledger buy on the SELL
  // side rather than the recruit side - a PERMANENT counterpart to The
  // Ragpicker's Market's own temporary, random 1.5x sell-refund event
  // (feat/hearthwood-market-ragpicker). Reuses that round's own
  // sellRefundFor/effectiveSellMult plumbing wholesale - a plain
  // runState.sellBonus field (the same "shop-layer, not a relics-array
  // entry" shape regulars-discount/wider-stall/ledger-account already
  // use), no new mechanic. Named, deliberate choice of magnitude: 15%
  // stays clearly smaller than Ragpicker's own 50% so a lucky market
  // event still feels like a real, distinct spike, not made redundant
  // by owning this.
  "appraisers-eye": {
    name: "The Appraiser's Eye",
    cost: 350,
    desc: "Selling a unit refunds 15% more, for the rest of the run.",
    unlockLevel: 2,
  },
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
    sellMult: 1,
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
    sellMult: 1,
    lockReroll: true,
  },
  golden: {
    name: "The Golden Market",
    blurb: "Every stall is open - and priced like it.",
    effect: "Stocks the top Market Tier · recruits cost 35% more",
    tone: "gold",
    slotDelta: 0,
    // = MARKET_TIER_MAX (runEngine.js) - inlined rather than imported
    // to avoid a circular import between this file and runEngine.js
    // (which imports MARKET_EVENTS from here). Update both together if
    // MARKET_TIER_MAX itself ever changes.
    tierOverride: 3,
    priceMult: 1.35,
    sellMult: 1,
    lockReroll: false,
  },
  // The first market event on the SELL side of the ledger instead of
  // the buy side (PRD's own §19 Sell System / §20 Opportunity Cost,
  // still otherwise untouched) - every other event changes what
  // recruiting costs; this one changes what your bench is worth
  // instead, a genuinely different lever rather than a 4th spin on the
  // same one. Recruits, slots and tier are all left untouched
  // (priceMult: 1, slotDelta: 0, tierOverride: null) so it never
  // competes with Merchant/Blackroot/Golden for the same decision.
  ragpicker: {
    name: "The Ragpicker's Market",
    blurb: "Every scrap has a buyer here - what you've outgrown is worth keeping, for once.",
    effect: "Selling a unit refunds 50% more this stop",
    tone: "cosmic",
    slotDelta: 0,
    tierOverride: null,
    priceMult: 1,
    sellMult: 1.5,
    lockReroll: false,
  },
}
