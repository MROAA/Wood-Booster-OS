# Hearthwood Fusion — design (Marc chose "Deeper tiers + reward", 2026-10-17)

## Today (before this work)
- 3 copies of the same base hero fuse automatically into one **Tier 2** (`<id>+`,
  name "Name+"): +50% HP, +40% on every numeric move/passive amount
  (`units.js` `makeTier2`, `runEngine.js` `tryFuseOnce` / `fuseAll`).
- Fusion products carry `fusedFrom` (never in shop / reward pools) and
  `displayTier: 2`. Tier 2 can't be upgraded or reforged.

## The plan
1. **Tier 3** — 3 copies of the same Tier 2 fuse into a golden **Tier 3**
   (`<id>++`, name "Name★"): another +50% HP / +40% amounts on top of Tier 2
   (≈ 2.25× HP, 1.96× amounts vs base). `fusedFrom` = the BASE id (so
   dualClasses `baseIdOf` still works); `displayTier: 3`. Max tier.
2. **Fusion reward** — every fusion queues a choice of 1 of 3 rewards
   (`runState.pendingFusionRewards`, a queue; seeded with
   `streamRng(seed, "loot", "fusion:<key>")` so it's reproducible):
   - **Spoils**: +60 Essence (Tier 3: +150)
   - **A gift of gear**: an item into the bag (Tier 2: common/rare, Tier 3: epic+)
   - **Seasoned**: the fused hero gains XP (Tier 2: +6, Tier 3: +15 — LEVEL_XP = [0,6,15,28,45])
   - **Rest by the fire**: the whole squad heals to full, Wounded cleared
   3 of the 4 are offered. `chooseFusionReward(runState, rewardId)` applies the
   first queued reward. UI: a modal in SquadDraft `piece_overlays` (so Market,
   Headquarters and the classic layout all show it), Nordic theme, tarot-ish.
3. **Clear progress** — Tier 2 silver frame, Tier 3 gold frame
   (`data-fusion-tier`); "Fusion x/3" counter on Tier 2 heroes too (toward Tier 3).

## Code touch points (all `displayTier === 2` checks must treat Tier 3 the same)
- `UnitCard.jsx` (data-tier / data-fused / desc), `almanac.js` (fused label),
  `HeartwoodBattle.jsx` coach tip, `SquadDraft.jsx` renderBenchCard
  (canReforge / canUpgrade / fusion counter), `runEngine.js` reforge (≈1378) and
  upgradeUnit (≈1940) guards.
- Fusion happens in `addUnitToBench` (recruit + buyback) and the unit-gift path
  (≈2065); the meta start unit can't fuse.
- Saves: `serializeRun` stores runState verbatim — new fields persist.
