/**
 * Wood-Booster OS
 * Boosterverse Runtime Orchestrator
 *
 * Tarkoitus:
 * - kytkeä Boosterverse-moduulit yhteen
 * - ylläpitää hallittua runtime-sykettä
 * - muodostaa Spacemonkeylle yksi yhdistetty context
 * - pitää moduulit edelleen toisistaan irrotettavina
 *
 * Tämä moduuli EI:
 * - korvaa nykyistä Spacemonkey Corea
 * - käytä työkaluja suoraan
 * - tee korkean riskin toimintoja
 * - kirjoita Canon-tietoa automaattisesti
 * - suorita workflow'ta ilman erillistä pyyntöä
 *
 * Filosofia:
 *
 * OBSERVE
 *   ↓
 * FOCUS
 *   ↓
 * INTENT
 *   ↓
 * GOAL
 *   ↓
 * PLAN
 *   ↓
 * WORKFLOW
 *   ↓
 * EXECUTION
 *
 * Runtime Orchestrator yhdistää tilan.
 * Se ei tee kaikkia vaiheita automaattisesti.
 */

const MODULE_ID =
  "boosterverse-runtime-orchestrator"

const MODULE_VERSION =
  "1.0.0"

const DEFAULT_TICK_INTERVAL_MS = 1000

const state = {
  initialized: false,
  running: false,

  startedAt: null,
  updatedAt: null,
  lastTickAt: null,

  tickIntervalMs:
    DEFAULT_TICK_INTERVAL_MS,

  tickTimer: null,

  tickCount: 0,

  modules: new Map(),

  latestSnapshot: null,

  history: [],

  counters: {
    modulesRegistered: 0,
    ticks: 0,
    errors: 0,
    snapshotsBuilt: 0,
  },
}


/**
 * Alustus.
 */
function initializeBoosterverseRuntimeOrchestrator({
  tickIntervalMs =
    DEFAULT_TICK_INTERVAL_MS,
} = {}) {
  if (state.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  const now =
    new Date().toISOString()

  state.initialized = true
  state.startedAt = now
  state.updatedAt = now

  state.tickIntervalMs =
    normalizeInterval(
      tickIntervalMs
    )

  return {
    success: true,
    status: "initialized",
    moduleId: MODULE_ID,
    version: MODULE_VERSION,
    tickIntervalMs:
      state.tickIntervalMs,
  }
}


/**
 * Rekisteröi Boosterverse-moduulin.
 *
 * module API voi sisältää esimerkiksi:
 *
 * health()
 * getLiveContext()
 * getFocusContext()
 * getIntentContext()
 * getGoalContext()
 * getPlanningContext()
 * getWorkflowContext()
 * getExecutionContext()
 * getCapabilityContext()
 * getToolContext()
 */
function registerRuntimeModule({
  id,
  name = null,
  module = null,
  enabled = true,
} = {}) {
  ensureInitialized()

  const moduleId =
    sanitizeString(id)

  if (!moduleId) {
    return {
      success: false,
      error:
        "Runtime module id is required",
    }
  }

  if (
    !module ||
    typeof module !== "object"
  ) {
    return {
      success: false,
      error:
        "Runtime module object is required",
    }
  }

  const now =
    new Date().toISOString()

  const existing =
    state.modules.get(
      moduleId
    )

  const record = {
    id: moduleId,

    name:
      sanitizeString(name) ||
      module.name ||
      moduleId,

    module,

    enabled:
      Boolean(enabled),

    healthy: null,

    lastHealthCheckAt:
      null,

    lastError:
      null,

    createdAt:
      existing?.createdAt ??
      now,

    updatedAt:
      now,
  }

  state.modules.set(
    moduleId,
    record
  )

  if (!existing) {
    state.counters
      .modulesRegistered += 1
  }

  addHistory({
    action:
      "runtime-module-registered",

    moduleId,

    enabled:
      record.enabled,
  })

  touch()

  return {
    success: true,
    created:
      !Boolean(existing),

    module:
      serializeModuleRecord(
        record
      ),
  }
}


/**
 * Aktivoi/deaktivoi runtime-moduulin.
 */
function setRuntimeModuleEnabled(
  moduleId,
  enabled
) {
  ensureInitialized()

  const record =
    state.modules.get(
      sanitizeString(
        moduleId
      )
    )

  if (!record) {
    return {
      success: false,
      error:
        "Runtime module not found",
    }
  }

  record.enabled =
    Boolean(enabled)

  record.updatedAt =
    new Date().toISOString()

  addHistory({
    action:
      "runtime-module-enabled-changed",

    moduleId:
      record.id,

    enabled:
      record.enabled,
  })

  touch()

  return {
    success: true,

    module:
      serializeModuleRecord(
        record
      ),
  }
}


/**
 * Käynnistää runtime-sykkeen.
 */
function startRuntime() {
  ensureInitialized()

  if (state.running) {
    return {
      success: true,
      status:
        "already-running",
    }
  }

  state.running = true

  const now =
    new Date().toISOString()

  state.lastTickAt =
    now

  state.tickTimer =
    setInterval(
      () => {
        runRuntimeTick().catch(
          (error) => {
            state.counters
              .errors += 1

            addHistory({
              action:
                "runtime-tick-error",

              error:
                sanitizeString(
                  error?.message
                ) ||
                "unknown-runtime-error",
            })
          }
        )
      },
      state.tickIntervalMs
    )

  addHistory({
    action:
      "runtime-started",

    tickIntervalMs:
      state.tickIntervalMs,
  })

  touch()

  return {
    success: true,
    status: "running",
    tickIntervalMs:
      state.tickIntervalMs,
  }
}


/**
 * Pysäyttää runtime-sykkeen.
 */
function stopRuntime() {
  ensureInitialized()

  if (
    state.tickTimer
  ) {
    clearInterval(
      state.tickTimer
    )

    state.tickTimer = null
  }

  state.running = false

  addHistory({
    action:
      "runtime-stopped",
  })

  touch()

  return {
    success: true,
    status: "stopped",
  }
}


/**
 * Yksi turvallinen runtime-tick.
 *
 * Ei automaattisesti suorita workflow'ta.
 * Ei kutsu LLM:ää.
 *
 * Se vain lukee nykytilan ja rakentaa snapshotin.
 */
async function runRuntimeTick() {
  ensureInitialized()

  const tickStartedAt =
    new Date().toISOString()

  state.tickCount += 1
  state.counters.ticks += 1

  const moduleHealth =
    await collectModuleHealth()

  const snapshot =
    buildRuntimeSnapshot({
      moduleHealth,
    })

  state.latestSnapshot =
    snapshot

  state.lastTickAt =
    tickStartedAt

  state.counters
    .snapshotsBuilt += 1

  addHistory({
    action:
      "runtime-tick",

    tick:
      state.tickCount,

    snapshotId:
      snapshot.id,
  })

  touch()

  return {
    success: true,

    tick:
      state.tickCount,

    snapshot:
      clone(snapshot),
  }
}


/**
 * Rakentaa yhdistetyn Spacemonkey-contextin.
 *
 * Tämä on se context, jonka voi myöhemmin
 * injektoida AI-pipelineen.
 */
function buildRuntimeSnapshot({
  moduleHealth = {},
} = {}) {
  ensureInitialized()

  const now =
    new Date().toISOString()

  const snapshot = {
    id:
      createId(
        "bv-runtime-snapshot"
      ),

    timestamp:
      now,

    world:
      callModuleGetter(
        "boosterverse-world-state",
        "getLiveContext"
      ),

    focus:
      callModuleGetter(
        "boosterverse-focus-engine",
        "getFocusContext"
      ),

    intent:
      callModuleGetter(
        "boosterverse-intent-engine",
        "getIntentContext"
      ),

    goal:
      callModuleGetter(
        "boosterverse-goal-engine",
        "getGoalContext"
      ),

    planning:
      callModuleGetter(
        "boosterverse-planning-engine",
        "getPlanningContext"
      ),

    workflow:
      callModuleGetter(
        "boosterverse-workflow-engine",
        "getWorkflowContext"
      ),

    execution:
      callModuleGetter(
        "boosterverse-execution-engine",
        "getExecutionContext"
      ),

    identity:
      callModuleGetter(
        "boosterverse-identity-engine",
        "getIdentityContext"
      ),

    capabilities:
      callModuleGetter(
        "boosterverse-capability-registry",
        "getCapabilityContext"
      ),

    tools:
      callModuleGetter(
        "boosterverse-tool-bus",
        "getToolContext"
      ),

    health:
      moduleHealth,

    runtime: {
      moduleId:
        MODULE_ID,

      running:
        state.running,

      tick:
        state.tickCount,

      tickIntervalMs:
        state.tickIntervalMs,
    },
  }

  return snapshot
}


/**
 * Palauttaa uusimman snapshotin.
 */
function getLatestRuntimeSnapshot() {
  ensureInitialized()

  return state.latestSnapshot
    ? clone(
        state.latestSnapshot
      )
    : null
}


/**
 * Pakottaa uuden snapshotin heti.
 */
async function refreshRuntimeSnapshot() {
  return runRuntimeTick()
}


/**
 * Palauttaa Spacemonkey AI:lle pienen
 * runtime-contextin.
 *
 * Tarkoituksella ei palauteta kaikkea
 * historiaa tai valtavaa tietomassaa.
 */
function getSpacemonkeyRuntimeContext() {
  ensureInitialized()

  if (!state.latestSnapshot) {
    state.latestSnapshot =
      buildRuntimeSnapshot()
  }

  const snapshot =
    state.latestSnapshot

  return clone({
    timestamp:
      snapshot.timestamp,

    identity:
      snapshot.identity,

    world:
      snapshot.world,

    focus:
      snapshot.focus,

    intent:
      snapshot.intent,

    goal:
      snapshot.goal,

    planning:
      snapshot.planning,

    workflow:
      snapshot.workflow,

    execution:
      snapshot.execution,

    capabilities:
      snapshot.capabilities,

    systemHealth:
      summarizeHealth(
        snapshot.health
      ),
  })
}


/**
 * Tarkistaa kaikki rekisteröidyt moduulit.
 */
async function collectModuleHealth() {
  const health = {}

  for (
    const [
      moduleId,
      record,
    ]
    of state.modules.entries()
  ) {
    if (!record.enabled) {
      health[moduleId] = {
        healthy: null,
        status:
          "disabled",
      }

      continue
    }

    const module =
      record.module

    const healthFunction =
      module.health

    if (
      typeof healthFunction !==
      "function"
    ) {
      health[moduleId] = {
        healthy: null,
        status:
          "health-check-unavailable",
      }

      continue
    }

    try {
      const result =
        await healthFunction()

      health[moduleId] =
        clone(result)

      record.healthy =
        result?.healthy ??
        null

      record.lastHealthCheckAt =
        new Date().toISOString()

      record.lastError = null
    } catch (error) {
      state.counters
        .errors += 1

      record.healthy = false

      record.lastHealthCheckAt =
        new Date().toISOString()

      record.lastError =
        sanitizeString(
          error?.message
        ) ||
        "unknown-health-error"

      health[moduleId] = {
        healthy: false,

        status:
          "health-check-error",

        error:
          record.lastError,
      }
    }
  }

  return health
}


/**
 * Hakee tietyn getterin rekisteröidystä moduulista.
 */
function callModuleGetter(
  moduleId,
  getterName
) {
  const record =
    state.modules.get(
      moduleId
    )

  if (
    !record ||
    !record.enabled
  ) {
    return null
  }

  const getter =
    record.module[
      getterName
    ]

  if (
    typeof getter !==
    "function"
  ) {
    return null
  }

  try {
    return getter()
  } catch (error) {
    state.counters
      .errors += 1

    record.lastError =
      sanitizeString(
        error?.message
      ) ||
      "runtime-getter-error"

    return {
      error:
        record.lastError,
    }
  }
}


/**
 * Palauttaa runtime-moduulit.
 */
function listRuntimeModules() {
  ensureInitialized()

  return [
    ...state.modules.values(),
  ].map(
    serializeModuleRecord
  )
}


/**
 * Runtime-yhteenveto.
 */
function getRuntimeSummary() {
  ensureInitialized()

  const enabled =
    [
      ...state.modules.values(),
    ].filter(
      (record) =>
        record.enabled
    ).length

  const healthy =
    [
      ...state.modules.values(),
    ].filter(
      (record) =>
        record.enabled &&
        record.healthy === true
    ).length

  return {
    running:
      state.running,

    tick:
      state.tickCount,

    tickIntervalMs:
      state.tickIntervalMs,

    modules: {
      total:
        state.modules.size,

      enabled,

      healthy,
    },

    lastTickAt:
      state.lastTickAt,

    latestSnapshotId:
      state.latestSnapshot
        ?.id ?? null,

    counters:
      clone(
        state.counters
      ),

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Health.
 */
function getBoosterverseRuntimeOrchestratorHealth() {
  return {
    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    healthy:
      state.initialized,

    status:
      state.running
        ? "running"
        : "idle",

    metrics:
      getRuntimeSummary(),
  }
}


/**
 * Historia.
 */
function getRuntimeHistory(
  limit = 50
) {
  ensureInitialized()

  return state.history
    .slice(
      -Math.max(
        1,
        Math.min(
          Number(limit) ||
            50,
          500
        )
      )
    )
    .reverse()
    .map(clone)
}


/**
 * Test-reset.
 */
function resetRuntimeOrchestrator() {
  ensureInitialized()

  stopRuntime()

  state.modules.clear()

  state.latestSnapshot =
    null

  state.tickCount = 0

  state.history = []

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Tiivistää healthin AI-contextia varten.
 */
function summarizeHealth(
  health
) {
  if (
    !health ||
    typeof health !== "object"
  ) {
    return {
      status:
        "unknown",
    }
  }

  const entries =
    Object.entries(
      health
    )

  const unhealthy =
    entries.filter(
      ([, result]) =>
        result?.healthy ===
        false
    )

  const healthy =
    entries.filter(
      ([, result]) =>
        result?.healthy ===
        true
    )

  return {
    status:
      unhealthy.length > 0
        ? "degraded"
        : "healthy",

    healthyModules:
      healthy.length,

    unhealthyModules:
      unhealthy.map(
        ([id]) => id
      ),

    totalModules:
      entries.length,
  }
}


/**
 * Turvallinen moduuli-metadata.
 */
function serializeModuleRecord(
  record
) {
  return {
    id:
      record.id,

    name:
      record.name,

    enabled:
      record.enabled,

    healthy:
      record.healthy,

    lastHealthCheckAt:
      record
        .lastHealthCheckAt,

    lastError:
      record.lastError,

    createdAt:
      record.createdAt,

    updatedAt:
      record.updatedAt,
  }
}


function normalizeInterval(
  value
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return DEFAULT_TICK_INTERVAL_MS
  }

  return Math.max(
    250,
    Math.min(
      number,
      60000
    )
  )
}


function addHistory(entry) {
  state.history.push({
    ...entry,

    timestamp:
      new Date().toISOString(),
  })

  if (
    state.history.length >
    500
  ) {
    state.history =
      state.history.slice(
        -500
      )
  }
}


function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


function sanitizeString(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const string =
    String(value).trim()

  return string || null
}


function touch() {
  state.updatedAt =
    new Date().toISOString()
}


function ensureInitialized() {
  if (!state.initialized) {
    initializeBoosterverseRuntimeOrchestrator()
  }
}


function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  )
}


export {
  MODULE_ID,
  MODULE_VERSION,

  initializeBoosterverseRuntimeOrchestrator,

  registerRuntimeModule,

  setRuntimeModuleEnabled,

  startRuntime,

  stopRuntime,

  runRuntimeTick,

  refreshRuntimeSnapshot,

  getLatestRuntimeSnapshot,

  getSpacemonkeyRuntimeContext,

  listRuntimeModules,

  getRuntimeSummary,

  getRuntimeHistory,

  getBoosterverseRuntimeOrchestratorHealth,

  resetRuntimeOrchestrator,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Runtime Orchestrator",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen moduulit yhdeksi hallituksi reaaliaikaiseksi Spacemonkey-runtimeksi yhdistävä orkestrointikerros.",

  initialize:
    initializeBoosterverseRuntimeOrchestrator,

  registerRuntimeModule,

  setRuntimeModuleEnabled,

  startRuntime,

  stopRuntime,

  runRuntimeTick,

  refreshRuntimeSnapshot,

  getLatestRuntimeSnapshot,

  getSpacemonkeyRuntimeContext,

  listRuntimeModules,

  getRuntimeSummary,

  getRuntimeHistory,

  health:
    getBoosterverseRuntimeOrchestratorHealth,
}
