import test from 'node:test'
import assert from 'node:assert/strict'
import { taskTerms, nameWords, extractDefinitions, calledNames, termHits } from './hearthwoodSourceIndex.js'

const src = [
  'import x from "./x.js"',
  '// Guardian takes the hit.',
  'function eligibleGuardian(state) {',
  '  const s = "}"',
  '  return state',
  '}',
  '',
  'export const LIMIT = 5',
].join('\n')

test('definitions: non-exported functions, line ranges, leading comments', () => {
  const defs = extractDefinitions(src)
  assert.deepEqual(defs.map(d => [d.name, d.startLine, d.endLine]),
    [['eligibleGuardian', 3, 6], ['LIMIT', 8, 8]])
  assert.match(defs[0].leadingComment, /Guardian takes/)
  assert.equal(defs[1].exported, true)
})

test('task terms: compound words split, stop words dropped, camelCase kept as symbols', () => {
  const terms = taskTerms('Tutki Guardian-luokan Intercept ja attackUnit')
  assert.ok(terms.words.includes('guardian'))
  assert.ok(!terms.words.includes('tutki'))
  assert.deepEqual(terms.symbols, ['attackUnit'])
})

test('names, calls and camelCase-aware term hits', () => {
  assert.deepEqual(nameWords('eligibleGuardian'), ['eligible', 'guardian'])
  assert.ok(calledNames('next = manaFx.onGuard(next, id); if (x) f()').has('onGuard'))
  assert.ok(!calledNames('if (x) {}').has('if'))
  assert.deepEqual(termHits('const g = eligibleGuardian(s)', ['guardian']), ['guardian'])
  assert.deepEqual(termHits('intercepts', ['intercept']), ['intercept'])
})
