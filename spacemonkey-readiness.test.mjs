import test from 'node:test'
import assert from 'node:assert/strict'
import { expectedCallerEvidence, evaluateCallerAnswer } from './spacemonkey-readiness.mjs'
const SOURCE = `export function classResourceId(classId) {\n return CLASS_RESOURCE_DEFAULT[classId] || 'arcane'\n}\nexport function resourceIdOf(u) {\n return classResourceId(u.classId)\n}\n`
test('oracle independently finds real caller and exact line', () => {
  assert.deepEqual(expectedCallerEvidence(SOURCE), {filePath:'src/services/heartwood/tacticsMana.js',caller:'resourceIdOf',line:5,sourceLine:'return classResourceId(u.classId)'})
})
test('independent oracle rejects absent caller', () => {
  assert.equal(expectedCallerEvidence('export function classResourceId(x) { return x }'), null)
})
test('black-box semantic assertions reject misleading success from a fake source', () => {
  const expected = expectedCallerEvidence(SOURCE)
  const fake = {
    success:true, reliability:{decision:'CAUTION', sourceIntegrity:'verified',projectRoot:'/tmp/game'},
    answerTrust:{status:'SOURCE_FACTS_ONLY',codeEditsAllowed:false}, answerProvenance:'verified-evidence-only',
    callSiteVerification:{completeProjectScan:false,matches:[]},
    answer:'resourceIdOf rivi 5',
  }
  assert.equal(evaluateCallerAnswer(fake, expected, '/tmp/game'), false)
})
test('correct source-linked evidence accepted as smoke-test input only', () => {
  const expected = expectedCallerEvidence(SOURCE)
  const fake = {
    success:true,reliability:{decision:'CAUTION',sourceIntegrity:'verified',projectRoot:'/tmp/game'},
    answerTrust:{status:'SOURCE_FACTS_ONLY',codeEditsAllowed:false}, answerProvenance:'verified-evidence-only',
    callSiteVerification:{completeProjectScan:false,matches:[{...expected,symbol:'classResourceId',sha256:'a'.repeat(64)}]},
    answer:'Funktio resourceIdOf, rivi 5',
  }
  assert.equal(evaluateCallerAnswer(fake, expected, '/tmp/game'), true)
})
