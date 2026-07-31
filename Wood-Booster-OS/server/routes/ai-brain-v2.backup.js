/*
=====================================
WOOD-BOOSTER AI BRAIN V2

EXPRESS ROUTER V1.0

Endpointit:

GET
/api/ai-brain-v2

POST
/api/ai-brain-v2/chat

Router ei:
- sisällä Brainin sisäistä logiikkaa
- valitse moduulia itse
- käsittele credentials-salaisuuksia
- korvaa vanhaa AI Brain -reittiä
=====================================
*/


import express from "express"

import {
  getBrainModuleInfo,
  runBrain,
} from "../services/aiBrainV2/index.js"


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


function normalizeRuntimeContext(
  value,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {}
  }

  return value
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
          normalizeRuntimeContext(
            req.body
              ?.runtimeContext,
          )

        const runtimeContext = {
          ...providedRuntimeContext,

          prisma,

          requestMetadata: {
            ...(providedRuntimeContext
              .requestMetadata ||
              {}),

            transport:
              "http",

            endpoint:
              "/api/ai-brain-v2/chat",
          },
        }

        const result =
          await runBrain({
            message,
            source,
            runtimeContext,
          })

        const statusCode =
          result?.success === false
            ? 400
            : 200

        return res
          .status(statusCode)
          .json(result)
      } catch (error) {
        next(error)
      }
    },
  )


  return router
}


export default createAIBrainV2Router