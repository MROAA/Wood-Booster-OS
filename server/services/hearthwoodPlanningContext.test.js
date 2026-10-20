import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseHearthwoodRequiredFiles, buildHearthwoodFocusedPlanningContext,
  buildHearthwoodFocusedEvidenceIndex } from './hearthwoodPlanningContext.js'

const codeFiles = [
 { filePath:'src/services/heartwood/tacticsMana.js', content:'export function resourceIdOf(u) { return classResourceId(u.classId) }\nexport function classResourceId(id) { return RESOURCES[id] }', truncated:false },
 { filePath:'src/data/heartwood/classes.js', content:'export const CLASSES = { guardian: { resource: "holy" } }', truncated:false },
 { filePath:'src/data/heartwood/resources.js', content:'export const RESOURCES = {}', truncated:false },
]
const all = codeFiles.map(x=>x.filePath)
test('relevant resource task selects existing files only',()=> {
 assert.deepEqual(chooseHearthwoodRequiredFiles('Guardian mana resources',all), [all[1], all[0]])
})
test('requested existing file has precedence, max two',()=> {
 assert.deepEqual(chooseHearthwoodRequiredFiles('Guardian',all,[all[1]]),[all[1]])
})
test('never invent nonexistent path',()=> {
 assert.deepEqual(chooseHearthwoodRequiredFiles('status stun',['src/data/heartwood/classes.js'],['../escape.js']),[])
})
test('context contains real evidence and required truncation warning',()=> {
 const ctx = buildHearthwoodFocusedPlanningContext([{...codeFiles[0],truncated:true}], 'mana')
 assert.match(ctx, /HUOM: lähteen luku on katkaistu/)
 assert.match(ctx,/resourceIdOf/)
})
test('symbol index extracts genuine definitions',()=> {
 const idx=buildHearthwoodFocusedEvidenceIndex(codeFiles,'guardian')
 assert.match(idx,/CLASSES/)
 assert.match(idx,/classResourceId/)
})
test('empty evidence does not forge symbols',()=> {
 assert.match(buildHearthwoodFocusedEvidenceIndex([], 'mana'),/Älä keksi/)
})
test('context bounded for oversized and adversarial source contents',()=> {
 const huge=[{filePath:all[0],content:'export function f(){return 1};'.repeat(5000),truncated:true}]
 assert.ok(buildHearthwoodFocusedPlanningContext(huge,'resource').length<=8000)
})
test('evidence index bounded',()=> {
 const many=Array.from({length:200},(_,i)=>({filePath:`src/services/heartwood/x${i}.js`,content:`export function f${i}(){}`}))
 assert.ok(buildHearthwoodFocusedEvidenceIndex(many,'x').length<=2400)
})
