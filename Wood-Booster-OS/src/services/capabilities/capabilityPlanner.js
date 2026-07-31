import {
  findCapabilityByAction,
} from "./capabilityManifest"


function createPlannerDecision({
  intent,
  capability,
  confidence,
  actions,
  source,
}) {
  return {
    intent,
    capability,
    confidence,
    actions,
    source,
  }
}


function normalizeActionType(action) {
  return String(action?.type || "")
    .trim()
    .toLowerCase()
}


function createIntentFromAction(action) {
  const actionType =
    normalizeActionType(action)

  if (!actionType) {
    return "unknown"
  }

  return actionType
    .replace(/[^a-z0-9_]+/g, "_")
}


function resolveCapabilityId(actions) {
  if (
    !Array.isArray(actions) ||
    actions.length === 0
  ) {
    return null
  }

  const capabilityIds =
    actions
      .map((action) => {
        const actionType =
          normalizeActionType(action)

        const capability =
          findCapabilityByAction(
            actionType,
          )

        return capability?.id || null
      })
      .filter(Boolean)

  if (
    capabilityIds.length === 0
  ) {
    return null
  }

  const uniqueCapabilityIds =
    [...new Set(capabilityIds)]

  if (
    uniqueCapabilityIds.length === 1
  ) {
    return uniqueCapabilityIds[0]
  }

  return "multi_capability"
}


function createCapabilityPlan({
  actions,
  source =
    "local-capability-planner",
}) {
  const normalizedActions =
    Array.isArray(actions)
      ? actions.filter(Boolean)
      : []

  if (
    normalizedActions.length === 0
  ) {
    return null
  }

  const capability =
    resolveCapabilityId(
      normalizedActions,
    )

  const intent =
    normalizedActions.length === 1
      ? createIntentFromAction(
          normalizedActions[0],
        )
      : "execute_action_queue"

  const confidence =
    capability
      ? 1
      : 0.5

  return createPlannerDecision({
    intent,
    capability,
    confidence,
    actions: normalizedActions,
    source,
  })
}


export {
  createCapabilityPlan,
}
