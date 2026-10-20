/**
 * Hearthwood Dev Studio — Dependency Impact
 *
 * Purpose: for the symbols a change plan touches, find what the source
 * actually says about them: where they are defined, who calls them, and
 * which existing tests mention them. Every claim carries file and line.
 *
 * Responsibilities:
 * - definition (file, line, exported) of each touched symbol
 * - verified call sites across the allowed Hearthwood source tree
 *   (comments and strings ignored); callers resolved by line ranges
 * - existing tests that mention the symbol or import its file
 * - an explicit scope: what was scanned and what this cannot see
 *
 * Dependencies: hearthwoodProjectExplorer (allowed file list),
 * hearthwoodCodeReader.readHearthwoodSourceFile (guarded reads),
 * hearthwoodCallSiteVerification, hearthwoodSourceIndex.
 * Read-only; never executes source.
 *
 * Public API: analyzeHearthwoodDependencyImpact({ symbols })
 *   symbols: [{ symbol, filePath }]
 *
 * Example:
 *   await analyzeHearthwoodDependencyImpact({
 *     symbols: [{ symbol: "onGuard", filePath: "src/services/heartwood/tacticsMana.js" }] })
 *
 * Tests: hearthwoodPlanQuality.test.js (fixture project)
 */
import path from "node:path"

import { listHearthwoodProjectFiles } from "./hearthwoodProjectExplorer.js"
import { readHearthwoodSourceFile } from "./hearthwoodCodeReader.js"
import { findVerifiedCallsInSource } from "./hearthwoodCallSiteVerification.js"
import { extractDefinitions } from "./hearthwoodSourceIndex.js"

const MAX_SYMBOLS = 8
const MAX_CALL_SITES = 20
const TEST_FILE = /\.test\.(js|jsx|ts|tsx|mjs)$/

const SCOPE_LIMITS =
  "Vain Hearthwoodin sallitut lähdehakemistot. Dynaamisia kutsuja " +
  "(merkkijonoavaimet, takaisinkutsut, olioiden kautta välitetyt funktiot) " +
  "ei tunnisteta, joten vaikutusanalyysi ei ole koko projektin osalta täydellinen."

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function callerAt(definitions, line) {
  return definitions.find(d => d.startLine <= line && line <= d.endLine)?.name ?? null
}

export async function analyzeHearthwoodDependencyImpact({ symbols = [] } = {}) {
  const wanted = []
  const seen = new Set()
  for (const item of symbols) {
    if (!item || !/^[A-Za-z_$][\w$]*$/.test(item.symbol || "")) continue
    const key = `${item.filePath}#${item.symbol}`
    if (seen.has(key)) continue
    seen.add(key)
    wanted.push(item)
    if (wanted.length >= MAX_SYMBOLS) break
  }

  const allFiles = await listHearthwoodProjectFiles()
  const contents = new Map()
  let unreadable = 0
  for (const filePath of allFiles) {
    const content = await readHearthwoodSourceFile(filePath)
    if (content === null) unreadable += 1
    else contents.set(filePath, content)
  }

  const testFiles = [...contents.keys()].filter(file => TEST_FILE.test(file))

  const results = wanted.map(({ symbol, filePath }) => {
    const own = contents.get(filePath)
    const ownDefinition = own
      ? extractDefinitions(own).find(d => d.name === symbol)
      : null

    const callSites = []
    for (const [file, content] of contents) {
      if (!content.includes(`${symbol}(`)) continue
      const definitions = extractDefinitions(content)
      for (const call of findVerifiedCallsInSource(content, symbol, file)) {
        if (callSites.length >= MAX_CALL_SITES) break
        callSites.push({ filePath: file, line: call.line, caller: callerAt(definitions, call.line), text: call.sourceLine })
      }
    }

    const base = escapeRegex(path.basename(filePath).replace(/\.[^.]+$/, ""))
    const mentions = new RegExp(`(^|[^\\w$])${escapeRegex(symbol)}(?![\\w$])`)
    const imports = new RegExp(`from\\s+["'][^"']*\\b${base}(\\.js)?["']`)
    // A test that names the symbol covers it; one that only imports the
    // file is reported separately and does not count as coverage.
    const tests = testFiles.filter(file => mentions.test(contents.get(file)))
    const fileTests = testFiles.filter(file => !tests.includes(file) && imports.test(contents.get(file)))

    const otherFiles = [...new Set(callSites.map(c => c.filePath).filter(f => f !== filePath))]
    return {
      symbol,
      filePath,
      definition: ownDefinition
        ? { line: ownDefinition.startLine, exported: ownDefinition.exported }
        : null,
      callSites,
      callSitesTruncated: callSites.length >= MAX_CALL_SITES,
      affectedFiles: otherFiles,
      interfaceRisk: Boolean(ownDefinition?.exported && otherFiles.length),
      existingTests: tests,
      fileOnlyTests: fileTests,
    }
  })

  return {
    symbols: results,
    missingRegressionTests: results
      .filter(item => !item.existingTests.length)
      .map(item => `${item.filePath}: ${item.symbol}`),
    scope: {
      filesScanned: contents.size,
      filesUnreadable: unreadable,
      testFilesScanned: testFiles.length,
      limits: SCOPE_LIMITS,
    },
  }
}
