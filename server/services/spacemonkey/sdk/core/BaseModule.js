/**
 * Wood-Booster OS
 * Boosterverse SDK
 *
 * BaseModule
 *
 * Kaikkien Boosterverse SDK -moduulien yhteinen perusluokka.
 *
 * Tavoitteet:
 * - yhtenäinen moduulien elinkaari
 * - yhtenäinen health-rajapinta
 * - yhtenäinen metrics-rajapinta
 * - yhtenäinen context-rajapinta
 * - yhtenäinen snapshot-rajapinta
 * - turvallinen virheenkäsittely
 * - mahdollisimman vähän toistuvaa boilerplate-koodia
 *
 * Moduulin elinkaari:
 *
 * created
 *   ↓
 * initialize()
 *   ↓
 * initialized
 *   ↓
 * start()
 *   ↓
 * running
 *   ↓
 * stop()
 *   ↓
 * stopped
 *
 * Mahdollinen virhe:
 *
 * running
 *   ↓
 * error
 *
 * Tämä luokka EI:
 * - tunne yksittäisiä Boosterverse Enginejä
 * - kutsu LLM:ää
 * - käytä Tool Busia
 * - tee verkko- tai tiedostojärjestelmäoperaatioita
 *
 * Se tarjoaa vain yhteisen SDK-perustan.
 */

const MODULE_STATUS = Object.freeze({
  CREATED: "created",
  INITIALIZING: "initializing",
  INITIALIZED: "initialized",
  STARTING: "starting",
  RUNNING: "running",
  STOPPING: "stopping",
  STOPPED: "stopped",
  ERROR: "error",
  DISABLED: "disabled",
})

const DEFAULT_MAX_HISTORY = 200


class BaseModule {
  constructor({
    id,
    name = null,
    version = "1.0.0",
    description = null,
    enabled = true,
    dependencies = [],
    metadata = null,
    maxHistory = DEFAULT_MAX_HISTORY,
  } = {}) {
    if (!id || typeof id !== "string") {
      throw new TypeError(
        "BaseModule requires a valid string id"
      )
    }

    this.id = id.trim()

    this.name =
      sanitizeString(name) ||
      this.id

    this.version =
      sanitizeString(version) ||
      "1.0.0"

    this.description =
      sanitizeString(description)

    this.enabled =
      Boolean(enabled)

    this.dependencies =
      normalizeStringArray(
        dependencies
      )

    this.metadata =
      metadata ?? null

    this.maxHistory =
      normalizePositiveInteger(
        maxHistory,
        DEFAULT_MAX_HISTORY
      )

    this.status =
      this.enabled
        ? MODULE_STATUS.CREATED
        : MODULE_STATUS.DISABLED

    this.createdAt =
      new Date().toISOString()

    this.initializedAt =
      null

    this.startedAt =
      null

    this.stoppedAt =
      null

    this.updatedAt =
      this.createdAt

    this.lastError =
      null

    this.runtime =
      null

    this.history =
      []

    this.metricsData = {
      initializeCalls: 0,
      startCalls: 0,
      updateCalls: 0,
      stopCalls: 0,
      contextCalls: 0,
      healthCalls: 0,
      snapshotCalls: 0,
      errors: 0,
    }

    this.recordHistory(
      "module-created",
      {
        enabled:
          this.enabled,
      }
    )
  }


  /**
   * Liittää Boosterverse Runtimen moduuliin.
   *
   * Runtime voi myöhemmin sisältää:
   *
   * runtime.state
   * runtime.events
   * runtime.logger
   * runtime.context
   * runtime.registry
   * runtime.services
   */
  attachRuntime(runtime) {
    if (
      runtime !== null &&
      typeof runtime !== "object"
    ) {
      throw new TypeError(
        "Runtime must be an object or null"
      )
    }

    this.runtime =
      runtime

    this.touch()

    this.recordHistory(
      "runtime-attached",
      {
        attached:
          Boolean(runtime),
      }
    )

    return this
  }


  /**
   * Palauttaa runtime-objektin.
   */
  getRuntime() {
    return this.runtime
  }


  /**
   * Moduulin alustaminen.
   *
   * Varsinainen moduuli voi overridea
   * onInitialize()-funktion.
   */
  async initialize(runtime = null) {
    this.metricsData
      .initializeCalls += 1

    if (!this.enabled) {
      this.status =
        MODULE_STATUS.DISABLED

      return {
        success: true,
        status:
          MODULE_STATUS.DISABLED,
        moduleId:
          this.id,
      }
    }

    if (
      this.status ===
        MODULE_STATUS.INITIALIZED ||
      this.status ===
        MODULE_STATUS.RUNNING
    ) {
      return {
        success: true,
        status:
          "already-initialized",
        moduleId:
          this.id,
      }
    }

    if (runtime) {
      this.attachRuntime(
        runtime
      )
    }

    this.status =
      MODULE_STATUS.INITIALIZING

    this.touch()

    this.recordHistory(
      "initialization-started"
    )

    try {
      const result =
        await this.onInitialize(
          this.runtime
        )

      const now =
        new Date().toISOString()

      this.initializedAt =
        now

      this.updatedAt =
        now

      this.status =
        MODULE_STATUS.INITIALIZED

      this.lastError =
        null

      this.recordHistory(
        "initialization-completed"
      )

      return {
        success: true,
        status:
          MODULE_STATUS.INITIALIZED,
        moduleId:
          this.id,
        version:
          this.version,
        result:
          result ?? null,
      }
    } catch (error) {
      return this.handleError(
        error,
        "initialize"
      )
    }
  }


  /**
   * Moduulin käynnistys.
   */
  async start() {
    this.metricsData
      .startCalls += 1

    if (!this.enabled) {
      return {
        success: false,
        status:
          MODULE_STATUS.DISABLED,
        moduleId:
          this.id,
        error:
          "Module is disabled",
      }
    }

    if (
      this.status ===
      MODULE_STATUS.RUNNING
    ) {
      return {
        success: true,
        status:
          "already-running",
        moduleId:
          this.id,
      }
    }

    if (
      this.status ===
      MODULE_STATUS.CREATED
    ) {
      const initialized =
        await this.initialize()

      if (
        !initialized.success
      ) {
        return initialized
      }
    }

    this.status =
      MODULE_STATUS.STARTING

    this.touch()

    this.recordHistory(
      "start-begin"
    )

    try {
      const result =
        await this.onStart(
          this.runtime
        )

      const now =
        new Date().toISOString()

      this.startedAt =
        this.startedAt ||
        now

      this.updatedAt =
        now

      this.status =
        MODULE_STATUS.RUNNING

      this.lastError =
        null

      this.recordHistory(
        "start-completed"
      )

      return {
        success: true,
        status:
          MODULE_STATUS.RUNNING,
        moduleId:
          this.id,
        result:
          result ?? null,
      }
    } catch (error) {
      return this.handleError(
        error,
        "start"
      )
    }
  }


  /**
   * Moduulin runtime-update.
   *
   * Runtime Orchestrator voi kutsua tätä
   * hallitulla tickillä.
   */
  async update(context = null) {
    this.metricsData
      .updateCalls += 1

    if (
      !this.enabled ||
      this.status !==
        MODULE_STATUS.RUNNING
    ) {
      return {
        success: false,
        skipped: true,
        status:
          this.status,
        moduleId:
          this.id,
      }
    }

    try {
      const result =
        await this.onUpdate(
          this.runtime,
          context
        )

      this.touch()

      return {
        success: true,
        moduleId:
          this.id,
        result:
          result ?? null,
      }
    } catch (error) {
      return this.handleError(
        error,
        "update"
      )
    }
  }


  /**
   * Pysäyttää moduulin.
   */
  async stop() {
    this.metricsData
      .stopCalls += 1

    if (
      this.status ===
        MODULE_STATUS.STOPPED ||
      this.status ===
        MODULE_STATUS.CREATED
    ) {
      return {
        success: true,
        status:
          "already-stopped",
        moduleId:
          this.id,
      }
    }

    this.status =
      MODULE_STATUS.STOPPING

    this.touch()

    this.recordHistory(
      "stop-begin"
    )

    try {
      const result =
        await this.onStop(
          this.runtime
        )

      const now =
        new Date().toISOString()

      this.stoppedAt =
        now

      this.updatedAt =
        now

      this.status =
        MODULE_STATUS.STOPPED

      this.recordHistory(
        "stop-completed"
      )

      return {
        success: true,
        status:
          MODULE_STATUS.STOPPED,
        moduleId:
          this.id,
        result:
          result ?? null,
      }
    } catch (error) {
      return this.handleError(
        error,
        "stop"
      )
    }
  }


  /**
   * Aktivoi moduulin.
   */
  enable() {
    this.enabled =
      true

    if (
      this.status ===
      MODULE_STATUS.DISABLED
    ) {
      this.status =
        MODULE_STATUS.CREATED
    }

    this.touch()

    this.recordHistory(
      "module-enabled"
    )

    return {
      success: true,
      enabled: true,
      moduleId:
        this.id,
    }
  }


  /**
   * Deaktivoi moduulin.
   */
  async disable({
    stop = true,
  } = {}) {
    if (
      stop &&
      this.status ===
        MODULE_STATUS.RUNNING
    ) {
      await this.stop()
    }

    this.enabled =
      false

    this.status =
      MODULE_STATUS.DISABLED

    this.touch()

    this.recordHistory(
      "module-disabled"
    )

    return {
      success: true,
      enabled: false,
      moduleId:
        this.id,
    }
  }


  /**
   * Yhteinen context-rajapinta.
   *
   * Override:
   * onContext(runtime)
   */
  async context() {
    this.metricsData
      .contextCalls += 1

    if (!this.enabled) {
      return null
    }

    try {
      return await this.onContext(
        this.runtime
      )
    } catch (error) {
      this.handleError(
        error,
        "context"
      )

      return null
    }
  }


  /**
   * Health check.
   */
  async health() {
    this.metricsData
      .healthCalls += 1

    let customHealth =
      null

    try {
      customHealth =
        await this.onHealth(
          this.runtime
        )
    } catch (error) {
      this.handleError(
        error,
        "health"
      )
    }

    const baseHealthy =
      this.enabled &&
      this.status !==
        MODULE_STATUS.ERROR

    return {
      moduleId:
        this.id,

      name:
        this.name,

      version:
        this.version,

      healthy:
        customHealth
          ?.healthy ??
        baseHealthy,

      status:
        this.status,

      enabled:
        this.enabled,

      lastError:
        cloneSafe(
          this.lastError
        ),

      uptimeMs:
        this.getUptimeMs(),

      metrics:
        this.metrics(),

      details:
        customHealth ??
        null,

      updatedAt:
        this.updatedAt,
    }
  }


  /**
   * Metrics.
   */
  metrics() {
    return cloneSafe(
      {
        ...this.metricsData,

        historyEntries:
          this.history.length,

        uptimeMs:
          this.getUptimeMs(),
      }
    )
  }


  /**
   * Tilannekuva moduulista.
   */
  async snapshot() {
    this.metricsData
      .snapshotCalls += 1

    let customSnapshot =
      null

    try {
      customSnapshot =
        await this.onSnapshot(
          this.runtime
        )
    } catch (error) {
      this.handleError(
        error,
        "snapshot"
      )
    }

    return {
      id:
        this.id,

      name:
        this.name,

      version:
        this.version,

      description:
        this.description,

      enabled:
        this.enabled,

      status:
        this.status,

      dependencies:
        [...this.dependencies],

      createdAt:
        this.createdAt,

      initializedAt:
        this.initializedAt,

      startedAt:
        this.startedAt,

      stoppedAt:
        this.stoppedAt,

      updatedAt:
        this.updatedAt,

      lastError:
        cloneSafe(
          this.lastError
        ),

      metrics:
        this.metrics(),

      data:
        customSnapshot ??
        null,
    }
  }


  /**
   * Kevyt summary.
   */
  summary() {
    return {
      id:
        this.id,

      name:
        this.name,

      version:
        this.version,

      enabled:
        this.enabled,

      status:
        this.status,

      healthy:
        this.status !==
          MODULE_STATUS.ERROR,

      dependencies:
        [...this.dependencies],

      lastError:
        cloneSafe(
          this.lastError
        ),

      updatedAt:
        this.updatedAt,
    }
  }


  /**
   * Historia.
   */
  getHistory(
    limit = 50
  ) {
    const safeLimit =
      normalizePositiveInteger(
        limit,
        50
      )

    return this.history
      .slice(
        -Math.min(
          safeLimit,
          this.maxHistory
        )
      )
      .reverse()
      .map(cloneSafe)
  }


  /**
   * Moduulin resetointi.
   *
   * Override:
   * onReset(runtime)
   */
  async reset() {
    try {
      await this.onReset(
        this.runtime
      )

      this.lastError =
        null

      this.status =
        this.enabled
          ? MODULE_STATUS.CREATED
          : MODULE_STATUS.DISABLED

      this.initializedAt =
        null

      this.startedAt =
        null

      this.stoppedAt =
        null

      this.history =
        []

      this.metricsData = {
        initializeCalls: 0,
        startCalls: 0,
        updateCalls: 0,
        stopCalls: 0,
        contextCalls: 0,
        healthCalls: 0,
        snapshotCalls: 0,
        errors: 0,
      }

      this.touch()

      this.recordHistory(
        "module-reset"
      )

      return {
        success: true,
        status:
          "reset",
        moduleId:
          this.id,
      }
    } catch (error) {
      return this.handleError(
        error,
        "reset"
      )
    }
  }


  /**
   * Override-hookit.
   *
   * Aliluokat voivat toteuttaa nämä.
   */

  async onInitialize() {
    return null
  }


  async onStart() {
    return null
  }


  async onUpdate() {
    return null
  }


  async onStop() {
    return null
  }


  async onContext() {
    return null
  }


  async onHealth() {
    return null
  }


  async onSnapshot() {
    return null
  }


  async onReset() {
    return null
  }


  /**
   * Virheenkäsittely.
   */
  handleError(
    error,
    phase = "unknown"
  ) {
    const now =
      new Date().toISOString()

    const normalized =
      normalizeError(
        error
      )

    this.lastError = {
      ...normalized,

      phase,

      timestamp:
        now,
    }

    this.status =
      MODULE_STATUS.ERROR

    this.updatedAt =
      now

    this.metricsData
      .errors += 1

    this.recordHistory(
      "module-error",
      {
        phase,

        error:
          this.lastError,
      }
    )

    return {
      success: false,

      status:
        MODULE_STATUS.ERROR,

      moduleId:
        this.id,

      phase,

      error:
        cloneSafe(
          this.lastError
        ),
    }
  }


  /**
   * Historia-apuri.
   */
  recordHistory(
    action,
    data = null
  ) {
    this.history.push({
      action:
        sanitizeString(action) ||
        "event",

      data:
        cloneSafe(data),

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


  /**
   * Päivittää updatedAt.
   */
  touch() {
    this.updatedAt =
      new Date().toISOString()
  }


  /**
   * Runtime uptime.
   */
  getUptimeMs() {
    if (!this.startedAt) {
      return 0
    }

    const started =
      new Date(
        this.startedAt
      ).getTime()

    if (
      Number.isNaN(started)
    ) {
      return 0
    }

    const end =
      this.status ===
        MODULE_STATUS.STOPPED &&
      this.stoppedAt
        ? new Date(
            this.stoppedAt
          ).getTime()
        : Date.now()

    if (
      Number.isNaN(end)
    ) {
      return 0
    }

    return Math.max(
      0,
      end - started
    )
  }
}


/**
 * Turvallinen Error-normalisointi.
 */
function normalizeError(
  error
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
    }
  }

  if (
    typeof error === "string"
  ) {
    return {
      name:
        "Error",

      message:
        error,

      stack:
        null,
    }
  }

  try {
    return {
      name:
        "Error",

      message:
        JSON.stringify(
          error
        ),

      stack:
        null,
    }
  } catch {
    return {
      name:
        "Error",

      message:
        "Unknown error",

      stack:
        null,
    }
  }
}


/**
 * String helper.
 */
function sanitizeString(
  value
) {
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


/**
 * String-list helper.
 */
function normalizeStringArray(
  values
) {
  const array =
    Array.isArray(values)
      ? values
      : [values]

  return [
    ...new Set(
      array
        .map(
          sanitizeString
        )
        .filter(Boolean)
    ),
  ]
}


/**
 * Positiivinen integer.
 */
function normalizePositiveInteger(
  value,
  fallback
) {
  const number =
    Number(value)

  if (
    !Number.isFinite(number)
  ) {
    return fallback
  }

  return Math.max(
    1,
    Math.floor(number)
  )
}


/**
 * Clone ilman funktion tai viittauksen vuotamista.
 */
function cloneSafe(
  value
) {
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
  MODULE_STATUS,
  BaseModule,
}


export default BaseModule
