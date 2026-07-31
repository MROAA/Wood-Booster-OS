/*
=====================================
WOOD-BOOSTER AI BRAIN V2

REASONING MODULE TEST

Testaa:
- toimintopyynnön tunnistuksen
- projektialueen tunnistuksen
- muistipyynnön tunnistuksen
- tietopyynnön tunnistuksen
- tavallisen keskustelun tunnistuksen
=====================================
*/


import {
  analyzeMessage,
  createReasoningModule,
} from "./services/aiBrainV2/modules/reasoningModule.js"


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


function printResult({
  title,
  message,
  analysis,
}) {
  console.log(
    `\n=== ${title} ===`,
  )

  console.log(
    "VIESTI:",
    message,
  )

  console.log(
    JSON.stringify(
      analysis,
      null,
      2,
    ),
  )
}


async function runTest() {
  console.log(
    "\nWOOD-BOOSTER AI BRAIN V2",
  )

  console.log(
    "REASONING MODULE TEST\n",
  )


  const projectMessage =
    "Luo uusi projekti Aurora-pöydälle."

  const projectAnalysis =
    analyzeMessage(
      projectMessage,
    )

  printResult({
    title:
      "PROJEKTITOIMINTO",

    message:
      projectMessage,

    analysis:
      projectAnalysis,
  })

  assert(
    projectAnalysis.intent ===
      "action_request",

    "Projektiviestin intentin pitäisi olla action_request.",
  )

  assert(
    projectAnalysis.domains.includes(
      "project",
    ),

    "Projektiviestin pitäisi sisältää project-domain.",
  )

  assert(
    projectAnalysis.requiresAction ===
      true,

    "Projektiviestin pitäisi vaatia toimintoa.",
  )


  const memoryMessage =
    "Näytä muistiehdotukset."

  const memoryAnalysis =
    analyzeMessage(
      memoryMessage,
    )

  printResult({
    title:
      "MUISTITOIMINTO",

    message:
      memoryMessage,

    analysis:
      memoryAnalysis,
  })

  assert(
    memoryAnalysis.intent ===
      "memory_action",

    "Muistiviestin intentin pitäisi olla memory_action.",
  )

  assert(
    memoryAnalysis.domains.includes(
      "memory",
    ),

    "Muistiviestin pitäisi sisältää memory-domain.",
  )

  assert(
    memoryAnalysis.moduleNeeds.memory ===
      true,

    "Muistiviestin pitäisi tarvita Memory Modulea.",
  )


  const knowledgeMessage =
    "Mitä tietopankissa tiedetään Aurora-pöydästä?"

  const knowledgeAnalysis =
    analyzeMessage(
      knowledgeMessage,
    )

  printResult({
    title:
      "TIETOPYYNTÖ",

    message:
      knowledgeMessage,

    analysis:
      knowledgeAnalysis,
  })

  assert(
    knowledgeAnalysis.intent ===
      "information_request",

    "Tietopyynnön intentin pitäisi olla information_request.",
  )

  assert(
    knowledgeAnalysis.domains.includes(
      "knowledge",
    ),

    "Tietopyynnön pitäisi sisältää knowledge-domain.",
  )

  assert(
    knowledgeAnalysis.isQuestion ===
      true,

    "Tietopyyntö pitäisi tunnistaa kysymykseksi.",
  )


  const conversationMessage =
    "Kerro minulle hyvä idea työpäivälle."

  const conversationAnalysis =
    analyzeMessage(
      conversationMessage,
    )

  printResult({
    title:
      "YLEINEN KESKUSTELU",

    message:
      conversationMessage,

    analysis:
      conversationAnalysis,
  })

  assert(
    conversationAnalysis.intent ===
      "conversation",

    "Yleisen viestin intentin pitäisi olla conversation.",
  )

  assert(
    conversationAnalysis.domains.includes(
      "general",
    ),

    "Yleisen viestin pitäisi sisältää general-domain.",
  )


  const module =
    createReasoningModule()

  const canHandleNormally =
    await module.canHandle({
      request: {
        message:
          projectMessage,
      },

      runtimeContext: {},
    })

  assert(
    canHandleNormally.matched ===
      false,

    "Reasoning Module ei saa osallistua oletusreititykseen vielä.",
  )


  const canHandleExplicitly =
    await module.canHandle({
      request: {
        message:
          projectMessage,
      },

      runtimeContext: {
        reasoningOnly:
          true,
      },
    })

  assert(
    canHandleExplicitly.matched ===
      true,

    "Reasoning Modulen pitäisi hyväksyä reasoningOnly-pyyntö.",
  )


  const executionResult =
    await module.execute({
      message:
        projectMessage,

      request: {
        requestId:
          "reasoning-test-1",
      },

      runtimeContext: {
        reasoningOnly:
          true,
      },
    })

  assert(
    executionResult.type ===
      "reasoning_result",

    "Moduulin tulostyypin pitäisi olla reasoning_result.",
  )

  assert(
    executionResult.analysis.intent ===
      "action_request",

    "Moduulin suoritus ei palauttanut odotettua intenttiä.",
  )


  console.log(
    "\n✅ AI Brain v2 Reasoning Module -testi onnistui.\n",
  )
}


runTest()
  .catch(
    (error) => {
      console.error(
        "\n❌ Reasoning Module -testi epäonnistui.",
      )

      console.error(
        error,
      )

      process.exitCode = 1
    },
  )
