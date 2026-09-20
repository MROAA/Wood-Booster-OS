# Hearthwood Frontier — Movement & Tactical Gameplay: Scoping Pass

> **A scoping document, not a work order.** This assesses Marc's own
> [Movement & Tactical Gameplay PRD](hearthwood-movement-tactical-prd.md)
> (22 §, logged docs-only in PR #467) against the CURRENT tactics engine
> (`src/services/heartwood/tacticsEngine.js` + `targeting.js`), the same
> way [`hearthwood-tactical-pivot-scoping.md`](hearthwood-tactical-pivot-scoping.md)
> (PR #447) scoped the PARENT "Turn-Based Tactical Roguelite RPG" PRD
> before Phase 1 ever started. No code was written or changed to
> produce this document — every claim below was checked by reading the
> real source directly.

## Where the engine actually stands today

By the end of PR #479, `tacticsEngine.js` has: a 7×10 open grid, a
fixed 3-unit squad vs. a data-driven enemy formation, AP + Move +
Attack + one ability per unit, a fully-generic passive/phase/trigger
framework, 8 fully-ported real mechanics (Execute, Shatter, WoundedFury,
Bulwark, Regen, Taunt, Revive, AoE), and a deterministic player-facing
enemy-intent telegraph. **Confirmed directly by `grep`: zero terrain,
obstacle, facing, Zone of Control, reaction/interrupt, or elevation
concepts exist anywhere in the file.** `reachableTiles`
(`targeting.js:145`) is a plain flood-fill — every step costs exactly
1, and the only thing that can block a cell is another unit's position.
Movement is not "cheap" today so much as it doesn't have a cost model
at all.

## The headline finding: half the PRD's own MVP already exists

The PRD's own §17 ("MVP:n liikkumisjärjestelmä") lists 11 "Pakolliset"
(required) features. Five are already done, built for entirely
unrelated reasons over the course of this session's mechanic-porting
work:

| §17 requirement | Status | Where |
|---|---|---|
| Ruutupohjainen kenttä (grid board) | ✅ Done | `GRID`, Phase 1 |
| Movement-arvo (a Movement stat) | ✅ Done | `moveFromMaxHp`, Phase 1 |
| AP-järjestelmä | ✅ Done | Phase 2 |
| Liike ja hyökkäys samassa vuorossa | ✅ Done | Phase 2's AP model |
| Vihollisen telegraph | ✅ Done | `previewEnemyIntents`, PR #450, extended through PR #478 |
| 4–6 yksikön joukkue | ❌ Net-new | today's squad is fixed at 3 |
| Esteet (obstacles) | ❌ Net-new | no concept of terrain/blocking cells |
| Zone of Control | ❌ Net-new | no spatial-threat concept at all |
| Perusreaktiohyökkäys (reaction attack) | ❌ Net-new | no interrupt system of any kind |
| Korkeusero tai suoja (elevation/cover) | ❌ Net-new | Block/Bulwark are stats, not terrain |
| ≥3 maastotyyppiä (terrain types) | ❌ Net-new | every cell is identical today |
| Voitto/tappiotavoitteet beyond "kill everyone" | ❌ Net-new | `checkTacticsBattleEnd` is hard-coded to living-unit counts |

One more genuine alignment, worth stating plainly: the PRD's own §12
explicitly recommends **"Mode A — Sequential Turn"** for its MVP over a
simultaneous Planning Phase ("selkeä, helppo oppia, hyvä MVP:lle") —
that is exactly the turn model this engine already uses end to end.
Zero rework needed there.

## Full section-by-section verdict

| § | System | Verdict | Notes |
|---|---|---|---|
| 3 | Grid + movement points | **Extend** | Board exists; per-cell cost needs weighted pathfinding, not a flag |
| 4.1 | Momentum-liike | Net-new | A move-then-attack damage/push bonus; layers cleanly on the existing AP model once movement itself has more shape |
| 4.2 | Facing | **Net-new** | A new per-unit direction field + a front/side/back modifier branch touching relative position, not just stats |
| 4.3 | Zone of Control | **Net-new, biggest lift** | No spatial-threat or movement-blocking concept exists |
| 4.4 | Reaktioliike (reactions/interrupts) | **Net-new, biggest lift** | This engine has NEVER interrupted a turn mid-resolution; everything resolves in strict order |
| 4.5 | Ketjuliike (chain moves) | Net-new | Small, depends on reactions existing first |
| 4.6–4.7 | Elevation, falling/pushing | Net-new | Depends on terrain existing first |
| 4.8 | Piiloliike/näkyvyys (stealth/vision) | Net-new | No fog-of-war or vision model exists |
| 4.9 | Terrain Affinity | Net-new | Depends on terrain types existing first; otherwise a straightforward per-tribe stat bonus, the same shape as every archetype passive already ported |
| 5 | Tempo resource | Net-new | A whole new meta-resource layered across many of the above systems — meaningless until several of them exist |
| 6 | 9 movement types (Dash/Charge/Retreat/Blink/Burrow/Climb/Swim/Phase) | Net-new | Each is its own scoped feature; Charge/Retreat are the two that build most directly on what exists today |
| 7 | 5 formation modes | Net-new | A macro-layer on top of individual positioning; needs a bigger squad first to be meaningful |
| 8 | 12 objective types | **Net-new** | `checkTacticsBattleEnd`'s win/loss check needs generalizing beyond living-unit counts |
| 9 | 14 terrain-alteration abilities | Net-new | Depends entirely on terrain types existing first |
| 10 | Movement↔class identity (11 classes) | Net-new (data) | Once movement mechanics exist, this is mostly per-unit data, the same "reuse real data" shape every archetype round already used |
| 11 | Distinct enemy AI tactical roles | Net-new | Today's `decideEnemyIntent` is one script for every enemy; only "Hunter" (weakest-first) has real precedent already, from the archetype series |
| 12 | Turn model | **Already aligned** | PRD recommends Sequential Turn for MVP — this engine already is one |
| 13 | 8 movement status effects | Net-new | Root/Slow/Freeze/etc.; a few (Freeze) are conceptually close to the auto-battler's own Stun, never ported into tactics |
| 14 | World-map route selection | **Out of scope for this engine** | Belongs to `runEngine.js`/`RUN_PATH`, a completely different system |
| 15 | Forest Mood ties | **Out of scope for this engine** | Same as above |
| 16 | Design philosophy | N/A | Restates the existing standing design mandate; not a system to build |

## Recommended first slice

Not the PRD's own §17 MVP — that still bundles terrain + Zone of
Control + reactions + a bigger squad + broader objectives all as
"required," which is itself a multi-month lift. Following the exact
rhythm every mechanic this whole session has already used — **one new
primitive, proven in isolation, before combining it with anything
else** — the recommended first slice is:

**Terrain types + per-cell movement cost, alone.** Concretely: a new
per-cell `terrain` property on the grid, a `movementCost` table per
unit (mirroring the PRD's own §3.2 JSON shape), and `reachableTiles`
reworked from a flood-fill into Dijkstra-style weighted pathfinding.
Demoed via 2-3 new board layouts in the isolated prototype (mud/rock/
water, matching the PRD's own §17 "MVP:n maastot" list), with zero
combat-code or reaction-system changes. This is the one piece nearly
everything else in the PRD (Terrain Affinity, terrain alteration,
Ranger's "wants high ground," Burrow/Climb/Swim) is eventually built on
top of, and it's fully self-contained: it can be built, verified, and
shipped without touching combat at all.

## A phased roadmap (not a schedule)

1. **Terrain types + movement cost** (the recommended first slice above)
2. **Facing** — a self-contained new stat + a damage-modifier branch, buildable independent of terrain
3. **Zone of Control + reactions** — the biggest architectural fork (see open question below); almost everything downstream (chain moves, elevation interactions, most movement types) assumes this exists
4. **A bigger squad (4-6 units)** — touches every `ENEMY_FORMATIONS`/`PLAYER_ROSTER_IDS` assumption; better attempted once the board itself (terrain) has more to offer a bigger squad
5. **Objective types beyond "kill everyone"** — generalizes `checkTacticsBattleEnd`
6. Movement types, formation modes, terrain alteration, enemy AI roles, status effects — each its own future round, roughly in the PRD's own dependency order

## Open questions for Marc

1. **Does a bigger squad (4-6 units) come before or after terrain/Zone
   of Control?** It touches every existing formation/roster assumption,
   and could be sequenced either way.
2. **Should Zone of Control's reaction/interrupt system reuse or
   replace this engine's current strict turn-order model?** This is a
   materially bigger architectural fork than anything built so far this
   session — worth a dedicated design conversation before it's built,
   not decided inside a single round's plan.
3. **Is the world-map layer (§14-15) confirmed as its own separate
   future initiative**, entirely outside this scoping pass?
4. **Does this initiative pause the "one round, one shipped PR" rhythm
   for something longer, or get sliced into that same rhythm** — the
   way the 9-archetype enemy series and the elite/boss mechanic-porting
   initiative both were, each landing as its own small, independently
   shippable round?
