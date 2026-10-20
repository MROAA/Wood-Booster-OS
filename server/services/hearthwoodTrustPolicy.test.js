import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSourceOnlyAnswer, classifyAnalysisTrust } from './hearthwoodTrustPolicy.js'
const example = { verifiedSources: [{symbol:'classResourceId',filePath:'src/services/heartwood/tacticsMana.js',truncated:true}], dependencySources:[{symbol:'CLASSES',filePath:'src/data/heartwood/classes.js',partial:true}] }
test('source-only answer does not invent callers or mechanics', () => {
  const answer = buildSourceOnlyAnswer(example)
  assert.match(answer,/classResourceId/)
  assert.match(answer,/CLASSES/)
  assert.doesNotMatch(answer,/resourceIdOf|ei käytetä|ei ole kutsuttu/)
})
test('verified caller fact is readable without model prose', () => {
  const answer = buildSourceOnlyAnswer({callSiteVerification:{status:'VERIFIED_MATCHES', matches:[{symbol:'classResourceId',filePath:'src/services/heartwood/tacticsMana.js',line:120,caller:'resourceIdOf'}]}})
  assert.match(answer,/resourceIdOf/)
  assert.match(answer,/rivi 120/)
})
test('no caller match never claims global absence', () => {
  const answer = buildSourceOnlyAnswer({callSiteVerification:{status:'NOT_FOUND_IN_SCOPE',matches:[]}})
  assert.match(answer,/ei voi päätellä/)
})
test('empty evidence returns explicit insufficient-information answer', () => {
  const answer = buildSourceOnlyAnswer({})
  assert.match(answer,/riittävästi todennettuja/)
})
test('untrusted symbols and traversal paths not echoed as verified facts', () => {
  const answer = buildSourceOnlyAnswer({verifiedSources:[{symbol:'foo;rm',filePath:'src/../secrets.js'}]})
  assert.doesNotMatch(answer,/secrets\.js/)
})
test('model prose never becomes a verified claim', () => {
  const state = classifyAnalysisTrust({...example,answer:'classResourceId is unused'})
  assert.equal(state.modelProseVerified,false)
  assert.equal(state.interpretationVerified,false)
  assert.equal(state.executionApproved,false)
  assert.equal(state.codeEditsAllowed,false)
})
test('no evidence sets INSUFFICIENT_EVIDENCE', () => {
  assert.equal(classifyAnalysisTrust({}).status,'INSUFFICIENT_EVIDENCE')
})

test('unreadable source is never described as searched', () => {
  const answer = buildSourceOnlyAnswer({ callSiteVerification: { status: 'NOT_CHECKED', matches: [] } })
  assert.match(answer, /tarkistus ei onnistunut/)
  assert.doesNotMatch(answer, /Tutkituista tiedostoista ei löytynyt/)
})
