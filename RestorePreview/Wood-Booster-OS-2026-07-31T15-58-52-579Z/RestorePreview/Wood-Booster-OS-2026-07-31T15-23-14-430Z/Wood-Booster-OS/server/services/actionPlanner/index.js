import {
  createActionResult,
  splitMessageIntoCommands,
} from "./plannerUtils.js"

import {
  getPlannerRegistry,
  getRegisteredPlannerInfo,
} from "./plannerRegistry.js"

import {
  analyzeIntents,
  getIntentAnalyzerInfo,
} from "./intentAnalyzer.js"

import {
  decidePlanners,
  getPlannerDecisionInfo,
} from "./plannerDecision.js"


function runSingleCommand({
  message,
  runtimeContext,
}) {
  const plannerRegistry =
    getPlannerRegistry()

  for (
    const plannerDefinition
    of plannerRegistry
  ) {
    const plannerResult =
      plannerDefinition.planner({
        message,
        runtimeContext,
      })

    if (
      !plannerResult ||
      typeof plannerResult !==
        "object"
    ) {
      continue
    }

    if (
      plannerResult.matched ||
      plannerResult.answer
    ) {
      return {
        ...plannerResult,

        plannerId:
          plannerDefinition.id,

        command:
          message,
      }
    }
  }

  return {
    ...createActionResult({
      matched: false,

      actions: [],

      answer: null,

      reason:
        "no registered action planner matched",
    }),

    plannerId:
      null,

    command:
      message,
  }
}


function createExecutionStep({
  action,
  actionIndex,
  commandResult,
  commandIndex,
}) {
  return {
    id:
      `step-${actionIndex + 1}`,

    order:
      actionIndex + 1,

    status:
      "pending",

    action,

    actionType:
      action?.type || null,

    plannerId:
      commandResult?.plannerId ||
      null,

    command:
      commandResult?.command ||
      null,

    commandIndex,

    dependsOn:
      actionIndex > 0
        ? [
            `step-${actionIndex}`,
          ]
        : [],

    result:
      null,
  }
}


function createExecutionPlan({
  commandResults,
}) {
  const steps = []

  for (
    let commandIndex = 0;
    commandIndex <
    commandResults.length;
    commandIndex += 1
  ) {
    const commandResult =
      commandResults[
        commandIndex
      ]

    const commandActions =
      Array.isArray(
        commandResult.actions,
      )
        ? commandResult.actions
        : []

    for (
      const action
      of commandActions
    ) {
      const actionIndex =
        steps.length

      steps.push(
        createExecutionStep({
          action,
          actionIndex,
          commandResult,
          commandIndex,
        }),
      )
    }
  }

  return {
    version: 1,

    status:
      steps.length > 0
        ? "planned"
        : "empty",

    strategy:
      "sequential",

    totalSteps:
      steps.length,

    steps,
  }
}


function runActionPlanner({
  message,
  runtimeContext = null,
}) {
  const intentAnalysis =
    analyzeIntents({
      message,
      runtimeContext,
    })

  const plannerDecision =
    decidePlanners({
      intentAnalysis,
    })

  const commands =
    splitMessageIntoCommands(
      message,
    )

  if (commands.length === 0) {
    const executionPlan =
      createExecutionPlan({
        commandResults: [],
      })

    return {
      ...createActionResult({
        matched: false,

        actions: [],

        answer: null,

        reason:
          "message was empty",
      }),

      plannerId:
        null,

      plannerIds:
        [],

      commands:
        [],

      commandResults:
        [],

      intentAnalysis,

      plannerDecision,

      executionPlan,
    }
  }

  const commandResults =
    commands.map(
      (command) =>
        runSingleCommand({
          message:
            command,

          runtimeContext,
        }),
    )

  const matchedResults =
    commandResults.filter(
      (result) =>
        result.matched,
    )

  const actions =
    matchedResults.flatMap(
      (result) =>
        Array.isArray(
          result.actions,
        )
          ? result.actions
          : [],
    )

  const answers =
    commandResults
      .map(
        (result) =>
          result.answer,
      )
      .filter(Boolean)

  const plannerIds =
    matchedResults
      .map(
        (result) =>
          result.plannerId,
      )
      .filter(Boolean)

  const executionPlan =
    createExecutionPlan({
      commandResults,
    })

  if (actions.length === 0) {
    const firstAnswerResult =
      commandResults.find(
        (result) =>
          result.answer,
      )

    return {
      ...createActionResult({
        matched: false,

        actions: [],

        answer:
          answers.length > 0
            ? answers.join(" ")
            : null,

        reason:
          firstAnswerResult?.reason ||
          "no registered action planner matched",
      }),

      plannerId:
        firstAnswerResult
          ?.plannerId ||
        null,

      plannerIds:
        [],

      commands,

      commandResults,

      intentAnalysis,

      plannerDecision,

      executionPlan,
    }
  }

  return {
    ...createActionResult({
      matched: true,

      actions,

      answer:
        answers.length > 0
          ? answers.join(" ")
          : "Toiminnot on suunniteltu.",

      reason:
        actions.length > 1
          ? "multiple AI actions generated"
          : matchedResults[0]
              ?.reason ||
            "AI action generated",
    }),

    plannerId:
      plannerIds[0] ||
      null,

    plannerIds,

    commands,

    commandResults,

    intentAnalysis,

    plannerDecision,

    executionPlan,
  }
}


function getActionPlannerInfo() {
  return {
    supportsMultipleCommands:
      true,

    supportsIntentAnalysis:
      true,

    supportsPlannerDecision:
      true,

    supportsExecutionPlan:
      true,

    executionPlanVersion:
      1,

    executionStrategy:
      "sequential",

    commandSeparators: [
      "ja",
      "ja sitten",
      "jonka jälkeen",
      "sen jälkeen",
      "puolipiste",
      "rivinvaihto",
    ],

    intentAnalyzer:
      getIntentAnalyzerInfo(),

    plannerDecision:
      getPlannerDecisionInfo(),

    planners:
      getRegisteredPlannerInfo(),
  }
}


export {
  createExecutionPlan,
  getActionPlannerInfo,
  runActionPlanner,
  runSingleCommand,
}
