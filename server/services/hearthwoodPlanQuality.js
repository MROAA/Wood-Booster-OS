/**
 * Hearthwood Dev Studio — Plan Quality
 *
 * Purpose: judge a change plan by what the machine can check, never by
 * how confident the model sounds. Keeps three questions apart:
 *   1. source authenticity — do the cited symbols really exist? (validator)
 *   2. plan quality        — is each file justified, minimal, tested?  (here)
 *   3. model correctness   — is the decision right? Needs ground truth
 *                            (spacemonkey-eval), not decidable here.
 *
 * Responsibilities:
 * - split the plan into required changes, follow-up ideas (JATKO lines)
 *   and unsupported files (no own symbol cited)
 * - list which explanation sections the model provided (model-claimed)
 * - attach the verified dependency impact and test coverage
 *
 * Dependencies: hearthwoodEvidenceValidator.extractHearthwoodEvidence,
 * hearthwoodSourceFacts.classifyReferences. Pure.
 *
 * Public API: parseFollowUps, planSymbolsFor, assessHearthwoodPlanQuality,
 * PLAN_SECTIONS, BROAD_PLAN_FILES.
 *
 * Tests: hearthwoodPlanQuality.test.js
 */
import { extractHearthwoodEvidence } from "./hearthwoodEvidenceValidator.js"
import { classifyReferences } from "./hearthwoodSourceFacts.js"

export const BROAD_PLAN_FILES = 3
const MAX_FOLLOW_UPS = 5

export const PLAN_SECTIONS = [
  { id: "baseline", label: "Nykyinen toteutus" },
  { id: "evidence", label: "Todiste lähdekoodista" },
  { id: "change", label: "Ehdotettu muutos" },
  { id: "dependencies", label: "Riippuvuudet" },
  { id: "impact", label: "Vaikutukset" },
  { id: "tests", label: "Testit" },
  { id: "risks", label: "Riskit" },
  { id: "uncertainty", label: "Epävarmuudet" },
]

/** "- JATKO: idea" lines: suggestions, never part of the change set. */
export function parseFollowUps(response) {
  return String(response || "")
    .split(/\r?\n/)
    .map(line => line.trim().match(/^-\s*JATKO\s*:\s*(.{5,240})$/i))
    .filter(Boolean)
    .map(match => match[1].trim())
    .slice(0, MAX_FOLLOW_UPS)
}

function sectionText(explanation, label) {
  const labels = PLAN_SECTIONS.map(s => s.label).join("|")
  const match = String(explanation || "").match(
    new RegExp(`${label}\\s*:\\s*([\\s\\S]*?)(?=(?:${labels})\\s*:|$)`, "i"))
  return match ? match[1].replace(/[.…\s]/g, "") : ""
}

/** Symbols really defined in what was read of a file. */
function symbolsReadIn(filePath, codeFiles) {
  return extractHearthwoodEvidence(codeFiles.filter(file => file.filePath === filePath))
    .map(item => item.symbol)
}

/**
 * Symbols of each planned file that the plan actually names (in the file's
 * reason or the explanation). These drive the dependency analysis.
 */
export function planSymbolsFor(files, explanation, codeFiles) {
  return files.flatMap(file => {
    const text = `${file.reason || ""}\n${explanation || ""}`
    return symbolsReadIn(file.filePath, codeFiles)
      .filter(symbol => new RegExp(`(^|[^\\w$])${symbol.replace(/\$/g, "\\$")}(?![\\w$])`).test(text))
      .map(symbol => ({ symbol, filePath: file.filePath }))
  })
}

export function assessHearthwoodPlanQuality({
  decision,
  files = [],
  explanation = "",
  response = "",
  references = [],
  codeFiles = [],
  sourceFacts = [],
  dependencyImpact = null,
  evidenceValid = false,
}) {
  const named = planSymbolsFor(files, explanation, codeFiles)
  const { strong } = classifyReferences(references, codeFiles, sourceFacts)
  const strongSet = new Set(strong)
  const chained = new Set(sourceFacts.filter(f => f.kind === "call").flatMap(f => [f.symbol, f.callee]))

  const requiredChanges = []
  const unsupportedFiles = []
  for (const file of files) {
    const own = named.filter(item => item.filePath === file.filePath).map(item => item.symbol)
    if (file.action === "create") {
      requiredChanges.push({ ...file, symbols: [], support: "new-file-unverifiable",
        coreLink: false })
    } else if (own.length) {
      requiredChanges.push({ ...file, symbols: own, support: "own-symbol-cited",
        coreLink: own.some(symbol => strongSet.has(symbol) || chained.has(symbol)) })
    } else {
      unsupportedFiles.push({ ...file,
        problem: "Perustelu ei nimeä yhtään tämän tiedoston luettua symbolia." })
    }
  }

  const sections = Object.fromEntries(PLAN_SECTIONS.map(section =>
    [section.id, sectionText(explanation, section.label).length >= 10]))
  const wantedSections = decision === "CHANGE_REQUIRED"
    ? ["baseline", "change", "dependencies", "tests", "risks"]
    : ["baseline", "uncertainty"]

  const checks = [
    { id: "source-authenticity", status: evidenceValid ? "verified" : "failed",
      detail: "Viitatut symbolit löytyvät luetusta lähdekoodista (EvidenceValidator)." },
    { id: "files-justified", status: unsupportedFiles.length ? "failed" : "verified",
      detail: unsupportedFiles.length
        ? `Perusteettomia tiedostoja: ${unsupportedFiles.map(f => f.filePath).join(", ")}`
        : "Jokainen muokattava tiedosto perustellaan sen omalla symbolilla." },
    { id: "minimal", status: requiredChanges.length > BROAD_PLAN_FILES ? "warning" : "verified",
      detail: requiredChanges.length > BROAD_PLAN_FILES
        ? `Laaja suunnitelma (${requiredChanges.length} tiedostoa); tarkista, onko jokainen välttämätön.`
        : `${requiredChanges.length} välttämätöntä tiedostoa.` },
    { id: "dependencies", status: dependencyImpact ? "verified-in-scope" : "not-checked",
      detail: dependencyImpact ? dependencyImpact.scope.limits : "Ei muutettavia symboleita." },
    { id: "tests", status: !dependencyImpact ? "not-checked"
        : dependencyImpact.missingRegressionTests.length ? "missing" : "verified",
      detail: dependencyImpact?.missingRegressionTests.length
        ? `Ei olemassa olevaa testiä: ${dependencyImpact.missingRegressionTests.join(", ")}`
        : "Muutettavilla symboleilla on olemassa olevia testejä tai ei muutettavaa." },
    { id: "model-sections", status: wantedSections.every(id => sections[id]) ? "model-claimed" : "incomplete",
      detail: `Mallin itse kertomat osiot (ei todennettu): puuttuu ${
        wantedSections.filter(id => !sections[id]).join(", ") || "ei mitään"}.` },
    { id: "model-correctness", status: "not-verifiable-here",
      detail: "Päätöksen oikeellisuus vaatii tunnetun oikean vastauksen (spacemonkey-eval) tai testin." },
  ]

  return {
    decision,
    requiredChanges,
    followUps: parseFollowUps(response),
    unsupportedFiles,
    modelSections: sections,
    dependencyImpact,
    checks,
  }
}
