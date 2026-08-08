/**
 * Wood-Booster HQ
 * Boosterverse Event Engine
 *
 * Boosterverse-maailman tapahtuma- ja heartbeat-kerros.
 *
 * Tarkoitus:
 * - vastaanottaa järjestelmän tapahtumia
 * - normalisoida ne samaan muotoon
 * - säilyttää kevyt tapahtumahistoria
 * - muodostaa reaaliaikainen Boosterverse-pulssi
 * - tarjota tapahtumia myöhemmin Context-, Memory-,
 *   Association- ja Reflection Engineille
 *
 * Tämä moduuli EI:
 * - muuta projektidataa
 * - suorita automaatioita
 * - kutsu LLM:ää
 * - tee päätöksiä käyttäjän puolesta
 *
 * Se vain havaitsee ja kirjaa tapahtumia.
 */

const MODULE_ID = "boosterverse-event-engine"
const MODULE_VERSION = "1.0.0"

const DEFAULT_MAX_EVENTS = 500

const state = {
  initialized: false,
  startedAt: null,
  lastEventAt: null,
  totalEvents: 0,
  events: [],
}


/**
 * Luo uniikin tapahtumatunnisteen.
 */
function createEventId() {
  return `bv-event-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


/**
 * Normalisoi tapahtuman tyypin.
 *
 * Esimerkkejä:
 *
 * project.opened
 * project.updated
 * workflow.completed
 * page.changed
 * media.added
 * spacemonkey.observation
 */
function normalizeEventType(type) {
  if (!type || typeof type !== "string") {
    return "system.unknown"
  }

  return type
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
}


/**
 * Luo Boosterverse-tapahtuman.
 */
function createEvent({
  type,
  source = "wood-booster-os",
  entityType = null,
  entityId = null,
  message = null,
  data = null,
  importance = 0.5,
  confidence = 1,
  tags = [],
} = {}) {
  const timestamp = new Date().toISOString()

  return {
    id: createEventId(),

    type: normalizeEventType(type),

    source,

    timestamp,

    entity: {
      type: entityType,
      id: entityId,
    },

    message,

    data,

    importance: clampNumber(importance, 0, 1),

    confidence: clampNumber(confidence, 0, 1),

    tags: Array.isArray(tags)
      ? [...new Set(tags.filter(Boolean))]
      : [],

    boosterverse: {
      status: "observed",
      remembered: false,
      associated: false,
      reflected: false,
    },
  }
}


/**
 * Tallentaa tapahtuman Boosterversen tapahtumavirtaan.
 */
function recordEvent(input = {}) {
  if (!state.initialized) {
    initializeBoosterverseEventEngine()
  }

  const event = createEvent(input)

  state.events.push(event)

  state.totalEvents += 1
  state.lastEventAt = event.timestamp

  trimEventHistory()

  return {
    success: true,
    event,
  }
}


/**
 * Palauttaa viimeisimmät tapahtumat.
 */
function getRecentEvents(limit = 20) {
  const safeLimit = Math.max(
    1,
    Math.min(Number(limit) || 20, DEFAULT_MAX_EVENTS)
  )

  return state.events.slice(-safeLimit).reverse()
}


/**
 * Hakee tapahtumia tyypin perusteella.
 *
 * Esimerkki:
 *
 * getEventsByType("project.opened")
 */
function getEventsByType(type, limit = 50) {
  const normalizedType = normalizeEventType(type)

  return state.events
    .filter((event) => event.type === normalizedType)
    .slice(-limit)
    .reverse()
}


/**
 * Hakee tiettyyn objektiin liittyvät tapahtumat.
 *
 * Esimerkki:
 *
 * entityType = "project"
 * entityId   = "aurora"
 */
function getEntityEvents(
  entityType,
  entityId,
  limit = 50
) {
  return state.events
    .filter((event) => {
      return (
        event.entity?.type === entityType &&
        event.entity?.id === entityId
      )
    })
    .slice(-limit)
    .reverse()
}


/**
 * Palauttaa nykyisen Boosterverse-pulssin.
 *
 * Tätä voidaan myöhemmin käyttää
 * Living Context Enginen syötteenä.
 */
function getHeartbeat() {
  const latestEvent =
    state.events.length > 0
      ? state.events[state.events.length - 1]
      : null

  return {
    moduleId: MODULE_ID,

    status: state.initialized
      ? "alive"
      : "sleeping",

    timestamp: new Date().toISOString(),

    startedAt: state.startedAt,

    lastEventAt: state.lastEventAt,

    totalEvents: state.totalEvents,

    bufferedEvents: state.events.length,

    latestEvent,
  }
}


/**
 * Palauttaa kevyen tilannekuvan tapahtumista.
 */
function getEventSummary() {
  const counts = {}

  for (const event of state.events) {
    counts[event.type] =
      (counts[event.type] || 0) + 1
  }

  return {
    totalEvents: state.totalEvents,
    bufferedEvents: state.events.length,
    lastEventAt: state.lastEventAt,
    eventTypes: counts,
  }
}


/**
 * Merkitsee tapahtuman käsitellyksi
 * Boosterverse-alijärjestelmässä.
 *
 * Esimerkiksi:
 *
 * remembered
 * associated
 * reflected
 */
function markEvent(eventId, field, value = true) {
  const allowedFields = [
    "remembered",
    "associated",
    "reflected",
  ]

  if (!allowedFields.includes(field)) {
    return {
      success: false,
      error: `Unsupported event field: ${field}`,
    }
  }

  const event = state.events.find(
    (item) => item.id === eventId
  )

  if (!event) {
    return {
      success: false,
      error: "Event not found",
    }
  }

  event.boosterverse[field] = Boolean(value)

  return {
    success: true,
    event,
  }
}


/**
 * Alustaa moduulin.
 */
function initializeBoosterverseEventEngine() {
  if (state.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  state.initialized = true
  state.startedAt = new Date().toISOString()

  return {
    success: true,
    status: "initialized",
    moduleId: MODULE_ID,
    version: MODULE_VERSION,
  }
}


/**
 * Health check.
 */
function getBoosterverseEventEngineHealth() {
  return {
    moduleId: MODULE_ID,
    version: MODULE_VERSION,

    healthy: true,

    status: state.initialized
      ? "running"
      : "idle",

    metrics: {
      totalEvents: state.totalEvents,
      bufferedEvents: state.events.length,
      lastEventAt: state.lastEventAt,
    },
  }
}


/**
 * Tyhjentää vain runtime-eventit.
 *
 * Tätä käytetään myöhemmin testeissä.
 * Tämä EI poista mitään tietokannasta.
 */
function clearRuntimeEvents() {
  state.events = []
  state.lastEventAt = null

  return {
    success: true,
    status: "cleared",
  }
}


/**
 * Estää runtime-muistin kasvamisen loputtomasti.
 */
function trimEventHistory() {
  if (state.events.length <= DEFAULT_MAX_EVENTS) {
    return
  }

  state.events = state.events.slice(
    -DEFAULT_MAX_EVENTS
  )
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


export {
  MODULE_ID,
  MODULE_VERSION,

  initializeBoosterverseEventEngine,

  recordEvent,

  getRecentEvents,

  getEventsByType,

  getEntityEvents,

  getHeartbeat,

  getEventSummary,

  markEvent,

  getBoosterverseEventEngineHealth,

  clearRuntimeEvents,
}


export default {
  id: MODULE_ID,

  name: "Boosterverse Event Engine",

  version: MODULE_VERSION,

  description:
    "Boosterverse-maailman tapahtuma-, heartbeat- ja havaintokerros.",

  initialize:
    initializeBoosterverseEventEngine,

  recordEvent,

  getRecentEvents,

  getEventsByType,

  getEntityEvents,

  getHeartbeat,

  getEventSummary,

  markEvent,

  health:
    getBoosterverseEventEngineHealth,
}
