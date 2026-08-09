import express from "express"

import {
  generateSpacemonkeyImpulse,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyImpulseEngine.js"

/*
==================================================

SPACEMONKEY IMPULSE ROUTE

POST /api/spacemonkey/impulse
  - on-demand brainstorm / architecture critique

GET /api/spacemonkey/impulse/latest
  - the most recent AUTONOMOUS impulse (nobody asked for it -
    spacemonkeyImpulseScheduler.js generated it on its own schedule
    and logged it via the shared spacemonkeyActivity history)

The generation logic itself lives in spacemonkeyImpulseEngine.js so
the on-demand route and the background scheduler share one
implementation instead of two.

==================================================
*/

export default function createSpacemonkeyImpulseRouter() {
  const router = express.Router()

  router.post("/spacemonkey/impulse", async (req, res) => {
    try {
      const prisma = req.app.locals.prisma

      const result = await generateSpacemonkeyImpulse({
        prisma,
        topic: req.body?.topic,
      })

      if (!result.success) {
        return res.status(502).json({
          success: false,
          error: result.error,
        })
      }

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error("Spacemonkey Impulse error:", error)

      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  router.get("/spacemonkey/impulse/latest", async (req, res) => {
    try {
      const prisma = req.app.locals.prisma

      const latest = await prisma.spacemonkeyActivity.findFirst({
        where: { type: "autonomous_impulse" },
        orderBy: { createdAt: "desc" },
      })

      if (!latest) {
        return res.json({
          success: true,
          data: null,
        })
      }

      const metadata = latest.metadata
        ? JSON.parse(latest.metadata)
        : {}

      res.json({
        success: true,
        data: {
          topic: latest.message,
          impulse: metadata.impulse || "",
          groundedIn: metadata.groundedIn || null,
          createdAt: latest.createdAt,
        },
      })
    } catch (error) {
      console.error("Spacemonkey Impulse (latest) error:", error)

      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  return router
}
