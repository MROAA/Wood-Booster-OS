/**
 * Wood-Booster OS
 * Boosterverse World State
 *
 * Boosterverse-maailman reaaliaikainen tilannekuva.
 *
 * Tarkoitus:
 * - tietää missä käyttäjä työskentelee
 * - tietää mikä projekti on aktiivinen
 * - tietää mikä asiakas on aktiivinen
 * - ylläpitää nykyistä työvaihetta
 * - säilyttää viimeisin käyttäjän tavoite
 * - muodostaa Spacemonkeylle kevyt live context
 *
 * Tämä moduuli EI:
 * - seuraa käyttäjää Wood-Booster OS:n ulkopuolella
 * - käynnistä automaatioita
 * - kutsu LLM:ää
 * - tee päätöksiä käyttäjän puolesta
 *
 * Se ylläpitää vain Wood-Booster OS:n sisäistä maailmantilaa.
 */

const MODULE_ID = "boosterverse-world-state"
const MODULE_VERSION = "1.0.0"

const MAX_RECENT_EVENTS = 30

const state = {
  initialized: false,

  startedAt: null,
  updatedAt: null,

  session: {
    id: null,
    startedAt: null,
  },

  navigation: {
    activePage: null,
    activeRoute: null,
    previousPage: null,
    previousRoute: null,
  },

  context: {
    activeProject: null,
    activeCustomer: null,
    activeWorkflow: null,
    activeTask: null,
    activeTool: null,
    activeFile: null,
  },

  intent: {
    current: null,
    confidence: 0,
    source: null,
    updatedAt: null,
  },

  focus: {
    mode: "normal",
    entityType: null,
    entityId: null,
  },

  recentEvents: [],

  counters: {
    pageChanges: 0,
    projectChanges: 0,
    contextUpdates: 0,
    intentUpdates: 0,
  },
}


/**
 * Luo runtime-session tunnisteen.
 */
function createSessionId() {
  return `bv-session-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


/**
 * Alustaa World Staten.
 */
function initializeBoosterverseWorldState() {
  if (state.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  const timestamp = new Date().toISOString()

  state.initialized = true
  state.startedAt = timestamp
  state.updatedAt = timestamp

  state.session = {
    id: createSessionId(),
    startedAt: timestamp,
  }

  return {
    success: true,
    status: "initialized",
    moduleId: MODULE_ID,
    version: MODULE_VERSION,
    sessionId: state.session.id,
  }
}


/**
 * Päivittää aktiivisen sivun.
 *
 * Esimerkki:
 *
 * setActivePage({
 *   page: "ProjectDetails",
 *   route: "/projects/123"
 * })
 */
function setActivePage({
  page = null,
  route = null,
} = {}) {
  ensureInitialized()

  const oldPage = state.navigation.activePage
  const oldRoute = state.navigation.activeRoute

  state.navigation.previousPage = oldPage
  state.navigation.previousRoute = oldRoute

  state.navigation.activePage = sanitizeString(page)
  state.navigation.activeRoute = sanitizeString(route)

  state.counters.pageChanges += 1

  touch()

  return {
    success: true,
    navigation: clone(state.navigation),
  }
}


/**
 * Asettaa aktiivisen projektin.
 *
 * Projekti tallennetaan kevyenä kontekstina.
 * Tänne ei kopioida koko tietokannan projektia.
 */
function setActiveProject(project = null) {
  ensureInitialized()

  state.context.activeProject =
    project === null
      ? null
      : normalizeEntity(project, "project")

  state.counters.projectChanges += 1

  touch()

  return {
    success: true,
    activeProject: clone(
      state.context.activeProject
    ),
  }
}


/**
 * Asettaa aktiivisen asiakkaan.
 */
function setActiveCustomer(customer = null) {
  ensureInitialized()

  state.context.activeCustomer =
    customer === null
      ? null
      : normalizeEntity(customer, "customer")

  touch()

  return {
    success: true,
    activeCustomer: clone(
      state.context.activeCustomer
    ),
  }
}


/**
 * Asettaa aktiivisen työvaiheen.
 */
function setActiveWorkflow(workflow = null) {
  ensureInitialized()

  state.context.activeWorkflow =
    workflow === null
      ? null
      : normalizeEntity(workflow, "workflow")

  touch()

  return {
    success: true,
    activeWorkflow: clone(
      state.context.activeWorkflow
    ),
  }
}


/**
 * Asettaa aktiivisen tehtävän.
 */
function setActiveTask(task = null) {
  ensureInitialized()

  state.context.activeTask =
    task === null
      ? null
      : normalizeEntity(task, "task")

  touch()

  return {
    success: true,
    activeTask: clone(
      state.context.activeTask
    ),
  }
}


/**
 * Asettaa aktiivisen työkalun.
 *
 * Esimerkiksi:
 *
 * quote-editor
 * media-studio
 * inventory
 */
function setActiveTool(tool = null) {
  ensureInitialized()

  state.context.activeTool =
    sanitizeString(tool)

  touch()

  return {
    success: true,
    activeTool: state.context.activeTool,
  }
}


/**
 * Asettaa aktiivisen tiedoston.
 *
 * Säilytetään vain turvallinen kevyt metadata.
 */
function setActiveFile(file = null) {
  ensureInitialized()

  if (!file) {
    state.context.activeFile = null
  } else {
    state.context.activeFile = {
      id: file.id ?? null,
      name: sanitizeString(file.name),
      type: sanitizeString(file.type),
      projectId: file.projectId ?? null,
    }
  }

  touch()

  return {
    success: true,
    activeFile: clone(
      state.context.activeFile
    ),
  }
}


/**
 * Päivittää Spacemonkeyn tämänhetkisen
 * arvion käyttäjän tavoitteesta.
 *
 * Tämä EI tarkoita varmaa tietoa.
 *
 * confidence kertoo kuinka vahva arvio on.
 */
function setCurrentIntent({
  intent = null,
  confidence = 0,
  source = "unknown",
} = {}) {
  ensureInitialized()

  state.intent = {
    current: sanitizeString(intent),
    confidence: clampNumber(
      confidence,
      0,
      1
    ),
    source: sanitizeString(source),
    updatedAt: new Date().toISOString(),
  }

  state.counters.intentUpdates += 1

  touch()

  return {
    success: true,
    intent: clone(state.intent),
  }
}


/**
 * Poistaa nykyisen intent-arvion.
 */
function clearCurrentIntent() {
  ensureInitialized()

  state.intent = {
    current: null,
    confidence: 0,
    source: null,
    updatedAt: new Date().toISOString(),
  }

  touch()

  return {
    success: true,
    intent: clone(state.intent),
  }
}


/**
 * Focus Mode.
 *
 * Mahdollistaa myöhemmin ADHD-ystävällisen
 * yhden projektin / yhden tehtävän työtilan.
 */
function setFocusMode({
  mode = "normal",
  entityType = null,
  entityId = null,
} = {}) {
  ensureInitialized()

  const allowedModes = [
    "normal",
    "focus",
    "deep-focus",
  ]

  const safeMode = allowedModes.includes(mode)
    ? mode
    : "normal"

  state.focus = {
    mode: safeMode,
    entityType: sanitizeString(entityType),
    entityId: entityId ?? null,
  }

  touch()

  return {
    success: true,
    focus: clone(state.focus),
  }
}


/**
 * Vastaanottaa Event Enginestä tapahtuman
 * ja lisää sen World Staten kevyeen historiaan.
 */
function ingestEvent(event) {
  ensureInitialized()

  if (!event || typeof event !== "object") {
    return {
      success: false,
      error: "Valid event is required",
    }
  }

  const safeEvent = {
    id: event.id ?? null,
    type: sanitizeString(event.type),
    timestamp:
      event.timestamp ??
      new Date().toISOString(),

    entity:
      event.entity &&
      typeof event.entity === "object"
        ? {
            type: sanitizeString(
              event.entity.type
            ),
            id: event.entity.id ?? null,
          }
        : null,

    message:
      sanitizeString(event.message),

    importance:
      clampNumber(
        event.importance ?? 0.5,
        0,
        1
      ),
  }

  state.recentEvents.push(safeEvent)

  trimRecentEvents()

  state.counters.contextUpdates += 1

  touch()

  return {
    success: true,
    event: clone(safeEvent),
  }
}


/**
 * Päivittää useita kontekstiarvoja yhdellä kertaa.
 *
 * Tätä voidaan myöhemmin käyttää frontendistä
 * tulevan context-paketin käsittelyyn.
 */
function updateContext({
  project,
  customer,
  workflow,
  task,
  tool,
  file,
} = {}) {
  ensureInitialized()

  if (project !== undefined) {
    state.context.activeProject =
      project === null
        ? null
        : normalizeEntity(
            project,
            "project"
          )
  }

  if (customer !== undefined) {
    state.context.activeCustomer =
      customer === null
        ? null
        : normalizeEntity(
            customer,
            "customer"
          )
  }

  if (workflow !== undefined) {
    state.context.activeWorkflow =
      workflow === null
        ? null
        : normalizeEntity(
            workflow,
            "workflow"
          )
  }

  if (task !== undefined) {
    state.context.activeTask =
      task === null
        ? null
        : normalizeEntity(
            task,
            "task"
          )
  }

  if (tool !== undefined) {
    state.context.activeTool =
      sanitizeString(tool)
  }

  if (file !== undefined) {
    state.context.activeFile =
      file === null
        ? null
        : {
            id: file.id ?? null,
            name: sanitizeString(
              file.name
            ),
            type: sanitizeString(
              file.type
            ),
            projectId:
              file.projectId ?? null,
          }
  }

  state.counters.contextUpdates += 1

  touch()

  return {
    success: true,
    context: clone(state.context),
  }
}


/**
 * Palauttaa koko turvallisen World Staten.
 */
function getWorldState() {
  ensureInitialized()

  return clone({
    moduleId: MODULE_ID,
    version: MODULE_VERSION,

    status: "alive",

    startedAt: state.startedAt,
    updatedAt: state.updatedAt,

    session: state.session,

    navigation: state.navigation,

    context: state.context,

    intent: state.intent,

    focus: state.focus,

    recentEvents: state.recentEvents,

    counters: state.counters,
  })
}


/**
 * Spacemonkeylle tarkoitettu pieni live-context.
 *
 * Tätä ei paisuteta.
 * Tarkoitus on antaa vain tämän hetken
 * tärkeimmät tiedot AI-pipelineen.
 */
function getLiveContext() {
  ensureInitialized()

  return clone({
    timestamp: new Date().toISOString(),

    page:
      state.navigation.activePage,

    route:
      state.navigation.activeRoute,

    project:
      state.context.activeProject,

    customer:
      state.context.activeCustomer,

    workflow:
      state.context.activeWorkflow,

    task:
      state.context.activeTask,

    tool:
      state.context.activeTool,

    file:
      state.context.activeFile,

    intent:
      state.intent.current,

    intentConfidence:
      state.intent.confidence,

    focus:
      state.focus,

    recentEvents:
      state.recentEvents.slice(-5),
  })
}


/**
 * Kevyt yhteenveto käyttöliittymää varten.
 */
function getWorldSummary() {
  ensureInitialized()

  return {
    alive: true,

    activePage:
      state.navigation.activePage,

    activeProject:
      state.context.activeProject,

    activeTask:
      state.context.activeTask,

    currentIntent:
      state.intent.current,

    focusMode:
      state.focus.mode,

    recentEventCount:
      state.recentEvents.length,

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Health check.
 */
function getBoosterverseWorldStateHealth() {
  return {
    moduleId: MODULE_ID,
    version: MODULE_VERSION,

    healthy: true,

    status:
      state.initialized
        ? "running"
        : "idle",

    metrics: {
      pageChanges:
        state.counters.pageChanges,

      projectChanges:
        state.counters.projectChanges,

      contextUpdates:
        state.counters.contextUpdates,

      intentUpdates:
        state.counters.intentUpdates,

      recentEvents:
        state.recentEvents.length,
    },

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Runtime-tilan resetointi testeihin.
 */
function resetWorldState() {
  const timestamp = new Date().toISOString()

  state.updatedAt = timestamp

  state.navigation = {
    activePage: null,
    activeRoute: null,
    previousPage: null,
    previousRoute: null,
  }

  state.context = {
    activeProject: null,
    activeCustomer: null,
    activeWorkflow: null,
    activeTask: null,
    activeTool: null,
    activeFile: null,
  }

  state.intent = {
    current: null,
    confidence: 0,
    source: null,
    updatedAt: timestamp,
  }

  state.focus = {
    mode: "normal",
    entityType: null,
    entityId: null,
  }

  state.recentEvents = []

  return {
    success: true,
    status: "reset",
  }
}


/**
 * Kevyt entity-normalisointi.
 */
function normalizeEntity(
  entity,
  fallbackType
) {
  if (
    !entity ||
    typeof entity !== "object"
  ) {
    return null
  }

  return {
    id: entity.id ?? null,

    type:
      sanitizeString(entity.type) ||
      fallbackType,

    name:
      sanitizeString(
        entity.name ??
        entity.title
      ),

    status:
      sanitizeString(entity.status),

    updatedAt:
      entity.updatedAt ?? null,
  }
}


/**
 * Päivittää viimeisimmän muutoksen ajan.
 */
function touch() {
  state.updatedAt =
    new Date().toISOString()
}


/**
 * Varmistaa että moduuli on alustettu.
 */
function ensureInitialized() {
  if (!state.initialized) {
    initializeBoosterverseWorldState()
  }
}


/**
 * Rajaa runtime-event historian.
 */
function trimRecentEvents() {
  if (
    state.recentEvents.length <=
    MAX_RECENT_EVENTS
  ) {
    return
  }

  state.recentEvents =
    state.recentEvents.slice(
      -MAX_RECENT_EVENTS
    )
}


/**
 * Turvallinen string-normalisointi.
 */
function sanitizeString(value) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== "string") {
    return String(value)
  }

  const trimmed = value.trim()

  return trimmed || null
}


/**
 * Turvallinen lukuarvon rajaus.
 */
function clampNumber(value, min, max) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return min
  }

  return Math.min(
    Math.max(number, min),
    max
  )
}


/**
 * Estää ulkopuolista koodia muuttamasta
 * moduulin sisäistä runtime-statea vahingossa.
 */
function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  )
}


export {
  MODULE_ID,
  MODULE_VERSION,

  initializeBoosterverseWorldState,

  setActivePage,

  setActiveProject,

  setActiveCustomer,

  setActiveWorkflow,

  setActiveTask,

  setActiveTool,

  setActiveFile,

  setCurrentIntent,

  clearCurrentIntent,

  setFocusMode,

  ingestEvent,

  updateContext,

  getWorldState,

  getLiveContext,

  getWorldSummary,

  getBoosterverseWorldStateHealth,

  resetWorldState,
}


export default {
  id: MODULE_ID,

  name: "Boosterverse World State",

  version: MODULE_VERSION,

  description:
    "Boosterverse-maailman reaaliaikainen tilannekuva ja Spacemonkeyn live-context.",

  initialize:
    initializeBoosterverseWorldState,

  setActivePage,

  setActiveProject,

  setActiveCustomer,

  setActiveWorkflow,

  setActiveTask,

  setActiveTool,

  setActiveFile,

  setCurrentIntent,

  setFocusMode,

  ingestEvent,

  updateContext,

  getWorldState,

  getLiveContext,

  getWorldSummary,

  health:
    getBoosterverseWorldStateHealth,
}
