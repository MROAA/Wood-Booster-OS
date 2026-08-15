# aiBrainV2 dead cluster (archived)

33 files from `server/services/aiBrainV2/`, confirmed orphaned (zero
importers anywhere, with known basename-collision traps against
identically-named *live* files elsewhere explicitly checked and ruled
out - e.g. the live `server/services/spacemonkey/spacemonkeyMemoryBridge.js`
and `server/routes/spacemonkeyIdentity.js` are different files from the
archived `spacemonkeyMemoryBridge.js`/`spacemonkeyIdentity.js` here).

Found in the same sweep that also found `finnishIdentityEngine.js` (a
real, connectable file - see the separate PR that wired it in instead
of archiving it). These 33 were read individually and are either mock/
template content or duplicate an already-live implementation:

- **Code-tooling cluster** (`spacemonkeyIntentEngine.js`,
  `spacemonkeyCodingAnalyzer.js`, `spacemonkeyCodingContextResolver.js`,
  `spacemonkeyCodeInspection.js`, `spacemonkeyCodeChangePlanner.js`,
  `spacemonkeyCodePipeline.js`, `spacemonkeyDecisionEngine.js`,
  `spacemonkeyPlanningEngine.js`, `spacemonkeyCognitiveStyle.js`,
  `spacemonkeyCuriosityEngine.js`, `spacemonkeyValueAlignment.js`,
  `spacemonkeyUserProfile.js`, `spacemonkeyBehaviorGuard.js`,
  `spacemonkeyEventBridge.js`, `spacemonkeyCognitiveCycle.js7`): mostly
  thin keyword-matching or canned Finnish string templates. Dev
  Studio's actual code-change pipeline (`devCodeChangeStudio.js`,
  `codeChangeGenerator.js`, `verificationTestGenerator.js`,
  `draftSetService.js`) already does real LLM-backed code generation,
  diffing, and verification - this cluster is a strictly weaker regex/
  template re-implementation of the same idea.
  `spacemonkeyCognitiveCycle.js7` has a typo'd extension (`.js7`) and
  was never loadable by Node under any circumstance - it's the missing
  orchestrator that would have wired most of this cluster together, but
  even wired up it wasn't worth connecting per the above.
- **Memory cluster** (`spacemonkeyMemoryRetrieval.js`,
  `spacemonkeyMemoryAdapter.js`, `spacemonkeyMemoryQuality.js`,
  `spacemonkeyMemoryIntelligence.js`, `spacemonkeyMemoryBridge.js`,
  `spacemonkeyMemoryContextBuilder.js`,
  `modules/spacemonkeyMemoryModule.js`): each duplicates a piece of the
  already-live memory pipeline (`aiBrainV2/engines/
  memoryRetrievalEngine.js`, `memoryExtractor.js`,
  `memoryPipelineAdapter.js`). `spacemonkeyMemoryBridge.js` specifically
  would have been a safety regression if connected - it writes memory
  directly to the DB, bypassing the live proposal/approval flow.
- **Identity/root/snapshot cluster** (`identity/spacemonkeyIdentity.js`,
  `root/spacemonkeyRootFilesystemEngine.js`,
  `snapshots/spacemonkeySnapshotEngine.js`,
  `snapshots/spacemonkeyRecoveryManager.js`,
  `recovery/spacemonkeyRecoveryApprovalService.js`): each duplicates an
  already-live identity/snapshot/recovery service elsewhere in
  `server/services/spacemonkey/` and `server/routes/`.
- **Context-injection cluster**
  (`services/contextEngineInjectionAdapter.js`,
  `services/memoryContextProvider.js`,
  `services/spacemonkeyContextInjectionService.js`,
  `services/spacemonkeyKnowledgeRuntimeAdapter.js`,
  `spacemonkey/spacemonkeyUnifiedContext.js`,
  `spacemonkey/spacemonkeyBrainContextAdapter.js`):
  `contextEngineInjectionAdapter.js` is itself unloadable (imports
  `server/services/llmSystem/`, deleted in an earlier round of this
  same cleanup initiative); the rest are thin wrappers around it or
  around already-live pieces.

**Left in place for a possible future look**, not archived here:
`snapshots/spacemonkeySnapshotPolicyEngine.js` (small, real, no live
equivalent found - a plausible drop-in "should this change need a
snapshot/approval" gate for Dev Studio), `spacemonkeyCodeUnderstanding.js`
(real regex-based code structure extraction, marginal value over just
letting the model read the file), `knowledge/builders/
knowledgeContextBuilder.js` (real godfile-index builder, needs a head-
to-head comparison against the live `spacemonkeyGodFileLoader.js`
before deciding), and `spacemonkeyRootService.js` (real DB accessor,
not really a "feature" - a consolidation candidate if the two live
services that query the same table directly are ever refactored).

Moved as-is (not deleted), same treatment as the earlier archive
rounds. Verified: `node --check` passes on every remaining file in
`server/services/aiBrainV2/`, and a full server boot + live chat
request completed successfully after the move.
