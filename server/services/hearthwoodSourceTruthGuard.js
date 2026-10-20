/**
 * Hearthwood Source Truth Guard V1.
 * Verifies source-code quotations *presented as existing source* in an AI plan.
 * Proposed changes after "Ehdotettu muutos:" are not treated as quotations.
 * Read-only. This does NOT verify semantic correctness of AI prose.
 */
import fs from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"

const MAX_EXPLANATION = 80000
const MAX_BLOCKS = 20
const MAX_SOURCE_BYTES = 512000
const MAX_REFERENCES = 30

const blocked = (issues) => ({
  decision: "BLOCK",
  codeQuotationsVerified: false,
  interpretationVerified: false,
  executionApproved: false,
  checkedQuotes: [],
  issues,
})

function inside(root, target) {
  const relative = path.relative(root, target)
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

function clean(text) {
  return text.replace(/\r\n?/g, "\n").trim()
}

async function readTrustedSource(root, item) {
  const filePath = item?.filePath
  if (
    typeof filePath !== "string" ||
    path.isAbsolute(filePath) ||
    filePath.includes("\\") ||
    filePath.includes("\0") ||
    path.posix.normalize(filePath) !== filePath ||
    !/\.(?:js|jsx|ts|tsx)$/.test(filePath) ||
    !/^[a-f0-9]{64}$/.test(item?.sha256 || "")
  ) {
    throw Error("Invalid trusted source metadata")
  }

  const resolved = await fs.realpath(path.resolve(root, filePath))
  if (!inside(root, resolved)) throw Error("Outside project")
  const stats = await fs.stat(resolved)
  if (!stats.isFile() || stats.size > MAX_SOURCE_BYTES) throw Error("Source file too large")
  const content = await fs.readFile(resolved, "utf8")
  const digest = createHash("sha256").update(content).digest("hex")
  if (digest !== item.sha256) throw Error("Source changed after verification")
  return { filePath, content: clean(content), sha256: digest }
}

function extractClaims(explanation) {
  // Proposals are explicitly NOT claimed to be verbatim existing source.
  const sourceSection = explanation.split(/^[ \t]*Ehdotettu muutos\s*:/im)[0]
  const re = /^[ \t]*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*$/gm
  return [...sourceSection.matchAll(re)].map(match => clean(match[2]))
}

export async function auditHearthwoodPlanCodeQuotes({ explanation, reliability } = {}) {
  if (reliability?.decision !== "CAUTION" || reliability?.sourceIntegrity !== "verified") {
    return blocked([{ code: "UNVERIFIED_PLAN", message: "Lähteitä ei ole vahvistettu." }])
  }
  if (typeof explanation !== "string" || !explanation.trim() || explanation.length > MAX_EXPLANATION) {
    return blocked([{ code: "INVALID_EXPLANATION", message: "Selitys puuttuu tai ylittää kokorajan." }])
  }
  const claims = extractClaims(explanation)
  if (claims.length > MAX_BLOCKS || claims.some(quote => !quote || quote.length > 20000)) {
    return blocked([{ code: "INVALID_CODE_QUOTATIONS", message: "Koodilainaukset eivät ole sallittua muotoa." }])
  }

  const refs = reliability.checkedEvidence
  if (!Array.isArray(refs) || refs.length === 0 || refs.length > MAX_REFERENCES) {
    return blocked([{ code: "NO_VERIFIED_EVIDENCE", message: "Tarkistettuja lähdeviitteitä ei ole." }])
  }

  let root
  let sources
  try {
    root = await fs.realpath(reliability.projectRoot)
    const seen = new Set()
    sources = []
    for (const ref of refs) {
      if (seen.has(ref.filePath)) continue
      seen.add(ref.filePath)
      sources.push(await readTrustedSource(root, ref))
    }
  } catch {
    return blocked([{ code: "SOURCE_CHANGED_OR_UNREADABLE", message: "Lähdettä ei voitu lukea tai sen tiiviste muuttui." }])
  }

  const checkedQuotes = []
  const issues = []
  for (const [index, quote] of claims.entries()) {
    const matched = sources.find(source => source.content.includes(quote))
    if (!matched) {
      issues.push({ code: "FABRICATED_SOURCE_QUOTE", quoteIndex: index, message: "AI:n lähdekoodilainaus ei vastaa tarkistettua tiedostoa." })
    } else {
      checkedQuotes.push({ quoteIndex: index, filePath: matched.filePath, sha256: matched.sha256 })
    }
  }
  if (issues.length) {
    return { ...blocked(issues), checkedQuotes }
  }
  return {
    decision: "CAUTION",
    codeQuotationsVerified: claims.length > 0,
    verifiedQuotationCount: checkedQuotes.length,
    interpretationVerified: false,
    executionApproved: false,
    checkedQuotes,
    issues: [],
    warning: claims.length
      ? "Koodilainaukset vastaavat lähdetiedostoja. AI:n sanalliset tulkinnat ovat edelleen vahvistamattomia."
      : "Lähdekoodilainauksia ei löytynyt tarkistettavaksi. AI:n sanalliset tulkinnat ovat vahvistamattomia.",
  }
}
