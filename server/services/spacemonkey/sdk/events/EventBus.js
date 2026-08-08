/**
 * Wood-Booster HQ
 * Boosterverse SDK
 *
 * EventBus
 *
 * Keskitetty tapahtumaväylä Boosterverse-moduuleille.
 *
 * Tarkoitus:
 * - mahdollistaa module -> event -> module viestintä
 * - estää tarpeettomat suorat moduuliriippuvuudet
 * - tarjota subscribe / unsubscribe / emit
 * - säilyttää kevyt event history
 * - tukea wildcard-kuuntelua
 * - eristää handler-virheet muusta runtimesta
 *
 * Esimerkki:
 *
 * Workflow Engine
 *   ↓
 * TASK_COMPLETED
 *   ↓
 * EventBus
 *   ├── Reflection Engine
 *   ├── Opportunity Engine
 *   └── Timeline Engine
 */

const EVENT_BUS_VERSION = "1.0.0"

const MAX_HISTORY = 500
const MAX_LISTENERS_PER_EVENT = 100

const WILDCARD_EVENT = "*"


class EventBus {
  constructor({
    logger = null,
    maxHistory = MAX_HISTORY,
  } = {}) {
    this.version =
      EVENT_BUS_VERSION

    this.logger =
      logger

    this.maxHistory =
      normalizePositiveInteger(
        maxHistory,
        MAX_HISTORY
      )

    this.listeners =
      new Map()

    this.history =
      []

    this.createdAt =
      new Date().toISOString()

    this.updatedAt =
      this.createdAt

    this.metricsData = {
      subscriptions: 0,
      unsubscriptions: 0,
      emittedEvents: 0,
      deliveredEvents: 0,
      handlerErrors: 0,
      wildcardDeliveries: 0,
    }

    this.recordHistory(
      "event-bus-created"
    )
  }


  /**
   * Liittää loggerin.
   */
  setLogger(logger) {
    this.logger =
      logger

    this.touch()

    return this
  }


  /**
   * Subscribe.
   *
   * Palauttaa subscription-id:n.
   */
  subscribe(
    eventType,
    handler,
    {
      id = null,
      once = false,
      priority = 0,
      metadata = null,
    } = {}
  ) {
    const type =
      normalizeEventType(
        eventType
      )

    if (!type) {
      return {
        success: false,
        error:
          "Event type is required",
      }
    }

    if (
      typeof handler !==
      "function"
    ) {
      return {
        success: false,
        error:
          "Event handler must be a function",
      }
    }

    const listeners =
      this.listeners.get(
        type
      ) || []

    if (
      listeners.length >=
      MAX_LISTENERS_PER_EVENT
    ) {
      return {
        success: false,
        error:
          `Listener limit reached for event: ${type}`,
      }
    }

    const subscription = {
      id:
        sanitizeString(id) ||
        createId(
          "bv-subscription"
        ),

      eventType:
        type,

      handler,

      once:
        Boolean(once),

      priority:
        normalizePriority(
          priority
        ),

      metadata:
        cloneSafe(metadata),

      createdAt:
        new Date().toISOString(),

      calls: 0,

      failures: 0,

      lastCallAt: null,

      lastError: null,
    }

    listeners.push(
      subscription
    )

    listeners.sort(
      (a, b) =>
        b.priority -
        a.priority
    )

    this.listeners.set(
      type,
      listeners
    )

    this.metricsData
      .subscriptions += 1

    this.touch()

    this.recordHistory(
      "event-subscribed",
      {
        eventType:
          type,

        subscriptionId:
          subscription.id,

        once:
          subscription.once,

        priority:
          subscription.priority,
      }
    )

    return {
      success: true,

      subscriptionId:
        subscription.id,

      eventType:
        type,
    }
  }


  /**
   * Alias subscribe().
   */
  on(
    eventType,
    handler,
    options = {}
  ) {
    return this.subscribe(
      eventType,
      handler,
      options
    )
  }


  /**
   * Subscribe once.
   */
  once(
    eventType,
    handler,
    options = {}
  ) {
    return this.subscribe(
      eventType,
      handler,
      {
        ...options,
        once: true,
      }
    )
  }


  /**
   * Unsubscribe subscription-id:n perusteella.
   */
  unsubscribe(
    subscriptionId
  ) {
    const id =
      sanitizeString(
        subscriptionId
      )

    if (!id) {
      return {
        success: false,
        error:
          "Subscription id is required",
      }
    }

    let removed = false
    let removedEventType = null

    for (
      const [
        eventType,
        listeners,
      ]
      of this.listeners.entries()
    ) {
      const next =
        listeners.filter(
          (listener) =>
            listener.id !== id
        )

      if (
        next.length !==
        listeners.length
      ) {
        removed = true
        removedEventType =
          eventType

        if (
          next.length === 0
        ) {
          this.listeners.delete(
            eventType
          )
        } else {
          this.listeners.set(
            eventType,
            next
          )
        }

        break
      }
    }

    if (removed) {
      this.metricsData
        .unsubscriptions += 1

      this.touch()

      this.recordHistory(
        "event-unsubscribed",
        {
          subscriptionId:
            id,

          eventType:
            removedEventType,
        }
      )
    }

    return {
      success: true,
      removed,
      subscriptionId:
        id,
    }
  }


  /**
   * Alias unsubscribe().
   */
  off(subscriptionId) {
    return this.unsubscribe(
      subscriptionId
    )
  }


  /**
   * Poistaa kaikki tietyn eventin listenerit.
   */
  clearEvent(
    eventType
  ) {
    const type =
      normalizeEventType(
        eventType
      )

    if (!type) {
      return {
        success: false,
        error:
          "Event type is required",
      }
    }

    const count =
      this.listeners.get(
        type
      )?.length || 0

    this.listeners.delete(
      type
    )

    if (count > 0) {
      this.metricsData
        .unsubscriptions +=
        count
    }

    this.touch()

    this.recordHistory(
      "event-listeners-cleared",
      {
        eventType:
          type,

        removed:
          count,
      }
    )

    return {
      success: true,
      removed:
        count,
    }
  }


  /**
   * Julkaisee tapahtuman.
   *
   * Handler-virheet eivät pysäytä
   * muiden listenerien toimitusta.
   */
  async emit(
    eventType,
    payload = null,
    metadata = null
  ) {
    const type =
      normalizeEventType(
        eventType
      )

    if (!type) {
      return {
        success: false,
        error:
          "Event type is required",
      }
    }

    const event = {
      id:
        createId(
          "bv-event"
        ),

      type,

      payload:
        cloneSafe(
          payload
        ),

      metadata:
        cloneSafe(
          metadata
        ),

      timestamp:
        new Date().toISOString(),
    }

    this.metricsData
      .emittedEvents += 1

    this.recordHistory(
      "event-emitted",
      {
        eventId:
          event.id,

        eventType:
          event.type,
      }
    )

    const directListeners =
      [
        ...(
          this.listeners.get(
            type
          ) || []
        ),
      ]

    const wildcardListeners =
      type === WILDCARD_EVENT
        ? []
        : [
            ...(
              this.listeners.get(
                WILDCARD_EVENT
              ) || []
            ),
          ]

    const deliveries = [
      ...directListeners.map(
        (listener) => ({
          listener,
          wildcard: false,
        })
      ),

      ...wildcardListeners.map(
        (listener) => ({
          listener,
          wildcard: true,
        })
      ),
    ]

    deliveries.sort(
      (a, b) =>
        b.listener.priority -
        a.listener.priority
    )

    const results = []

    for (
      const delivery
      of deliveries
    ) {
      const {
        listener,
        wildcard,
      } = delivery

      listener.calls += 1
      listener.lastCallAt =
        new Date().toISOString()

      try {
        const result =
          await listener.handler(
            cloneSafe(event)
          )

        listener.lastError =
          null

        this.metricsData
          .deliveredEvents += 1

        if (wildcard) {
          this.metricsData
            .wildcardDeliveries += 1
        }

        results.push({
          success: true,

          subscriptionId:
            listener.id,

          wildcard,

          result:
            cloneSafe(
              result
            ),
        })
      } catch (error) {
        listener.failures += 1

        listener.lastError =
          normalizeError(
            error,
            "event-handler"
          )

        this.metricsData
          .handlerErrors += 1

        this.log(
          "error",
          `Event handler failed: ${listener.id}`,
          {
            eventType:
              type,

            error:
              listener.lastError,
          }
        )

        results.push({
          success: false,

          subscriptionId:
            listener.id,

          wildcard,

          error:
            cloneSafe(
              listener.lastError
            ),
        })
      }

      if (listener.once) {
        this.unsubscribe(
          listener.id
        )
      }
    }

    this.touch()

    return {
      success: true,

      event:
        cloneSafe(
          event
        ),

      listeners:
        deliveries.length,

      delivered:
        results.filter(
          (item) =>
            item.success
        ).length,

      failed:
        results.filter(
          (item) =>
            !item.success
        ).length,

      results,
    }
  }


  /**
   * Alias emit().
   */
  async publish(
    eventType,
    payload = null,
    metadata = null
  ) {
    return this.emit(
      eventType,
      payload,
      metadata
    )
  }


  /**
   * Tarkistaa onko eventillä listenereitä.
   */
  hasListeners(
    eventType
  ) {
    const type =
      normalizeEventType(
        eventType
      )

    if (!type) {
      return false
    }

    return (
      (
        this.listeners.get(
          type
        )?.length || 0
      ) > 0
    )
  }


  /**
   * Listenerien määrä.
   */
  listenerCount(
    eventType = null
  ) {
    if (eventType) {
      return (
        this.listeners.get(
          normalizeEventType(
            eventType
          )
        )?.length || 0
      )
    }

    let total = 0

    for (
      const listeners
      of this.listeners.values()
    ) {
      total +=
        listeners.length
    }

    return total
  }


  /**
   * Listaa subscriptionit ilman handler-funktioita.
   */
  listSubscriptions({
    eventType = null,
  } = {}) {
    const results = []

    for (
      const [
        type,
        listeners,
      ]
      of this.listeners.entries()
    ) {
      if (
        eventType &&
        type !==
          normalizeEventType(
            eventType
          )
      ) {
        continue
      }

      for (
        const listener
        of listeners
      ) {
        results.push(
          serializeListener(
            listener
          )
        )
      }
    }

    return results
  }


  /**
   * Event history.
   *
   * Tämä sisältää SDK:n sisäiset
   * event bus -tapahtumat, ei koko payload-historiaa.
   */
  getHistory(
    limit = 50
  ) {
    const safeLimit =
      Math.max(
        1,
        Math.min(
          Number(limit) || 50,
          this.maxHistory
        )
      )

    return this.history
      .slice(
        -safeLimit
      )
      .reverse()
      .map(cloneSafe)
  }


  /**
   * Yhteenveto.
   */
  summary() {
    return {
      version:
        this.version,

      eventTypes:
        this.listeners.size,

      listeners:
        this.listenerCount(),

      wildcardListeners:
        this.listenerCount(
          WILDCARD_EVENT
        ),

      metrics:
        this.metrics(),

      createdAt:
        this.createdAt,

      updatedAt:
        this.updatedAt,
    }
  }


  /**
   * Health.
   */
  health() {
    return {
      healthy: true,

      version:
        this.version,

      listeners:
        this.listenerCount(),

      eventTypes:
        this.listeners.size,

      handlerErrors:
        this.metricsData
          .handlerErrors,

      metrics:
        this.metrics(),

      updatedAt:
        this.updatedAt,
    }
  }


  /**
   * Metrics.
   */
  metrics() {
    return cloneSafe({
      ...this.metricsData,

      eventTypes:
        this.listeners.size,

      listeners:
        this.listenerCount(),

      historyEntries:
        this.history.length,
    })
  }


  /**
   * Reset.
   */
  reset({
    clearListeners = true,
    clearHistory = true,
  } = {}) {
    if (clearListeners) {
      this.listeners.clear()
    }

    if (clearHistory) {
      this.history = []
    }

    this.metricsData = {
      subscriptions: 0,
      unsubscriptions: 0,
      emittedEvents: 0,
      deliveredEvents: 0,
      handlerErrors: 0,
      wildcardDeliveries: 0,
    }

    this.touch()

    this.recordHistory(
      "event-bus-reset",
      {
        clearListeners,
        clearHistory,
      }
    )

    return {
      success: true,
      status: "reset",
    }
  }


  /**
   * Logger adapter.
   */
  log(
    level,
    message,
    data = null
  ) {
    if (!this.logger) {
      return false
    }

    try {
      if (
        typeof this.logger[
          level
        ] === "function"
      ) {
        this.logger[
          level
        ](
          message,
          data
        )

        return true
      }

      if (
        typeof this.logger.log ===
        "function"
      ) {
        this.logger.log(
          level,
          message,
          data
        )

        return true
      }
    } catch {
      return false
    }

    return false
  }


  recordHistory(
    action,
    data = null
  ) {
    this.history.push({
      action:
        sanitizeString(
          action
        ) ||
        "event",

      data:
        cloneSafe(
          data
        ),

      timestamp:
        new Date().toISOString(),
    })

    if (
      this.history.length >
      this.maxHistory
    ) {
      this.history =
        this.history.slice(
          -this.maxHistory
        )
    }
  }


  touch() {
    this.updatedAt =
      new Date().toISOString()
  }
}


/**
 * Listener metadata turvalliseen listaukseen.
 */
function serializeListener(
  listener
) {
  return {
    id:
      listener.id,

    eventType:
      listener.eventType,

    once:
      listener.once,

    priority:
      listener.priority,

    metadata:
      cloneSafe(
        listener.metadata
      ),

    calls:
      listener.calls,

    failures:
      listener.failures,

    lastCallAt:
      listener.lastCallAt,

    lastError:
      cloneSafe(
        listener.lastError
      ),

    createdAt:
      listener.createdAt,
  }
}


function normalizeEventType(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const string =
    String(value)
      .trim()

  return string || null
}


function normalizePriority(
  value
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return 0
  }

  return Math.max(
    -1000,
    Math.min(
      1000,
      Math.trunc(number)
    )
  )
}


function normalizePositiveInteger(
  value,
  fallback
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.max(
    1,
    Math.floor(number)
  )
}


function normalizeError(
  error,
  phase = "unknown"
) {
  if (
    error instanceof Error
  ) {
    return {
      name:
        error.name ||
        "Error",

      message:
        error.message ||
        "Unknown error",

      stack:
        typeof error.stack ===
        "string"
          ? error.stack
          : null,

      phase,

      timestamp:
        new Date().toISOString(),
    }
  }

  return {
    name: "Error",

    message:
      typeof error ===
      "string"
        ? error
        : safeStringify(
            error
          ),

    stack: null,

    phase,

    timestamp:
      new Date().toISOString(),
  }
}


function safeStringify(
  value
) {
  try {
    return JSON.stringify(
      value
    )
  } catch {
    return "Unknown event error"
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


function cloneSafe(value) {
  if (
    value === undefined
  ) {
    return null
  }

  try {
    return JSON.parse(
      JSON.stringify(value)
    )
  } catch {
    return null
  }
}


export {
  EVENT_BUS_VERSION,
  WILDCARD_EVENT,
  EventBus,
}


export default EventBus
