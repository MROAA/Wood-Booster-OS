import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { createHash } from "node:crypto"
import { auditHearthwoodPlanCodeQuotes as audit } from "./hearthwoodSourceTruthGuard.js"

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "source-truth-"))
  const filePath = "src/services/heartwood/tacticsMana.js"
  const content = 'export function classResourceId(classId) {\n  return CLASSES[classId]?.resource || "arcane"\n}\n'
  const absolute = path.join(root, filePath)
  await fs.mkdir(path.dirname(absolute), { recursive: true })
  await fs.writeFile(absolute, content)
  const sha256 = createHash("sha256").update(content).digest("hex")
  return { root, absolute, reliability: { decision: "CAUTION", sourceIntegrity: "verified", projectRoot: root, checkedEvidence: [{ filePath, symbol: "classResourceId", sha256 }] } }
}

test("accepts genuine source quotation but never approves execution", async t => {
  const f = await fixture()
  t.after(() => fs.rm(f.root, { recursive: true, force: true }))
  const result = await audit({ reliability: f.reliability, explanation: 'Nykyinen toteutus:\n```js\nexport function classResourceId(classId) {\n  return CLASSES[classId]?.resource || "arcane"\n}\n```\nEhdotettu muutos: kokeile toista ratkaisua' })
  assert.equal(result.decision, "CAUTION")
  assert.equal(result.codeQuotationsVerified, true)
  assert.equal(result.executionApproved, false)
  assert.equal(result.interpretationVerified, false)
})

test("blocks the exact fabricated classResourceId quote from Ollama", async t => {
  const f = await fixture()
  t.after(() => fs.rm(f.root, { recursive: true, force: true }))
  const result = await audit({ reliability: f.reliability, explanation: 'Todiste lähdekoodista:\n```javascript\nfunction classResourceId(classId) {\n  return classId;\n}\n```\nEhdotettu muutos: suunnitelma' })
  assert.equal(result.decision, "BLOCK")
  assert.equal(result.issues[0].code, "FABRICATED_SOURCE_QUOTE")
})

test("never claims prose is verified", async t => {
  const f = await fixture()
  t.after(() => fs.rm(f.root, { recursive: true, force: true }))
  const result = await audit({ reliability: f.reliability, explanation: "Nykyinen toteutus palauttaa aina classId:n." })
  assert.equal(result.decision, "CAUTION")
  assert.equal(result.codeQuotationsVerified, false)
  assert.equal(result.interpretationVerified, false)
})

test("proposed code is distinct from claimed real code", async t => {
  const f = await fixture()
  t.after(() => fs.rm(f.root, { recursive: true, force: true }))
  const result = await audit({ reliability: f.reliability, explanation: 'Nykyinen toteutus on epävarma.\nEhdotettu muutos:\n```js\nreturn "proposal"\n```' })
  assert.equal(result.decision, "CAUTION")
  assert.equal(result.codeQuotationsVerified, false)
})

test("blocks changed source file after plan verification", async t => {
  const f = await fixture()
  t.after(() => fs.rm(f.root, { recursive: true, force: true }))
  await fs.appendFile(f.absolute, "// changed\n")
  const result = await audit({ reliability: f.reliability, explanation: "Test" })
  assert.equal(result.decision, "BLOCK")
  assert.equal(result.issues[0].code, "SOURCE_CHANGED_OR_UNREADABLE")
})

test("blocks when upstream gate has not approved source integrity", async () => {
  const result = await audit({ explanation: "anything", reliability: { decision: "BLOCK" } })
  assert.equal(result.decision, "BLOCK")
})
