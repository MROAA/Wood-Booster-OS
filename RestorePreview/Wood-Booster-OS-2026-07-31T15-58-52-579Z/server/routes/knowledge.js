import express from "express"

const allowedStatuses = [
  "Luonnos",
  "Tarkistettava",
  "Hyväksytty",
  "Arkistoitu",
]

export default function createKnowledgeRouter(prisma) {
  const router = express.Router()

  router.get("/knowledge", async (req, res) => {
    try {
      const search = String(
        req.query.search || "",
      ).trim()

      const topic = String(
        req.query.topic || "",
      ).trim()

      const folder = String(
        req.query.folder || "",
      ).trim()

      const status = String(
        req.query.status || "",
      ).trim()

      const where = {}

      if (topic) {
        where.topic = topic
      }

      if (folder) {
        where.folder = folder
      }

      if (status) {
        where.status = status
      }

      if (search) {
        where.OR = [
          {
            title: {
              contains: search,
            },
          },
          {
            content: {
              contains: search,
            },
          },
          {
            topic: {
              contains: search,
            },
          },
          {
            folder: {
              contains: search,
            },
          },
          {
            tags: {
              contains: search,
            },
          },
          {
            author: {
              contains: search,
            },
          },
          {
            sourceUrl: {
              contains: search,
            },
          },
        ]
      }

      const documents =
        await prisma.knowledgeDocument.findMany({
          where,
          include: {
            _count: {
              select: {
                chunks: true,
              },
            },
          },
          orderBy: [
            {
              alwaysUse: "desc",
            },
            {
              priority: "desc",
            },
            {
              updatedAt: "desc",
            },
          ],
        })

      res.json(documents)
    } catch (error) {
      console.error(
        "Tietopankin lataaminen epäonnistui:",
        error,
      )

      res.status(500).json({
        error:
          error.message ||
          "Tietopankin lataaminen epäonnistui",
      })
    }
  })

  router.get(
    "/knowledge/:id",
    async (req, res) => {
      try {
        const documentId = Number(req.params.id)

        if (!Number.isInteger(documentId)) {
          return res.status(400).json({
            error: "Virheellinen dokumentti",
          })
        }

        const document =
          await prisma.knowledgeDocument.findUnique({
            where: {
              id: documentId,
            },
            include: {
              chunks: {
                orderBy: {
                  chunkIndex: "asc",
                },
              },
            },
          })

        if (!document) {
          return res.status(404).json({
            error: "Dokumenttia ei löytynyt",
          })
        }

        res.json(document)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Dokumentin lataaminen epäonnistui",
        })
      }
    },
  )

  router.post("/knowledge", async (req, res) => {
    try {
      const data = readDocumentData(req.body)

      if (!data.title) {
        return res.status(400).json({
          error: "Dokumentin otsikko puuttuu",
        })
      }

      if (!data.content) {
        return res.status(400).json({
          error: "Dokumentin sisältö puuttuu",
        })
      }

      if (
        data.sourceType === "url" &&
        !data.sourceUrl
      ) {
        return res.status(400).json({
          error: "Lähdeosoite puuttuu",
        })
      }

      if (
        !allowedStatuses.includes(data.status)
      ) {
        return res.status(400).json({
          error: "Virheellinen dokumentin tila",
        })
      }

      const chunks = createChunks(data.content)

      const document =
        await prisma.$transaction(async (tx) => {
          const created =
            await tx.knowledgeDocument.create({
              data,
            })

          if (chunks.length > 0) {
            await tx.knowledgeChunk.createMany({
              data: chunks.map(
                (chunk, chunkIndex) => ({
                  documentId: created.id,
                  chunkIndex,
                  content: chunk,
                  tokenCount:
                    estimateTokenCount(chunk),
                }),
              ),
            })
          }

          return tx.knowledgeDocument.findUnique({
            where: {
              id: created.id,
            },
            include: {
              chunks: {
                orderBy: {
                  chunkIndex: "asc",
                },
              },
            },
          })
        })

      res.status(201).json(document)
    } catch (error) {
      console.error(
        "Dokumentin tallentaminen epäonnistui:",
        error,
      )

      res.status(500).json({
        error:
          error.message ||
          "Dokumentin tallentaminen epäonnistui",
      })
    }
  })

  router.put(
    "/knowledge/:id",
    async (req, res) => {
      try {
        const documentId = Number(req.params.id)

        if (!Number.isInteger(documentId)) {
          return res.status(400).json({
            error: "Virheellinen dokumentti",
          })
        }

        const existing =
          await prisma.knowledgeDocument.findUnique({
            where: {
              id: documentId,
            },
          })

        if (!existing) {
          return res.status(404).json({
            error: "Dokumenttia ei löytynyt",
          })
        }

        const data = readDocumentUpdateData(
          req.body,
        )

        if (
          data.title !== undefined &&
          !data.title
        ) {
          return res.status(400).json({
            error: "Dokumentin otsikko puuttuu",
          })
        }

        if (
          data.content !== undefined &&
          !data.content
        ) {
          return res.status(400).json({
            error: "Dokumentin sisältö puuttuu",
          })
        }

        if (
          data.status !== undefined &&
          !allowedStatuses.includes(data.status)
        ) {
          return res.status(400).json({
            error: "Virheellinen dokumentin tila",
          })
        }

        const contentChanged =
          data.content !== undefined &&
          data.content !== existing.content

        const document =
          await prisma.$transaction(async (tx) => {
            const updated =
              await tx.knowledgeDocument.update({
                where: {
                  id: documentId,
                },
                data,
              })

            if (contentChanged) {
              await tx.knowledgeChunk.deleteMany({
                where: {
                  documentId,
                },
              })

              const chunks = createChunks(
                updated.content,
              )

              if (chunks.length > 0) {
                await tx.knowledgeChunk.createMany({
                  data: chunks.map(
                    (chunk, chunkIndex) => ({
                      documentId,
                      chunkIndex,
                      content: chunk,
                      tokenCount:
                        estimateTokenCount(chunk),
                    }),
                  ),
                })
              }
            }

            return tx.knowledgeDocument.findUnique({
              where: {
                id: documentId,
              },
              include: {
                chunks: {
                  orderBy: {
                    chunkIndex: "asc",
                  },
                },
              },
            })
          })

        res.json(document)
      } catch (error) {
        console.error(
          "Dokumentin päivittäminen epäonnistui:",
          error,
        )

        res.status(500).json({
          error:
            error.message ||
            "Dokumentin päivittäminen epäonnistui",
        })
      }
    },
  )

  router.delete(
    "/knowledge/:id",
    async (req, res) => {
      try {
        const documentId = Number(req.params.id)

        if (!Number.isInteger(documentId)) {
          return res.status(400).json({
            error: "Virheellinen dokumentti",
          })
        }

        const existing =
          await prisma.knowledgeDocument.findUnique({
            where: {
              id: documentId,
            },
          })

        if (!existing) {
          return res.status(404).json({
            error: "Dokumenttia ei löytynyt",
          })
        }

        await prisma.knowledgeDocument.delete({
          where: {
            id: documentId,
          },
        })

        res.json({
          success: true,
        })
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Dokumentin poistaminen epäonnistui",
        })
      }
    },
  )

  router.get(
    "/knowledge-context/search",
    async (req, res) => {
      try {
        const query = String(
          req.query.q || "",
        ).trim()

        const limit = Math.min(
          Math.max(
            Number(req.query.limit) || 8,
            1,
          ),
          20,
        )

        if (!query) {
          return res.status(400).json({
            error: "Hakusana puuttuu",
          })
        }

        const chunks =
          await prisma.knowledgeChunk.findMany({
            where: {
              document: {
                status: "Hyväksytty",
              },
              content: {
                contains: query,
              },
            },
            include: {
              document: true,
            },
            take: limit,
            orderBy: {
              document: {
                priority: "desc",
              },
            },
          })

        res.json({
          query,
          count: chunks.length,
          chunks,
        })
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Tietopankkihaun suorittaminen epäonnistui",
        })
      }
    },
  )

  router.get(
    "/knowledge-folders",
    async (req, res) => {
      try {
        const documents =
          await prisma.knowledgeDocument.findMany({
            select: {
              folder: true,
            },
            orderBy: {
              folder: "asc",
            },
          })

        const folders = [
          ...new Set(
            documents
              .map((document) => document.folder)
              .filter(Boolean),
          ),
        ]

        res.json(folders)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Kansioiden lataaminen epäonnistui",
        })
      }
    },
  )

  router.get(
    "/content-drafts",
    async (req, res) => {
      try {
        const drafts =
          await prisma.contentDraft.findMany({
            orderBy: {
              updatedAt: "desc",
            },
          })

        res.json(drafts)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Luonnosten lataaminen epäonnistui",
        })
      }
    },
  )

  router.post(
    "/content-drafts",
    async (req, res) => {
      try {
        const title = String(
          req.body.title || "",
        ).trim()

        const content = String(
          req.body.content || "",
        ).trim()

        if (!title) {
          return res.status(400).json({
            error: "Luonnoksen otsikko puuttuu",
          })
        }

        if (!content) {
          return res.status(400).json({
            error: "Luonnoksen sisältö puuttuu",
          })
        }

        const draft =
          await prisma.contentDraft.create({
            data: {
              title,
              content,
              contentType:
                String(
                  req.body.contentType ||
                    "Artikkeli",
                ).trim(),
              status:
                String(
                  req.body.status || "Luonnos",
                ).trim(),
              wordpressId: toOptionalInteger(
                req.body.wordpressId,
              ),
            },
          })

        res.status(201).json(draft)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Luonnoksen tallentaminen epäonnistui",
        })
      }
    },
  )

  router.put(
    "/content-drafts/:id",
    async (req, res) => {
      try {
        const draftId = Number(req.params.id)

        if (!Number.isInteger(draftId)) {
          return res.status(400).json({
            error: "Virheellinen luonnos",
          })
        }

        const data = {}

        if (req.body.title !== undefined) {
          data.title = String(
            req.body.title,
          ).trim()
        }

        if (req.body.content !== undefined) {
          data.content = String(
            req.body.content,
          ).trim()
        }

        if (
          req.body.contentType !== undefined
        ) {
          data.contentType = String(
            req.body.contentType,
          ).trim()
        }

        if (req.body.status !== undefined) {
          data.status = String(
            req.body.status,
          ).trim()
        }

        if (
          req.body.wordpressId !== undefined
        ) {
          data.wordpressId = toOptionalInteger(
            req.body.wordpressId,
          )
        }

        const draft =
          await prisma.contentDraft.update({
            where: {
              id: draftId,
            },
            data,
          })

        res.json(draft)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Luonnoksen päivittäminen epäonnistui",
        })
      }
    },
  )

  router.delete(
    "/content-drafts/:id",
    async (req, res) => {
      try {
        const draftId = Number(req.params.id)

        if (!Number.isInteger(draftId)) {
          return res.status(400).json({
            error: "Virheellinen luonnos",
          })
        }

        await prisma.contentDraft.delete({
          where: {
            id: draftId,
          },
        })

        res.json({
          success: true,
        })
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Luonnoksen poistaminen epäonnistui",
        })
      }
    },
  )

  return router
}

function readDocumentData(body) {
  return {
    title: String(body.title || "").trim(),
    content: normalizeText(body.content),
    sourceType: String(
      body.sourceType || "text",
    ).trim(),
    sourceUrl:
      String(body.sourceUrl || "").trim() ||
      null,
    topic:
      String(body.topic || "").trim() ||
      "Yleinen",
    folder:
      String(body.folder || "").trim() ||
      "Yleinen",
    tags: normalizeTags(body.tags),
    status: String(
      body.status || "Hyväksytty",
    ).trim(),
    priority: normalizePriority(
      body.priority,
    ),
    confidence: normalizeConfidence(
      body.confidence,
    ),
    alwaysUse: normalizeBoolean(
      body.alwaysUse,
    ),
    author:
      String(body.author || "").trim() ||
      null,
  }
}

function readDocumentUpdateData(body) {
  const data = {}

  if (body.title !== undefined) {
    data.title = String(body.title).trim()
  }

  if (body.content !== undefined) {
    data.content = normalizeText(
      body.content,
    )
  }

  if (body.sourceType !== undefined) {
    data.sourceType = String(
      body.sourceType,
    ).trim()
  }

  if (body.sourceUrl !== undefined) {
    data.sourceUrl =
      String(body.sourceUrl).trim() || null
  }

  if (body.topic !== undefined) {
    data.topic =
      String(body.topic).trim() || "Yleinen"
  }

  if (body.folder !== undefined) {
    data.folder =
      String(body.folder).trim() || "Yleinen"
  }

  if (body.tags !== undefined) {
    data.tags = normalizeTags(body.tags)
  }

  if (body.status !== undefined) {
    data.status = String(body.status).trim()
  }

  if (body.priority !== undefined) {
    data.priority = normalizePriority(
      body.priority,
    )
  }

  if (body.confidence !== undefined) {
    data.confidence = normalizeConfidence(
      body.confidence,
    )
  }

  if (body.alwaysUse !== undefined) {
    data.alwaysUse = normalizeBoolean(
      body.alwaysUse,
    )
  }

  if (body.author !== undefined) {
    data.author =
      String(body.author).trim() || null
  }

  return data
}

function createChunks(
  text,
  chunkSize = 2000,
  overlap = 250,
) {
  const chunks = []
  const step = Math.max(
    1,
    chunkSize - overlap,
  )

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

function normalizeText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function normalizeTags(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(",")

  const tags = source
    .map((tag) => String(tag).trim())
    .filter(Boolean)

  return tags.length > 0
    ? [...new Set(tags)].join(", ")
    : null
}

function normalizePriority(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 3
  }

  return Math.min(
    5,
    Math.max(1, Math.round(number)),
  )
}

function normalizeConfidence(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 100
  }

  return Math.min(
    100,
    Math.max(0, Math.round(number)),
  )
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value
  }

  return ["true", "1", "yes", "kyllä"].includes(
    String(value || "").toLowerCase(),
  )
}

function estimateTokenCount(text) {
  return Math.max(
    1,
    Math.ceil(String(text).length / 4),
  )
}

function toOptionalInteger(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null
  }

  const number = Number(value)

  return Number.isInteger(number)
    ? number
    : null
}