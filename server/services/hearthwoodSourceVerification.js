
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

export function verifyHearthwoodSources(
  prompt,
  codeFiles = [],
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

  return {
    verified,
    missing,
    count: verified.length,
    warning:
      "Koodikatkelmat on poimittu luetusta lähdekoodista. " +
      "Poiminta ei vielä tarkista funktioiden kaikkia riippuvuuksia.",
  }
}
