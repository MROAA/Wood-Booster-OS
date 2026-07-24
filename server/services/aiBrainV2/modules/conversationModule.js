/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CONVERSATION MODULE

Vastuut:
- toimii keskustelun varamoduulina
- välittää pyynnön nykyiselle aiBrain.js:lle
- muuntaa vanhan AI Brainin vastauksen
  AI Brain v2.0:n moduulitulokseksi

Vanhaa aiBrain.js-tiedostoa ei muuteta.
=====================================
*/


import {
  runAIBrain,
} from "../../aiBrain.js"

import {
  createBrainModule,
} from "../moduleContract.js"


function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : []
}


function createConversationModule() {
  return createBrainModule({
    id:
      "conversation",

    name:
      "Conversation Module",

    version:
      "1.0.0",

    description:
      "Käsittelee keskustelupyynnöt nykyisen AI Brainin avulla.",

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
      runtimeContext,
    }) {
      const knowledge =
        normalizeArray(
          runtimeContext.knowledge,
        )

      const conversation =
        normalizeArray(
          runtimeContext.conversation,
        )

      const result =
        await runAIBrain({
          message,
          knowledge,
          conversation,
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
          "Nykyinen AI Brain ei pystynyt käsittelemään viestiä.",
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
          result.memoryProposalCreated ===
          true,

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
