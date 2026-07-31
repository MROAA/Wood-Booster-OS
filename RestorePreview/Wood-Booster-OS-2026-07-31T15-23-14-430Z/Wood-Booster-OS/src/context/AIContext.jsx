import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react"

import {
  addExecutionHistoryItems,
  clearAllExecutionStorage,
  clearCurrentExecution,
  clearExecutionHistory,
  readCurrentAISession,
  readExecutionHistory,
  readExecutionState,
  readPlannerDecision,
  writeCurrentAISession,
  writeExecutionState,
  writePlannerDecision,
} from "../services/executionHistoryStorage"


const AIContext =
  createContext(null)


const initialActivity = {
  agent:
    "system",

  question:
    "",

  answer:
    "",

  reason:
    "",

  action:
    null,

  actions:
    [],

  plan:
    null,

  intentAnalysis:
    null,

  plannerDecision:
    null,

  executionPlan:
    null,

  actionResult:
    null,

  source:
    "",

  type:
    "",

  timestamp:
    null,

  status:
    "idle",
}


const initialExecutionState = {
  status:
    "idle",

  actions:
    [],

  results:
    [],

  activeIndex:
    null,

  pendingCount:
    0,

  runningCount:
    0,

  completedCount:
    0,

  failedCount:
    0,

  totalCount:
    0,
}


function createTimestamp() {
  return new Date()
    .toISOString()
}


function normalizeActions({
  action,
  actions,
}) {
  if (Array.isArray(actions)) {
    return actions.filter(Boolean)
  }

  if (action) {
    return [
      action,
    ]
  }

  return []
}


function createActivity({
  agent = "system",
  question = "",
  answer = "",
  reason = "",
  action = null,
  actions = [],
  plan = null,
  intentAnalysis = null,
  plannerDecision = null,
  executionPlan = null,
  actionResult = null,
  source = "",
  type = "",
  status = "idle",
}) {
  const normalizedActions =
    normalizeActions({
      action,
      actions,
    })

  return {
    agent,
    question,
    answer,
    reason,

    action:
      action ||
      normalizedActions[0] ||
      null,

    actions:
      normalizedActions,

    plan,
    intentAnalysis,
    plannerDecision,
    executionPlan,
    actionResult,
    source,
    type,

    timestamp:
      createTimestamp(),

    status,
  }
}


function createQueueItems(
  actions,
) {
  if (!Array.isArray(actions)) {
    return []
  }

  return actions
    .filter(Boolean)
    .map(
      (action, index) => ({
        id:
          `queue-item-${index + 1}`,

        index,

        action,

        status:
          "pending",

        startedAt:
          null,

        completedAt:
          null,

        result:
          null,
      }),
    )
}


function normalizeQueueItems(
  queueState,
) {
  const sourceItems =
    queueState?.queueItems ||
    queueState?.items ||
    queueState?.actions ||
    []

  if (!Array.isArray(sourceItems)) {
    return []
  }

  return sourceItems
    .filter(Boolean)
    .map(
      (item, index) => {
        const isQueueItem =
          typeof item === "object" &&
          (
            Object.prototype.hasOwnProperty.call(
              item,
              "action",
            ) ||
            Object.prototype.hasOwnProperty.call(
              item,
              "status",
            )
          )

        if (isQueueItem) {
          return {
            id:
              item.id ||
              `queue-item-${index + 1}`,

            index:
              Number.isInteger(
                item.index,
              )
                ? item.index
                : index,

            action:
              item.action ||
              null,

            status:
              item.status ||
              "pending",

            startedAt:
              item.startedAt ||
              null,

            completedAt:
              item.completedAt ||
              null,

            result:
              item.result ||
              null,
          }
        }

        return {
          id:
            `queue-item-${index + 1}`,

          index,

          action:
            item,

          status:
            "pending",

          startedAt:
            null,

          completedAt:
            null,

          result:
            null,
        }
      },
    )
}


function countQueueItems(
  items,
) {
  const pendingCount =
    items.filter(
      (item) =>
        item.status ===
        "pending",
    ).length

  const runningCount =
    items.filter(
      (item) =>
        item.status ===
        "running",
    ).length

  const completedCount =
    items.filter(
      (item) =>
        item.status ===
        "completed",
    ).length

  const failedCount =
    items.filter(
      (item) =>
        item.status ===
        "failed",
    ).length

  return {
    pendingCount,
    runningCount,
    completedCount,
    failedCount,
  }
}


function resolveQueueStatus(
  items,
) {
  if (items.length === 0) {
    return "idle"
  }

  const counts =
    countQueueItems(
      items,
    )

  if (counts.runningCount > 0) {
    return "running"
  }

  if (counts.pendingCount > 0) {
    return "running"
  }

  if (counts.failedCount > 0) {
    return "completed_with_errors"
  }

  return "completed"
}


function getInitialActivity() {
  const storedSession =
    readCurrentAISession()

  const storedPlannerDecision =
    readPlannerDecision()

  if (
    !storedSession ||
    typeof storedSession !==
      "object"
  ) {
    return {
      ...initialActivity,

      plannerDecision:
        storedPlannerDecision ||
        null,
    }
  }

  return {
    ...initialActivity,
    ...storedSession,

    plannerDecision:
      storedSession.plannerDecision ||
      storedPlannerDecision ||
      null,
  }
}


function getInitialExecutionState() {
  const storedState =
    readExecutionState()

  if (
    !storedState ||
    typeof storedState !==
      "object"
  ) {
    return initialExecutionState
  }

  const actions =
    normalizeQueueItems(
      storedState,
    )

  const counts =
    countQueueItems(
      actions,
    )

  return {
    ...initialExecutionState,
    ...storedState,

    actions,

    results:
      Array.isArray(
        storedState.results,
      )
        ? storedState.results
        : actions
            .map(
              (item) =>
                item.result,
            )
            .filter(Boolean),

    pendingCount:
      storedState.pendingCount ??
      counts.pendingCount,

    runningCount:
      storedState.runningCount ??
      counts.runningCount,

    completedCount:
      storedState.completedCount ??
      counts.completedCount,

    failedCount:
      storedState.failedCount ??
      counts.failedCount,

    totalCount:
      storedState.totalCount ??
      actions.length,
  }
}


function AIProvider({
  children,
}) {
  const initialStoredActivity =
    getInitialActivity()

  const [
    activity,
    setActivity,
  ] = useState(
    initialStoredActivity,
  )

  const [
    activeAgent,
    setActiveAgent,
  ] = useState(
    initialStoredActivity.agent ||
    "system",
  )

  const [
    activityHistory,
    setActivityHistory,
  ] = useState(
    readExecutionHistory,
  )

  const [
    isAIProcessing,
    setIsAIProcessing,
  ] = useState(
    initialStoredActivity.status ===
      "processing" ||
    initialStoredActivity.status ===
      "planning" ||
    initialStoredActivity.status ===
      "executing",
  )

  const [
    executionState,
    setExecutionState,
  ] = useState(
    getInitialExecutionState,
  )


  function persistActivity(
    nextActivity,
  ) {
    setActivity(
      nextActivity,
    )

    writeCurrentAISession(
      nextActivity,
    )

    if (
      nextActivity.plannerDecision
    ) {
      writePlannerDecision(
        nextActivity.plannerDecision,
      )
    }
  }


  function persistExecutionState(
    nextExecutionState,
  ) {
    setExecutionState(
      nextExecutionState,
    )

    writeExecutionState(
      nextExecutionState,
    )
  }


  function addActivityToHistory(
    nextActivity,
  ) {
    const nextHistory =
      addExecutionHistoryItems([
        nextActivity,
      ])

    setActivityHistory(
      nextHistory,
    )
  }


  function beginAIActivity(
    question,
  ) {
    clearCurrentExecution()

    const nextActivity =
      createActivity({
        agent:
          activeAgent ||
          "system",

        question:
          String(
            question ||
            "",
          ),

        status:
          "processing",
      })

    setIsAIProcessing(
      true,
    )

    persistActivity(
      nextActivity,
    )

    setExecutionState(
      initialExecutionState,
    )
  }


  function updateAIPlanning(
    planningSnapshot,
  ) {
    if (
      !planningSnapshot ||
      typeof planningSnapshot !==
        "object"
    ) {
      return
    }

    const actions =
      normalizeActions({
        action:
          planningSnapshot.action,

        actions:
          planningSnapshot.actions,
      })

    setActiveAgent(
      planningSnapshot.agent ||
      "system",
    )

    setIsAIProcessing(
      true,
    )

    setActivity(
      (previousActivity) => {
        const nextActivity = {
          ...previousActivity,

          agent:
            planningSnapshot.agent ||
            previousActivity.agent ||
            "system",

          reason:
            planningSnapshot.reason ||
            previousActivity.reason ||
            "",

          action:
            actions[0] ||
            previousActivity.action ||
            null,

          actions,

          plan:
            planningSnapshot.plan ??
            previousActivity.plan ??
            null,

          intentAnalysis:
            planningSnapshot.intentAnalysis ??
            previousActivity.intentAnalysis ??
            null,

          plannerDecision:
            planningSnapshot.plannerDecision ??
            previousActivity.plannerDecision ??
            null,

          executionPlan:
            planningSnapshot.executionPlan ??
            previousActivity.executionPlan ??
            null,

          source:
            planningSnapshot.source ||
            previousActivity.source ||
            "",

          type:
            planningSnapshot.type ||
            previousActivity.type ||
            "",

          timestamp:
            planningSnapshot.timestamp ||
            createTimestamp(),

          status:
            actions.length > 0
              ? "executing"
              : "planning",
        }

        writeCurrentAISession(
          nextActivity,
        )

        if (
          nextActivity.plannerDecision
        ) {
          writePlannerDecision(
            nextActivity.plannerDecision,
          )
        }

        return nextActivity
      },
    )

    if (
      actions.length > 0
    ) {
      const queueItems =
        createQueueItems(
          actions,
        )

      const nextExecutionState = {
        ...initialExecutionState,

        status:
          "running",

        actions:
          queueItems,

        pendingCount:
          queueItems.length,

        totalCount:
          queueItems.length,
      }

      persistExecutionState(
        nextExecutionState,
      )
    }
  }


  function beginActionQueue(
    actions,
  ) {
    const queueItems =
      createQueueItems(
        actions,
      )

    const nextExecutionState = {
      ...initialExecutionState,

      status:
        queueItems.length > 0
          ? "running"
          : "idle",

      actions:
        queueItems,

      pendingCount:
        queueItems.length,

      totalCount:
        queueItems.length,
    }

    persistExecutionState(
      nextExecutionState,
    )
  }


  function updateActionQueue(
    queueState,
  ) {
    const actions =
      normalizeQueueItems(
        queueState,
      )

    const counts =
      countQueueItems(
        actions,
      )

    const runningItem =
      actions.find(
        (item) =>
          item.status ===
          "running",
      )

    const nextExecutionState = {
      ...initialExecutionState,
      ...queueState,

      status:
        queueState?.status ||
        resolveQueueStatus(
          actions,
        ),

      actions,

      results:
        Array.isArray(
          queueState?.results,
        )
          ? queueState.results
          : actions
              .map(
                (item) =>
                  item.result,
              )
              .filter(Boolean),

      activeIndex:
        runningItem
          ? runningItem.index
          : null,

      pendingCount:
        queueState?.pendingCount ??
        counts.pendingCount,

      runningCount:
        queueState?.runningCount ??
        counts.runningCount,

      completedCount:
        queueState?.completedCount ??
        counts.completedCount,

      failedCount:
        queueState?.failedCount ??
        counts.failedCount,

      totalCount:
        queueState?.totalCount ??
        actions.length,
    }

    persistExecutionState(
      nextExecutionState,
    )
  }


  function startAction({
    action,
    index,
    total,
  }) {
    setExecutionState(
      (previousState) => {
        let actions =
          previousState.actions

        if (actions.length === 0) {
          actions =
            createQueueItems([
              action,
            ])
        }

        const nextActions =
          actions.map(
            (item) =>
              item.index === index
                ? {
                    ...item,

                    action:
                      action ||
                      item.action,

                    status:
                      "running",

                    startedAt:
                      item.startedAt ||
                      createTimestamp(),
                  }
                : item,
          )

        const counts =
          countQueueItems(
            nextActions,
          )

        const nextState = {
          ...previousState,

          status:
            "running",

          actions:
            nextActions,

          activeIndex:
            index,

          pendingCount:
            counts.pendingCount,

          runningCount:
            counts.runningCount,

          completedCount:
            counts.completedCount,

          failedCount:
            counts.failedCount,

          totalCount:
            total ||
            previousState.totalCount ||
            nextActions.length,
        }

        writeExecutionState(
          nextState,
        )

        return nextState
      },
    )
  }


  function completeAction({
    action,
    result,
    index,
    total,
  }) {
    setExecutionState(
      (previousState) => {
        const completedAt =
          createTimestamp()

        const normalizedResult = {
          ...result,

          queueIndex:
            result?.queueIndex ??
            index,

          action:
            result?.action ||
            action,

          success:
            result?.success ===
            true,

          status:
            result?.status ||
            (
              result?.success
                ? "completed"
                : "failed"
            ),

          completedAt:
            result?.completedAt ||
            completedAt,
        }

        const nextActions =
          previousState.actions.map(
            (item) =>
              item.index === index
                ? {
                    ...item,

                    action:
                      action ||
                      item.action,

                    status:
                      normalizedResult.success
                        ? "completed"
                        : "failed",

                    result:
                      normalizedResult,

                    completedAt,
                  }
                : item,
          )

        const counts =
          countQueueItems(
            nextActions,
          )

        const totalCount =
          total ||
          previousState.totalCount ||
          nextActions.length

        const processedCount =
          counts.completedCount +
          counts.failedCount

        const nextResults = [
          ...previousState.results.filter(
            (previousResult) =>
              previousResult?.queueIndex !==
              index,
          ),

          normalizedResult,
        ]

        const nextState = {
          ...previousState,

          status:
            processedCount >=
            totalCount
              ? counts.failedCount > 0
                ? "completed_with_errors"
                : "completed"
              : "running",

          actions:
            nextActions,

          results:
            nextResults,

          activeIndex:
            processedCount >=
            totalCount
              ? null
              : previousState.activeIndex,

          pendingCount:
            counts.pendingCount,

          runningCount:
            counts.runningCount,

          completedCount:
            counts.completedCount,

          failedCount:
            counts.failedCount,

          totalCount,
        }

        writeExecutionState(
          nextState,
        )

        return nextState
      },
    )
  }


  function completeAIActivity({
    agent = "system",
    question = "",
    answer = "",
    reason = "",
    action = null,
    actions = [],
    plan = null,
    intentAnalysis = null,
    plannerDecision = null,
    executionPlan = null,
    actionResult = null,
    source = "",
    type = "",
  }) {
    const completedActivity =
      createActivity({
        agent,
        question,
        answer,
        reason,
        action,
        actions,
        plan,
        intentAnalysis,
        plannerDecision,
        executionPlan,
        actionResult,
        source,
        type,

        status:
          "completed",
      })

    setActiveAgent(
      agent,
    )

    setIsAIProcessing(
      false,
    )

    persistActivity(
      completedActivity,
    )

    if (actionResult) {
      const resultActions =
        normalizeQueueItems(
          actionResult,
        )

      setExecutionState(
        (previousState) => {
          const nextActions =
            resultActions.length > 0
              ? resultActions
              : previousState.actions

          const counts =
            countQueueItems(
              nextActions,
            )

          const nextState = {
            ...previousState,

            status:
              actionResult.success
                ? "completed"
                : "completed_with_errors",

            actions:
              nextActions,

            results:
              Array.isArray(
                actionResult.results,
              )
                ? actionResult.results
                : previousState.results,

            activeIndex:
              null,

            pendingCount:
              actionResult.pendingCount ??
              counts.pendingCount,

            runningCount:
              0,

            completedCount:
              actionResult.completedCount ??
              counts.completedCount,

            failedCount:
              actionResult.failedCount ??
              counts.failedCount,

            totalCount:
              actionResult.totalCount ??
              previousState.totalCount ??
              nextActions.length,
          }

          writeExecutionState(
            nextState,
          )

          return nextState
        },
      )
    }

    addActivityToHistory(
      completedActivity,
    )
  }


  function failAIActivity({
    agent = "system",
    question = "",
    answer = "",
    reason =
      "AI Session epäonnistui.",
    action = null,
    actions = [],
    plan = null,
    intentAnalysis = null,
    plannerDecision = null,
    executionPlan = null,
    actionResult = null,
    source = "",
    type = "",
  }) {
    const failedActivity =
      createActivity({
        agent,
        question,
        answer,
        reason,
        action,
        actions,
        plan,
        intentAnalysis,
        plannerDecision,
        executionPlan,
        actionResult,
        source,
        type,

        status:
          "error",
      })

    setActiveAgent(
      agent,
    )

    setIsAIProcessing(
      false,
    )

    persistActivity(
      failedActivity,
    )

    setExecutionState(
      (previousState) => {
        const nextState = {
          ...previousState,

          status:
            "failed",

          activeIndex:
            null,

          runningCount:
            0,
        }

        writeExecutionState(
          nextState,
        )

        return nextState
      },
    )

    addActivityToHistory(
      failedActivity,
    )
  }


  function clearAIHistory() {
    clearExecutionHistory()

    setActivityHistory(
      [],
    )
  }


  function clearCurrentAIExecution() {
    clearCurrentExecution()

    setActiveAgent(
      "system",
    )

    setIsAIProcessing(
      false,
    )

    setActivity(
      initialActivity,
    )

    setExecutionState(
      initialExecutionState,
    )
  }


  function clearAllAIData() {
    clearAllExecutionStorage()

    setActiveAgent(
      "system",
    )

    setIsAIProcessing(
      false,
    )

    setActivity(
      initialActivity,
    )

    setActivityHistory(
      [],
    )

    setExecutionState(
      initialExecutionState,
    )
  }


  function resetAIActivity() {
    clearCurrentAIExecution()
  }


  const value =
    useMemo(
      () => ({
        activeAgent,
        setActiveAgent,

        activity,
        activityHistory,

        isAIProcessing,

        executionState,

        beginAIActivity,
        updateAIPlanning,
        beginActionQueue,
        updateActionQueue,
        startAction,
        completeAction,
        completeAIActivity,
        failAIActivity,

        clearAIHistory,
        clearCurrentAIExecution,
        clearAllAIData,
        resetAIActivity,
      }),
      [
        activeAgent,
        activity,
        activityHistory,
        isAIProcessing,
        executionState,
      ],
    )


  return (
    <AIContext.Provider
      value={value}
    >
      {children}
    </AIContext.Provider>
  )
}


function useAI() {
  const context =
    useContext(
      AIContext,
    )

  if (!context) {
    throw new Error(
      "useAI täytyy kutsua AIProvider-komponentin sisällä.",
    )
  }

  return context
}


export {
  AIProvider,
  useAI,
}
