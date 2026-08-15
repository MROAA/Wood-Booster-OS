import express from "express"

import crypto from "node:crypto"

import { generateCodeChange } from "../services/codeChangeGenerator.js"

import {
  getSpacemonkeyToolBus,
  getSpacemonkeyWorkflowEngine,
} from "../services/spacemonkey/spacemonkeyRuntimeBootstrap.js"

import {
  createDraftSetFromPrompt,
  withSetDiffs,
} from "../services/devStudio/draftSetService.js"

import { verifyProposedChange } from "../services/devStudio/verifyProposedChange.js"

/*
 * Dev Studion "Useampi tiedosto" -tilan reitit. Kolme vaihetta, jotka
 * Marc nimenomaan valitsi haastattelussa:
 *
 *  1. POST /dev-draft-sets - Spacemonkey ehdottaa SUUNNITELMAN (mitkä
 *     tiedostot ja miksi), ei vielä sisältöä.
 *  2. PUT /dev-draft-sets/:id/approve-plan - vasta suunnitelman
 *     hyväksynnän jälkeen jokaiselle suunnitellulle (ei-estetylle)
 *     tiedostolle generoidaan sisältö + tarkistustesti, samalla tavalla
 *     kuin devCodeChangeStudio.js:n yhden tiedoston reitti - ei
 *     duplikoitua logiikkaa, vain silmukka saman workflow'n yli per
 *     tiedosto.
 *  3. PUT /dev-draft-sets/:id/approve sitten PUT .../write - "yksi
 *     hyväksyntä koko paketille" (Marc), joka kirjoittaa KAIKKI
 *     tiedostot. write esivalidoi jokaisen tiedoston (hiekkalaatikko +
 *     ristiriitatarkistus) ENNEN kuin yhtäkään kirjoitetaan, jotta
 *     osittaista, puoliksi tehtyä pakettia ei pääse syntymään
 *     tavallisessa tapauksessa - vain harvinainen kesken kirjoituksen
 *     tapahtuva virhe (esim. levy täynnä) voi jättää paketin osittain
 *     kirjoitetuksi, jolloin tila on "partial_write_failed" ja jokaisen
 *     tiedoston oma status kertoo mitä oikeasti tapahtui.
 */
export default function createDevMultiFileChangeRouter(prisma) {
  const router = express.Router()

  const withFiles = withSetDiffs

  async function fetchSetWithFiles(setId) {
    return prisma.codeChangeDraftSet.findUnique({
      where: { id: setId },
      include: { files: { orderBy: { id: "asc" } } },
    })
  }

  /*
   * POST /api/dev-draft-sets
   *
   * Luo uuden CodeChangeDraftSetin ja sen CodeChangeFileDraft-rivit
   * suunnitelmasta. Ei koskaan generoi sisältöä eikä kirjoita mitään -
   * pelkkä tiedostolista jää odottamaan hyväksyntää.
   */
  router.post("/dev-draft-sets", async (request, response) => {
    try {
      const { prompt } = request.body || {}

      if (!prompt) {
        return response.status(400).json({
          error: "Pyyntö (prompt) vaaditaan",
        })
      }

      const result = await createDraftSetFromPrompt(prisma, prompt)

      if (result.error) {
        return response.status(result.status).json({
          error: result.error,
          code: result.code,
        })
      }

      response.status(201).json(result.set)
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * GET /api/dev-draft-sets
   */
  router.get("/dev-draft-sets", async (request, response) => {
    try {
      const sets = await prisma.codeChangeDraftSet.findMany({
        orderBy: { createdAt: "desc" },
        include: { files: { orderBy: { id: "asc" } } },
      })

      response.json(sets.map(withFiles))
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * GET /api/dev-draft-sets/:id
   */
  router.get("/dev-draft-sets/:id", async (request, response) => {
    try {
      const set = await fetchSetWithFiles(Number(request.params.id))

      if (!set) {
        return response.status(404).json({ error: "Pakettia ei löytynyt" })
      }

      response.json(withFiles(set))
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * PUT /api/dev-draft-sets/:id/approve-plan
   *
   * Suunnitelman hyväksyntä. Generoi jokaiselle ei-estetylle
   * tiedostolle sisällön ja tarkistustestin - sama
   * generate-code-change / generate-verification-test /
   * run-verification-test -ketju jota yhden tiedoston reitti jo
   * käyttää, ajettuna kerran per suunniteltu tiedosto.
   */
  router.put("/dev-draft-sets/:id/approve-plan", async (request, response) => {
    try {
      const setId = Number(request.params.id)

      const set = await fetchSetWithFiles(setId)

      if (!set) {
        return response.status(404).json({ error: "Pakettia ei löytynyt" })
      }

      if (set.status !== "plan_ready") {
        return response.status(409).json({
          error: `Paketti ei odota suunnitelman hyväksyntää (status: ${set.status}).`,
        })
      }

      const workflowEngine = getSpacemonkeyWorkflowEngine()

      if (!workflowEngine) {
        return response.status(503).json({
          error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
        })
      }

      const toolBus = getSpacemonkeyToolBus()

      for (const file of set.files) {
        if (file.status === "blocked") {
          continue
        }

        const combinedPrompt =
          `KOKONAISPYYNTÖ:\n${set.prompt}\n\n` +
          `TÄMÄN TIEDOSTON ROOLI SUUNNITELMASSA:\n${file.reason || ""}`

        const generateResult = await workflowEngine.execute(
          "generate-code-change-workflow",
          {
            prompt: combinedPrompt,
            filePath: file.filePath,
            toolBus,
            generateCodeChange,
          },
        )

        const generateSkillResult = generateResult.results?.[0]

        if (!generateSkillResult?.success) {
          await prisma.codeChangeFileDraft.update({
            where: { id: file.id },
            data: {
              status: "generate_failed",
              generateError:
                generateSkillResult?.error ||
                "Sisällön generointi epäonnistui.",
            },
          })

          continue
        }

        const originalHash =
          generateSkillResult.originalCode === null
            ? null
            : crypto
                .createHash("sha256")
                .update(generateSkillResult.originalCode, "utf8")
                .digest("hex")

        const verification = await verifyProposedChange({
          workflowEngine,
          toolBus,
          prompt: combinedPrompt,
          filePath: generateSkillResult.filePath,
          proposedCode: generateSkillResult.proposedCode,
        })

        await prisma.codeChangeFileDraft.update({
          where: { id: file.id },
          data: {
            status: "generated",
            originalCode: generateSkillResult.originalCode,
            proposedCode: generateSkillResult.proposedCode,
            originalHash,
            testCode: verification.testCode,
            testStatus: verification.testStatus,
            testOutput: verification.testOutput,
            testSkippedReason: verification.testSkippedReason,
          },
        })
      }

      const updatedSet = await prisma.codeChangeDraftSet.update({
        where: { id: setId },
        data: { status: "draft" },
        include: { files: { orderBy: { id: "asc" } } },
      })

      response.json(withFiles(updatedSet))
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * PUT /api/dev-draft-sets/:id/approve
   *
   * Ihmisen hyväksyntä koko paketille - ei vielä kirjoita mitään.
   */
  router.put("/dev-draft-sets/:id/approve", async (request, response) => {
    try {
      const setId = Number(request.params.id)

      const existing = await prisma.codeChangeDraftSet.findUnique({
        where: { id: setId },
      })

      if (!existing) {
        return response.status(404).json({ error: "Pakettia ei löytynyt" })
      }

      if (existing.status !== "draft") {
        return response.status(409).json({
          error: `Paketti ei odota hyväksyntää (status: ${existing.status}).`,
        })
      }

      const set = await prisma.codeChangeDraftSet.update({
        where: { id: setId },
        data: { status: "approved" },
        include: { files: { orderBy: { id: "asc" } } },
      })

      response.json(withFiles(set))
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * PUT /api/dev-draft-sets/:id/reject
   */
  router.put("/dev-draft-sets/:id/reject", async (request, response) => {
    try {
      const setId = Number(request.params.id)

      const existing = await prisma.codeChangeDraftSet.findUnique({
        where: { id: setId },
      })

      if (!existing) {
        return response.status(404).json({ error: "Pakettia ei löytynyt" })
      }

      if (existing.status === "written") {
        return response.status(409).json({
          error: "Jo levylle kirjoitettua pakettia ei voi hylätä.",
        })
      }

      const set = await prisma.codeChangeDraftSet.update({
        where: { id: setId },
        data: { status: "rejected" },
        include: { files: { orderBy: { id: "asc" } } },
      })

      response.json(withFiles(set))
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * PUT /api/dev-draft-sets/:id/write
   *
   * Kirjoittaa KAIKKI paketin tiedostot. Esivalidoi jokaisen tiedoston
   * (hiekkalaatikko + ristiriitatarkistus write-code-change-skillin
   * kautta ajamalla se "kuivana" ensin olisi monimutkaisempaa kuin
   * hyötyä - sen sijaan skilli itse tekee saman tarkistuksen jokaiselle
   * tiedostolle kirjoitushetkellä, ja tämä reitti pysäyttää koko
   * paketin heti ensimmäiseen epäonnistumiseen asti kirjoitettujen
   * tiedostojen tila jää näkyviin "written", loput "not_attempted"
   * (paketin oma tila kertoo tämän: "partial_write_failed").
   */
  router.put("/dev-draft-sets/:id/write", async (request, response) => {
    try {
      const setId = Number(request.params.id)

      const set = await fetchSetWithFiles(setId)

      if (!set) {
        return response.status(404).json({ error: "Pakettia ei löytynyt" })
      }

      if (set.status !== "approved" && set.status !== "partial_write_failed") {
        return response.status(409).json({
          error: `Pakettia ei ole hyväksytty (status: ${set.status}). Hyväksy paketti ensin.`,
        })
      }

      const workflowEngine = getSpacemonkeyWorkflowEngine()

      if (!workflowEngine) {
        return response.status(503).json({
          error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
        })
      }

      const toolBus = getSpacemonkeyToolBus()

      const writableFiles = set.files.filter(
        file => file.status === "generated" || file.status === "write_failed",
      )

      let anyFailed = false

      for (const file of writableFiles) {
        // write-code-change-skill tarkistaa hyväksynnän draft.statuksesta
        // - CodeChangeFileDraft-rivillä ei ole omaa "approved"-tilaa
        // (koko paketti hyväksytään kerralla), joten välitetään sille
        // sama tieto olion muodossa jota skilli odottaa.
        const draftForSkill = { ...file, status: "approved" }

        const workflowResult = await workflowEngine.execute(
          "write-code-change-workflow",
          { draft: draftForSkill, toolBus },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          anyFailed = true

          await prisma.codeChangeFileDraft.update({
            where: { id: file.id },
            data: {
              status:
                skillResult?.code === "file_changed_since_draft"
                  ? "conflict"
                  : "write_failed",
              writeError:
                skillResult?.error ||
                "Kirjoitus epäonnistui tuntemattomasta syystä.",
            },
          })

          continue
        }

        await prisma.codeChangeFileDraft.update({
          where: { id: file.id },
          data: {
            status: "written",
            writeError: null,
            backupPath: skillResult.backupPath,
          },
        })
      }

      const finalSet = await prisma.codeChangeDraftSet.update({
        where: { id: setId },
        data: {
          status: anyFailed ? "partial_write_failed" : "written",
          writtenAt: anyFailed ? null : new Date(),
          writeError: anyFailed
            ? "Osa tiedostoista ei kirjoittunut - katso tiedostokohtaiset virheet."
            : null,
        },
        include: { files: { orderBy: { id: "asc" } } },
      })

      response
        .status(anyFailed ? 422 : 200)
        .json(withFiles(finalSet))
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * PUT /api/dev-draft-sets/:id/files/:fileId/revert
   *
   * Peruutus on tiedostokohtainen, ei koko paketille - paketissa voi
   * olla joitain tiedostoja jotka kannattaa pitää ja toisia joita ei.
   * Vain kyseisen CodeChangeFileDraft-rivin tila muuttuu; paketin oma
   * status pysyy "written"-tilassa vaikka jokin sen tiedosto
   * peruutettaisiin myöhemmin - tämä on tarkoituksellista, ei bugi.
   */
  router.put("/dev-draft-sets/:id/files/:fileId/revert", async (request, response) => {
    try {
      const setId = Number(request.params.id)

      const fileId = Number(request.params.fileId)

      const set = await fetchSetWithFiles(setId)

      if (!set) {
        return response.status(404).json({ error: "Pakettia ei löytynyt" })
      }

      const file = set.files.find(candidate => candidate.id === fileId)

      if (!file) {
        return response.status(404).json({ error: "Tiedostoa ei löytynyt paketista" })
      }

      if (file.status !== "written") {
        return response.status(409).json({
          error: `Tiedostoa ei ole kirjoitettu levylle (status: ${file.status}).`,
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
        { draft: file, toolBus },
      )

      const skillResult = workflowResult.results?.[0]

      if (!skillResult?.success) {
        const nextStatus =
          skillResult?.code === "file_changed_since_write"
            ? "revert_conflict"
            : "revert_failed"

        await prisma.codeChangeFileDraft.update({
          where: { id: fileId },
          data: {
            status: nextStatus,
            writeError:
              skillResult?.error ||
              "Peruutus epäonnistui tuntemattomasta syystä.",
          },
        })

        const updatedSet = await fetchSetWithFiles(setId)

        const statusCode = nextStatus === "revert_conflict" ? 409 : 422

        return response.status(statusCode).json(withFiles(updatedSet))
      }

      await prisma.codeChangeFileDraft.update({
        where: { id: fileId },
        data: {
          status: "reverted",
          writeError: null,
        },
      })

      const updatedSet = await fetchSetWithFiles(setId)

      response.json(withFiles(updatedSet))
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  /*
   * PUT /api/dev-draft-sets/:id/files/:fileId/revise
   *
   * Sama idea kuin devCodeChangeStudio.js:n /dev-drafts/:id/revise -
   * pyytää AI:ta tuottamaan uuden version SAMASTA tiedostoehdotuksesta
   * käyttäjän palautteen perusteella, samaan riviin, koko paketin
   * suunnitelmaa (set.prompt) ja tämän tiedoston roolia (file.reason)
   * unohtamatta. Toimii vain vielä hyväksymättömälle tiedostolle
   * (status: "generated").
   */
  router.put("/dev-draft-sets/:id/files/:fileId/revise", async (request, response) => {
    try {
      const setId = Number(request.params.id)

      const fileId = Number(request.params.fileId)

      const set = await fetchSetWithFiles(setId)

      if (!set) {
        return response.status(404).json({ error: "Pakettia ei löytynyt" })
      }

      const file = set.files.find(candidate => candidate.id === fileId)

      if (!file) {
        return response.status(404).json({ error: "Tiedostoa ei löytynyt paketista" })
      }

      if (file.status !== "generated") {
        return response.status(409).json({
          error: `Tiedosto ei odota tarkistusta (status: ${file.status}).`,
        })
      }

      const { feedback } = request.body || {}

      if (!feedback || !String(feedback).trim()) {
        return response.status(400).json({ error: "Palaute (feedback) vaaditaan" })
      }

      const workflowEngine = getSpacemonkeyWorkflowEngine()

      if (!workflowEngine) {
        return response.status(503).json({
          error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
        })
      }

      const toolBus = getSpacemonkeyToolBus()

      const augmentedPrompt =
        `KOKONAISPYYNTÖ:\n${set.prompt}\n\n` +
        `TÄMÄN TIEDOSTON ROOLI SUUNNITELMASSA:\n${file.reason || ""}\n\n` +
        `AIEMPI EHDOTUS (koko tiedoston sisältö):\n${file.proposedCode || ""}\n\n` +
        `KÄYTTÄJÄN PALAUTE EHDOTUKSEEN:\n${String(feedback).trim()}\n\n` +
        "TEHTÄVÄ: Tuota UUSI versio koko tiedoston sisällöstä, joka " +
        "toteuttaa alkuperäisen pyynnön ja ottaa huomioon käyttäjän " +
        "palautteen."

      const generateResult = await workflowEngine.execute(
        "generate-code-change-workflow",
        {
          prompt: augmentedPrompt,
          filePath: file.filePath,
          toolBus,
          generateCodeChange,
        },
      )

      const generateSkillResult = generateResult.results?.[0]

      if (!generateSkillResult?.success) {
        return response.status(422).json({
          error: generateSkillResult?.error,
          code: generateSkillResult?.code,
        })
      }

      const originalHash =
        generateSkillResult.originalCode === null
          ? null
          : crypto
              .createHash("sha256")
              .update(generateSkillResult.originalCode, "utf8")
              .digest("hex")

      const verification = await verifyProposedChange({
        workflowEngine,
        toolBus,
        prompt: augmentedPrompt,
        filePath: generateSkillResult.filePath,
        proposedCode: generateSkillResult.proposedCode,
      })

      await prisma.codeChangeFileDraft.update({
        where: { id: fileId },
        data: {
          originalCode: generateSkillResult.originalCode,
          proposedCode: generateSkillResult.proposedCode,
          originalHash,
          testCode: verification.testCode,
          testStatus: verification.testStatus,
          testOutput: verification.testOutput,
          testSkippedReason: verification.testSkippedReason,
        },
      })

      const updatedSet = await fetchSetWithFiles(setId)

      response.json(withFiles(updatedSet))
    } catch (error) {
      console.error(error)

      response.status(500).json({ error: error.message })
    }
  })

  return router
}
