/*
=====================================
WOOD-BOOSTER AI BRAIN V2

EXPRESS ROUTER V1.3

Endpointit:

GET
/api/ai-brain-v2

POST
/api/ai-brain-v2/chat

Sisältää:
- AI Brain V2 HTTP -rajapinnan
- modulaarisen Memory Pipeline -liitännän

POST /chat on ohut kääre /api/agents/chat:n ympärille (runAgentChat,
agentChat.js). Aiemmin tämä reitti kutsui aiBrainV2/index.js:n omaa
runBrain()-moduulijärjestelmää ja sisälsi ison adapterikerroksen sen
tuloksen kääntämiseksi frontend-yhteensopivaksi ("Session Adapter") -
se oli toinen, rinnakkainen toteutus samasta chat-logiikasta kuin
/api/agents/chat, vaikka mikään käyttöliittymän osa ei koskaan
kutsunut tätä reittiä. Adapterikerros poistettu tarpeettomana; jäljellä
on vain tämän reitin oma, aidosti erillinen lisäarvo: Memory Pipeline
(muistiehdotusten generointi vastauksesta).

Router ei:
- sisällä chat-logiikkaa itse (se on agentChat.js:ssä)
- valitse moduulia itse
- käsittele credentials-salaisuuksia
- hyväksy muistiehdotuksia pysyvään muistiin
=====================================
*/


import express from "express"

import {
  getBrainModuleInfo,
} from "../services/aiBrainV2/index.js"

import {
  runAgentChat,
} from "./agentChat.js"

import {
  processMemoryPipeline,
} from "../services/memoryPipelineAdapter.js"


function normalizeMessage(value) {
  return String(value || "")
    .trim()
}


function normalizeSource(value) {
  const source =
    String(value || "")
      .trim()

  if (!source) {
    return "ai-brain-v2-api"
  }

  return source
}


function normalizeObject(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {}
  }

  return value
}


function normalizeConversation(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (conversationMessage) =>
        conversationMessage &&
        conversationMessage.role &&
        conversationMessage.content,
    )
    .map(
      (conversationMessage) => ({
        role:
          String(
            conversationMessage.role,
          ),

        content:
          String(
            conversationMessage.content,
          ),
      }),
    )
}


function createSkippedMemoryPipeline(
  status,
) {
  return {
    success:
      true,

    status,

    memoryProposalCreated:
      false,

    memoryProposal:
      null,

    extractedMemory:
      null,

    validation:
      null,

    error:
      null,
  }
}


async function runResponseMemoryPipeline({
  message,
  response,
  prisma,
}) {
  if (
    !response ||
    response.success === false
  ) {
    return createSkippedMemoryPipeline(
      "response_failed",
    )
  }

  const answer =
    normalizeMessage(
      response.answer ||
      response.response ||
      response.message,
    )

  if (!answer) {
    return createSkippedMemoryPipeline(
      "answer_missing",
    )
  }

  return processMemoryPipeline({
    message,
    answer,

    prismaClient:
      prisma,
  })
}


function attachMemoryPipeline({
  response,
  memoryPipeline,
}) {
  const safeMemoryPipeline =
    memoryPipeline ||
    createSkippedMemoryPipeline(
      "not_processed",
    )

  return {
    ...response,

    memoryPipeline:
      safeMemoryPipeline,

    memoryProposal:
      safeMemoryPipeline
        .memoryProposal ||
      null,

    memoryProposalCreated:
      safeMemoryPipeline
        .memoryProposalCreated ===
      true,
  }
}


function createAIBrainV2Router(
  prisma,
) {
  const router =
    express.Router()


  /*
  =====================================
  STATUS
  =====================================
  */


  router.get(
    "/",
    (req, res) => {
      const modules =
        getBrainModuleInfo()

      res.json({
        success:
          true,

        service:
          "Wood-Booster AI Brain V2",

        status:
          "ready",

        endpoint:
          "/api/ai-brain-v2/chat",

        sessionAdapter: {
          enabled:
            true,

          version:
            "1.1",
        },

        memoryPipeline: {
          enabled:
            true,

          mode:
            "proposal_only",

          approvalRequired:
            true,
        },

        modules,
      })
    },
  )


  /*
  =====================================
  CHAT
  =====================================
  */


  router.post(
    "/chat",
    async (req, res, next) => {
      try {
        const message =
          normalizeMessage(
            req.body?.message,
          )

        if (!message) {
          return res
            .status(400)
            .json({
              success:
                false,

              type:
                "invalid_message",

              source:
                "ai-brain-v2-api",

              answer:
                "Viesti puuttuu.",

              message:
                "Viesti puuttuu.",

              agent:
                "system",

              reason:
                "Message is required.",

              actions:
                [],

              action:
                null,

              memoryPipeline:
                createSkippedMemoryPipeline(
                  "message_missing",
                ),

              memoryProposal:
                null,

              memoryProposalCreated:
                false,

              error:
                "Message is required.",

              code:
                "MESSAGE_REQUIRED",
            })
        }

        const source =
          normalizeSource(
            req.body?.source,
          )

        const providedRuntimeContext =
          normalizeObject(
            req.body
              ?.runtimeContext,
          )

        const providedSystemContext =
          normalizeObject(
            req.body
              ?.systemContext,
          )

        const conversation =
          normalizeConversation(
            req.body
              ?.conversation ??
            providedRuntimeContext
              .conversation,
          )

        const runtimeContext = {
          ...providedRuntimeContext,

          conversation,

          systemContext: {
            ...normalizeObject(
              providedRuntimeContext
                .systemContext,
            ),

            ...providedSystemContext,
          },

          requestMetadata: {
            ...normalizeObject(
              providedRuntimeContext
                .requestMetadata,
            ),

            transport:
              "http",

            endpoint:
              "/api/ai-brain-v2/chat",

            source,
          },
        }

        const {
          status,
          body: chatResponse,
        } =
          await runAgentChat({
            message,

            conversation,

            systemContext:
              runtimeContext.systemContext,

            runtimeContext,

            prisma,
          })

        const memoryPipeline =
          await runResponseMemoryPipeline({
            message,

            response:
              chatResponse,

            prisma,
          })

        const response =
          attachMemoryPipeline({
            response:
              chatResponse,

            memoryPipeline,
          })

        return res
          .status(status)
          .json(response)
      }

      catch (error) {
        next(error)
      }
    },
  )


  return router
}


export {
  attachMemoryPipeline,
  createSkippedMemoryPipeline,
  runResponseMemoryPipeline,
}


export default createAIBrainV2Router
