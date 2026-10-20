import test from "node:test"
import assert from "node:assert/strict"
import { assessHearthwoodPlanQuality, parseFollowUps, BROAD_PLAN_FILES } from "./hearthwoodPlanQuality.js"

const codeFiles = [
  { filePath: "src/services/heartwood/a.js", content: "export function alpha() {}\nexport function beta() {}" },
  { filePath: "src/services/heartwood/b.js", content: "export const GAMMA = 1" },
]

test("follow-ups are parsed from JATKO lines only and capped", () => {
  const text = Array.from({ length: 8 }, (_, i) => `- JATKO: idea numero ${i}`).join("\n") +
    "\n- MUOKKAA: src/x.js | ei jatko\n- JATKO: ab"
  const ideas = parseFollowUps(text)
  assert.equal(ideas.length, 5)
  assert.ok(ideas.every(idea => idea.startsWith("idea numero")))
})

test("a file is justified only by its own read symbol, not by a symbol of another file", () => {
  const quality = assessHearthwoodPlanQuality({
    decision: "CHANGE_REQUIRED",
    files: [
      { action: "modify", filePath: "src/services/heartwood/a.js", reason: "alpha muuttuu" },
      { action: "modify", filePath: "src/services/heartwood/b.js", reason: "alpha käyttää tätä" },
    ],
    explanation: "Nykyinen toteutus: alpha.",
    codeFiles,
  })
  assert.deepEqual(quality.requiredChanges.map(f => f.filePath), ["src/services/heartwood/a.js"])
  assert.deepEqual(quality.unsupportedFiles.map(f => f.filePath), ["src/services/heartwood/b.js"])
})

test("symbol matching is exact: a longer name does not justify a shorter one", () => {
  const quality = assessHearthwoodPlanQuality({
    decision: "CHANGE_REQUIRED",
    files: [{ action: "modify", filePath: "src/services/heartwood/a.js", reason: "alphabet ja betaVersion" }],
    codeFiles,
  })
  assert.equal(quality.unsupportedFiles.length, 1)
})

test("new files are allowed but marked unverifiable; broad plans warn", () => {
  const files = Array.from({ length: BROAD_PLAN_FILES + 1 }, (_, i) =>
    ({ action: "create", filePath: `src/services/heartwood/new${i}.js`, reason: "uusi" }))
  const quality = assessHearthwoodPlanQuality({ decision: "CHANGE_REQUIRED", files, codeFiles })
  assert.ok(quality.requiredChanges.every(f => f.support === "new-file-unverifiable"))
  assert.equal(quality.checks.find(c => c.id === "minimal").status, "warning")
})

test("missing explanation sections are reported as incomplete, never verified", () => {
  const quality = assessHearthwoodPlanQuality({
    decision: "CHANGE_REQUIRED",
    files: [{ action: "modify", filePath: "src/services/heartwood/a.js", reason: "alpha" }],
    explanation: "Nykyinen toteutus: alpha tekee asian. Ehdotettu muutos: ...",
    codeFiles,
  })
  const sections = quality.checks.find(c => c.id === "model-sections")
  assert.equal(sections.status, "incomplete")
  assert.match(sections.detail, /change, dependencies, tests, risks/)
  assert.equal(quality.checks.find(c => c.id === "dependencies").status, "not-checked")
})
