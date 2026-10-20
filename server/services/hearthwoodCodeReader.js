
import fs from "node:fs/promises"
import path from "node:path"

import PROJECT_ROOT from "./hearthwoodProjectRoot.js"

import {
  listHearthwoodProjectFiles,
  findHearthwoodProjectFiles,
} from "./hearthwoodProjectExplorer.js"

const MAX_FILES = 6
const MAX_CHARACTERS = 4000
const MAX_FILE_BYTES = 512000

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function extractRequestedSymbols(prompt) {
  const words =
    String(prompt || "").match(
      /\b[A-Za-z_$][A-Za-z0-9_$]*\b/g,
    ) || []

  return [...new Set(words)]
    .filter(word => /[a-z][A-Z]/.test(word))
    .slice(0, 8)
}

function findSymbolDefinition(content, symbol) {
  const escaped = escapeRegex(symbol)

  const pattern = new RegExp(
    `\\b(?:export\\s+)?(?:async\\s+)?` +
    `(?:function|const|let|class)\\s+${escaped}\\b`,
  )

  const match = pattern.exec(content)

  return match ? match.index : -1
}

function selectRelevantCode(content, prompt) {
  const symbols = extractRequestedSymbols(prompt)
  const excerpts = []

  for (const symbol of symbols) {
    const position = findSymbolDefinition(
      content,
      symbol,
    )

    if (position === -1) continue

    const start = Math.max(0, position - 100)
    const end = Math.min(
      content.length,
      position + 1100,
    )

    excerpts.push(
      `FUNKTION ${symbol} LÄHDEKOODI:\n` +
      content.slice(start, end),
    )
  }

  if (excerpts.length === 0) {
    return content.slice(0, MAX_CHARACTERS)
  }

  let selected = content.slice(0, 700)

  for (const excerpt of excerpts) {
    const remaining =
      MAX_CHARACTERS - selected.length

    if (remaining <= 80) break

    selected +=
      "\n\n[ERIKSEEN HAETTU LÄHDEKOODIKATKELMA]\n" +
      excerpt.slice(0, remaining - 50)
  }

  return selected.slice(0, MAX_CHARACTERS)
}

async function readProjectFile(
  filePath,
  allowedFiles,
  prompt,
) {
  if (!allowedFiles.has(filePath)) {
    return null
  }

  const absolutePath = path.resolve(
    PROJECT_ROOT,
    filePath,
  )

  const relativePath = path.relative(
    PROJECT_ROOT,
    absolutePath,
  )

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return null
  }

  try {
    const realPath = await fs.realpath(absolutePath)

    const realRelative = path.relative(
      PROJECT_ROOT,
      realPath,
    )

    if (
      realRelative.startsWith("..") ||
      path.isAbsolute(realRelative)
    ) {
      return null
    }

    const stats = await fs.stat(realPath)

    if (
      !stats.isFile() ||
      stats.size > MAX_FILE_BYTES
    ) {
      return null
    }

    const originalContent = await fs.readFile(
      realPath,
      "utf8",
    )

    const content = selectRelevantCode(
      originalContent,
      prompt,
    )

    return {
      filePath,
      content,
      truncated:
        content.length < originalContent.length,
    }
  } catch {
    return null
  }
}

export async function readHearthwoodCode(prompt, { requiredFiles = [] } = {}) {
  const allowedFiles = new Set(
    await listHearthwoodProjectFiles(),
  )

  const search = await findHearthwoodProjectFiles(
    prompt,
    MAX_FILES,
  )

  // Required files are read *first*, never merely added to a list.
  // Keep the normal MAX_FILES budget and reject unknown paths.
  if (!Array.isArray(requiredFiles) || requiredFiles.length > 2) {
    throw new Error("Liikaa pakollisia tiedostoja.")
  }

  const selected = []
  for (const filePath of requiredFiles) {
    if (typeof filePath !== "string" || !allowedFiles.has(filePath)) {
      throw new Error("Pakollinen tiedosto ei ole sallittu tai sitä ei löydy.")
    }
    if (!selected.includes(filePath)) selected.push(filePath)
  }

  for (const match of search.matches) {
    if (selected.length >= MAX_FILES) break
    if (!selected.includes(match.filePath)) selected.push(match.filePath)
  }

  const files = []
  for (const filePath of selected) {
    const result = await readProjectFile(filePath, allowedFiles, prompt)
    if (result) {
      files.push(result)
    } else if (requiredFiles.includes(filePath)) {
      throw new Error("Pakollisen lähdetiedoston turvallinen lukeminen epäonnistui.")
    }
  }

  return {
    project: "hearthwood",
    mode: "read-only",
    files,
    count: files.length,
  }
}
