import {
  filterSystemFiles,
} from "./systemFilter.js"

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



export async function runAIBrain({

  message,

  knowledge = [],

  conversation = [],

  memory = [],

  systemContext = "",

  model = DEFAULT_MODEL,

  prisma,

}) {

  try {


    console.log(
      "AI BRAIN START",
    )



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
    truth => `

SOURCE:
${truth.source}

${truth.answer}

`,
  )
  .join("\n")}

`

        : ""



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



    const combinedKnowledge = [

      ...normalizeArray(
        knowledge,
      ),

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

      memory.length > 0

        ? memory

        : normalizeArray(
            memoryRetrieval.memories,
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



    const finalContext = `

${systemContext}


${truthContext}


${context}


AI SYSTEM RULES:

- Vastaa annetun tiedon perusteella.
- Älä keksi tietoa.
- Jos tieto puuttuu, sano se.
- Ole selkeä ja suora.

IDENTITY SEPARATION:

- Spacemonkey on AI-käyttöjärjestelmän operaattori.
- Wood-Booster on projektiympäristö.
- Älä käytä projektin arvoja osana Spacemonkeyn omaa identiteettiä.
- Käytä Wood-Boosterin liiketoiminta-arvoja vain silloin, kun käyttäjä kysyy Wood-Boosterista, tuotteista tai liiketoiminnasta.
`



    console.log(
      "CONTEXT READY",
      finalContext.length,
    )



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


    console.log(
      "BRAIN RESULT RECEIVED",
    )



    const memoryPipelineResult =
      await processMemoryPipeline({

        message,

        answer,

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


      debug: {

        systemsLoaded:
          systems.length,


        systemContextLoaded:
          Boolean(
            systemContext,
          ),


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


  console.log(
    "OLLAMA REQUEST START",
  )


  const controller =
    new AbortController()



  const timeout =
    setTimeout(
      () => {

        controller.abort()

      },
      60000,
    )



  try {


    const response =
      await fetch(

        `${OLLAMA_URL}/api/chat`,

        {

          method:
            "POST",

          signal:
            controller.signal,


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
                  4096,

              },

            }),

        },

      )



    console.log(
      "OLLAMA STATUS",
      response.status,
    )



    const data =
      await response.json()



    console.log(
      "OLLAMA JSON RECEIVED",
    )



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

  catch(error) {


    if (
      error.name ===
      "AbortError"
    ) {

      throw new Error(
        "Ollama timeout 60s",
      )

    }


    throw error

  }


  finally {

    clearTimeout(
      timeout,
    )

  }

}
