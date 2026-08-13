import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import express from "express"

import { applyPhotoEdit } from "../services/photoEditor.js"
import {
  runVideoEdit,
  generateThumbnail,
} from "../services/videoEditor.js"

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const uploadsRoot = path.resolve(
  currentDirectory,
  "../uploads/projects",
)

function isImage(mimeType) {
  return Boolean(mimeType?.startsWith("image/"))
}

function isVideo(mimeType) {
  return Boolean(mimeType?.startsWith("video/"))
}

/*
 * Käynnissä olevat ffmpeg-ajot tiedosto-id:n mukaan, jotta ne
 * voidaan tarvittaessa keskeyttää (ei vielä UI:ssa, mutta valmiina).
 */
const runningVideoJobs = new Map()

/*
 * Palvelimen käynnistyessä "processing"-tilaan jääneet rivit
 * (esim. palvelin kaatui kesken ajon) merkitään epäonnistuneiksi -
 * järjestelmässä ei ole muuta työn-palautusmekanismia.
 */
export async function recoverStuckVideoJobs(prisma) {
  await prisma.projectFile.updateMany({
    where: {
      status: "processing",
    },
    data: {
      status: "failed",
    },
  })
}

export default function createMediaEditsRouter(prisma) {
  const router = express.Router()

  /*
   * GET /api/files/:id
   *
   * Kevyt yksittäisen tiedoston haku - käytetään mm. videon
   * käsittelytilan (status) pollaamiseen ilman koko projektin
   * tiedostolistan uudelleenhakua.
   */
  router.get(
    "/files/:id",
    async (request, response) => {
      try {
        const fileId = Number(request.params.id)

        const projectFile = await prisma.projectFile.findUnique({
          where: {
            id: fileId,
          },
        })

        if (!projectFile) {
          return response.status(404).json({
            error: "Tiedostoa ei löytynyt",
          })
        }

        response.json(projectFile)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * POST /api/files/:id/edit
   *
   * Muokkaa kuvaa (rajaus, kirkkaus/kontrasti/saturaatio,
   * vesileima, kuvateksti). Ei koskaan ylikirjoita alkuperäistä -
   * tulos tallennetaan aina uutena ProjectFile-rivinä, jolla on
   * sourceFileId-viittaus alkuperäiseen.
   */
  router.post(
    "/files/:id/edit",
    async (request, response) => {
      try {
        const sourceId = Number(request.params.id)

        const sourceFile = await prisma.projectFile.findUnique({
          where: {
            id: sourceId,
          },
        })

        if (!sourceFile) {
          return response.status(404).json({
            error: "Tiedostoa ei löytynyt",
          })
        }

        if (!isImage(sourceFile.mimeType)) {
          return response.status(400).json({
            error: "Vain kuvia voi muokata tällä toiminnolla",
          })
        }

        const operations = request.body?.operations || {}

        const projectDirectory = path.join(
          uploadsRoot,
          String(sourceFile.projectId),
        )

        const inputPath = path.join(
          projectDirectory,
          sourceFile.storedName,
        )

        const storedName = `${Date.now()}-edited-${sourceFile.storedName}`

        const outputPath = path.join(
          projectDirectory,
          storedName,
        )

        await applyPhotoEdit({
          inputPath,
          outputPath,
          operations,
        })

        const { size } = fs.statSync(outputPath)

        const editedFile = await prisma.projectFile.create({
          data: {
            projectId: sourceFile.projectId,
            originalName: `Muokattu - ${sourceFile.originalName}`,
            storedName,
            mimeType: sourceFile.mimeType,
            size,
            category: sourceFile.category,
            sourceFileId: sourceFile.id,
            status: "ready",
          },
        })

        response.status(201).json(editedFile)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * POST /api/files/:id/edit-video
   *
   * Muokkaa videota (leikkaus, rajaus 9:16, vesileima, poltettu
   * kuvateksti). Käsittely on hidasta (10-60+ sekuntia), joten sitä
   * ei odoteta pyynnön aikana: uusi ProjectFile-rivi luodaan heti
   * status: "processing", vastataan 202, ja ffmpeg ajetaan
   * taustalla. Frontend pollaa GET /files/:id kunnes status on
   * "ready" tai "failed".
   */
  router.post(
    "/files/:id/edit-video",
    async (request, response) => {
      try {
        const sourceId = Number(request.params.id)

        const sourceFile = await prisma.projectFile.findUnique({
          where: {
            id: sourceId,
          },
        })

        if (!sourceFile) {
          return response.status(404).json({
            error: "Tiedostoa ei löytynyt",
          })
        }

        if (!isVideo(sourceFile.mimeType)) {
          return response.status(400).json({
            error: "Vain videoita voi muokata tällä toiminnolla",
          })
        }

        const operations = request.body?.operations || {}

        const projectDirectory = path.join(
          uploadsRoot,
          String(sourceFile.projectId),
        )

        const inputPath = path.join(
          projectDirectory,
          sourceFile.storedName,
        )

        const storedName = `${Date.now()}-edited-${sourceFile.storedName}`

        const outputPath = path.join(
          projectDirectory,
          storedName,
        )

        const processingFile = await prisma.projectFile.create({
          data: {
            projectId: sourceFile.projectId,
            originalName: `Muokattu - ${sourceFile.originalName}`,
            storedName,
            mimeType: sourceFile.mimeType,
            size: 0,
            category: sourceFile.category,
            sourceFileId: sourceFile.id,
            status: "processing",
          },
        })

        response.status(202).json(processingFile)

        const { promise, kill } = runVideoEdit({
          inputPath,
          outputPath,
          operations,
        })

        runningVideoJobs.set(processingFile.id, kill)

        promise
          .then(async () => {
            const { size } = fs.statSync(outputPath)

            try {
              await generateThumbnail({
                inputPath: outputPath,
                outputDirectory: projectDirectory,
                outputFilename: `${storedName}.thumb.jpg`,
              })
            } catch (thumbnailError) {
              console.error(
                "Esikatselukuvan luonti epäonnistui:",
                thumbnailError,
              )
            }

            await prisma.projectFile.update({
              where: {
                id: processingFile.id,
              },
              data: {
                size,
                status: "ready",
              },
            })
          })
          .catch(async error => {
            console.error(
              "Videon käsittely epäonnistui:",
              error,
            )

            await prisma.projectFile.update({
              where: {
                id: processingFile.id,
              },
              data: {
                status: "failed",
              },
            })
          })
          .finally(() => {
            runningVideoJobs.delete(processingFile.id)
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

export { isImage, isVideo, uploadsRoot }
