import express from "express"

import { runAgentChat } from "./agentChat.js"


const MAX_HISTORY_MESSAGES = 20


/*
 * Ohut kääre /api/agents/chat:n ympärille.
 *
 * Tämä reitti oli aiemmin oma rinnakkainen toteutuksensa
 * (spacemonkeyBrainFacade.js ja sen kautta koko toinen
 * tekoälyjärjestelmä), vaikka mikään käyttöliittymän osa ei
 * koskaan kutsu sitä. Sama persoona/godfile-sisältö luettiin
 * kahteen kertaan kahdella eri tavalla.
 *
 * Nyt tämä reitti hakee vain conversationId:n perusteella
 * mahdollisen keskusteluhistorian ja delegoi lopun täysin samalle
 * logiikalle kuin /api/agents/chat (runAgentChat) - "Yksi totuus",
 * Constitution laki 5.
 */
export default function createAIBrainChatRouter(prisma) {


  const router =
    express.Router()


  router.post(
    "/chat",
    async (req, res) => {

      try {

        const conversationId =
          req.body.conversationId

        let conversationHistory = []

        if (conversationId) {

          conversationHistory =
            await prisma.message.findMany({
              where: {
                conversationId,
              },
              orderBy: {
                createdAt: "asc",
              },
              take: MAX_HISTORY_MESSAGES,
            })

        }

        const { status, body } =
          await runAgentChat({
            message: req.body.message,
            conversation: conversationHistory,
            systemContext: req.body.systemContext ?? null,
            runtimeContext: req.body.runtimeContext ?? null,
            prisma,
          })

        return res.status(status).json({
          ...body,
          conversationId,
        })

      } catch (error) {

        console.error(
          "AI Brain Chat Error:",
          error,
        )

        res.status(500).json({
          success: false,
          error: error.message,
        })

      }

    },
  )


  return router

}
