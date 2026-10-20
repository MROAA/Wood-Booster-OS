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
 *   npm run spacemonkey:probe -- --guardian --llm --repeat 6 --model qwen2.5-coder:14b
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
  const options = { llm: false, expect: [], task: "", repeat: 1, model: undefined }
  const rest = []
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--llm") options.llm = true
    else if (arg === "--guardian") {
      options.task = GUARDIAN_TASK
      options.expect = ["attackUnit", "eligibleGuardian", "onGuard"]
    } else if (arg === "--repeat") options.repeat = Math.max(1, Math.min(20, Number(argv[++i]) || 1))
    else if (arg === "--model") options.model = argv[++i]
    else if (arg.startsWith("--") && arg !== "--expect") throw new Error(`Tuntematon valinta: ${arg}`)
    else if (arg === "--expect") options.expect = String(argv[++i] || "").split(",").filter(Boolean)
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
    const tally = new Map()
    out.push("")
    for (let run = 1; run <= options.repeat; run += 1) {
      const started = Date.now()
      let line
      try {
        const plan = await generateHearthwoodChangePlan({ prompt: task, model: options.model })
        const decision = plan.proposedDecision || "CHANGE_REQUIRED"
        const inference = plan.evidenceReport?.inference || {}
        tally.set(decision, (tally.get(decision) || 0) + 1)
        line = `${decision}  vahvat: ${(inference.strongReferences || []).join(", ") || "-"}` +
          `  heikot: ${(inference.weakReferences || []).join(", ") || "-"}  tiedostoja: ${plan.files.length}`
        if (plan.evidenceReport?.qualityNote) line += `\n      huom: ${plan.evidenceReport.qualityNote}`
      } catch (error) {
        tally.set("HYLÄTTY", (tally.get("HYLÄTTY") || 0) + 1)
        line = `HYLÄTTY: ${error.message.slice(0, 160)}`
      }
      out.push(`AI-ajo ${run}/${options.repeat} (${((Date.now() - started) / 1000).toFixed(1)} s): ${line}`)
    }
    out.push(`Jakauma (${options.model || "oletusmalli"}): ${[...tally].map(([k, v]) => `${k} ${v}/${options.repeat}`).join(", ")}`)
  }

  console.log(out.join("\n"))
  if (missing.length) process.exit(1)
}

main().catch(error => {
  console.error(`Probe epäonnistui: ${error.message}`)
  process.exit(2)
})
