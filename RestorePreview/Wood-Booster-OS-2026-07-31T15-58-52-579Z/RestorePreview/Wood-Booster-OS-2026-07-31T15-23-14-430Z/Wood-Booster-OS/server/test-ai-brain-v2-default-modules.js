/*
=====================================
AI BRAIN V2

DEFAULT MODULE REGISTRATION TEST

Tämä testi varmistaa:
- rekisteri voidaan tyhjentää
- runBrain rekisteröi oletusmoduulit
- Action Module toimii automaattisesti
- moduulit palautuvat tyhjennyksen jälkeen
=====================================
*/


import {
  clearBrainModules,
  getBrainModuleInfo,
  runBrain,
} from "./services/aiBrainV2/index.js"


async function runTest() {
  clearBrainModules()

  console.log(
    "\nMODULES BEFORE FIRST RUN\n",
  )

  console.dir(
    getBrainModuleInfo(),
    {
      depth:
        null,
    },
  )

  const firstResult =
    await runBrain({
      message:
        "Avaa projektit",

      source:
        "default-modules-test",
    })

  console.log(
    "\nFIRST RUN RESULT\n",
  )

  console.dir(
    firstResult,
    {
      depth:
        null,
    },
  )

  const modulesAfterFirstRun =
    getBrainModuleInfo()

  console.log(
    "\nMODULES AFTER FIRST RUN\n",
  )

  console.dir(
    modulesAfterFirstRun,
    {
      depth:
        null,
    },
  )

  clearBrainModules()

  console.log(
    "\nMODULES AFTER CLEAR\n",
  )

  console.dir(
    getBrainModuleInfo(),
    {
      depth:
        null,
    },
  )

  const secondResult =
    await runBrain({
      message:
        "Avaa asiakkaat",

      source:
        "default-modules-test",
    })

  console.log(
    "\nSECOND RUN RESULT\n",
  )

  console.dir(
    secondResult,
    {
      depth:
        null,
    },
  )

  const modulesAfterSecondRun =
    getBrainModuleInfo()

  console.log(
    "\nMODULES AFTER SECOND RUN\n",
  )

  console.dir(
    modulesAfterSecondRun,
    {
      depth:
        null,
    },
  )

  const firstRunPassed =
    firstResult.success ===
      true &&
    firstResult.module?.id ===
      "action" &&
    firstResult.output?.action?.path ===
      "/projects"

  const secondRunPassed =
    secondResult.success ===
      true &&
    secondResult.module?.id ===
      "action" &&
    secondResult.output?.action?.path ===
      "/customers"

  const firstRegistrationPassed =
    Array.isArray(
      modulesAfterFirstRun,
    ) &&
    modulesAfterFirstRun.some(
      (moduleDefinition) =>
        moduleDefinition.id ===
        "action",
    ) &&
    modulesAfterFirstRun.some(
      (moduleDefinition) =>
        moduleDefinition.id ===
        "conversation",
    )

  const secondRegistrationPassed =
    Array.isArray(
      modulesAfterSecondRun,
    ) &&
    modulesAfterSecondRun.some(
      (moduleDefinition) =>
        moduleDefinition.id ===
        "action",
    ) &&
    modulesAfterSecondRun.some(
      (moduleDefinition) =>
        moduleDefinition.id ===
        "conversation",
    )

  if (
    !firstRunPassed ||
    !secondRunPassed ||
    !firstRegistrationPassed ||
    !secondRegistrationPassed
  ) {
    throw new Error(
      "AI Brain v2 oletusmoduulien testi epäonnistui.",
    )
  }

  console.log(
    "\n✅ AI Brain v2 oletusmoduulit rekisteröityvät automaattisesti.\n",
  )
}


runTest().catch(
  (error) => {
    console.error(
      "\n❌ AI Brain v2 oletusmoduulien testi epäonnistui:",
      error,
    )

    process.exitCode =
      1
  },
)
