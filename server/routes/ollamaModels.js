import express from "express"

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

/*
 * Listaa paikallisesti asennetut Ollama-mallit Dev Studion
 * mallinvalitsinta varten (ks. src/components/devstudio/
 * ModelPicker.jsx). Käyttää samaa fetch-pohjaista Ollama-yhteyttä
 * kuin loput koodikannan Ollama-kutsut (ks. ollamaClient.js) - ei
 * uutta execFile("ollama", ["list"])-pintaa, joka olisi GitTool.js:n
 * ulkopuolinen, tarpeeton child_process-reitti.
 */
export default function createOllamaModelsRouter() {
  const router = express.Router()

  /*
   * GET /api/ollama-models
   */
  router.get("/ollama-models", async (request, response) => {
    try {
      const ollamaResponse = await fetch(`${OLLAMA_URL}/api/tags`)

      if (!ollamaResponse.ok) {
        return response.status(503).json({
          error: "Ollama ei vastannut - onko se käynnissä?",
        })
      }

      const data = await ollamaResponse.json()

      const names = (data.models || [])
        .map(model => model.name)
        .filter(Boolean)
        .sort()

      response.json(names)
    } catch (error) {
      console.error(error)

      response.status(503).json({
        error: "Ollama ei vastannut - onko se käynnissä?",
      })
    }
  })

  return router
}
