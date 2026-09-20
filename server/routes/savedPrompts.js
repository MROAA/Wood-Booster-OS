import express from "express"

/*
 * Dev Studion tallennetut/suosikki-pyynnöt. Yksinkertainen CRUD (ei
 * PUT/päivitystä - poisto + uudelleentallennus riittää suosikkilistalle).
 * "lane" erottaa kumman välilehden suosikkeja rivi koskee - "koodi"
 * (jaettu /koodi-chat + "Useampi tiedosto" -paneeli, sama arvo jota
 * agentChat.js jo käyttää Message.mode-kentässä) tai "python"
 * (Python-työkalut-välilehti).
 */
export default function createSavedPromptsRouter(prisma) {
  const router = express.Router()

  const ALLOWED_LANES = new Set(["koodi", "python"])

  /*
   * GET /api/saved-prompts?lane=koodi
   */
  router.get("/saved-prompts", async (request, response) => {
    try {
      const { lane } = request.query

      if (lane && !ALLOWED_LANES.has(lane)) {
        return response.status(400).json({
          error: "Tuntematon lane",
        })
      }

      const prompts = await prisma.savedPrompt.findMany({
        where: lane ? { lane } : undefined,
        orderBy: { createdAt: "desc" },
      })

      response.json(prompts)
    } catch (error) {
      console.error(error)

      response.status(500).json({
        error: error.message,
      })
    }
  })

  /*
   * POST /api/saved-prompts
   */
  router.post("/saved-prompts", async (request, response) => {
    try {
      const { lane, label, prompt } = request.body || {}

      if (!ALLOWED_LANES.has(lane)) {
        return response.status(400).json({
          error: "Tuntematon lane",
        })
      }

      if (!label?.trim() || !prompt?.trim()) {
        return response.status(400).json({
          error: "Otsikko (label) ja teksti (prompt) vaaditaan",
        })
      }

      const saved = await prisma.savedPrompt.create({
        data: {
          lane,
          label: label.trim(),
          prompt: prompt.trim(),
        },
      })

      response.status(201).json(saved)
    } catch (error) {
      console.error(error)

      response.status(500).json({
        error: error.message,
      })
    }
  })

  /*
   * DELETE /api/saved-prompts/:id
   */
  router.delete("/saved-prompts/:id", async (request, response) => {
    try {
      await prisma.savedPrompt.delete({
        where: { id: Number(request.params.id) },
      })

      response.status(204).end()
    } catch (error) {
      if (error.code === "P2025") {
        return response.status(404).json({
          error: "Suosikkia ei löytynyt",
        })
      }

      console.error(error)

      response.status(500).json({
        error: error.message,
      })
    }
  })

  return router
}
