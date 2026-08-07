/**
 * Wood-Booster OS
 * Boosterverse SDK
 *
 * StateStore
 *
 * Boosterverse Runtimen yhteinen reaaliaikainen tila.
 *
 * Tarkoitus:
 * - ylläpitää yhteistä runtime-statea
 * - tarjota get / set / update / delete
 * - tukea nested path -osoitteita
 * - tarjota snapshotit
 * - tarjota muutosten historia
 * - mahdollistaa watch/subscription
 *
 * Esimerkkejä:
 *
 * runtime.state.set("current.project", project)
 * runtime.state.get("current.project")
 *
 * runtime.state.set("focus.primary", focus)
 * runtime.state.set("workflow.active", workflow)
 *
 * StateStore EI:
 * - ole pysyvä tietokanta
 * - kirjoita automaattisesti levylle
 * - korvaa Prisma/SQLite-dataa
 *
 * Tämä on transient runtime state.
 */

const STATE_STORE_VERSION =
  "1.0.0"

const MAX_HISTORY = 500
const MAX_WATCHERS = 500


class StateStore {
  constructor({
    initialState = {},
    logger = null,
    maxHistory = MAX_HISTORY,
  } = {}) {
    this.version =
      STATE_STORE_VERSION

    this.logger =
      logger

    this.maxHistory =
      normalizePositiveInteger(
        maxHistory,
        MAX_HISTORY
      )

    this.state =
      cloneSafe(
        initialState
      ) || {}

    this.watchers =
      new Map()

    this.history =
      []

    this.createdAt =
      new Date().toISOString()

    this.updatedAt =
      this.createdAt

    this.metricsData = {
      reads: 0,
      writes: 0,
      updates: 0,
      deletes: 0,
      watcherCalls: 0,
      watcherErrors: 0,
      snapshots: 0,
      resets: 0,
    }

    this.recordHistory(
      "state-store-created"
    )
  }


  /**
   * Logger.
   */
  setLogger(logger) {
    this.logger =
      logger

    this.touch()

    return this
  }


  /**
   * Lukee arvon pathista.
   *
   * Esimerkki:
   *
   * get("current.project")
   */
  get(
    path,
    fallback = null
  ) {
    this.metricsData
      .reads += 1

    if (
      path === null ||
      path === undefined ||
      path === ""
    ) {
      return cloneSafe(
        this.state
      )
    }

    const parts =
      normalizePath(path)

    if (
      parts.length === 0
    ) {
      return fallback
    }

    let current =
      this.state

    for (
      const part
      of parts
    ) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object" ||
        !Object.prototype
          .hasOwnProperty.call(
            current,
            part
          )
      ) {
        return fallback
      }

      current =
        current[part]
    }

    return cloneSafe(
      current
    )
  }


  /**
   * Alias.
   */
  read(
    path,
    fallback = null
  ) {
    return this.get(
      path,
      fallback
    )
  }


  /**
   * Kirjoittaa arvon pathiin.
   */
  set(
    path,
    value,
    {
      source = "system",
      metadata = null,
    } = {}
  ) {
    const parts =
      normalizePath(path)

    if (
      parts.length === 0
    ) {
      return {
        success: false,
        error:
          "Valid state path is required",
      }
    }

    const previous =
      this.get(
        parts,
        undefined
      )

    setNestedValue(
      this.state,
      parts,
      cloneSafe(value)
    )

    this.metricsData
      .writes += 1

    this.touch()

    const change = {
      type: "set",

      path:
        parts.join("."),

      previous,

      value:
        cloneSafe(value),

      source:
        sanitizeString(source),

      metadata:
        cloneSafe(metadata),

      timestamp:
        new Date().toISOString(),
    }

    this.recordHistory(
      "state-set",
      change
    )

    this.notifyWatchers(
      change
    )

    return {
      success: true,

      path:
        change.path,

      value:
        cloneSafe(value),
    }
  }


  /**
   * Alias.
   */
  write(
    path,
    value,
    options = {}
  ) {
    return this.set(
      path,
      value,
      options
    )
  }


  /**
   * Päivittää objektia shallow merge -mallilla.
   */
  update(
    path,
    patch,
    {
      source = "system",
      metadata = null,
    } = {}
  ) {
    if (
      !patch ||
      typeof patch !== "object" ||
      Array.isArray(patch)
    ) {
      return {
        success: false,
        error:
          "State update patch must be an object",
      }
    }

    const current =
      this.get(
        path,
        {}
      )

    if (
      current !== null &&
      typeof current !== "object"
    ) {
      return {
        success: false,
        error:
          "Existing state value is not an object",
      }
    }

    const next = {
      ...(current || {}),
      ...cloneSafe(patch),
    }

    const result =
      this.set(
        path,
        next,
        {
          source,
          metadata,
        }
      )

    if (
      result.success
    ) {
      this.metricsData
        .updates += 1
    }

    return result
  }


  /**
   * Poistaa arvon.
   */
  delete(
    path,
    {
      source = "system",
      metadata = null,
    } = {}
  ) {
    const parts =
      normalizePath(path)

    if (
      parts.length === 0
    ) {
      return {
        success: false,
        error:
          "Valid state path is required",
      }
    }

    const previous =
      this.get(
        parts,
        undefined
      )

    const removed =
      deleteNestedValue(
        this.state,
        parts
      )

    if (!removed) {
      return {
        success: true,
        removed: false,
        path:
          parts.join("."),
      }
    }

    this.metricsData
      .deletes += 1

    this.touch()

    const change = {
      type: "delete",

      path:
        parts.join("."),

      previous,

      value: null,

      source:
        sanitizeString(source),

      metadata:
        cloneSafe(metadata),

      timestamp:
        new Date().toISOString(),
    }

    this.recordHistory(
      "state-deleted",
      change
    )

    this.notifyWatchers(
      change
    )

    return {
      success: true,
      removed: true,
      path:
        change.path,
    }
  }


  /**
   * Onko path olemassa.
   */
  has(path) {
    const sentinel =
      Symbol("missing")

    return (
      this.get(
        path,
        sentinel
      ) !== sentinel
    )
  }


  /**
   * Watch.
   *
   * Esimerkiksi:
   *
   * watch("current.project", handler)
   *
   * Wildcard:
   *
   * watch("*", handler)
   */
  watch(
    path,
    handler,
    {
      id = null,
      once = false,
    } = {}
  ) {
    if (
      typeof handler !==
      "function"
    ) {
      return {
        success: false,
        error:
          "Watcher handler must be a function",
      }
    }

    if (
      this.watchers.size >=
      MAX_WATCHERS
    ) {
      return {
        success: false,
        error:
          "State watcher limit reached",
      }
    }

    const watchPath =
      path === "*"
        ? "*"
        : normalizePath(
            path
          ).join(".")

    if (!watchPath) {
      return {
        success: false,
        error:
          "Watcher path is required",
      }
    }

    const watcher = {
      id:
        sanitizeString(id) ||
        createId(
          "bv-state-watch"
        ),

      path:
        watchPath,

      handler,

      once:
        Boolean(once),

      calls: 0,

      failures: 0,

      createdAt:
        new Date().toISOString(),

      lastCallAt:
        null,

      lastError:
        null,
    }

    this.watchers.set(
      watcher.id,
      watcher
    )

    return {
      success: true,

      watcherId:
        watcher.id,

      path:
        watcher.path,
    }
  }


  /**
   * Watch poisto.
   */
  unwatch(watcherId) {
    const id =
      sanitizeString(
        watcherId
      )

    if (!id) {
      return {
        success: false,
        error:
          "Watcher id is required",
      }
    }

    const removed =
      this.watchers.delete(
        id
      )

    return {
      success: true,
      removed,
      watcherId:
        id,
    }
  }


  /**
   * Kaikki watcherit.
   */
  listWatchers() {
    return [
      ...this.watchers.values(),
    ].map(
      serializeWatcher
    )
  }


  /**
   * Snapshot koko statesta.
   */
  snapshot() {
    this.metricsData
      .snapshots += 1

    return {
      version:
        this.version,

      state:
        cloneSafe(
          this.state
        ),

      timestamp:
        new Date().toISOString(),
    }
  }


  /**
   * Korvaa koko state.
   */
  replace(
    nextState,
    {
      source = "system",
      metadata = null,
    } = {}
  ) {
    if (
      !nextState ||
      typeof nextState !==
        "object" ||
      Array.isArray(
        nextState
      )
    ) {
      return {
        success: false,
        error:
          "State replacement must be an object",
      }
    }

    const previous =
      cloneSafe(
        this.state
      )

    this.state =
      cloneSafe(
        nextState
      ) || {}

    this.metricsData
      .writes += 1

    this.touch()

    const change = {
      type:
        "replace",

      path:
        "*",

      previous,

      value:
        cloneSafe(
          this.state
        ),

      source:
        sanitizeString(source),

      metadata:
        cloneSafe(metadata),

      timestamp:
        new Date().toISOString(),
    }

    this.recordHistory(
      "state-replaced",
      change
    )

    this.notifyWatchers(
      change
    )

    return {
      success: true,
      state:
        cloneSafe(
          this.state
        ),
    }
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
   * Summary.
   */
  summary() {
    return {
      version:
        this.version,

      topLevelKeys:
        Object.keys(
          this.state
        ),

      watchers:
        this.watchers.size,

      historyEntries:
        this.history.length,

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

      watchers:
        this.watchers.size,

      watcherErrors:
        this.metricsData
          .watcherErrors,

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

      watchers:
        this.watchers.size,

      historyEntries:
        this.history.length,

      topLevelKeys:
        Object.keys(
          this.state
        ).length,
    })
  }


  /**
   * Reset.
   */
  reset({
    state = {},
    clearWatchers = false,
    clearHistory = true,
  } = {}) {
    this.state =
      cloneSafe(
        state
      ) || {}

    if (
      clearWatchers
    ) {
      this.watchers.clear()
    }

    if (
      clearHistory
    ) {
      this.history = []
    }

    this.metricsData = {
      reads: 0,
      writes: 0,
      updates: 0,
      deletes: 0,
      watcherCalls: 0,
      watcherErrors: 0,
      snapshots: 0,
      resets:
        this.metricsData
          .resets + 1,
    }

    this.touch()

    this.recordHistory(
      "state-store-reset",
      {
        clearWatchers,
        clearHistory,
      }
    )

    return {
      success: true,
      status: "reset",
    }
  }


  /**
   * Watcher delivery.
   */
  async notifyWatchers(
    change
  ) {
    const matching =
      [
        ...this.watchers
          .values(),
      ].filter(
        (watcher) =>
          watcher.path ===
            "*" ||
          watcherMatchesPath(
            watcher.path,
            change.path
          )
      )

    for (
      const watcher
      of matching
    ) {
      watcher.calls += 1

      watcher.lastCallAt =
        new Date().toISOString()

      try {
        await watcher.handler(
          cloneSafe(
            change
          )
        )

        watcher.lastError =
          null

        this.metricsData
          .watcherCalls += 1
      } catch (error) {
        watcher.failures += 1

        watcher.lastError =
          normalizeError(
            error,
            "state-watcher"
          )

        this.metricsData
          .watcherErrors += 1

        this.log(
          "error",
          `State watcher failed: ${watcher.id}`,
          watcher.lastError
        )
      }

      if (
        watcher.once
      ) {
        this.watchers.delete(
          watcher.id
        )
      }
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
 * Nested path helpers.
 */

function normalizePath(path) {
  if (
    Array.isArray(path)
  ) {
    return path
      .map(
        sanitizeString
      )
      .filter(Boolean)
  }

  const string =
    sanitizeString(path)

  if (!string) {
    return []
  }

  return string
    .split(".")
    .map(
      (part) =>
        part.trim()
    )
    .filter(Boolean)
}


function setNestedValue(
  object,
  parts,
  value
) {
  let current =
    object

  for (
    let index = 0;
    index <
      parts.length - 1;
    index += 1
  ) {
    const part =
      parts[index]

    if (
      !current[part] ||
      typeof current[part] !==
        "object" ||
      Array.isArray(
        current[part]
      )
    ) {
      current[part] = {}
    }

    current =
      current[part]
  }

  current[
    parts[
      parts.length - 1
    ]
  ] = value
}


function deleteNestedValue(
  object,
  parts
) {
  let current =
    object

  for (
    let index = 0;
    index <
      parts.length - 1;
    index += 1
  ) {
    const part =
      parts[index]

    if (
      !current ||
      typeof current !==
        "object" ||
      !Object.prototype
        .hasOwnProperty.call(
          current,
          part
        )
    ) {
      return false
    }

    current =
      current[part]
  }

  const last =
    parts[
      parts.length - 1
    ]

  if (
    !current ||
    typeof current !==
      "object" ||
    !Object.prototype
      .hasOwnProperty.call(
        current,
        last
      )
  ) {
    return false
  }

  delete current[last]

  return true
}


/**
 * Parent watcher reagoi myös child muutoksiin.
 *
 * watch("current.project")
 * reagoi:
 *
 * current.project
 * current.project.name
 */
function watcherMatchesPath(
  watcherPath,
  changedPath
) {
  if (
    watcherPath ===
    changedPath
  ) {
    return true
  }

  return changedPath.startsWith(
    `${watcherPath}.`
  )
}


function serializeWatcher(
  watcher
) {
  return {
    id:
      watcher.id,

    path:
      watcher.path,

    once:
      watcher.once,

    calls:
      watcher.calls,

    failures:
      watcher.failures,

    lastCallAt:
      watcher.lastCallAt,

    lastError:
      cloneSafe(
        watcher.lastError
      ),

    createdAt:
      watcher.createdAt,
  }
}


function normalizePositiveInteger(
  value,
  fallback
) {
  const number =
    Number(value)

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback
  }

  return Math.max(
    1,
    Math.floor(
      number
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
    return "Unknown state error"
  }
}


function createId(prefix) {
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
    return undefined
  }

  if (
    typeof value ===
    "symbol"
  ) {
    return value
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
  STATE_STORE_VERSION,
  StateStore,
}


export default StateStore
