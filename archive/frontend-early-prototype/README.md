# Frontend early prototype (archived)

23 files, all confirmed orphaned (zero importers anywhere in the live
`src/` tree, verified by exact import-path search, not basename
matching) and all part of one or another abandoned early prototype
phase that was later superseded by a real, live implementation:

- **Altrako engine cluster**: `AltrakoEngine.js`, `altrako/altrakoBridge.js`,
  `altrako/memory/altrakoMemory.js`, `altrako/audit/altrakoAudit.js`,
  `altrako/reasoning/alternativeReasoning.js`, `altrako/tests/*`,
  `data/spacemonkey/altrakoIdentity.js`, and the two components that used
  it (`AltrakoReflection.jsx`, `SystemPulse.jsx`). A client-side
  "Altrako" implementation, superseded by the live `/altrako` page +
  `server/services/chatModes/altrako.js` backend, which doesn't touch
  any of this. `SystemPulse.jsx` was additionally broken - it contained
  two duplicate `export const SystemPulse` declarations concatenated
  together, which would be a syntax error if anything had tried to
  import it.
- **Client-side command parser**: `aiCommandParser.js`,
  `aiCommandQueueParser.js` - a Finnish multi-command text parser
  ("avaa X ja sitten näytä Y"). Superseded by the server-side
  `actionPlanner.js`/`aiActionGenerator.js` path already live in
  `server/routes/agentChat.js`.
- **Activity feed prototype**: `spacemonkeyActivityStream.js`,
  `spacemonkeyActivityStatistics.js` - superseded by the live activity
  feed system.
- **API/bridge duplicates**: `spacemonkeyApi.js` (superseded by
  `src/api/client.js`), `spacemonkeyProjectBridge.js` (superseded by
  `setActiveProject` in `src/services/runtime/runtimeContext.js`, which
  `src/pages/ProjectDetails.jsx` already uses directly).
- **Tiny agent-runner stub**: `os/AgentManager.js`,
  `os/agents/LogCleanerAgent.js`, `os/agents/ResourceMonitorAgent.js` -
  a 3-file client-side "agent" pattern with nothing ever registering an
  agent or calling `runAll()`, superseded by the much larger real
  server-side agent system.
- **Static mock data**: `data/spacemonkey/spacemonkeyProjects.js`
  (hardcoded placeholder project list), `data/spacemonkey/
  spacemonkeyContext.js` (a static "Spacemonkey jnr." identity object) -
  superseded by real API-backed project data and the real
  godfile/persona system respectively.
- **`styles/woodBoosterTheme.js`**: a JS theme-object approach, superseded
  by the CSS custom-property (`--wood-*`) based theme already used
  throughout the live app's Tailwind classes.
- **`components/branding/SpacemonkeyAvatar.jsx`**: duplicates
  `components/spacemonkey/AvatarCoreCard.jsx`, which already serves this
  exact role in the live `SpacemonkeyDashboard.jsx`.

Two other genuinely orphaned files from the same audit round -
`components/spacemonkey/SecurityGuard.jsx` and `services/system/
systemRegistry.js` - were real and connectable, and were wired into
`ChatPanel.jsx` in a separate PR instead of archived here.

Moved as-is (not deleted), same treatment as the earlier Boosterverse
archives.
