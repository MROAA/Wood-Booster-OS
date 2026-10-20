/**
 * Hearthwood Dev Studio — Source Facts
 *
 * Purpose: give the model (and the report) machine-verified facts about
 * the code that was read, so the model only interprets instead of having
 * to discover structure itself.
 *
 * Responsibilities:
 * - definition facts: which relevant symbol is defined where
 * - call facts: which read definition calls which other read definition,
 *   with the exact line (comments and strings ignored)
 * - classify model references as strong (part of the task's mechanic) or
 *   weak (only a side excerpt)
 *
 * Dependencies: hearthwoodCallSiteVerification.findVerifiedCallsInSource
 * (call lines, comments and strings masked), hearthwoodSourceIndex.
 * Pure: works on source text already read through the guarded reader;
 * never touches the file system and never executes source.
 *
 * Public API: buildSourceFacts, formatSourceFacts, classifyReferences.
 *
 * Example:
 *   const facts = buildSourceFacts(rawFiles, readFiles)
 *   formatSourceFacts(facts)
 *   // "- src/…/tacticsEngine.js:2428 attackUnit kutsuu onGuard: next = manaFx.onGuard(…)"
 *
 * Tests: hearthwoodSourceFacts.test.js
 */
import { findVerifiedCallsInSource } from "./hearthwoodCallSiteVerification.js"
import { extractDefinitions } from "./hearthwoodSourceIndex.js"

const MAX_FACTS = 12
const MAX_LINE_CHARS = 140

/**
 * rawFiles: [{ filePath, originalContent }] read by the guarded reader.
 * files:    reader output with `excerpts` ({ symbol, startLine, score }).
 */
export function buildSourceFacts(rawFiles, files) {
  const excerptSymbols = files.flatMap(file =>
    (file.excerpts || []).map(excerpt => ({ ...excerpt, filePath: file.filePath })))
  const names = new Set(excerptSymbols.map(item => item.symbol))
  const scoreOf = new Map()
  for (const item of excerptSymbols) {
    scoreOf.set(item.symbol, Math.max(scoreOf.get(item.symbol) || 0, item.score || 0))
  }
  const calls = []
  const seen = new Set()

  for (const { filePath, originalContent } of rawFiles) {
    const callers = new Set(excerptSymbols
      .filter(item => item.filePath === filePath)
      .map(item => item.symbol))
    if (!callers.size) continue
    // The caller comes from the top-level definition line ranges: the
    // call-site module's brace scan gives up on nested template strings.
    const definitions = extractDefinitions(originalContent)
    const callerAt = line => definitions.find(d => d.startLine <= line && line <= d.endLine)?.name
    for (const callee of names) {
      if (!originalContent.includes(`${callee}(`)) continue
      for (const found of findVerifiedCallsInSource(originalContent, callee, filePath)) {
        const call = { ...found, caller: callerAt(found.line) }
        if (!call.caller || call.caller === callee || !callers.has(call.caller)) continue
        const key = `${call.caller}>${callee}`
        if (seen.has(key)) continue
        seen.add(key)
        calls.push({
          kind: "call",
          filePath,
          line: call.line,
          symbol: call.caller,
          callee,
          text: call.sourceLine.slice(0, MAX_LINE_CHARS),
          // A call between two relevant definitions outranks helper calls.
          relevance: Math.min(scoreOf.get(call.caller) || 0, scoreOf.get(callee) || 0),
        })
      }
    }
  }

  const definitions = [...excerptSymbols]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map(item => ({ kind: "definition", filePath: item.filePath, line: item.startLine, symbol: item.symbol }))

  calls.sort((a, b) => b.relevance - a.relevance)
  const topCalls = calls.slice(0, MAX_FACTS / 2).map(({ relevance, ...fact }) => fact)
  return [...topCalls, ...definitions].slice(0, MAX_FACTS)
}

// Source text is data: our own prompt delimiters cannot be forged from it.
function neutralize(text) {
  return String(text)
    .replace(/LÄHDE(KATKELMA|KOODI)\s+(PÄÄTTYY|ALKAA)/g, "[erotin poistettu]")
    .replace(/(TIEDOSTO|PÄÄTÖS|SUUNNITELMA|SELITYS)\s*:/g, "$1 (lähdeteksti)")
}

export function formatSourceFacts(facts) {
  if (!facts.length) return "Ei konelaskettuja faktoja."
  return facts.map(fact => fact.kind === "call"
    ? `- ${fact.filePath}:${fact.line} ${fact.symbol} kutsuu ${fact.callee}: ${neutralize(fact.text)}`
    : `- ${fact.filePath}:${fact.line} määrittely ${fact.symbol}`).join("\n")
}

/**
 * Strong: the symbol is part of a verified call chain, or its excerpt
 * scored at least half of the best excerpt. Weak: a side excerpt only.
 * A quality signal for the reviewer, never an approval.
 */
export function classifyReferences(references, files, facts) {
  const scores = new Map()
  for (const file of files) {
    for (const excerpt of file.excerpts || []) {
      scores.set(excerpt.symbol, Math.max(scores.get(excerpt.symbol) || 0, excerpt.score || 0))
    }
  }
  const best = Math.max(0, ...scores.values())
  const chained = new Set(facts.filter(fact => fact.kind === "call")
    .flatMap(fact => [fact.symbol, fact.callee]))
  const strong = []
  const weak = []
  for (const symbol of new Set(references.map(ref => ref.symbol))) {
    if (chained.has(symbol) || (best > 0 && (scores.get(symbol) || 0) >= best / 2)) strong.push(symbol)
    else weak.push(symbol)
  }
  return { strong, weak }
}
