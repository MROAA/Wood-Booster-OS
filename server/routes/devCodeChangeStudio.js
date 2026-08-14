import express from "express"

import crypto from "node:crypto"

import { diffLines } from "diff"

import { generateCodeChange } from "../services/codeChangeGenerator.js"

import { generateVerificationTest } from "../services/verificationTestGenerator.js"

import {
  getSpacemonkeyToolBus,
  getSpacemonkeyWorkflowEngine,
} from "../services/spacemonkey/spacemonkeyRuntimeBootstrap.js"

/*
 * Ajaa tarkistustestin generoinnin ja suorituksen ehdotetulle
 * muutokselle. Palauttaa aina jonkin testStatus-arvon eikä koskaan
 * heitä - jos itse tarkistus epäonnistuu (esim. Ollama-virhe),
 * palautetaan testStatus:"error" sen sijaan että estettäisiin koko
 * koodiehdotuksen näyttäminen käyttäjälle. Ei koskaan kosketa
 * todellista kohdetiedostoa - vain omaa hiekkalaatikkoaan
 * (.dev-studio-verification/, ks. verificationSandbox.js).
 */
async function verifyProposedChange({
  workflowEngine,
  toolBus,
  prompt,
  filePath,
  proposedCode,
}) {
  try {
    const generateResult = await workflowEngine.execute(
      "generate-verification-test-workflow",
      {
        prompt,
        filePath,
        proposedCode,
        toolBus,
        generateVerificationTest,
      },
    )

    const generateSkillResult = generateResult.results?.[0]

    if (!generateSkillResult?.success) {
      return {
        testCode: null,
        testStatus: "error",
        testOutput: generateSkillResult?.error || null,
        testSkippedReason: null,
      }
    }

    if (generateSkillResult.skipped) {
      return {
        testCode: null,
        testStatus: "skipped",
        testOutput: null,
        testSkippedReason: generateSkillResult.skippedReason,
      }
    }

    const runResult = await workflowEngine.execute(
      "run-verification-test-workflow",
      {
        runId: generateSkillResult.runId,
        testFilePath: generateSkillResult.testFilePath,
        skipped: false,
      },
    )

    const runSkillResult = runResult.results?.[0]

    if (!runSkillResult?.success) {
      return {
        testCode: generateSkillResult.testCode,
        testStatus: "error",
        testOutput: runSkillResult?.error || null,
        testSkippedReason: null,
      }
    }

    return {
      testCode: generateSkillResult.testCode,
      testStatus: runSkillResult.testStatus,
      testOutput: runSkillResult.testOutput || null,
      testSkippedReason: null,
    }
  } catch (error) {
    return {
      testCode: null,
      testStatus: "error",
      testOutput: error.message,
      testSkippedReason: null,
    }
  }
}

/*
 * Dev Studion "Chat"-välilehden reitit: chat-tyylinen
 * draft/approve/write-kierto mille tahansa sallitulle
 * projektitiedostolle (ks. plugins/CodeChangeDeveloper). Pidetty
 * omana tiedostonaan erillään devStudio.js:stä (joka on
 * Python-vetoinen ja jo 550+ riviä) - Plugin First -periaate koskee
 * myös reittien erillään pitämistä, ei vain palvelinpuolen
 * moduuleja.
 *
 * Mikään näistä reiteistä ei koskaan kirjoita tiedostoa muuten kuin
 * PUT /dev-drafts/:id/write kautta, ja se puolestaan suorittaa
 * write-code-change-workflow'n vain jos luonnoksen status on jo
 * "approved" - sama porttimalli kuin devStudio.js:n
 * python-drafts-reiteillä.
 *
 * POST /dev-drafts ajaa lisäksi automaattisesti (ilman erillistä
 * hyväksyntää) tarkistustestin ehdotetulle muutokselle
 * verifyProposedChange():n kautta - tämä on turvallista tehdä
 * automaattisesti koska se koskee vain omaa hiekkalaatikkoaan
 * (.dev-studio-verification/), ei koskaan todellista
 * kohdetiedostoa.
 */
export default function createDevCodeChangeRouter(prisma) {
  const router = express.Router()

  function withDiff(draft) {
    return {
      ...draft,
      diff: diffLines(draft.originalCode || "", draft.proposedCode || ""),
    }
  }

  /*
   * POST /api/dev-drafts
   *
   * Luo uuden CodeChangeDraftin AI:n avulla annetusta pyynnöstä ja
   * kohdetiedostosta. Ei koskaan kirjoita mitään levylle - luonnos
   * jää odottamaan ihmisen tarkistusta.
   */
  router.post(
    "/dev-drafts",
    async (request, response) => {
      try {
        const { prompt, filePath } = request.body || {}

        if (!prompt || !filePath) {
          return response.status(400).json({
            error: "Pyyntö (prompt) ja tiedostopolku (filePath) vaaditaan",
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
          "generate-code-change-workflow",
          {
            prompt,
            filePath,
            toolBus,
            generateCodeChange,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          return response.status(422).json({
            error: skillResult?.error,
            code: skillResult?.code,
          })
        }

        const originalHash =
          skillResult.originalCode === null
            ? null
            : crypto
                .createHash("sha256")
                .update(skillResult.originalCode, "utf8")
                .digest("hex")

        const verification = await verifyProposedChange({
          workflowEngine,
          toolBus,
          prompt,
          filePath: skillResult.filePath,
          proposedCode: skillResult.proposedCode,
        })

        const draft = await prisma.codeChangeDraft.create({
          data: {
            prompt,
            title: skillResult.title,
            explanation: skillResult.explanation,
            filePath: skillResult.filePath,
            originalCode: skillResult.originalCode,
            proposedCode: skillResult.proposedCode,
            originalHash,
            status: "draft",
            testCode: verification.testCode,
            testStatus: verification.testStatus,
            testOutput: verification.testOutput,
            testSkippedReason: verification.testSkippedReason,
          },
        })

        response.status(201).json(withDiff(draft))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * GET /api/dev-drafts
   */
  router.get(
    "/dev-drafts",
    async (request, response) => {
      try {
        const drafts = await prisma.codeChangeDraft.findMany({
          orderBy: {
            createdAt: "desc",
          },
        })

        response.json(drafts.map(withDiff))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * GET /api/dev-drafts/:id
   */
  router.get(
    "/dev-drafts/:id",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.codeChangeDraft.findUnique({
          where: {
            id: draftId,
          },
        })

        if (!draft) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        response.json(withDiff(draft))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/dev-drafts/:id
   *
   * Käsin tehty muokkaus ehdotettuun sisältöön ennen hyväksyntää.
   */
  router.put(
    "/dev-drafts/:id",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const existing = await prisma.codeChangeDraft.findUnique({
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
            error: "Jo levylle kirjoitettua luonnosta ei voi enää muokata.",
          })
        }

        const { proposedCode } = request.body || {}

        if (proposedCode === undefined) {
          return response.status(400).json({
            error: "proposedCode vaaditaan",
          })
        }

        const draft = await prisma.codeChangeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            proposedCode: String(proposedCode),
          },
        })

        response.json(withDiff(draft))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/dev-drafts/:id/approve
   *
   * Ihmisen hyväksyntä - ei vielä kirjoita mitään, vain merkitsee
   * luonnoksen kirjoituskelpoiseksi.
   */
  router.put(
    "/dev-drafts/:id/approve",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const existing = await prisma.codeChangeDraft.findUnique({
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
            error: `Luonnos ei odota hyväksyntää (status: ${existing.status}).`,
          })
        }

        const draft = await prisma.codeChangeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "approved",
          },
        })

        response.json(withDiff(draft))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/dev-drafts/:id/reject
   */
  router.put(
    "/dev-drafts/:id/reject",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const existing = await prisma.codeChangeDraft.findUnique({
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

        const draft = await prisma.codeChangeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "rejected",
          },
        })

        response.json(withDiff(draft))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/dev-drafts/:id/write
   *
   * Kirjoittaa jo hyväksytyn (status: "approved", tai uudelleenyritys
   * "write_failed"-tilasta) luonnoksen levylle
   * CodeChangeDeveloper-pluginin workflow'n kautta. Reitti kieltäytyy
   * suorittamasta muissa tiloissa - tämä on ensimmäinen ja
   * ehdottomasti pakollinen porttitarkistus, jonka lisäksi skilli itse
   * tarkistaa saman uudelleen.
   */
  router.put(
    "/dev-drafts/:id/write",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.codeChangeDraft.findUnique({
          where: {
            id: draftId,
          },
        })

        if (!draft) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        if (draft.status !== "approved" && draft.status !== "write_failed") {
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
          "write-code-change-workflow",
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

          const failed = await prisma.codeChangeDraft.update({
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
            draft: withDiff(failed),
          })
        }

        const written = await prisma.codeChangeDraft.update({
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

        response.json(withDiff(written))
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
