/**
 * Wood-Booster HQ
 * Boosterverse SDK
 *
 * RuntimeContext
 *
 * Yhteinen runtime-objekti kaikille Boosterverse-moduuleille.
 *
 * Tarkoitus:
 * - tarjota yksi vakaa rajapinta moduuleille
 * - estää suorat module -> module importit
 * - keskittää state, events, logger, registry ja services
 * - tarjota turvalliset get/set/helper-metodit
 * - mahdollistaa dependency injection
 *
 * Moduuli voi saada tämän:
 *
 * runtime.state
 * runtime.events
 * runtime.logger
 * runtime.registry
 * runtime.services
 * runtime.context
 *
 * Periaate:
 *
 * Module
 *   ↓
 * RuntimeContext
 *   ↓
 * SDK Services
 *
 * Ei:
 *
 * Module A
 *   ↓
 * import Module B
 */

const RUNTIME_CONTEXT_VERSION =
  "1.0.0"

const MAX_HISTORY = 200


class RuntimeContext {
  constructor({
    state = null,
    events = null,
    logger = null,
    registry = null,
    services = null,
    metadata = null,
  } = {}) {
    this.version =
      RUNTIME_CONTEXT_VERSION

    this.createdAt =
      new Date().toISOString()

    this.updatedAt =
      this.createdAt

    this.state =
      state

    this.events =
      events

    this.logger =
      logger

    this.registry =
      registry

    this.services =
      new Map()

    this.metadata =
      metadata ?? null

    this.values =
      new Map()

    this.history =
      []

    this.metricsData = {
      reads: 0,
      writes: 0,
      serviceReads: 0,
      serviceWrites: 0,
      eventEmits: 0,
      logCalls: 0,
      errors: 0,
    }

    if (
      services &&
      typeof services === "object"
    ) {
      this.registerServices(
        services
      )
    }

    this.recordHistory(
      "runtime-context-created"
    )
  }


  /**
   * State Store.
   */
  setStateStore(state) {
    this.state =
      state

    this.touch()

    this.recordHistory(
      "state-store-attached",
      {
        attached:
          Boolean(state),
      }
    )

    return this
  }


  getStateStore() {
    return this.state
  }


  /**
   * Event Bus.
   */
  setEventBus(events) {
    this.events =
      events

    this.touch()

    this.recordHistory(
      "event-bus-attached",
      {
        attached:
          Boolean(events),
      }
    )

    return this
  }


  getEventBus() {
    return this.events
  }


  /**
   * Logger.
   */
  setLogger(logger) {
    this.logger =
      logger

    this.touch()

    this.recordHistory(
      "logger-attached",
      {
        attached:
          Boolean(logger),
      }
    )

    return this
  }


  getLogger() {
    return this.logger
  }


  /**
   * Module Registry.
   */
  setRegistry(registry) {
    this.registry =
      registry

    this.touch()

    this.recordHistory(
      "registry-attached",
      {
        attached:
          Boolean(registry),
      }
    )

    return this
  }


  getRegistry() {
    return this.registry
  }


  /**
   * Rekisteröi runtime-servicen.
   *
   * Esimerkiksi:
   *
   * runtime.registerService(
   *   "memory",
   *   memoryService
   * )
   */
  registerService(
    id,
    service
  ) {
    const serviceId =
      sanitizeString(id)

    if (!serviceId) {
      return {
        success: false,
        error:
          "Service id is required",
      }
    }

    if (
      service === null ||
      service === undefined
    ) {
      return {
        success: false,
        error:
          "Service value is required",
      }
    }

    const existing =
      this.services.has(
        serviceId
      )

    this.services.set(
      serviceId,
      service
    )

    this.metricsData
      .serviceWrites += 1

    this.touch()

    this.recordHistory(
      existing
        ? "service-updated"
        : "service-registered",
      {
        serviceId,
      }
    )

    return {
      success: true,
      created:
        !existing,
      serviceId,
    }
  }


  /**
   * Rekisteröi monta serviceä.
   *
   * Tukee sekä Objectia että Mappia.
   */
  registerServices(
    services
  ) {
    if (
      services instanceof Map
    ) {
      const results = []

      for (
        const [
          id,
          service,
        ]
        of services.entries()
      ) {
        results.push(
          this.registerService(
            id,
            service
          )
        )
      }

      return {
        success:
          results.every(
            (item) =>
              item.success
          ),

        results,
      }
    }

    if (
      !services ||
      typeof services !==
        "object"
    ) {
      return {
        success: false,
        error:
          "Services must be an object or Map",
      }
    }

    const results = []

    for (
      const [
        id,
        service,
      ]
      of Object.entries(
        services
      )
    ) {
      results.push(
        this.registerService(
          id,
          service
        )
      )
    }

    return {
      success:
        results.every(
          (item) =>
            item.success
        ),

      results,
    }
  }


  /**
   * Hakee servicen.
   */
  getService(id) {
    this.metricsData
      .serviceReads += 1

    return (
      this.services.get(
        sanitizeString(id)
      ) ??
      null
    )
  }


  /**
   * Onko service olemassa.
   */
  hasService(id) {
    return this.services.has(
      sanitizeString(id)
    )
  }


  /**
   * Poistaa servicen.
   */
  unregisterService(id) {
    const serviceId =
      sanitizeString(id)

    if (!serviceId) {
      return {
        success: false,
        error:
          "Service id is required",
      }
    }

    const removed =
      this.services.delete(
        serviceId
      )

    if (removed) {
      this.touch()

      this.recordHistory(
        "service-unregistered",
        {
          serviceId,
        }
      )
    }

    return {
      success: true,
      removed,
      serviceId,
    }
  }


  /**
   * Listaa service-id:t.
   */
  listServices() {
    return [
      ...this.services.keys(),
    ]
  }


  /**
   * Runtime key/value -tila.
   *
   * Tämä ei korvaa State Storea.
   *
   * Tarkoitus on tarjota pieni
   * transient runtime metadata -kerros.
   */
  set(
    key,
    value
  ) {
    const safeKey =
      sanitizeString(key)

    if (!safeKey) {
      return {
        success: false,
        error:
          "Runtime key is required",
      }
    }

    this.values.set(
      safeKey,
      value
    )

    this.metricsData
      .writes += 1

    this.touch()

    return {
      success: true,
      key:
        safeKey,
    }
  }


  /**
   * Runtime value.
   */
  get(
    key,
    fallback = null
  ) {
    this.metricsData
      .reads += 1

    const safeKey =
      sanitizeString(key)

    if (!safeKey) {
      return fallback
    }

    if (
      !this.values.has(
        safeKey
      )
    ) {
      return fallback
    }

    return this.values.get(
      safeKey
    )
  }


  /**
   * Runtime key exists.
   */
  has(key) {
    return this.values.has(
      sanitizeString(key)
    )
  }


  /**
   * Runtime key poisto.
   */
  delete(key) {
    const safeKey =
      sanitizeString(key)

    if (!safeKey) {
      return false
    }

    const removed =
      this.values.delete(
        safeKey
      )

    if (removed) {
      this.touch()
    }

    return removed
  }


  /**
   * State Store helper.
   *
   * Tukee yleisiä State Store API -malleja:
   *
   * state.get(path)
   * state.read(path)
   */
  readState(
    path,
    fallback = null
  ) {
    if (!this.state) {
      return fallback
    }

    try {
      if (
        typeof this.state.get ===
        "function"
      ) {
        const value =
          this.state.get(
            path
          )

        return value ===
          undefined
          ? fallback
          : value
      }

      if (
        typeof this.state.read ===
        "function"
      ) {
        const value =
          this.state.read(
            path
          )

        return value ===
          undefined
          ? fallback
          : value
      }

      return fallback
    } catch (error) {
      this.handleRuntimeError(
        error,
        "readState"
      )

      return fallback
    }
  }


  /**
   * State Store kirjoitus.
   *
   * Tukee:
   *
   * state.set(path, value)
   * state.write(path, value)
   */
  writeState(
    path,
    value
  ) {
    if (!this.state) {
      return {
        success: false,
        error:
          "State Store is not attached",
      }
    }

    try {
      if (
        typeof this.state.set ===
        "function"
      ) {
        const result =
          this.state.set(
            path,
            value
          )

        return normalizeOperationResult(
          result
        )
      }

      if (
        typeof this.state.write ===
        "function"
      ) {
        const result =
          this.state.write(
            path,
            value
          )

        return normalizeOperationResult(
          result
        )
      }

      return {
        success: false,
        error:
          "State Store has no compatible write method",
      }
    } catch (error) {
      return this.handleRuntimeError(
        error,
        "writeState"
      )
    }
  }


  /**
   * Event Bus helper.
   *
   * Tukee:
   *
   * events.emit(type, payload)
   * events.publish(type, payload)
   */
  async emit(
    type,
    payload = null,
    metadata = null
  ) {
    const eventType =
      sanitizeString(type)

    if (!eventType) {
      return {
        success: false,
        error:
          "Event type is required",
      }
    }

    if (!this.events) {
      return {
        success: false,
        error:
          "Event Bus is not attached",
      }
    }

    this.metricsData
      .eventEmits += 1

    try {
      if (
        typeof this.events.emit ===
        "function"
      ) {
        const result =
          await this.events.emit(
            eventType,
            payload,
            metadata
          )

        return normalizeOperationResult(
          result
        )
      }

      if (
        typeof this.events.publish ===
        "function"
      ) {
        const result =
          await this.events.publish(
            eventType,
            payload,
            metadata
          )

        return normalizeOperationResult(
          result
        )
      }

      return {
        success: false,
        error:
          "Event Bus has no compatible emit method",
      }
    } catch (error) {
      return this.handleRuntimeError(
        error,
        "emit"
      )
    }
  }


  /**
   * Logger helper.
   *
   * runtime.log(
   *   "info",
   *   "message",
   *   {}
   * )
   */
  log(
    level,
    message,
    data = null
  ) {
    this.metricsData
      .logCalls += 1

    if (!this.logger) {
      return false
    }

    const safeLevel =
      sanitizeString(level) ||
      "info"

    const safeMessage =
      sanitizeString(message) ||
      ""

    try {
      if (
        typeof this.logger[
          safeLevel
        ] === "function"
      ) {
        this.logger[
          safeLevel
        ](
          safeMessage,
          data
        )

        return true
      }

      if (
        typeof this.logger.log ===
        "function"
      ) {
        this.logger.log(
          safeLevel,
          safeMessage,
          data
        )

        return true
      }
    } catch {
      return false
    }

    return false
  }


  debug(
    message,
    data = null
  ) {
    return this.log(
      "debug",
      message,
      data
    )
  }


  info(
    message,
    data = null
  ) {
    return this.log(
      "info",
      message,
      data
    )
  }


  warn(
    message,
    data = null
  ) {
    return this.log(
      "warn",
      message,
      data
    )
  }


  error(
    message,
    data = null
  ) {
    return this.log(
      "error",
      message,
      data
    )
  }


  /**
   * Moduulin haku Registrystä.
   *
   * Tätä saa käyttää tarvittaessa,
   * mutta suositus on käyttää service-
   * tai event-rajapintaa.
   */
  getModule(moduleId) {
    if (
      !this.registry ||
      typeof this.registry.get !==
        "function"
    ) {
      return null
    }

    try {
      return this.registry.get(
        moduleId
      )
    } catch (error) {
      this.handleRuntimeError(
        error,
        "getModule"
      )

      return null
    }
  }


  /**
   * Context snapshot.
   *
   * Tästä EI yritetä serialisoida
   * service-instansseja tai moduuleja.
   */
  snapshot() {
    return {
      version:
        this.version,

      services:
        this.listServices(),

      values:
        serializeRuntimeValues(
          this.values
        ),

      attached: {
        state:
          Boolean(
            this.state
          ),

        events:
          Boolean(
            this.events
          ),

        logger:
          Boolean(
            this.logger
          ),

        registry:
          Boolean(
            this.registry
          ),
      },

      metadata:
        cloneSafe(
          this.metadata
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

      attached: {
        state:
          Boolean(
            this.state
          ),

        events:
          Boolean(
            this.events
          ),

        logger:
          Boolean(
            this.logger
          ),

        registry:
          Boolean(
            this.registry
          ),
      },

      services:
        this.services.size,

      runtimeValues:
        this.values.size,

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

      services:
        this.services.size,

      values:
        this.values.size,

      historyEntries:
        this.history.length,
    })
  }


  /**
   * Historia.
   */
  getHistory(
    limit = 50
  ) {
    const safeLimit =
      Math.max(
        1,
        Math.min(
          Number(limit) || 50,
          MAX_HISTORY
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
   * Runtime transient state reset.
   *
   * Services ja attached SDK-osat
   * säilyvät oletuksena.
   */
  reset({
    clearServices = false,
    clearValues = true,
    clearHistory = true,
  } = {}) {
    if (clearServices) {
      this.services.clear()
    }

    if (clearValues) {
      this.values.clear()
    }

    if (clearHistory) {
      this.history = []
    }

    this.metricsData = {
      reads: 0,
      writes: 0,
      serviceReads: 0,
      serviceWrites: 0,
      eventEmits: 0,
      logCalls: 0,
      errors: 0,
    }

    this.touch()

    this.recordHistory(
      "runtime-context-reset",
      {
        clearServices,
        clearValues,
        clearHistory,
      }
    )

    return {
      success: true,
      status: "reset",
    }
  }


  /**
   * Keskitetty runtime-error.
   */
  handleRuntimeError(
    error,
    phase
  ) {
    this.metricsData
      .errors += 1

    const normalized =
      normalizeError(
        error,
        phase
      )

    this.recordHistory(
      "runtime-context-error",
      normalized
    )

    this.error(
      normalized.message,
      normalized
    )

    this.touch()

    return {
      success: false,
      error:
        normalized,
    }
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
      MAX_HISTORY
    ) {
      this.history =
        this.history.slice(
          -MAX_HISTORY
        )
    }
  }


  touch() {
    this.updatedAt =
      new Date().toISOString()
  }
}


/**
 * Normalisoi eri API:en palautukset
 * samaan runtime-muotoon.
 */
function normalizeOperationResult(
  result
) {
  if (
    result === undefined
  ) {
    return {
      success: true,
    }
  }

  if (
    result === null
  ) {
    return {
      success: true,
      result: null,
    }
  }

  if (
    typeof result === "object" &&
    Object.prototype
      .hasOwnProperty.call(
        result,
        "success"
      )
  ) {
    return result
  }

  return {
    success: true,
    result,
  }
}


function serializeRuntimeValues(
  values
) {
  const result = {}

  for (
    const [
      key,
      value,
    ]
    of values.entries()
  ) {
    result[key] =
      cloneSafe(
        value
      )
  }

  return result
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


function safeStringify(value) {
  try {
    return JSON.stringify(
      value
    )
  } catch {
    return "Unknown runtime error"
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
  RUNTIME_CONTEXT_VERSION,
  RuntimeContext,
}


export default RuntimeContext
