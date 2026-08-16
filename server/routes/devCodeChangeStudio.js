import express from "express"

import crypto from "node:crypto"

import { diffLines } from "diff"

import { generateCodeChange } from "../services/codeChangeGenerator.js"

import {
  getSpacemonkeyToolBus,
  getSpacemonkeyWorkflowEngine,
} from "../services/spacemonkey/spacemonkeyRuntimeBootstrap.js"

import { verifyProposedChange } from "../services/devStudio/verifyProposedChange.js"

import { checkPullRequestStatus } from "../services/devStudio/pullRequestStatus.js"

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
 * PUT /dev-drafts/:id/write kautta, ja se puolestaan avaa aina Pull
 * Requestin write-code-change-pull-request-workflow'n kautta (ei
 * koskaan kirjoita Marcin elävään hakemistoon) vain jos luonnoksen
 * status on jo "approved" - sama porttimalli kuin devStudio.js:n
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
   * PUT /api/dev-drafts/:id/revise
   *
   * Pyytää AI:ta tuottamaan UUDEN version SAMASTA ehdotuksesta,
   * käyttäjän vapaan palautteen perusteella - ei hylkää+aloita
   * alusta, vaan täydentää samaa luonnosriviä. Toimii vain
   * odottavalle luonnokselle (status: "draft") - hyväksynnän jälkeen
   * hyväksyntä on tarkoituksella pysyvä yhdelle konkreettiselle
   * ehdotukselle, ks. hylkää+aloita-alusta-polku sen jälkeen.
   *
   * Käyttää samaa generate-code-change-workflow'ta kuin uuden
   * luonnoksen luonti - se lukee kohdetiedoston aina tuoreena, joten
   * revise "korjaa itsensä" automaattisesti jos tiedosto on ehtinyt
   * muuttua alkuperäisen luonnoksen jälkeen.
   */
  router.put(
    "/dev-drafts/:id/revise",
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
            error: `Luonnos ei odota tarkistusta (status: ${existing.status}).`,
          })
        }

        const { feedback } = request.body || {}

        if (!feedback || !String(feedback).trim()) {
          return response.status(400).json({
            error: "Palaute (feedback) vaaditaan",
          })
        }

        const workflowEngine = getSpacemonkeyWorkflowEngine()

        if (!workflowEngine) {
          return response.status(503).json({
            error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
          })
        }

        const toolBus = getSpacemonkeyToolBus()

        const augmentedPrompt =
          `ALKUPERÄINEN PYYNTÖ:\n${existing.prompt}\n\n` +
          `AIEMPI EHDOTUS (koko tiedoston sisältö):\n${existing.proposedCode}\n\n` +
          `KÄYTTÄJÄN PALAUTE EHDOTUKSEEN:\n${String(feedback).trim()}\n\n` +
          "TEHTÄVÄ: Tuota UUSI versio koko tiedoston sisällöstä, joka " +
          "toteuttaa alkuperäisen pyynnön ja ottaa huomioon käyttäjän " +
          "palautteen."

        const workflowResult = await workflowEngine.execute(
          "generate-code-change-workflow",
          {
            prompt: augmentedPrompt,
            filePath: existing.filePath,
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
          prompt: augmentedPrompt,
          filePath: skillResult.filePath,
          proposedCode: skillResult.proposedCode,
        })

        const revised = await prisma.codeChangeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            explanation: skillResult.explanation,
            originalCode: skillResult.originalCode,
            proposedCode: skillResult.proposedCode,
            originalHash,
            testCode: verification.testCode,
            testStatus: verification.testStatus,
            testOutput: verification.testOutput,
            testSkippedReason: verification.testSkippedReason,
          },
        })

        response.json(withDiff(revised))
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
   * Ei enää kirjoita suoraan levylle - luo tuoreen git-haaran,
   * committaa, pushaa, ja avaa GitHub Pull Requestin
   * CodeChangeDeveloper-pluginin PR-workflow'n kautta. Marc ei näe
   * muutosta live-sovelluksessaan ennen kuin PR on yhdistetty ja
   * kirjautuma synkattu - sama rytmi jota jokainen tämän session
   * ominaisuus on käyttänyt ihmisen tekemänä.
   *
   * Reitti kieltäytyy suorittamasta muissa tiloissa kuin "approved"
   * tai uudelleenyritys "pr_failed"-tilasta (tai vanha "write_failed",
   * ennen tätä ominaisuutta jääneistä riveistä) - tämä on ensimmäinen
   * ja ehdottomasti pakollinen porttitarkistus, jonka lisäksi skilli
   * itse tarkistaa saman uudelleen.
   *
   * writeCodeChangeSkill.js/writeCodeChangeWorkflow.js (suora
   * levylle kirjoitus) EIVÄT käytä tätä reittiä enää, mutta pysyvät
   * täysin ennallaan - Historian Peruuta-nappi toimii yhä jokaiselle
   * jo ennen tätä ominaisuutta kirjoitetulle "written"-riville.
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

        if (
          draft.status !== "approved" &&
          draft.status !== "write_failed" &&
          draft.status !== "pr_failed"
        ) {
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
          "write-code-change-pull-request-workflow",
          {
            title: draft.title,
            explanation: draft.explanation,
            prompt: draft.prompt,
            files: [
              {
                filePath: draft.filePath,
                proposedCode: draft.proposedCode,
                originalHash: draft.originalHash,
              },
            ],
            toolBus,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          const nextStatus =
            skillResult?.code === "file_changed_since_draft"
              ? "conflict"
              : "pr_failed"

          const failed = await prisma.codeChangeDraft.update({
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
            draft: withDiff(failed),
          })
        }

        const opened = await prisma.codeChangeDraft.update({
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

        response.json(withDiff(opened))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/dev-drafts/:id/check-pr-status
   *
   * Ei automaattista pollausta - tarkistaa GitHubilta PR:n tilan vain
   * kun ihminen sitä nimenomaan pyytää.
   */
  router.put(
    "/dev-drafts/:id/check-pr-status",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.codeChangeDraft.findUnique({
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

        const updated = await prisma.codeChangeDraft.update({
          where: { id: draftId },
          data: { status: nextStatus },
        })

        response.json(withDiff(updated))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/dev-drafts/:id/revert-pr
   *
   * Peruuttaa jo YHDISTETYN Pull Requestin avaamalla toisen,
   * peruuttavan PR:n - ei koskaan kirjoita suoraan levylle. Vain
   * "pr_merged"-tilasta (tai uudelleenyritys "pr_revert_failed"-
   * tilasta).
   */
  router.put(
    "/dev-drafts/:id/revert-pr",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.codeChangeDraft.findUnique({
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
          const failed = await prisma.codeChangeDraft.update({
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
            draft: withDiff(failed),
          })
        }

        const opened = await prisma.codeChangeDraft.update({
          where: { id: draftId },
          data: {
            status: "pr_revert_open",
            writeError: null,
            revertPrUrl: skillResult.prUrl,
            revertPrNumber: skillResult.prNumber,
            revertPrBranch: skillResult.prBranch,
          },
        })

        response.json(withDiff(opened))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/dev-drafts/:id/check-revert-pr-status
   *
   * Ei automaattista pollausta - tarkistaa GitHubilta peruutus-PR:n
   * tilan vain kun ihminen sitä nimenomaan pyytää.
   */
  router.put(
    "/dev-drafts/:id/check-revert-pr-status",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.codeChangeDraft.findUnique({
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

        const updated = await prisma.codeChangeDraft.update({
          where: { id: draftId },
          data: { status: nextStatus },
        })

        response.json(withDiff(updated))
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/dev-drafts/:id/revert
   *
   * Peruuttaa jo levylle kirjoitetun (status: "written") luonnoksen -
   * ks. revertCodeChangeSkill.js varmuuskopion palautuksen/poiston
   * tarkasta logiikasta. Voidaan kutsua milloin tahansa myöhemmin
   * (esim. Historia-välilehdeltä), ei vain samassa keskustelussa.
   */
  router.put(
    "/dev-drafts/:id/revert",
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
          "revert-code-change-workflow",
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

          const failed = await prisma.codeChangeDraft.update({
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
            draft: withDiff(failed),
          })
        }

        const reverted = await prisma.codeChangeDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "reverted",
            writeError: null,
          },
        })

        response.json(withDiff(reverted))
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
