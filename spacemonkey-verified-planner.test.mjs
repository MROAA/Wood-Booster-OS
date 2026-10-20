import test from 'node:test'
import assert from 'node:assert/strict'
import { runVerifiedPlanningLoop, verifiedSourceExcerpts } from './spacemonkey-verified-planner.mjs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'

const plan = explanation => ({ success: true, explanation, files: [], evidence: {} })
const reliable = () => ({ decision: 'CAUTION', sourceIntegrity: 'verified', checkedEvidence: [{filePath: 'src/services/heartwood/a.js', symbol: 'classResourceId', sha256: 'a'.repeat(64)}], issues: [] })
const fake = () => ({ decision: 'BLOCK', checkedQuotes: [], issues: [{ code: 'FABRICATED_SOURCE_QUOTE' }] })
const genuine = () => ({ decision: 'CAUTION', codeQuotationsVerified: true, checkedQuotes: [{ quoteIndex: 0 }], issues: [] })
const excerpts = async () => [{ filePath: 'src/services/heartwood/a.js', symbol: 'classResourceId', excerpt: 'export function classResourceId(id) {\n  return "arcane"\n}' }]

test('keksitty lainaus korjautuu toisella yrityksellä ja jää tarkastettavaksi', async () => {
  let n = 0
  const r = await runVerifiedPlanningLoop({ prompt: 'Tutki manaa', gameRoot: '/tmp',
    generatePlan: async ({prompt}) => { n++; if(n===2) assert.match(prompt, /return "arcane"/); return plan(`Kierros ${n}`) },
    auditPlan: async () => reliable(),
    auditQuotes: async () => n === 1 ? fake() : genuine(),
    getExcerpts: excerpts,
  })
  assert.equal(n, 2)
  assert.equal(r.allowedToDisplay, true)
  assert.equal(r.executionApproved, false)
  assert.equal(r.attempts.length, 2)
})

test('kolme virheellistä lainausta estetään, ei ohitusta', async () => {
  let n = 0
  const r = await runVerifiedPlanningLoop({ prompt: 'Tutki manaa', gameRoot: '/tmp',
    generatePlan: async () => { n++; return plan('Virhe') }, auditPlan: async () => reliable(),
    auditQuotes: async () => fake(), getExcerpts: excerpts,
  })
  assert.equal(n, 3)
  assert.equal(r.allowedToDisplay, false)
  assert.equal(r.attempts.length, 3)
})

test('Plan Gate BLOCK estää heti ilman korjausyritystä', async () => {
  let n = 0
  const r = await runVerifiedPlanningLoop({ prompt: 'Tutki manaa', gameRoot: '/tmp',
    generatePlan: async () => { n++; return plan('Virhe') },
    auditPlan: async () => ({ decision: 'BLOCK', sourceIntegrity: 'failed', issues: [{code: 'FILE_NOT_INSPECTED'}] }),
    auditQuotes: async () => { throw Error('Should not run') }, getExcerpts: excerpts,
  })
  assert.equal(n, 1)
  assert.equal(r.allowedToDisplay, false)
  assert.equal(r.attempts[0].result, 'PLAN_BLOCK')
})

test('lainausten poisjättäminen ei kierrä estoa uusintayrityksessä', async () => {
  let n = 0
  const r = await runVerifiedPlanningLoop({ prompt: 'Tutki manaa', gameRoot: '/tmp',
    generatePlan: async () => { n++; return plan('Virhe') },
    auditPlan: async () => reliable(),
    auditQuotes: async () => n===1 ? fake() : ({decision: 'CAUTION',checkedQuotes: [],issues: []}),
    getExcerpts: excerpts,
  })
  assert.equal(r.allowedToDisplay, false)
  assert.equal(r.attempts.length, 3)
  assert.equal(r.attempts[1].missingRetryQuote, true)
})

test('ilman tarkistettua lähdekontekstia uusinta ei ala', async () => {
  let n = 0
  const r = await runVerifiedPlanningLoop({ prompt: 'Tutki manaa', gameRoot: '/tmp',
    generatePlan: async () => { n++; return plan('Virhe') },
    auditPlan: async () => reliable(), auditQuotes: async () => fake(),
    getExcerpts: async () => [],
  })
  assert.equal(n, 1)
  assert.equal(r.allowedToDisplay, false)
  assert.ok(r.attempts[0].repairUnavailable)
})


test('todellinen lähdekoodikatkelma haetaan vain oikealla SHA-256-tiivisteellä', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-v3-'))
  const filePath = 'src/services/heartwood/sample.js'
  const file = path.join(root, filePath)
  const source = 'export function classResourceId(id) {\n  return "arcane"\n}\n'
  try {
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, source)
    const sha256 = createHash('sha256').update(source).digest('hex')
    const evidence = [{filePath, symbol: 'classResourceId', sha256}]
    const good = await verifiedSourceExcerpts(root, evidence)
    assert.equal(good.length, 1)
    assert.match(good[0].excerpt, /return "arcane"/)
    await fs.writeFile(file, source.replace('arcane', 'rage'))
    const stale = await verifiedSourceExcerpts(root, evidence)
    assert.equal(stale.length, 0)
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

test('polun ylitys ja projektin ulkopuolinen symbolinen linkki estetään', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-v3-root-'))
  const other = await fs.mkdtemp(path.join(os.tmpdir(), 'spacemonkey-v3-other-'))
  const source = 'export function classResourceId(id) { return id }\n'
  try {
    const outside = path.join(other, 'outside.js')
    await fs.writeFile(outside, source)
    const link = path.join(root, 'src/services/heartwood/link.js')
    await fs.mkdir(path.dirname(link), { recursive: true })
    await fs.symlink(outside, link)
    const sha256 = createHash('sha256').update(source).digest('hex')
    assert.equal((await verifiedSourceExcerpts(root, [{filePath: 'src/services/heartwood/link.js',symbol: 'classResourceId',sha256}])).length, 0)
    assert.equal((await verifiedSourceExcerpts(root, [{filePath: '../outside.js',symbol: 'classResourceId',sha256}])).length, 0)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
    await fs.rm(other, { recursive: true, force: true })
  }
})
