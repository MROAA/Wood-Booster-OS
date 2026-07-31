/*
=====================================
AI BRAIN V2

DEFAULT MEMORY ROUTING TEST

Tämä testi varmistaa:
- oletusmoduulit rekisteröityvät automaattisesti
- Memory Module löytyy ilman käsin rekisteröintiä
- Prisma välittyy runtimeContextin kautta
- muistot voidaan listata koko AI Brain v2:n läpi
=====================================
*/


import prisma from "./prisma.js"

import {
  clearBrainModules,
  getBrainModules,
  runBrain,
} from "./services/aiBrainV2/index.js"


async function runTest() {
  clearBrainModules()

  const result =
    await runBrain({
      message:
        "Näytä muistot",

      source:
        "default-memory-test",

      runtimeContext: {
        prisma,
      },
    })

  console.log(
    "\nREGISTERED MODULES\n",
  )

  console.log(
    getBrainModules()
      .map(
        (moduleDefinition) =>
          moduleDefinition.id,
      ),
  )

  console.log(
    "\nDEFAULT MEMORY RESULT\n",
  )

  console.dir(
    result,
    {
      depth:
        null,
    },
  )

  const registeredModuleIds =
    getBrainModules()
      .map(
        (moduleDefinition) =>
          moduleDefinition.id,
      )

  const expectedModuleIds = [
    "action",
    "memory",
    "knowledge",
    "conversation",
  ]

  const registrationPassed =
    expectedModuleIds.every(
      (moduleId) =>
        registeredModuleIds.includes(
          moduleId,
        ),
    )

  if (!registrationPassed) {
    throw new Error(
      "Kaikki oletusmoduulit eivät rekisteröityneet.",
    )
  }

  const routingPassed =
    result.success ===
      true &&
    result.status ===
      "completed" &&
    result.module?.id ===
      "memory" &&
    result.output?.type ===
      "memory_result" &&
    result.output?.mode ===
      "list_memories" &&
    Array.isArray(
      result.output?.memories,
    )

  if (!routingPassed) {
    throw new Error(
      "Memory Module ei toiminut oletusreitityksen kautta.",
    )
  }

  console.log(
    "\n✅ AI Brain v2 oletusrekisterin Memory-testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ AI Brain v2 oletusrekisterin Memory-testi epäonnistui:",
        error,
      )

      process.exitCode =
        1
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    },
  )
