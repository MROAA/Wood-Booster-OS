import test from 'node:test'
import assert from 'node:assert/strict'
import { runVerifiedPlanningLoop as run } from './spacemonkey-verified-planner.mjs'

const ok = () => ({ decision: 'CAUTION', sourceIntegrity: 'verified', checkedEvidence: [], issues: [] })
const sourceOk = () => ({ decision: 'CAUTION', codeQuotationsVerified: true, checkedQuotes: [{quoteIndex: 0}], issues: [] })
const missing = (filePath = 'src/data/heartwood/classes.js') => ({
  decision: 'BLOCK', sourceIntegrity: 'failed',
  issues: [{ code: 'FILE_NOT_INSPECTED', filePath }],
})

test('FILE_NOT_INSPECTED triggers targeted re-read and new plan, not forged inspectedFiles', async () => {
  let count = 0
  const r = await run({ prompt: 'Paranna resursseja', gameRoot: '/tmp',
    generatePlan: async ({requiredFiles}) => {
      count++
      if (count === 1) assert.deepEqual(requiredFiles, [])
      else assert.deepEqual(requiredFiles, ['src/data/heartwood/classes.js'])
      return { success: true, explanation: 'Tarkistettu esimerkki',
        inspectedFiles: count === 1 ? [] : [{filePath: 'src/data/heartwood/classes.js'}], files: [] }
    },
    auditPlan: async () => count === 1 ? missing() : ok(),
    auditQuotes: async () => sourceOk(),
  })
  assert.equal(count, 2)
  assert.equal(r.allowedToDisplay, true)
  assert.equal(r.executionApproved, false)
  assert.equal(r.attempts[0].result, 'RESEARCH_RETRY')
})

test('a generator that never inspects the requested file is bounded and blocked', async () => {
  let count = 0
  const r = await run({ prompt: 'Test', gameRoot: '/tmp',
    generatePlan: async () => { count++; return {success: true, explanation: 'x'} },
    auditPlan: async () => missing(),
    auditQuotes: async () => { throw Error('Source Guard must not run after Plan BLOCK') },
  })
  assert.equal(count, 3)
  assert.equal(r.allowedToDisplay, false)
  assert.equal(r.executionApproved, false)
  assert.equal(r.attempts[2].result, 'PLAN_BLOCK')
})

test('all other structural Plan Gate errors stop without retry', async () => {
  let count = 0
  const r = await run({ prompt: 'Test', gameRoot: '/tmp',
    generatePlan: async () => { count++; return {success:true} },
    auditPlan: async () => ({decision:'BLOCK', issues:[{code:'INVALID_PATH'}]}),
    auditQuotes: async () => { throw Error('Not permitted') },
  })
  assert.equal(count, 1)
  assert.equal(r.allowedToDisplay, false)
})

test('missing file with path traversal is never retried', async () => {
  let count = 0
  const r = await run({prompt:'Test',gameRoot:'/tmp',
    generatePlan: async () => { count++; return {success:true} },
    auditPlan: async () => missing('../outside.js'),
    auditQuotes: async () => { throw Error('Not permitted') },
  })
  assert.equal(count, 1)
  assert.equal(r.allowedToDisplay, false)
})

test('mixed structural errors block even if one file is unread', async () => {
  let count=0
  const r = await run({prompt:'Test',gameRoot:'/tmp',
    generatePlan:async()=>{count++;return {success:true}},
    auditPlan:async()=>({decision:'BLOCK',issues:[{code:'FILE_NOT_INSPECTED',filePath:'src/data/heartwood/classes.js'},{code:'EVIDENCE_MISMATCH'}]}),
    auditQuotes: async()=>{throw Error('Not permitted')},
  })
  assert.equal(count,1)
  assert.equal(r.allowedToDisplay,false)
})

test('source quotation verification stays mandatory after targeted inspection', async () => {
  let count=0
  const r = await run({prompt:'Test',gameRoot:'/tmp',
    generatePlan:async()=>{count++;return {success:true,explanation:'x'}},
    auditPlan:async()=>count===1?missing():ok(),
    auditQuotes:async()=>({decision:'CAUTION',codeQuotationsVerified:false,checkedQuotes:[]}),
    getExcerpts:async()=>[],
  })
  assert.equal(r.allowedToDisplay,false)
  assert.equal(r.executionApproved,false)
})
