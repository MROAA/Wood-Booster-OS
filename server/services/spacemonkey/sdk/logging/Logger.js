/**
 * Wood-Booster HQ
 * Boosterverse SDK
 *
 * Logger
 *
 * Yhteinen structured logging -ydin koko järjestelmälle.
 *
 * Tarkoitus:
 * - yhtenäinen logimuoto
 * - log level filtering
 * - structured metadata
 * - child loggerit
 * - request/session/runtime/module context
 * - performance timerit
 * - turvallinen console output
 * - muistissa pidettävä rajattu log history
 *
 * Tämä tiedosto EI:
 * - kirjoita vielä tiedostoon
 * - tee log rotationia
 * - lähetä verkkoon
 * - tallenna salaisuuksia tarkoituksella
 *
 * File/Audit/Transport-tuki rakennetaan erillisinä moduuleina.
 */

const LOGGER_VERSION = "1.0.0"

const LOG_LEVELS = Object.freeze({
  TRACE: "trace",
  DEBUG: "debug",
  INFO: "info",
  SUCCESS: "success",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
  AUDIT: "audit",
  SECURITY: "security",
})

const LEVEL_PRIORITY = Object.freeze({
  trace: 10,
  debug: 20,
  info: 30,
  success: 35,
  warn: 40,
  error: 50,
  fatal: 60,
  audit: 70,
  security: 80,
})

const MAX_HISTORY = 1000

class Logger {
  constructor({
    name = "wood-booster",
    level = LOG_LEVELS.INFO,
    enabled = true,
    consoleOutput = true,
    json = false,
    context = {},
    maxHistory = MAX_HISTORY,
  } = {}) {
    this.version = LOGGER_VERSION

    this.name =
      sanitizeString(name) ||
      "wood-booster"

    this.level =
      normalizeLevel(level)

    this.enabled =
      Boolean(enabled)

    this.consoleOutput =
      Boolean(consoleOutput)

    this.json =
      Boolean(json)

    this.context =
      sanitizeObject(context)

    this.maxHistory =
      normalizePositiveInteger(
        maxHistory,
        MAX_HISTORY
      )

    this.history = []

    this.timers =
      new Map()

    this.createdAt =
      new Date().toISOString()

    this.updatedAt =
      this.createdAt

    this.metricsData = {
      total: 0,
      trace: 0,
      debug: 0,
      info: 0,
      success: 0,
      warn: 0,
      error: 0,
      fatal: 0,
      audit: 0,
      security: 0,
      suppressed: 0,
      timersStarted: 0,
      timersCompleted: 0,
    }
  }

  setLevel(level) {
    this.level =
      normalizeLevel(level)

    this.touch()

    return this
  }

  enable() {
    this.enabled = true
    this.touch()
    return this
  }

  disable() {
    this.enabled = false
    this.touch()
    return this
  }

  setContext(context = {}) {
    this.context =
      sanitizeObject(context)

    this.touch()

    return this
  }

  mergeContext(context = {}) {
    this.context = {
      ...this.context,
      ...sanitizeObject(context),
    }

    this.touch()

    return this
  }

  child(
    context = {},
    {
      name = null,
    } = {}
  ) {
    return new Logger({
      name:
        sanitizeString(name) ||
        this.name,

      level:
        this.level,

      enabled:
        this.enabled,

      consoleOutput:
        this.consoleOutput,

      json:
        this.json,

      maxHistory:
        this.maxHistory,

      context: {
        ...this.context,
        ...sanitizeObject(context),
      },
    })
  }

  log(
    level,
    message,
    data = null,
    context = null
  ) {
    const normalizedLevel =
      normalizeLevel(level)

    if (!this.enabled) {
      this.metricsData.suppressed += 1

      return {
        success: false,
        suppressed: true,
        reason:
          "logger-disabled",
      }
    }

    if (
      !this.shouldLog(
        normalizedLevel
      )
    ) {
      this.metricsData.suppressed += 1

      return {
        success: false,
        suppressed: true,
        reason:
          "below-log-level",
      }
    }

    const entry =
      this.createEntry({
        level:
          normalizedLevel,

        message,

        data,

        context,
      })

    this.history.push(entry)

    this.trimHistory()

    this.metricsData.total += 1

    if (
      Object.prototype
        .hasOwnProperty.call(
          this.metricsData,
          normalizedLevel
        )
    ) {
      this.metricsData[
        normalizedLevel
      ] += 1
    }

    if (this.consoleOutput) {
      this.writeConsole(entry)
    }

    this.touch()

    return {
      success: true,
      entry:
        cloneSafe(entry),
    }
  }

  trace(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.TRACE,
      message,
      data,
      context
    )
  }

  debug(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.DEBUG,
      message,
      data,
      context
    )
  }

  info(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.INFO,
      message,
      data,
      context
    )
  }

  success(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.SUCCESS,
      message,
      data,
      context
    )
  }

  warn(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.WARN,
      message,
      data,
      context
    )
  }

  error(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.ERROR,
      message,
      data,
      context
    )
  }

  fatal(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.FATAL,
      message,
      data,
      context
    )
  }

  audit(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.AUDIT,
      message,
      data,
      context
    )
  }

  security(
    message,
    data = null,
    context = null
  ) {
    return this.log(
      LOG_LEVELS.SECURITY,
      message,
      data,
      context
    )
  }

  module(
    moduleId,
    message,
    data = null
  ) {
    return this.info(
      message,
      data,
      {
        moduleId:
          sanitizeString(
            moduleId
          ),
      }
    )
  }

  runtime(
    message,
    data = null
  ) {
    return this.info(
      message,
      data,
      {
        category:
          "runtime",
      }
    )
  }

  event(
    eventType,
    data = null
  ) {
    return this.debug(
      `Event: ${eventType}`,
      data,
      {
        category:
          "event",

        eventType:
          sanitizeString(
            eventType
          ),
      }
    )
  }

  workflow(
    message,
    data = null,
    context = null
  ) {
    return this.info(
      message,
      data,
      {
        category:
          "workflow",

        ...sanitizeObject(
          context
        ),
      }
    )
  }

  tool(
    message,
    data = null,
    context = null
  ) {
    return this.info(
      message,
      data,
      {
        category:
          "tool",

        ...sanitizeObject(
          context
        ),
      }
    )
  }

  ai(
    message,
    data = null,
    context = null
  ) {
    return this.debug(
      message,
      data,
      {
        category:
          "ai",

        ...sanitizeObject(
          context
        ),
      }
    )
  }

  memory(
    message,
    data = null,
    context = null
  ) {
    return this.debug(
      message,
      data,
      {
        category:
          "memory",

        ...sanitizeObject(
          context
        ),
      }
    )
  }

  api(
    message,
    data = null,
    context = null
  ) {
    return this.debug(
      message,
      data,
      {
        category:
          "api",

        ...sanitizeObject(
          context
        ),
      }
    )
  }

  database(
    message,
    data = null,
    context = null
  ) {
    return this.debug(
      message,
      data,
      {
        category:
          "database",

        ...sanitizeObject(
          context
        ),
      }
    )
  }

  system(
    message,
    data = null,
    context = null
  ) {
    return this.info(
      message,
      data,
      {
        category:
          "system",

        ...sanitizeObject(
          context
        ),
      }
    )
  }

  startTimer(
    label,
    context = null
  ) {
    const timerId =
      createId(
        "bv-timer"
      )

    const timer = {
      id:
        timerId,

      label:
        sanitizeString(label) ||
        "timer",

      context:
        sanitizeObject(
          context
        ),

      startedAt:
        Date.now(),
    }

    this.timers.set(
      timerId,
      timer
    )

    this.metricsData
      .timersStarted += 1

    return timerId
  }

  endTimer(
    timerId,
    data = null
  ) {
    const timer =
      this.timers.get(
        timerId
      )

    if (!timer) {
      return {
        success: false,
        error:
          "Timer not found",
      }
    }

    const durationMs =
      Math.max(
        0,
        Date.now() -
        timer.startedAt
      )

    this.timers.delete(
      timerId
    )

    this.metricsData
      .timersCompleted += 1

    this.debug(
      `${timer.label} completed`,
      {
        durationMs,
        ...sanitizeObject(
          data
        ),
      },
      {
        ...timer.context,
        category:
          "performance",
      }
    )

    return {
      success: true,
      timerId,
      label:
        timer.label,
      durationMs,
    }
  }

  async measure(
    label,
    fn,
    context = null
  ) {
    if (
      typeof fn !== "function"
    ) {
      throw new TypeError(
        "Logger.measure requires a function"
      )
    }

    const timerId =
      this.startTimer(
        label,
        context
      )

    try {
      const result =
        await fn()

      this.endTimer(
        timerId,
        {
          success: true,
        }
      )

      return result
    } catch (error) {
      const timer =
        this.timers.get(
          timerId
        )

      const durationMs =
        timer
          ? Math.max(
              0,
              Date.now() -
              timer.startedAt
            )
          : null

      this.timers.delete(
        timerId
      )

      this.error(
        `${label} failed`,
        {
          durationMs,
          error:
            normalizeError(
              error
            ),
        },
        {
          ...sanitizeObject(
            context
          ),

          category:
            "performance",
        }
      )

      throw error
    }
  }

  getHistory({
    level = null,
    category = null,
    moduleId = null,
    limit = 100,
  } = {}) {
    let items = [
      ...this.history,
    ]

    if (level) {
      const safeLevel =
        normalizeLevel(level)

      items =
        items.filter(
          (entry) =>
            entry.level ===
            safeLevel
        )
    }

    if (category) {
      items =
        items.filter(
          (entry) =>
            entry.context
              ?.category ===
            category
        )
    }

    if (moduleId) {
      items =
        items.filter(
          (entry) =>
            entry.context
              ?.moduleId ===
            moduleId
        )
    }

    return items
      .slice()
      .reverse()
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 100
        )
      )
      .map(cloneSafe)
  }

  search(
    query,
    {
      limit = 100,
    } = {}
  ) {
    const safeQuery =
      sanitizeString(query)
        ?.toLowerCase()

    if (!safeQuery) {
      return []
    }

    return this.history
      .filter(
        (entry) =>
          buildSearchText(
            entry
          ).includes(
            safeQuery
          )
      )
      .slice()
      .reverse()
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 100
        )
      )
      .map(cloneSafe)
  }

  export({
    limit = null,
  } = {}) {
    const entries =
      limit
        ? this.history.slice(
            -Math.max(
              1,
              Number(limit) ||
              this.history.length
            )
          )
        : this.history

    return cloneSafe({
      version:
        this.version,

      logger:
        this.name,

      exportedAt:
        new Date().toISOString(),

      entries,
    })
  }

  metrics() {
    return cloneSafe({
      ...this.metricsData,

      historyEntries:
        this.history.length,

      activeTimers:
        this.timers.size,
    })
  }

  health() {
    return {
      healthy: true,

      version:
        this.version,

      name:
        this.name,

      enabled:
        this.enabled,

      level:
        this.level,

      historyEntries:
        this.history.length,

      activeTimers:
        this.timers.size,

      metrics:
        this.metrics(),

      updatedAt:
        this.updatedAt,
    }
  }

  reset({
    clearHistory = true,
    clearTimers = true,
  } = {}) {
    if (clearHistory) {
      this.history = []
    }

    if (clearTimers) {
      this.timers.clear()
    }

    this.metricsData = {
      total: 0,
      trace: 0,
      debug: 0,
      info: 0,
      success: 0,
      warn: 0,
      error: 0,
      fatal: 0,
      audit: 0,
      security: 0,
      suppressed: 0,
      timersStarted: 0,
      timersCompleted: 0,
    }

    this.touch()

    return {
      success: true,
      status:
        "reset",
    }
  }

  shouldLog(level) {
    const current =
      LEVEL_PRIORITY[
        this.level
      ] ?? 30

    const target =
      LEVEL_PRIORITY[
        level
      ] ?? 30

    return target >= current
  }

  createEntry({
    level,
    message,
    data,
    context,
  }) {
    return {
      id:
        createId(
          "bv-log"
        ),

      timestamp:
        new Date().toISOString(),

      logger:
        this.name,

      level,

      message:
        sanitizeString(
          message
        ) || "",

      context: {
        ...this.context,
        ...sanitizeObject(
          context
        ),
      },

      data:
        sanitizeLogData(
          data
        ),
    }
  }

  writeConsole(entry) {
    try {
      if (this.json) {
        console.log(
          JSON.stringify(
            entry
          )
        )

        return
      }

      const prefix =
        [
          entry.timestamp,
          entry.level
            .toUpperCase(),
          entry.logger,
        ]
          .filter(Boolean)
          .join(" ")

      const contextText =
        formatContext(
          entry.context
        )

      const line =
        contextText
          ? `${prefix} ${contextText} ${entry.message}`
          : `${prefix} ${entry.message}`

      if (
        entry.level ===
          LOG_LEVELS.ERROR ||
        entry.level ===
          LOG_LEVELS.FATAL ||
        entry.level ===
          LOG_LEVELS.SECURITY
      ) {
        console.error(
          line,
          entry.data ??
          ""
        )

        return
      }

      if (
        entry.level ===
        LOG_LEVELS.WARN
      ) {
        console.warn(
          line,
          entry.data ??
          ""
        )

        return
      }

      console.log(
        line,
        entry.data ??
        ""
      )
    } catch {
      // Logging must never break runtime.
    }
  }

  trimHistory() {
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

function sanitizeLogData(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const cloned =
    cloneSafe(value)

  return redactSecrets(
    cloned
  )
}

function redactSecrets(
  value
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return value
  }

  const secretKeys =
    new Set([
      "password",
      "passwd",
      "secret",
      "token",
      "accesstoken",
      "refreshtoken",
      "apikey",
      "api_key",
      "authorization",
      "cookie",
      "sessiontoken",
      "privatekey",
    ])

  if (Array.isArray(value)) {
    return value.map(
      redactSecrets
    )
  }

  const result = {}

  for (
    const [
      key,
      item,
    ]
    of Object.entries(
      value
    )
  ) {
    const normalizedKey =
      key
        .replaceAll("-", "")
        .replaceAll("_", "")
        .toLowerCase()

    if (
      secretKeys.has(
        normalizedKey
      )
    ) {
      result[key] =
        "[REDACTED]"

      continue
    }

    result[key] =
      redactSecrets(
        item
      )
  }

  return result
}

function formatContext(
  context
) {
  if (
    !context ||
    typeof context !==
      "object"
  ) {
    return ""
  }

  const parts = []

  const keys = [
    "runtimeId",
    "sessionId",
    "requestId",
    "moduleId",
    "engineId",
    "category",
  ]

  for (
    const key
    of keys
  ) {
    if (context[key]) {
      parts.push(
        `${key}=${context[key]}`
      )
    }
  }

  if (
    parts.length === 0
  ) {
    return ""
  }

  return `[${parts.join(" ")}]`
}

function buildSearchText(
  entry
) {
  const parts = [
    entry.level,
    entry.logger,
    entry.message,
  ]

  try {
    parts.push(
      JSON.stringify(
        entry.context
      )
    )

    parts.push(
      JSON.stringify(
        entry.data
      )
    )
  } catch {
    // Ignore serialization problems.
  }

  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function normalizeLevel(
  value
) {
  const safe =
    sanitizeString(value)
      ?.toLowerCase()

  if (
    safe &&
    Object.prototype
      .hasOwnProperty.call(
        LEVEL_PRIORITY,
        safe
      )
  ) {
    return safe
  }

  return LOG_LEVELS.INFO
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

function sanitizeObject(
  value
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {}
  }

  return (
    cloneSafe(value) ||
    {}
  )
}

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
  LOGGER_VERSION,
  LOG_LEVELS,
  LEVEL_PRIORITY,
  Logger,
}

export default Logger
