/**
 * Hearthwood Dev Studio — Condition Text (Verified Explanation V1.1)
 *
 * Purpose: say a machine-verified code condition in plain Finnish, for a
 * user who does not read JavaScript - without adding meaning the code
 * does not have.
 *
 * How it stays honest:
 * - only fixed shapes are translated (field comparisons, negations, and/or,
 *   calls of known helpers); anything else stays code, marked
 *   "merkitystä ei voitu vahvistaa"
 * - field words come from a small, reviewable glossary (FIELDS); a field
 *   not in it is never guessed
 * - a helper call (kingAdjacent, manaOn, ...) is explained only when the
 *   helper's own source was read and matches the fingerprint the
 *   explanation was written for (HELPERS); a changed helper falls back to
 *   "apufunktio, ei vahvistettu"
 *
 * Dependencies: none for translation (pure). verifyHelpers() takes the
 * caller's guarded file reader.
 * Public API: translateCondition, translateEffect, translateComputation,
 *   verifyHelpers, HELPERS, FIELDS
 * Tests: hearthwoodConditionText.test.js
 */
import { extractDefinitions } from "./hearthwoodSourceIndex.js"

// Who a variable is, in words. The find(...) parameter and a few common
// names; everything else is "yksikkö (name)".
const ROLES = {
  target: { nom: "kohde", ade: "kohteella", gen: "kohteen" },
  state: { nom: "peli", ade: "pelissä", gen: "pelin" },
}
const roleOf = (name, ctx) => (name === ctx.subject
  ? { nom: "yksikkö", ade: "yksiköllä", gen: "yksikön" }
  : ROLES[name] || { nom: `yksikkö (${name})`, ade: `yksiköllä (${name})`, gen: `yksikön (${name})` })
const cap = text => text.charAt(0).toUpperCase() + text.slice(1)

// Field glossary: each entry is what the field means in Hearthwood's units.
const FIELDS = {
  hp: {
    ">0": r => `${r.nom} on elossa`,
    "<=0": r => `${r.nom} ei ole elossa`,
  },
  ap: {
    ">=": (r, n) => `${r.ade} on vähintään ${n} toimintapiste${n === "1" ? "" : "ttä"}`,
  },
  className: {
    "===": (r, v) => `${r.nom} on luokkaa ${v}`,
    "!==": (r, v) => `${r.nom} ei ole luokkaa ${v}`,
  },
  id: {
    "!==target.id": r => `${r.nom} ei ole sama yksikkö kuin kohde`,
  },
  side: {
    "===target.side": r => `${r.nom} on samalla puolella kuin kohde`,
    "!==target.side": r => `${r.nom} ei ole samalla puolella kuin kohde`,
    "===": (r, v) => `${r.nom} on puolella ${v === "player" ? "pelaaja" : v === "enemy" ? "vihollinen" : v}`,
    "!==": (r, v) => `${r.nom} ei ole ${v === "player" ? "pelaajan" : v === "enemy" ? "vihollisen" : v} puolella`,
  },
  suppressed: { "not>0": r => `${r.ade} ei ole aktiivista Suppressed-vaikutusta`, ">0": r => `${r.ade} on aktiivinen Suppressed-vaikutus` },
  stun: { "not>0": r => `${r.nom} ei ole tainnutettu (Stun)`, ">0": r => `${r.nom} on tainnutettu (Stun)` },
  poison: { "not>0": r => `${r.ade} ei ole myrkkyä (Poison)`, ">0": r => `${r.ade} on myrkkyä (Poison)` },
  guarded: { ">0": r => `${r.ade} on aktiivinen Guard-suojaus`, "not>0": r => `${r.ade} ei ole Guard-suojausta` },
  guardedBy: { truthy: r => `${r.ade} on nimetty suojaaja`, not: r => `${r.ade} ei ole nimettyä suojaajaa` },
  interceptUsed: { not: r => `${r.nom} ei ole vielä käyttänyt Interceptiä tämän vihollisvuoron aikana`, truthy: r => `${r.nom} on jo käyttänyt Interceptin tämän vihollisvuoron aikana` },
  phase: {
    "===": (r, v) => (v === "enemy" ? "on vihollisen vuoro" : v === "player" ? "on pelaajan vuoro" : `vuoron vaihe on ${v}`),
    "!==": (r, v) => (v === "enemy" ? "ei ole vihollisen vuoro" : v === "player" ? "ei ole pelaajan vuoro" : `vuoron vaihe ei ole ${v}`),
  },
}

// Helpers explained in words ONLY if their source matches `source`
// exactly (whitespace-normalised). `file` is where the definition lives.
export const HELPERS = {
  kingAdjacent: {
    file: "src/services/heartwood/targeting.js",
    source: "export function kingAdjacent(a, b) { return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) <= 1 && !samePos(a, b) }",
    meaning: args => `${args[0]} ja ${args[1]} ovat vierekkäisissä ruuduissa (myös vinottain), eivät samassa ruudussa`,
    negated: args => `${args[0]} ja ${args[1]} eivät ole vierekkäisissä ruuduissa`,
  },
  manaOn: {
    file: "src/services/heartwood/tacticsMana.js",
    source: "export function manaOn(state) { return !!state?.manaRules }",
    meaning: () => "pelissä on resurssisäännöt käytössä",
    negated: () => "pelissä ei ole resurssisääntöjä käytössä",
  },
  hasMana: {
    file: "src/services/heartwood/tacticsMana.js",
    source: "export function hasMana(u) { return !!u && typeof u.mana === \"number\" }",
    meaning: args => `${args[0]} on olemassa ja sillä on resurssimittari`,
    negated: args => `${args[0]} puuttuu tai sillä ei ole resurssimittaria`,
  },
  has: {
    file: "src/services/heartwood/tacticsClasses.js",
    source: "const has = (u, passiveId) => !!u && u.classPassive === passiveId",
    meaning: (args, roles) => `${roles[0].gen} luokkapassiivi on ${args[1].replace(/^["']|["']$/g, "").replace(/^./, c => c.toUpperCase())}`,
    negated: (args, roles) => `${roles[0].gen} luokkapassiivi ei ole ${args[1].replace(/^["']|["']$/g, "").replace(/^./, c => c.toUpperCase())}`,
  },
}

// A helper too long to fingerprint whole: the exact lines the words rely on.
export const HELPER_FACTS = {
  gainMana: {
    file: "src/services/heartwood/tacticsMana.js",
    lines: [
      "if (!manaOn(state) || !hasMana(u) || u.hp <= 0 || !(amount > 0)) return state",
      "const room = Math.max(0, cap - u.mana)",
      "const toMana = Math.min(room, amount)",
    ],
  },
}

const normalise = text => text.replace(/\s+/g, " ").trim()

/**
 * Which known helpers are really the ones the explained function calls:
 * defined in the same file, or imported by name from the helper's file -
 * and with exactly the expected source. readFile: guarded reader.
 */
export async function verifyHelpers(functionFile, functionFileContent, readFile) {
  const verified = new Set()
  for (const [name, helper] of Object.entries(HELPERS)) {
    const sameFile = helper.file === functionFile
    const base = helper.file.split("/").pop().replace(/\.js$/, "")
    const imported = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["'][^"']*${base}(\\.js)?["']`).test(functionFileContent)
    // A bare call reaches only a same-file definition or a named import.
    if (!sameFile && !imported) continue
    const content = await readFile(helper.file)
    if (!content) continue
    const definition = extractDefinitions(content).find(d => d.name === name)
    if (!definition) continue
    const text = content.split("\n").slice(definition.startLine - 1, definition.endLine).join("\n")
    if (normalise(text) === normalise(helper.source)) verified.add(name)
  }
  for (const [name, helper] of Object.entries(HELPER_FACTS)) {
    const base = helper.file.split("/").pop().replace(/\.js$/, "")
    const reachable = helper.file === functionFile ||
      new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["'][^"']*${base}(\\.js)?["']`).test(functionFileContent)
    if (!reachable) continue
    const content = await readFile(helper.file)
    const definition = content && extractDefinitions(content).find(d => d.name === name)
    if (!definition) continue
    const body = content.split("\n").slice(definition.startLine - 1, definition.endLine).map(line => line.trim())
    if (helper.lines.every(line => body.includes(line))) verified.add(name)
  }
  return verified
}

// --- condition parsing --------------------------------------------------

function stripParens(text) {
  let s = text.trim()
  while (s.startsWith("(") && s.endsWith(")") && balanced(s.slice(1, -1))) s = s.slice(1, -1).trim()
  return s
}
function balanced(text) {
  let depth = 0
  for (const char of text) {
    if (char === "(") depth += 1
    if (char === ")") depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}
function splitTop(text, operator) {
  const parts = []
  let depth = 0
  let quote = null
  let current = ""
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quote) { if (char === quote) quote = null }
    else if (char === "\"" || char === "'" || char === "`") quote = char
    else if (char === "(" || char === "[" || char === "{") depth += 1
    else if (char === ")" || char === "]" || char === "}") depth -= 1
    else if (depth === 0 && text.startsWith(operator, i)) {
      parts.push(current.trim())
      current = ""
      i += operator.length - 1
      continue
    }
    current += char
  }
  parts.push(current.trim())
  return parts.filter(Boolean)
}
const splitArgs = text => splitTop(text, ",")
const unquote = value => value.replace(/^["'`]|["'`]$/g, "")

/** One atomic condition (no top-level && / ||). Returns text or null. */
function atom(code, ctx) {
  const s = stripParens(code)
  // !(x.f > 0)
  let m = s.match(/^!\(\s*([\w$]+)\.([\w$]+)\s*>\s*0\s*\)$/)
  if (m && FIELDS[m[2]]?.["not>0"]) return FIELDS[m[2]]["not>0"](roleOf(m[1], ctx))
  // !x.f
  m = s.match(/^!\s*([\w$]+)\.([\w$]+)$/)
  if (m && FIELDS[m[2]]?.not) return FIELDS[m[2]].not(roleOf(m[1], ctx))
  // !x
  m = s.match(/^!\s*([\w$]+)$/)
  if (m) return `${roleOf(m[1], ctx).nom} puuttuu`
  // x.f (set / true)
  m = s.match(/^([\w$]+)\.([\w$]+)$/)
  if (m && FIELDS[m[2]]?.truthy) return FIELDS[m[2]].truthy(roleOf(m[1], ctx))
  // x (exists)
  m = s.match(/^([\w$]+)$/)
  if (m && !/^(true|false|null|undefined)$/.test(m[1])) return `${roleOf(m[1], ctx).nom} on olemassa`
  // x.f > 0 / <= 0
  m = s.match(/^([\w$]+)\.([\w$]+)\s*(>|<=)\s*0$/)
  if (m && FIELDS[m[2]]?.[`${m[3]}0`]) return FIELDS[m[2]][`${m[3]}0`](roleOf(m[1], ctx))
  // x.f >= N
  m = s.match(/^([\w$]+)\.([\w$]+)\s*>=\s*(\d+)$/)
  if (m && FIELDS[m[2]]?.[">="]) return FIELDS[m[2]][">="](roleOf(m[1], ctx), m[3])
  // x.f === target.f
  m = s.match(/^([\w$]+)\.([\w$]+)\s*(===|!==)\s*target\.([\w$]+)$/)
  if (m && m[2] === m[4] && FIELDS[m[2]]?.[`${m[3]}target.${m[4]}`]) return FIELDS[m[2]][`${m[3]}target.${m[4]}`](roleOf(m[1], ctx))
  // x.f === "value"
  m = s.match(/^([\w$]+)\.([\w$]+)\s*(===|!==)\s*(["'`][^"'`]*["'`])$/)
  if (m && FIELDS[m[2]]?.[m[3]]) return FIELDS[m[2]][m[3]](roleOf(m[1], ctx), unquote(m[4]))
  // helper(args) / !helper(args)
  m = s.match(/^(!?)\s*([\w$]+)\((.*)\)$/)
  if (m && HELPERS[m[2]] && ctx.helpers?.has(m[2])) {
    const raw = splitArgs(m[3])
    const roles = raw.map(arg => roleOf(arg.replace(/\.pos$/, ""), ctx))
    const args = raw.map((arg, i) => (/^["'`]/.test(arg) ? arg : roles[i].nom))
    return m[1] ? HELPERS[m[2]].negated(args, roles) : HELPERS[m[2]].meaning(args, roles)
  }
  return null
}

/**
 * Plain Finnish for one verified condition.
 * ctx: { subject: find-parameter name or null, helpers: Set of verified helpers }
 * Returns { text, verified, reason }.
 */
export function translateCondition(code, ctx = {}) {
  const result = translateInner(code, ctx)
  return result.verified ? { ...result, text: cap(result.text) } : result
}

function translateInner(code, ctx) {
  const s = stripParens(code)
  const ors = splitTop(s, "||")
  if (ors.length > 1) {
    const parts = ors.map(part => translateInner(part, ctx))
    if (parts.every(p => p.verified)) return { text: `jokin näistä: ${parts.map(p => p.text).join("; ")}`, verified: true }
    return untranslated(code, parts)
  }
  const ands = splitTop(s, "&&")
  if (ands.length > 1) {
    const parts = ands.map(part => translateInner(part, ctx))
    if (parts.every(p => p.verified)) return { text: parts.map(p => p.text).join(" ja "), verified: true }
    return untranslated(code, parts)
  }
  const text = atom(s, ctx)
  return text ? { text, verified: true } : untranslated(code)
}

function untranslated(code, parts = []) {
  const unknownHelper = (code.match(/\b([\w$]+)\(/g) || []).map(call => call.slice(0, -1)).find(name => !HELPERS[name])
  const reason = unknownHelper
    ? `apufunktio ${unknownHelper}: sen merkitystä ei ole luettu ja vahvistettu`
    : parts.length ? "osaa ehdosta ei voitu kääntää" : "ehdon merkitystä ei voitu vahvistaa"
  return { text: null, verified: false, reason, code }
}

/** Known state changes in words (only with a verified helper). */
export function translateEffect(code, ctx = {}) {
  let m = code.match(/gainMana\(\s*state\s*,\s*([\w$.]+)\s*,\s*([^,]+?)\s*,/)
  if (m && ctx.helpers?.has("gainMana")) {
    return { text: `Yksikkö saa resurssia määrän ${m[2]} (resurssin yläraja rajoittaa lisäystä)`, verified: true }
  }
  m = code.match(/setUnit\(\s*[\w$]+\s*,\s*[\w$.]+\s*,\s*\{(.+)\}\s*\)/)
  if (m) {
    const words = { hp: "elämäpisteet", poison: "myrkkypinot", mana: "resurssi", ap: "toimintapisteet" }
    const fields = splitArgs(m[1]).map(pair => pair.split(":").map(x => x.trim()))
    if (fields.every(([key]) => words[key])) {
      return { text: `Asettaa yksikölle: ${fields.map(([key, value]) => `${words[key]} = ${value}`).join(", ")}`, verified: true }
    }
  }
  return { text: null, verified: false, reason: "tilamuutoksen merkitystä ei voitu vahvistaa", code }
}

/** `const x = Math.max(0, a.b - c)` style computations. */
export function translateComputation(code) {
  const m = code.match(/^(?:const|let)\s+([\w$]+)\s*=\s*Math\.max\(\s*0\s*,\s*([\w$]+)\.hp\s*-\s*([\w$]+)\s*\)$/)
  if (m) return { text: `${m[1]} = elämäpisteet miinus ${m[3]}, kuitenkin vähintään 0`, verified: true }
  return { text: null, verified: false, reason: "laskun merkitystä ei voitu vahvistaa", code }
}
