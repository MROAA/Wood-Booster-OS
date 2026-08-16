import express from "express"
import multer from "multer"
import mammoth from "mammoth"
import { PDFParse } from "pdf-parse"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
})

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

        const text = cleanText(
          await extractText(
            req.file.buffer,
            extension,
          ),
        )

        if (!text) {
          return res.status(400).json({
            error:
              "Tiedostosta ei löytynyt luettavaa tekstiä.",
          })
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

        const chunks = createChunks(text)

        const document =
          await prisma.$transaction(
            async (tx) => {
              const created =
                await tx.knowledgeDocument.create({
                  data: {
                    title,
                    content: text,
                    sourceType: "file",
                    sourceUrl: null,
                    topic,
                    tags,
                    status: "Hyväksytty",
                  },
                })

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
        })
      } catch (error) {
        console.error(error)

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

  throw new Error(
    "Tuettuja tiedostoja ovat TXT, MD, PDF ja DOCX.",
  )
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