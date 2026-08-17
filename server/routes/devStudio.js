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

import { verifyProposedPythonChange } from "../services/devStudio/verifyProposedPythonChange.js"

import { checkPullRequestStatus } from "../services/devStudio/pullRequestStatus.js"

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

/*
 * Turvaverkko pienen paikallisen mallin hallusinoimia Python-importteja
 * vastaan - ei koskaan estä mitään, palauttaa aina listan (tyhjä jos ei
 * huomautettavaa) tai tyhjän listan jos tarkistus itse epäonnistuu
 * jostain syystä. Sama malli kuin devMultiFileChangeStudio.js:n
 * checkReferences()-apufunktiolla JS-puolella.
 */
async function checkPythonReferences({ workflowEngine, toolBus, proposedCode }) {
  if (!workflowEngine || !toolBus) {
    return []
  }

  try {
    const result = await workflowEngine.execute(
      "check-python-references-workflow",
      { proposedCode, toolBus },
    )

    return result.results?.[0]?.unresolvedReferences || []
  } catch (error) {
    console.error("Python-viittaustarkistus epäonnistui:", error)

    return []
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
        const { useAI, prompt, title, code, filePath, model } =
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
            model,
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

        const workflowEngine = getSpacemonkeyWorkflowEngine()

        const { originalCode, originalHash } = toolBus
          ? await readExistingGeneratedPythonContent(toolBus, filePath)
          : { originalCode: null, originalHash: null }

        const unresolvedReferences = await checkPythonReferences({
          workflowEngine,
          toolBus,
          proposedCode: draftCode,
        })

        const verification = (workflowEngine && toolBus)
          ? await verifyProposedPythonChange({
              workflowEngine,
              toolBus,
              prompt: prompt || "",
              filePath,
              proposedCode: draftCode,
            })
          : {
              testCode: null,
              testStatus: "error",
              testOutput: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
              testSkippedReason: null,
            }

        const draft = await prisma.pythonCodeDraft.create({
          data: {
            prompt: prompt || "",
            title: draftTitle || "Python-skripti",
            code: draftCode,
            originalCode,
            originalHash,
            filePath,
            status: "draft",
            unresolvedReferences:
              unresolvedReferences.length > 0
                ? JSON.stringify(unresolvedReferences)
                : null,
            testCode: verification.testCode,
            testStatus: verification.testStatus,
            testOutput: verification.testOutput,
            testSkippedReason: verification.testSkippedReason,
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
        const { filePath, model } = request.body || {}

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
            model,
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

        const unresolvedReferences = await checkPythonReferences({
          workflowEngine,
          toolBus,
          proposedCode: skillResult.code,
        })

        const verification = await verifyProposedPythonChange({
          workflowEngine,
          toolBus,
          prompt: `Refaktoroi: ${filePath}`,
          filePath: path.basename(filePath),
          proposedCode: skillResult.code,
        })

        const draft = await prisma.pythonCodeDraft.create({
          data: {
            prompt: `Refaktoroi: ${filePath}`,
            title: skillResult.title,
            code: skillResult.code,
            originalCode,
            originalHash,
            filePath: path.basename(filePath),
            status: "draft",
            unresolvedReferences:
              unresolvedReferences.length > 0
                ? JSON.stringify(unresolvedReferences)
                : null,
            testCode: verification.testCode,
            testStatus: verification.testStatus,
            testOutput: verification.testOutput,
            testSkippedReason: verification.testSkippedReason,
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
        const { filePath, errorMessage, model } = request.body || {}

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
            model,
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

        const unresolvedReferences = await checkPythonReferences({
          workflowEngine,
          toolBus,
          proposedCode: skillResult.code,
        })

        const verification = await verifyProposedPythonChange({
          workflowEngine,
          toolBus,
          prompt: `Debug: ${filePath}`,
          filePath: path.basename(filePath),
          proposedCode: skillResult.code,
        })

        const draft = await prisma.pythonCodeDraft.create({
          data: {
            prompt: `Debug: ${filePath}`,
            title: skillResult.title,
            code: skillResult.code,
            originalCode,
            originalHash,
            filePath: path.basename(filePath),
            status: "draft",
            unresolvedReferences:
              unresolvedReferences.length > 0
                ? JSON.stringify(unresolvedReferences)
                : null,
            testCode: verification.testCode,
            testStatus: verification.testStatus,
            testOutput: verification.testOutput,
            testSkippedReason: verification.testSkippedReason,
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
   * GET /api/python-drafts/:id
   */
  router.get(
    "/python-drafts/:id",
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
   * PUT /api/python-drafts/:id/revise
   *
   * Pyytää AI:ta tuottamaan UUDEN version SAMASTA luonnoksesta,
   * käyttäjän vapaan palautteen perusteella - sama idea kuin
   * devCodeChangeStudio.js:n /dev-drafts/:id/revise. Toimii vain
   * odottavalle luonnokselle (status: "draft").
   *
   * Lukee kohdetiedoston elävän sisällön uudelleen
   * readExistingGeneratedPythonContent():lla ennen tallennusta - sama
   * itsekorjautuva ajantasaisuus jonka write-python-skill jo antaa
   * kirjoitukselle.
   */
  router.put(
    "/python-drafts/:id/revise",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const existing = await prisma.pythonCodeDraft.findUnique({
          where: {
            id: draftId,
          },
        })

        if (!existing) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        if (existing.status !== "draft") {
          return response.status(409).json({
            error: `Luonnos ei odota tarkistusta (status: ${existing.status}).`,
          })
        }

        const { feedback } = request.body || {}

        if (!feedback || !String(feedback).trim()) {
          return response.status(400).json({
            error: "Palaute (feedback) vaaditaan",
          })
        }

        const augmentedPrompt =
          `ALKUPERÄINEN PYYNTÖ:\n${existing.prompt}\n\n` +
          `AIEMPI EHDOTUS (koko tiedoston sisältö):\n${existing.code}\n\n` +
          `KÄYTTÄJÄN PALAUTE EHDOTUKSEEN:\n${String(feedback).trim()}\n\n` +
          "TEHTÄVÄ: Tuota UUSI versio koko tiedoston sisällöstä, joka " +
          "toteuttaa alkuperäisen pyynnön ja ottaa huomioon käyttäjän " +
          "palautteen."

        const generated = await generatePythonDraft({
          prompt: augmentedPrompt,
        })

        const toolBus = getSpacemonkeyToolBus()

        const workflowEngine = getSpacemonkeyWorkflowEngine()

        const { originalCode, originalHash } = toolBus
          ? await readExistingGeneratedPythonContent(toolBus, existing.filePath)
          : { originalCode: null, originalHash: null }

        const unresolvedReferences = await checkPythonReferences({
          workflowEngine,
          toolBus,
          proposedCode: generated.code,
        })

        const verification = (workflowEngine && toolBus)
          ? await verifyProposedPythonChange({
              workflowEngine,
              toolBus,
              prompt: augmentedPrompt,
              filePath: existing.filePath,
              proposedCode: generated.code,
            })
          : {
              testCode: null,
              testStatus: "error",
              testOutput: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
              testSkippedReason: null,
            }

        const revised = await prisma.pythonCodeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            title: generated.title,
            code: generated.code,
            originalCode,
            unresolvedReferences:
              unresolvedReferences.length > 0
                ? JSON.stringify(unresolvedReferences)
                : null,
            testCode: verification.testCode,
            testStatus: verification.testStatus,
            testOutput: verification.testOutput,
            testSkippedReason: verification.testSkippedReason,
            originalHash,
          },
        })

        response.json(revised)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/python-drafts/:id/reject
   *
   * Sama malli kuin devCodeChangeStudio.js:n /dev-drafts/:id/reject.
   */
  router.put(
    "/python-drafts/:id/reject",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const existing = await prisma.pythonCodeDraft.findUnique({
          where: {
            id: draftId,
          },
        })

        if (!existing) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        if (existing.status === "written") {
          return response.status(409).json({
            error: "Jo levylle kirjoitettua luonnosta ei voi hylätä.",
          })
        }

        const rejected = await prisma.pythonCodeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "rejected",
          },
        })

        response.json(rejected)
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
   * Ei enää kirjoita suoraan levylle - luo tuoreen git-haaran,
   * committaa, pushaa, ja avaa GitHub Pull Requestin Python Developer
   * -pluginin PR-workflow'n kautta. writePythonCodeSkill.js/
   * writePythonCodeWorkflow.js EIVÄT käytä tätä reittiä enää, mutta
   * pysyvät täysin ennallaan - Historian Peruuta-nappi toimii yhä
   * jokaiselle jo ennen tätä ominaisuutta kirjoitetulle "written"-
   * riville.
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

        if (draft.status !== "approved" && draft.status !== "pr_failed") {
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
          "write-python-pull-request-workflow",
          {
            title: draft.title,
            explanation: null,
            prompt: draft.prompt,
            filePath: draft.filePath,
            code: draft.code,
            originalHash: draft.originalHash,
            toolBus,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          const nextStatus =
            skillResult?.code === "file_changed_since_draft"
              ? "conflict"
              : "pr_failed"

          const failed = await prisma.pythonCodeDraft.update({
            where: {
              id: draftId,
            },
            data: {
              status: nextStatus,
              writeError:
                skillResult?.error ||
                "Pull requestin luonti epäonnistui tuntemattomasta syystä.",
            },
          })

          const statusCode = nextStatus === "conflict" ? 409 : 422

          return response.status(statusCode).json({
            error: skillResult?.error,
            code: skillResult?.code,
            draft: failed,
          })
        }

        const opened = await prisma.pythonCodeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "pr_open",
            writtenAt: new Date(),
            writeError: null,
            prUrl: skillResult.prUrl,
            prNumber: skillResult.prNumber,
            prBranch: skillResult.prBranch,
          },
        })

        response.json(opened)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/python-drafts/:id/check-pr-status
   *
   * Ei automaattista pollausta - tarkistaa GitHubilta PR:n tilan vain
   * kun ihminen sitä nimenomaan pyytää.
   */
  router.put(
    "/python-drafts/:id/check-pr-status",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.pythonCodeDraft.findUnique({
          where: { id: draftId },
        })

        if (!draft) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        if (!draft.prNumber) {
          return response.status(409).json({
            error: "Luonnoksella ei ole avointa Pull Requestia.",
          })
        }

        const { state } = await checkPullRequestStatus(draft.prNumber)

        const nextStatus =
          state === "MERGED"
            ? "pr_merged"
            : state === "CLOSED"
              ? "pr_closed"
              : draft.status

        const updated = await prisma.pythonCodeDraft.update({
          where: { id: draftId },
          data: { status: nextStatus },
        })

        response.json(updated)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/python-drafts/:id/revert-pr
   *
   * Peruuttaa jo YHDISTETYN Pull Requestin avaamalla toisen,
   * peruuttavan PR:n - sama jaettu revert-pull-request-workflow jota
   * JS-puolikin käyttää (puhdasta git-plumbingia, ei kielikohtaista
   * logiikkaa). Vain "pr_merged"-tilasta (tai uudelleenyritys
   * "pr_revert_failed"-tilasta).
   */
  router.put(
    "/python-drafts/:id/revert-pr",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.pythonCodeDraft.findUnique({
          where: { id: draftId },
        })

        if (!draft) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        if (
          draft.status !== "pr_merged" &&
          draft.status !== "pr_revert_failed"
        ) {
          return response.status(409).json({
            error: `Luonnoksen Pull Request ei ole yhdistetty (status: ${draft.status}).`,
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
          "revert-pull-request-workflow",
          {
            prNumber: draft.prNumber,
            originalTitle: draft.title,
            toolBus,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          const failed = await prisma.pythonCodeDraft.update({
            where: { id: draftId },
            data: {
              status: "pr_revert_failed",
              writeError:
                skillResult?.error ||
                "Peruutus-PR:n luonti epäonnistui tuntemattomasta syystä.",
            },
          })

          return response.status(422).json({
            error: skillResult?.error,
            code: skillResult?.code,
            draft: failed,
          })
        }

        const opened = await prisma.pythonCodeDraft.update({
          where: { id: draftId },
          data: {
            status: "pr_revert_open",
            writeError: null,
            revertPrUrl: skillResult.prUrl,
            revertPrNumber: skillResult.prNumber,
            revertPrBranch: skillResult.prBranch,
          },
        })

        response.json(opened)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/python-drafts/:id/check-revert-pr-status
   *
   * Ei automaattista pollausta - tarkistaa GitHubilta peruutus-PR:n
   * tilan vain kun ihminen sitä nimenomaan pyytää.
   */
  router.put(
    "/python-drafts/:id/check-revert-pr-status",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.pythonCodeDraft.findUnique({
          where: { id: draftId },
        })

        if (!draft) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        if (!draft.revertPrNumber) {
          return response.status(409).json({
            error: "Luonnoksella ei ole avointa peruutus-Pull Requestia.",
          })
        }

        const { state } = await checkPullRequestStatus(draft.revertPrNumber)

        const nextStatus =
          state === "MERGED"
            ? "pr_revert_merged"
            : state === "CLOSED"
              ? "pr_revert_closed"
              : draft.status

        const updated = await prisma.pythonCodeDraft.update({
          where: { id: draftId },
          data: { status: nextStatus },
        })

        response.json(updated)
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
