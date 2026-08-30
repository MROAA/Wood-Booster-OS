# Hearthwood Patchbay

> Phase 0 — foundations only. This directory currently holds the risk
> model, the audit-store wrapper, and the path maps. No routes, no
> behaviour, no frontend yet (those land in Phase 1+).

## Purpose

A safety layer between a proposed change and the Hearthwood game data, so
Marc can keep doing the game's routine rebalancing / content work through
the Dev Studio UI (with a local model, no Claude session) without being
able to break the build or a save.

The full flow (later phases): plain‑Finnish intent → concrete minimal
edit → risk score → snapshot → apply → fast gate → smoke suite →
one‑click revert, with automatic rollback on any failure.

## Responsibilities

| Module | Responsibility |
|---|---|
| `paths.js` | Single source of truth for repo‑relative paths: the 12 Hearthwood data modules and their real `export const` names, the engine dir + file list, the save‑format file, the critical‑file list, the allowed write subtrees, array‑field names, and the stylesheet list. Re‑exports `PROJECT_ROOT`. |
| `riskModel.js` | `classifyRisk({ targetFiles, editSpec })` → tier + gate. Pure, no I/O. Decides `LOW / MEDIUM / HIGH / CRITICAL` from **real paths and edit shape**, never filename keywords. Worst tier wins. |
| `auditStore.js` | `createAuditStore(prisma)` — thin CRUD for the `HearthwoodPatch` model with transparent JSON (de)serialisation of the string columns. |
| `index.js` | Barrel. |

## Dependencies

- **`../spacemonkey/plugins/CodeChangeDeveloper/skills/projectSandbox.js`** — `PROJECT_ROOT` (re‑exported by `paths.js` so the Patchbay and Spacemonkey's code writer can never disagree on the repo root).
- **Prisma** — injected into `createAuditStore(prisma)`; there is no module‑level Prisma import, so every file here loads without a database or generated client present.
- **Node built‑ins only** otherwise (`node:test` / `node:assert` for the tests).

No external npm packages. No network. No filesystem writes.

## Public API

### `classifyRisk({ targetFiles, editSpec }) → { tier, reasons, requiresConfirm, requiresTypeYes, allowedModes }`

- `targetFiles` — `string[]` of repo‑relative paths the change would write.
- `editSpec` — `{ ops: [{ path, op, value }, …] }` **or** `{ mode: "wholeFile" }`.
- Returns:
  - `tier` — `"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"`.
  - `reasons` — `string[]`, human‑readable (Finnish ok), one entry per rule that fired.
  - `requiresConfirm` — `true` for MEDIUM/HIGH/CRITICAL.
  - `requiresTypeYes` — `true` for CRITICAL only.
  - `allowedModes` — `["live","pr"]` for LOW/MEDIUM, `["pr"]` for HIGH/CRITICAL.

Rules (plan A4), worst‑tier‑wins:

| Tier | Fires when |
|---|---|
| **CRITICAL** | any target in `CRITICAL_FILES` (`runSaveState.js`, `vite.config.js`, `scripts/stable-build-check.js`, `server/prisma/schema.prisma`, `package.json`, `package-lock.json`), **or** any target outside `src/**` and `.scratch/**`. → `allowedModes:["pr"]`, `requiresTypeYes:true`. |
| **HIGH** | any target is `src/services/heartwood/{autoBattleEngine,runEngine,cardBattleEngine,effects,targeting,runNarrative}.js`. → `allowedModes:["pr"]`, `requiresConfirm:true`. |
| **MEDIUM** | `≥2` ops; **or** an `addKey` op; **or** an op `path` with a numeric segment or through an array field (`movePattern`, `effects`, `passives`, `synergies`, `traits`, `tags`); **or** any target `src/components/heartwood/*.jsx`; **or** any target `src/**/*.css` (CSS regressions are invisible to `vite build` — preview + confirm only). |
| **LOW** | otherwise — a single `set` op on a scalar path in a `src/data/heartwood/*.js`. |

`editSpec.mode === "wholeFile"` bumps the computed tier one level
(`LOW→MEDIUM`, `MEDIUM→HIGH`); it never downgrades an already
HIGH/CRITICAL result and never escalates to CRITICAL.

### `createAuditStore(prisma) → { create, get, list, update, markStatus }`

- `create(data)` → row. `data.targetFiles / editSpec / backupPaths / qaResult` may be passed as real arrays/objects; they are stringified on the way in.
- `get(id)` → row | `null`.
- `list({ archived } = {})` → `row[]`, newest first. Pass `archived: true|false` to filter.
- `update(id, patch)` → row.
- `markStatus(id, status)` → row.

Every returned row has the four JSON columns parsed back into
arrays/objects (a corrupt column is left as its raw string rather than
throwing).

### `paths.js` exports

`PROJECT_ROOT`, `HEARTHWOOD_DATA_DIR`, `ENTITY_TYPES`, `dataFilePathFor(type)`,
`HEARTHWOOD_ENGINE_DIR`, `HEARTHWOOD_ENGINE_FILES`, `HEARTHWOOD_ENGINE_PATHS`,
`SAVE_FORMAT_FILES`, `HEARTHWOOD_STYLE_FILES`, `CRITICAL_FILES`,
`ALLOWED_TREE_PREFIXES`, `ARRAY_FIELD_NAMES`.

`ENTITY_TYPES` — confirmed real export names on `origin/development`:

| type | file | export | shape |
|---|---|---|---|
| `enemies` | `enemies.js` | `ENEMIES` | object map |
| `units` | `units.js` | `UNITS` | object map (`{...BASE_UNITS, ...TIER2_UNITS}`) |
| `cards` | `cards.js` | `CARDS` | object map |
| `relics` | `relics.js` | `RELICS` | object map |
| `items` | `items.js` | `ITEMS` | object map |
| `characters` | `characters.js` | `CHARACTERS` | object map |
| `formations` | `formations.js` | `FORMATIONS` | object map |
| `synergies` | `synergies.js` | **`SYNERGY_TIERS`** | object map keyed by tribe — *no `SYNERGIES` export exists* |
| `dualClasses` | `dualClasses.js` | `DUAL_CLASSES` | **array** |
| `trials` | `trials.js` | `TRIALS` | object map |
| `tutorial` | `tutorial.js` | **`TUTORIAL_STEPS`** | **array** — *no `TUTORIAL` export exists* |

## Examples

```js
import { classifyRisk, createAuditStore } from "./index.js"

// LOW — one scalar bump on an existing enemy
classifyRisk({
  targetFiles: ["src/data/heartwood/enemies.js"],
  editSpec: { ops: [{ path: ["rotwood-husk", "maxHp"], op: "set", value: 40 }] },
})
// → { tier: "LOW", requiresConfirm: false, allowedModes: ["live","pr"], reasons: [...] }

// HIGH — engine file, PR only
classifyRisk({
  targetFiles: ["src/services/heartwood/runEngine.js"],
  editSpec: { mode: "wholeFile" },
})
// → { tier: "HIGH", allowedModes: ["pr"], requiresConfirm: true, ... }

// Audit store
const store = createAuditStore(prisma)
const patch = await store.create({
  summary: "tee rotwood-huskista kovempi",
  applyMode: "live",
  risk: "LOW",
  targetFiles: ["src/data/heartwood/enemies.js"],
  editSpec: { ops: [{ path: ["rotwood-husk", "maxHp"], op: "set", value: 40 }] },
})
await store.markStatus(patch.id, "applied")
const recent = await store.list({ archived: false }) // newest first
```

## Tests

`server/services/hearthwoodPatchbay/riskModel.test.js` — `node --test`.
Covers: scalar data edit → LOW; array‑field / numeric‑index path →
MEDIUM; whole‑file engine edit → HIGH; save‑format file → CRITICAL +
`requiresTypeYes`; whole‑file data edit → MEDIUM (bump); single CSS
declaration → MEDIUM + `requiresConfirm`; path outside `src/**` →
CRITICAL; `≥2` ops → MEDIUM; `addKey` → MEDIUM; whole‑file component →
HIGH (bump); worst‑tier‑wins across files; `reasons` always non‑empty.

Run:

```
node --test server/services/hearthwoodPatchbay/
```

---

## Prototype → Patchbay concept rename

Marc's prior‑art Python CLI (`tools/heartwood_patch.py`, unmerged branch
`feat/heartwood-content-round7`) is reference only — not merged. Its
whole‑file‑JSON approach is superseded by the Node/AST design. Concept
mapping:

| Prototype (Python) | Patchbay (Node) | Phase |
|---|---|---|
| `heartwood_patch` / `.heartwood-patchbay` naming | `hearthwoodPatchbay` — corrected **"Hearthwood"** spelling everywhere | 0 |
| `history.json` file | `HearthwoodPatch` Prisma model via `auditStore.js` | 0 |
| risk map keyed on filename keywords | `riskModel.classifyRisk` — real engine/save/critical **paths** + edit shape | 0 |
| `HW-0001` string ids | `HearthwoodPatch.code` (portable export) | 3 |
| whole‑file JSON rewrite | `parseAst` locate + `magic-string` splice (`editApplier.js` + root scripts) | 1 |
| CLI `apply` | `POST /api/hearthwood-patchbay/:id/apply` | 1 |
| ad‑hoc git snapshot before apply | Git Guardian backup + `.bak` (`writeCodeChangeSkill`) + `hearthwood-patchbay/live` plumbing commit (`snapshot.js`) | 1 |
| `analyze` / `validate` step | `preview` + `fastGate.js` (`oxlint` + `vite build --outDir <tmp>`) | 1 |
| `test` step | `.scratch` smoke‑suite runner `scripts/hearthwood-qa-run.mjs` + `qaRunner.js` | 2 |
| `doctor()` health check | `doctor.js` → `GET /api/hearthwood-patchbay/doctor` | 2 |
| manual rollback | auto‑rollback on fast‑gate / smoke failure (`revertFromBackup`) | 1–2 |
| PR integration | `prMode.js` → `writeCodeChangePullRequestSkill` + `worktreeSandbox` for HIGH/CRITICAL | 3 |
