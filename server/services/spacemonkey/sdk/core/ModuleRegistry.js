/**
 * Wood-Booster HQ
 * Boosterverse SDK
 *
 * ModuleRegistry
 *
 * Boosterverse-moduulien keskitetty rekisteri.
 *
 * Tarkoitus:
 * - rekisteröidä moduulit
 * - estää duplicate module id:t
 * - hakea moduuleita id:n perusteella
 * - listata moduulit
 * - tarkistaa riippuvuudet
 * - ratkaista turvallinen boot order
 * - käynnistää/pysäyttää moduulit järjestyksessä
 * - tarjota Runtime-kerrokselle yksi module API
 *
 * ModuleRegistry EI:
 * - sisällä liiketoimintalogiikkaa
 * - kutsu LLM:ää
 * - käytä Tool Busia
 * - muuta käyttäjän dataa
 */

const REGISTRY_STATUS = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  STARTING: "starting",
  RUNNING: "running",
  STOPPING: "stopping",
  STOPPED: "stopped",
  ERROR: "error",
})

const MAX_HISTORY = 300


class ModuleRegistry {
  constructor({
    runtime = null,
    logger = null,
  } = {}) {
    this.runtime =
      runtime

    this.logger =
      logger

    this.status =
      REGISTRY_STATUS.IDLE

    this.modules =
      new Map()

    this.bootOrder =
      []

    this.history =
      []

    this.lastError =
      null

    this.createdAt =
      new Date().toISOString()

    this.updatedAt =
      this.createdAt

    this.metricsData = {
      registered: 0,
      unregistered: 0,
      initializeCalls: 0,
      startCalls: 0,
      stopCalls: 0,
      dependencyChecks: 0,
      dependencyFailures: 0,
      errors: 0,
    }

    this.recordHistory(
      "registry-created"
    )
  }


  /**
   * Runtime voidaan liittää
   * rekisterin luomisen jälkeen.
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

    for (
      const module
      of this.modules.values()
    ) {
      if (
        typeof module.attachRuntime ===
        "function"
      ) {
        module.attachRuntime(
          runtime
        )
      }
    }

    this.touch()

    this.recordHistory(
      "runtime-attached",
      {
        modules:
          this.modules.size,
      }
    )

    return this
  }


  /**
   * Rekisteröi yhden moduulin.
   */
  register(module) {
    if (
      !module ||
      typeof module !== "object"
    ) {
      return this.fail(
        "register",
        "Module must be an object"
      )
    }

    const moduleId =
      sanitizeString(
        module.id
      )

    if (!moduleId) {
      return this.fail(
        "register",
        "Module id is required"
      )
    }

    if (
      this.modules.has(
        moduleId
      )
    ) {
      return {
        success: false,
        status:
          "duplicate",
        error:
          `Module already registered: ${moduleId}`,
      }
    }

    if (
      typeof module.initialize !==
      "function"
    ) {
      return this.fail(
        "register",
        `Module has no initialize() method: ${moduleId}`
      )
    }

    if (
      this.runtime &&
      typeof module.attachRuntime ===
        "function"
    ) {
      module.attachRuntime(
        this.runtime
      )
    }

    this.modules.set(
      moduleId,
      module
    )

    this.metricsData
      .registered += 1

    this.bootOrder = []

    this.touch()

    this.recordHistory(
      "module-registered",
      {
        moduleId,

        dependencies:
          getModuleDependencies(
            module
          ),
      }
    )

    this.log(
      "info",
      `Module registered: ${moduleId}`
    )

    return {
      success: true,
      moduleId,
      total:
        this.modules.size,
    }
  }


  /**
   * Rekisteröi monta moduulia.
   */
  registerMany(modules = []) {
    if (
      !Array.isArray(modules)
    ) {
      return {
        success: false,
        error:
          "Modules must be an array",
        results: [],
      }
    }

    const results = []

    for (
      const module
      of modules
    ) {
      const result =
        this.register(module)

      results.push(
        result
      )

      if (!result.success) {
        return {
          success: false,
          error:
            result.error,
          results,
        }
      }
    }

    return {
      success: true,
      registered:
        results.length,
      results,
    }
  }


  /**
   * Poistaa moduulin rekisteristä.
   */
  unregister(moduleId) {
    const id =
      sanitizeString(
        moduleId
      )

    if (!id) {
      return {
        success: false,
        error:
          "Module id is required",
      }
    }

    const module =
      this.modules.get(id)

    if (!module) {
      return {
        success: false,
        error:
          `Module not found: ${id}`,
      }
    }

    this.modules.delete(id)

    this.metricsData
      .unregistered += 1

    this.bootOrder = []

    this.touch()

    this.recordHistory(
      "module-unregistered",
      {
        moduleId: id,
      }
    )

    return {
      success: true,
      moduleId: id,
      total:
        this.modules.size,
    }
  }


  /**
   * Hakee moduulin.
   */
  get(moduleId) {
    return (
      this.modules.get(
        sanitizeString(
          moduleId
        )
      ) ||
      null
    )
  }


  /**
   * Onko moduuli rekisterissä.
   */
  has(moduleId) {
    return this.modules.has(
      sanitizeString(
        moduleId
      )
    )
  }


  /**
   * Listaa moduulit kevyenä metadatana.
   */
  list() {
    return [
      ...this.modules.values(),
    ].map(
      (module) =>
        serializeModule(
          module
        )
    )
  }


  /**
   * Palauttaa varsinaiset moduuli-instanssit.
   *
   * Tätä käytetään Runtime-kerroksessa.
   */
  values() {
    return [
      ...this.modules.values(),
    ]
  }


  /**
   * Moduulien määrä.
   */
  size() {
    return this.modules.size
  }


  /**
   * Tarkistaa yhden moduulin riippuvuudet.
   */
  checkDependencies(
    moduleId
  ) {
    this.metricsData
      .dependencyChecks += 1

    const module =
      this.get(
        moduleId
      )

    if (!module) {
      this.metricsData
        .dependencyFailures += 1

      return {
        success: false,
        moduleId:
          sanitizeString(
            moduleId
          ),
        missing: [],
        error:
          "Module not found",
      }
    }

    const dependencies =
      getModuleDependencies(
        module
      )

    const missing =
      dependencies.filter(
        (dependencyId) =>
          !this.modules.has(
            dependencyId
          )
      )

    if (
      missing.length > 0
    ) {
      this.metricsData
        .dependencyFailures += 1
    }

    return {
      success:
        missing.length === 0,

      moduleId:
        module.id,

      dependencies,

      missing,
    }
  }


  /**
   * Tarkistaa kaikkien moduulien riippuvuudet.
   */
  validateDependencies() {
    const results = []

    const missing =
      []

    for (
      const module
      of this.modules.values()
    ) {
      const result =
        this.checkDependencies(
          module.id
        )

      results.push(
        result
      )

      if (
        !result.success
      ) {
        missing.push({
          moduleId:
            module.id,

          dependencies:
            result.missing,
        })
      }
    }

    return {
      success:
        missing.length === 0,

      modulesChecked:
        results.length,

      missing,

      results,
    }
  }


  /**
   * Laskee dependency-safe boot orderin.
   *
   * Topological sort.
   */
  resolveBootOrder() {
    const dependencyCheck =
      this.validateDependencies()

    if (
      !dependencyCheck.success
    ) {
      return {
        success: false,

        error:
          "Missing module dependencies",

        missing:
          dependencyCheck.missing,

        order: [],
      }
    }

    const temporary =
      new Set()

    const permanent =
      new Set()

    const order =
      []

    const visit = (
      moduleId,
      path = []
    ) => {
      if (
        permanent.has(
          moduleId
        )
      ) {
        return
      }

      if (
        temporary.has(
          moduleId
        )
      ) {
        const cycle =
          [
            ...path,
            moduleId,
          ]

        throw new Error(
          `Circular module dependency: ${cycle.join(
            " -> "
          )}`
        )
      }

      temporary.add(
        moduleId
      )

      const module =
        this.modules.get(
          moduleId
        )

      const dependencies =
        getModuleDependencies(
          module
        )

      for (
        const dependencyId
        of dependencies
      ) {
        visit(
          dependencyId,
          [
            ...path,
            moduleId,
          ]
        )
      }

      temporary.delete(
        moduleId
      )

      permanent.add(
        moduleId
      )

      order.push(
        moduleId
      )
    }

    try {
      for (
        const moduleId
        of this.modules.keys()
      ) {
        visit(
          moduleId
        )
      }
    } catch (error) {
      return this.fail(
        "resolveBootOrder",
        error
      )
    }

    this.bootOrder =
      order

    this.touch()

    this.recordHistory(
      "boot-order-resolved",
      {
        order:
          [...order],
      }
    )

    return {
      success: true,
      order:
        [...order],
    }
  }


  /**
   * Palauttaa nykyisen boot orderin.
   */
  getBootOrder() {
    if (
      this.bootOrder.length === 0 &&
      this.modules.size > 0
    ) {
      const result =
        this.resolveBootOrder()

      if (
        !result.success
      ) {
        return []
      }
    }

    return [
      ...this.bootOrder,
    ]
  }


  /**
   * Alustaa kaikki moduulit
   * dependency-safe järjestyksessä.
   */
  async initializeAll() {
    this.metricsData
      .initializeCalls += 1

    this.status =
      REGISTRY_STATUS.INITIALIZING

    this.touch()

    const orderResult =
      this.resolveBootOrder()

    if (
      !orderResult.success
    ) {
      this.status =
        REGISTRY_STATUS.ERROR

      return orderResult
    }

    const results =
      []

    for (
      const moduleId
      of orderResult.order
    ) {
      const module =
        this.modules.get(
          moduleId
        )

      try {
        const result =
          await module.initialize(
            this.runtime
          )

        results.push({
          moduleId,
          result,
        })

        if (
          result &&
          result.success ===
            false
        ) {
          this.status =
            REGISTRY_STATUS.ERROR

          return {
            success: false,

            error:
              `Module initialization failed: ${moduleId}`,

            failedModule:
              moduleId,

            results,
          }
        }
      } catch (error) {
        this.status =
          REGISTRY_STATUS.ERROR

        this.metricsData
          .errors += 1

        this.lastError =
          normalizeError(
            error,
            "initializeAll"
          )

        return {
          success: false,

          failedModule:
            moduleId,

          error:
            this.lastError,

          results,
        }
      }
    }

    this.status =
      REGISTRY_STATUS.READY

    this.lastError =
      null

    this.touch()

    this.recordHistory(
      "all-modules-initialized",
      {
        modules:
          results.length,
      }
    )

    return {
      success: true,

      status:
        REGISTRY_STATUS.READY,

      order:
        orderResult.order,

      results,
    }
  }


  /**
   * Käynnistää kaikki moduulit.
   */
  async startAll() {
    this.metricsData
      .startCalls += 1

    if (
      this.status ===
      REGISTRY_STATUS.RUNNING
    ) {
      return {
        success: true,
        status:
          "already-running",
      }
    }

    if (
      this.status ===
        REGISTRY_STATUS.IDLE ||
      this.status ===
        REGISTRY_STATUS.STOPPED
    ) {
      const initialized =
        await this.initializeAll()

      if (
        !initialized.success
      ) {
        return initialized
      }
    }

    this.status =
      REGISTRY_STATUS.STARTING

    this.touch()

    const order =
      this.getBootOrder()

    const results =
      []

    for (
      const moduleId
      of order
    ) {
      const module =
        this.modules.get(
          moduleId
        )

      if (
        typeof module.start !==
        "function"
      ) {
        results.push({
          moduleId,
          skipped: true,
          reason:
            "no-start-handler",
        })

        continue
      }

      try {
        const result =
          await module.start()

        results.push({
          moduleId,
          result,
        })

        if (
          result &&
          result.success ===
            false &&
          !result.skipped
        ) {
          this.status =
            REGISTRY_STATUS.ERROR

          return {
            success: false,

            failedModule:
              moduleId,

            error:
              `Module start failed: ${moduleId}`,

            results,
          }
        }
      } catch (error) {
        return this.fail(
          "startAll",
          error,
          {
            failedModule:
              moduleId,

            results,
          }
        )
      }
    }

    this.status =
      REGISTRY_STATUS.RUNNING

    this.touch()

    this.recordHistory(
      "all-modules-started",
      {
        modules:
          results.length,
      }
    )

    return {
      success: true,
      status:
        REGISTRY_STATUS.RUNNING,
      order,
      results,
    }
  }


  /**
   * Pysäyttää kaikki moduulit
   * käänteisessä boot orderissa.
   */
  async stopAll() {
    this.metricsData
      .stopCalls += 1

    this.status =
      REGISTRY_STATUS.STOPPING

    this.touch()

    const order =
      this.getBootOrder()
        .reverse()

    const results =
      []

    for (
      const moduleId
      of order
    ) {
      const module =
        this.modules.get(
          moduleId
        )

      if (
        typeof module.stop !==
        "function"
      ) {
        results.push({
          moduleId,
          skipped: true,
          reason:
            "no-stop-handler",
        })

        continue
      }

      try {
        const result =
          await module.stop()

        results.push({
          moduleId,
          result,
        })
      } catch (error) {
        this.metricsData
          .errors += 1

        results.push({
          moduleId,

          success: false,

          error:
            normalizeError(
              error,
              "stopAll"
            ),
        })
      }
    }

    this.status =
      REGISTRY_STATUS.STOPPED

    this.touch()

    this.recordHistory(
      "all-modules-stopped",
      {
        modules:
          results.length,
      }
    )

    return {
      success: true,
      status:
        REGISTRY_STATUS.STOPPED,
      results,
    }
  }


  /**
   * Suorittaa update()-kutsun
   * kaikille running-moduuleille.
   */
  async updateAll(
    context = null
  ) {
    const results =
      []

    for (
      const moduleId
      of this.getBootOrder()
    ) {
      const module =
        this.modules.get(
          moduleId
        )

      if (
        typeof module.update !==
        "function"
      ) {
        continue
      }

      try {
        const result =
          await module.update(
            context
          )

        results.push({
          moduleId,
          result,
        })
      } catch (error) {
        this.metricsData
          .errors += 1

        results.push({
          moduleId,

          success: false,

          error:
            normalizeError(
              error,
              "updateAll"
            ),
        })
      }
    }

    this.touch()

    return {
      success: true,
      results,
    }
  }


  /**
   * Kerää kaikkien moduulien healthin.
   */
  async health() {
    const modules =
      {}

    let healthyCount = 0
    let unhealthyCount = 0

    for (
      const [
        moduleId,
        module,
      ]
      of this.modules.entries()
    ) {
      try {
        const result =
          typeof module.health ===
          "function"
            ? await module.health()
            : {
                healthy: null,
                status:
                  "health-unavailable",
              }

        modules[
          moduleId
        ] = result

        if (
          result?.healthy ===
          true
        ) {
          healthyCount += 1
        }

        if (
          result?.healthy ===
          false
        ) {
          unhealthyCount += 1
        }
      } catch (error) {
        unhealthyCount += 1

        modules[
          moduleId
        ] = {
          healthy: false,

          status:
            "health-error",

          error:
            normalizeError(
              error,
              "health"
            ),
        }
      }
    }

    return {
      registry: {
        status:
          this.status,

        healthy:
          this.status !==
          REGISTRY_STATUS.ERROR,

        totalModules:
          this.modules.size,

        healthyModules:
          healthyCount,

        unhealthyModules:
          unhealthyCount,

        bootOrder:
          this.getBootOrder(),

        updatedAt:
          this.updatedAt,
      },

      modules,
    }
  }


  /**
   * Kerää contextit kaikilta moduuleilta.
   */
  async collectContexts() {
    const contexts =
      {}

    for (
      const [
        moduleId,
        module,
      ]
      of this.modules.entries()
    ) {
      if (
        typeof module.context !==
        "function"
      ) {
        continue
      }

      try {
        const context =
          await module.context()

        if (
          context !== null &&
          context !== undefined
        ) {
          contexts[
            moduleId
          ] =
            context
        }
      } catch (error) {
        contexts[
          moduleId
        ] = {
          error:
            normalizeError(
              error,
              "collectContexts"
            ),
        }
      }
    }

    return contexts
  }


  /**
   * Registry summary.
   */
  summary() {
    return {
      status:
        this.status,

      modules:
        this.modules.size,

      bootOrder:
        this.getBootOrder(),

      lastError:
        cloneSafe(
          this.lastError
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
   * Metrics.
   */
  metrics() {
    return cloneSafe({
      ...this.metricsData,

      modules:
        this.modules.size,

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
   * Registry reset.
   *
   * Moduuli-instanssit poistetaan.
   */
  async reset({
    stopModules = true,
  } = {}) {
    if (
      stopModules &&
      this.modules.size > 0
    ) {
      await this.stopAll()
    }

    this.modules.clear()

    this.bootOrder =
      []

    this.status =
      REGISTRY_STATUS.IDLE

    this.lastError =
      null

    this.history =
      []

    this.metricsData = {
      registered: 0,
      unregistered: 0,
      initializeCalls: 0,
      startCalls: 0,
      stopCalls: 0,
      dependencyChecks: 0,
      dependencyFailures: 0,
      errors: 0,
    }

    this.touch()

    this.recordHistory(
      "registry-reset"
    )

    return {
      success: true,
      status:
        REGISTRY_STATUS.IDLE,
    }
  }


  /**
   * Keskitetty error.
   */
  fail(
    phase,
    error,
    extra = null
  ) {
    this.status =
      REGISTRY_STATUS.ERROR

    this.metricsData
      .errors += 1

    this.lastError =
      normalizeError(
        error,
        phase
      )

    this.touch()

    this.recordHistory(
      "registry-error",
      {
        phase,

        error:
          this.lastError,
      }
    )

    this.log(
      "error",
      this.lastError.message
    )

    return {
      success: false,

      status:
        REGISTRY_STATUS.ERROR,

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


  /**
   * Logger adapter.
   */
  log(
    level,
    message,
    data = null
  ) {
    if (!this.logger) {
      return
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

        return
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
      }
    } catch {
      // Logging must never break runtime.
    }
  }


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
 * Hakee riippuvuudet sekä
 * BaseModule-instansseista että
 * tavallisista module-objekteista.
 */
function getModuleDependencies(
  module
) {
  const dependencies =
    module?.dependencies

  if (
    !Array.isArray(
      dependencies
    )
  ) {
    return []
  }

  return [
    ...new Set(
      dependencies
        .map(
          sanitizeString
        )
        .filter(Boolean)
    ),
  ]
}


/**
 * Turvallinen module metadata.
 */
function serializeModule(
  module
) {
  return {
    id:
      sanitizeString(
        module.id
      ),

    name:
      sanitizeString(
        module.name
      ),

    version:
      sanitizeString(
        module.version
      ),

    description:
      sanitizeString(
        module.description
      ),

    enabled:
      module.enabled !==
      false,

    status:
      module.status ??
      null,

    dependencies:
      getModuleDependencies(
        module
      ),

    updatedAt:
      module.updatedAt ??
      null,
  }
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
    return "Unknown error"
  }
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
      JSON.stringify(value)
    )
  } catch {
    return null
  }
}


export {
  REGISTRY_STATUS,
  ModuleRegistry,
}


export default ModuleRegistry
