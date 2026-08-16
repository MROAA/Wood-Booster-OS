# Server-side superseded services (archived)

7 files confirmed orphaned during the same audit round that found
`philosophyGuard.js`/`aiQualityControl.js`/etc. (connected in PR #108)
and `knowledgeSearch.js` (connected in PR #109). These 7 were real, not
mock, but each duplicates something already live:

- `agentRules.js` - a single unused template string of agent rules,
  superseded by `agentLawLoader.js` + `agents/agentLaws/*.js`, already
  live in `agents/productAgent.js`/`workshopAgent.js`.
- `priceGuard.js` - a euro/price-claim validator, subset of the
  euro/percentage checking already inside `aiQualityControl.js`
  (connected in PR #108).
- `businessKnowledgeGuard.js` - real but weak verb-substring matching,
  overlapping `aiQualityControl.js`/`aiGroundingValidator.js` with more
  false-positive risk, not more signal.
- `memoryProposalGenerator.js` - imports the same
  `memoryExtractor.js`/`memoryValidator.js`/`memoryProposalService.js`
  trio as the already-live `memoryPipelineAdapter.js` (used in
  `aiBrain.js`), same extract-validate-propose sequence.
- `memoryIntentProposalService.js` - a thin wrapper over the same live
  `memoryProposalService.js`.
- `debugRoutes.js` - a dev-only route-listing helper, never called, and
  reads `app.router.stack` which doesn't match how routes are actually
  registered here.
- `addSystemContextToAgentChat.mjs` (from `scripts/`) - a one-shot code-
  patch script whose job (adding the `createSystemContextKnowledge`
  import to `agentChat.js`) was already done by the time this was found
  - the import it was meant to insert already existed in the live file.

Moved as-is (not deleted), same treatment as the earlier archive
rounds. `scripts/build-tauri.sh` was checked too but deliberately left
in place - it's referenced by name in other scripts' error messages as
an intentional manual step ("Run build-tauri.sh first"), not dead code.
