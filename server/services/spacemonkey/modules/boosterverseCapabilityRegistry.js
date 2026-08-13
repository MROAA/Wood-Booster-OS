/**
 * Wood-Booster HQ
 * Boosterverse Capability Registry
 *
 * Tarkoitus:
 * - rekisteröidä Spacemonkeyn oikeat kyvykkyydet
 * - erottaa suunniteltu taito oikeasti toimivasta taidosta
 * - tarkistaa riippuvuudet ja työkalut
 * - estää Spacemonkeyta väittämästä osaavansa asioita joita ei ole toteutettu
 * - tarjota Planning/Workflow Engineille capability-check
 *
 * Reality First:
 * capability on "available" vasta kun se on
 * toteutettu ja sen riippuvuudet ovat saatavilla.
 *
 * Tämä moduuli EI:
 * - suorita työkaluja
 * - asenna ohjelmia
 * - kutsu LLM:ää
 * - muuta projektidataa
 */

const MODULE_ID = "boosterverse-capability-registry"
const MODULE_VERSION = "1.0.0"

const CAPABILITY_STATUS = Object.freeze({
  PLANNED: "planned",
  DEVELOPMENT: "development",
  AVAILABLE: "available",
  DEGRADED: "degraded",
  UNAVAILABLE: "unavailable",
  DISABLED: "disabled",
})

const CAPABILITY_LEVEL = Object.freeze({
  BASIC: "basic",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
  EXPERT: "expert",
})

const MAX_CAPABILITIES = 1000
const MAX_HISTORY = 500

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  capabilities: new Map(),

  tools: new Map(),

  history: [],

  counters: {
    capabilitiesRegistered: 0,
    toolsRegistered: 0,
    availabilityChecks: 0,
    statusChanges: 0,
  },
}


/**
 * Alustaa rekisterin.
 */
function initializeBoosterverseCapabilityRegistry() {
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

  registerDefaultCapabilities()

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
 * Esimerkkejä:
 *
 * ollama
 * ffmpeg
 * imagemagick
 * whisper
 * wordpress-rest
 * meta-api
 */
function registerTool({
  id,
  name = null,
  available = false,
  version = null,
  path = null,
  metadata = null,
} = {}) {
  ensureInitialized()

  const toolId = sanitizeString(id)

  if (!toolId) {
    return {
      success: false,
      error: "Tool id is required",
    }
  }

  const existing =
    state.tools.get(toolId)

  const now =
    new Date().toISOString()

  if (existing) {
    existing.name =
      sanitizeString(name) ||
      existing.name

    existing.available =
      Boolean(available)

    existing.version =
      sanitizeString(version)

    existing.path =
      sanitizeString(path)

    existing.metadata =
      metadata ?? existing.metadata

    existing.updatedAt = now

    touch()

    return {
      success: true,
      created: false,
      tool: clone(existing),
    }
  }

  const tool = {
    id: toolId,

    name:
      sanitizeString(name) ||
      toolId,

    available:
      Boolean(available),

    version:
      sanitizeString(version),

    path:
      sanitizeString(path),

    metadata,

    createdAt: now,
    updatedAt: now,
  }

  state.tools.set(
    toolId,
    tool
  )

  state.counters.toolsRegistered += 1

  addHistory({
    action:
      "tool-registered",

    toolId,
    available:
      tool.available,
  })

  touch()

  return {
    success: true,
    created: true,
    tool: clone(tool),
  }
}


/**
 * Päivittää työkalun saatavuuden.
 */
function setToolAvailability(
  toolId,
  available,
  {
    version = null,
    path = null,
    reason = null,
  } = {}
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

  const previous =
    tool.available

  tool.available =
    Boolean(available)

  if (version !== null) {
    tool.version =
      sanitizeString(version)
  }

  if (path !== null) {
    tool.path =
      sanitizeString(path)
  }

  tool.updatedAt =
    new Date().toISOString()

  addHistory({
    action:
      "tool-availability-changed",

    toolId:
      tool.id,

    previous,

    current:
      tool.available,

    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    tool: clone(tool),
  }
}


/**
 * Rekisteröi kyvykkyyden.
 */
function registerCapability({
  id,
  name = null,
  description = null,

  category = "general",

  level = CAPABILITY_LEVEL.BASIC,

  status = CAPABILITY_STATUS.PLANNED,

  requiredTools = [],
  requiredCapabilities = [],

  userApprovalRequired = false,

  risk = "low",

  metadata = null,
} = {}) {
  ensureInitialized()

  if (
    state.capabilities.size >=
    MAX_CAPABILITIES
  ) {
    return {
      success: false,
      error:
        "Capability limit reached",
    }
  }

  const capabilityId =
    sanitizeString(id)

  if (!capabilityId) {
    return {
      success: false,
      error:
        "Capability id is required",
    }
  }

  const existing =
    state.capabilities.get(
      capabilityId
    )

  const now =
    new Date().toISOString()

  const normalized = {
    id: capabilityId,

    name:
      sanitizeString(name) ||
      capabilityId,

    description:
      sanitizeString(description),

    category:
      sanitizeString(category) ||
      "general",

    level:
      normalizeCapabilityLevel(
        level
      ),

    status:
      normalizeCapabilityStatus(
        status
      ),

    requiredTools:
      normalizeStrings(
        requiredTools
      ),

    requiredCapabilities:
      normalizeStrings(
        requiredCapabilities
      ),

    userApprovalRequired:
      Boolean(
        userApprovalRequired
      ),

    risk:
      sanitizeString(risk) ||
      "low",

    metadata,

    updatedAt: now,
  }

  if (existing) {
    Object.assign(
      existing,
      normalized
    )

    touch()

    return {
      success: true,
      created: false,
      capability:
        clone(existing),
    }
  }

  const capability = {
    ...normalized,

    createdAt: now,

    checks: 0,

    lastCheckAt: null,
  }

  state.capabilities.set(
    capabilityId,
    capability
  )

  state.counters
    .capabilitiesRegistered += 1

  addHistory({
    action:
      "capability-registered",

    capabilityId,
    status:
      capability.status,
  })

  touch()

  return {
    success: true,
    created: true,
    capability:
      clone(capability),
  }
}


/**
 * Muuttaa capability-statuksen.
 */
function setCapabilityStatus(
  capabilityId,
  status,
  reason = null
) {
  ensureInitialized()

  const capability =
    state.capabilities.get(
      sanitizeString(
        capabilityId
      )
    )

  if (!capability) {
    return {
      success: false,
      error:
        "Capability not found",
    }
  }

  const previous =
    capability.status

  const next =
    normalizeCapabilityStatus(
      status
    )

  capability.status = next

  capability.updatedAt =
    new Date().toISOString()

  state.counters.statusChanges += 1

  addHistory({
    action:
      "capability-status-changed",

    capabilityId:
      capability.id,

    previous,

    current:
      next,

    reason:
      sanitizeString(reason),
  })

  touch()

  return {
    success: true,
    capability:
      clone(capability),
  }
}


/**
 * Tarkistaa onko kyvykkyys oikeasti käytettävissä.
 */
function checkCapability(
  capabilityId
) {
  ensureInitialized()

  state.counters
    .availabilityChecks += 1

  const capability =
    state.capabilities.get(
      sanitizeString(
        capabilityId
      )
    )

  if (!capability) {
    return {
      available: false,
      reason:
        "capability-not-registered",
      missingTools: [],
      missingCapabilities: [],
    }
  }

  capability.checks += 1
  capability.lastCheckAt =
    new Date().toISOString()

  if (
    capability.status !==
    CAPABILITY_STATUS.AVAILABLE
  ) {
    return {
      available: false,

      capability:
        clone(capability),

      reason:
        `capability-status-${capability.status}`,

      missingTools: [],

      missingCapabilities: [],
    }
  }

  const missingTools = []

  for (
    const toolId
    of capability.requiredTools
  ) {
    const tool =
      state.tools.get(toolId)

    if (
      !tool ||
      !tool.available
    ) {
      missingTools.push(
        toolId
      )
    }
  }

  const missingCapabilities = []

  for (
    const dependencyId
    of capability
      .requiredCapabilities
  ) {
    const dependency =
      state.capabilities.get(
        dependencyId
      )

    if (
      !dependency ||
      dependency.status !==
        CAPABILITY_STATUS.AVAILABLE
    ) {
      missingCapabilities.push(
        dependencyId
      )
    }
  }

  const available =
    missingTools.length === 0 &&
    missingCapabilities.length === 0

  return {
    available,

    capability:
      clone(capability),

    reason:
      available
        ? "available"
        : "missing-dependencies",

    missingTools,

    missingCapabilities,

    requiresApproval:
      capability
        .userApprovalRequired,

    risk:
      capability.risk,
  }
}


/**
 * Planning Engineille tarkoitettu check.
 */
function canExecutePlanStep(
  step
) {
  ensureInitialized()

  if (
    !step ||
    typeof step !== "object"
  ) {
    return {
      allowed: false,
      reason:
        "valid-step-required",
    }
  }

  const capabilityId =
    sanitizeString(
      step.capability
    )

  if (!capabilityId) {
    return {
      allowed: false,
      reason:
        "step-has-no-capability",
    }
  }

  const check =
    checkCapability(
      capabilityId
    )

  if (!check.available) {
    return {
      allowed: false,

      reason:
        check.reason,

      capability:
        capabilityId,

      missingTools:
        check.missingTools,

      missingCapabilities:
        check
          .missingCapabilities,
    }
  }

  if (
    check.requiresApproval &&
    !step.approved
  ) {
    return {
      allowed: false,

      reason:
        "user-approval-required",

      capability:
        capabilityId,
    }
  }

  return {
    allowed: true,

    reason:
      "capability-ready",

    capability:
      capabilityId,

    risk:
      check.risk,
  }
}


/**
 * Hakee yhden capabilityn.
 */
function getCapability(
  capabilityId
) {
  ensureInitialized()

  const capability =
    state.capabilities.get(
      sanitizeString(
        capabilityId
      )
    )

  return capability
    ? clone(capability)
    : null
}


/**
 * Listaa capabilityt.
 */
function listCapabilities({
  category = null,
  status = null,
  availableOnly = false,
  limit = 500,
} = {}) {
  ensureInitialized()

  return [
    ...state.capabilities
      .values(),
  ]
    .filter(
      (capability) => {
        if (
          category &&
          capability.category !==
            category
        ) {
          return false
        }

        if (
          status &&
          capability.status !==
            normalizeCapabilityStatus(
              status
            )
        ) {
          return false
        }

        if (
          availableOnly
        ) {
          const check =
            checkCapability(
              capability.id
            )

          if (!check.available) {
            return false
          }
        }

        return true
      }
    )
    .sort(
      (a, b) =>
        a.category.localeCompare(
          b.category
        ) ||
        a.name.localeCompare(
          b.name
        )
    )
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 500
      )
    )
    .map(clone)
}


/**
 * Listaa työkalut.
 */
function listTools() {
  ensureInitialized()

  return [
    ...state.tools.values(),
  ]
    .sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    )
    .map(clone)
}


/**
 * Capability Context Spacemonkeylle.
 *
 * Ei syötetä satoja rivejä AI:lle,
 * vaan pieni tilannekuva.
 */
function getCapabilityContext() {
  ensureInitialized()

  const available =
    listCapabilities({
      availableOnly: true,
      limit: 50,
    })

  const unavailable =
    listCapabilities({
      status:
        CAPABILITY_STATUS.UNAVAILABLE,
      limit: 20,
    })

  return {
    available:
      available.map(
        (capability) => ({
          id:
            capability.id,

          name:
            capability.name,

          category:
            capability.category,

          risk:
            capability.risk,

          requiresApproval:
            capability
              .userApprovalRequired,
        })
      ),

    unavailable:
      unavailable.map(
        (capability) => ({
          id:
            capability.id,

          name:
            capability.name,
        })
      ),

    rule:
      "Never claim a capability unless it is currently available.",
  }
}


/**
 * Rekisterin yhteenveto.
 */
function getCapabilitySummary() {
  ensureInitialized()

  const statuses = {}

  for (
    const status
    of Object.values(
      CAPABILITY_STATUS
    )
  ) {
    statuses[status] = 0
  }

  for (
    const capability
    of state.capabilities.values()
  ) {
    statuses[
      capability.status
    ] += 1
  }

  const toolsAvailable =
    [
      ...state.tools.values(),
    ].filter(
      (tool) =>
        tool.available
    ).length

  return {
    capabilities:
      state.capabilities.size,

    statuses,

    tools: {
      total:
        state.tools.size,

      available:
        toolsAvailable,
    },

    counters:
      clone(
        state.counters
      ),

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Historia.
 */
function getCapabilityHistory(
  limit = 50
) {
  ensureInitialized()

  return state.history
    .slice(
      -Math.max(
        1,
        Math.min(
          Number(limit) || 50,
          MAX_HISTORY
        )
      )
    )
    .reverse()
    .map(clone)
}


/**
 * Health.
 */
function getBoosterverseCapabilityRegistryHealth() {
  return {
    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    healthy: true,

    status:
      state.initialized
        ? "running"
        : "idle",

    metrics:
      getCapabilitySummary(),
  }
}


/**
 * Oletuskyvyt.
 *
 * HUOM:
 * Näistä useimmat alkavat PLANNED-statuksella.
 *
 * Niitä EI saa merkitä AVAILABLE ennen kuin
 * oikea toteutus on valmis ja testattu.
 */
function registerDefaultCapabilities() {
  const defaults = [
    {
      id:
        "conversation",

      name:
        "Conversation",

      category:
        "core",

      status:
        CAPABILITY_STATUS.AVAILABLE,

      level:
        CAPABILITY_LEVEL.BASIC,

      risk:
        "low",
    },

    {
      id:
        "project-data",

      name:
        "Project Data",

      category:
        "business",

      status:
        CAPABILITY_STATUS.DEVELOPMENT,

      level:
        CAPABILITY_LEVEL.BASIC,

      risk:
        "low",
    },

    {
      id:
        "pricing",

      name:
        "Pricing Analysis",

      category:
        "business",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.INTERMEDIATE,

      risk:
        "medium",
    },

    {
      id:
        "quote-generation",

      name:
        "Quote Generation",

      category:
        "business",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.INTERMEDIATE,

      risk:
        "medium",
    },

    {
      id:
        "inventory",

      name:
        "Inventory",

      category:
        "workshop",

      status:
        CAPABILITY_STATUS.DEVELOPMENT,

      level:
        CAPABILITY_LEVEL.BASIC,

      risk:
        "low",
    },

    {
      id:
        "materials",

      name:
        "Material Intelligence",

      category:
        "workshop",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.INTERMEDIATE,

      risk:
        "low",
    },

    {
      id:
        "media",

      name:
        "Media Access",

      category:
        "media",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.BASIC,

      risk:
        "low",
    },

    {
      id:
        "media-analysis",

      name:
        "Media Analysis",

      category:
        "media",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.INTERMEDIATE,

      risk:
        "low",
    },

    {
      id:
        "media-editing",

      name:
        "Image and Video Editing",

      category:
        "media",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.ADVANCED,

      requiredTools: [
        "ffmpeg",
        "imagemagick",
      ],

      risk:
        "low",
    },

    {
      id:
        "social-content",

      name:
        "Social Content Creation",

      category:
        "marketing",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.INTERMEDIATE,

      risk:
        "low",
    },

    {
      id:
        "social-publishing",

      name:
        "Social Publishing",

      category:
        "marketing",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.ADVANCED,

      requiredTools: [
        "meta-api",
      ],

      userApprovalRequired:
        true,

      risk:
        "high",
    },

    {
      id:
        "wordpress",

      name:
        "WordPress Management",

      category:
        "website",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.ADVANCED,

      requiredTools: [
        "wordpress-rest",
      ],

      userApprovalRequired:
        true,

      risk:
        "medium",
    },

    {
      id:
        "speech-to-text",

      name:
        "Speech to Text",

      category:
        "audio",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.INTERMEDIATE,

      requiredTools: [
        "whisper",
      ],

      risk:
        "low",
    },

    {
      id:
        "general-reasoning",

      name:
        "General Reasoning",

      category:
        "ai",

      status:
        CAPABILITY_STATUS.DEVELOPMENT,

      level:
        CAPABILITY_LEVEL.INTERMEDIATE,

      requiredTools: [
        "ollama",
      ],

      risk:
        "low",
    },

    {
      id:
        "automation",

      name:
        "Workflow Automation",

      category:
        "automation",

      status:
        CAPABILITY_STATUS.PLANNED,

      level:
        CAPABILITY_LEVEL.ADVANCED,

      risk:
        "medium",
    },
  ]

  for (
    const capability
    of defaults
  ) {
    registerCapability(
      capability
    )
  }
}


function normalizeCapabilityStatus(
  status
) {
  const safe =
    sanitizeString(status)

  const values =
    Object.values(
      CAPABILITY_STATUS
    )

  return values.includes(safe)
    ? safe
    : CAPABILITY_STATUS.PLANNED
}


function normalizeCapabilityLevel(
  level
) {
  const safe =
    sanitizeString(level)

  const values =
    Object.values(
      CAPABILITY_LEVEL
    )

  return values.includes(safe)
    ? safe
    : CAPABILITY_LEVEL.BASIC
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


function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


function addHistory(entry) {
  state.history.push({
    ...entry,

    timestamp:
      new Date().toISOString(),
  })

  if (
    state.history.length >
    MAX_HISTORY
  ) {
    state.history =
      state.history.slice(
        -MAX_HISTORY
      )
  }
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
    initializeBoosterverseCapabilityRegistry()
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

  CAPABILITY_STATUS,
  CAPABILITY_LEVEL,

  initializeBoosterverseCapabilityRegistry,

  registerTool,

  setToolAvailability,

  registerCapability,

  setCapabilityStatus,

  checkCapability,

  canExecutePlanStep,

  getCapability,

  listCapabilities,

  listTools,

  getCapabilityContext,

  getCapabilitySummary,

  getCapabilityHistory,

  getBoosterverseCapabilityRegistryHealth,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Capability Registry",

  version:
    MODULE_VERSION,

  description:
    "Spacemonkeyn Reality First -kyvykkyysrekisteri ja työkaluriippuvuuksien tarkistuskerros.",

  initialize:
    initializeBoosterverseCapabilityRegistry,

  registerTool,

  setToolAvailability,

  registerCapability,

  setCapabilityStatus,

  checkCapability,

  canExecutePlanStep,

  getCapability,

  listCapabilities,

  listTools,

  getCapabilityContext,

  getCapabilitySummary,

  getCapabilityHistory,

  health:
    getBoosterverseCapabilityRegistryHealth,
}
