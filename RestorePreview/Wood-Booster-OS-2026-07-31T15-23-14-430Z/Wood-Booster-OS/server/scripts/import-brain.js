import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { PrismaClient } from "../generated/prisma/client.js"

const prisma = new PrismaClient()

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const knowledgeDirectory = path.resolve(
  currentDirectory,
  "../ai-knowledge",
)

const supportedExtensions = new Set([
  ".md",
  ".txt",
])

async function main() {
  await fs.mkdir(knowledgeDirectory, {
    recursive: true,
  })

  const files = await findKnowledgeFiles(
    knowledgeDirectory,
  )

  if (files.length === 0) {
    console.log(
      "AI Brain -kansiosta ei löytynyt MD- tai TXT-tiedostoja.",
    )

    console.log(knowledgeDirectory)
    return
  }

  let createdCount = 0
  let updatedCount = 0
  let unchangedCount = 0
  let chunkCount = 0

  for (const filePath of files) {
    const relativePath = path
      .relative(knowledgeDirectory, filePath)
      .split(path.sep)
      .join("/")

    const content = normalizeText(
      await fs.readFile(filePath, "utf8"),
    )

    if (!content) {
      console.log(
        `Ohitettiin tyhjä tiedosto: ${relativePath}`,
      )
      continue
    }

    const metadata = createMetadata(
      relativePath,
      content,
    )

    const existingDocument =
      await prisma.knowledgeDocument.findFirst({
        where: {
          sourceType: "brain-file",
          sourceUrl: relativePath,
        },
      })

    if (
      existingDocument &&
      existingDocument.content === content &&
      existingDocument.title === metadata.title &&
      existingDocument.folder === metadata.folder &&
      existingDocument.topic === metadata.topic &&
      existingDocument.tags === metadata.tags
    ) {
      unchangedCount += 1

      console.log(
        `Ei muutoksia: ${relativePath}`,
      )

      continue
    }

    const chunks = createChunks(content)

    await prisma.$transaction(async (tx) => {
      let document

      if (existingDocument) {
        document =
          await tx.knowledgeDocument.update({
            where: {
              id: existingDocument.id,
            },
            data: {
              title: metadata.title,
              content,
              folder: metadata.folder,
              topic: metadata.topic,
              tags: metadata.tags,
              sourceType: "brain-file",
              sourceUrl: relativePath,
              status: "Hyväksytty",
              priority: metadata.priority,
              confidence: 100,
              alwaysUse: metadata.alwaysUse,
              author: metadata.author,
            },
          })

        await tx.knowledgeChunk.deleteMany({
          where: {
            documentId: document.id,
          },
        })

        updatedCount += 1
      } else {
        document =
          await tx.knowledgeDocument.create({
            data: {
              title: metadata.title,
              content,
              folder: metadata.folder,
              topic: metadata.topic,
              tags: metadata.tags,
              sourceType: "brain-file",
              sourceUrl: relativePath,
              status: "Hyväksytty",
              priority: metadata.priority,
              confidence: 100,
              alwaysUse: metadata.alwaysUse,
              author: metadata.author,
            },
          })

        createdCount += 1
      }

      await tx.knowledgeChunk.createMany({
        data: chunks.map(
          (chunk, chunkIndex) => ({
            documentId: document.id,
            chunkIndex,
            content: chunk,
            tokenCount:
              estimateTokenCount(chunk),
          }),
        ),
      })
    })

    chunkCount += chunks.length

    console.log(
      `${existingDocument ? "Päivitetty" : "Luotu"}: ${relativePath} (${chunks.length} chunkia)`,
    )
  }

  console.log("")
  console.log("AI Brain -tuonti valmis")
  console.log("----------------------")
  console.log(`Uusia dokumentteja: ${createdCount}`)
  console.log(
    `Päivitettyjä dokumentteja: ${updatedCount}`,
  )
  console.log(
    `Muuttumattomia dokumentteja: ${unchangedCount}`,
  )
  console.log(`Luotuja chunkkeja: ${chunkCount}`)
}

async function findKnowledgeFiles(directory) {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  })

  const files = []

  for (const entry of entries) {
    const fullPath = path.join(
      directory,
      entry.name,
    )

    if (entry.isDirectory()) {
      files.push(
        ...(await findKnowledgeFiles(fullPath)),
      )

      continue
    }

    const extension = path
      .extname(entry.name)
      .toLowerCase()

    if (supportedExtensions.has(extension)) {
      files.push(fullPath)
    }
  }

  return files.sort((first, second) =>
    first.localeCompare(second, "fi"),
  )
}

function createMetadata(relativePath, content) {
  const pathParts = relativePath.split("/")

  const folder =
    pathParts.length > 1
      ? pathParts[0]
      : "Yleinen"

  const fileName =
    pathParts[pathParts.length - 1]

  const title =
    readMarkdownTitle(content) ||
    humanizeFileName(fileName)

  return {
    title,
    folder,
    topic: folder,
    tags: createTags(pathParts),
    priority: folder === "AI-Instructions"
      ? 5
      : 3,
    alwaysUse:
      folder === "AI-Instructions",
    author: "Marc",
  }
}

function readMarkdownTitle(content) {
  const firstHeading = content
    .split("\n")
    .find((line) =>
      line.trim().startsWith("# "),
    )

  if (!firstHeading) {
    return ""
  }

  return firstHeading
    .replace(/^#\s+/, "")
    .trim()
}

function humanizeFileName(fileName) {
  return path
    .basename(
      fileName,
      path.extname(fileName),
    )
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
    .trim()
}

function createTags(pathParts) {
  const tags = pathParts
    .map((part) =>
      path
        .basename(part, path.extname(part))
        .replace(/[-_]+/g, " ")
        .trim(),
    )
    .filter(Boolean)

  return [...new Set(tags)].join(", ")
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

function estimateTokenCount(text) {
  return Math.max(
    1,
    Math.ceil(text.length / 4),
  )
}

main()
  .catch((error) => {
    console.error(
      "AI Brain -tuonti epäonnistui:",
      error,
    )

    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })