/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CONVERSATION MODULE V2.11


Välittää:

- Spacemonkey Context
- Spacemonkey Personality
- Spacemonkey Response Style
- Creator Identity
- Finnish Culture Context
- Memory
- Knowledge


Guardit:

- käsitellään keskitetysti
- brainRuntime.js
- Spacemonkey Kernel Guard


Ei:

- tee identiteettimuutoksia
- tee käyttäytymiskorjauksia
- kirjoita muistia


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





function normalizeAnswer(value) {

  if (
    typeof value === "string"
  ) {

    return value

  }


  if (
    value === null ||
    value === undefined
  ) {

    return ""

  }


  return JSON.stringify(
    value,
    null,
    2,
  )

}







function createSpacemonkeyKnowledge(
  runtimeContext,
) {


  const spacemonkey =
    runtimeContext?.spacemonkey



  if (!spacemonkey) {

    return []

  }



  return [

    {
      name:
        "SPACEMONKEY_CORE",

      content:
        createSpacemonkeyContextText({
          spacemonkey,
        }),

    },


    {
      name:
        "SPACEMONKEY_SYSTEM_IDENTITY",

      content:
        createSpacemonkeySystemPrompt({
          spacemonkey,
        }),

    },

  ]

}







function createPersonalityKnowledge(
  runtimeContext,
) {


  const personality =
    runtimeContext
      ?.spacemonkeyPersonality



  if (!personality) {

    return []

  }



  return [

    {
      name:
        "SPACEMONKEY_PERSONALITY_RUNTIME",

      content:
        JSON.stringify(
          personality,
          null,
          2,
        ),

    },

  ]

}







function createResponseStyleKnowledge(
  runtimeContext,
) {


  const responseStyle =
    runtimeContext
      ?.spacemonkeyResponseStyle



  if (!responseStyle) {

    return []

  }



  return [

    {
      name:
        "SPACEMONKEY_RESPONSE_STYLE_RUNTIME",

      content:
        JSON.stringify(
          responseStyle,
          null,
          2,
        ),

    },

  ]

}







function createIdentityKnowledge(
  runtimeContext,
) {


  return [

    {
      name:
        "CREATOR_IDENTITY_CONTEXT",

      content:
        JSON.stringify(

          {

            creatorIdentity:
              runtimeContext.creatorIdentityContext ||
              null,


            finnishCulture:
              runtimeContext.finnishCultureContext ||
              null,


            spacemonkeyPersona:
              runtimeContext.spacemonkeyPersonaContext ||
              null,

          },

          null,

          2,

        ),

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
      "2.11.0",


    description:
      "Keskustelumoduuli Context Engine ilman päällekkäisiä guard-käsittelyjä.",


    priority:
      1000,





    canHandle() {

      return {

        matched:
          true,


        confidence:
          0.1,


        reason:
          "Conversation fallback module.",

      }

    },





    async execute({

      message,

      request,

      runtimeContext = {},

    }) {



      const knowledge = [

        ...createSpacemonkeyKnowledge(
          runtimeContext,
        ),


        ...createPersonalityKnowledge(
          runtimeContext,
        ),


        ...createResponseStyleKnowledge(
          runtimeContext,
        ),


        ...createIdentityKnowledge(
          runtimeContext,
        ),


        ...normalizeArray(
          runtimeContext.knowledge,
        ),

      ]







      const memoryInjection =

        createMemoryInjectionContext({

          runtimeContext,

        })







      const result =

        await runAIBrain({

          message,

          knowledge,


          conversation:
            normalizeArray(
              runtimeContext.conversation,
            ),


          memory:
            memoryInjection.memory,


          memoryContext:
            memoryInjection.memoryContext,


          systemContext:
            runtimeContext.systemContext ||
            "",


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

          "AI Brain execution failed."

        )

      }







      return {


        type:
          "conversation_result",


        answer:
          normalizeAnswer(
            result.answer,
          ),


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
