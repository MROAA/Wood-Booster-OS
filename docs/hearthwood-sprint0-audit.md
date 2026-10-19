# Hearthwood — Sprint 0 Audit (2026-10-19)

Read-only audit per `docs/hearthwood-master-prd-v2.md` §8. No code changed.
Baseline: `development` @ `1075b2b1`.

## Tests actually run

| Suite (engine-only mode, no browser) | Result |
|---|---|
| `verify_combat_depth.mjs` | all pass (0 fails) |
| `verify_dota_depth_2.mjs` | 101 / 101 |
| `verify_hero_identity.mjs` | all pass |
| `verify_mana_3.mjs` | 85 / 85 |
| `verify_campaign_content.mjs` | 196 / 196 |
| `verify_campaign_story.mjs` | 85 / 85 |

**Not run:** browser suites (`verify_tactics_real_battle.mjs`, `verify_sprint_*.mjs` and other Playwright suites). Only ~2 GB RAM was free (Steam running), so running vite + Chromium risked crashing the machine. These suites have to be run as a separate step before Sprint 1 is accepted.

## Feature matrix

✅ works (code wired + engine tests pass) · 🟡 partial · ⬜ planned only

| PRD area | Status | Evidence |
|---|---|---|
| TC-01 turn readability: enemy intents | ✅ | `previewEnemyIntents` is an exact dry-run of the real enemy turn, shown in `TacticsBoard` |
| TC-01 cost/effect preview before acting | 🟡 | `attackPreview` + `hitChance` on hover target exist; no single panel for AP/mana cost + terrain/cover/object effect of a *move* |
| TC-02 tactical choices (cover, facing, ZoC, terrain, objects, elements) | ✅ | 34 `tactics*.js` modules, ~17.5k lines; engine suites pass |
| TC-03 buildcrafting rules (classes, tribes, items, relics, promotions, traits) | ✅ | `classes.js`, `promotions.js`, `traits.js`, `tacticsRelics.js` all wired |
| TC-03 show where a synergy comes from | 🟡 | synergy shown before battle (`SynergyBanner`, `FormationScreen`, `SquadDraft`, `UnitCard`); **nothing about synergies in the battle view** |
| TC-04 mana as a strategic system | ✅ | `tacticsMana.js` (1 057 lines), ley colours, Overchannel, mana-fed enemies; 85/85 |
| TC-04 mana on the battlefield (mana nodes) | ⬜ | campaign ley lines only; no mana tiles/nodes in battles |
| TC-05 fair AI | ✅ | scored deterministic AI + 7 behaviour profiles (`tacticsSmartAi.js`); AI does **not** read the player's build power (no rubber-banding found) |
| TC-06 varied encounters | 🟡 | only 4 objective types: kill / survive / protect / totem (+ reinforcements); no ambush, area defence, mana-node control or elite formation puzzle |
| TC-07 interactive environment | ✅ | destructible objects, hazards, bridges, high ground, ice/lava; usable by both sides |
| Hero progression: levels, skill trees, promotions, traits, gear | ✅ | modules wired, engine suites pass |
| Studio: Object Maker | 🟡 | `battleObjects.js` + `AddBattleObjectForm.jsx` exist; finishing state unverified in UI |
| Studio: Map Painter / Hero Editor / Story Editor (First Song) / Seed Studio | ⬜ | no `battleMaps.js` or editor components yet |
| Studio hidden from player build | 🟡 | dev tools gated by `import.meta.env.DEV`; not verified in a production build |
| Standalone player app (`heartwood-app/`) | ⬜ **stale** | last changed **2026-08-21**, before the tactics pivot; it is an old copy and does not contain the current game |
| Save compatibility | 🟡 | `RUN_SAVE_VERSION = 3` in `runEngine.js`; no migration test found |
| Dead code | — | `cardBattleEngine.js` (0 importers, last touched 2026-08-19) |

## Top 4 development targets

1. **Battle clarity (TC-01/TC-03).** Show cost + effect of every action (move, skill, mana) in one place, and show active synergies/mana in the battle view. Engine data already exists; this is mostly UI work. Biggest impact on "easy to play".
2. **Encounter variety (TC-06).** With 4 objective types, fights repeat. Add ambush, area defence, mana-node control and elite formation, each with ≥ 2 solutions. This also fills the missing TC-04 battlefield mana.
3. **Browser regression baseline.** Run all Playwright suites once on a quiet machine. Until that is done, UI-level "works" is unproven.
4. **Player build for Steam.** `heartwood-app/` is two months out of date. Before any Steam work it has to be rebuilt from the current `src/`, with Studio stripped and saves versioned. (Steam track; not Sprint 1.)

## Proposed Sprint 1 — Combat Feel & Tactical Clarity

1. **Action panel:** hovering a tile or target shows AP cost, mana cost, hit %, damage, and terrain/cover/object effects in one panel (built on `attackPreview`/`hitChance`).
2. **Synergy & mana strip in battle:** active synergies with their sources ("2× Wolf → +10% dmg"), and the mana state at a glance.
3. **Tile info on hover:** what a tile does (high ground, bush, ice, hazard, object) before the move.
4. **Browser regression baseline** run first, so Sprint 1's results can be compared with the state before it.

Checks: 1–2 per feature, fixed seed, plus the existing tactics suites.
