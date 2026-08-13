/**
 * Wood-Booster HQ
 * Boosterverse Attention Engine
 *
 * Tarkoitus:
 * - ylläpitää tietoa siitä, mihin käyttäjän huomio kohdistuu
 * - yhdistää sivu, projekti, tehtävä, tiedosto ja käyttöliittymäkohde
 * - tunnistaa nopeat kontekstinvaihdot
 * - tarjota Focus-, Intent- ja Cognitive Load Engineille attention context
 * - auttaa Spacemonkeyta ymmärtämään mitä käyttäjä juuri nyt käsittelee
 *
 * Tämä moduuli EI:
 * - seuraa käyttäjää Wood-Booster HQ:n ulkopuolella
 * - käytä kameraa tai mikrofonia
 * - tee terveydellisiä tai psykologisia päätelmiä
 * - käynnistä automaatioita
 * - kutsu LLM:ää
 *
 * Attention tarkoittaa tässä vain käyttöjärjestelmän
 * sisäistä aktiivista kontekstia.
 */

const MODULE_ID =
  "boosterverse-attention-engine"

const MODULE_VERSION =
  "1.0.0"

const ATTENTION_TYPES =
  Object.freeze({
    PAGE: "page",
    PROJECT: "project",
    CUSTOMER: "customer",
    TASK: "task",
    WORKFLOW: "workflow",
    FILE: "file",
    MEDIA: "media",
    TOOL: "tool",
    FIELD: "field",
    PANEL: "panel",
    UNKNOWN: "unknown",
  })

const ATTENTION_STATES =
  Object.freeze({
    IDLE: "idle",
    STABLE: "stable",
    ACTIVE: "active",
    SWITCHING: "switching",
    FRAGMENTED: "fragmented",
  })

const MAX_HISTORY = 300

const RAPID_SWITCH_WINDOW_MS =
  60 * 1000

const FRAGMENTED_SWITCH_THRESHOLD = 6

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  currentAttention: null,

  previousAttention: null,

  attentionState:
    ATTENTION_STATES.IDLE,

  history: [],

  recentSwitches: [],

  counters: {
    attentionChanges: 0,
    pageChanges: 0,
    projectChanges: 0,
    taskChanges: 0,
    toolChanges: 0,
    rapidSwitches: 0,
  },
}


/**
 * Alustus.
 */
function initializeBoosterverseAttentionEngine() {
  if (state.initialized) {
    return {
      success: true,
      status:
        "already-initialized",
      moduleId:
        MODULE_ID,
    }
  }

  const now =
    new Date().toISOString()

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
 * Päivittää tämänhetkisen
 * attention-kohteen.
 *
 * Esimerkki:
 *
 * setAttention({
 *   type: "project",
 *   id: "aurora",
 *   label: "Aurora-pöytä",
 *   projectId: "aurora",
 *   source: "ui"
 * })
 */
function setAttention({
  type = ATTENTION_TYPES.UNKNOWN,
  id = null,
  label = null,

  page = null,
  route = null,

  projectId = null,
  customerId = null,
  taskId = null,
  workflowId = null,

  tool = null,

  parentType = null,
  parentId = null,

  source = "system",

  confidence = 1,

  metadata = null,
} = {}) {
  ensureInitialized()

  const now =
    new Date().toISOString()

  const next = {
    type:
      normalizeAttentionType(
        type
      ),

    id:
      sanitizeString(id),

    label:
      sanitizeString(label),

    page:
      sanitizeString(page),

    route:
      sanitizeString(route),

    projectId:
      sanitizeString(
        projectId
      ),

    customerId:
      sanitizeString(
        customerId
      ),

    taskId:
      sanitizeString(
        taskId
      ),

    workflowId:
      sanitizeString(
        workflowId
      ),

    tool:
      sanitizeString(tool),

    parent: {
      type:
        sanitizeString(
          parentType
        ),

      id:
        sanitizeString(
          parentId
        ),
    },

    source:
      sanitizeString(source),

    confidence:
      clampNumber(
        confidence,
        0,
        1
      ),

    metadata,

    startedAt:
      now,

    updatedAt:
      now,
  }

  const changed =
    hasAttentionChanged(
      state.currentAttention,
      next
    )

  if (!changed) {
    state.currentAttention = {
      ...state.currentAttention,
      ...next,

      startedAt:
        state.currentAttention
          ?.startedAt ??
        now,

      updatedAt:
        now,
    }

    state.attentionState =
      ATTENTION_STATES.STABLE

    touch()

    return {
      success: true,
      changed: false,

      attention:
        clone(
          state.currentAttention
        ),

      attentionState:
        state.attentionState,
    }
  }

  if (state.currentAttention) {
    state.previousAttention =
      clone(
        state.currentAttention
      )
  }

  state.currentAttention =
    next

  state.counters
    .attentionChanges += 1

  incrementTypeCounter(
    next.type
  )

  registerSwitch({
    from:
      state.previousAttention,

    to:
      next,

    timestamp:
      now,
  })

  updateAttentionState()

  addHistory({
    action:
      "attention-changed",

    from:
      state.previousAttention,

    to:
      next,

    attentionState:
      state.attentionState,
  })

  touch()

  return {
    success: true,
    changed: true,

    attention:
      clone(next),

    attentionState:
      state.attentionState,
  }
}


/**
 * Helpompi sivupäivitys.
 */
function setPageAttention({
  page,
  route = null,
  projectId = null,
  source = "navigation",
} = {}) {
  return setAttention({
    type:
      ATTENTION_TYPES.PAGE,

    id:
      sanitizeString(route) ||
      sanitizeString(page),

    label:
      sanitizeString(page),

    page,
    route,
    projectId,
    source,
  })
}


/**
 * Helpompi projektipäivitys.
 */
function setProjectAttention({
  projectId,
  projectName = null,
  page = null,
  route = null,
  source = "project-context",
} = {}) {
  return setAttention({
    type:
      ATTENTION_TYPES.PROJECT,

    id:
      projectId,

    label:
      projectName,

    projectId,

    page,
    route,

    source,
  })
}


/**
 * Helpompi task-päivitys.
 */
function setTaskAttention({
  taskId,
  title = null,
  projectId = null,
  workflowId = null,
  source = "task-context",
} = {}) {
  return setAttention({
    type:
      ATTENTION_TYPES.TASK,

    id:
      taskId,

    label:
      title,

    taskId,
    projectId,
    workflowId,

    source,
  })
}


/**
 * Päivittää attentionin
 * World State -contextista.
 */
function updateAttentionFromWorldState(
  world = {}
) {
  ensureInitialized()

  const project =
    world.project ||
    world.context
      ?.activeProject ||
    null

  const task =
    world.task ||
    world.context
      ?.activeTask ||
    null

  const workflow =
    world.workflow ||
    world.context
      ?.activeWorkflow ||
    null

  const file =
    world.file ||
    world.context
      ?.activeFile ||
    null

  const tool =
    world.tool ||
    world.context
      ?.activeTool ||
    null

  const page =
    world.page ||
    world.navigation
      ?.activePage ||
    null

  const route =
    world.route ||
    world.navigation
      ?.activeRoute ||
    null

  /**
   * Käytetään tarkinta
   * saatavilla olevaa kohdetta.
   */

  if (file) {
    return setAttention({
      type:
        ATTENTION_TYPES.FILE,

      id:
        file.id ??
        file.name,

      label:
        file.name,

      projectId:
        file.projectId ??
        project?.id ??
        null,

      page,
      route,
      tool,

      source:
        "world-state",
    })
  }

  if (task) {
    return setAttention({
      type:
        ATTENTION_TYPES.TASK,

      id:
        task.id,

      label:
        task.name ??
        task.title,

      taskId:
        task.id,

      projectId:
        project?.id ??
        null,

      workflowId:
        workflow?.id ??
        null,

      page,
      route,

      source:
        "world-state",
    })
  }

  if (workflow) {
    return setAttention({
      type:
        ATTENTION_TYPES.WORKFLOW,

      id:
        workflow.id,

      label:
        workflow.name ??
        workflow.title,

      workflowId:
        workflow.id,

      projectId:
        project?.id ??
        null,

      page,
      route,

      source:
        "world-state",
    })
  }

  if (tool) {
    return setAttention({
      type:
        ATTENTION_TYPES.TOOL,

      id:
        tool,

      label:
        tool,

      projectId:
        project?.id ??
        null,

      page,
      route,

      tool,

      source:
        "world-state",
    })
  }

  if (project) {
    return setAttention({
      type:
        ATTENTION_TYPES.PROJECT,

      id:
        project.id,

      label:
        project.name,

      projectId:
        project.id,

      page,
      route,

      source:
        "world-state",
    })
  }

  if (page || route) {
    return setPageAttention({
      page,
      route,
      source:
        "world-state",
    })
  }

  return clearAttention({
    reason:
      "world-state-has-no-active-context",
  })
}


/**
 * Tyhjentää aktiivisen attentionin.
 */
function clearAttention({
  reason = null,
} = {}) {
  ensureInitialized()

  if (state.currentAttention) {
    state.previousAttention =
      clone(
        state.currentAttention
      )

    addHistory({
      action:
        "attention-cleared",

      previous:
        state.previousAttention,

      reason:
        sanitizeString(reason),
    })
  }

  state.currentAttention =
    null

  state.attentionState =
    ATTENTION_STATES.IDLE

  touch()

  return {
    success: true,
    status: "cleared",
  }
}


/**
 * Palauttaa nykyisen attentionin.
 */
function getCurrentAttention() {
  ensureInitialized()

  return state.currentAttention
    ? clone(
        state.currentAttention
      )
    : null
}


/**
 * Palauttaa attention-state tiedon.
 */
function getAttentionState() {
  ensureInitialized()

  cleanupRecentSwitches()

  updateAttentionState()

  return {
    state:
      state.attentionState,

    currentAttention:
      state.currentAttention
        ? clone(
            state.currentAttention
          )
        : null,

    previousAttention:
      state.previousAttention
        ? clone(
            state.previousAttention
          )
        : null,

    recentSwitches:
      state.recentSwitches.length,

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Spacemonkeylle tarkoitettu
 * pieni attention context.
 */
function getAttentionContext() {
  ensureInitialized()

  cleanupRecentSwitches()

  updateAttentionState()

  return clone({
    current:
      state.currentAttention,

    previous:
      state.previousAttention,

    state:
      state.attentionState,

    recentSwitchCount:
      state.recentSwitches.length,

    guidance:
      buildAttentionGuidance(),

    rule:
      "Attention describes only the currently active Wood-Booster HQ context. It must not be interpreted as the user's psychological state.",
  })
}


/**
 * Focus Enginen käyttöön.
 */
function getFocusHint() {
  ensureInitialized()

  const attention =
    state.currentAttention

  if (!attention) {
    return {
      available: false,
      reason:
        "no-current-attention",
    }
  }

  return {
    available: true,

    type:
      attention.type,

    id:
      attention.id,

    title:
      attention.label,

    projectId:
      attention.projectId,

    taskId:
      attention.taskId,

    workflowId:
      attention.workflowId,

    confidence:
      attention.confidence,

    attentionState:
      state.attentionState,
  }
}


/**
 * Palauttaa viimeisimmät
 * attention-vaihdot.
 */
function getAttentionHistory(
  limit = 30
) {
  ensureInitialized()

  return state.history
    .slice(
      -Math.max(
        1,
        Math.min(
          Number(limit) || 30,
          MAX_HISTORY
        )
      )
    )
    .reverse()
    .map(clone)
}


/**
 * Yhteenveto.
 */
function getAttentionSummary() {
  ensureInitialized()

  cleanupRecentSwitches()

  return {
    attentionState:
      state.attentionState,

    currentType:
      state.currentAttention
        ?.type ??
      null,

    currentId:
      state.currentAttention
        ?.id ??
      null,

    recentSwitches:
      state.recentSwitches
        .length,

    counters:
      clone(
        state.counters
      ),

    historyEntries:
      state.history.length,

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Health.
 */
function getBoosterverseAttentionEngineHealth() {
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
      getAttentionSummary(),
  }
}


/**
 * Reset testeihin.
 */
function resetAttentionEngine() {
  ensureInitialized()

  state.currentAttention =
    null

  state.previousAttention =
    null

  state.attentionState =
    ATTENTION_STATES.IDLE

  state.history = []

  state.recentSwitches = []

  state.counters = {
    attentionChanges: 0,
    pageChanges: 0,
    projectChanges: 0,
    taskChanges: 0,
    toolChanges: 0,
    rapidSwitches: 0,
  }

  touch()

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Tarkistaa muuttuiko attention.
 */
function hasAttentionChanged(
  current,
  next
) {
  if (!current) {
    return true
  }

  return (
    current.type !==
      next.type ||

    current.id !==
      next.id ||

    current.projectId !==
      next.projectId ||

    current.taskId !==
      next.taskId ||

    current.workflowId !==
      next.workflowId ||

    current.tool !==
      next.tool ||

    current.page !==
      next.page
  )
}


/**
 * Rekisteröi kontekstinvaihdon.
 */
function registerSwitch({
  from,
  to,
  timestamp,
}) {
  if (!from) {
    return
  }

  const switchRecord = {
    from: {
      type:
        from.type,

      id:
        from.id,
    },

    to: {
      type:
        to.type,

      id:
        to.id,
    },

    timestamp,
  }

  state.recentSwitches.push(
    switchRecord
  )

  state.counters
    .rapidSwitches += 1

  cleanupRecentSwitches()
}


/**
 * Poistaa yli minuutin vanhat
 * context switchit.
 */
function cleanupRecentSwitches() {
  const cutoff =
    Date.now() -
    RAPID_SWITCH_WINDOW_MS

  state.recentSwitches =
    state.recentSwitches.filter(
      (item) => {
        const timestamp =
          new Date(
            item.timestamp
          ).getTime()

        if (
          Number.isNaN(
            timestamp
          )
        ) {
          return false
        }

        return timestamp >= cutoff
      }
    )
}


/**
 * Laskee attention-staten.
 */
function updateAttentionState() {
  cleanupRecentSwitches()

  if (!state.currentAttention) {
    state.attentionState =
      ATTENTION_STATES.IDLE

    return
  }

  if (
    state.recentSwitches.length >=
    FRAGMENTED_SWITCH_THRESHOLD
  ) {
    state.attentionState =
      ATTENTION_STATES.FRAGMENTED

    return
  }

  if (
    state.recentSwitches.length >= 3
  ) {
    state.attentionState =
      ATTENTION_STATES.SWITCHING

    return
  }

  const startedAt =
    new Date(
      state.currentAttention
        .startedAt
    ).getTime()

  if (
    !Number.isNaN(
      startedAt
    ) &&
    Date.now() -
      startedAt >
      60 * 1000
  ) {
    state.attentionState =
      ATTENTION_STATES.STABLE

    return
  }

  state.attentionState =
    ATTENTION_STATES.ACTIVE
}


/**
 * Rakentaa Focus/Cognitive Load
 * Engineille käyttökelpoisen ohjauksen.
 */
function buildAttentionGuidance() {
  switch (
    state.attentionState
  ) {
    case ATTENTION_STATES.FRAGMENTED:
      return {
        type:
          "reduce-context-switching",

        suggestion:
          "Several context changes occurred recently. Prefer the current primary task and reduce non-essential UI elements.",
      }

    case ATTENTION_STATES.SWITCHING:
      return {
        type:
          "context-changing",

        suggestion:
          "Context is changing frequently. Preserve the previous task so it can be recovered easily.",
      }

    case ATTENTION_STATES.STABLE:
      return {
        type:
          "protect-focus",

        suggestion:
          "Attention has remained stable. Avoid unnecessary interruptions.",
      }

    case ATTENTION_STATES.ACTIVE:
      return {
        type:
          "support-current-context",

        suggestion:
          "Keep assistance relevant to the active context.",
      }

    case ATTENTION_STATES.IDLE:
    default:
      return {
        type:
          "no-active-attention",

        suggestion:
          "No active context is currently available.",
      }
  }
}


/**
 * Tyyppikohtaiset laskurit.
 */
function incrementTypeCounter(
  type
) {
  switch (type) {
    case ATTENTION_TYPES.PAGE:
      state.counters
        .pageChanges += 1
      break

    case ATTENTION_TYPES.PROJECT:
      state.counters
        .projectChanges += 1
      break

    case ATTENTION_TYPES.TASK:
      state.counters
        .taskChanges += 1
      break

    case ATTENTION_TYPES.TOOL:
      state.counters
        .toolChanges += 1
      break

    default:
      break
  }
}


/**
 * Attention type normalisointi.
 */
function normalizeAttentionType(
  type
) {
  const safe =
    sanitizeString(type)

  const values =
    Object.values(
      ATTENTION_TYPES
    )

  return values.includes(safe)
    ? safe
    : ATTENTION_TYPES.UNKNOWN
}


/**
 * Historia.
 */
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


function clampNumber(
  value,
  min,
  max
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return min
  }

  return Math.min(
    Math.max(
      number,
      min
    ),
    max
  )
}


function touch() {
  state.updatedAt =
    new Date().toISOString()
}


function ensureInitialized() {
  if (!state.initialized) {
    initializeBoosterverseAttentionEngine()
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

  ATTENTION_TYPES,
  ATTENTION_STATES,

  initializeBoosterverseAttentionEngine,

  setAttention,

  setPageAttention,

  setProjectAttention,

  setTaskAttention,

  updateAttentionFromWorldState,

  clearAttention,

  getCurrentAttention,

  getAttentionState,

  getAttentionContext,

  getFocusHint,

  getAttentionHistory,

  getAttentionSummary,

  getBoosterverseAttentionEngineHealth,

  resetAttentionEngine,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Attention Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen Wood-Booster HQ:n sisäisen aktiivisen huomio- ja kontekstikohteen seuranta- ja Focus-tukikerros.",

  initialize:
    initializeBoosterverseAttentionEngine,

  setAttention,

  setPageAttention,

  setProjectAttention,

  setTaskAttention,

  updateAttentionFromWorldState,

  clearAttention,

  getCurrentAttention,

  getAttentionState,

  getAttentionContext,

  getFocusHint,

  getAttentionHistory,

  getAttentionSummary,

  health:
    getBoosterverseAttentionEngineHealth,
}
