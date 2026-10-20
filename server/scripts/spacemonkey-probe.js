/**
 * Spacemonkey Probe — one command instead of copy-paste.
 *
 * Purpose: run a development task through Spacemonkey's evidence chain
 * (file search → source reader → planning context → evidence index) and
 * print a short, paste-ready report. Read-only: never writes project files.
 *
 * Usage (from server/):
 *   npm run spacemonkey:probe -- "Tutki Guardianin Intercept"
 *   npm run spacemonkey:probe -- --expect attackUnit,onGuard "tehtävä"
 *   npm run spacemonkey:probe -- --llm "tehtävä"     # also asks Ollama
 *   npm run spacemonkey:probe -- --guardian           # standing regression case
 *
 * --expect: exit code 1 if a named symbol does not reach the model context.
 * --llm: runs generateHearthwoodChangePlan (still review-only; gates apply).
 */
import { listHearthwoodProjectFiles, findHearthwoodProjectFiles } from "../services/hearthwoodProjectExplorer.js"
import { readHearthwoodCode } from "../services/hearthwoodCodeReader.js"
import {
  chooseHearthwoodRequiredFiles,
  buildHearthwoodFocusedPlanningContext,
  buildHearthwoodFocusedEvidenceIndex,
} from "../services/hearthwoodPlanningContext.js"

const GUARDIAN_TASK =
  "Tutki Hearthwoodin Guardian-luokan Intercept ja Holy Power -resurssikertymä. " +
  "Selvitä oikeasta lähdekoodista, onko mekaniikka jo toteutettu. " +
  "Älä ehdota turhia muutoksia. Jos todisteet eivät riitä, ilmoita epävarmuus. Älä muuta tiedostoja."

function parseArgs(argv) {
  const options = { llm: false, expect: [], task: "" }
  const rest = []
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--llm") options.llm = true
    else if (arg === "--guardian") {
      options.task = GUARDIAN_TASK
      options.expect = ["attackUnit", "eligibleGuardian", "onGuard"]
    } else if (arg === "--expect") options.expect = String(argv[++i] || "").split(",").filter(Boolean)
    else rest.push(arg)
  }
  if (rest.length) options.task = rest.join(" ")
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.task.trim()) {
    console.error('Anna tehtävä: npm run spacemonkey:probe -- "tehtävä"  (tai --guardian)')
    process.exit(2)
  }

  const task = options.task.trim()
  const allFiles = await listHearthwoodProjectFiles()
  const search = await findHearthwoodProjectFiles(task, 10)
  const required = chooseHearthwoodRequiredFiles(task, allFiles)
  const read = await readHearthwoodCode(task, { requiredFiles: required })
  const context = buildHearthwoodFocusedPlanningContext(read.files, task)
  const index = buildHearthwoodFocusedEvidenceIndex(read.files, task)

  const out = []
  out.push("SPACEMONKEY PROBE")
  out.push(`Tehtävä: ${task}`)
  out.push(`Tiedostoja projektissa: ${allFiles.length}`)
  out.push("")
  out.push("Haun kärki:")
  for (const match of search.matches.slice(0, 6)) {
    const symbols = match.matchedSymbols?.length ? ` [${match.matchedSymbols.join(", ")}]` : ""
    out.push(`  ${match.score}  ${match.filePath}${symbols}`)
  }
  out.push(`Pakolliset: ${required.join(", ") || "-"}`)
  out.push("")
  out.push("Luetut tiedostot (katkelmat):")
  for (const file of read.files) {
    const excerpts = (file.excerpts || []).map(e => `${e.symbol}:${e.startLine}-${e.endLine}`).join(", ")
    out.push(`  ${file.filePath} ${file.truncated ? "(katkaistu)" : "(kokonaan)"}`)
    if (excerpts) out.push(`    luettu: ${excerpts}`)
    if (file.omittedSymbols?.length) out.push(`    lukematta: ${file.omittedSymbols.join(", ")}`)
  }
  out.push(`Mallin konteksti: ${context.length} merkkiä, indeksissä ${index.split("\n").length} symbolia`)

  let missing = []
  if (options.expect.length) {
    // The definition's source must be in the context, not just its name
    // (a name on a "LUKEMATTA JÄI" line is not evidence).
    const defined = symbol => new RegExp(`(?:function|const|let|class)\\s+${symbol}\\b`).test(context)
    missing = options.expect.filter(symbol => !defined(symbol) || !index.includes(symbol))
    out.push("")
    out.push(`Odotetut symbolit: ${options.expect.map(s => `${s} ${missing.includes(s) ? "PUUTTUU" : "OK"}`).join(", ")}`)
  }

  if (options.llm) {
    const { generateHearthwoodChangePlan } = await import("../services/hearthwoodChangePlanGenerator.js")
    out.push("")
    try {
      const plan = await generateHearthwoodChangePlan({ prompt: task })
      out.push(`AI-päätös: ${plan.proposedDecision || "CHANGE_REQUIRED"} (status ${plan.status})`)
      out.push(`Todisteviitteet: ${(plan.evidence?.references || []).map(r => r.symbol).join(", ") || "-"}`)
      out.push(`Tiedostomuutoksia ehdotettu: ${plan.files.length}`)
      out.push(`Selitys: ${plan.explanation}`)
    } catch (error) {
      out.push(`AI-ajo epäonnistui: ${error.message}`)
    }
  }

  console.log(out.join("\n"))
  if (missing.length) process.exit(1)
}

main().catch(error => {
  console.error(`Probe epäonnistui: ${error.message}`)
  process.exit(2)
})
