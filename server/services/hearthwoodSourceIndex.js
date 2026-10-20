/**
 * Hearthwood Dev Studio — Source Index
 *
 * Purpose: find which top-level definitions in a source text relate to
 * a natural-language task, without the caller knowing symbol names.
 *
 * Responsibilities:
 * - split a task into search terms and explicit symbol names
 * - list top-level definitions with line ranges and leading comments
 * - score definitions against the task
 * - list the functions called on a line
 *
 * Dependencies: none. Pure functions: no file system, no global state,
 * never executes the analysed source. Source text is data only.
 *
 * Public API: taskTerms, nameWords, extractDefinitions,
 * scoreDefinition, calledNames, termHits.
 *
 * Example:
 *   const terms = taskTerms("Miten Guardianin Intercept toimii?")
 *   const defs = extractDefinitions(source)
 *   defs.map(def => scoreDefinition(def, source, terms))
 *
 * Tests: hearthwoodSourceIndex.test.js
 */

const STOP_WORDS = new Set([
  "hearthwood", "hearthwoodin", "heartwood", "tutki", "selvitä", "selitä",
  "suunnittele", "lähdekoodi", "lähdekoodin", "lähdekoodista", "oikeasta",
  "tiedosto", "tiedostot", "tiedostoja", "tehtävä", "muutos", "muutoksia",
  "mekaniikka", "mekaniikan", "tarkista", "olemassa", "eivät", "tule",
  "älä", "muuta", "aiempia", "onko", "toteutettu", "ehdota", "turhia",
  "todisteet", "riitä", "ilmoita", "epävarmuus", "miten", "kuinka", "mikä",
  "mitä", "missä", "toimii", "sekä", "joka", "jos", "ovat", "kerro",
  "this", "that", "with", "from", "have", "does", "should", "what", "where",
  "which", "work", "works", "check", "code", "source", "implemented",
  "function", "const",
])

// Finnish game-development vocabulary → English identifier words, so a
// task written in plain Finnish finds code named in English. Search aid
// only: expanded words never count as evidence. Stems match inside
// inflected and compound words ("yrttipinoon" → yrtti + pino).
const FI_EN_TERMS = [
  ["yrtt", ["herb"]], ["keittä", ["brew"]], ["juoma", ["potion"]], ["pino", ["stack"]],
  ["kerä", ["gather"]], ["vuoro", ["turn"]], ["pilaantu", ["spoil"]], ["terveys", ["health"]],
  ["paran", ["heal"]], ["sää", ["weather"]], ["laukku", ["satchel", "bag"]],
  ["vahin", ["damage"]], ["hyökkä", ["attack"]], ["puolust", ["defend", "defense"]],
  ["suoja", ["shield", "guard", "block"]], ["liikku", ["move"]], ["kyky", ["ability", "skill"]],
  ["kyvy", ["ability", "skill"]], ["luoka", ["class"]], ["luokk", ["class"]],
  ["viholli", ["enemy"]], ["sankari", ["hero"]], ["esine", ["item"]], ["varust", ["gear", "equipment"]],
  ["kauppa", ["shop", "market"]], ["kartta", ["map"]], ["resurssi", ["resource"]],
  ["palkin", ["reward"]], ["kulta", ["gold"]], ["kokemus", ["experience"]], ["taso", ["level"]],
  ["myrky", ["poison"]], ["tainnut", ["stun"]], ["kuolema", ["death"]], ["elvyt", ["revive"]],
  ["maasto", ["terrain"]], ["ansa", ["trap"]], ["pomo", ["boss"]], ["tehtäv", ["quest"]],
  ["lyhty", ["lantern"]], ["valo", ["light"]], ["ääni", ["sound"]], ["kortti", ["card"]],
  ["raja", ["max", "limit"]], ["kesto", ["duration"]], ["nopeus", ["speed"]],
]

const KEYWORDS = new Set([
  "if", "for", "while", "switch", "catch", "function", "return", "typeof",
  "new", "await", "super", "import",
])

const DEFINITION_PATTERN =
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s*\*?\s*([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=|class\s+([A-Za-z_$][\w$]*))/gm

/** camelCase / snake_case name → lowercase words. */
export function nameWords(name) {
  return String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .match(/[a-z0-9]+/g) || []
}

/** Task → { words, symbols }. Symbols are camelCase names as written. */
export function taskTerms(task) {
  const text = String(task || "")
  const base = (text.toLowerCase().match(/[\p{L}\p{N}_]+/gu) || [])
    .filter(word => word.length >= 4 && !STOP_WORDS.has(word))
  const expanded = base.flatMap(word => FI_EN_TERMS
    .filter(([stem]) => word.includes(stem))
    .flatMap(([, english]) => english))
  // English expansions first: they are what identifiers are made of.
  const words = [...expanded, ...base]
  const symbols = (text.match(/\b[A-Za-z_$][\w$]*\b/g) || [])
    .filter(word => /[a-z][A-Z]/.test(word))
  const kept = [...new Set(words)].slice(0, 20)
  return {
    words: kept,
    // Glossary guesses about intent weigh half of what the user wrote.
    inferred: kept.filter(word => expanded.includes(word) && !base.includes(word)),
    symbols: [...new Set(symbols)].slice(0, 8),
  }
}

/** A word matches a term exactly or as a prefix (intercept ↔ intercepts). */
export function wordMatches(word, term) {
  if (word === term) return true
  const shorter = word.length < term.length ? word : term
  const longer = shorter === word ? term : word
  return shorter.length >= 5 && longer.startsWith(shorter)
}

/** Distinct task terms appearing in a text. */
export function termHits(text, words) {
  const tokens = String(text || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase().match(/[\p{L}\p{N}]+/gu) || []
  const unique = new Set(tokens)
  return words.filter(term => [...unique].some(token => wordMatches(token, term)))
}

function lineStarts(content) {
  const starts = [0]
  for (let i = 0; i < content.length; i += 1) {
    if (content[i] === "\n") starts.push(i + 1)
  }
  return starts
}

function lineOf(starts, offset) {
  let low = 0
  let high = starts.length - 1
  while (low < high) {
    const mid = (low + high + 1) >> 1
    if (starts[mid] <= offset) low = mid
    else high = mid - 1
  }
  return low + 1
}

function isCommentLine(line) {
  const trimmed = line.trim()
  return trimmed.startsWith("//") || trimmed.startsWith("/*") ||
    trimmed.startsWith("*") || trimmed.endsWith("*/")
}

/**
 * Top-level (column 0) definitions. A definition ends where the next
 * top-level definition (or its leading comment) begins, or at EOF.
 * Lines are 1-based and inclusive.
 */
export function extractDefinitions(content) {
  const text = String(content || "")
  const starts = lineStarts(text)
  const lines = text.split("\n")
  const found = []

  for (const match of text.matchAll(DEFINITION_PATTERN)) {
    const name = match[1] || match[2] || match[3]
    if (!name) continue
    const startLine = lineOf(starts, match.index)
    let commentStart = startLine
    while (commentStart > 1 && isCommentLine(lines[commentStart - 2])) {
      commentStart -= 1
    }
    found.push({
      name,
      startLine,
      commentStart,
      leadingComment: lines.slice(commentStart - 1, startLine - 1).join("\n"),
      exported: /^export\b/.test(match[0]),
    })
  }

  return found.map((definition, index) => {
    const next = found[index + 1]
    let endLine = next ? next.commentStart - 1 : lines.length
    while (endLine > definition.startLine && !lines[endLine - 1].trim()) endLine -= 1
    return { ...definition, endLine }
  })
}

/** Body text of a definition (signature line included). */
export function definitionBody(lines, definition) {
  return lines.slice(definition.startLine - 1, definition.endLine).join("\n")
}

/**
 * Rarity weight per term within one file: a term mentioned by most
 * definitions ("power") says little; a rare one ("intercept") a lot.
 */
export function termWeights(bodies, words, inferred = []) {
  const weights = new Map()
  for (const term of words) {
    const df = bodies.filter(body => termHits(body, [term]).length).length
    const rarity = df <= 2 ? 1 : df <= 8 ? 0.6 : df <= 25 ? 0.35 : 0.2
    weights.set(term, inferred.includes(term) ? rarity / 2 : rarity)
  }
  return weights
}

/**
 * Relevance of one definition. Explicit symbol > name words > leading
 * comment > body mentions, each weighted by term rarity. A name match
 * is the definition's own identifier, never the file name.
 */
export function scoreDefinition(definition, body, terms, boosted = new Set(), weights = new Map()) {
  const { words = [], symbols = [] } = terms || {}
  const weight = term => weights.get(term) ?? 1
  const sum = list => list.reduce((n, term) => n + weight(term), 0)
  let score = 0
  if (symbols.includes(definition.name)) score += 100
  if (boosted.has(definition.name)) score += 6
  const ownWords = nameWords(definition.name)
  score += 12 * sum(words.filter(term => ownWords.some(word => wordMatches(word, term))))
  score += 4 * sum(termHits(definition.leadingComment, words))
  score += 3 * sum(termHits(body, words))
  return score
}

/** Called identifiers on a text, including `ns.fn(` → `fn`. */
export function calledNames(text) {
  const names = new Set()
  for (const match of String(text || "").matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (!KEYWORDS.has(match[1])) names.add(match[1])
  }
  return names
}
