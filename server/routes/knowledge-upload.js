import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import express from "express"
import multer from "multer"
import mammoth from "mammoth"
import { PDFParse } from "pdf-parse"
import * as XLSX from "xlsx"
const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)
const uploadsRoot = path.resolve(
  currentDirectory,
  "../uploads/knowledge",
)
fs.mkdirSync(uploadsRoot, {
  recursive: true,
})
const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadsRoot)
  },
  filename(req, file, callback) {
    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    )
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
const TEXT_EXTENSIONS = ["txt", "md", "pdf", "docx", "xlsx", "xls"]
export default function createKnowledgeUploadRouter(
  prisma,
) {
  const router = express.Router()
  router.post(
    "/knowledge/upload",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            error: "Valitse tiedosto.",
          })
        }
        const extension = getExtension(
          req.file.originalname,
        )
        const isTextExtractable =
          TEXT_EXTENSIONS.includes(extension)
        let text = ""
        if (isTextExtractable) {
          const buffer = fs.readFileSync(req.file.path)
          text = cleanText(
            await extractText(buffer, extension),
          )
        }
        const title =
          String(req.body.title || "").trim() ||
          req.file.originalname
        const topic =
          String(req.body.topic || "").trim() ||
          "Yleinen"
        const tags =
          String(req.body.tags || "").trim() ||
          null
        const sourceType = isTextExtractable
          ? "file"
          : req.file.mimetype.startsWith("video/")
          ? "video"
          : "binary"
        const content =
          text || `[Tiedosto] ${req.file.originalname}`
        const chunks = text
          ? createChunks(text)
          : []
        const document =
          await prisma.$transaction(
            async (tx) => {
              const created =
                await tx.knowledgeDocument.create({
                  data: {
                    title,
                    content,
                    sourceType,
                    sourceUrl: null,
                    topic,
                    tags,
                    status: "Hyväksytty",
                    storedFileName: req.file.filename,
                    originalFileName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    fileSize: req.file.size,
                  },
                })
              if (chunks.length > 0) {
                await tx.knowledgeChunk.createMany({
                  data: chunks.map(
                    (chunk, index) => ({
                      documentId: created.id,
                      chunkIndex: index,
                      content: chunk,
                      tokenCount: Math.ceil(
                        chunk.length / 4,
                      ),
                    }),
                  ),
                })
              }
              return tx.knowledgeDocument.findUnique({
                where: {
                  id: created.id,
                },
                include: {
                  chunks: true,
                },
              })
            },
          )
        res.status(201).json({
          success: true,
          document,
          chunkCount: chunks.length,
          fileUrl: `/uploads/knowledge/${req.file.filename}`,
        })
      } catch (error) {
        console.error(error)
        if (req.file?.path) {
          fs.rmSync(req.file.path, {
            force: true,
          })
        }
        res.status(500).json({
          error:
            error.message ||
            "Tiedoston käsittely epäonnistui.",
        })
      }
    },
  )
  return router
}
async function extractText(buffer, extension) {
  if (
    extension === "txt" ||
    extension === "md"
  ) {
    return buffer.toString("utf8")
  }
  if (extension === "docx") {
    const result = await mammoth.extractRawText({
      buffer,
    })
    return result.value
  }
  if (extension === "pdf") {
    const parser = new PDFParse({
      data: buffer,
    })
    try {
      const result = await parser.getText()
      return result.text
    } finally {
      await parser.destroy()
    }
  }
  if (extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(buffer, {
      type: "buffer",
    })
    let combined = ""
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const csv = XLSX.utils.sheet_to_csv(sheet)
      combined += `\n\n# ${sheetName}\n${csv}`
    }
    return combined
  }
  return ""
}
function createChunks(
  text,
  chunkSize = 2000,
  overlap = 250,
) {
  const chunks = []
  const step = chunkSize - overlap
  for (
    let start = 0;
    start < text.length;
    start += step
  ) {
    const chunk = text
      .slice(start, start + chunkSize)
      .trim()
    if (chunk) {
      chunks.push(chunk)
    }
  }
  return chunks
}
function cleanText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
function getExtension(fileName) {
  const parts = String(fileName || "")
    .toLowerCase()
    .split(".")
  return parts.length > 1
    ? parts.pop()
    : ""
}