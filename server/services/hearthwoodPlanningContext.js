/**
 * Hearthwood planning evidence context V4.2.
 * This module selects source material only. It does not validate, approve,
 * execute or modify a plan. Provenance gates stay mandatory downstream.
 */
import { extractHearthwoodEvidence } from './hearthwoodEvidenceValidator.js'

const TASK_HINTS = [
  { pattern: /guardian|luokk|class|hahmolaj|hero/i,
    paths: ['src/data/heartwood/classes.js'] },
  { pattern: /mana|resurss|resource|energia|energy|overcharg/i,
    paths: ['src/services/heartwood/tacticsMana.js', 'src/data/heartwood/resources.js'] },
  { pattern: /status|myrky|poison|stun|taunt/i,
    paths: ['src/services/heartwood/tacticsStatuses.js'] },
]

function termsFor(task) {
  const ignored = new Set(['hearthwood', 'tutki', 'suunnittele', 'lähdekoodi',
    'tiedostot', 'tiedosto', 'tehtävä', 'muutos', 'mekaniikka', 'mekaniikan',
    'tarkista', 'olemassa', 'eivät', 'tule', 'älä', 'muuta', 'aiempia'])
  return [...new Set((String(task).toLowerCase().match(/[\p{L}\p{N}_]{4,}/gu) || [])
    .filter(word => !ignored.has(word)))].slice(0, 16)
}

/** Never invent required paths; choose only exact existing paths. Maximum 2. */
export function chooseHearthwoodRequiredFiles(task, allFiles, requested = []) {
  const existing = new Set(allFiles)
  const chosen = []
  for (const name of requested) {
    if (existing.has(name) && !chosen.includes(name) && chosen.length < 2) chosen.push(name)
  }
  for (const hint of TASK_HINTS) {
    if (!hint.pattern.test(task)) continue
    for (const name of hint.paths) {
      if (existing.has(name) && !chosen.includes(name) && chosen.length < 2) chosen.push(name)
    }
  }
  return chosen
}

function matchScore(item, terms) {
  const path = item.filePath.toLowerCase()
  const names = terms.reduce((n, word) => n + (path.includes(word) ? 3 : 0), 0)
  return names + terms.reduce((n, word) => n + (item.content.toLowerCase().includes(word) ? 1 : 0), 0)
}

function focusedExcerpt(content, terms, maxChars = 1250) {
  if (content.length <= maxChars) return content
  const lower = content.toLowerCase()
  const hits = terms.map(term => lower.indexOf(term)).filter(n => n >= 0)
  const first = hits.length ? Math.min(...hits) : 0
  const start = Math.max(0, first - 140)
  return '[LÄHDEKATKELMA, EI KOKO TIEDOSTO]\n' + content.slice(start, start + maxChars)
}

const EXCERPT_HEADER = /\n\n(?=\/\/ \S+:\d+-\d+ )/

const CONTEXT_CHARS = 7600
const FILE_HEADER_CHARS = 160
const WHOLE_FILE_CHARS = 2400

/**
 * Keep relevant, bounded source context near the end of the system prompt.
 * The budget goes to excerpts in the reader's relevance order across ALL
 * read files, so a strong excerpt is never pushed out by a weaker file
 * that merely came first. Reader excerpts stay whole; what does not fit
 * is named on a LUKEMATTA JÄI line, and files with nothing shown are listed.
 */
export function buildHearthwoodFocusedPlanningContext(codeFiles, task) {
  const terms = termsFor(task)
  const candidates = []
  codeFiles.forEach((file, fileIndex) => {
    const excerpts = Array.isArray(file.excerpts) ? file.excerpts : []
    if (file.truncated && excerpts.length) {
      String(file.content || '').split(EXCERPT_HEADER).forEach((block, i) => {
        if (excerpts[i]) candidates.push({ fileIndex, block, symbol: excerpts[i].symbol, score: excerpts[i].score || 0 })
      })
    } else {
      const best = Math.max(0, ...excerpts.map(e => e.score || 0))
      candidates.push({ fileIndex, symbol: null, score: best || matchScore(file, terms) / 10,
        block: focusedExcerpt(String(file.content || ''), terms, WHOLE_FILE_CHARS) })
    }
  })
  candidates.sort((a, b) => b.score - a.score)

  const chosen = new Map()
  const dropped = new Map()
  let used = 0
  for (const item of candidates) {
    const header = chosen.has(item.fileIndex) ? 0 : FILE_HEADER_CHARS
    if (used + header + item.block.length + 2 <= CONTEXT_CHARS) {
      if (!chosen.has(item.fileIndex)) chosen.set(item.fileIndex, [])
      chosen.get(item.fileIndex).push(item.block)
      used += header + item.block.length + 2
    } else if (item.symbol) {
      if (!dropped.has(item.fileIndex)) dropped.set(item.fileIndex, [])
      dropped.get(item.fileIndex).push(item.symbol)
    }
  }

  const sections = [...chosen].map(([fileIndex, blocks]) => {
    const file = codeFiles[fileIndex]
    const unread = [...(dropped.get(fileIndex) || []), ...(file.omittedSymbols || [])].slice(0, 12)
    return [
      `TIEDOSTO: ${file.filePath}`,
      file.truncated ? 'HUOM: lähteen luku on katkaistu; älä väitä tuntevasi loppuosaa.' : 'Luettu lähde:',
      blocks.join('\n\n') + (unread.length ? `\nLUKEMATTA JÄI: ${unread.join(', ')}` : ''),
      'LÄHDEKATKELMA PÄÄTTYY.',
    ].join('\n')
  })
  const unreadFiles = codeFiles
    .map((file, i) => ({ file, i }))
    .filter(({ i }) => !chosen.has(i))
    .map(({ file, i }) => {
      const unread = [...(dropped.get(i) || []), ...(file.omittedSymbols || [])].slice(0, 12)
      return unread.length ? `${file.filePath} (LUKEMATTA JÄI: ${unread.join(', ')})` : file.filePath
    })
  if (unreadFiles.length) sections.push(`LUKEMATTA JÄIVÄT TIEDOSTOT: ${unreadFiles.join('; ')}`)
  return sections.join('\n\n').slice(0, 8000)
}

/** Explicit symbol-and-file index: not proof of model reasoning. */
export function buildHearthwoodFocusedEvidenceIndex(codeFiles, task) {
  const terms = termsFor(task)
  const evidence = extractHearthwoodEvidence(codeFiles)
  const ranked = evidence.map(item => ({ item,
    score: terms.reduce((n, word) => n +
      (item.symbol.toLowerCase().includes(word) ? 6 : 0) +
      (item.filePath.toLowerCase().includes(word) ? 2 : 0), 0),
  })).sort((a, b) => b.score - a.score)
  const chosen = ranked.slice(0, 28).map(({item}) => `${item.filePath} → ${item.symbol}`)
  return chosen.length ? chosen.join('\n').slice(0, 2400) :
    'Ei lähdekoodisymboleja. Älä keksi niitä; ilmoita puuttuva todistusaineisto.'
}
