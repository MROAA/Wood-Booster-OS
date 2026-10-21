/**
 * Hearthwood Dev Studio — Verified Explanation V1
 *
 * Purpose: answer a code question in plain Finnish using ONLY facts the
 * machine verified, instead of a bare list of function names. The model's
 * own prose is not used here (it stays hidden as unverifiedInterpretation).
 *
 * Responsibilities:
 * - how the asked mechanic flows: verified call sites (file + line + the
 *   exact code line), also inside functions too long to quote whole
 * - what each verified function checks and changes, read from its code
 *   structure (`if (...) return`, `find(...)` conditions, gain/set/apply
 *   calls) and shown verbatim - never paraphrased into new claims
 * - code comments, shown as comments (not as verified behaviour)
 * - the game data the question names ("Holy Power"): its definition lines
 *   for the fields the verified functions read, and lines linking names
 * - test coverage, keeping apart: found tests, executed tests (none here),
 *   not found in the scanned directories, and areas not examined
 * - what could not be verified
 *
 * Every quoted line is re-read from the real file through the guarded
 * reader and must match it exactly at that line number; otherwise it is
 * dropped. Sources the gates did not accept never reach this module: it
 * is built only from analysis.verifiedSources and re-checks each of them.
 *
 * Dependencies: hearthwoodCodeReader.readHearthwoodSourceFile,
 * hearthwoodProjectExplorer (file list, scanned directories),
 * hearthwoodDependencyImpact, hearthwoodSourceIndex.
 * Public API: buildVerifiedExplanation(...), describeFunction(lines, def),
 *   renderVerifiedExplanation(explanation), nameAnchors(task)
 * Tests: hearthwoodVerifiedExplanation.test.js
 */
import { readHearthwoodSourceFile } from "./hearthwoodCodeReader.js"
import { listHearthwoodProjectFiles, SOURCE_DIRECTORIES } from "./hearthwoodProjectExplorer.js"
import { analyzeHearthwoodDependencyImpact } from "./hearthwoodDependencyImpact.js"
import { extractDefinitions, taskTerms, wordMatches } from "./hearthwoodSourceIndex.js"
import { translateCondition, translateComputation, translateEffect, verifyHelpers } from "./hearthwoodConditionText.js"
import { findScriptChecks, SCRIPT_PATTERN } from "./hearthwoodScriptCoverage.js"

const MAX_FLOW = 8
const MAX_DATA_LINES = 8
const MAX_LINE = 200
const EFFECT_CALL = /\b(gain|add|remove|set|apply|spend|consume|heal|damage|deal|grant|drain)[A-Z]\w*\s*\(|\b(gainMana|setUnit|emit)\s*\(/

const isComment = line => /^\s*(\/\/|\/\*|\*)/.test(line)

/** Split on a top-level operator (not inside parentheses / brackets / strings). */
function splitTopLevel(text, operator) {
  const parts = []
  let depth = 0
  let quote = null
  let current = ""
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quote) {
      if (char === quote && text[i - 1] !== "\\") quote = null
    } else if (char === "\"" || char === "'" || char === "`") quote = char
    else if ("([{".includes(char)) depth += 1
    else if (")]}".includes(char)) depth -= 1
    else if (depth === 0 && text.startsWith(operator, i)) {
      parts.push(current.trim())
      current = ""
      i += operator.length - 1
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}
const clip = text => (text.length > MAX_LINE ? `${text.slice(0, MAX_LINE)}…` : text)

/**
 * Structure of one function, from its own lines (1-based, inclusive).
 * Pure: reads only the given lines; nothing is inferred from names.
 */
export function describeFunction(lines, definition) {
  const body = []
  for (let n = definition.startLine; n <= definition.endLine; n += 1) body.push({ line: n, text: lines[n - 1] ?? "" })

  const guards = []
  const conditions = []
  const effects = []
  const returns = []
  const comments = []
  const skips = []
  const computations = []

  for (let i = 0; i < body.length; i += 1) {
    const { line, text } = body[i]
    const trimmed = text.trim()
    if (!trimmed) continue
    if (isComment(text)) {
      if (i > 0) comments.push({ line, text: trimmed.replace(/^\/\/\s?|^\/\*+\s?|\*\/$|^\*\s?/g, "") })
      continue
    }
    if (i === 0) continue // the definition line itself ("function applyPoisonTick(state) {")
    const skip = trimmed.match(/^if\s*\((.+)\)\s*continue\b/)
    if (skip) {
      skips.push({ line, code: trimmed, condition: skip[1] })
      continue
    }
    const computed = trimmed.match(/^(?:const|let)\s+([\w$]+)\s*=\s*(.+?);?$/)
    if (computed && /Math\.|[^=!<>]\s[-+*/]\s/.test(computed[2]) && computations.length < 4) {
      computations.push({ line, code: trimmed })
    }
    const guard = trimmed.match(/^if\s*\((.+)\)\s*return\b\s*(.*?);?$/)
    if (guard) {
      // `return state` / null / false / nothing = stops without a change;
      // any other value = returns that value when the condition holds.
      const stops = /^(state|null|false|undefined|)$/.test(guard[2].trim())
      guards.push({ line, code: trimmed, condition: guard[1], result: guard[2], stops })
      continue
    }
    // find / filter / some / every predicate written on ONE line:
    // `.find((g) => a && b && c)` - each top-level && part is a condition.
    const inline = trimmed.match(/\.(find|filter|some|every)\(\s*\(?(\w+)\)?\s*=>\s*(.+)\)\s*;?$/)
    if (inline) {
      splitTopLevel(inline[3], "&&").forEach(part => conditions.push({ line, code: part, subject: inline[2] }))
    }
    // ...or one condition per line of an `a && b && c` chain (eligibleGuardian).
    if (!inline && /\.(find|filter|some|every)\(\s*$/.test(trimmed)) {
      let subject = null
      for (let j = i + 1; j < body.length && j < i + 30; j += 1) {
        const inner = body[j].text.trim()
        if (!inner || isComment(body[j].text)) continue
        if (/^\)/.test(inner)) break
        const param = inner.match(/^\(?(\w+)\)?\s*=>\s*$/)
        if (param) { subject = param[1]; continue }
        if (/=>\s*$/.test(inner)) continue
        conditions.push({ line: body[j].line, code: inner.replace(/\s*(&&|\|\|)\s*$/, "").replace(/,\s*$/, ""), subject })
        if (!/(&&|\|\|)\s*$/.test(inner)) break
      }
    }
    if (EFFECT_CALL.test(trimmed)) effects.push({ line, code: trimmed })
    if (/^return\b/.test(trimmed)) returns.push({ line, code: trimmed })
  }

  // A guard inside another `if (...) {` block only applies when that outer
  // condition holds: keep it with the guard, never show the guard alone.
  const indentOf = text => (text.match(/^\s*/) || [""])[0].length
  const baseIndent = Math.min(...body.slice(1).filter(b => b.text.trim() && !isComment(b.text)).map(b => indentOf(b.text)))
  const enclosing = line => {
    const index = body.findIndex(b => b.line === line)
    const own = indentOf(body[index].text)
    if (own <= baseIndent) return null
    for (let k = index - 1; k > 0; k -= 1) {
      const text = body[k].text
      if (!text.trim() || indentOf(text) >= own) continue
      const open = text.trim().match(/^(?:\}\s*else\s+)?if\s*\((.+)\)\s*\{$/)
      return open ? { line: body[k].line, condition: open[1] } : { line: body[k].line, condition: null, kind: text.trim().split(/\s|\(/)[0] }
    }
    return null
  }
  for (const item of [...guards, ...skips]) {
    const outer = enclosing(item.line)
    if (outer?.condition) {
      item.outer = outer
      item.condition = `(${outer.condition}) && (${item.condition})`
    }
  }
  return { guards, conditions, effects, returns, comments, skips, computations }
}

/**
 * Names the user wrote with capitals, kept as phrases ("Holy Power").
 * A capital that only starts a sentence ("Tutki", "Kerro") is not a name;
 * consecutive capitalised words after it form one phrase.
 */
export function nameAnchors(task) {
  const text = String(task || "")
  const tokens = [...text.matchAll(/[\p{L}\p{N}_]+/gu)].map(match => ({
    word: match[0],
    index: match.index,
    sentenceStart: match.index === 0 || /[.!?:]\s*$/.test(text.slice(0, match.index)),
  }))
  const phrases = []
  let current = []
  const flush = () => {
    if (current.length) phrases.push(current.join(" "))
    current = []
  }
  tokens.forEach((token, i) => {
    const capital = /^\p{Lu}/u.test(token.word)
    const adjacent = i > 0 && /^\s+$/.test(text.slice(tokens[i - 1].index + tokens[i - 1].word.length, token.index))
    if (!capital || token.sentenceStart) {
      flush()
      return
    }
    // Finnish genitive ("Guardianin Intercept") ends one name: the next
    // capitalised word is another name, not part of the same one.
    const previous = current[current.length - 1]
    if (!adjacent || (previous && /\p{Ll}in$/u.test(previous))) flush()
    current.push(token.word)
  })
  flush()
  // One name, many Finnish forms: "Guardianin" / "Guardiania" are the name
  // "Guardian" when the user also wrote that exact base form. Different
  // names are never merged, however similar ("Guard" is not "Guardian").
  const unique = [...new Set(phrases)]
  const baseOf = phrase => unique.find(other => other !== phrase && phrase.startsWith(other) && FINNISH_ENDINGS.has(phrase.slice(other.length))) || phrase
  return [...new Set(unique.map(baseOf))]
}

const FINNISH_ENDINGS = new Set([
  "n", "in", "a", "ä", "ia", "iä", "na", "nä", "ina", "inä", "ksi", "iksi",
  "lle", "ille", "lla", "llä", "illa", "illä", "lta", "ltä", "ilta", "iltä",
  "ssa", "ssä", "issa", "issä", "sta", "stä", "ista", "istä", "an", "en", "iin",
])

function sameLine(content, line, code) {
  return (content.split("\n")[line - 1] ?? "").trim() === code
}

/** Lines of a data entry ("holy: { ... }") holding fields the verified code reads. */
function dataEntryFacts(content, filePath, hitLine, keys) {
  const lines = content.split("\n")
  let start = hitLine
  while (start > 1 && !/^\s*[\w$"']+\s*:\s*\{\s*$/.test(lines[start - 1])) start -= 1
  let depth = 0
  let end = start
  for (let n = start; n <= lines.length && n < start + 200; n += 1) {
    depth += (lines[n - 1].match(/\{/g) || []).length - (lines[n - 1].match(/\}/g) || []).length
    end = n
    if (depth <= 0 && n > start) break
  }
  const facts = [{ filePath, line: start, code: lines[start - 1].trim(), kind: "entry" }]
  for (let n = start + 1; n <= end && facts.length < MAX_DATA_LINES; n += 1) {
    const code = lines[n - 1].trim()
    const key = code.match(/^([\w$]+)\s*:/)?.[1]
    if (n === hitLine || (key && keys.has(key))) facts.push({ filePath, line: n, code, kind: n === hitLine ? "name" : "field" })
  }
  return facts
}

/**
 * Build the explanation. analysis: the /analyze result (verifiedSources are
 * the gate-checked functions). Returns { status, flow, functions, data,
 * coverage, uncertainties, text }.
 */
export async function buildVerifiedExplanation({ task, verifiedSources = [] }) {
  const uncertainties = []
  if (!verifiedSources.length) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      flow: [], functions: [], data: [],
      coverage: null,
      uncertainties: ["Kysymykseen ei löytynyt yhtään lähdetarkistettua funktiota, joten selitystä ei muodostettu."],
      text: "En löytänyt kysymykseesi lähdetarkistettua koodia, joten en anna selitystä. Kokeile nimetä mekaniikka tai sen osa (esimerkiksi luokan tai kyvyn nimi).",
    }
  }

  // 1. Re-read every verified function from its real file.
  const contents = new Map()
  const readFile = async filePath => {
    if (!contents.has(filePath)) contents.set(filePath, await readHearthwoodSourceFile(filePath))
    return contents.get(filePath)
  }
  const functions = []
  const propertyKeys = new Set()
  for (const source of verifiedSources) {
    const content = await readFile(source.filePath)
    if (!content || !content.includes(source.source)) {
      uncertainties.push(`${source.symbol}: lähde ei vastannut tiedostoa ${source.filePath} – jätettiin pois.`)
      continue
    }
    const lines = content.split("\n")
    const definition = extractDefinitions(content).find(d => d.name === source.symbol)
    if (!definition) {
      uncertainties.push(`${source.symbol}: määrittelyä ei löytynyt rivitasolla – jätettiin pois.`)
      continue
    }
    const described = describeFunction(lines, definition)
    // Plain Finnish for each verified item (V1.1). A helper is explained only
    // if its own source was read and matches; otherwise the item stays code.
    const helpers = await verifyHelpers(source.filePath, content, readFile)
    for (const item of described.conditions) item.plain = translateCondition(item.code, { subject: item.subject, helpers })
    for (const item of described.guards) item.plain = translateCondition(item.condition, { subject: null, helpers })
    for (const item of described.skips) item.plain = translateCondition(item.condition, { subject: null, helpers })
    for (const item of described.effects) item.plain = translateEffect(item.code, { helpers })
    for (const item of described.computations) item.plain = translateComputation(item.code)
    const ownKeys = new Set([...source.source.matchAll(/\.([a-zA-Z_$][\w$]*)\b/g)].map(match => match[1]))
    for (const key of ownKeys) propertyKeys.add(key)
    functions.push({
      propertyKeys: ownKeys,
      symbol: source.symbol,
      filePath: source.filePath,
      startLine: definition.startLine,
      endLine: definition.endLine,
      leadingComment: definition.leadingComment.split("\n").map(line => line.replace(/^\s*\/\/\s?/, "").trim()).filter(Boolean),
      ...described,
    })
  }
  if (!functions.length) {
    return { status: "INSUFFICIENT_EVIDENCE", flow: [], functions: [], data: [], coverage: null, uncertainties, text: "Lähdetarkistettuja funktioita ei voitu lukea uudelleen tiedostoista, joten selitystä ei muodostettu." }
  }

  // 2. Flow: verified call sites of these functions (any caller, also one
  //    too long to quote whole), each line re-checked against the file.
  const impact = await analyzeHearthwoodDependencyImpact({ symbols: functions.map(f => ({ symbol: f.symbol, filePath: f.filePath })) })
  // Only where the verified pieces meet: the caller is itself verified or
  // calls at least two of them (attackUnit -> eligibleGuardian + onGuard).
  const verifiedNames = new Set(functions.map(f => f.symbol))
  const callsBy = new Map()
  for (const item of impact.symbols) {
    for (const site of item.callSites) {
      if (!site.caller) continue
      if (!callsBy.has(site.caller)) callsBy.set(site.caller, new Set())
      callsBy.get(site.caller).add(item.symbol)
    }
  }
  const meets = caller => verifiedNames.has(caller) || (callsBy.get(caller)?.size || 0) >= 2
  const flow = []
  for (const item of impact.symbols) {
    for (const site of item.callSites) {
      if (flow.length >= MAX_FLOW || !meets(site.caller)) continue
      const content = await readFile(site.filePath)
      if (!content || !sameLine(content, site.line, site.text)) continue
      flow.push({ filePath: site.filePath, line: site.line, caller: site.caller, callee: item.symbol, code: clip(site.text) })
    }
  }
  for (const fn of functions) {
    const linked = flow.some(step => step.callee === fn.symbol || step.caller === fn.symbol)
    if (!linked && functions.length > 1) {
      fn.unlinked = true
      uncertainties.push(`${fn.symbol}: vahvistettu lähde, mutta sillä ei löytynyt kutsuyhteyttä muihin löydettyihin osiin. Se voi olla sivuosuma tai erillinen osa mekaniikkaa.`)
    }
  }
  flow.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line)
  const callers = [...new Set(flow.map(f => f.caller).filter(Boolean))].filter(name => !verifiedNames.has(name))
  for (const caller of callers) {
    uncertainties.push(`${caller}: funktiosta näytetään vain todennetut kutsurivit. Sitä ei voi lainata kokonaan lähdetarkistuksen rajoissa, joten sen muita ehtoja ei ole tarkistettu.`)
  }

  // 3. Game data the user named ("Holy Power"), only lines of fields the
  //    verified functions read, plus lines linking two named things.
  const anchors = nameAnchors(task)
  const anchorWords = taskTerms(task).anchors
  // which named phrase each anchor word belongs to ("holy", "power" -> "Holy Power")
  const phraseOf = term => anchors.findIndex(phrase => (phrase.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).some(word => wordMatches(word, term)))
  const data = []
  const files = (await listHearthwoodProjectFiles()).filter(file => file.startsWith("src/data/"))
  for (const filePath of files) {
    if (data.length >= MAX_DATA_LINES) break
    const content = await readFile(filePath)
    if (!content) continue
    const lines = content.split("\n")
    for (const phrase of anchors.filter(p => /\s/.test(p))) {
      const hit = lines.findIndex(line => new RegExp(`["'\`]${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`, "i").test(line))
      if (hit >= 0) data.push(...dataEntryFacts(content, filePath, hit + 1, propertyKeys).map(fact => ({ ...fact, about: phrase })))
    }
    lines.forEach((line, index) => {
      if (data.length >= MAX_DATA_LINES || isComment(line)) return
      const words = (line.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
      // strict for links: the same word, or a shared start of 6+ letters
      // ("guardian" ~ "guardianin"), so "guard" does not count as "Guardian"
      const strict = (word, term) => word === term || (Math.min(word.length, term.length) >= 6 && wordMatches(word, term))
      const named = anchorWords.filter(term => words.some(word => strict(word, term)))
      const phrases = new Set(named.map(phraseOf).filter(index => index >= 0))
      if (phrases.size >= 2 && line.trim().length < 120) data.push({ filePath, line: index + 1, code: line.trim(), kind: "link", about: named.join(" + ") })
    })
  }

  // 4. Coverage - found vs executed vs not found vs not examined.
  // Checks in version-controlled .scratch/verify_*.mjs whose OWN description
  // names an asked thing, grouped per named thing (never executed).
  const groups = (anchors.length
    ? anchors.map(phrase => ({ name: phrase.replace(/(\p{Ll})in$/u, "$1"), term: phrase.split(/\s+/)[0].toLowerCase(), named: true }))
    : taskTerms(task).words.filter(word => word.length >= 5).slice(0, 3).map(word => ({ name: word, term: word, named: false })))
    .filter(group => !/^hearthwood/.test(group.term))
  const scripts = await findScriptChecks({ terms: groups.map(group => group.term), symbols: functions.map(f => f.symbol) })
  const scriptGroups = groups.map(group => ({
    name: group.name,
    named: group.named,
    checks: scripts.files.flatMap(file => file.checks
      .filter(check => check.matched.includes(group.term))
      .map(check => ({ file: file.file, line: check.line, label: check.label }))).slice(0, 5),
  }))
  const coverage = {
    scripts: { examined: scripts.examined, scanned: scripts.scanned, pattern: SCRIPT_PATTERN, groups: scriptGroups, mentionsOnly: scripts.mentionsOnly },
    found: impact.symbols.flatMap(item => item.existingTests.map(file => ({ symbol: item.symbol, file }))),
    sameFileOnly: impact.symbols.flatMap(item => item.fileOnlyTests.map(file => ({ symbol: item.symbol, file }))),
    executed: [],
    notFound: impact.symbols.filter(item => !item.existingTests.length).map(item => item.symbol),
    scannedDirectories: SOURCE_DIRECTORIES,
    testFilesScanned: impact.scope.testFilesScanned,
    notExamined: [
      "projektin juuren tests/-hakemisto",
      "server/-palvelimen testit",
      ...(scripts.examined ? [] : [".scratch/-tarkistusskriptit (versionhallintaa ei voitu lukea)"]),
      "versionhallinnan ulkopuoliset tiedostot (esim. Downloads)",
    ],
  }
  if (scriptGroups.some(group => group.checks.length)) {
    uncertainties.push("Tarkistusskriptin kuvaus kertoo, mitä skripti sanoo tarkistavansa. Skriptejä ei ajettu, eikä niiden yhteyttä juuri näihin funktioihin ole todennettu.")
  }
  // With a chain, side hits are not part of the explanation: their
  // conditions are not counted here (they are listed as side hits above).
  const explained = functions.some(fn => !fn.unlinked) ? functions.filter(fn => !fn.unlinked) : functions
  const untranslated = explained.flatMap(fn => [...fn.conditions, ...fn.guards, ...fn.skips].filter(item => item.plain && !item.plain.verified))
  if (untranslated.length) {
    uncertainties.push(untranslated.length === 1
      ? "1 ehto näytetään vain koodina: sen merkitystä ei voitu vahvistaa (esim. apufunktio, jonka lähdettä ei ole tarkistettu)."
      : `${untranslated.length} ehtoa näytetään vain koodina: niiden merkitystä ei voitu vahvistaa (esim. apufunktio, jonka lähdettä ei ole tarkistettu).`)
  }
  uncertainties.push("Koodin kommentit kertovat kirjoittajan aikeen; niitä ei ole todennettu toiminnaksi.")
  uncertainties.push("Ehdot on luettu funktioiden omasta koodista; kutsuttujen apufunktioiden (esim. tarkistusfunktioiden) sisältöä ei ole avattu, ellei niitä ole lueteltu vahvistettuina.")

  const seenData = new Set()
  const uniqueData = data.filter(fact => {
    const key = `${fact.filePath}:${fact.line}`
    if (seenData.has(key)) return false
    seenData.add(key)
    return true
  })
  if (uniqueData.some(fact => fact.kind === "field")) {
    uncertainties.push("Pelidatan rivit ja funktioiden kenttäluvut on näytetty rinnakkain; sitä, mitä datariviä funktio käyttää ajon aikana, ei ole todennettu.")
  }
  // A data field listing several cases ("gain: { block: 1, guard: 1, heal: 1 }")
  // where the explained code reads only some of them: say which are open.
  const readKeys = new Set(explained.flatMap(fn => [...fn.propertyKeys]))
  for (const fact of uniqueData.filter(item => item.kind === "field")) {
    const inner = fact.code.match(/^([\w$]+)\s*:\s*\{(.*)\}\s*,?$/)
    if (!inner) continue
    const keys = [...inner[2].matchAll(/([\w$]+)\s*:/g)].map(match => match[1])
    const used = keys.filter(key => readKeys.has(key))
    const open = keys.filter(key => !readKeys.has(key))
    if (used.length && open.length) {
      uncertainties.push(`Pelidatan kentässä ${inner[1]} (${where(fact.filePath, fact.line)}) on myös ${open.join(", ")}. Selitetty koodi lukee niistä vain kohdan ${used.join(", ")}; muita tapauksia käsittelevää koodia ei tarkistettu tässä selityksessä.`)
    }
  }
  const explanation = { status: "VERIFIED_FACTS", flow, functions, data: uniqueData.slice(0, MAX_DATA_LINES), coverage, uncertainties }
  return { ...explanation, text: renderVerifiedExplanation(explanation), sections: renderVerifiedExplanationSections(explanation) }
}

const where = (filePath, line) => `${filePath.split("/").pop()}:${line}`

/** Callees of one call line joined by a top-level `||` / `??`, in order. */
function alternativesOf(step) {
  if (step.callees.length < 2) return null
  const parts = splitTopLevel(step.code.replace(/\?\?/g, "||"), "||")
  if (parts.length < 2) return null
  const ordered = []
  for (const part of parts) {
    const own = step.callees.filter(name => new RegExp(`(^|[^\\w$])${name.replace(/\$/g, "\\$")}\\s*\\(`).test(part))
    if (own.length !== 1) return null
    ordered.push(own[0])
  }
  return new Set(ordered).size === ordered.length ? ordered : null
}

/** One function in plain Finnish, its parts in the order the code runs. */
function functionSteps(fn, say) {
  const blocks = []
  const add = (line, kind, text, item) => {
    const last = blocks[blocks.length - 1]
    if (item && last?.kind === kind) last.items.push(item)
    else blocks.push({ line, kind, text, items: item ? [item] : [] })
  }
  const parts = [
    ...fn.guards.map(item => ({ line: item.line, item, kind: item.stops ? (/^state$/.test(item.result.trim()) ? "same" : "none") : "return" })),
    ...fn.skips.map(item => ({ line: item.line, item, kind: "skip" })),
    ...(fn.conditions.length ? [{ line: fn.conditions[0].line, kind: "find" }] : []),
    ...fn.computations.map(item => ({ line: item.line, item, kind: "compute" })),
    ...fn.effects.map(item => ({ line: item.line, item, kind: "effect" })),
  ].sort((a, b) => a.line - b.line)
  const HEAD = {
    same: "Ei muuta mitään, jos:",
    none: "Lopettaa ilman tulosta, jos:",
    skip: "Ohittaa yksikön, jos:",
  }
  for (const part of parts) {
    if (part.kind === "find") blocks.push({ kind: "find", text: "Hyväksyy yksikön vain, kun kaikki nämä pätevät:", items: fn.conditions })
    else if (HEAD[part.kind]) add(part.line, part.kind, HEAD[part.kind], part.item)
    else if (part.kind === "return") blocks.push({ kind: "return", text: `Palauttaa tuloksen suoraan, jos: ${say(part.item)}`, items: [] })
    else if (part.kind === "compute") blocks.push({ kind: "compute", text: `Laskee: ${say(part.item)}`, items: [] })
    else blocks.push({ kind: "effect", text: `Muutos: ${say(part.item)}`, items: [] })
  }
  return blocks.flatMap(block => [block.text, ...block.items.map(item => `- ${say(item)}`)])
}
const list = names => names.map(name => `\`${name}\``).join(", ").replace(/, ([^,]*)$/, " ja $1")

/** Plain Finnish, built only from the verified structure above. */
export function renderVerifiedExplanation(explanation) {
  if (explanation.status !== "VERIFIED_FACTS") return explanation.text || ""
  const sections = renderVerifiedExplanationSections(explanation)
  return [sections.summary, sections.details, sections.coverage, sections.uncertainties].filter(Boolean).join("\n\n")
}

/**
 * The same text in four parts for the Studio: summary (what happens) is
 * shown first; details, coverage and uncertainties can be folded.
 */
export function renderVerifiedExplanationSections(explanation) {
  if (explanation.status !== "VERIFIED_FACTS") return { summary: explanation.text || "", details: "", coverage: "", uncertainties: (explanation.uncertainties || []).map(item => `- ${item}`).join("\n") }
  const { flow, functions, data, coverage } = explanation
  const hasStructure = fn => fn.conditions.length || fn.guards.length || fn.effects.length || fn.skips.length
  const shown = functions.filter(fn => !fn.unlinked || hasStructure(fn))
  // plain words, or the code with an honest note when it could not be said
  const say = item => (item.plain?.verified ? item.plain.text : `\`${item.condition || item.code}\` – merkitystä ei voitu vahvistaa`)

  const steps = []
  for (const step of flow) {
    const same = steps.find(s => s.filePath === step.filePath && s.line === step.line)
    if (same) same.callees.push(step.callee)
    else steps.push({ ...step, callees: [step.callee] })
  }
  // `a(...) || b(...)` on one line: two separate ways, tried in that order.
  for (const step of steps) step.alternatives = alternativesOf(step)
  const pathOf = new Map()
  for (const step of steps) {
    step.alternatives?.forEach((name, index) => pathOf.set(name, { index, step, of: step.alternatives }))
  }
  // With a verified chain, functions outside it are side hits: technical
  // details only, never part of "what happens". Without any chain, nothing
  // is set apart and every structured function is shown.
  const chain = shown.filter(fn => !fn.unlinked)
  const side = chain.length ? shown.filter(fn => fn.unlinked) : []
  const main = (chain.length ? chain : shown).slice().sort((a, b) => order(a) - order(b))
  function order(fn) {
    const at = steps.findIndex(step => step.callees.includes(fn.symbol))
    return (at < 0 ? steps.length : at) * 10 + (pathOf.get(fn.symbol)?.index || 0)
  }

  // --- summary: plain Finnish, no JavaScript needed ---------------------
  const out = []
  out.push("Selitys perustuu vain koodista koneellisesti tarkistettuihin kohtiin. Jokaisen kohdan koodi ja rivinumero löytyvät lisätiedoista.")
  if (steps.length) {
    out.push("", "**Mitä tapahtuu**")
    const hubs = [...new Set(steps.map(s => s.caller).filter(Boolean))]
    for (const hub of hubs) {
      const own = steps.filter(s => s.caller === hub)
      const parts = own.map(s => (s.alternatives
        ? `kokeilee ensin ${list([s.alternatives[0]])}; jos se ei palauta tulosta, se käyttää ${list(s.alternatives.slice(1))} (${s.alternatives.length} erillistä polkua samassa kohdassa, rivi ${s.line})`
        : `${list(s.callees)} (rivi ${s.line})`))
      out.push(`- Funktio ${hub} ${own[0].alternatives ? "" : "käyttää ensin "}${parts.join("; sitten ")}.`)
    }
  }
  for (const fn of main) {
    const path = pathOf.get(fn.symbol)
    const label = path
      ? (path.index === 0 ? ` – polku 1` : ` – polku ${path.index + 1} (käytetään, jos ${list(path.of.slice(0, path.index))} ei palauta tulosta)`)
      : ""
    out.push("", `**${fn.symbol}**${label}`)
    out.push(...functionSteps(fn, say))
  }
  const readable = data.filter(fact => fact.kind !== "entry" && !/^id\s*:/.test(fact.code))
  if (readable.length) {
    out.push("", "**Pelidata**")
    for (const fact of readable) {
      const plain = fact.code.replace(/,\s*$/, "").replace(/["'`]/g, "").replace(/[{}]/g, "").replace(/\s*:\s*/g, ": ").replace(/\s+/g, " ").trim()
      out.push(`- ${plain}`)
    }
    out.push("Datarivit näytetään koodin rinnalla. Sitä, että juuri nämä rivit ovat käytössä pelin aikana, ei ole todennettu.")
  }
  if (side.length === 1) out.push("", `Haku löysi myös kohdan ${list(side.map(fn => fn.symbol))}, jonka yhteyttä tähän toimintaketjuun ei voitu todentaa. Se näkyy vain lisätiedoissa, eikä se ole osa tätä selitystä.`)
  if (side.length > 1) out.push("", `Haku löysi myös ${side.length} kohtaa (${list(side.map(fn => fn.symbol))}), joiden yhteyttä tähän toimintaketjuun ei voitu todentaa. Ne näkyvät vain lisätiedoissa, eivätkä ne ole osa tätä selitystä.`)
  const anyTests = coverage.scripts?.groups?.some(group => group.checks.length) || coverage.found.length
  out.push("", anyTests
    ? "**Testit:** olemassa olevia tarkistuksia löytyi (alla), mutta mitään ei ajettu tässä analyysissä."
    : "**Testit:** tarkistuksia ei löytynyt tutkituista paikoista, eikä mitään ajettu.")
  const summary = out.join("\n")

  // --- details: the exact code behind every sentence ---------------------
  out.length = 0
  out.push("Koodirivit, joihin selitys perustuu (tiedosto:rivi).")
  for (const step of steps) out.push(`- ${step.caller ? `${step.caller} → ` : ""}${step.callees.join(", ")} (${where(step.filePath, step.line)}): \`${step.code}\``)
  for (const fn of [...main, ...side]) {
    if (fn === side[0]) {
      out.push("", "**Muut löydetyt kohdat** – vahvistettua lähdekoodia, mutta ei todennettua yhteyttä yllä olevaan toimintaketjuun. Nämä eivät ole osa selitystä:")
    }
    out.push("", `**${fn.symbol}** (${fn.filePath.split("/").pop()}, rivit ${fn.startLine}–${fn.endLine})${side.includes(fn) ? " – sivuosuma" : ""}`)
    if (fn.leadingComment.length) out.push(`- Koodin kommentti (ei todennettua toimintaa): “${clip(fn.leadingComment.join(" "))}”`)
    for (const item of fn.conditions) out.push(`- ehto: \`${item.code}\` (rivi ${item.line})`)
    for (const item of fn.guards) out.push(`- ${item.stops ? "lopettaa" : "palauttaa"}, jos: \`${item.condition}\` (rivi ${item.line}${item.outer ? `, ympäröivä ehto rivillä ${item.outer.line}` : ""})`)
    for (const item of fn.skips) out.push(`- ohittaa, jos: \`${item.condition}\` (rivi ${item.line})`)
    for (const item of fn.computations) out.push(`- laskee: \`${clip(item.code)}\` (rivi ${item.line})`)
    for (const item of fn.effects) out.push(`- muuttaa: \`${clip(item.code)}\` (rivi ${item.line})`)
  }
  if (data.length) {
    out.push("", "**Pelidata**")
    for (const fact of data) out.push(`- \`${clip(fact.code)}\` (${where(fact.filePath, fact.line)})`)
  }
  const details = out.join("\n")

  // --- coverage ------------------------------------------------------
  out.length = 0
  out.push("**Testikattavuus**")
  const scripts = coverage.scripts
  if (scripts?.examined) {
    const related = new Set(scripts.groups.flatMap(group => group.checks.map(check => `${check.file}:${check.line}`)))
    const files = new Set(scripts.groups.flatMap(group => group.checks.map(check => check.file)))
    out.push("Tila:")
    out.push(`- Skripti löytyi: ${files.size ? `kyllä, ${files.size} skriptiä` : "ei"}`)
    out.push(`- Skripti sisältää asiaan liittyvän tarkistuksen: ${related.size ? `kyllä, ${related.size} tarkistuksen kuvausta` : "ei"}`)
    out.push("- Skriptin suoritus vahvistettu: ei (tämä analyysi ei aja skriptejä)")
    out.push("- Testin onnistuminen vahvistettu: ei (ajotulosta ei ole)")
    out.push("", `Tarkistusskriptit (${scripts.pattern}, versionhallinnassa ${scripts.scanned} kpl). Kuvaus on skriptin oma; ei ajettu tässä analyysissä:`)
    // a name the user gave is always answered; a plain search word only if found
    for (const group of scripts.groups.filter(g => g.named || g.checks.length)) {
      if (!group.checks.length) {
        out.push(`- ${group.name}: ei tarkistusta, jonka kuvaus mainitsee sen.`)
        continue
      }
      out.push(`- ${group.name}:`)
      for (const check of group.checks) out.push(`  - “${clip(check.label)}” (${where(check.file, check.line)})`)
    }
    if (scripts.mentionsOnly.length) {
      out.push(`- Mainitsee funktion nimen, mutta ei tarkistusta siitä: ${scripts.mentionsOnly.map(item => item.file.split("/").pop()).join(", ")}.`)
    }
  }
  if (coverage.found.length) out.push(`- Lähdehakemistojen testit, jotka mainitsevat funktion (ei ajettu): ${coverage.found.map(item => `${item.symbol} → ${item.file}`).join(", ")}`)
  if (coverage.sameFileOnly.length) out.push(`- Testejä, jotka vain tuovat saman tiedoston (eivät todista näitä funktioita): ${[...new Set(coverage.sameFileOnly.map(item => item.file))].join(", ")}`)
  out.push("- Suoritettuja testejä: ei yhtään – tämä analyysi ei aja testejä.")
  out.push(`- Tarkistetut lähdehakemistot: ${coverage.scannedDirectories.join(", ")} (testitiedostoja: ${coverage.testFilesScanned}).`)
  if (coverage.notFound.length) out.push(`- Niissä ei ollut testiä, joka mainitsee: ${coverage.notFound.join(", ")}. Tämä ei tarkoita, ettei testiä olisi muualla.`)
  out.push(`- Ei tutkittu: ${coverage.notExamined.join(", ")}.`)
  const coverageText = out.join("\n")

  out.length = 0
  out.push("**Epävarmuudet**")
  for (const item of explanation.uncertainties) out.push(`- ${item}`)
  return { summary, details, coverage: coverageText, uncertainties: out.join("\n") }
}
