/*
=====================================
WOOD-BOOSTER AI BRAIN V2

DEFAULT REASONING TEST

Testaa:
- oletusmoduulien rekisteröinnin
- Reasoning Modulen rekisteröinnin
- reasoningOnly-reitityksen
- Reasoning Modulen analyysituloksen
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
        "reasoning",
    ),

    "Reasoning Module ei löytynyt oletusrekisteristä.",
  )


  const message =
    "Luo uusi projekti Aurora-pöydälle."

  const reasoningResult =
    await runBrain({
      message,

      source:
        "default-reasoning-test",

      runtimeContext: {
        reasoningOnly:
          true,
      },
    })


  console.log(
    "\nDEFAULT REASONING RESULT\n",
  )

  console.dir(
    reasoningResult,
    {
      depth:
        null,
    },
  )


  assert(
    reasoningResult.success ===
      true,

    "Reasoning-pyyntö epäonnistui.",
  )


  assert(
    reasoningResult.module?.id ===
      "reasoning",

    "Pyyntö ei reitittynyt Reasoning Modulelle.",
  )


  assert(
    reasoningResult.output?.type ===
      "reasoning_result",

    "Reasoning Module palautti väärän tulostyypin.",
  )


  assert(
    reasoningResult.output?.analysis
      ?.intent ===
      "action_request",

    "Projektin luontipyyntöä ei tunnistettu toimintopyynnöksi.",
  )


  assert(
    reasoningResult.output?.analysis
      ?.domains
      ?.includes(
        "project",
      ),

    "Projektidomainia ei tunnistettu.",
  )


  assert(
    reasoningResult.output?.analysis
      ?.requiresAction ===
      true,

    "Reasoning-tulos ei merkinnyt toimintoa tarpeelliseksi.",
  )


  assert(
    reasoningResult.output?.analysis
      ?.moduleNeeds
      ?.action ===
      true,

    "Reasoning-tulos ei tunnistanut Action Modulen tarvetta.",
  )


  console.log(
    "\n✅ AI Brain v2 oletusrekisterin Reasoning-testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ Oletusrekisterin Reasoning-testi epäonnistui.",
      )

      console.error(
        error,
      )

      process.exitCode = 1
    },
  )
