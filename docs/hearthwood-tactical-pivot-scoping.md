# Hearthwood — Tactical Pivot Scoping ("Hearthwood Frontier")

> **Planning artifact, not a work order. No code in this PR.** Written in response
> to Marc's decision (2026-09-12, after reviewing `docs/hearthwood-turn-based-tactical-prd.md`
> logged in PR #446) to **"start planning the real pivot"** — scope what a
> turn-based-tactics rewrite of Hearthwood would actually take, before writing any
> code. A designed version of this same content was published as the artifact
> **"Hearthwood Frontier"** for Marc to review; this is the durable, repo-anchored
> copy so a future round can cite it without depending on the artifact link.

## 1. The tension

Every Hearthwood PRD logged before this one (Enemy Ecosystem, Progressive
Challenge, Build Archetype, Market/Money-Sinks, Strategic Upgrades, Roles/Build
System, Seed/Playstyle...) proposes a system layered **on top of** the shipping
auto-battler: `startAutoBattle`/`resolveRound` in `autoBattleEngine.js` fully
auto-resolves a fight from a pre-battle formation choice — **zero in-combat
player interaction, zero in-combat RNG**. That split (`easy to play, hard to
master`; all depth lives pre-battle) is the standing design mandate behind all
41 shipped rounds to date (#384–#445), all 9 shipped enemy archetypes included.

The Turn-Based Tactical PRD's thesis is the opposite one (its §3, §56): *"a good
build can still lose on a bad decision; a weak build can win on a good one"* —
move the depth INTO combat via a grid, Action Points, initiative order, enemy
telegraphs/intents, line of sight, terrain, reactions, and objectives beyond
"kill everything." Neither direction is wrong; they are not the same game, and
41 rounds are already built on the first rule. This document measures what the
switch would actually cost, so the decision isn't made on the PRD's own framing
alone (which reads as "the whole game is obsolete").

## 2. What already exists — line counts by layer

Surveyed directly from the repo (`src/services/heartwood`, `src/data/heartwood`,
`src/components/heartwood`, `src/pages/Heartwood*.jsx`):

| Layer | Lines | Note |
|---|---|---|
| Services (`autoBattleEngine.js`, `runEngine.js`, `effects.js`, `targeting.js`, ...) | 6 517 | |
| Data (`units.js`, `enemies.js`, `formations.js`, `synergies.js`, `relics.js`, `items.js`, ...) | 13 883 | |
| Components (`FormationScreen.jsx`, `AutoBattleView.jsx`, `SquadDraft.jsx`, ...) | 7 488 | |
| Pages (`HeartwoodBattle.jsx`, `HeartwoodAssistant.jsx`) | 1 686 | |
| **Total** | **29 574** | |

Of that, only **~2 900 lines (~10 %)** — the combat-resolution engine
(`autoBattleEngine.js`, 1 779) and its direct view (`AutoBattleView.jsx`, 472)
plus glue — need genuine replacement. The other ~90 % is content or UI shell
that doesn't care how a single encounter resolves: tribes, synergies, relics,
items, roles, story, economy, meta-progression (Grove/Ledger/Acorns/seed
streams), the shop/map/almanac UI. **The pivot is narrower than the PRD's own
framing suggests** — it obsoletes a specific engine, not the game's content.

## 3. Module-by-module verdicts

| Module | Lines | Current job | Verdict |
|---|---:|---|---|
| `autoBattleEngine.js` | 1 779 | Round resolution, targeting, all 9 archetype ticks (`applyAncientCharge`, `applyCultTick`, `applyCovenTick`, ...) | **Rewrite** |
| `AutoBattleView.jsx` | 472 | Auto-resolve animation + result view | **Rewrite** |
| `effects.js` | 804 | Effect vocabulary: damage/heal/statuses/triggers | **Extend** |
| `targeting.js` | 150 | Grid geometry, pattern attacks, shielding | **Extend** |
| `units.js` + `enemies.js` | 4 173 | Combat kits as `movePattern` step queues | **Re-author as data** (schema changes: a step queue → abilities with range/cost/cooldown; tribes/cost/art/flavour fields untouched) |
| `formations.js` | 744 | Enemy group layout + synergies | **Extend** |
| `synergies.js`, `roles.js`, `relics.js`, `items.js` | 2 580 | Tribes, roles, relics, items — pure data | **Reuse as-is** |
| `runEngine.js` | 2 869 | Shop, Market, Ledger, RUN_PATH, seeds, save/load | **Reuse as-is** (narrow seam at `startFormationBattle`/`resolveBattleOutcome`) |
| `events.js`, `boons.js`, `trials.js`, `storyLog.js`, ... | ~1 500 | Story, crossroads, boons/banes | **Reuse as-is** |
| `SquadDraft.jsx`, `RunMap.jsx`, `GroveScreen.jsx`, `AlmanacScreen.jsx`, ... | ~2 400 | Shop, map, meta-progression UI | **Reuse as-is** |
| `FormationScreen.jsx` | 658 | "Deploy squad → start battle" screen | **Extend** |
| `HeartwoodBattle.jsx` | 1 036 | Phase state machine: shop → formation → battle → result | **Extend** |

Concept continuity: the archetype mechanics don't disappear as *ideas* — the
Ancients' ⚡-countdown (`applyAncientCharge`, #445) is already functionally the
PRD's own "Telegraph System" (§13), just auto-resolved instead of player-paced.
The idea transfers; the resolution mechanism changes.

## 4. Three build paths

- **A — Parallel sandbox (recommended).** Build the new tactics engine in its
  own space (own combat view, own `TurnManager`) reading the SAME unit/enemy/
  tribe/relic data. The live auto-battler stays fully untouched — all 41
  rounds, all fairness tuning, stays playable throughout. Cost: two engines to
  maintain for a while. Benefit: nothing shipped can break, and the effort can
  stop cleanly if the feel doesn't land.
- **B — In-place replacement.** Point `startFormationBattle` at the new engine
  for every fight from day one. Every archetype and every fairness baseline
  breaks simultaneously until the new engine is fully mature. **Not
  recommended** given this project's whole discipline has been `RUNS=100`
  fairness-gating every change — see Risks.
- **C — Hybrid, player's choice.** A's longer-term shape: both modes live on
  permanently (e.g. a separate "Tactical Mode"), sharing content.

## 5. A phased roadmap (path A)

Adapted from the PRD's own §58 phase breakdown. Round-scale estimates, not
commitments — same cadence as every other Hearthwood round.

1. **Isolated prototype** (~1 round) — grid, 2-3 dummy units/side, move, attack,
   turns, HP, win/lose. No connection to the real game; a feel check only.
2. **Tactical layer** (~2-3 rounds) — AP, abilities, cooldowns, targeting,
   enemy intent display. Still sandboxed.
3. **Real content wired in** (~3-4 rounds) — re-author `units.js`/`enemies.js`
   combat fields into the new ability schema; tribes/roles/relics plug into it.
4. **World integration** (~2 rounds) — `FormationScreen`/`HeartwoodBattle` learn
   to launch a tactical fight (instead of, or beside, an auto-battle one). Shop,
   Grove, Ledger, story — untouched.
5. **Depth** (open-ended, several rounds) — terrain, line of sight, reactions,
   combos, multi-stage objectives, boss phases. Nothing here exists yet even in
   sketch form; this is where the PRD's promise actually becomes visible.

## 6. Decisions only Marc can make

1. Does the tactical engine **replace** the auto-battler, or do they run
   side-by-side? (Settles A vs. B vs. C.)
2. Do the current 9 archetypes (Swarm, Cult, Coven, Ancients, ...) need to
   survive the transition, or can an early tactical prototype invent its own
   small roster (the PRD's own §48-49 MVP scope suggests the latter)?
3. Is this the main focus of upcoming rounds, or a background track alongside
   normal `jatketaan` rounds (new archetypes/economy/story)?
4. When does something playable need to exist? Phase 1's isolated prototype
   could be ready after a single round if a fast feel-check is wanted before
   committing further.

## 7. Risks

- **Fairness testing does not carry over.** The project's whole fairness
  discipline has rested on a `RUNS=100` bot that plays the auto-battler
  hundreds of times per second. A turn-based bot would need to make real
  tactical decisions — a much harder simulation problem. Until that exists,
  balance leans more on manual playtesting.
- **UI is a much bigger investment.** Today's "deploy, click, watch the result"
  is one screen. A grid + movement-range preview + targeting + ability menu +
  turn-order strip is a large multiple of the frontend work any single round
  has needed so far.
- **Two-engine maintenance** (paths A/C) — a new mechanic may need considering
  twice if both engines stay alive long-term.
- **Scope creep.** The PRD lists terrain, line of sight, reactions, and
  multi-axis objectives all at once — even its own §49 says not to build it
  all first. The roadmap above is the discipline against that.

## 8. Next step

No code yet. Once Marc has weighed §6's four questions, the natural next
`jatketaan` is **Phase 1 — the isolated prototype**: a small, fully sandboxed
grid-combat spike to see how a turn-based Hearthwood actually feels, before any
larger commitment.
