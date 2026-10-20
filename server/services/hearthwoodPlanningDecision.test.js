import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseHearthwoodPlanningDecision as parse,
  isHearthwoodReviewCandidate as isReview,
  createHearthwoodReviewCandidate as candidate,
} from './hearthwoodPlanningDecision.js'
const files = [{filePath:'src/data/heartwood/classes.js', truncated:true}]
const evidence = {valid:true,references:[{filePath:files[0].filePath,symbol:'CLASSES'}]}
const make = proposedDecision => candidate({proposedDecision,codeFiles:files,evidence})
test('explicit no change triage',()=>assert.equal(parse('PÄÄTÖS: NO_CHANGE_NEEDED\nSUUNNITELMA:\nSELITYS: CLASSES'), 'NO_CHANGE_NEEDED'))
test('explicit insufficient triage',()=>assert.equal(parse('PÄÄTÖS: INSUFFICIENT_EVIDENCE'), 'INSUFFICIENT_EVIDENCE'))
test('change required remains a change',()=>assert.equal(parse('PÄÄTÖS: CHANGE_REQUIRED'), 'CHANGE_REQUIRED'))
test('missing decision cannot silently become no change',()=>assert.equal(parse('SUUNNITELMA:\nSELITYS: ei muutosta'),null))
test('unknown decision rejected',()=>assert.equal(parse('PÄÄTÖS: APPROVED'),null))
test('conflicting decision declarations rejected',()=>assert.equal(parse('PÄÄTÖS: NO_CHANGE_NEEDED\nPÄÄTÖS: CHANGE_REQUIRED'),null))
test('misleading sentence does not count as heading',()=>assert.equal(parse('Tarkista PÄÄTÖS: NO_CHANGE_NEEDED'),null))
test('no change must cite an inspected source symbol',()=>assert.throws(()=>candidate({proposedDecision:'NO_CHANGE_NEEDED',codeFiles:files,evidence:{valid:false,references:[]}})))
test('no change is only human review, never code approval',()=>{const p=make('NO_CHANGE_NEEDED');assert.equal(p.status,'human_review_required');assert.equal(p.verificationStatus,'UNVERIFIED');assert.equal(p.executionApproved,false);assert.equal(p.interpretationVerified,false);assert.equal(p.files.length,0);assert.equal(isReview(p),true)})
test('insufficient evidence is permitted as a safe dead end',()=>{const p=candidate({proposedDecision:'INSUFFICIENT_EVIDENCE',codeFiles:files,evidence:{valid:false,references:[]}});assert.equal(isReview(p),true);assert.equal(p.files.length,0)})
test('model explanation cannot become a verified fact',()=>{const p=candidate({proposedDecision:'NO_CHANGE_NEEDED',codeFiles:files,evidence,rawExplanation:'Guardian functionality confirmed and tests passed'});assert.doesNotMatch(p.explanation,/confirmed and tests passed/);assert.match(p.explanation,/EI OLE VAHVISTETTU/)})
test('change proposal is not review candidate',()=>assert.equal(isReview({...make('NO_CHANGE_NEEDED'),files:[{action:'modify',filePath:files[0].filePath}]}),false))
test('forged approval is not review candidate',()=>assert.equal(isReview({...make('NO_CHANGE_NEEDED'),executionApproved:true}),false))
test('lack of code files is blocked',()=>assert.throws(()=>candidate({proposedDecision:'INSUFFICIENT_EVIDENCE',codeFiles:[],evidence:null})))
test('unknown decision is blocked',()=>assert.throws(()=>candidate({proposedDecision:'APPROVE_ALL',codeFiles:files,evidence})))
