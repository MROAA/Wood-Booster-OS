import {
  getPlannerRegistry,
} from "./plannerRegistry.js"


function createPlannerDecision({
  intentId,
  confidence,
  plannerId,
  reason,
  alternatives = [],
}) {
  return {
    version: 1,

    intentId:
      intentId || "unknown",

    confidence:
      Number.isFinite(confidence)
        ? confidence
        : 0,

    plannerId:
      plannerId || null,

    matched:
      Boolean(plannerId),

    reason:
      reason ||
      "planner decision was not available",

    alternatives:
      Array.isArray(alternatives)
        ? alternatives
        : [],
  }
}


function findPlannerByIntent(
  intentId,
) {
  if (!intentId) {
    return null
  }

  const plannerRegistry =
    getPlannerRegistry()

  return (
    plannerRegistry.find(
      (plannerDefinition) =>
        plannerDefinition.id ===
        intentId,
    ) || null
  )
}


function createAlternativePlanners({
  selectedPlannerId,
}) {
  return getPlannerRegistry()
    .filter(
      (plannerDefinition) =>
        plannerDefinition.id !==
        selectedPlannerId,
    )
    .map(
      (plannerDefinition) => ({
        plannerId:
          plannerDefinition.id,

        priority:
          plannerDefinition.priority,

        description:
          plannerDefinition.description,
      }),
    )
}


function decidePlanner({
  intentAnalysis,
}) {
  const primaryIntent =
    intentAnalysis?.primaryIntent ||
    null

  if (!primaryIntent) {
    return createPlannerDecision({
      intentId:
        "unknown",

      confidence:
        0,

      plannerId:
        null,

      reason:
        "primary intent was missing",

      alternatives:
        createAlternativePlanners({
          selectedPlannerId:
            null,
        }),
    })
  }

  if (
    primaryIntent.intentId ===
      "unknown" ||
    !primaryIntent.isKnown
  ) {
    return createPlannerDecision({
      intentId:
        primaryIntent.intentId,

      confidence:
        primaryIntent.confidence,

      plannerId:
        null,

      reason:
        "intent did not match a registered planner",

      alternatives:
        createAlternativePlanners({
          selectedPlannerId:
            null,
        }),
    })
  }

  const plannerDefinition =
    findPlannerByIntent(
      primaryIntent.intentId,
    )

  if (!plannerDefinition) {
    return createPlannerDecision({
      intentId:
        primaryIntent.intentId,

      confidence:
        primaryIntent.confidence,

      plannerId:
        null,

      reason:
        "intent was known but planner was not registered",

      alternatives:
        createAlternativePlanners({
          selectedPlannerId:
            null,
        }),
    })
  }

  return createPlannerDecision({
    intentId:
      primaryIntent.intentId,

    confidence:
      primaryIntent.confidence,

    plannerId:
      plannerDefinition.id,

    reason:
      "planner selected from primary intent",

    alternatives:
      createAlternativePlanners({
        selectedPlannerId:
          plannerDefinition.id,
      }),
  })
}


function decidePlanners({
  intentAnalysis,
}) {
  const intents =
    Array.isArray(
      intentAnalysis?.intents,
    )
      ? intentAnalysis.intents
      : []

  const decisions =
    intents.map(
      (intent) =>
        decidePlanner({
          intentAnalysis: {
            primaryIntent:
              intent,
          },
        }),
    )

  return {
    version: 1,

    decisionCount:
      decisions.length,

    hasMatchedPlanner:
      decisions.some(
        (decision) =>
          decision.matched,
      ),

    hasUnmatchedIntent:
      decisions.some(
        (decision) =>
          !decision.matched,
      ),

    primaryDecision:
      decisions[0] ||
      createPlannerDecision({
        intentId:
          "unknown",

        confidence:
          0,

        plannerId:
          null,

        reason:
          "no planner decisions were created",
      }),

    decisions,
  }
}


function getPlannerDecisionInfo() {
  return {
    version: 1,

    deterministic:
      true,

    usesLLM:
      false,

    selectionStrategy:
      "intent_id_matches_planner_id",

    supportsMultipleIntents:
      true,

    registeredPlanners:
      getPlannerRegistry().map(
        (plannerDefinition) => ({
          plannerId:
            plannerDefinition.id,

          priority:
            plannerDefinition.priority,

          description:
            plannerDefinition.description,
        }),
      ),
  }
}


export {
  createPlannerDecision,
  decidePlanner,
  decidePlanners,
  findPlannerByIntent,
  getPlannerDecisionInfo,
}
