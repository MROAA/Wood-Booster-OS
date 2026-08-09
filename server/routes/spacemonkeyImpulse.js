import express from "express"

import { runAIBrain } from "../services/aiBrain.js"

import {
  getActivityHistory,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyActivityService.js"

import {
  getDecisionState,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyDecisionStateBridge.js"

/*
==================================================

SPACEMONKEY IMPULSE ROUTE

POST /api/spacemonkey/impulse

The "autonomous brainstorm / architecture critique" endpoint from the
Neural Architecture PRD. Reuses the existing production chat pipeline
(runAIBrain: persona + knowledge + memory + Ahma Finnish refinement +
response guard) instead of a new bespoke LLM caller, and grounds the
prompt in real recent activity and the current decision state rather
than asking the model to invent context.

If no topic is given in the request body, it falls back to
Spacemonkey's own current recommendation (from the decision/cognitive
state bridge) as the topic - that's what makes it "autonomous".

==================================================
*/

function buildImpulsePrompt(topic) {
  return (
    "Anna rohkea, konkreettinen ja perusteltu arkkitehtuuri- tai " +
    `kehitysehdotus seuraavasta aiheesta: "${topic}". ` +
    "Ole suora: jos näet jotain huonoa nykyisessä suunnassa, sano se " +
    "ja ehdota parempi vaihtoehto. Anna 2-4 konkreettista, perusteltua " +
    "ehdotusta - älä yleisluontoista jargonia. Älä kysy lisätietoja, " +
    "vastaa suoraan annetulla tiedolla."
  )
}

export default function createSpacemonkeyImpulseRouter() {
  const router = express.Router()

  router.post("/spacemonkey/impulse", async (req, res) => {
    try {
      const prisma = req.app.locals.prisma

      const requestedTopic = String(req.body?.topic || "").trim()

      const [decision, recentActivity] = await Promise.all([
        getDecisionState({ prisma }),
        getActivityHistory({ prisma, limit: 5 }),
      ])

      const topic =
        requestedTopic ||
        decision.recommendation ||
        "Wood-Booster HQ:n arkkitehtuurin seuraava kehitysaskel"

      const knowledge = recentActivity.length
        ? [
            {
              name: "RECENT_SPACEMONKEY_ACTIVITY",
              content: recentActivity
                .map((item) => `- [${item.module}] ${item.message}`)
                .join("\n"),
            },
          ]
        : []

      const result = await runAIBrain({
        message: buildImpulsePrompt(topic),
        knowledge,
        conversation: [],
        prisma,
      })

      if (!result.success) {
        return res.status(502).json({
          success: false,
          error: result.error || "Impulse generation failed",
        })
      }

      res.json({
        success: true,
        data: {
          topic,
          autonomous: !requestedTopic,
          impulse: result.answer,
          groundedIn: {
            decisionState: decision.state,
            recentActivityEvents: recentActivity.length,
          },
        },
      })
    } catch (error) {
      console.error("Spacemonkey Impulse error:", error)

      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  return router
}
