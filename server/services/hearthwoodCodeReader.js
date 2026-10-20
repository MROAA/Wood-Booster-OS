
import fs from "node:fs/promises"
import path from "node:path"

import PROJECT_ROOT from "./hearthwoodProjectRoot.js"

import {
  listHearthwoodProjectFiles,
  findHearthwoodProjectFiles,
} from "./hearthwoodProjectExplorer.js"

import {
  taskTerms,
  extractDefinitions,
  definitionBody,
  scoreDefinition,
  termWeights,
  calledNames,
  termHits,
} from "./hearthwoodSourceIndex.js"

import { buildSourceFacts } from "./hearthwoodSourceFacts.js"

const MAX_FILES = 6
const MAX_CHARACTERS = 4000
const MAX_FILE_BYTES = 512000

const MAX_EXCERPTS = 10
const MAX_EXCERPT_CHARS = 1200
const MAX_OMITTED = 12
const CONTEXT_LINES = 3
const LEADING_COMMENT_LINES = 4

// Our own prompt delimiters must never be forgeable from source text.
function neutralize(text) {
  return text
    .replace(/LÄHDE(KATKELMA|KOODI)\s+(PÄÄTTYY|ALKAA)/g, "[lähdeteksti: erotin poistettu]")
    .replace(/TIEDOSTO:/g, "TIEDOSTO (lähdeteksti):")
}

function isHitLine(line, terms, names) {
  if (termHits(line, terms.words).length) return true
  for (const name of names) if (line.includes(name)) return true
  return false
}

/** One definition → bounded excerpt: full if small, else signature + hit windows. */
function renderExcerpt(lines, definition, terms, names) {
  const from = Math.max(definition.commentStart, definition.startLine - LEADING_COMMENT_LINES)
  const keep = new Set()
  const hitLines = []
  for (let n = from; n <= definition.endLine; n += 1) keep.add(n)
  let text = lines.slice(from - 1, definition.endLine).join("\n")
  for (let n = definition.startLine; n <= definition.endLine; n += 1) {
    if (isHitLine(lines[n - 1], terms, names)) hitLines.push(lines[n - 1])
  }
  let clipped = false

  if (text.length > MAX_EXCERPT_CHARS) {
    keep.clear()
    for (let n = from; n <= definition.startLine + 1; n += 1) keep.add(n)
    for (let n = definition.startLine; n <= definition.endLine; n += 1) {
      if (!isHitLine(lines[n - 1], terms, names)) continue
      for (let k = n - CONTEXT_LINES; k <= n + CONTEXT_LINES; k += 1) {
        if (k >= definition.startLine && k <= definition.endLine) keep.add(k)
      }
    }
    const out = []
    let skippedFrom = null
    for (let n = from; n <= definition.endLine; n += 1) {
      if (keep.has(n)) {
        if (skippedFrom !== null) out.push(`// … rivit ${skippedFrom}–${n - 1} ohitettu …`)
        skippedFrom = null
        out.push(lines[n - 1])
      } else if (skippedFrom === null) {
        skippedFrom = n
      }
    }
    if (skippedFrom !== null) out.push(`// … rivit ${skippedFrom}–${definition.endLine} ohitettu …`)
    text = out.join("\n")
    clipped = true
    if (text.length > MAX_EXCERPT_CHARS) text = text.slice(0, MAX_EXCERPT_CHARS) + "\n// … katkelma katkaistu …"
  }

  return { text: neutralize(text), clipped, hitLines }
}

/**
 * Pick the task-relevant definitions of one file and assemble several
 * line-numbered excerpts within MAX_CHARACTERS. Relevant definitions
 * that do not fit are reported in omittedSymbols, never hidden.
 */
export function selectRelevantCode(content, { filePath = "", terms, boosted = new Set() }) {
  const lines = content.split("\n")
  const names = new Set([...terms.symbols, ...boosted])
  const definitions = extractDefinitions(content)
  const bodies = definitions.map(definition => definitionBody(lines, definition))
  const weights = termWeights(bodies, terms.words, terms.inferred)
  const scores = definitions.map((definition, i) =>
    scoreDefinition(definition, bodies[i], terms, boosted, weights))

  // Callers of the strongest definitions are part of the same mechanic
  // (attackUnit calls eligibleGuardian): one in-file hop, bounded bonus.
  const top = Math.max(0, ...scores)
  const strong = new Set(definitions.filter((_, i) => top > 0 && scores[i] >= top / 2).map(d => d.name))
  const ranked = definitions
    .map((definition, i) => {
      const callsStrong = [...calledNames(bodies[i])]
        .filter(name => name !== definition.name && strong.has(name)).length
      return { definition, score: scores[i] + Math.min(16, 8 * callsStrong) }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.definition.startLine - b.definition.startLine)

  // A small file is sent whole; its scored definitions are still listed
  // so source facts and evidence strength work the same as for excerpts.
  if (content.length <= MAX_CHARACTERS) {
    const calls = new Set()
    for (const { definition } of ranked) {
      const hitLines = lines.slice(definition.startLine - 1, definition.endLine)
        .filter(line => isHitLine(line, terms, names))
      for (const name of calledNames(hitLines.join("\n"))) calls.add(name)
    }
    return {
      content: neutralize(content), whole: true, calls, omittedSymbols: [],
      excerpts: ranked.slice(0, MAX_EXCERPTS).map(({ definition, score }) => ({
        symbol: definition.name, startLine: definition.startLine, endLine: definition.endLine,
        clipped: false, score: Math.round(score * 10) / 10 })),
    }
  }

  if (!ranked.length) {
    return {
      content: neutralize(content.slice(0, MAX_CHARACTERS)),
      excerpts: [], omittedSymbols: [], calls: new Set(),
    }
  }

  const blocks = []
  const excerpts = []
  const omittedSymbols = []
  const calls = new Set()
  let used = 0

  for (const { definition, score } of ranked) {
    if (excerpts.length < MAX_EXCERPTS) {
      const rendered = renderExcerpt(lines, definition, terms, names)
      const header = `// ${filePath}:${definition.startLine}-${definition.endLine} ${definition.name}` +
        (rendered.clipped ? " (valikoidut rivit)" : "")
      const block = header + "\n" + rendered.text
      if (used + block.length + 2 <= MAX_CHARACTERS) {
        blocks.push(block)
        used += block.length + 2
        excerpts.push({ symbol: definition.name, startLine: definition.startLine,
          endLine: definition.endLine, clipped: rendered.clipped, score: Math.round(score * 10) / 10 })
        for (const name of calledNames(rendered.hitLines.join("\n"))) calls.add(name)
        continue
      }
    }
    if (omittedSymbols.length < MAX_OMITTED) omittedSymbols.push(definition.name)
  }

  return { content: blocks.join("\n\n"), excerpts, omittedSymbols, calls }
}

/**
 * Whole-file read through the same guards as readHearthwoodCode
 * (allowlist, realpath inside root, size limit). null when refused.
 * For deterministic analysis only; never sent to the model whole.
 */
export async function readHearthwoodSourceFile(filePath) {
  const allowedFiles = new Set(await listHearthwoodProjectFiles())
  return readRawFile(filePath, allowedFiles)
}

async function readRawFile(filePath, allowedFiles) {
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

    return originalContent
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

  const raw = []
  const skippedFiles = []
  for (const filePath of selected) {
    const originalContent = await readRawFile(filePath, allowedFiles)
    if (originalContent !== null) {
      raw.push({ filePath, originalContent })
    } else if (!requiredFiles.includes(filePath)) {
      // Selected as relevant but not readable (size, symlink, type):
      // reported, never presented as inspected.
      skippedFiles.push(filePath)
    } else {
      throw new Error("Pakollisen lähdetiedoston turvallinen lukeminen epäonnistui.")
    }
  }

  // Pass 1 finds what the relevant lines call; pass 2 boosts those
  // definitions in every read file (one call hop, no execution).
  const terms = taskTerms(prompt)
  const boosted = new Set()
  for (const { filePath, originalContent } of raw) {
    for (const name of selectRelevantCode(originalContent, { filePath, terms }).calls) boosted.add(name)
  }

  const files = raw.map(({ filePath, originalContent }) => {
    const picked = selectRelevantCode(originalContent, { filePath, terms, boosted })
    return {
      filePath,
      content: picked.content,
      truncated: !picked.whole,
      excerpts: picked.excerpts,
      omittedSymbols: picked.omittedSymbols,
    }
  })

  return {
    project: "hearthwood",
    mode: "read-only",
    files,
    count: files.length,
    // Machine-verified definition and call facts from the read sources.
    sourceFacts: buildSourceFacts(raw, files),
    skippedFiles,
  }
}
