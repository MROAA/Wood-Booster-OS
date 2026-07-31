/*
=====================================
WOOD-BOOSTER AI BRAIN V2

DEFAULT DECISION TEST

Testaa:
- oletusmoduulien rekisteröinnin
- Decision Modulen rekisteröinnin
- decisionOnly-reitityksen
- Reasoning-analyysin vastaanoton
- Action Module -delegointipäätöksen
=====================================
*/


import {
  ensureDefaultBrainModules,
  getBrainModules,
  runBrain,
} from "./services/aiBrainV2/index.js"


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
  const registrationResult =
    ensureDefaultBrainModules()

  console.log(
    "\nDEFAULT MODULE REGISTRATION\n",
  )

  console.dir(
    registrationResult,
    {
      depth:
        null,
    },
  )


  const modules =
    getBrainModules()

  console.log(
    "\nREGISTERED MODULES\n",
  )

  console.log(
    modules.map(
      (moduleDefinition) =>
        moduleDefinition.id,
    ),
  )


  assert(
    modules.some(
      (moduleDefinition) =>
        moduleDefinition.id ===
        "decision",
    ),

    "Decision Module ei löytynyt oletusrekisteristä.",
  )


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
    await runBrain({
      message:
        "Luo uusi projekti Aurora-pöydälle.",

      source:
        "default-decision-test",

      runtimeContext: {
        decisionOnly:
          true,

        reasoningAnalysis,
      },
    })


  console.log(
    "\nDEFAULT DECISION RESULT\n",
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

    "Decision-pyyntö epäonnistui.",
  )


  assert(
    decisionResult.module?.id ===
      "decision",

    "Pyyntö ei reitittynyt Decision Modulelle.",
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


  assert(
    decisionResult.output?.confidence ===
      0.75,

    "Decision Modulen confidence ei vastannut Reasoning-analyysiä.",
  )


  assert(
    decisionResult.output?.analysis
      ?.intent ===
      "action_request",

    "Reasoning-analyysi ei säilynyt Decision Modulen tuloksessa.",
  )


  console.log(
    "\n✅ AI Brain v2 oletusrekisterin Decision-testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ Oletusrekisterin Decision-testi epäonnistui.",
      )

      console.error(
        error,
      )

      process.exitCode = 1
    },
  )
