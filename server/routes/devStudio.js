import express from "express"

import path from "node:path"

import { generatePythonDraft } from "../services/pythonCodeGenerator.js"

import { explainPythonCode } from "../services/pythonCodeExplainer.js"

import { reviewPythonCode } from "../services/pythonCodeReviewer.js"

import { refactorPythonCode } from "../services/pythonCodeRefactorer.js"

import { debugPythonCode } from "../services/pythonCodeDebugger.js"

import {
  getSpacemonkeyToolBus,
  getSpacemonkeyWorkflowEngine,
} from "../services/spacemonkey/spacemonkeyRuntimeBootstrap.js"

import {
  resolveSafeFilePath as resolveSafeGeneratedPythonPath,
  sha256,
} from "../services/spacemonkey/plugins/PythonDeveloper/skills/writePythonCodeSkill.js"

/*
 * Lukee kohdetiedoston NYKYISEN sisällön generated-python-hakemistosta
 * (jos sellainen jo on olemassa) ennen uuden luonnoksen luontia -
 * sama idea kuin JS-puolen generate-code-change-skillillä, jotta
 * write-python-skill voi myöhemmin vertailla originalHashia elävään
 * tiedostoon ja ottaa varmuuskopion ennen ylikirjoitusta.
 */
async function readExistingGeneratedPythonContent(toolBus, filePath) {
  const safePath = resolveSafeGeneratedPythonPath(filePath)

  if (!safePath) {
    return { originalCode: null, originalHash: null }
  }

  const existsResult = await toolBus.execute("file", {
    action: "exists",
    file: safePath,
  })

  if (!existsResult?.success || !existsResult.exists) {
    return { originalCode: null, originalHash: null }
  }

  const readResult = await toolBus.execute("file", {
    action: "read",
    file: safePath,
  })

  if (!readResult?.success) {
    return { originalCode: null, originalHash: null }
  }

  return {
    originalCode: readResult.content,
    originalHash: sha256(readResult.content),
  }
}

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

        const toolBus = getSpacemonkeyToolBus()

        const { originalCode, originalHash } = toolBus
          ? await readExistingGeneratedPythonContent(toolBus, filePath)
          : { originalCode: null, originalHash: null }

        const draft = await prisma.pythonCodeDraft.create({
          data: {
            prompt: prompt || "",
            title: draftTitle || "Python-skripti",
            code: draftCode,
            originalCode,
            originalHash,
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
   * POST /api/python-drafts/refactor
   *
   * Lukee olemassa olevan .py-tiedoston, pyytää AI:ta
   * refaktoroimaan sen, ja tallentaa tuloksen uudeksi
   * PythonCodeDraftiksi ihmisen tarkistettavaksi ja hyväksyttäväksi.
   * Sama draft/approve/write-kierto kuin muillakin luonnoksilla -
   * ei koskaan kirjoita alkuperäistä tiedostoa suoraan.
   */
  router.post(
    "/python-drafts/refactor",
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
          "refactor-python-workflow",
          {
            filePath,
            toolBus,
            refactorPythonCode,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          return response.status(422).json({
            error: skillResult?.error,
            code: skillResult?.code,
          })
        }

        const { originalCode, originalHash } =
          await readExistingGeneratedPythonContent(
            toolBus,
            path.basename(filePath),
          )

        const draft = await prisma.pythonCodeDraft.create({
          data: {
            prompt: `Refaktoroi: ${filePath}`,
            title: skillResult.title,
            code: skillResult.code,
            originalCode,
            originalHash,
            filePath: path.basename(filePath),
            status: "draft",
          },
        })

        response.status(201).json({
          ...draft,
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

  /*
   * POST /api/python-drafts/debug
   *
   * Lukee olemassa olevan .py-tiedoston, pyytää AI:ta
   * diagnosoimaan ongelman (ja valinnaisen virheilmoituksen) ja
   * ehdottamaan korjauksen, ja tallentaa tuloksen uudeksi
   * PythonCodeDraftiksi ihmisen tarkistettavaksi ja hyväksyttäväksi.
   * Sama draft/approve/write-kierto kuin refactor-python - ei
   * koskaan aja koodia eikä kirjoita alkuperäistä tiedostoa suoraan.
   */
  router.post(
    "/python-drafts/debug",
    async (request, response) => {
      try {
        const { filePath, errorMessage } = request.body || {}

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
          "debug-python-workflow",
          {
            filePath,
            errorMessage,
            toolBus,
            debugPythonCode,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          return response.status(422).json({
            error: skillResult?.error,
            code: skillResult?.code,
          })
        }

        const { originalCode, originalHash } =
          await readExistingGeneratedPythonContent(
            toolBus,
            path.basename(filePath),
          )

        const draft = await prisma.pythonCodeDraft.create({
          data: {
            prompt: `Debug: ${filePath}`,
            title: skillResult.title,
            code: skillResult.code,
            originalCode,
            originalHash,
            filePath: path.basename(filePath),
            status: "draft",
          },
        })

        response.status(201).json({
          ...draft,
          diagnosis: skillResult.diagnosis,
        })
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
        if (error.code === "P2025") {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

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
        if (error.code === "P2025") {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

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
          const nextStatus =
            skillResult?.code === "file_changed_since_draft"
              ? "conflict"
              : "write_failed"

          const failed = await prisma.pythonCodeDraft.update({
            where: {
              id: draftId,
            },
            data: {
              status: nextStatus,
              writeError:
                skillResult?.error ||
                "Kirjoitus epäonnistui tuntemattomasta syystä.",
            },
          })

          const statusCode = nextStatus === "conflict" ? 409 : 422

          return response.status(statusCode).json({
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
            backupPath: skillResult.backupPath,
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
   * PUT /api/python-drafts/:id/revert
   *
   * Peruuttaa jo levylle kirjoitetun (status: "written")
   * Python-luonnoksen - sama malli kuin JS-puolen
   * /dev-drafts/:id/revert. Voidaan kutsua milloin tahansa
   * myöhemmin, ei vain samassa istunnossa.
   */
  router.put(
    "/python-drafts/:id/revert",
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

        if (draft.status !== "written") {
          return response.status(409).json({
            error: `Luonnosta ei ole kirjoitettu levylle (status: ${draft.status}).`,
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
          "revert-python-workflow",
          {
            draft,
            toolBus,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          const nextStatus =
            skillResult?.code === "file_changed_since_write"
              ? "revert_conflict"
              : "revert_failed"

          const failed = await prisma.pythonCodeDraft.update({
            where: {
              id: draftId,
            },
            data: {
              status: nextStatus,
              writeError:
                skillResult?.error ||
                "Peruutus epäonnistui tuntemattomasta syystä.",
            },
          })

          const statusCode = nextStatus === "revert_conflict" ? 409 : 422

          return response.status(statusCode).json({
            error: skillResult?.error,
            code: skillResult?.code,
            draft: failed,
          })
        }

        const reverted = await prisma.pythonCodeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "reverted",
            writeError: null,
          },
        })

        response.json(reverted)
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

  /*
   * POST /api/python-review
   *
   * Antaa rakentavan katselmoinnin olemassa olevalle .py-tiedostolle.
   * Vain luku - ei hyväksymiskiertoa, ei tallennusta.
   */
  router.post(
    "/python-review",
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
          "review-python-workflow",
          {
            filePath,
            toolBus,
            reviewPythonCode,
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
          review: skillResult.review,
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
