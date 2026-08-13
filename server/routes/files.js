import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import express from "express"
import multer from "multer"

import { generateThumbnail } from "../services/videoEditor.js"

const router = express.Router()

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const uploadsRoot = path.resolve(
  currentDirectory,
  "../uploads/projects",
)

fs.mkdirSync(uploadsRoot, {
  recursive: true,
})

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const projectId = Number(req.params.id)

    if (!Number.isInteger(projectId)) {
      return callback(
        new Error("Virheellinen projekti"),
      )
    }

    const projectDirectory = path.join(
      uploadsRoot,
      String(projectId),
    )

    fs.mkdirSync(projectDirectory, {
      recursive: true,
    })

    callback(null, projectDirectory)
  },

  filename(req, file, callback) {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")

    const storedName = `${Date.now()}-${safeName}`

    callback(null, storedName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
})

export default function createFilesRouter(prisma) {
  router.get(
    "/projects/:id/files",
    async (req, res) => {
      try {
        const projectId = Number(req.params.id)

        const files =
          await prisma.projectFile.findMany({
            where: {
              projectId,
            },
            orderBy: {
              createdAt: "desc",
            },
          })

        res.json(files)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error: error.message,
        })
      }
    },
  )

  router.post(
    "/projects/:id/files",
    upload.single("file"),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id)

        if (!Number.isInteger(projectId)) {
          return res.status(400).json({
            error: "Virheellinen projekti",
          })
        }

        if (!req.file) {
          return res.status(400).json({
            error: "Tiedosto puuttuu",
          })
        }

        const category =
          String(req.body.category || "Muut").trim()

        const projectFile =
          await prisma.projectFile.create({
            data: {
              originalName: req.file.originalname,
              storedName: req.file.filename,
              mimeType: req.file.mimetype,
              size: req.file.size,
              category,
              projectId,
            },
          })

        if (req.file.mimetype.startsWith("video/")) {
          try {
            await generateThumbnail({
              inputPath: req.file.path,
              outputDirectory: path.dirname(req.file.path),
              outputFilename: `${req.file.filename}.thumb.jpg`,
            })
          } catch (thumbnailError) {
            console.error(
              "Esikatselukuvan luonti epäonnistui:",
              thumbnailError,
            )
          }
        }

        res.status(201).json(projectFile)
      } catch (error) {
        console.error(error)

        if (req.file?.path) {
          fs.rmSync(req.file.path, {
            force: true,
          })
        }

        res.status(500).json({
          error: error.message,
        })
      }
    },
  )

  router.delete(
    "/files/:id",
    async (req, res) => {
      try {
        const fileId = Number(req.params.id)

        const projectFile =
          await prisma.projectFile.findUnique({
            where: {
              id: fileId,
            },
          })

        if (!projectFile) {
          return res.status(404).json({
            error: "Tiedostoa ei löytynyt",
          })
        }

        const filePath = path.join(
          uploadsRoot,
          String(projectFile.projectId),
          projectFile.storedName,
        )

        await prisma.projectFile.delete({
          where: {
            id: fileId,
          },
        })

        fs.rmSync(filePath, {
          force: true,
        })

        fs.rmSync(`${filePath}.thumb.jpg`, {
          force: true,
        })

        res.json({
          success: true,
        })
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error: error.message,
        })
      }
    },
  )

  return router
}