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

test('plain Finnish finds English identifiers; glossary guesses are marked inferred', () => {
  const terms = taskTerms('Yrttipinoon mahtuu liikaa, kun yrtti kerätään')
  for (const word of ['herb', 'stack', 'gather']) assert.ok(terms.words.includes(word), word)
  assert.ok(terms.inferred.includes('herb'))
  assert.ok(!terms.inferred.includes('yrtti'))
  // A word the user wrote in English is never downgraded to inferred.
  assert.ok(!taskTerms('herb yrtti').inferred.includes('herb'))
})

test('a Finnish word hyphenated to a name describes it and is not expanded', () => {
  const terms = taskTerms('Tutki Guardianin Intercept-kykyä, Guardian-luokan tiedot ja resurssit')
  assert.ok(!terms.words.includes('ability') && !terms.words.includes('skill'), terms.words.join(','))
  assert.ok(!terms.words.includes('class'), 'luokan after a hyphen is a descriptor')
  assert.ok(terms.words.includes('resource'), 'a free-standing word is still expanded')
  assert.ok(taskTerms('Paranna sankarin kykyjä').words.includes('ability'))
})

test('names the user capitalised are anchors; inflected forms of one word count once', () => {
  const terms = taskTerms('Tutki Guardianin Intercept-kykyä ja Holy Power -resurssia. Milloin Holy Poweria syntyy?')
  assert.deepEqual(terms.anchors, ['guardianin', 'intercept', 'holy', 'power'])
  assert.ok(!terms.words.includes('poweria'), 'Poweria merged into power')
  assert.ok(!terms.words.includes('milloin') && !terms.words.includes('syntyy'), 'question words dropped')
  assert.ok(!terms.anchors.includes('tutki'), 'a capital at a sentence start is not a name')
  assert.ok(taskTerms('Miten myrkky toimii?').words.includes('poison'))
})
