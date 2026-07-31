/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MODULE EXECUTOR TEST

Testaa:
- oletusmoduulien rekisteröinnin
- moduulin suorittamisen ID:llä
- Decision Modulen suorittamisen
- Action-kohteen palautumisen
- puuttuvan moduulin virheen
=====================================
*/


import {
  ensureDefaultBrainModules,
} from "./services/aiBrainV2/index.js"

import {
  executeBrainModuleById,
} from "./services/aiBrainV2/moduleExecutor.js"


function assert(
  condition,
  message,
) {
  if (!condition) {
    throw new Error(
      message,
    )
  }
}


async function runTest() {
  ensureDefaultBrainModules()


  const reasoningAnalysis = {
    intent:
      "action_request",

    domains: [
      "project",
    ],

    isQuestion:
      false,

    requiresAction:
      true,

    moduleNeeds: {
      action:
        true,

      memory:
        false,

      knowledge:
        false,

      conversation:
        false,

      project:
        true,

      customer:
        false,
    },

    missingInformation: [],

    confidence:
      0.75,
  }


  const decisionResult =
    await executeBrainModuleById({
      moduleId:
        "decision",

      message:
        "Luo Aurora-projekti.",

      request: {
        requestId:
          "module-executor-test-1",

        message:
          "Luo Aurora-projekti.",
      },

      runtimeContext: {
        requestId:
          "module-executor-test-1",

        source:
          "module-executor-test",

        decisionOnly:
          true,

        reasoningAnalysis,
      },
    })


  console.log(
    "\nDIRECT DECISION RESULT\n",
  )

  console.dir(
    decisionResult,
    {
      depth:
        null,
    },
  )


  assert(
    decisionResult.success ===
      true,

    "Decision Modulen suora suoritus epäonnistui.",
  )


  assert(
    decisionResult.module?.id ===
      "decision",

    "Module Executor suoritti väärän moduulin.",
  )


  assert(
    decisionResult.output?.type ===
      "decision_result",

    "Decision Module palautti väärän tulostyypin.",
  )


  assert(
    decisionResult.output?.decision ===
      "delegate",

    "Decision Module ei muodostanut delegate-päätöstä.",
  )


  assert(
    decisionResult.output?.targetModule ===
      "action",

    "Decision Module ei valinnut Action Modulea.",
  )


  const missingModuleResult =
    await executeBrainModuleById({
      moduleId:
        "missing-module",

      message:
        "Testi",
    })


  console.log(
    "\nMISSING MODULE RESULT\n",
  )

  console.dir(
    missingModuleResult,
    {
      depth:
        null,
    },
  )


  assert(
    missingModuleResult.success ===
      false,

    "Puuttuvan moduulin suoritus ei saa onnistua.",
  )


  assert(
    missingModuleResult.status ===
      "module_not_found",

    "Puuttuvan moduulin status on väärä.",
  )


  assert(
    missingModuleResult.error?.code ===
      "MODULE_NOT_FOUND",

    "Puuttuvan moduulin virhekoodi on väärä.",
  )


  console.log(
    "\n✅ AI Brain v2 Module Executor -testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ Module Executor -testi epäonnistui.",
      )

      console.error(
        error,
      )

      process.exitCode = 1
    },
  )
