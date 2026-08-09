import express from "express"

import { generatePythonDraft } from "../services/pythonCodeGenerator.js"

import { explainPythonCode } from "../services/pythonCodeExplainer.js"

import {
  getSpacemonkeyToolBus,
  getSpacemonkeyWorkflowEngine,
} from "../services/spacemonkey/spacemonkeyRuntimeBootstrap.js"

export default function createDevStudioRouter(prisma) {
  const router = express.Router()

  /*
   * POST /api/python-drafts
   *
   * Luo uuden Python-koodiluonnoksen - joko AI:n avulla (useAI: true)
   * tai käsin annetusta koodista. Ei koskaan kirjoita mitään levylle
   * automaattisesti - luonnos jää odottamaan ihmisen tarkistusta.
   */
  router.post(
    "/python-drafts",
    async (request, response) => {
      try {
        const { useAI, prompt, title, code, filePath } =
          request.body || {}

        let draftTitle = title
        let draftCode = code

        if (useAI) {
          if (!prompt) {
            return response.status(400).json({
              error: "Pyyntö (prompt) vaaditaan kun useAI:true",
            })
          }

          const generated = await generatePythonDraft({
            prompt,
          })

          draftTitle = generated.title
          draftCode = generated.code
        }

        if (!draftCode || !filePath) {
          return response.status(400).json({
            error: "Koodi ja tiedostopolku vaaditaan, tai käytä useAI:true",
          })
        }

        const draft = await prisma.pythonCodeDraft.create({
          data: {
            prompt: prompt || "",
            title: draftTitle || "Python-skripti",
            code: draftCode,
            filePath,
            status: "draft",
          },
        })

        response.status(201).json(draft)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * GET /api/python-drafts
   */
  router.get(
    "/python-drafts",
    async (request, response) => {
      try {
        const drafts = await prisma.pythonCodeDraft.findMany({
          orderBy: {
            createdAt: "desc",
          },
        })

        response.json(drafts)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/python-drafts/:id
   *
   * Käsin tehdyt muokkaukset otsikkoon/koodiin/tiedostopolkuun.
   */
  router.put(
    "/python-drafts/:id",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const { title, code, filePath } = request.body || {}

        const updateData = {}

        if (title !== undefined) {
          updateData.title = String(title)
        }

        if (code !== undefined) {
          updateData.code = String(code)
        }

        if (filePath !== undefined) {
          updateData.filePath = String(filePath)
        }

        const draft = await prisma.pythonCodeDraft.update({
          where: {
            id: draftId,
          },
          data: updateData,
        })

        response.json(draft)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/python-drafts/:id/approve
   *
   * Ihmisen hyväksyntä - ainoa tilasiirtymä joka merkitsee luonnoksen
   * valmiiksi kirjoitettavaksi levylle.
   */
  router.put(
    "/python-drafts/:id/approve",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.pythonCodeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "approved",
          },
        })

        response.json(draft)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/python-drafts/:id/write
   *
   * Kirjoittaa jo hyväksytyn (status: "approved") luonnoksen levylle
   * Python Developer -pluginin workflow'n kautta.
   */
  router.put(
    "/python-drafts/:id/write",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.pythonCodeDraft.findUnique({
          where: {
            id: draftId,
          },
        })

        if (!draft) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        if (draft.status !== "approved") {
          return response.status(409).json({
            error: `Luonnos ei ole hyväksytty (status: ${draft.status}). Hyväksy luonnos ensin.`,
          })
        }

        const workflowEngine = getSpacemonkeyWorkflowEngine()

        if (!workflowEngine) {
          return response.status(503).json({
            error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
          })
        }

        const toolBus = getSpacemonkeyToolBus()

        const workflowResult = await workflowEngine.execute(
          "write-python-workflow",
          {
            draftId,
            prisma,
            toolBus,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          const failed = await prisma.pythonCodeDraft.update({
            where: {
              id: draftId,
            },
            data: {
              status: "write_failed",
              writeError:
                skillResult?.error ||
                "Kirjoitus epäonnistui tuntemattomasta syystä.",
            },
          })

          return response.status(422).json({
            error: skillResult?.error,
            code: skillResult?.code,
            draft: failed,
          })
        }

        const written = await prisma.pythonCodeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "written",
            writtenAt: new Date(),
            writeError: null,
          },
        })

        response.json(written)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * POST /api/python-explain
   *
   * Selittää olemassa olevan .py-tiedoston sisällön luonnollisella
   * kielellä. Vain luku - ei hyväksymiskiertoa, ei tallennusta,
   * turvallinen suorittaa suoraan.
   */
  router.post(
    "/python-explain",
    async (request, response) => {
      try {
        const { filePath } = request.body || {}

        if (!filePath) {
          return response.status(400).json({
            error: "Tiedostopolku (filePath) vaaditaan",
          })
        }

        const workflowEngine = getSpacemonkeyWorkflowEngine()

        if (!workflowEngine) {
          return response.status(503).json({
            error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
          })
        }

        const toolBus = getSpacemonkeyToolBus()

        const workflowResult = await workflowEngine.execute(
          "explain-python-workflow",
          {
            filePath,
            toolBus,
            explainPythonCode,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          return response.status(422).json({
            error: skillResult?.error,
            code: skillResult?.code,
          })
        }

        response.json({
          filePath: skillResult.filePath,
          explanation: skillResult.explanation,
        })
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  return router
}
