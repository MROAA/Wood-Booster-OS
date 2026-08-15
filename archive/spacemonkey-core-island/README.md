# Spacemonkey/core JS island (archived)

21 files (18 `.js` + 3 `.json`) that lived at the root-level
`Spacemonkey/core/` directory - notable because the rest of
`Spacemonkey/` is a content-only vault of `.txt` godfiles read directly
by `server/services/spacemonkey/knowledgeLoader.js` and
`aiBrainV2/knowledge/providers/godfileProvider.js`; this `core/`
subfolder was the one place in that directory holding runnable code.

Confirmed a fully self-contained, disconnected island: every file only
imports from siblings inside this same folder
(`spacemonkeyCoreAPI.js` -> `spacemonkeyIdentityBridge.js` /
`spacemonkeyValuesBridge.js` / `spacemonkeyRuntimeController.js` /
`spacemonkeyCoreLoader.js` / `spacemonkeyMemoryBridge.js`, etc.), and
nothing outside `Spacemonkey/core/` ever imported anything from it -
verified with a repo-wide search for the literal path.

Found while checking a loose end from the aiBrainV2 archive round
(PR #112): three of these files
(`spacemonkeyDecisionBridge.js`, `spacemonkeyPlanningBridge.js`,
`spacemonkeyPersonalityBridge.js`) imported directly from
`server/services/aiBrainV2/system/spacemonkey/spacemonkeyDecisionEngine.js`
and its siblings - which are now themselves archived at
`archive/aibrainv2-dead-cluster/`. So on top of already being
unreachable, this island's imports are now broken outright. Not a new
problem this move causes - it was already fully dead before that PR
touched anything.

Moved as-is (not deleted), same treatment as the earlier archive
rounds. Verified: `node --check` passes on every remaining `.js` file
under `server/` after the move.
