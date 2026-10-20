import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { auditHearthwoodAutopilotSafety as audit } from './spacemonkey-safety-supervisor.mjs'

async function fixture(fn) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-supervisor-'))
  const filePath = 'src/services/heartwood/tacticsMana.js'
  const absolute = path.join(root, filePath)
  const content = 'export function classResourceId(id) { return "arcane" }\n'
  await fs.mkdir(path.dirname(absolute), { recursive: true })
  await fs.writeFile(absolute, content)
  const sha256 = createHash('sha256').update(content).digest('hex')
  const input = {
    gameRoot: root,
    plan: { success: true, explanation: 'Source quoted correctly', files: [{ action: 'modify', filePath }], inspectedFiles: [{ filePath, truncated: false }] },
    reliability: { projectRoot: root, decision: 'CAUTION', sourceIntegrity: 'verified', executionApproved: false, issues: [], checkedEvidence: [{ filePath, symbol: 'classResourceId', sha256 }], checkedFiles: [{ filePath, action: 'modify', sha256 }] },
    sourceTruth: { decision: 'CAUTION', codeQuotationsVerified: true, executionApproved: false, issues: [], checkedQuotes: [{ quoteIndex: 0, filePath, sha256 }] },
  }
  try { await fn(input, { filePath, absolute, root }) }
  finally { await fs.rm(root, { recursive: true, force: true }) }
}

test('sane verified proposal is CAUTION for review only', () => fixture(async input => {
  const result = await audit(input)
  assert.equal(result.decision, 'CAUTION')
  assert.equal(result.allowedToDisplay, true)
  assert.equal(result.readyForCodeChanges, false)
  assert.equal(result.executionApproved, false)
  assert.equal(result.interpretationVerified, false)
  assert.equal(result.fullContextVerified, true)
}))

test('fabricated / unverified quotes BLOCK', () => fixture(async input => {
  input.sourceTruth = { decision: 'CAUTION', codeQuotationsVerified: false, checkedQuotes: [], issues: [] }
  const result = await audit(input)
  assert.equal(result.decision, 'BLOCK')
  assert(result.issues.some(x => x.code === 'QUOTATIONS_UNVERIFIED'))
}))

test('Plan Gate BLOCK is non-overridable', () => fixture(async input => {
  input.reliability.decision = 'BLOCK'
  assert.equal((await audit(input)).decision, 'BLOCK')
}))

test('changed file content since Plan Gate BLOCK', () => fixture(async (input, { absolute }) => {
  await fs.writeFile(absolute, 'export function classResourceId(id) { return "rage" }\n')
  const result = await audit(input)
  assert(result.issues.some(x => x.code === 'FILE_CHANGED_OR_UNSAFE'))
  assert.equal(result.allowedToDisplay, false)
}))

test('quotes with unrelated hashes BLOCK', () => fixture(async input => {
  input.sourceTruth.checkedQuotes[0].sha256 = 'f'.repeat(64)
  assert((await audit(input)).issues.some(x => x.code === 'QUOTE_SOURCE_NOT_IN_EVIDENCE'))
}))

test('uninspected target file BLOCK', () => fixture(async input => {
  input.plan.inspectedFiles = []
  assert((await audit(input)).issues.some(x => x.code === 'FILE_NOT_INSPECTED'))
}))

test('partial file can be displayed with warning but NEVER marked ready for changes', () => fixture(async input => {
  input.plan.inspectedFiles[0].truncated = true
  const result = await audit(input)
  assert.equal(result.decision, 'CAUTION')
  assert.equal(result.fullContextVerified, false)
  assert.equal(result.readyForCodeChanges, false)
  assert(result.warnings.some(x => x.code === 'PARTIAL_SOURCE_CONTEXT'))
}))

test('traversal paths BLOCK', () => fixture(async input => {
  input.plan.files[0].filePath = 'src/services/heartwood/../../evil.js'
  assert((await audit(input)).issues.some(x => x.code === 'INVALID_FILE_PATH'))
}))

test('symlink escape BLOCK even when hash is correct', () => fixture(async (input, { root, filePath }) => {
  const other = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-external-'))
  try {
    const outside = path.join(other, 'external.js')
    await fs.writeFile(outside, 'export function classResourceId(id) { return "arcane" }\n')
    await fs.unlink(path.join(root, filePath))
    await fs.symlink(outside, path.join(root, filePath))
    assert((await audit(input)).issues.some(x => x.code === 'FILE_CHANGED_OR_UNSAFE'))
  } finally { await fs.rm(other, { recursive: true, force: true }) }
}))

test('unexpected execution approval is always BLOCK', () => fixture(async input => {
  input.sourceTruth.executionApproved = true
  assert((await audit(input)).issues.some(x => x.code === 'UNEXPECTED_EXECUTION_APPROVAL'))
}))

test('oversized plans are BLOCKed', () => fixture(async input => {
  input.plan.files = Array.from({length: 7}, (_, i) => ({action:'create', filePath:`src/data/heartwood/new${i}.js`}))
  assert((await audit(input)).issues.some(x => x.code === 'INVALID_PLAN_SIZE'))
}))

test('create target must not already exist', () => fixture(async input => {
  input.plan.files[0].action = 'create'
  input.plan.inspectedFiles = []
  input.reliability.checkedFiles[0].action = 'create'
  const result = await audit(input)
  assert(result.issues.some(x => x.code === 'FILE_CHANGED_OR_UNSAFE'))
}))

test('missing or inconsistent project root BLOCK', () => fixture(async input => {
  input.reliability.projectRoot = '/tmp/nonexistent-spacemonkey'
  assert((await audit(input)).issues.some(x => x.code === 'PROJECT_ROOT_MISMATCH'))
}))
