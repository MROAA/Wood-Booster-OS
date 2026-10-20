import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { findVerifiedCallsInSource, formatVerifiedCallSiteAnswer, verifyHearthwoodCallSites, isHearthwoodCallSiteQuestion } from './hearthwoodCallSiteVerification.js'

const SOURCE = `export function classResourceId(classId) {\n  return CLASSES[classId]?.resource || 'arcane'\n}\nexport function resourceIdOf(u) {\n  if (!u) return 'arcane'\n  return u.classId ? classResourceId(u.classId) : 'arcane'\n}\n`

test('Finnish caller questions are recognized', () => {
  assert.equal(isHearthwoodCallSiteQuestion('Mikä funktio kutsuu classResourceId-funktiota?'), true)
  assert.equal(isHearthwoodCallSiteQuestion('Selitä resursseja'), false)
})

test('verifies caller and exact line from real source, not the function definition', () => {
  const matches = findVerifiedCallsInSource(SOURCE, 'classResourceId', 'src/services/heartwood/tacticsMana.js')
  assert.equal(matches.length, 1)
  assert.equal(matches[0].caller, 'resourceIdOf')
  assert.equal(matches[0].line, 6)
})

test('ignores call-looking comments and strings', () => {
  const source = `// classResourceId(1)\nconst str = 'classResourceId(2)'\n/* classResourceId(3) */\n${SOURCE}`
  assert.equal(findVerifiedCallsInSource(source, 'classResourceId', 'src/services/heartwood/tacticsMana.js').length, 1)
})

test('rejects invalid symbol names', () => {
  assert.deepEqual(findVerifiedCallsInSource('foo(1)', 'foo|bar', 'a.js'), [])
})

test('read-only verification reports hash and call site', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-calls-'))
  try {
    const rel = 'src/services/heartwood/tacticsMana.js'
    await fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true })
    await fs.writeFile(path.join(root, rel), SOURCE)
    const result = await verifyHearthwoodCallSites([{ symbol: 'classResourceId', filePath: rel }], root)
    assert.equal(result.status, 'VERIFIED_MATCHES')
    assert.equal(result.matches[0].caller, 'resourceIdOf')
    assert.match(result.matches[0].sha256, /^[a-f0-9]{64}$/)
    assert.match(formatVerifiedCallSiteAnswer(result), /rivi 6/)
    assert.equal(result.completeProjectScan, false)
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

test('symlink to a file outside root is blocked', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-root-'))
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-outside-'))
  try {
    const rel = 'src/services/heartwood/tacticsMana.js'
    await fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true })
    await fs.writeFile(path.join(outside, 'tacticsMana.js'), SOURCE)
    await fs.symlink(path.join(outside, 'tacticsMana.js'), path.join(root, rel))
    const result = await verifyHearthwoodCallSites([{ symbol: 'classResourceId', filePath: rel }], root)
    assert.equal(result.status, 'NOT_CHECKED')
    assert.equal(result.matches.length, 0)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
    await fs.rm(outside, { recursive: true, force: true })
  }
})

test('path traversal is denied', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-root-'))
  try {
    const result = await verifyHearthwoodCallSites([{ symbol: 'classResourceId', filePath: 'src/../outside.js' }], root)
    assert.equal(result.status, 'NOT_CHECKED')
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

test('no match does not imply project-wide absence', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-root-'))
  try {
    const rel = 'src/services/heartwood/tacticsMana.js'
    await fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true })
    await fs.writeFile(path.join(root, rel), 'export function classResourceId() { return 1 }\n')
    const result = await verifyHearthwoodCallSites([{ symbol: 'classResourceId', filePath: rel }], root)
    assert.equal(result.status, 'NOT_FOUND_IN_SCOPE')
    assert.match(formatVerifiedCallSiteAnswer(result), /ei osoita, ettei/)
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})
