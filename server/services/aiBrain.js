import {
  filterSystemFiles,
} from "./systemFilter.js"

import {
  isRestrictedWorkshopQuestion,
  createWorkshopRestrictionAnswer,
} from "./workshopPolicyGate.js"

import {
  buildAIContext,
} from "./contextBuilder.js"

import {
  applySpacemonkeyResponseGuard,
} from "./spacemonkey/responseGuard.js"

import {
  processMemoryPipeline,
} from "./memoryPipelineAdapter.js"

import {
  retrieveRelevantMemories,
} from "./aiBrainV2/engines/memoryRetrievalEngine.js"

import {
  readDatabaseKnowledge,
} from "./databaseKnowledgeReader.js"

import {
  getTruthBundle,
} from "./truthBundle.js"

import {
  buildSpacemonkeyContext,
} from "./spacemonkey/index.js"



const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"


const DEFAULT_MODEL =
  process.env.OLLAMA_MODEL ||
  "qwen2.5:7b"



function normalizeArray(value) {

  return Array.isArray(value)
    ? value
    : []

}



function cleanMemory(memory = []) {

  return normalizeArray(memory)
    .filter(
      item => {

        const content =
          String(
            item.content || "",
          )
          .toLowerCase()


        return (
          content &&

          !content.startsWith("mitä muistat") &&

          !content.startsWith("miten haluan") &&

          !content.startsWith("mikä on")
        )

      },
    )

}



function filterKnowledgeByTruth({
  knowledge = [],
  truths = [],
}) {

  const hasProductTruth =
    truths.some(
      truth =>
        truth.source === "PRODUCT_TRUTH",
    )


  if (!hasProductTruth) {

    return knowledge

  }


  return knowledge.filter(
    item => {

      const name =
        String(
          item.name ||
          item.file ||
          "",
        )
        .toLowerCase()


      return (

        !name.includes("engineer") &&

        !name.includes("brain_505") &&

        !name.includes("implementation") &&

        !name.includes("workshop") &&

        !name.includes("manufacturing") &&

        !name.includes("development") &&

        !name.includes("product_design")

      )

    },
  )

}



function buildMemoryInstruction(
  memory = [],
) {

  if (
    memory.length === 0
  ) {

    return ""

  }


  return `

==================================================
USER MEMORY INSTRUCTIONS
==================================================

Nämä ovat käyttäjän pysyviä toimintatapoja.

Noudata niitä vastauksessa.

${memory
.map(
  item =>
    `- ${item.content}`,
)
.join("\n")}

==================================================

`

}



export async function runAIBrain({

  message,

  knowledge = [],

  conversation = [],

  memory = [],

  systemContext = "",

  model = DEFAULT_MODEL,

  prisma,

  runtimeContext = {},

}) {


  try {


    const systems =

      normalizeArray(

        await filterSystemFiles(
          message,
        ),

      )



    const truthBundle =
      getTruthBundle(
        message,
      )



    const truths =
      normalizeArray(
        truthBundle?.truths,
      )



    const truthContext =

      truths.length

        ? `

WOOD-BOOSTER OFFICIAL TRUTH

${truths
.map(
truth =>
`

SOURCE:
${truth.source}

${truth.answer}

`,
)
.join("\n")}

`

        :

        ""



    let databaseKnowledge = []



    if (prisma) {

      databaseKnowledge =

        normalizeArray(

          await readDatabaseKnowledge({

            prisma,

            message,

          }),

        )

    }



    const filteredKnowledge =

      filterKnowledgeByTruth({

        knowledge:
          normalizeArray(
            knowledge,
          ),

        truths,

      })



    const combinedKnowledge = [

      ...filteredKnowledge,

      ...databaseKnowledge,

    ]
        const memoryRetrieval =

      await retrieveRelevantMemories({

        prisma,

        message,

        limit:
          8,

      })



    const finalMemory =

      cleanMemory([

        ...normalizeArray(memory),

        ...normalizeArray(
          memoryRetrieval.memories,
        ),

      ])
      .slice(
        0,
        8,
      )



    const spacemonkey =
      buildSpacemonkeyContext()



    const context =

      await buildAIContext({

        message,

        knowledge:
          combinedKnowledge,

        memory:
          finalMemory,

        conversation:
          normalizeArray(
            conversation,
          ),

        spacemonkey,

      })



    const memoryInstructions =

      buildMemoryInstruction(
        finalMemory,
      )



    const finalContext = `

${systemContext}


${truthContext}


${context}


${memoryInstructions}


AI SYSTEM RULES:

- Vastaa vain annetun ja vahvistetun tiedon perusteella.
- Älä keksi puuttuvia faktoja.
- Jos tieto puuttuu, ilmoita että sitä ei ole vahvistettu.
- Ole selkeä ja suora.


TRUTH AUTHORITY LOCK:

Jos WOOD-BOOSTER OFFICIAL TRUTH sisältää rajoituksen,
sitä tulee noudattaa ennen muuta tietoa.


IDENTITY SEPARATION:

- Spacemonkey on AI-käyttöjärjestelmän operaattori.
- Wood-Booster on projektiympäristö.
- Älä sekoita projektin arvoja Spacemonkeyn identiteettiin.

`



    if (
      isRestrictedWorkshopQuestion(
        message,
      )
    ) {

      return {

        success:
          true,

        answer:
          createWorkshopRestrictionAnswer(),

        model,

        knowledgeSources:

          combinedKnowledge.map(
            item =>
              item.name ||
              item.title ||
              item.file ||
              "unknown",
          ),

        memoryContext:
          finalMemory,

        debug: {

          systemsLoaded:
            systems.length,

          truthLayer:
            truths.length > 0,

          spacemonkeyContext:
            true,

          workshopBlocked:
            true,

        },

      }

    }



    const answer =

      await askOllama({

        model,

        context:
          finalContext,

        message,

      })



    const guardedAnswer =

      applySpacemonkeyResponseGuard(
        answer,
      )



    const memoryPipelineResult =

      await processMemoryPipeline({

        message,

        answer:
          guardedAnswer,

        prismaClient:
          prisma,

        model,

      })



    return {

      success:
        true,

      answer:
        guardedAnswer,

      model,


      memoryProposalCreated:

        memoryPipelineResult
          ?.memoryProposalCreated === true,


      memoryProposal:

        memoryPipelineResult
          ?.memoryProposal ||
        null,


      knowledgeSources:

        combinedKnowledge.map(

          item =>

            item.name ||
            item.title ||
            item.file ||
            "unknown",

        ),


      memoryContext:
        finalMemory,


      debug: {

        systemsLoaded:
          systems.length,


        truthLayer:
          truths.length > 0,


        spacemonkeyContext:
          true,


        contextLength:
          finalContext.length,

      },

    }


  }
  catch(error) {

    console.error(
      "AI BRAIN ERROR",
      error,
    )


    return {

      success:
        false,

      error:
        error.message,

    }

  }

}





async function askOllama({

  model,

  context,

  message,

}) {


  const response =

    await fetch(

      `${OLLAMA_URL}/api/chat`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },


        body:

          JSON.stringify({

            model,

            stream:
              false,


            messages: [

              {

                role:
                  "system",

                content:
                  context,

              },


              {

                role:
                  "user",

                content:
                  message,

              },

            ],


            options: {

              temperature:
                0.2,


              num_ctx:
                8192,

            },

          }),

      },

    )



  const data =
    await response.json()



  if (!response.ok) {

    throw new Error(
      data.error ||
      "Ollama error",
    )

  }



  return String(

    data.message?.content ||
    "",

  ).trim()

}