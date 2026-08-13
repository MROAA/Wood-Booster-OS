/**
 * Wood-Booster HQ
 * Boosterverse SDK
 *
 * Runtime
 *
 * Boosterverse SDK:n varsinainen runtime-ydin.
 *
 * Tarkoitus:
 * - luoda yhteinen Logger
 * - luoda EventBus
 * - luoda StateStore
 * - luoda SnapshotStore
 * - luoda HistoryStore
 * - luoda RuntimeContext
 * - luoda ModuleRegistry
 * - hallita boot / start / tick / stop
 * - tarjota yksi yhtenäinen runtime-instanssi
 *
 * Runtime EI:
 * - sisällä liiketoimintalogiikkaa
 * - päätä käyttäjän puolesta
 * - kutsu LLM:ää itsenäisesti
 * - käytä Tool Busia suoraan
 */

import Logger from "../logging/Logger.js"
import EventBus from "../events/EventBus.js"
import StateStore from "../state/StateStore.js"
import SnapshotStore from "../state/SnapshotStore.js"
import HistoryStore from "../state/HistoryStore.js"

import RuntimeContext from "./RuntimeContext.js"
import ModuleRegistry from "./ModuleRegistry.js"


const RUNTIME_VERSION =
  "1.0.0"

const RUNTIME_STATUS =
  Object.freeze({
    CREATED: "created",
    INITIALIZING: "initializing",
    INITIALIZED: "initialized",
    STARTING: "starting",
    RUNNING: "running",
    STOPPING: "stopping",
    STOPPED: "stopped",
    ERROR: "error",
  })

const DEFAULT_TICK_INTERVAL_MS =
  1000

const MIN_TICK_INTERVAL_MS =
  250

const MAX_TICK_INTERVAL_MS =
  60000

const MAX_RUNTIME_HISTORY =
  500


class Runtime {
  constructor({
    id = null,

    name = "Boosterverse Runtime",

    tickIntervalMs =
      DEFAULT_TICK_INTERVAL_MS,

    autoSnapshot = true,

    logger = null,

    initialState = {},

    metadata = null,
  } = {}) {
    this.id =
      sanitizeString(id) ||
      createId(
        "bv-runtime"
      )

    this.name =
      sanitizeString(name) ||
      "Boosterverse Runtime"

    this.version =
      RUNTIME_VERSION

    this.status =
      RUNTIME_STATUS.CREATED

    this.tickIntervalMs =
      normalizeTickInterval(
        tickIntervalMs
      )

    this.autoSnapshot =
      Boolean(autoSnapshot)

    this.metadata =
      cloneSafe(metadata)

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

    this.lastTickAt =
      null

    this.lastError =
      null

    this.tickTimer =
      null

    this.tickRunning =
      false

    this.tickCount =
      0

    this.history =
      []

    this.metricsData = {
      initializes: 0,
      starts: 0,
      stops: 0,
      ticksRequested: 0,
      ticksCompleted: 0,
      ticksSkipped: 0,
      tickErrors: 0,
      snapshotsCreated: 0,
      eventsEmitted: 0,
      modulesRegistered: 0,
    }

    /**
     * Logger
     */
    this.logger =
      logger ||
      new Logger({
        name:
          "boosterverse-runtime",

        level:
          "info",

        context: {
          runtimeId:
            this.id,
        },
      })

    /**
     * Event Bus
     */
    this.events =
      new EventBus({
        logger:
          this.logger.child({
            category:
              "events",
          }),
      })

    /**
     * Shared State
     */
    this.state =
      new StateStore({
        initialState: {
          runtime: {
            id:
              this.id,

            name:
              this.name,

            version:
              this.version,

            status:
              this.status,
          },

          ...cloneSafe(
            initialState
          ),
        },

        logger:
          this.logger.child({
            category:
              "state",
          }),
      })

    /**
     * Snapshot Store
     */
    this.snapshots =
      new SnapshotStore({
        logger:
          this.logger.child({
            category:
              "snapshots",
          }),
      })

    /**
     * Runtime History
     */
    this.historyStore =
      new HistoryStore({
        logger:
          this.logger.child({
            category:
              "history",
          }),
      })

    /**
     * Shared RuntimeContext
     *
     * Registry lisätään hetken päästä.
     */
    this.context =
      new RuntimeContext({
        state:
          this.state,

        events:
          this.events,

        logger:
          this.logger,

        metadata: {
          runtimeId:
            this.id,
        },
      })

    /**
     * Module Registry
     */
    this.registry =
      new ModuleRegistry({
        runtime:
          this.context,

        logger:
          this.logger.child({
            category:
              "registry",
          }),
      })

    this.context
      .setRegistry(
        this.registry
      )

    /**
     * Runtime services.
     */
    this.context
      .registerServices({
        logger:
          this.logger,

        events:
          this.events,

        state:
          this.state,

        snapshots:
          this.snapshots,

        history:
          this.historyStore,

        registry:
          this.registry,
      })

    this.recordHistory(
      "runtime-created"
    )

    this.logger.runtime(
      "Boosterverse Runtime created",
      {
        runtimeId:
          this.id,

        version:
          this.version,

        tickIntervalMs:
          this.tickIntervalMs,
      }
    )
  }


  /**
   * Alustaa runtimen ja moduulit.
   */
  async initialize() {
    this.metricsData
      .initializes += 1

    if (
      this.status ===
        RUNTIME_STATUS.INITIALIZED ||
      this.status ===
        RUNTIME_STATUS.RUNNING
    ) {
      return {
        success: true,

        status:
          "already-initialized",

        runtimeId:
          this.id,
      }
    }

    this.status =
      RUNTIME_STATUS.INITIALIZING

    this.syncRuntimeState()

    this.recordHistory(
      "runtime-initialization-started"
    )

    try {
      const modules =
        await this.registry
          .initializeAll()

      if (
        !modules.success
      ) {
        return this.fail(
          "initialize",
          modules.error ||
          "Module initialization failed",
          {
            modules,
          }
        )
      }

      const now =
        new Date().toISOString()

      this.initializedAt =
        now

      this.updatedAt =
        now

      this.status =
        RUNTIME_STATUS.INITIALIZED

      this.lastError =
        null

      this.syncRuntimeState()

      await this.emitRuntimeEvent(
        "runtime.initialized",
        {
          runtimeId:
            this.id,

          modules:
            this.registry.size(),
        }
      )

      this.recordHistory(
        "runtime-initialized",
        {
          modules:
            this.registry.size(),
        }
      )

      this.logger.success(
        "Boosterverse Runtime initialized",
        {
          runtimeId:
            this.id,

          modules:
            this.registry.size(),
        }
      )

      return {
        success: true,

        status:
          RUNTIME_STATUS.INITIALIZED,

        runtimeId:
          this.id,

        modules,
      }
    } catch (error) {
      return this.fail(
        "initialize",
        error
      )
    }
  }


  /**
   * Käynnistää runtimen.
   */
  async start({
    runInitialTick = true,
  } = {}) {
    this.metricsData
      .starts += 1

    if (
      this.status ===
      RUNTIME_STATUS.RUNNING
    ) {
      return {
        success: true,

        status:
          "already-running",

        runtimeId:
          this.id,
      }
    }

    if (
      this.status ===
        RUNTIME_STATUS.CREATED ||
      this.status ===
        RUNTIME_STATUS.STOPPED
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
      RUNTIME_STATUS.STARTING

    this.syncRuntimeState()

    this.recordHistory(
      "runtime-starting"
    )

    try {
      const modules =
        await this.registry
          .startAll()

      if (
        !modules.success
      ) {
        return this.fail(
          "start",
          modules.error ||
          "Module start failed",
          {
            modules,
          }
        )
      }

      this.startedAt =
        this.startedAt ||
        new Date().toISOString()

      this.status =
        RUNTIME_STATUS.RUNNING

      this.lastError =
        null

      this.syncRuntimeState()

      if (
        runInitialTick
      ) {
        await this.tick()
      }

      this.startTickLoop()

      await this.emitRuntimeEvent(
        "runtime.started",
        {
          runtimeId:
            this.id,

          tickIntervalMs:
            this.tickIntervalMs,
        }
      )

      this.recordHistory(
        "runtime-started"
      )

      this.logger.success(
        "Boosterverse Runtime running",
        {
          runtimeId:
            this.id,

          tickIntervalMs:
            this.tickIntervalMs,
        }
      )

      this.touch()

      return {
        success: true,

        status:
          RUNTIME_STATUS.RUNNING,

        runtimeId:
          this.id,

        modules,
      }
    } catch (error) {
      return this.fail(
        "start",
        error
      )
    }
  }


  /**
   * Pysäyttää runtimen.
   */
  async stop() {
    this.metricsData
      .stops += 1

    if (
      this.status ===
      RUNTIME_STATUS.STOPPED
    ) {
      return {
        success: true,

        status:
          "already-stopped",

        runtimeId:
          this.id,
      }
    }

    this.status =
      RUNTIME_STATUS.STOPPING

    this.syncRuntimeState()

    this.stopTickLoop()

    this.recordHistory(
      "runtime-stopping"
    )

    try {
      const modules =
        await this.registry
          .stopAll()

      this.stoppedAt =
        new Date().toISOString()

      this.status =
        RUNTIME_STATUS.STOPPED

      this.syncRuntimeState()

      await this.emitRuntimeEvent(
        "runtime.stopped",
        {
          runtimeId:
            this.id,
        }
      )

      this.recordHistory(
        "runtime-stopped"
      )

      this.logger.info(
        "Boosterverse Runtime stopped",
        {
          runtimeId:
            this.id,
        }
      )

      this.touch()

      return {
        success: true,

        status:
          RUNTIME_STATUS.STOPPED,

        runtimeId:
          this.id,

        modules,
      }
    } catch (error) {
      return this.fail(
        "stop",
        error
      )
    }
  }


  /**
   * Rekisteröi yhden moduulin.
   */
  registerModule(
    module
  ) {
    const result =
      this.registry.register(
        module
      )

    if (
      result.success
    ) {
      this.metricsData
        .modulesRegistered += 1

      this.recordHistory(
        "runtime-module-registered",
        {
          moduleId:
            result.moduleId,
        }
      )
    }

    return result
  }


  /**
   * Rekisteröi monta moduulia.
   */
  registerModules(
    modules
  ) {
    const result =
      this.registry
        .registerMany(
          modules
        )

    if (
      result.success
    ) {
      this.metricsData
        .modulesRegistered +=
        result.registered
    }

    return result
  }


  /**
   * Yksi runtime tick.
   *
   * Tämä:
   * - päivittää moduulit
   * - tekee snapshotin
   * - tallentaa runtime-historyn
   *
   * Ei suorita mitään Tool Busin ohi.
   */
  async tick(
    externalContext = null
  ) {
    this.metricsData
      .ticksRequested += 1

    if (
      this.tickRunning
    ) {
      this.metricsData
        .ticksSkipped += 1

      return {
        success: false,

        skipped: true,

        reason:
          "tick-already-running",
      }
    }

    if (
      this.status !==
      RUNTIME_STATUS.RUNNING &&
      this.status !==
      RUNTIME_STATUS.INITIALIZED
    ) {
      this.metricsData
        .ticksSkipped += 1

      return {
        success: false,

        skipped: true,

        reason:
          `runtime-status-${this.status}`,
      }
    }

    this.tickRunning =
      true

    this.tickCount += 1

    const tickId =
      createId(
        "bv-tick"
      )

    const startedAt =
      Date.now()

    this.metricsData
      .ticksCompleted += 0

    try {
      this.state.set(
        "runtime.tick",
        {
          id:
            tickId,

          count:
            this.tickCount,

          startedAt:
            new Date(
              startedAt
            ).toISOString(),
        },
        {
          source:
            "runtime",
        }
      )

      const runtimeTickContext = {
        runtimeId:
          this.id,

        tickId,

        tick:
          this.tickCount,

        timestamp:
          new Date().toISOString(),

        external:
          cloneSafe(
            externalContext
          ),
      }

      const modules =
        await this.registry
          .updateAll(
            runtimeTickContext
          )

      let snapshotResult =
        null

      if (
        this.autoSnapshot
      ) {
        snapshotResult =
          await this.createSnapshot({
            type:
              "runtime-tick",

            metadata: {
              tickId,
              tick:
                this.tickCount,
            },
          })
      }

      const durationMs =
        Math.max(
          0,
          Date.now() -
          startedAt
        )

      this.lastTickAt =
        new Date().toISOString()

      this.metricsData
        .ticksCompleted += 1

      this.state.set(
        "runtime.lastTick",
        {
          id:
            tickId,

          count:
            this.tickCount,

          durationMs,

          completedAt:
            this.lastTickAt,
        },
        {
          source:
            "runtime",
        }
      )

      this.historyStore.add({
        type:
          "runtime.tick",

        source:
          "runtime",

        title:
          `Runtime tick ${this.tickCount}`,

        importance:
          0.2,

        data: {
          tickId,
          durationMs,
        },
      })

      await this.emitRuntimeEvent(
        "runtime.tick",
        {
          tickId,

          tick:
            this.tickCount,

          durationMs,
        }
      )

      this.recordHistory(
        "runtime-tick",
        {
          tickId,

          tick:
            this.tickCount,

          durationMs,
        }
      )

      this.touch()

      return {
        success: true,

        tickId,

        tick:
          this.tickCount,

        durationMs,

        modules,

        snapshot:
          snapshotResult,
      }
    } catch (error) {
      this.metricsData
        .tickErrors += 1

      return this.fail(
        "tick",
        error,
        {
          tickId,
        }
      )
    } finally {
      this.tickRunning =
        false
    }
  }


  /**
   * Luo runtime snapshotin.
   */
  async createSnapshot({
    type = "runtime",
    metadata = null,
  } = {}) {
    try {
      const moduleContexts =
        await this.registry
          .collectContexts()

      const moduleHealth =
        await this.registry
          .health()

      const data = {
        runtime: {
          id:
            this.id,

          name:
            this.name,

          version:
            this.version,

          status:
            this.status,

          tick:
            this.tickCount,

          lastTickAt:
            this.lastTickAt,
        },

        state:
          this.state.get(),

        modules:
          moduleContexts,

        health:
          moduleHealth,
      }

      const result =
        this.snapshots.create(
          data,
          {
            type,

            source:
              "runtime",

            metadata,
          }
        )

      if (
        result.success
      ) {
        this.metricsData
          .snapshotsCreated += 1
      }

      return result
    } catch (error) {
      return this.fail(
        "createSnapshot",
        error
      )
    }
  }


  /**
   * Vertaa kahta viimeistä runtime-snapshotia.
   */
  compareLatestSnapshots({
    type = null,
  } = {}) {
    return this.snapshots
      .compareLatest({
        type,
      })
  }


  /**
   * Käynnistää interval-loopin.
   */
  startTickLoop() {
    if (
      this.tickTimer
    ) {
      return
    }

    this.tickTimer =
      setInterval(
        async () => {
          try {
            await this.tick()
          } catch (error) {
            this.metricsData
              .tickErrors += 1

            this.logger.error(
              "Runtime tick loop error",
              {
                error:
                  normalizeError(
                    error
                  ),
              }
            )
          }
        },
        this.tickIntervalMs
      )
  }


  /**
   * Pysäyttää interval-loopin.
   */
  stopTickLoop() {
    if (
      !this.tickTimer
    ) {
      return
    }

    clearInterval(
      this.tickTimer
    )

    this.tickTimer =
      null
  }


  /**
   * Muuttaa tick intervalin.
   */
  setTickInterval(
    intervalMs
  ) {
    const next =
      normalizeTickInterval(
        intervalMs
      )

    const wasRunning =
      Boolean(
        this.tickTimer
      )

    if (
      wasRunning
    ) {
      this.stopTickLoop()
    }

    this.tickIntervalMs =
      next

    if (
      wasRunning &&
      this.status ===
        RUNTIME_STATUS.RUNNING
    ) {
      this.startTickLoop()
    }

    this.state.set(
      "runtime.tickIntervalMs",
      next,
      {
        source:
          "runtime",
      }
    )

    this.touch()

    return {
      success: true,

      tickIntervalMs:
        next,
    }
  }


  /**
   * Runtime state helper.
   */
  readState(
    path,
    fallback = null
  ) {
    return this.state.get(
      path,
      fallback
    )
  }


  writeState(
    path,
    value,
    options = {}
  ) {
    return this.state.set(
      path,
      value,
      options
    )
  }


  /**
   * Runtime service helper.
   */
  getService(id) {
    return this.context
      .getService(
        id
      )
  }


  registerService(
    id,
    service
  ) {
    return this.context
      .registerService(
        id,
        service
      )
  }


  /**
   * Runtime event helper.
   */
  async emit(
    eventType,
    payload = null,
    metadata = null
  ) {
    const result =
      await this.events.emit(
        eventType,
        payload,
        {
          runtimeId:
            this.id,

          ...(
            metadata &&
            typeof metadata ===
              "object"
              ? metadata
              : {}
          ),
        }
      )

    if (
      result.success
    ) {
      this.metricsData
        .eventsEmitted += 1
    }

    return result
  }


  /**
   * Runtime health.
   */
  async health() {
    const registryHealth =
      await this.registry
        .health()

    const stateHealth =
      this.state.health()

    const eventHealth =
      this.events.health()

    const snapshotHealth =
      this.snapshots.health()

    const historyHealth =
      this.historyStore
        .health()

    const loggerHealth =
      this.logger.health()

    const unhealthyModules =
      Object.entries(
        registryHealth.modules ||
        {}
      )
        .filter(
          ([, health]) =>
            health?.healthy ===
            false
        )
        .map(
          ([id]) => id
        )

    const healthy =
      this.status !==
        RUNTIME_STATUS.ERROR &&
      unhealthyModules.length ===
        0

    return {
      runtimeId:
        this.id,

      version:
        this.version,

      healthy,

      status:
        this.status,

      tick:
        this.tickCount,

      tickIntervalMs:
        this.tickIntervalMs,

      tickRunning:
        this.tickRunning,

      lastTickAt:
        this.lastTickAt,

      unhealthyModules,

      services: {
        registry:
          registryHealth.registry,

        state:
          stateHealth,

        events:
          eventHealth,

        snapshots:
          snapshotHealth,

        history:
          historyHealth,

        logger:
          loggerHealth,
      },

      metrics:
        this.metrics(),

      updatedAt:
        this.updatedAt,
    }
  }


  /**
   * Runtime summary.
   */
  summary() {
    return {
      id:
        this.id,

      name:
        this.name,

      version:
        this.version,

      status:
        this.status,

      modules:
        this.registry.size(),

      tick:
        this.tickCount,

      tickIntervalMs:
        this.tickIntervalMs,

      lastTickAt:
        this.lastTickAt,

      snapshots:
        this.snapshots.size(),

      historyEntries:
        this.historyStore.size(),

      runtimeServices:
        this.context
          .listServices(),

      lastError:
        cloneSafe(
          this.lastError
        ),

      metrics:
        this.metrics(),

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
    }
  }


  /**
   * Metrics.
   */
  metrics() {
    return cloneSafe({
      ...this.metricsData,

      modules:
        this.registry.size(),

      snapshots:
        this.snapshots.size(),

      historyEntries:
        this.historyStore.size(),

      runtimeHistoryEntries:
        this.history.length,

      activeTickTimer:
        Boolean(
          this.tickTimer
        ),

      tickRunning:
        this.tickRunning,
    })
  }


  /**
   * Runtime history.
   */
  getHistory(
    limit = 50
  ) {
    const safeLimit =
      Math.max(
        1,
        Math.min(
          Number(limit) || 50,
          MAX_RUNTIME_HISTORY
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
   * Täysi runtime context.
   */
  getRuntimeContext() {
    return this.context
  }


  /**
   * SDK service snapshot.
   */
  async snapshot() {
    return {
      runtime:
        this.summary(),

      state:
        this.state.snapshot(),

      registry:
        this.registry.summary(),

      events:
        this.events.summary(),

      snapshots:
        this.snapshots.summary(),

      history:
        this.historyStore.summary(),

      logger:
        this.logger.health(),

      context:
        this.context.snapshot(),

      timestamp:
        new Date().toISOString(),
    }
  }


  /**
   * Runtime reset.
   *
   * Tätä käytetään testeissä.
   */
  async reset({
    clearModules = false,
  } = {}) {
    this.stopTickLoop()

    if (
      this.status ===
      RUNTIME_STATUS.RUNNING
    ) {
      await this.registry
        .stopAll()
    }

    if (
      clearModules
    ) {
      await this.registry.reset({
        stopModules: false,
      })
    }

    this.state.reset({
      state: {
        runtime: {
          id:
            this.id,

          name:
            this.name,

          version:
            this.version,

          status:
            RUNTIME_STATUS.CREATED,
        },
      },

      clearWatchers:
        false,
    })

    this.snapshots.reset()

    this.historyStore.reset()

    this.events.reset({
      clearListeners:
        false,
    })

    this.tickCount = 0

    this.lastTickAt =
      null

    this.startedAt =
      null

    this.stoppedAt =
      null

    this.initializedAt =
      null

    this.lastError =
      null

    this.status =
      RUNTIME_STATUS.CREATED

    this.metricsData = {
      initializes: 0,
      starts: 0,
      stops: 0,
      ticksRequested: 0,
      ticksCompleted: 0,
      ticksSkipped: 0,
      tickErrors: 0,
      snapshotsCreated: 0,
      eventsEmitted: 0,
      modulesRegistered:
        clearModules
          ? 0
          : this.registry.size(),
    }

    this.history = []

    this.touch()

    this.recordHistory(
      "runtime-reset",
      {
        clearModules,
      }
    )

    return {
      success: true,

      status:
        RUNTIME_STATUS.CREATED,
    }
  }


  /**
   * Runtime state sync.
   */
  syncRuntimeState() {
    this.state.set(
      "runtime",
      {
        id:
          this.id,

        name:
          this.name,

        version:
          this.version,

        status:
          this.status,

        tick:
          this.tickCount,

        tickIntervalMs:
          this.tickIntervalMs,

        createdAt:
          this.createdAt,

        initializedAt:
          this.initializedAt,

        startedAt:
          this.startedAt,

        stoppedAt:
          this.stoppedAt,

        lastTickAt:
          this.lastTickAt,

        updatedAt:
          this.updatedAt,
      },
      {
        source:
          "runtime",
      }
    )
  }


  /**
   * Runtime event wrapper.
   */
  async emitRuntimeEvent(
    type,
    payload
  ) {
    return this.emit(
      type,
      payload,
      {
        source:
          "runtime",
      }
    )
  }


  /**
   * Virheenkäsittely.
   */
  fail(
    phase,
    error,
    extra = null
  ) {
    this.status =
      RUNTIME_STATUS.ERROR

    this.lastError =
      normalizeError(
        error,
        phase
      )

    this.syncRuntimeState()

    this.recordHistory(
      "runtime-error",
      {
        phase,

        error:
          this.lastError,
      }
    )

    this.historyStore.add({
      type:
        "runtime.error",

      source:
        "runtime",

      title:
        `Runtime error: ${phase}`,

      message:
        this.lastError
          .message,

      importance:
        1,

      confidence:
        1,

      data:
        this.lastError,
    })

    this.logger.error(
      `Runtime error during ${phase}`,
      this.lastError
    )

    this.touch()

    return {
      success: false,

      status:
        RUNTIME_STATUS.ERROR,

      runtimeId:
        this.id,

      phase,

      error:
        cloneSafe(
          this.lastError
        ),

      ...(
        extra &&
        typeof extra ===
          "object"
          ? extra
          : {}
      ),
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
      MAX_RUNTIME_HISTORY
    ) {
      this.history =
        this.history.slice(
          -MAX_RUNTIME_HISTORY
        )
    }
  }


  touch() {
    this.updatedAt =
      new Date().toISOString()
  }
}


function normalizeTickInterval(
  value
) {
  const number =
    Number(value)

  if (
    !Number.isFinite(
      number
    )
  ) {
    return DEFAULT_TICK_INTERVAL_MS
  }

  return Math.max(
    MIN_TICK_INTERVAL_MS,
    Math.min(
      MAX_TICK_INTERVAL_MS,
      Math.floor(number)
    )
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
    name:
      "Error",

    message:
      typeof error ===
      "string"
        ? error
        : safeStringify(
            error
          ),

    stack:
      null,

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
    return "Unknown runtime error"
  }
}


function createId(
  prefix
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


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
      JSON.stringify(
        value
      )
    )
  } catch {
    return null
  }
}


export {
  RUNTIME_VERSION,
  RUNTIME_STATUS,
  Runtime,
}


export default Runtime
