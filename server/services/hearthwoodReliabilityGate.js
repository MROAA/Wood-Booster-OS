
import fs from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"

import PROJECT_ROOT from "./hearthwoodProjectRoot.js"

const MAX_FILE_BYTES = 512000
const MAX_ITEMS = 60

const ALLOWED_FOLDERS = [
  "src/data/heartwood/",
  "src/services/heartwood/",
  "src/components/heartwood/",
  "src/components/hearthwood-studio/",
  "src/pages/",
  "server/services/heartwood/",
  "server/services/hearthwood/",
  "server/routes/",
]

function inside(root, target) {
  const rel = path.relative(root, target)

  return (
    rel !== ".." &&
    !rel.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(rel)
  )
}

function allowedFile(filePath) {
  if (
    typeof filePath !== "string" ||
    !filePath ||
    filePath.length > 500 ||
    filePath.includes("\\") ||
    filePath.includes("\0") ||
    path.isAbsolute(filePath) ||
    path.posix.normalize(filePath) !== filePath ||
    !/\.(?:js|jsx|ts|tsx)$/.test(filePath)
  ) {
    return false
  }

  if (
    !ALLOWED_FOLDERS.some(folder =>
      filePath.startsWith(folder)
    )
  ) {
    return false
  }

  if (
    filePath.startsWith("src/pages/") ||
    filePath.startsWith("server/routes/")
  ) {
    return /heartwood|hearthwood/i.test(
      path.basename(filePath)
    )
  }

  return true
}

function lineNumber(content, offset) {
  return content.slice(0, offset).split("\n").length
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function contradictions(answer, verifiedSymbols) {
  const lines = String(answer || "").split("\n")

  const missingClaim =
    /(?:ei\s+(?:ole\s+)?(?:määritelty|näy|näky|löydy|löytynyt|tunneta)|puuttu\w*|tuntemat\w*)/i

  const found = []

  for (const line of lines) {
    if (!missingClaim.test(line)) continue

    for (const symbol of verifiedSymbols) {
      const pattern = new RegExp(
        `\\b${escapeRegex(symbol)}\\b`
      )

      if (pattern.test(line)) {
        found.push({
          symbol,
          claim: line.trim().slice(0, 300),
        })
      }
    }
  }

  return found
}

/**
 * RELIABILITY GATE V1
 *
 * Tarkistaa AI-analyysissä annetut lähteet
 * suoraan oikean projektin tiedostoista.
 *
 * EI suorita tutkittavaa lähdekoodia.
 * EI kirjoita projektitiedostoihin.
 *
 * Tärkeää:
 * Lähteen aitous ei yksin todista AI:n
 * sanallisen tulkinnan oikeellisuutta.
 */
export async function auditHearthwoodAnalysis(
  analysis
) {
  const issues = []
  const checkedSources = []

  if (!analysis || analysis.success !== true) {
    return {
      decision: "BLOCK",
      sourceIntegrity: "failed",
      interpretationVerified: false,
      checkedSources,
      issues: [
        {
          code: "ANALYSIS_FAILED",
          message: "Analyysi ei onnistunut.",
        },
      ],
      contradictions: [],
    }
  }

  const sources = [
    ...(analysis.verifiedSources || []).map(
      (item, index) => ({
        ...item,
        kind: "function",
        index,
        snippet: item.source,
      })
    ),

    ...(analysis.dependencySources || []).map(
      (item, index) => ({
        ...item,
        kind: "dependency",
        index,
        snippet: item.excerpt,
      })
    ),
  ]

  if (
    sources.length === 0 ||
    sources.length > MAX_ITEMS
  ) {
    issues.push({
      code: "EVIDENCE_COUNT",
      message:
        "Todennettavia lähteitä ei ole tai niitä on liikaa.",
    })
  }

  let realRoot

  try {
    realRoot = await fs.realpath(PROJECT_ROOT)
  } catch {
    issues.push({
      code: "PROJECT_ROOT",
      message: "Projektikansiota ei löydy.",
    })
  }

  const cache = new Map()

  for (const item of sources.slice(0, MAX_ITEMS)) {
    const {
      filePath,
      symbol,
      snippet,
      kind,
      index,
    } = item

    if (
      !realRoot ||
      !allowedFile(filePath) ||
      typeof symbol !== "string" ||
      !/^[A-Za-z_$][\w$]*$/.test(symbol) ||
      typeof snippet !== "string" ||
      !snippet.trim() ||
      snippet.length > 12000
    ) {
      issues.push({
        code: "INVALID_SOURCE",
        filePath,
        symbol,
      })
      continue
    }

    let source = cache.get(filePath)

    if (!source) {
      try {
        const absolute = path.resolve(
          realRoot,
          filePath
        )

        if (!inside(realRoot, absolute)) {
          throw new Error("Outside project")
        }

        const resolved = await fs.realpath(
          absolute
        )

        if (!inside(realRoot, resolved)) {
          throw new Error(
            "Symlink outside project"
          )
        }

        const stats = await fs.stat(resolved)

        if (
          !stats.isFile() ||
          stats.size > MAX_FILE_BYTES
        ) {
          throw new Error("File not allowed")
        }

        const content = await fs.readFile(
          resolved,
          "utf8"
        )

        source = {
          content,
          sha256: createHash("sha256")
            .update(content)
            .digest("hex"),
        }

        cache.set(filePath, source)
      } catch {
        issues.push({
          code: "SOURCE_UNREADABLE",
          filePath,
          symbol,
        })
        continue
      }
    }

    const offset = source.content.indexOf(
      snippet
    )

    // Funktion tai vakion nimen esiintyminen ei riitä.
    // Katkelmassa täytyy olla varsinainen määritelmä.

    const declarationPattern = new RegExp(
      `^[ \\t]*(?:(?:export|default|async|declare)\\s+)*(?:function|class|const|let|var|interface|type|enum)\\s+${escapeRegex(symbol)}\\b`,
      "m",
    )

    if (
      offset < 0 ||
      !declarationPattern.test(snippet)
    ) {
      issues.push({
        code: "SOURCE_MISMATCH",
        filePath,
        symbol,
      })
      continue
    }

    checkedSources.push({
      kind,
      index,
      symbol,
      filePath,
      line: lineNumber(
        source.content,
        offset
      ),
      sha256: source.sha256,
      partial: Boolean(
        item.truncated || item.partial
      ),
    })
  }

  const foundSymbols = new Set(
    checkedSources.map(item => item.symbol)
  )

  const conflicts = contradictions(
    analysis.answer,
    foundSymbols
  )

  if (conflicts.length) {
    issues.push({
      code: "CONTRADICTORY_CLAIM",
      message:
        "AI väittää löydetyn symbolin puuttuvan.",
    })
  }

  const decision =
    issues.length ? "BLOCK" : "CAUTION"

  return {
    decision,

    sourceIntegrity:
      issues.length ? "failed" : "verified",

    interpretationVerified: false,

    projectRoot: realRoot || null,

    checkedSources,

    contradictions: conflicts,

    issues,

    warning:
      "Lähteiden aitous voidaan tarkistaa " +
      "ohjelmallisesti. AI:n selityksen " +
      "merkitystä ei ole automaattisesti " +
      "todistettu.",
  }
}
