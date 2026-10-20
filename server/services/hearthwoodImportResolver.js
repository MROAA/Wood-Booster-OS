
/**
 * Hearthwood Dev Studio — Source Intelligence V2.1
 * Import Resolver
 *
 * Selvittää importatut ja saman tiedoston sisäiset
 * riippuvuudet suoraan alkuperäisestä lähdekoodista.
 *
 * Vain luku: ei suorita tutkittavaa lähdekoodia.
 */

import fs from "node:fs/promises"
import path from "node:path"

import PROJECT_ROOT from "./hearthwoodProjectRoot.js"

import {
  listHearthwoodProjectFiles,
} from "./hearthwoodProjectExplorer.js"

const MAX_FILE_BYTES = 512000
const MAX_DEPENDENCIES = 8

// Kahdeksan katkelmaa mahtuu 4800 merkin rajaan.
const MAX_EXCERPT = 560
const MAX_TOTAL_CHARS = 4800

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function isUsed(name, source) {
  return new RegExp(
    `\\b${escapeRegex(name)}\\b`,
  ).test(source)
}

function isInside(root, target) {
  const relative = path.relative(root, target)

  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  )
}

async function readAllowedFile(
  filePath,
  allowed,
  realRoot,
) {
  if (!allowed.has(filePath)) return null

  try {
    const absolute = path.resolve(
      PROJECT_ROOT,
      filePath,
    )

    if (!isInside(PROJECT_ROOT, absolute)) {
      return null
    }

    const realPath = await fs.realpath(absolute)

    if (!isInside(realRoot, realPath)) {
      return null
    }

    const stats = await fs.stat(realPath)

    if (
      !stats.isFile() ||
      stats.size > MAX_FILE_BYTES
    ) {
      return null
    }

    return await fs.readFile(realPath, "utf8")
  } catch {
    return null
  }
}

function resolveImportPath(
  owner,
  specifier,
  allowed,
) {
  if (!specifier.startsWith(".")) {
    return null
  }

  const base = path.posix.normalize(
    path.posix.join(
      path.posix.dirname(owner),
      specifier,
    ),
  )

  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}/index.js`,
    `${base}/index.jsx`,
  ]

  return (
    candidates.find(item => allowed.has(item)) ||
    null
  )
}

function extractDefinition(content, symbol) {
  const pattern = new RegExp(
    `^[ \\t]*(?:export\\s+)?(?:default\\s+)?` +
    `(?:const|let|var|function|class)\\s+` +
    `${escapeRegex(symbol)}\\b`,
    "m",
  )

  const match = pattern.exec(content)

  if (!match) return null

  const remaining = content.slice(match.index)

  return {
    excerpt: remaining.slice(0, MAX_EXCERPT),
    partial: remaining.length > MAX_EXCERPT,
  }
}

/**
 * Palauttaa lähdekoodista poimitut riippuvuudet.
 *
 * Paikalliset vakiot käsitellään ensin, jotta runsas
 * importtien määrä ei peitä esim. CASTER_KINDS-vakiota.
 */
export async function resolveHearthwoodImports(
  verifiedSources = [],
) {
  const allowed = new Set(
    await listHearthwoodProjectFiles(),
  )

  const realRoot = await fs.realpath(
    PROJECT_ROOT,
  )

  const dependencies = []
  const unresolved = []
  const seen = new Set()

  let totalCharacters = 0

  const owners = [
    ...new Set(
      verifiedSources
        .map(item => item?.filePath)
        .filter(
          filePath =>
            typeof filePath === "string",
        ),
    ),
  ]

  function addDependency({
    symbol,
    filePath,
    origin,
    content,
    kind,
  }) {
    const key = `${filePath}:${symbol}`

    if (seen.has(key)) return

    seen.add(key)

    const definition = extractDefinition(
      content,
      symbol,
    )

    if (!definition) {
      unresolved.push({
        symbol,
        filePath,
        reason: "Määritelmää ei löytynyt.",
      })

      return
    }

    if (
      dependencies.length >= MAX_DEPENDENCIES ||
      totalCharacters + definition.excerpt.length >
        MAX_TOTAL_CHARS
    ) {
      unresolved.push({
        symbol,
        filePath,
        reason: "Kontekstiraja saavutettu.",
      })

      return
    }

    dependencies.push({
      symbol,
      filePath,
      origin,
      kind,
      excerpt: definition.excerpt,
      partial: definition.partial,
    })

    totalCharacters += definition.excerpt.length
  }

  for (const owner of owners) {
    const ownerContent = await readAllowedFile(
      owner,
      allowed,
      realRoot,
    )

    if (!ownerContent) continue

    const requestedCode = verifiedSources
      .filter(item => item?.filePath === owner)
      .map(item =>
        typeof item.source === "string"
          ? item.source
          : "",
      )
      .join("\n")

    if (!requestedCode.trim()) continue

    // 1. Etsi saman tiedoston paikalliset vakiot.
    // Ne saavat etusijan ennen importteja.
    //
    // Importatut uppercase-nimet eivät ole
    // paikallisia määritelmiä.

    const localSymbols = [
      ...new Set(
        requestedCode.match(
          /\b[A-Z][A-Z0-9_]{2,}\b/g,
        ) || [],
      ),
    ]

    for (const symbol of localSymbols) {
      // Lisää vain oikeasti samassa tiedostossa
      // määritellyt symbolit.

      if (
        !extractDefinition(
          ownerContent,
          symbol,
        )
      ) {
        continue
      }

      addDependency({
        symbol,
        filePath: owner,
        origin: owner,
        content: ownerContent,
        kind: "local",
      })
    }

    // 2. Selvitä importatut riippuvuudet.

    const importPattern =
      /\bimport\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g

    for (
      const match of ownerContent.matchAll(
        importPattern,
      )
    ) {
      const bindings = match[1].split(",")

      const importedPath = resolveImportPath(
        owner,
        match[2],
        allowed,
      )

      for (const binding of bindings) {
        const parts = binding
          .trim()
          .split(/\s+as\s+/)

        const originalName = parts[0]?.trim()

        const localName = (
          parts[1] || parts[0]
        )?.trim()

        if (
          !originalName ||
          !localName ||
          !isUsed(localName, requestedCode)
        ) {
          continue
        }

        if (!importedPath) {
          unresolved.push({
            symbol: localName,
            filePath: match[2],
            reason:
              "Importin tiedostoa ei voitu ratkaista.",
          })

          continue
        }

        const importedContent =
          await readAllowedFile(
            importedPath,
            allowed,
            realRoot,
          )

        if (!importedContent) {
          unresolved.push({
            symbol: localName,
            filePath: importedPath,
            reason:
              "Tiedostoa ei voitu lukea.",
          })

          continue
        }

        addDependency({
          symbol: originalName,
          filePath: importedPath,
          origin: owner,
          content: importedContent,
          kind: "import",
        })
      }
    }
  }

  return {
    dependencies,
    unresolved,
    count: dependencies.length,
  }
}
