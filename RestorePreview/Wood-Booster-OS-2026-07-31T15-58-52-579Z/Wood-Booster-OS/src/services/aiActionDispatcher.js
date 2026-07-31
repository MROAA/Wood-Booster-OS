import {
  executeAIActionQueue,
  normalizeActions,
} from "./aiActionQueue"


function normalizeActionResponse(
  actionResponse,
) {
  if (!actionResponse) {
    return []
  }

  if (
    Array.isArray(
      actionResponse,
    )
  ) {
    return normalizeActions(
      actionResponse,
    )
  }

  if (
    typeof actionResponse ===
      "object" &&
    Array.isArray(
      actionResponse.actions,
    )
  ) {
    return normalizeActions(
      actionResponse.actions,
    )
  }

  if (
    typeof actionResponse ===
      "object" &&
    actionResponse.action
  ) {
    return normalizeActions(
      actionResponse.action,
    )
  }

  return normalizeActions(
    actionResponse,
  )
}


async function dispatchAIActions({
  action,
  actions,
  response,
  navigate,
  stopOnError = false,
  onQueueStart,
  onQueueChange,
  onActionStart,
  onActionComplete,
}) {
  const actionSource =
    actions ??
    action ??
    response

  const normalizedActions =
    normalizeActionResponse(
      actionSource,
    )

  return executeAIActionQueue({
    actions:
      normalizedActions,

    navigate,

    stopOnError,

    onQueueStart,

    onQueueChange,

    onActionStart,

    onActionComplete,
  })
}


function hasAIActions(
  actionResponse,
) {
  return (
    normalizeActionResponse(
      actionResponse,
    ).length > 0
  )
}


export {
  dispatchAIActions,
  hasAIActions,
  normalizeActionResponse,
}
