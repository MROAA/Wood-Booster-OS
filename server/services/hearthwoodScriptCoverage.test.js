import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { extractCheckLabels, findScriptChecks } from "./hearthwoodScriptCoverage.js"

test("check descriptions are read from ok/c/errors.push lines", () => {
  const labels = extractCheckLabels([
    'ok(a === 1, "Intercept: the Guardian takes half (+1 Holy)", r)',
    "if (!ok) out.errors.push(\"check157 an ineligible Guardian still intercepted\")",
    "const intercept = 1 // not a check",
  ].join("\n"))
  assert.deepEqual(labels.map(l => [l.line, l.label]), [[1, "Intercept: the Guardian takes half (+1 Holy)"], [2, "check157 an ineligible Guardian still intercepted"]])
})

test("only tracked .scratch/verify_*.mjs are read; a name alone is not a test; nothing runs", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "hw-scripts-"))
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { stdio: "pipe" })
  git("init", "-q")
  await fs.mkdir(path.join(root, ".scratch"))
  await fs.writeFile(path.join(root, ".scratch/verify_guard.mjs"), 'process.exit(99)\nok(x, "Intercept shares the hit")\n')
  // names onGuard in its code, but its only check is about something else
  await fs.writeFile(path.join(root, ".scratch/verify_name_only.mjs"), 'const f = onGuard\nok(y, "market prices are rounded")\n')
  await fs.writeFile(path.join(root, ".scratch/verify_untracked.mjs"), 'ok(x, "Intercept untracked")\n')
  await fs.writeFile(path.join(root, ".scratch/notes_intercept.mjs"), 'ok(x, "Intercept in a non-verify file")\n')
  git("add", ".scratch/verify_guard.mjs", ".scratch/verify_name_only.mjs", ".scratch/notes_intercept.mjs")
  const result = await findScriptChecks({ terms: ["intercept"], symbols: ["onGuard"], root })
  assert.equal(result.examined, true)
  assert.deepEqual(result.files.map(f => [f.file, f.checks.map(c => c.label)]), [[".scratch/verify_guard.mjs", ["Intercept shares the hit"]]])
  assert.deepEqual(result.mentionsOnly, [{ file: ".scratch/verify_name_only.mjs", symbols: ["onGuard"] }])
  await fs.rm(root, { recursive: true, force: true })
})

test("without git history nothing is claimed as examined", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "hw-nogit-"))
  const result = await findScriptChecks({ terms: ["intercept"], root })
  assert.equal(result.examined, false)
  assert.deepEqual(result.files, [])
  await fs.rm(root, { recursive: true, force: true })
})
