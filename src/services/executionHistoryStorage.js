const HISTORY_STORAGE_KEY =
  "woodBoosterExecutionHistory"

const CURRENT_SESSION_STORAGE_KEY =
  "woodBoosterCurrentAISession"

const PLANNER_DECISION_STORAGE_KEY =
  "woodBoosterPlannerDecision"

const EXECUTION_STATE_STORAGE_KEY =
  "woodBoosterExecutionState"

const MAX_HISTORY_ITEMS =
  100


function canUseLocalStorage() {
  return (
    typeof window !==
      "undefined" &&
    typeof window.localStorage !==
      "undefined"
  )
}


function normalizeHistory(
  value,
) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(Boolean)
}


function createHistoryId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID()
  }

  return [
    "execution",
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-")
}


function readJSONStorage({
  key,
  fallbackValue,
  errorMessage,
}) {
  if (!canUseLocalStorage()) {
    return fallbackValue
  }

  try {
    const storedValue =
      localStorage.getItem(
        key,
      )

    if (!storedValue) {
      return fallbackValue
    }

    return JSON.parse(
      storedValue,
    )
  }
  catch (error) {
    console.error(
      errorMessage,
      error,
    )

    return fallbackValue
  }
}


function writeJSONStorage({
  key,
  value,
  errorMessage,
}) {
  if (!canUseLocalStorage()) {
    return value
  }

  try {
    localStorage.setItem(
      key,
      JSON.stringify(
        value,
      ),
    )
  }
  catch (error) {
    console.error(
      errorMessage,
      error,
    )
  }

  return value
}


function removeStorageValue({
  key,
  errorMessage,
}) {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    localStorage.removeItem(
      key,
    )
  }
  catch (error) {
    console.error(
      errorMessage,
      error,
    )
  }
}


function readExecutionHistory() {
  const history =
    readJSONStorage({
      key:
        HISTORY_STORAGE_KEY,

      fallbackValue:
        [],

      errorMessage:
        "Execution history could not be read:",
    })

  return normalizeHistory(
    history,
  )
}


function writeExecutionHistory(
  history,
) {
  const normalizedHistory =
    normalizeHistory(
      history,
    ).slice(
      0,
      MAX_HISTORY_ITEMS,
    )

  return writeJSONStorage({
    key:
      HISTORY_STORAGE_KEY,

    value:
      normalizedHistory,

    errorMessage:
      "Execution history could not be saved:",
  })
}


function createExecutionHistoryItem(
  execution,
) {
  const safeExecution =
    execution || {}

  const timestamp =
    safeExecution.timestamp ||
    safeExecution.completedAt ||
    safeExecution.updatedAt ||
    safeExecution.createdAt ||
    new Date().toISOString()

  return {
    ...safeExecution,

    id:
      safeExecution.id ||
      safeExecution.executionId ||
      safeExecution.actionId ||
      createHistoryId(),

    timestamp,
  }
}


function addExecutionHistoryItem(
  execution,
) {
  if (!execution) {
    return readExecutionHistory()
  }

  const currentHistory =
    readExecutionHistory()

  const historyItem =
    createExecutionHistoryItem(
      execution,
    )

  const nextHistory = [
    historyItem,

    ...currentHistory.filter(
      (item) =>
        item?.id !==
        historyItem.id,
    ),
  ]

  return writeExecutionHistory(
    nextHistory,
  )
}


function addExecutionHistoryItems(
  executions,
) {
  const newItems =
    normalizeHistory(
      executions,
    ).map(
      createExecutionHistoryItem,
    )

  if (newItems.length === 0) {
    return readExecutionHistory()
  }

  const currentHistory =
    readExecutionHistory()

  const newItemIds =
    new Set(
      newItems.map(
        (item) =>
          item.id,
      ),
    )

  const nextHistory = [
    ...newItems,

    ...currentHistory.filter(
      (item) =>
        !newItemIds.has(
          item?.id,
        ),
    ),
  ]

  return writeExecutionHistory(
    nextHistory,
  )
}


function replaceExecutionHistory(
  executions,
) {
  const history =
    normalizeHistory(
      executions,
    ).map(
      createExecutionHistoryItem,
    )

  return writeExecutionHistory(
    history,
  )
}


function clearExecutionHistory() {
  removeStorageValue({
    key:
      HISTORY_STORAGE_KEY,

    errorMessage:
      "Execution history could not be cleared:",
  })

  return []
}


function readCurrentAISession() {
  return readJSONStorage({
    key:
      CURRENT_SESSION_STORAGE_KEY,

    fallbackValue:
      null,

    errorMessage:
      "Current AI session could not be read:",
  })
}


function writeCurrentAISession(
  session,
) {
  if (!session) {
    return clearCurrentAISession()
  }

  return writeJSONStorage({
    key:
      CURRENT_SESSION_STORAGE_KEY,

    value:
      session,

    errorMessage:
      "Current AI session could not be saved:",
  })
}


function clearCurrentAISession() {
  removeStorageValue({
    key:
      CURRENT_SESSION_STORAGE_KEY,

    errorMessage:
      "Current AI session could not be cleared:",
  })

  return null
}


function readPlannerDecision() {
  return readJSONStorage({
    key:
      PLANNER_DECISION_STORAGE_KEY,

    fallbackValue:
      null,

    errorMessage:
      "Planner decision could not be read:",
  })
}


function writePlannerDecision(
  plannerDecision,
) {
  if (!plannerDecision) {
    return clearPlannerDecision()
  }

  return writeJSONStorage({
    key:
      PLANNER_DECISION_STORAGE_KEY,

    value:
      plannerDecision,

    errorMessage:
      "Planner decision could not be saved:",
  })
}


function clearPlannerDecision() {
  removeStorageValue({
    key:
      PLANNER_DECISION_STORAGE_KEY,

    errorMessage:
      "Planner decision could not be cleared:",
  })

  return null
}


function readExecutionState() {
  return readJSONStorage({
    key:
      EXECUTION_STATE_STORAGE_KEY,

    fallbackValue:
      null,

    errorMessage:
      "Execution state could not be read:",
  })
}


function writeExecutionState(
  executionState,
) {
  if (!executionState) {
    return clearExecutionState()
  }

  return writeJSONStorage({
    key:
      EXECUTION_STATE_STORAGE_KEY,

    value:
      executionState,

    errorMessage:
      "Execution state could not be saved:",
  })
}


function clearExecutionState() {
  removeStorageValue({
    key:
      EXECUTION_STATE_STORAGE_KEY,

    errorMessage:
      "Execution state could not be cleared:",
  })

  return null
}


function clearCurrentExecution() {
  clearCurrentAISession()
  clearPlannerDecision()
  clearExecutionState()
}


function clearAllExecutionStorage() {
  clearExecutionHistory()
  clearCurrentExecution()
}


export {
  HISTORY_STORAGE_KEY,
  CURRENT_SESSION_STORAGE_KEY,
  PLANNER_DECISION_STORAGE_KEY,
  EXECUTION_STATE_STORAGE_KEY,

  addExecutionHistoryItem,
  addExecutionHistoryItems,
  clearExecutionHistory,
  readExecutionHistory,
  replaceExecutionHistory,
  writeExecutionHistory,

  clearCurrentAISession,
  readCurrentAISession,
  writeCurrentAISession,

  clearPlannerDecision,
  readPlannerDecision,
  writePlannerDecision,

  clearExecutionState,
  readExecutionState,
  writeExecutionState,

  clearCurrentExecution,
  clearAllExecutionStorage,
}
