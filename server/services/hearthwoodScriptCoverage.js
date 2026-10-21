/**
 * Hearthwood Dev Studio — Script Coverage (Verified Explanation V1.1)
 *
 * Purpose: find the project's existing check scripts that test the asked
 * mechanic, so "which tests cover this?" is answered from real files.
 *
 * What counts: a CHECK inside a version-controlled `.scratch/verify_*.mjs`
 * whose own description (the label of `ok(...)` / `c(...)` /
 * `errors.push(...)`) names the asked mechanic. A function name merely
 * appearing in a script is reported separately and never as a test.
 * Nothing is executed; files outside the project (e.g. Downloads) are
 * never read.
 *
 * Dependencies: git (read-only `ls-files`), hearthwoodProjectRoot,
 * hearthwoodSourceIndex.wordMatches.
 * Public API: findScriptChecks({ terms, symbols }), extractCheckLabels(text)
 * Tests: hearthwoodScriptCoverage.test.js
 */
import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"

import PROJECT_ROOT from "./hearthwoodProjectRoot.js"
import { wordMatches } from "./hearthwoodSourceIndex.js"

export const SCRIPT_PATTERN = ".scratch/verify_*.mjs"
const MAX_BYTES = 600 * 1024
const MAX_CHECKS_PER_FILE = 6
const MAX_FILES = 12

function trackedScripts(root) {
  return new Promise(resolve => {
    execFile("git", ["-C", root, "ls-files", "-z", "--", SCRIPT_PATTERN], { maxBuffer: 1 << 20, timeout: 10000 }, (error, stdout) => {
      resolve(error ? null : stdout.split("\0").filter(Boolean))
    })
  })
}

async function readScript(root, relative) {
  try {
    const scratch = await fs.realpath(path.join(root, ".scratch"))
    const real = await fs.realpath(path.join(root, relative))
    if (path.dirname(real) !== scratch || !/^verify_[\w-]+\.mjs$/.test(path.basename(real))) return null
    const stats = await fs.stat(real)
    if (!stats.isFile() || stats.size > MAX_BYTES) return null
    return await fs.readFile(real, "utf8")
  } catch {
    return null
  }
}

/** Each check's own description, with its line. */
export function extractCheckLabels(text) {
  const labels = []
  String(text).split("\n").forEach((line, index) => {
    const call = line.match(/\b(?:ok|c|check)\(.*,\s*(["'`])([^"'`]{4,200})\1\s*(?:,[^)]*)?\)\s*;?\s*$/)
    const pushed = line.match(/errors\.push\(\s*(["'`])([^"'`]{4,200})\1/)
    const label = (call || pushed)?.[2]
    if (label) labels.push({ line: index + 1, label: label.trim() })
  })
  return labels
}

/** A label word matches a term exactly or with a shared start of 6+ letters. */
function labelMentions(label, terms) {
  const words = label.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []
  return terms.filter(term => words.some(word => word === term || (Math.min(word.length, term.length) >= 6 && wordMatches(word, term))))
}

/**
 * terms: lowercase words naming the mechanic (the user's capitalised names,
 * or the search words when none). symbols: verified function names.
 * Returns { scanned, files: [{ file, checks: [{line,label,matched}] }],
 *           mentionsOnly: [{ file, symbols }], examined: bool }.
 */
export async function findScriptChecks({ terms = [], symbols = [], root = PROJECT_ROOT } = {}) {
  const tracked = await trackedScripts(root)
  if (!tracked) return { examined: false, scanned: 0, files: [], mentionsOnly: [] }
  // Every check's description in every tracked script.
  const scripts = []
  for (const relative of tracked) {
    const text = await readScript(root, relative)
    if (text !== null) scripts.push({ relative, text, labels: extractCheckLabels(text) })
  }
  const files = []
  const mentionsOnly = []
  for (const { relative, text, labels } of scripts) {
    const checks = labels
      .map(check => ({ ...check, matched: labelMentions(check.label, terms) }))
      .filter(check => check.matched.length)
    if (checks.length) {
      files.push({ file: relative, checks: checks.slice(0, MAX_CHECKS_PER_FILE), more: Math.max(0, checks.length - MAX_CHECKS_PER_FILE) })
    } else {
      const named = symbols.filter(symbol => new RegExp(`\\b${symbol.replace(/\$/g, "\\$")}\\b`).test(text))
      if (named.length) mentionsOnly.push({ file: relative, symbols: named })
    }
  }
  files.sort((a, b) => b.checks.length - a.checks.length || a.file.localeCompare(b.file))
  return { examined: true, scanned: tracked.length, files: files.slice(0, MAX_FILES), moreFiles: Math.max(0, files.length - MAX_FILES), mentionsOnly }
}
