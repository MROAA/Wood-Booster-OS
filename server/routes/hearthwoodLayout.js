import express from "express"

/*
 * Hearthwood Studio - Free Layout foundation (Stage A). Plain CRUD for
 * per-viewer screen layout preferences (which named block sits where,
 * or whether it's hidden) - deliberately NOT routed through
 * hearthwoodPatchbay.js's preview/apply/qa-gate/git-snapshot machinery,
 * since this is preference data, not game source code, and every drag-
 * save would otherwise trigger a full lint/build cycle for no reason.
 *
 * One row per screen (HearthwoodScreenLayout.positions, JSON-stringified
 * { [elementKey]: { x, y } | { hidden: true } }) - single local user, no
 * concurrency concerns, matches shopLayout.js's own "one JSON blob"
 * shape for the same kind of data.
 */
export default function createHearthwoodLayoutRouter(prisma) {
  const router = express.Router()

  function isValidPositions(positions) {
    if (!positions || typeof positions !== "object" || Array.isArray(positions)) return false

    return Object.values(positions).every((value) => {
      if (!value || typeof value !== "object") return false
      if (value.hidden === true) return true
      return typeof value.x === "number" && typeof value.y === "number"
    })
  }

  /*
   * GET /api/hearthwood-layout/:screenId
   */
  router.get("/hearthwood-layout/:screenId", async (request, response) => {
    try {
      const row = await prisma.hearthwoodScreenLayout.findUnique({
        where: { screenId: request.params.screenId },
      })

      if (!row) {
        return response.json({ screenId: request.params.screenId, positions: {} })
      }

      response.json({
        screenId: row.screenId,
        positions: JSON.parse(row.positions),
        updatedAt: row.updatedAt,
      })
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * PUT /api/hearthwood-layout/:screenId
   * body: { positions: { [elementKey]: { x, y } | { hidden: true } } }
   */
  router.put("/hearthwood-layout/:screenId", async (request, response) => {
    try {
      const { positions } = request.body || {}

      if (!isValidPositions(positions)) {
        return response.status(400).json({
          error: "positions must be an object of { x, y } or { hidden: true } entries",
        })
      }

      const row = await prisma.hearthwoodScreenLayout.upsert({
        where: { screenId: request.params.screenId },
        update: { positions: JSON.stringify(positions) },
        create: { screenId: request.params.screenId, positions: JSON.stringify(positions) },
      })

      response.json({
        screenId: row.screenId,
        positions: JSON.parse(row.positions),
        updatedAt: row.updatedAt,
      })
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * DELETE /api/hearthwood-layout/:screenId
   */
  router.delete("/hearthwood-layout/:screenId", async (request, response) => {
    try {
      await prisma.hearthwoodScreenLayout.delete({
        where: { screenId: request.params.screenId },
      })

      response.status(204).end()
    } catch (error) {
      if (error.code === "P2025") {
        return response.status(204).end()
      }

      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  return router
}
