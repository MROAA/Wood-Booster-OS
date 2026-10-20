
/**
 * Hearthwood Dev Studio
 * Source Verification
 *
 * Etsii käyttäjän mainitsemat funktiot
 * Code Readerin lukemasta lähdekoodista.
 *
 * Ei tulkitse tiedostonimiä funktioiksi.
 * Ei muuta projektin tiedostoja.
 */

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function requestedSymbols(prompt) {
  // Poistetaan tiedostopolut ja tiedostonimet
  // ennen funktioiden tunnistamista.
  //
  // Esimerkiksi tacticsMana.js ei saa
  // muuttua etsittäväksi funktioksi.

  const cleaned = String(prompt || "").replace(
    /(?:[\w.$-]+[\\/])*[\w.$-]+\.(?:jsx?|tsx?|mjs|cjs)\b/gi,
    " ",
  )

  const words =
    cleaned.match(
      /\b[A-Za-z_$][A-Za-z0-9_$]*\b/g,
    ) || []

  return [...new Set(words)]
    .filter(word => /[a-z][A-Z]/.test(word))
    .slice(0, 10)
}

function extractFunction(content, symbol) {
  const escaped = escapeRegex(symbol)

  const pattern = new RegExp(
    `^\\s*(?:export\\s+)?(?:async\\s+)?` +
    `function\\s+${escaped}\\s*\\(`,
    "m",
  )

  const match = pattern.exec(content)

  if (!match) {
    return null
  }

  const start = match.index
  const remaining = content.slice(start)

  // Rajattu tekstipohjainen poiminta.
  // Ei täydellinen JavaScript-jäsennin.

  const endMatch = /^}\s*$/m.exec(remaining)

  if (!endMatch) {
    return null
  }

  const end = endMatch.index + endMatch[0].length

  return remaining.slice(0, end).trim()
}

// A reader-found function longer than this is not offered as verified
// source: the Reliability Gate refuses snippets over 12000 characters.
const MAX_CANDIDATE_CHARS = 8000

/**
 * candidates: functions the Code Reader found relevant to a question
 * written in plain words ({ symbol, filePath, content } with the FULL file
 * content from a guarded read). Without them a natural-language question
 * verified nothing and every answer was blocked (EVIDENCE_COUNT). They are
 * extracted from the real file exactly like a named symbol; a candidate
 * that cannot be extracted is skipped, never reported as "missing" (the
 * user did not ask for it by name).
 */
export function verifyHearthwoodSources(
  prompt,
  codeFiles = [],
  { candidates = [] } = {},
) {
  const requested = requestedSymbols(prompt)
  const verified = []
  const missing = []

  for (const symbol of requested) {
    let found = false

    for (const file of codeFiles) {
      if (
        typeof file?.filePath !== "string" ||
        typeof file?.content !== "string"
      ) {
        continue
      }

      const source = extractFunction(
        file.content,
        symbol,
      )

      if (!source) {
        continue
      }

      verified.push({
        symbol,
        filePath: file.filePath,
        source,
        truncated: Boolean(file.truncated),
      })

      found = true
      break
    }

    if (!found) {
      missing.push(symbol)
    }
  }

  // Up to 4 reader functions; one that cannot be offered (too long, not a
  // function) does not use up a place - the next candidate gets it.
  let fromReader = 0
  for (const candidate of candidates.slice(0, 12)) {
    if (fromReader >= 4) break
    if (
      typeof candidate?.symbol !== "string" ||
      typeof candidate?.filePath !== "string" ||
      typeof candidate?.content !== "string" ||
      verified.some(item => item.symbol === candidate.symbol)
    ) {
      continue
    }
    const source = extractFunction(candidate.content, candidate.symbol)
    if (!source || source.length > MAX_CANDIDATE_CHARS) continue
    verified.push({
      symbol: candidate.symbol,
      filePath: candidate.filePath,
      source,
      truncated: false,
      origin: "reader",
    })
    fromReader += 1
  }

  return {
    verified,
    missing,
    count: verified.length,
    warning:
      "Koodikatkelmat on poimittu luetusta lähdekoodista. " +
      "Poiminta ei vielä tarkista funktioiden kaikkia riippuvuuksia.",
  }
}
