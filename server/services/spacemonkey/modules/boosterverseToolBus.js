/**
 * Wood-Booster HQ
 * Boosterverse Tool Bus
 *
 * Keskitetty portti kaikille Spacemonkeyn työkaluille.
 *
 * Tarkoitus:
 * - rekisteröidä työkalut yhteen paikkaan
 * - estää agentteja käyttämästä työkaluja suoraan
 * - tarkistaa oikeudet ennen suoritusta
 * - tarkistaa riskitaso
 * - vaatia käyttäjän hyväksyntä tarvittaessa
 * - kirjata kaikki työkalukutsut
 * - tarjota turvallinen pohja automaatiolle
 *
 * Esimerkkejä työkaluista:
 *
 * ollama
 * ffmpeg
 * imagemagick
 * whisper
 * wordpress-rest
 * meta-api
 * filesystem
 * sqlite
 * pdf
 *
 * Tämä moduuli EI:
 * - asenna työkaluja
 * - päätä tavoitteita
 * - suunnittele työnkulkuja
 * - kierrä käyttäjän hyväksyntää
 */

const MODULE_ID = "boosterverse-tool-bus"
const MODULE_VERSION = "1.0.0"

const TOOL_STATUS = Object.freeze({
  REGISTERED: "registered",
  AVAILABLE: "available",
  DEGRADED: "degraded",
  UNAVAILABLE: "unavailable",
  DISABLED: "disabled",
})

const RISK_LEVELS = Object.freeze({
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
})

const MAX_TOOLS = 500
const MAX_EXECUTION_HISTORY = 1000

const state = {
  initialized: false,
  startedAt: null,
  updatedAt: null,

  tools: new Map(),

  executionHistory: [],

  counters: {
    toolsRegistered: 0,
    executionsRequested: 0,
    executionsAllowed: 0,
    executionsBlocked: 0,
    executionsCompleted: 0,
    executionsFailed: 0,
  },
}


/**
 * Alustaa Tool Busin.
 */
function initializeBoosterverseToolBus() {
  if (state.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  const now = new Date().toISOString()

  state.initialized = true
  state.startedAt = now
  state.updatedAt = now

  return {
    success: true,
    status: "initialized",
    moduleId: MODULE_ID,
    version: MODULE_VERSION,
  }
}


/**
 * Rekisteröi työkalun.
 *
 * execute-funktio pidetään erillisenä runtime-handlerina.
 */
function registerTool({
  id,
  name = null,
  description = null,

  status = TOOL_STATUS.REGISTERED,

  risk = RISK_LEVELS.LOW,

  requiresApproval = false,

  readOnly = false,

  capabilities = [],

  execute = null,

  metadata = null,
} = {}) {
  ensureInitialized()

  if (state.tools.size >= MAX_TOOLS) {
    return {
      success: false,
      error: "Tool limit reached",
    }
  }

  const toolId =
    sanitizeString(id)

  if (!toolId) {
    return {
      success: false,
      error: "Tool id is required",
    }
  }

  const now =
    new Date().toISOString()

  const existing =
    state.tools.get(toolId)

  const tool = {
    id: toolId,

    name:
      sanitizeString(name) ||
      toolId,

    description:
      sanitizeString(description),

    status:
      normalizeToolStatus(status),

    risk:
      normalizeRiskLevel(risk),

    requiresApproval:
      Boolean(requiresApproval),

    readOnly:
      Boolean(readOnly),

    capabilities:
      normalizeStrings(
        capabilities
      ),

    execute:
      typeof execute === "function"
        ? execute
        : null,

    metadata,

    createdAt:
      existing?.createdAt ??
      now,

    updatedAt:
      now,

    executions:
      existing?.executions ??
      0,

    failures:
      existing?.failures ??
      0,

    lastExecutionAt:
      existing?.lastExecutionAt ??
      null,
  }

  state.tools.set(
    toolId,
    tool
  )

  if (!existing) {
    state.counters
      .toolsRegistered += 1
  }

  touch()

  return {
    success: true,
    created:
      !Boolean(existing),
    tool:
      serializeTool(tool),
  }
}


/**
 * Päivittää työkalun statuksen.
 */
function setToolStatus(
  toolId,
  status,
  reason = null
) {
  ensureInitialized()

  const tool =
    state.tools.get(
      sanitizeString(toolId)
    )

  if (!tool) {
    return {
      success: false,
      error: "Tool not found",
    }
  }

  tool.status =
    normalizeToolStatus(
      status
    )

  tool.statusReason =
    sanitizeString(reason)

  tool.updatedAt =
    new Date().toISOString()

  touch()

  return {
    success: true,
    tool:
      serializeTool(tool),
  }
}


/**
 * Tarkistaa saako työkalua käyttää.
 */
function canUseTool({
  toolId,
  approvedByUser = false,
  requestedRisk = null,
  readOnly = false,
} = {}) {
  ensureInitialized()

  const tool =
    state.tools.get(
      sanitizeString(toolId)
    )

  if (!tool) {
    return {
      allowed: false,
      reason:
        "tool-not-registered",
    }
  }

  if (
    tool.status !==
    TOOL_STATUS.AVAILABLE
  ) {
    return {
      allowed: false,
      reason:
        `tool-status-${tool.status}`,
      tool:
        serializeTool(tool),
    }
  }

  const effectiveRisk =
    requestedRisk
      ? normalizeRiskLevel(
          requestedRisk
        )
      : tool.risk

  if (
    effectiveRisk ===
    RISK_LEVELS.CRITICAL
  ) {
    return {
      allowed: false,
      reason:
        "critical-risk-blocked",
      tool:
        serializeTool(tool),
    }
  }

  if (
    tool.requiresApproval &&
    !approvedByUser
  ) {
    return {
      allowed: false,
      reason:
        "user-approval-required",
      tool:
        serializeTool(tool),
    }
  }

  if (
    [
      RISK_LEVELS.HIGH,
    ].includes(effectiveRisk) &&
    !approvedByUser
  ) {
    return {
      allowed: false,
      reason:
        "high-risk-action-requires-approval",
      tool:
        serializeTool(tool),
    }
  }

  if (
    readOnly &&
    !tool.readOnly
  ) {
    return {
      allowed: true,
      reason:
        "tool-may-write-but-request-is-read-only",
      tool:
        serializeTool(tool),
      warning:
        "Caller must enforce read-only operation.",
    }
  }

  return {
    allowed: true,
    reason:
      "tool-ready",
    tool:
      serializeTool(tool),
  }
}


/**
 * Suorittaa työkalun Tool Busin kautta.
 *
 * Tämä on ainoa suositeltu tie
 * agentilta oikeaan työkaluun.
 */
async function executeTool({
  toolId,
  action = null,
  input = null,

  approvedByUser = false,

  risk = null,

  readOnly = false,

  source = "spacemonkey",

  metadata = null,
} = {}) {
  ensureInitialized()

  state.counters
    .executionsRequested += 1

  const requestId =
    createId(
      "bv-tool-request"
    )

  const now =
    new Date().toISOString()

  const request = {
    id: requestId,

    toolId:
      sanitizeString(toolId),

    action:
      sanitizeString(action),

    input,

    approvedByUser:
      Boolean(
        approvedByUser
      ),

    requestedRisk:
      risk
        ? normalizeRiskLevel(
            risk
          )
        : null,

    readOnly:
      Boolean(readOnly),

    source:
      sanitizeString(source),

    metadata,

    requestedAt: now,
  }

  const permission =
    canUseTool({
      toolId:
        request.toolId,

      approvedByUser:
        request
          .approvedByUser,

      requestedRisk:
        request
          .requestedRisk,

      readOnly:
        request.readOnly,
    })

  if (!permission.allowed) {
    state.counters
      .executionsBlocked += 1

    const blockedRecord = {
      ...request,

      status:
        "blocked",

      reason:
        permission.reason,

      completedAt:
        new Date().toISOString(),
    }

    addExecutionHistory(
      blockedRecord
    )

    return {
      success: false,
      status: "blocked",
      requestId,
      reason:
        permission.reason,
    }
  }

  const tool =
    state.tools.get(
      request.toolId
    )

  if (
    !tool ||
    typeof tool.execute !==
      "function"
  ) {
    state.counters
      .executionsBlocked += 1

    const unavailableRecord = {
      ...request,

      status:
        "blocked",

      reason:
        "tool-has-no-execute-handler",

      completedAt:
        new Date().toISOString(),
    }

    addExecutionHistory(
      unavailableRecord
    )

    return {
      success: false,
      status: "blocked",
      requestId,
      reason:
        "tool-has-no-execute-handler",
    }
  }

  state.counters
    .executionsAllowed += 1

  const startedAt =
    new Date().toISOString()

  try {
    const result =
      await tool.execute({
        action:
          request.action,

        input:
          request.input,

        context: {
          requestId,
          source:
            request.source,
          approvedByUser:
            request
              .approvedByUser,
          readOnly:
            request.readOnly,
          metadata:
            request.metadata,
        },
      })

    tool.executions += 1

    tool.lastExecutionAt =
      new Date().toISOString()

    state.counters
      .executionsCompleted += 1

    const completedRecord = {
      ...request,

      status:
        "completed",

      startedAt,

      completedAt:
        new Date().toISOString(),

      result:
        sanitizeResultForLog(
          result
        ),
    }

    addExecutionHistory(
      completedRecord
    )

    touch()

    return {
      success: true,
      status:
        "completed",
      requestId,
      result,
    }
  } catch (error) {
    tool.executions += 1
    tool.failures += 1

    tool.lastExecutionAt =
      new Date().toISOString()

    state.counters
      .executionsFailed += 1

    const failedRecord = {
      ...request,

      status:
        "failed",

      startedAt,

      completedAt:
        new Date().toISOString(),

      error:
        sanitizeString(
          error?.message
        ) ||
        "Unknown tool error",
    }

    addExecutionHistory(
      failedRecord
    )

    touch()

    return {
      success: false,
      status:
        "failed",
      requestId,
      error:
        failedRecord.error,
    }
  }
}


/**
 * Hakee työkalun.
 */
function getTool(toolId) {
  ensureInitialized()

  const tool =
    state.tools.get(
      sanitizeString(toolId)
    )

  return tool
    ? serializeTool(tool)
    : null
}


/**
 * Listaa työkalut.
 */
function listTools({
  status = null,
  capability = null,
} = {}) {
  ensureInitialized()

  return [
    ...state.tools.values(),
  ]
    .filter((tool) => {
      if (
        status &&
        tool.status !==
          normalizeToolStatus(
            status
          )
      ) {
        return false
      }

      if (
        capability &&
        !tool.capabilities.includes(
          capability
        )
      ) {
        return false
      }

      return true
    })
    .map(
      serializeTool
    )
}


/**
 * Hakee execution historian.
 */
function getExecutionHistory(
  limit = 50
) {
  ensureInitialized()

  return state
    .executionHistory
    .slice(
      -Math.max(
        1,
        Math.min(
          Number(limit) || 50,
          MAX_EXECUTION_HISTORY
        )
      )
    )
    .reverse()
    .map(clone)
}


/**
 * Tool Bus context Spacemonkeylle.
 */
function getToolContext() {
  ensureInitialized()

  const availableTools =
    listTools({
      status:
        TOOL_STATUS.AVAILABLE,
    })

  return {
    available:
      availableTools.map(
        (tool) => ({
          id:
            tool.id,

          name:
            tool.name,

          risk:
            tool.risk,

          readOnly:
            tool.readOnly,

          requiresApproval:
            tool.requiresApproval,

          capabilities:
            tool.capabilities,
        })
      ),

    rule:
      "All external tool use must pass through Boosterverse Tool Bus.",
  }
}


/**
 * Yhteenveto.
 */
function getToolBusSummary() {
  ensureInitialized()

  const statuses = {}

  for (
    const status
    of Object.values(
      TOOL_STATUS
    )
  ) {
    statuses[status] = 0
  }

  for (
    const tool
    of state.tools.values()
  ) {
    statuses[
      tool.status
    ] += 1
  }

  return {
    tools:
      state.tools.size,

    statuses,

    executionHistory:
      state
        .executionHistory
        .length,

    counters:
      clone(
        state.counters
      ),

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Health check.
 */
function getBoosterverseToolBusHealth() {
  return {
    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    healthy:
      true,

    status:
      state.initialized
        ? "running"
        : "idle",

    metrics:
      getToolBusSummary(),
  }
}


/**
 * Test-reset.
 */
function resetToolBus() {
  ensureInitialized()

  state.tools.clear()

  state.executionHistory = []

  touch()

  return {
    success: true,
    status:
      "reset",
  }
}


/**
 * Lokissa ei koskaan säilytetä
 * koko tulosta hallitsematta.
 */
function sanitizeResultForLog(
  result
) {
  if (
    result === null ||
    result === undefined
  ) {
    return null
  }

  if (
    typeof result === "string"
  ) {
    return result.slice(
      0,
      1000
    )
  }

  if (
    typeof result === "number" ||
    typeof result === "boolean"
  ) {
    return result
  }

  try {
    const serialized =
      JSON.stringify(result)

    if (
      serialized.length <=
      2000
    ) {
      return clone(result)
    }

    return {
      truncated: true,
      type:
        Array.isArray(result)
          ? "array"
          : "object",
    }
  } catch {
    return {
      unserializable:
        true,
    }
  }
}


/**
 * Poistaa execute-funktion
 * palautettavasta tool-metadatasta.
 */
function serializeTool(tool) {
  return clone({
    id:
      tool.id,

    name:
      tool.name,

    description:
      tool.description,

    status:
      tool.status,

    risk:
      tool.risk,

    requiresApproval:
      tool
        .requiresApproval,

    readOnly:
      tool.readOnly,

    capabilities:
      tool.capabilities,

    metadata:
      tool.metadata,

    executions:
      tool.executions,

    failures:
      tool.failures,

    lastExecutionAt:
      tool.lastExecutionAt,

    createdAt:
      tool.createdAt,

    updatedAt:
      tool.updatedAt,
  })
}


function normalizeToolStatus(
  status
) {
  const safe =
    sanitizeString(status)

  const values =
    Object.values(
      TOOL_STATUS
    )

  return values.includes(safe)
    ? safe
    : TOOL_STATUS.REGISTERED
}


function normalizeRiskLevel(
  risk
) {
  const safe =
    sanitizeString(risk)

  const values =
    Object.values(
      RISK_LEVELS
    )

  return values.includes(safe)
    ? safe
    : RISK_LEVELS.LOW
}


function normalizeStrings(
  values
) {
  const array =
    Array.isArray(values)
      ? values
      : [values]

  return [
    ...new Set(
      array
        .map(sanitizeString)
        .filter(Boolean)
    ),
  ]
}


function addExecutionHistory(
  record
) {
  state.executionHistory.push(
    record
  )

  if (
    state.executionHistory.length >
    MAX_EXECUTION_HISTORY
  ) {
    state.executionHistory =
      state.executionHistory.slice(
        -MAX_EXECUTION_HISTORY
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
    initializeBoosterverseToolBus()
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

  TOOL_STATUS,
  RISK_LEVELS,

  initializeBoosterverseToolBus,

  registerTool,

  setToolStatus,

  canUseTool,

  executeTool,

  getTool,

  listTools,

  getExecutionHistory,

  getToolContext,

  getToolBusSummary,

  getBoosterverseToolBusHealth,

  resetToolBus,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Tool Bus",

  version:
    MODULE_VERSION,

  description:
    "Spacemonkeyn keskitetty, turvallinen ja auditoitava portti ulkoisten työkalujen käyttöön.",

  initialize:
    initializeBoosterverseToolBus,

  registerTool,

  setToolStatus,

  canUseTool,

  executeTool,

  getTool,

  listTools,

  getExecutionHistory,

  getToolContext,

  getToolBusSummary,

  health:
    getBoosterverseToolBusHealth,
}
