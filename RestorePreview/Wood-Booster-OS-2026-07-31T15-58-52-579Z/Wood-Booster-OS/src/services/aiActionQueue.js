import {
  executeAIAction,
} from "./aiActionExecutor"


function normalizeActions(actions) {
  if (!actions) {
    return []
  }

  if (Array.isArray(actions)) {
    return actions.filter(Boolean)
  }

  return [actions]
}


function createQueueItem({
  action,
  index,
  total,
}) {
  return {
    id:
      action?.id ||
      `queue-action-${index + 1}`,

    index,

    position:
      index + 1,

    total,

    status:
      "pending",

    action,

    result: null,

    startedAt: null,

    completedAt: null,
  }
}


function createQueueItems(actions) {
  return actions.map(
    (action, index) =>
      createQueueItem({
        action,
        index,
        total:
          actions.length,
      }),
  )
}


function countQueueItems(
  queueItems,
  status,
) {
  return queueItems.filter(
    (item) =>
      item.status === status,
  ).length
}


function createQueueResult({
  success,
  status,
  message,
  actions,
  results,
  queueItems = [],
}) {
  return {
    success,
    status,
    message,

    actions,

    results,

    queueItems,

    completedCount:
      countQueueItems(
        queueItems,
        "completed",
      ),

    failedCount:
      countQueueItems(
        queueItems,
        "failed",
      ),

    pendingCount:
      countQueueItems(
        queueItems,
        "pending",
      ),

    runningCount:
      countQueueItems(
        queueItems,
        "running",
      ),

    totalCount:
      actions.length,
  }
}


function notifyQueueChange({
  queueItems,
  currentIndex,
  onQueueChange,
}) {
  if (
    typeof onQueueChange !==
    "function"
  ) {
    return
  }

  onQueueChange({
    actions:
      queueItems.map(
        (item) => ({
          ...item,
        }),
      ),

    currentIndex,

    completedCount:
      countQueueItems(
        queueItems,
        "completed",
      ),

    failedCount:
      countQueueItems(
        queueItems,
        "failed",
      ),

    pendingCount:
      countQueueItems(
        queueItems,
        "pending",
      ),

    runningCount:
      countQueueItems(
        queueItems,
        "running",
      ),

    totalCount:
      queueItems.length,
  })
}


async function executeAIActionQueue({
  actions,
  navigate,
  stopOnError = false,
  onQueueStart,
  onQueueChange,
  onActionStart,
  onActionComplete,
}) {
  const normalizedActions =
    normalizeActions(actions)

  if (
    normalizedActions.length === 0
  ) {
    return createQueueResult({
      success: false,

      status:
        "empty",

      message:
        "Action Queue ei saanut suoritettavia toimintoja.",

      actions: [],

      results: [],

      queueItems: [],
    })
  }

  if (
    typeof navigate !== "function"
  ) {
    return createQueueResult({
      success: false,

      status:
        "configuration_error",

      message:
        "Action Queue ei saanut navigointitoimintoa.",

      actions:
        normalizedActions,

      results: [],

      queueItems:
        createQueueItems(
          normalizedActions,
        ),
    })
  }

  const queueItems =
    createQueueItems(
      normalizedActions,
    )

  const results = []

  if (
    typeof onQueueStart ===
    "function"
  ) {
    onQueueStart({
      actions:
        normalizedActions,

      queueItems:
        queueItems.map(
          (item) => ({
            ...item,
          }),
        ),

      total:
        normalizedActions.length,
    })
  }

  notifyQueueChange({
    queueItems,

    currentIndex:
      null,

    onQueueChange,
  })

  for (
    let index = 0;
    index <
    normalizedActions.length;
    index += 1
  ) {
    const action =
      normalizedActions[index]

    const queueItem =
      queueItems[index]

    queueItem.status =
      "running"

    queueItem.startedAt =
      new Date().toISOString()

    notifyQueueChange({
      queueItems,

      currentIndex:
        index,

      onQueueChange,
    })

    if (
      typeof onActionStart ===
      "function"
    ) {
      onActionStart({
        action,

        item: {
          ...queueItem,
        },

        index,

        total:
          normalizedActions.length,
      })
    }

    let result

    try {
      result =
        await executeAIAction({
          action,
          navigate,
        })
    } catch (error) {
      console.error(
        "Action Queue execution error:",
        error,
      )

      result = {
        success: false,

        type:
          "queue_error",

        message:
          error?.message ||
          "Toiminnon suorittaminen epäonnistui.",

        action,

        path: null,

        data: null,
      }
    }

    const queueResult = {
      ...result,

      queueIndex:
        index,

      queuePosition:
        index + 1,

      queueTotal:
        normalizedActions.length,
    }

    results.push(
      queueResult,
    )

    queueItem.status =
      queueResult.success
        ? "completed"
        : "failed"

    queueItem.result =
      queueResult

    queueItem.completedAt =
      new Date().toISOString()

    notifyQueueChange({
      queueItems,

      currentIndex:
        index,

      onQueueChange,
    })

    if (
      typeof onActionComplete ===
      "function"
    ) {
      onActionComplete({
        action,

        item: {
          ...queueItem,
        },

        result:
          queueResult,

        index,

        total:
          normalizedActions.length,
      })
    }

    if (
      stopOnError &&
      !queueResult.success
    ) {
      break
    }
  }

  const completedCount =
    countQueueItems(
      queueItems,
      "completed",
    )

  const failedCount =
    countQueueItems(
      queueItems,
      "failed",
    )

  const wasStopped =
    results.length <
    normalizedActions.length

  if (
    failedCount === 0 &&
    !wasStopped
  ) {
    return createQueueResult({
      success: true,

      status:
        "completed",

      message:
        `Action Queue suoritti ${completedCount} toimintoa onnistuneesti.`,

      actions:
        normalizedActions,

      results,

      queueItems,
    })
  }

  if (
    completedCount > 0
  ) {
    return createQueueResult({
      success: false,

      status:
        wasStopped
          ? "stopped"
          : "completed_with_errors",

      message:
        `Action Queue suoritti ${completedCount} toimintoa. ${failedCount} toimintoa epäonnistui.`,

      actions:
        normalizedActions,

      results,

      queueItems,
    })
  }

  return createQueueResult({
    success: false,

    status:
      wasStopped
        ? "stopped"
        : "failed",

    message:
      "Action Queue ei pystynyt suorittamaan toimintoja.",

    actions:
      normalizedActions,

    results,

    queueItems,
  })
}


export {
  createQueueItems,
  executeAIActionQueue,
  normalizeActions,
}
