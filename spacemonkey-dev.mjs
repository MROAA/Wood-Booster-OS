#!/usr/bin/env node
/**
 * Spacemonkey Dev Autopilot — MVP 1
 * Offline CLI for project checks, local planning and provenance auditing.
 * Never edits Hearthwood source code or executes an AI-generated plan.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import net from 'node:net'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const devRoot = path.dirname(fileURLToPath(import.meta.url))
const gameRoot = path.resolve(
  process.env.HEARTHWOOD_PROJECT_ROOT ||
    path.join(devRoot, '..', 'Wood-Booster-OS-spacemonkey-gameplay'),
)
const reportDir = path.join(os.homedir(), '.local', 'state', 'spacemonkey', 'reports')
const sampleFile = 'src/services/heartwood/tacticsMana.js'
const symbol = 'classResourceId'

// The existing services resolve the root when imported. Set it first.
process.env.HEARTHWOOD_PROJECT_ROOT = gameRoot

function servicePath(name) {
  return path.join(devRoot, 'server', 'services', name)
}
async function loadService(name) {
  return import(pathToFileURL(servicePath(name)).href)
}
async function exists(file) {
  try { await fs.access(file); return true } catch { return false }
}
async function saveReport(kind, data) {
  await fs.mkdir(reportDir, { recursive: true, mode: 0o700 })
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const token = createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 8)
  const destination = path.join(reportDir, `${now}-${kind}-${token}.json`)
  await fs.writeFile(destination, JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' })
  return destination
}
async function portOpen(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port })
    let done = false
    const finish = value => {
      if (done) return
      done = true
      socket.destroy()
      resolve(value)
    }
    socket.setTimeout(800)
    socket.on('connect', () => finish(true))
    socket.on('error', () => finish(false))
    socket.on('timeout', () => finish(false))
  })
}
function line(label, value) { console.log(`${label}: ${value}`) }

async function doctor() {
  console.log('\nSPACEMONKEY — YMPÄRISTÖN TARKISTUS\n')
  line('Kehitysprojekti', devRoot)
  line('Hearthwood-projekti', gameRoot)
  const required = [
    servicePath('hearthwoodReliabilityGate.js'),
    servicePath('hearthwoodPlanReliabilityGate.js'),
    servicePath('hearthwoodSourceTruthGuard.js'),
    servicePath('hearthwoodChangePlanGenerator.js'),
    path.join(devRoot, 'server', 'routes', 'hearthwoodDevStudio.js'),
    path.join(gameRoot, sampleFile),
  ]
  let complete = true
  for (const file of required) {
    const present = await exists(file)
    console.log(`  ${present ? 'OK' : 'PUUTTUU'} ${path.relative(devRoot, file)}`)
    if (!present) complete = false
  }
  line('Ollama localhost:11434', (await portOpen(11434)) ? 'käynnissä' : 'ei vastaa')
  line('Backend localhost:3002', (await portOpen(3002)) ? 'käynnissä' : 'ei vastaa (ei pakollinen CLI:lle)')
  console.log('\nTämä työkalu ei muuta pelin lähdekoodia.')
  if (!complete) process.exitCode = 1
  return complete
}

function testCase(name, passed, detail = '') {
  return { name, passed: Boolean(passed), ...(detail ? { detail } : {}) }
}

async function verify() {
  console.log('\nSPACEMONKEY — AUTOMAATTISET LUOTETTAVUUSTESTIT\n')
  const tests = []
  async function check(name, fn) {
    try {
      const result = await fn()
      const item = testCase(name, result.pass, result.detail)
      tests.push(item)
      console.log(`${item.passed ? 'OK' : 'VIRHE'} ${name}${item.detail ? ` — ${item.detail}` : ''}`)
    } catch (error) {
      tests.push(testCase(name, false, error.message))
      console.log(`VIRHE ${name} — ${error.message}`)
    }
  }
  const { auditHearthwoodAnalysis } = await loadService('hearthwoodReliabilityGate.js')
  const { auditHearthwoodChangePlan } = await loadService('hearthwoodPlanReliabilityGate.js')
  const { auditHearthwoodPlanCodeQuotes } = await loadService('hearthwoodSourceTruthGuard.js')
  const source = 'export function classResourceId(classId) {'
  const analysis = (snippet, filePath = sampleFile) => ({
    success: true, answer: 'Lähdekoodiviite tarkistettavaksi.',
    verifiedSources: [{ symbol, filePath, source: snippet }],
  })
  const plan = (overrides = {}) => ({
    success: true,
    explanation: symbol,
    files: [{ action: 'modify', filePath: sampleFile }],
    inspectedFiles: [{ filePath: sampleFile }],
    evidence: { references: [{ filePath: sampleFile, symbol }] },
    ...overrides,
  })

  await check('Code Gate: oikea määritelmä', async () => {
    const r = await auditHearthwoodAnalysis(analysis(source))
    return { pass: r.decision === 'CAUTION' && r.sourceIntegrity === 'verified' && r.interpretationVerified === false, detail: r.decision }
  })
  await check('Code Gate: keksitty sisältö estyy', async () => {
    const r = await auditHearthwoodAnalysis(analysis('export function classResourceId(classId) { return "unicorn" }'))
    return { pass: r.decision === 'BLOCK' && r.issues.some(x => x.code === 'SOURCE_MISMATCH'), detail: r.decision }
  })
  await check('Code Gate: pelkkä kutsu estyy', async () => {
    const r = await auditHearthwoodAnalysis(analysis('return u.classId ? classResourceId(u.classId) : "arcane"'))
    return { pass: r.decision === 'BLOCK', detail: r.decision }
  })
  await check('Code Gate: polun ylitys estyy', async () => {
    const r = await auditHearthwoodAnalysis(analysis(source, '../secrets.js'))
    return { pass: r.decision === 'BLOCK', detail: r.decision }
  })
  await check('Code Gate: lähteetön analyysi estyy', async () => {
    const r = await auditHearthwoodAnalysis({ success: true, answer: 'Ei lähteitä.' })
    return { pass: r.decision === 'BLOCK', detail: r.decision }
  })
  await check('Plan Gate: oikea lähde', async () => {
    const r = await auditHearthwoodChangePlan(plan())
    return { pass: r.decision === 'CAUTION' && r.executionApproved === false && r.checkedFiles.length === 1, detail: r.decision }
  })
  await check('Plan Gate: olematon symboli estyy', async () => {
    const fake = 'keksittyFunktio12345'
    const r = await auditHearthwoodChangePlan(plan({
      explanation: fake,
      evidence: { references: [{ filePath: sampleFile, symbol: fake }] },
    }))
    return { pass: r.decision === 'BLOCK' && r.issues.some(x => x.code === 'EVIDENCE_MISMATCH'), detail: r.decision }
  })
  await check('Plan Gate: lukematon tiedosto estyy', async () => {
    const r = await auditHearthwoodChangePlan(plan({ inspectedFiles: [] }))
    return { pass: r.decision === 'BLOCK', detail: r.decision }
  })
  await check('Plan Gate: polun ylitys estyy', async () => {
    const r = await auditHearthwoodChangePlan(plan({
      files: [{ action: 'modify', filePath: '../outside.js' }],
    }))
    return { pass: r.decision === 'BLOCK', detail: r.decision }
  })

  await check('Source Truth: oikea koodilainaus', async () => {
    const reliability = await auditHearthwoodChangePlan(plan())
    const r = await auditHearthwoodPlanCodeQuotes({
      explanation: 'Todiste lähdekoodista:\n```js\nexport function classResourceId(classId) {\n```',
      reliability,
    })
    return { pass: r.decision === 'CAUTION' && r.codeQuotationsVerified === true && r.executionApproved === false, detail: r.decision }
  })
  await check('Source Truth: keksitty koodilainaus estyy', async () => {
    const reliability = await auditHearthwoodChangePlan(plan())
    const r = await auditHearthwoodPlanCodeQuotes({
      explanation: 'Todiste lähdekoodista:\n```js\nfunction classResourceId(classId) {\n  return classId;\n}\n```',
      reliability,
    })
    return { pass: r.decision === 'BLOCK' && r.issues.some(x => x.code === 'FABRICATED_SOURCE_QUOTE'), detail: r.decision }
  })

  await check('API: kaikkien kolmen tarkistimen kytkennät löytyvät', async () => {
    const route = await fs.readFile(path.join(devRoot, 'server', 'routes', 'hearthwoodDevStudio.js'), 'utf8')
    const present = route.includes('auditHearthwoodAnalysis(') && route.includes('auditHearthwoodChangePlan(') && route.includes('auditHearthwoodPlanCodeQuotes(')
    return { pass: present, detail: present ? 'staattinen tarkistus, ei HTTP-integraatiotesti' : 'kytkentä puuttuu' }
  })

  const passed = tests.filter(test => test.passed).length
  const report = { type: 'verification', timestamp: new Date().toISOString(), gameRoot, total: tests.length, passed, tests }
  const destination = await saveReport('verify', report)
  console.log(`\nTulokset: ${passed}/${tests.length} läpäisty`)
  line('Raportti', destination)
  if (passed !== tests.length) process.exitCode = 1
  return passed === tests.length
}

async function createPlan(prompt) {
  // Fail closed if manually pointed to main game checkout or Claude's tree.
  const expected = await fs.realpath(path.join(devRoot, '..', 'Wood-Booster-OS-spacemonkey-gameplay'))
  const actual = await fs.realpath(gameRoot)
  if (expected !== actual) throw new Error('EI TURVALLINEN TYÖPUU: vain Spacemonkeyn eristetty peliprojekti sallitaan.')
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Anna kehitystehtävä lainausmerkeissä, esimerkiksi: run "Paranna manasysteemiä"')
  }
  if (prompt.length > 3000) throw new Error('Tehtävä on liian pitkä (enintään 3000 merkkiä).')
  console.log('\nSPACEMONKEY — PAIKALLINEN KEHITYSSUUNNITTELU\n')
  line('Tehtävä', prompt)
  line('Tila', 'vain luku; AI ei suorita tiedostomuutoksia')

  const { generateHearthwoodChangePlan } = await loadService('hearthwoodChangePlanGenerator.js')
  const { auditHearthwoodChangePlan } = await loadService('hearthwoodPlanReliabilityGate.js')
  const { auditHearthwoodPlanCodeQuotes } = await loadService('hearthwoodSourceTruthGuard.js')
  const { runVerifiedPlanningLoop } = await import('./spacemonkey-verified-planner.mjs')

  const result = await runVerifiedPlanningLoop({
    prompt,
    gameRoot,
    generatePlan: generateHearthwoodChangePlan,
    auditPlan: auditHearthwoodChangePlan,
    auditQuotes: auditHearthwoodPlanCodeQuotes,
  })
  // Report a zero-file review candidate separately. No normal Plan Gate
  // or Safety Supervisor result is forged for an AI interpretation.
  if (result.reviewOnly && result.plan?.files?.length === 0) {
    const destination = await saveReport('review', {
      type: 'development-review', timestamp: new Date().toISOString(),
      prompt, gameRoot, ...result,
      executionApproved: false, verifiedConclusion: false,
    })
    line('Spacemonkeyn alustava arvio', result.plan.proposedDecision)
    line('Varmennustila', 'EI VAHVISTETTU; ihmisen tarkistus ja pelitestit vaaditaan')
    line('Raportti', destination)
    console.log(String(result.plan.explanation).slice(0, 800))
    console.log('\nHyväksyntä: EI. Tiedostomuutokset: 0.')
    return
  }
  const { auditHearthwoodAutopilotSafety } = await import('./spacemonkey-safety-supervisor.mjs')
  const safety = await auditHearthwoodAutopilotSafety({
    plan: result.plan, reliability: result.reliability,
    sourceTruth: result.sourceTruth, gameRoot,
  })
  const destination = await saveReport('plan', {
    type: 'development-plan', timestamp: new Date().toISOString(),
    prompt, gameRoot, ...result, safety,
  })
  line('Reliability Gate', result.reliability?.decision || 'NO_RESULT')
  line('Source Truth Guard', result.sourceTruth?.decision || 'NO_RESULT')
  line('Safety Supervisor', safety.decision)
  line('Yrityksiä', result.attempts.length)
  line('Raportti', destination)

  if (!result.allowedToDisplay || safety.decision !== 'CAUTION' || !safety.allowedToDisplay) {
    console.error('\nSUUNNITELMA ESTETTY: automaattinen korjaus ei pystynyt vahvistamaan lähteitä.')
    console.error(JSON.stringify({ attempts: result.attempts, safety: safety.issues }, null, 2))
    process.exitCode = 1
    return
  }

  if (safety.warnings.length) console.warn('Osittainen lähdekonteksti:', JSON.stringify(safety.warnings))
  console.log('\nEHDOTETUT TIEDOSTOT (ei muokattu):')
  for (const file of result.plan?.files || []) {
    console.log(`- ${file.action}: ${file.filePath}${file.reason ? ` — ${String(file.reason).slice(0, 160)}` : ''}`)
  }
  console.log('\nPERUSTELU (AI:n tulkinta, ei automaattisesti todistettu):')
  console.log(String(result.plan?.explanation || '').slice(0, 3500))
  console.log('\nHyväksyntä: EI. Tiedostomuutokset: 0.')
}

function help() {
  console.log(`
SPACEMONKEY DEV AUTOPILOT — MVP 1

Komennot (suorita kehitysprojektin juuressa):
  node spacemonkey-dev.mjs doctor
  node spacemonkey-dev.mjs verify
  node spacemonkey-dev.mjs plan "Kehitä Hearthwoodin manasysteemiä"
  node spacemonkey-dev.mjs run  "Kehitä Hearthwoodin manasysteemiä"

run = suorita luotettavuustestit, laadi suunnitelma paikallisella
Ollamalla ja tarkista suunnitelman lähteet. Ei kirjoita peliin.
Raportit: ~/.local/state/spacemonkey/reports/
`)
}

try {
  const command = process.argv[2] || 'help'
  const prompt = process.argv.slice(3).join(' ')
  if (command === 'doctor') await doctor()
  else if (command === 'verify') await verify()
  else if (command === 'plan') await createPlan(prompt)
  else if (command === 'run') {
    const healthy = await doctor()
    if (healthy && await verify()) await createPlan(prompt)
    else { console.error('\nKehityssuunnittelu estetty: tarkistukset eivät läpäisseet.'); process.exitCode = 1 }
  }
  else help()
} catch (error) {
  console.error(`\nAUTOPILOT KESKEYTETTY: ${error.message}`)
  console.error('Peliprojektin tiedostoja ei muutettu.')
  process.exitCode = 1
}
