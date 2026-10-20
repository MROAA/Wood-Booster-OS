/**
 * Spacemonkey Eval — does the model decide correctly? (needs ground truth)
 *
 * Runs server/spacemonkey-eval/cases.json against a temporary copy of the
 * herbalism fixture game and scores the model's decision against the known
 * answer. Separate from unit tests on purpose: unit tests check what the
 * machine verifies; this measures model correctness. Read-only for the repo.
 *
 * Usage (from server/): npm run spacemonkey:eval -- [--repeat 3] [--model qwen2.5-coder:14b]
 */
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const evalDir = path.join(here, "../spacemonkey-eval")
const args = process.argv.slice(2)
const repeat = Math.max(1, Math.min(10, Number(args[args.indexOf("--repeat") + 1]) || 1))
const model = args.includes("--model") ? args[args.indexOf("--model") + 1] : undefined

const root = await fs.mkdtemp(path.join(os.tmpdir(), "spacemonkey-eval-"))
await fs.cp(path.join(evalDir, "fixture"), root, { recursive: true })
await fs.writeFile(path.join(root, "src/services/heartwood/weatherHerbs.js"),
  "// weather withers herbs\n" + "x".repeat(600000))
process.env.HEARTHWOOD_PROJECT_ROOT = root

const { generateHearthwoodChangePlan } = await import("../services/hearthwoodChangePlanGenerator.js")
const cases = JSON.parse(await fs.readFile(path.join(evalDir, "cases.json"), "utf8"))

let correct = 0
let total = 0
try {
  for (const item of cases) {
    const runs = []
    for (let i = 0; i < repeat; i += 1) {
      const started = Date.now()
      try {
        const plan = await generateHearthwoodChangePlan({ prompt: item.task, model })
        const decision = plan.proposedDecision || "CHANGE_REQUIRED"
        const files = plan.files.map(f => f.filePath)
        const ok = decision === item.expect &&
          (item.mustInclude || []).every(file => files.includes(file))
        runs.push({ decision, files, ok, seconds: (Date.now() - started) / 1000,
          followUps: plan.planQuality?.followUps?.length || 0 })
      } catch (error) {
        runs.push({ decision: "REFUSED", files: [], ok: false, error: error.message.slice(0, 120),
          seconds: (Date.now() - started) / 1000 })
      }
    }
    const hits = runs.filter(r => r.ok).length
    correct += hits
    total += runs.length
    console.log(`${item.id}: odotus ${item.expect} → ${hits}/${runs.length} oikein`)
    for (const r of runs) {
      console.log(`  ${r.ok ? "✓" : "✗"} ${r.decision} ${r.files.join(", ") || "-"}` +
        `${r.followUps ? ` (+${r.followUps} jatkoideaa)` : ""} ${r.seconds.toFixed(1)} s${r.error ? ` — ${r.error}` : ""}`)
    }
  }
  console.log(`YHTEENSÄ: ${correct}/${total} oikein (${model || "oletusmalli"})`)
} finally {
  await fs.rm(root, { recursive: true, force: true })
}
