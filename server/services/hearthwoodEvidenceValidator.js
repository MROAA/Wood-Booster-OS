
/**
 * Hearthwood Dev Studio
 * Evidence Validator
 *
 * Tarkistaa, että Spacemonkeyn suunnitelmassa
 * viitataan oikeasti luettuun lähdekoodiin.
 *
 * Ei kirjoita tai muuta projektin tiedostoja.
 */

const SYMBOL_PATTERN =
  /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|\bexport\s+(?:const|let|class)\s+([A-Za-z_$][\w$]*)\b/g

export function extractHearthwoodEvidence(codeFiles = []) {
  const evidence = []

  for (const file of codeFiles) {
    if (
      !file ||
      typeof file.filePath !== "string" ||
      typeof file.content !== "string"
    ) {
      continue
    }

    const found = new Set()

    for (const match of file.content.matchAll(SYMBOL_PATTERN)) {
      const symbol = match[1] || match[2]

      if (!symbol || found.has(symbol)) {
        continue
      }

      found.add(symbol)

      evidence.push({
        filePath: file.filePath,
        symbol,
        truncated: Boolean(file.truncated),
      })
    }
  }

  return evidence
}

export function validateHearthwoodEvidence(
  explanation,
  codeFiles = [],
) {
  const evidence = extractHearthwoodEvidence(codeFiles)

  if (evidence.length === 0) {
    return {
      valid: false,
      reason: "Luetusta koodista ei löytynyt tarkistettavia symboleja.",
      references: [],
    }
  }

  const text = String(explanation || "")

  const references = evidence.filter(item =>
    text.includes(item.symbol),
  )

  if (references.length === 0) {
    return {
      valid: false,
      reason:
        "Suunnitelma ei viittaa yhteenkään luetusta lähdekoodista löytyvään funktioon tai vakioon.",
      references: [],
    }
  }

  return {
    valid: true,
    references,
    warning:
      "Symboliviittaus on tarkistettu, mutta muutosehdotuksen oikeellisuutta ei ole vielä vahvistettu.",
  }
}

export function formatHearthwoodEvidence(codeFiles = []) {
  const evidence = extractHearthwoodEvidence(codeFiles)

  if (evidence.length === 0) {
    return "Ei tarkistettavia lähdekoodiviitteitä."
  }

  return evidence
    .map(item =>
      `${item.filePath} → ${item.symbol}`
    )
    .join("\n")
}
