/**
 * Wood-Booster HQ
 * Boosterverse SDK
 *
 * HistoryStore
 *
 * Yhteinen runtime-historiakerros Boosterverse-moduuleille.
 *
 * Tarkoitus:
 * - tallentaa tapahtuma- ja muutoshistoriaa
 * - pitää historia erillään live-StateStoresta
 * - tarjota haku, suodatus ja aikavälit
 * - tarjota Timeline-, Reflection- ja Experience-moduuleille yhteinen API
 *
 * HistoryStore EI:
 * - ole pysyvä tietokanta
 * - kirjoita automaattisesti levylle
 * - korvaa Prisma/SQLite-dataa
 */

const HISTORY_STORE_VERSION = "1.0.0"

const DEFAULT_MAX_ENTRIES = 2000
const DEFAULT_MAX_INTERNAL_HISTORY = 300


class HistoryStore {
  constructor({
    maxEntries = DEFAULT_MAX_ENTRIES,
    logger = null,
  } = {}) {
    this.version =
      HISTORY_STORE_VERSION

    this.maxEntries =
      normalizePositiveInteger(
        maxEntries,
        DEFAULT_MAX_ENTRIES
      )

    this.logger =
      logger

    this.entries = []

    this.internalHistory = []

    this.createdAt =
      new Date().toISOString()

    this.updatedAt =
      this.createdAt

    this.metricsData = {
      added: 0,
      reads: 0,
      searches: 0,
      removed: 0,
      trimmed: 0,
      resets: 0,
      errors: 0,
    }

    this.recordInternal(
      "history-store-created"
    )
  }


  /**
   * Logger.
   */
  setLogger(logger) {
    this.logger = logger

    this.touch()

    return this
  }


  /**
   * Lisää historian merkinnän.
   */
  add({
    id = null,
    type = "event",
    source = "system",

    entityType = null,
    entityId = null,

    projectId = null,
    customerId = null,
    taskId = null,
    workflowId = null,

    title = null,
    message = null,

    data = null,

    importance = 0.5,
    confidence = 1,

    tags = [],

    metadata = null,

    timestamp = null,
  } = {}) {
    try {
      const entry = {
        id:
          sanitizeString(id) ||
          createId(
            "bv-history"
          ),

        type:
          sanitizeString(type) ||
          "event",

        source:
          sanitizeString(source) ||
          "system",

        entity: {
          type:
            sanitizeString(
              entityType
            ),

          id:
            sanitizeString(
              entityId
            ),
        },

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

        title:
          sanitizeString(
            title
          ),

        message:
          sanitizeString(
            message
          ),

        data:
          cloneSafe(
            data
          ),

        importance:
          clampNumber(
            importance,
            0,
            1
          ),

        confidence:
          clampNumber(
            confidence,
            0,
            1
          ),

        tags:
          normalizeStrings(
            tags
          ),

        metadata:
          cloneSafe(
            metadata
          ),

        timestamp:
          normalizeTimestamp(
            timestamp
          ),
      }

      this.entries.push(
        entry
      )

      this.metricsData
        .added += 1

      this.trimEntries()

      this.touch()

      this.recordInternal(
        "history-entry-added",
        {
          entryId:
            entry.id,

          type:
            entry.type,

          source:
            entry.source,
        }
      )

      return {
        success: true,
        entry:
          cloneSafe(entry),
      }
    } catch (error) {
      return this.handleError(
        error,
        "add"
      )
    }
  }


  /**
   * Alias.
   */
  record(entry) {
    return this.add(
      entry
    )
  }


  /**
   * Hakee yhden merkinnän.
   */
  get(entryId) {
    this.metricsData
      .reads += 1

    const id =
      sanitizeString(
        entryId
      )

    if (!id) {
      return null
    }

    const entry =
      this.entries.find(
        (item) =>
          item.id === id
      )

    return entry
      ? cloneSafe(entry)
      : null
  }


  /**
   * Viimeisin merkintä.
   */
  latest({
    type = null,
    source = null,
  } = {}) {
    this.metricsData
      .reads += 1

    const items =
      this.filterEntries({
        type,
        source,
      })

    if (
      items.length === 0
    ) {
      return null
    }

    return cloneSafe(
      items[
        items.length - 1
      ]
    )
  }


  /**
   * Listaa historian.
   */
  list({
    type = null,
    source = null,

    entityType = null,
    entityId = null,

    projectId = null,
    customerId = null,
    taskId = null,
    workflowId = null,

    tag = null,

    minImportance = 0,

    from = null,
    to = null,

    limit = 100,

    newestFirst = true,
  } = {}) {
    this.metricsData
      .reads += 1

    let items =
      this.filterEntries({
        type,
        source,
        entityType,
        entityId,
        projectId,
        customerId,
        taskId,
        workflowId,
        tag,
        minImportance,
        from,
        to,
      })

    if (newestFirst) {
      items =
        items
          .slice()
          .reverse()
    }

    return items
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 100
        )
      )
      .map(cloneSafe)
  }


  /**
   * Tekstihaku historiasta.
   */
  search(
    query,
    {
      limit = 50,
      minImportance = 0,
    } = {}
  ) {
    this.metricsData
      .searches += 1

    const safeQuery =
      sanitizeString(
        query
      )
        ?.toLowerCase()

    if (!safeQuery) {
      return []
    }

    return this.entries
      .filter(
        (entry) => {
          if (
            entry.importance <
            clampNumber(
              minImportance,
              0,
              1
            )
          ) {
            return false
          }

          const text =
            buildSearchText(
              entry
            )

          return text.includes(
            safeQuery
          )
        }
      )
      .slice()
      .reverse()
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 50
        )
      )
      .map(cloneSafe)
  }


  /**
   * Palauttaa kaikki tapahtumat
   * tietylle projektille.
   */
  getProjectHistory(
    projectId,
    {
      limit = 200,
    } = {}
  ) {
    return this.list({
      projectId,
      limit,
    })
  }


  /**
   * Palauttaa tietyn workflown historian.
   */
  getWorkflowHistory(
    workflowId,
    {
      limit = 200,
    } = {}
  ) {
    return this.list({
      workflowId,
      limit,
    })
  }


  /**
   * Palauttaa aikavälin.
   */
  between(
    from,
    to,
    {
      limit = 500,
    } = {}
  ) {
    return this.list({
      from,
      to,
      limit,
      newestFirst: false,
    })
  }


  /**
   * Poistaa yhden entryn.
   */
  delete(entryId) {
    const id =
      sanitizeString(
        entryId
      )

    if (!id) {
      return {
        success: false,
        error:
          "History entry id is required",
      }
    }

    const previousLength =
      this.entries.length

    this.entries =
      this.entries.filter(
        (entry) =>
          entry.id !== id
      )

    const removed =
      this.entries.length <
      previousLength

    if (removed) {
      this.metricsData
        .removed += 1

      this.touch()

      this.recordInternal(
        "history-entry-deleted",
        {
          entryId:
            id,
        }
      )
    }

    return {
      success: true,
      removed,
      entryId:
        id,
    }
  }


  /**
   * Poistaa vanhat merkinnät.
   */
  pruneBefore(timestamp) {
    const cutoff =
      new Date(
        timestamp
      ).getTime()

    if (
      Number.isNaN(cutoff)
    ) {
      return {
        success: false,
        error:
          "Valid timestamp is required",
      }
    }

    const previousLength =
      this.entries.length

    this.entries =
      this.entries.filter(
        (entry) =>
          new Date(
            entry.timestamp
          ).getTime() >=
          cutoff
      )

    const removed =
      previousLength -
      this.entries.length

    this.metricsData
      .removed +=
      removed

    this.touch()

    this.recordInternal(
      "history-pruned",
      {
        removed,
        before:
          new Date(
            cutoff
          ).toISOString(),
      }
    )

    return {
      success: true,
      removed,
    }
  }


  /**
   * Historia entryjen määrä.
   */
  size() {
    return this.entries.length
  }


  /**
   * Kevyt snapshot.
   */
  snapshot({
    limit = 100,
  } = {}) {
    return {
      version:
        this.version,

      entries:
        this.list({
          limit,
          newestFirst:
            false,
        }),

      totalEntries:
        this.entries.length,

      timestamp:
        new Date().toISOString(),
    }
  }


  /**
   * Summary.
   */
  summary() {
    const types = {}
    const sources = {}

    for (
      const entry
      of this.entries
    ) {
      types[
        entry.type
      ] =
        (
          types[
            entry.type
          ] || 0
        ) + 1

      sources[
        entry.source
      ] =
        (
          sources[
            entry.source
          ] || 0
        ) + 1
    }

    return {
      version:
        this.version,

      entries:
        this.entries.length,

      maxEntries:
        this.maxEntries,

      types,

      sources,

      latestEntryId:
        this.entries[
          this.entries.length - 1
        ]?.id ?? null,

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

      entries:
        this.entries.length,

      maxEntries:
        this.maxEntries,

      errors:
        this.metricsData
          .errors,

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

      entries:
        this.entries.length,

      internalHistoryEntries:
        this.internalHistory
          .length,
    })
  }


  /**
   * Sisäinen store-historia.
   */
  getInternalHistory(
    limit = 50
  ) {
    return this.internalHistory
      .slice(
        -Math.max(
          1,
          Math.min(
            Number(limit) || 50,
            DEFAULT_MAX_INTERNAL_HISTORY
          )
        )
      )
      .reverse()
      .map(cloneSafe)
  }


  /**
   * Reset.
   */
  reset({
    clearEntries = true,
    clearInternalHistory = true,
  } = {}) {
    if (
      clearEntries
    ) {
      this.entries = []
    }

    if (
      clearInternalHistory
    ) {
      this.internalHistory =
        []
    }

    this.metricsData = {
      added: 0,
      reads: 0,
      searches: 0,
      removed: 0,
      trimmed: 0,
      resets:
        this.metricsData
          .resets + 1,
      errors: 0,
    }

    this.touch()

    this.recordInternal(
      "history-store-reset",
      {
        clearEntries,
        clearInternalHistory,
      }
    )

    return {
      success: true,
      status: "reset",
    }
  }


  /**
   * Sisäinen filter.
   */
  filterEntries({
    type = null,
    source = null,

    entityType = null,
    entityId = null,

    projectId = null,
    customerId = null,
    taskId = null,
    workflowId = null,

    tag = null,

    minImportance = 0,

    from = null,
    to = null,
  } = {}) {
    const fromTime =
      from
        ? new Date(
            from
          ).getTime()
        : null

    const toTime =
      to
        ? new Date(
            to
          ).getTime()
        : null

    return this.entries.filter(
      (entry) => {
        if (
          type &&
          entry.type !==
            type
        ) {
          return false
        }

        if (
          source &&
          entry.source !==
            source
        ) {
          return false
        }

        if (
          entityType &&
          entry.entity
            ?.type !==
            entityType
        ) {
          return false
        }

        if (
          entityId &&
          entry.entity
            ?.id !==
            entityId
        ) {
          return false
        }

        if (
          projectId &&
          entry.projectId !==
            projectId
        ) {
          return false
        }

        if (
          customerId &&
          entry.customerId !==
            customerId
        ) {
          return false
        }

        if (
          taskId &&
          entry.taskId !==
            taskId
        ) {
          return false
        }

        if (
          workflowId &&
          entry.workflowId !==
            workflowId
        ) {
          return false
        }

        if (
          tag &&
          !entry.tags.includes(
            tag
          )
        ) {
          return false
        }

        if (
          entry.importance <
          clampNumber(
            minImportance,
            0,
            1
          )
        ) {
          return false
        }

        const time =
          new Date(
            entry.timestamp
          ).getTime()

        if (
          fromTime !== null &&
          !Number.isNaN(
            fromTime
          ) &&
          time < fromTime
        ) {
          return false
        }

        if (
          toTime !== null &&
          !Number.isNaN(
            toTime
          ) &&
          time > toTime
        ) {
          return false
        }

        return true
      }
    )
  }


  /**
   * Trim.
   */
  trimEntries() {
    if (
      this.entries.length <=
      this.maxEntries
    ) {
      return
    }

    const removed =
      this.entries.length -
      this.maxEntries

    this.entries =
      this.entries.slice(
        -this.maxEntries
      )

    this.metricsData
      .trimmed +=
      removed
  }


  /**
   * Virhe.
   */
  handleError(
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

    this.recordInternal(
      "history-store-error",
      normalized
    )

    this.log(
      "error",
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


  /**
   * Logger.
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


  recordInternal(
    action,
    data = null
  ) {
    this.internalHistory.push({
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
      this.internalHistory
        .length >
      DEFAULT_MAX_INTERNAL_HISTORY
    ) {
      this.internalHistory =
        this.internalHistory.slice(
          -DEFAULT_MAX_INTERNAL_HISTORY
        )
    }
  }


  touch() {
    this.updatedAt =
      new Date().toISOString()
  }
}


function buildSearchText(
  entry
) {
  const parts = [
    entry.type,
    entry.source,
    entry.title,
    entry.message,
    entry.entity?.type,
    entry.entity?.id,
    entry.projectId,
    entry.customerId,
    entry.taskId,
    entry.workflowId,
    ...entry.tags,
  ]

  if (
    entry.data !== null &&
    entry.data !== undefined
  ) {
    try {
      parts.push(
        JSON.stringify(
          entry.data
        )
      )
    } catch {
      // Ignore unserializable data.
    }
  }

  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}


function normalizeTimestamp(
  value
) {
  if (!value) {
    return new Date()
      .toISOString()
  }

  const date =
    new Date(
      value
    )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return new Date()
      .toISOString()
  }

  return date.toISOString()
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


function normalizeStrings(
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


function clampNumber(
  value,
  min,
  max
) {
  const number =
    Number(value)

  if (
    !Number.isFinite(
      number
    )
  ) {
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
    return "Unknown history error"
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
  HISTORY_STORE_VERSION,
  HistoryStore,
}


export default HistoryStore
