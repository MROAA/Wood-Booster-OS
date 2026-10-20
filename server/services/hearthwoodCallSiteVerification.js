/**
 * Hearthwood Source Intelligence: deterministic, read-only local call-site evidence.
 * This inspects ONLY files whose function definitions were already verified.
 * It does not make project-wide absence claims or execute source code.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const MAX_BYTES = 512 * 1024
const MAX_DEFINITIONS = 3
const MAX_MATCHES = 25
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

export function isHearthwoodCallSiteQuestion(question) {
  return /kutsu|käyttökoht|käytetä|käytetään|käyttö|caller|calling|call\s+sites?|usage|used\s+by/i.test(String(question || ''))
}

function maskNonCode(source) {
  let result = ''
  let mode = 'code'
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    const next = source[i + 1]
    if (mode === 'line') {
      if (char === '\n') { mode = 'code'; result += '\n' } else result += ' '
    } else if (mode === 'block') {
      if (char === '*' && next === '/') { result += '  '; i++; mode = 'code' }
      else result += char === '\n' ? '\n' : ' '
    } else if (mode !== 'code') {
      if (char === '\\') { result += ' '; if (i + 1 < source.length) { result += source[++i] === '\n' ? '\n' : ' ' } }
      else if (char === mode) { result += ' '; mode = 'code' }
      else result += char === '\n' ? '\n' : ' '
    } else if (char === '/' && next === '/') { result += '  '; i++; mode = 'line' }
    else if (char === '/' && next === '*') { result += '  '; i++; mode = 'block' }
    else if (char === '"' || char === "'" || char === '`') { result += ' '; mode = char }
    else result += char
  }
  return result
}

function functionRanges(masked) {
  const ranges = []
  const re = /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g
  let match
  while ((match = re.exec(masked))) {
    // This is deliberately conservative: arrow functions are not classified.
    const opening = masked.indexOf('{', re.lastIndex)
    if (opening === -1) continue
    let depth = 0
    let closing = -1
    for (let i = opening; i < masked.length; i++) {
      if (masked[i] === '{') depth++
      if (masked[i] === '}' && --depth === 0) { closing = i; break }
    }
    if (closing !== -1) ranges.push({ name: match[1], start: match.index, opening, closing })
  }
  return ranges
}

export function findVerifiedCallsInSource(source, symbol, filePath) {
  if (typeof source !== 'string' || !IDENTIFIER.test(symbol)) return []
  const masked = maskNonCode(source)
  const ranges = functionRanges(masked)
  const definitions = ranges.filter(item => item.name === symbol)
  const regexp = new RegExp(`\\b${symbol}\\s*\\(`, 'g')
  const calls = []
  let match
  while ((match = regexp.exec(masked)) && calls.length < MAX_MATCHES) {
    if (definitions.some(item => item.start <= match.index && match.index < item.opening)) continue
    const containing = ranges
      .filter(item => item.opening < match.index && match.index < item.closing)
      .sort((a, b) => b.opening - a.opening)[0]
    const line = source.slice(0, match.index).split('\n').length
    const sourceLine = source.split('\n')[line - 1].trim().slice(0, 240)
    calls.push({ symbol, filePath, line, caller: containing?.name ?? null, sourceLine })
  }
  return calls
}

function safeRelative(filePath) {
  if (typeof filePath !== 'string' || filePath.includes('\\') || filePath.includes('\0')) return false
  if (!filePath.startsWith('src/') || !/\.(?:js|jsx|ts|tsx)$/.test(filePath)) return false
  const parts = filePath.split('/')
  return !parts.some(part => part === '..' || part === '.' || part === '')
}

export async function verifyHearthwoodCallSites(verifiedSources, projectRoot = process.env.HEARTHWOOD_PROJECT_ROOT) {
  const report = { status: 'NOT_CHECKED', scope: 'verified-function-files-only', completeProjectScan: false, inspectedFiles: [], matches: [], limitations: [] }
  if (!projectRoot || !path.isAbsolute(projectRoot)) {
    report.limitations.push('Projektin absoluuttinen juuripolku puuttuu.')
    return report
  }
  let root
  try { root = await fs.realpath(projectRoot) } catch {
    report.limitations.push('Projektin juuripolkua ei löytynyt.')
    return report
  }
  const seen = new Set()
  for (const entry of (Array.isArray(verifiedSources) ? verifiedSources : []).slice(0, MAX_DEFINITIONS)) {
    if (!entry || !IDENTIFIER.test(entry.symbol || '') || !safeRelative(entry.filePath)) {
      report.limitations.push('Virheellinen tarkistettu symboli tai tiedostopolku.')
      continue
    }
    const key = `${entry.filePath}:${entry.symbol}`
    if (seen.has(key)) continue
    seen.add(key)
    const target = path.resolve(root, entry.filePath)
    try {
      const actual = await fs.realpath(target)
      if (!actual.startsWith(root + path.sep)) throw new Error('Path escapes project root')
      const stat = await fs.stat(actual)
      if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error('Source file missing or too large')
      const data = await fs.readFile(actual, 'utf8')
      const sha256 = createHash('sha256').update(data).digest('hex')
      report.inspectedFiles.push({ filePath: entry.filePath, sha256 })
      for (const call of findVerifiedCallsInSource(data, entry.symbol, entry.filePath)) {
        report.matches.push({ ...call, sha256 })
      }
    } catch {
      report.limitations.push(`Tiedoston ${entry.filePath} turvallinen luku epäonnistui.`)
    }
  }
  report.status = report.matches.length ? 'VERIFIED_MATCHES' : 'NOT_FOUND_IN_SCOPE'
  if (!report.inspectedFiles.length) report.status = 'NOT_CHECKED'
  report.limitations.push('Vain todennettujen funktioiden omat lähdetiedostot tarkistettiin; muualla olevia kutsuja ei ole suljettu pois.')
  report.limitations.push('Etsin tunnisteen suoria kutsuja, en dynaamisia viittauksia tai kaikkia kutsuketjuja.')
  return report
}

export function formatVerifiedCallSiteAnswer(report) {
  if (!report.matches.length) return [
    '**Mitä lähdekoodista selviää**',
    'Tutkituista tiedostoista ei löytynyt vahvistettua suoraa kutsukohtaa.',
    '',
    '**Mikä jäi epävarmaksi**',
    'Tämä ei osoita, ettei funktiota käytettäisi. Kaikkia tiedostoja ja dynaamisia kutsuja ei tarkistettu.',
  ].join('\n')
  const lines = report.matches.slice(0, 10).map(call =>
    `- ${call.caller ? `Funktio **${call.caller}**` : 'Kutsuvaa funktiota ei voitu varmistaa'}: ${call.filePath}, rivi ${call.line}. Lähderivi: ${call.sourceLine}`,
  )
  return [
    '**Mitä lähdekoodista selviää**',
    ...lines,
    '',
    '**Mikä jäi epävarmaksi**',
    'Vain vahvistettujen funktioiden lähdetiedostot tutkittiin. Muita käyttökohteita voi olla muualla.',
  ].join('\n')
}
