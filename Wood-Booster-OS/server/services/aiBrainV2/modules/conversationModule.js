/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CONVERSATION MODULE V2.5

Vastuut:
- toimii keskustelun varamoduulina
- välittää pyynnön nykyiselle aiBrain.js:lle
- käyttää memory injection adapteria
- lisää Spacemonkey Core kontekstin
- lisää Spacemonkey Identity Layerin
- debuggaa memory pipelinea

Vanhaa aiBrain.js-tiedostoa ei muuteta.

=====================================
*/


import {
  runAIBrain,
} from "../../aiBrain.js"


import {
  createBrainModule,
} from "../moduleContract.js"


import {
  createMemoryInjectionContext,
} from "../services/memoryInjectionAdapter.js"


import {
  createSpacemonkeyContextText,
} from "../../spacemonkey/contextAdapter.js"


import {
  createSpacemonkeySystemPrompt,
} from "../../spacemonkey/systemPrompt.js"



function normalizeArray(value) {

  return Array.isArray(value)
    ? value
    : []

}



function createSpacemonkeyKnowledge(
  runtimeContext,
) {

  const spacemonkey =
    runtimeContext?.spacemonkey


  if (!spacemonkey) {

    return []

  }



  const coreContent =
    createSpacemonkeyContextText({

      spacemonkey,

    })



  const identityContent =
    createSpacemonkeySystemPrompt({

      spacemonkey,

    })



  return [

    {
      name:
        "SPACEMONKEY_CORE",

      content:
        coreContent,

    },


    {
      name:
        "SPACEMONKEY_SYSTEM_IDENTITY",

      content:
        identityContent,

    },

  ]

}



function createConversationModule() {

  return createBrainModule({

    id:
      "conversation",


    name:
      "Conversation Module",


    version:
      "1.6.0",


    description:
      "Käsittelee keskustelupyynnöt nykyisen AI Brainin avulla Spacemonkey Context, Identity ja Memory tuettuna.",


    priority:
      1000,



    canHandle() {

      return {

        matched:
          true,

        confidence:
          0.1,

        reason:
          "Conversation Module toimii keskustelun varamoduulina.",

      }

    },



    async execute({

      message,

      request,

      runtimeContext = {},

    }) {



      console.log(
        "CONVERSATION MODULE START",
      )



      console.log(
        "RUNTIME MEMORY ITEMS",
        runtimeContext.memoryItems,
      )



      console.log(
        "RUNTIME MEMORY CONTEXT",
        runtimeContext.memoryContext,
      )



      const knowledge =
        normalizeArray(
          runtimeContext.knowledge,
        )



      const spacemonkeyKnowledge =
        createSpacemonkeyKnowledge(
          runtimeContext,
        )



      const finalKnowledge = [

        ...spacemonkeyKnowledge,

        ...knowledge,

      ]



      const conversation =
        normalizeArray(
          runtimeContext.conversation,
        )



      const memoryInjection =
        createMemoryInjectionContext({

          runtimeContext,

        })



      console.log(
        "MEMORY INJECTION RESULT",
      )


      console.log(
        JSON.stringify(
          memoryInjection,
          null,
          2,
        ),
      )



      const result =
        await runAIBrain({

          message,


          knowledge:
            finalKnowledge,


          conversation,


          memory:
            memoryInjection.memory,


          memoryContext:
            memoryInjection.memoryContext,


          model:
            runtimeContext.model,


          prisma:
            runtimeContext.prisma,

        })



      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(

          result?.error ||

          "Nykyinen AI Brain ei pystynyt käsittelemään viestiä."

        )

      }



      return {

        type:
          "conversation_result",


        answer:
          String(
            result.answer ||
            "",
          ).trim(),


        model:
          result.model ||
          null,


        requestId:
          request.requestId,


        memoryProposalCreated:
          result.memoryProposalCreated === true,


        memoryProposal:
          result.memoryProposal ||
          null,


        knowledgeSources:
          normalizeArray(
            result.knowledgeSources,
          ),


        debug:
          result.debug ||
          null,

      }

    },

  })

}



export {

  createConversationModule,

}
