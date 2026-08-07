/**
 * Wood-Booster OS
 * Boosterverse SDK
 *
 * SnapshotStore
 *
 * Runtime-tilannekuvien kevyt tallennuskerros.
 *
 * Tarkoitus:
 * - tallentaa runtime snapshotit
 * - hakea viimeisin snapshot
 * - vertailla kahta snapshotia
 * - rajata historian kokoa
 * - tarjota muille moduuleille change detection
 *
 * SnapshotStore EI:
 * - ole pysyvä tietokanta
 * - kirjoita automaattisesti levylle
 * - korvaa StateStorea
 */

const SNAPSHOT_STORE_VERSION = "1.0.0"

const DEFAULT_MAX_SNAPSHOTS = 100
const DEFAULT_MAX_HISTORY = 200


class SnapshotStore {
  constructor({
    maxSnapshots = DEFAULT_MAX_SNAPSHOTS,
    maxHistory = DEFAULT_MAX_HISTORY,
    logger = null,
  } = {}) {
    this.version =
      SNAPSHOT_STORE_VERSION

    this.maxSnapshots =
      normalizePositiveInteger(
        maxSnapshots,
        DEFAULT_MAX_SNAPSHOTS
      )

    this.maxHistory =
      normalizePositiveInteger(
        maxHistory,
        DEFAULT_MAX_HISTORY
      )

    this.logger =
      logger

    this.snapshots = []

    this.history = []

    this.createdAt =
      new Date().toISOString()

    this.updatedAt =
      this.createdAt

    this.metricsData = {
      created: 0,
      reads: 0,
      comparisons: 0,
      deleted: 0,
      resets: 0,
      errors: 0,
    }

    this.recordHistory(
      "snapshot-store-created"
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
   * Luo uuden snapshotin.
   */
  create(
    data,
    {
      id = null,
      type = "runtime",
      source = "system",
      metadata = null,
    } = {}
  ) {
    try {
      const now =
        new Date().toISOString()

      const snapshot = {
        id:
          sanitizeString(id) ||
          createId(
            "bv-snapshot"
          ),

        type:
          sanitizeString(type) ||
          "runtime",

        source:
          sanitizeString(source) ||
          "system",

        data:
          cloneSafe(data),

        metadata:
          cloneSafe(metadata),

        createdAt:
          now,
      }

      this.snapshots.push(
        snapshot
      )

      this.metricsData
        .created += 1

      this.trimSnapshots()

      this.touch()

      this.recordHistory(
        "snapshot-created",
        {
          snapshotId:
            snapshot.id,

          type:
            snapshot.type,

          source:
            snapshot.source,
        }
      )

      return {
        success: true,
        snapshot:
          cloneSafe(snapshot),
      }
    } catch (error) {
      return this.handleError(
        error,
        "create"
      )
    }
  }


  /**
   * Alias create().
   */
  save(
    data,
    options = {}
  ) {
    return this.create(
      data,
      options
    )
  }


  /**
   * Hakee snapshotin id:llä.
   */
  get(snapshotId) {
    this.metricsData
      .reads += 1

    const id =
      sanitizeString(
        snapshotId
      )

    if (!id) {
      return null
    }

    const snapshot =
      this.snapshots.find(
        (item) =>
          item.id === id
      )

    return snapshot
      ? cloneSafe(snapshot)
      : null
  }


  /**
   * Viimeisin snapshot.
   */
  latest({
    type = null,
  } = {}) {
    this.metricsData
      .reads += 1

    const source =
      type
        ? this.snapshots.filter(
            (snapshot) =>
              snapshot.type ===
              type
          )
        : this.snapshots

    if (
      source.length === 0
    ) {
      return null
    }

    return cloneSafe(
      source[
        source.length - 1
      ]
    )
  }


  /**
   * Edellinen snapshot.
   *
   * Hyödyllinen:
   *
   * latest()
   * previous()
   *
   * -> compare()
   */
  previous({
    type = null,
  } = {}) {
    this.metricsData
      .reads += 1

    const source =
      type
        ? this.snapshots.filter(
            (snapshot) =>
              snapshot.type ===
              type
          )
        : this.snapshots

    if (
      source.length < 2
    ) {
      return null
    }

    return cloneSafe(
      source[
        source.length - 2
      ]
    )
  }


  /**
   * Listaa snapshotit.
   */
  list({
    type = null,
    source = null,
    limit = 50,
  } = {}) {
    this.metricsData
      .reads += 1

    let items = [
      ...this.snapshots,
    ]

    if (type) {
      items =
        items.filter(
          (snapshot) =>
            snapshot.type ===
            type
        )
    }

    if (source) {
      items =
        items.filter(
          (snapshot) =>
            snapshot.source ===
            source
        )
    }

    return items
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
   * Snapshotien määrä.
   */
  size() {
    return this.snapshots.length
  }


  /**
   * Poistaa snapshotin.
   */
  delete(snapshotId) {
    const id =
      sanitizeString(
        snapshotId
      )

    if (!id) {
      return {
        success: false,
        error:
          "Snapshot id is required",
      }
    }

    const previousLength =
      this.snapshots.length

    this.snapshots =
      this.snapshots.filter(
        (snapshot) =>
          snapshot.id !== id
      )

    const removed =
      this.snapshots.length <
      previousLength

    if (removed) {
      this.metricsData
        .deleted += 1

      this.touch()

      this.recordHistory(
        "snapshot-deleted",
        {
          snapshotId:
            id,
        }
      )
    }

    return {
      success: true,
      removed,
      snapshotId:
        id,
    }
  }


  /**
   * Vertaa kahta snapshotia.
   *
   * Palauttaa muutokset path-muodossa.
   */
  compare(
    firstSnapshot,
    secondSnapshot
  ) {
    this.metricsData
      .comparisons += 1

    try {
      const first =
        resolveSnapshotData(
          firstSnapshot,
          this
        )

      const second =
        resolveSnapshotData(
          secondSnapshot,
          this
        )

      if (
        first === undefined ||
        second === undefined
      ) {
        return {
          success: false,
          error:
            "Both snapshots are required",
        }
      }

      const changes = []

      buildDiff(
        first,
        second,
        "",
        changes
      )

      const result = {
        changed:
          changes.length > 0,

        changeCount:
          changes.length,

        changes,

        comparedAt:
          new Date().toISOString(),
      }

      this.recordHistory(
        "snapshots-compared",
        {
          changeCount:
            changes.length,
        }
      )

      this.touch()

      return {
        success: true,
        result,
      }
    } catch (error) {
      return this.handleError(
        error,
        "compare"
      )
    }
  }


  /**
   * Vertaa viimeistä ja edellistä snapshotia.
   */
  compareLatest({
    type = null,
  } = {}) {
    const latest =
      this.latest({
        type,
      })

    const previous =
      this.previous({
        type,
      })

    if (
      !latest ||
      !previous
    ) {
      return {
        success: false,
        error:
          "At least two snapshots are required",
      }
    }

    const comparison =
      this.compare(
        previous,
        latest
      )

    if (
      !comparison.success
    ) {
      return comparison
    }

    return {
      success: true,

      previousSnapshotId:
        previous.id,

      latestSnapshotId:
        latest.id,

      ...comparison,
    }
  }


  /**
   * Hakee muutokset vain tietyn pathin alta.
   *
   * Esimerkiksi:
   *
   * current.project
   */
  comparePath(
    firstSnapshot,
    secondSnapshot,
    path
  ) {
    const parts =
      normalizePath(
        path
      )

    if (
      parts.length === 0
    ) {
      return {
        success: false,
        error:
          "Valid path is required",
      }
    }

    const first =
      resolveSnapshotData(
        firstSnapshot,
        this
      )

    const second =
      resolveSnapshotData(
        secondSnapshot,
        this
      )

    const firstValue =
      getNestedValue(
        first,
        parts
      )

    const secondValue =
      getNestedValue(
        second,
        parts
      )

    const changes = []

    buildDiff(
      firstValue,
      secondValue,
      parts.join("."),
      changes
    )

    return {
      success: true,

      path:
        parts.join("."),

      changed:
        changes.length > 0,

      changes,
    }
  }


  /**
   * Snapshot store summary.
   */
  summary() {
    const types = {}

    for (
      const snapshot
      of this.snapshots
    ) {
      types[
        snapshot.type
      ] =
        (
          types[
            snapshot.type
          ] || 0
        ) + 1
    }

    return {
      version:
        this.version,

      snapshots:
        this.snapshots.length,

      maxSnapshots:
        this.maxSnapshots,

      types,

      latestSnapshotId:
        this.snapshots[
          this.snapshots.length - 1
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

      snapshots:
        this.snapshots.length,

      maxSnapshots:
        this.maxSnapshots,

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

      snapshots:
        this.snapshots.length,

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
   * Reset.
   */
  reset({
    clearSnapshots = true,
    clearHistory = true,
  } = {}) {
    if (
      clearSnapshots
    ) {
      this.snapshots = []
    }

    if (
      clearHistory
    ) {
      this.history = []
    }

    this.metricsData = {
      created: 0,
      reads: 0,
      comparisons: 0,
      deleted: 0,
      resets:
        this.metricsData
          .resets + 1,
      errors: 0,
    }

    this.touch()

    this.recordHistory(
      "snapshot-store-reset",
      {
        clearSnapshots,
        clearHistory,
      }
    )

    return {
      success: true,
      status: "reset",
    }
  }


  /**
   * Snapshot trim.
   */
  trimSnapshots() {
    if (
      this.snapshots.length >
      this.maxSnapshots
    ) {
      this.snapshots =
        this.snapshots.slice(
          -this.maxSnapshots
        )
    }
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

    this.recordHistory(
      "snapshot-store-error",
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
 * Snapshot tai snapshot-id -> data.
 */
function resolveSnapshotData(
  value,
  store
) {
  if (
    typeof value ===
    "string"
  ) {
    const snapshot =
      store.get(
        value
      )

    return snapshot
      ?.data
  }

  if (
    value &&
    typeof value ===
      "object" &&
    Object.prototype
      .hasOwnProperty.call(
        value,
        "data"
      )
  ) {
    return cloneSafe(
      value.data
    )
  }

  return cloneSafe(
    value
  )
}


/**
 * Recursive diff.
 */
function buildDiff(
  first,
  second,
  path,
  changes
) {
  if (
    valuesEqual(
      first,
      second
    )
  ) {
    return
  }

  const firstIsObject =
    isPlainObject(
      first
    )

  const secondIsObject =
    isPlainObject(
      second
    )

  if (
    firstIsObject &&
    secondIsObject
  ) {
    const keys =
      new Set([
        ...Object.keys(
          first
        ),

        ...Object.keys(
          second
        ),
      ])

    for (
      const key
      of keys
    ) {
      const childPath =
        path
          ? `${path}.${key}`
          : key

      buildDiff(
        first[key],
        second[key],
        childPath,
        changes
      )
    }

    return
  }

  changes.push({
    path:
      path || "*",

    previous:
      cloneSafe(
        first
      ),

    current:
      cloneSafe(
        second
      ),

    type:
      classifyChange(
        first,
        second
      ),
  })
}


function classifyChange(
  previous,
  current
) {
  if (
    previous === undefined
  ) {
    return "added"
  }

  if (
    current === undefined
  ) {
    return "removed"
  }

  return "changed"
}


function valuesEqual(
  first,
  second
) {
  if (
    Object.is(
      first,
      second
    )
  ) {
    return true
  }

  try {
    return (
      JSON.stringify(first) ===
      JSON.stringify(second)
    )
  } catch {
    return false
  }
}


function isPlainObject(
  value
) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
}


function normalizePath(
  path
) {
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
    sanitizeString(
      path
    )

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


function getNestedValue(
  object,
  parts
) {
  let current =
    object

  for (
    const part
    of parts
  ) {
    if (
      current === null ||
      current === undefined ||
      typeof current !==
        "object"
    ) {
      return undefined
    }

    current =
      current[part]
  }

  return cloneSafe(
    current
  )
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
    return "Unknown snapshot error"
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
  SNAPSHOT_STORE_VERSION,
  SnapshotStore,
}


export default SnapshotStore
