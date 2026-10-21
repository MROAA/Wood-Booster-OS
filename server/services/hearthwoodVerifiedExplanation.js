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
    const inline = trimmed.match(/\.(find|filter|some|every)\(\s*\(?\w+\)?\s*=>\s*(.+)\)\s*;?$/)
    if (inline) {
      splitTopLevel(inline[2], "&&").forEach(part => conditions.push({ line, code: part }))
    }
    // ...or one condition per line of an `a && b && c` chain (eligibleGuardian).
    if (!inline && /\.(find|filter|some|every)\(\s*$/.test(trimmed)) {
      for (let j = i + 1; j < body.length && j < i + 30; j += 1) {
        const inner = body[j].text.trim()
        if (!inner || isComment(body[j].text)) continue
        if (/^\)/.test(inner)) break
        if (/=>\s*$/.test(inner) || /^\(?\w+\)?\s*=>\s*$/.test(inner)) continue
        conditions.push({ line: body[j].line, code: inner.replace(/\s*(&&|\|\|)\s*$/, "").replace(/,\s*$/, "") })
        if (!/(&&|\|\|)\s*$/.test(inner)) break
      }
    }
    if (EFFECT_CALL.test(trimmed)) effects.push({ line, code: trimmed })
    if (/^return\b/.test(trimmed)) returns.push({ line, code: trimmed })
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
    if (!adjacent) flush()
    current.push(token.word)
  })
  flush()
  return [...new Set(phrases)]
}

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
    for (const match of source.source.matchAll(/\.([a-zA-Z_$][\w$]*)\b/g)) propertyKeys.add(match[1])
    functions.push({
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
  const coverage = {
    found: impact.symbols.flatMap(item => item.existingTests.map(file => ({ symbol: item.symbol, file }))),
    sameFileOnly: impact.symbols.flatMap(item => item.fileOnlyTests.map(file => ({ symbol: item.symbol, file }))),
    executed: [],
    notFound: impact.symbols.filter(item => !item.existingTests.length).map(item => item.symbol),
    scannedDirectories: SOURCE_DIRECTORIES,
    testFilesScanned: impact.scope.testFilesScanned,
    notExamined: ["projektin juuren tests/-hakemisto", ".scratch/-tarkistusskriptit", "server/-palvelimen testit", "selaimessa ajettavat pelitestit"],
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
  const explanation = { status: "VERIFIED_FACTS", flow, functions, data: uniqueData.slice(0, MAX_DATA_LINES), coverage, uncertainties }
  return { ...explanation, text: renderVerifiedExplanation(explanation), sections: renderVerifiedExplanationSections(explanation) }
}

const where = (filePath, line) => `${filePath.split("/").pop()}:${line}`
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
  // Every verified function with visible structure is shown (in rank
  // order); one without a call link to the others is marked as such.
  const hasStructure = fn => fn.conditions.length || fn.guards.length || fn.effects.length || fn.skips.length
  const linked = functions.filter(fn => !fn.unlinked || hasStructure(fn))

  // one entry per call line: "attackUnit calls eligibleGuardian and classGuardFor (2417)"
  const steps = []
  for (const step of flow) {
    const same = steps.find(s => s.filePath === step.filePath && s.line === step.line)
    if (same) same.callees.push(step.callee)
    else steps.push({ ...step, callees: [step.callee] })
  }
  const hubs = [...new Set(steps.map(s => s.caller).filter(Boolean))]

  const out = []
  out.push("**Lyhyesti**")
  for (const hub of hubs) {
    const own = steps.filter(s => s.caller === hub)
    out.push(`- \`${hub}\` käyttää löydettyjä osia: ${own.map(s => `${list(s.callees)} (${where(s.filePath, s.line)})`).join(", sitten ")}.`)
  }
  for (const fn of linked) {
    const parts = []
    if (fn.conditions.length) parts.push(`hyväksyy vain kohteen, joka täyttää ${fn.conditions.length} ehtoa`)
    const stops = fn.guards.filter(g => g.stops)
    if (stops.length) parts.push(`lopettaa muuttamatta mitään ${stops.length} tapauksessa`)
    if (fn.effects.length) parts.push(`muuttaa tilaa rivillä ${fn.effects.map(e => e.line).join(", ")}`)
    if (parts.length) out.push(`- \`${fn.symbol}\` ${parts.join(", ")}${fn.unlinked ? " – ei kutsuyhteyttä muihin löydettyihin osiin" : ""} (yksityiskohdat alla).`)
  }
  out.push(coverage.found.length
    ? `- Testejä löytyi (${coverage.found.length}), mutta yhtään ei ajettu tässä analyysissä.`
    : "- Löydetyille funktioille ei löytynyt testiä tarkistetuista hakemistoista, eikä yhtään testiä ajettu.")
  if (steps.length) {
    out.push("", "**Miten toiminto etenee**")
    for (const step of steps) {
      out.push(`- ${step.caller ? `\`${step.caller}\` kutsuu ` : ""}${list(step.callees)} (${where(step.filePath, step.line)}): \`${step.code}\``)
    }
  }

  const summary = out.join("\n")
  out.length = 0
  out.push("Kaikki alla oleva näkyy suoraan Hearthwoodin koodista (tiedosto:rivi jokaisen kohdan perässä). Tulkintaa ei ole lisätty.")
  for (const fn of linked) {
    out.push("", `**\`${fn.symbol}\`** (${fn.filePath.split("/").pop()}, rivit ${fn.startLine}–${fn.endLine})${fn.unlinked ? " – ei kutsuyhteyttä muihin löydettyihin osiin" : ""}`)
    if (fn.leadingComment.length) out.push(`- Koodin kommentti (ei todennettua toimintaa): “${clip(fn.leadingComment.join(" "))}”`)
    if (fn.conditions.length) {
      out.push("- Hyväksyy vain kohteen, jolle kaikki nämä ehdot ovat totta:")
      for (const condition of fn.conditions) out.push(`  - \`${condition.code}\` (rivi ${condition.line})`)
    }
    for (const guard of fn.guards) {
      out.push(guard.stops
        ? `- Lopettaa muuttamatta mitään, jos \`${guard.condition}\` (rivi ${guard.line})`
        : `- Palauttaa \`${clip(guard.result)}\`, jos \`${guard.condition}\` (rivi ${guard.line})`)
    }
    for (const skip of fn.skips) out.push(`- Ohittaa kohteen, jos \`${skip.condition}\` (rivi ${skip.line})`)
    for (const computation of fn.computations) out.push(`- Laskee: \`${clip(computation.code)}\` (rivi ${computation.line})`)
    for (const effect of fn.effects) out.push(`- Muuttaa tilaa: \`${clip(effect.code)}\` (rivi ${effect.line})`)
  }

  if (data.length) {
    out.push("", "**Pelidata**")
    for (const fact of data) out.push(`- \`${clip(fact.code)}\` (${where(fact.filePath, fact.line)})`)
  }

  const details = out.join("\n")
  out.length = 0
  out.push("**Testikattavuus**")
  out.push(`- Tarkistetut hakemistot: ${coverage.scannedDirectories.join(", ")} (testitiedostoja löytyi: ${coverage.testFilesScanned}).`)
  if (coverage.found.length) out.push(`- Löytyi testejä, jotka mainitsevat funktion (olemassaolo varmistettu, ei ajettu): ${coverage.found.map(item => `\`${item.symbol}\` → ${item.file}`).join(", ")}`)
  if (coverage.sameFileOnly.length) out.push(`- Testejä, jotka vain tuovat saman tiedoston (eivät todista näitä funktioita): ${[...new Set(coverage.sameFileOnly.map(item => item.file))].join(", ")}`)
  out.push("- Suoritettuja testejä: ei yhtään – tämä analyysi ei aja testejä.")
  if (coverage.notFound.length) out.push(`- Testiä ei löytynyt tarkistetuista hakemistoista: ${list(coverage.notFound)}. Tämä ei tarkoita, ettei testiä olisi muualla.`)
  out.push(`- Ei tutkittu: ${coverage.notExamined.join(", ")}.`)

  const coverageText = out.join("\n")
  out.length = 0
  out.push("**Epävarmuudet**")
  for (const item of explanation.uncertainties) out.push(`- ${item}`)
  return { summary, details, coverage: coverageText, uncertainties: out.join("\n") }
}
