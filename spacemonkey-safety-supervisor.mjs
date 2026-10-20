/**
 * Hearthwood Spacemonkey — Autopilot Safety Supervisor V3.2
 * A FINAL, READ-ONLY pre-display audit. It NEVER authorizes edits or execution.
 * Evidence correctness is NOT semantic correctness: interpretationVerified=false.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const MAX_FILES = 6
const MAX_BYTES = 512000
const shaPattern = /^[a-f0-9]{64}$/
const FILE_PATTERNS = [
  /^src\/data\/heartwood\/.+\.(?:js|jsx|ts|tsx)$/,
  /^src\/services\/heartwood\/.+\.(?:js|jsx|ts|tsx)$/,
  /^src\/components\/heartwood\/.+\.(?:js|jsx|ts|tsx)$/,
  /^src\/components\/hearthwood-studio\/.+\.(?:js|jsx|ts|tsx)$/,
  /^src\/pages\/(?:Heartwood|Hearthwood)[\w-]*\.jsx$/,
  /^server\/services\/(?:heartwood|hearthwood)\/.+\.(?:js|ts)$/,
  /^server\/routes\/hearthwood[\w-]*\.js$/,
]

function safePath(p) {
  return typeof p === 'string' && p.length > 0 && p.length <= 500 &&
    !p.includes('\0') && !p.includes('\\') && !path.posix.isAbsolute(p) &&
    p === path.posix.normalize(p) && !p.split('/').includes('..') &&
    FILE_PATTERNS.some(re => re.test(p))
}

function inside(root, target) {
  const rel = path.relative(root, target)
  return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel)
}

async function checkModify(root, record) {
  const absolute = path.resolve(root, record.filePath)
  if (!inside(root, absolute)) throw Error('OUTSIDE_PROJECT')
  const real = await fs.realpath(absolute)
  if (!inside(root, real)) throw Error('SYMLINK_ESCAPE')
  const stat = await fs.stat(real)
  if (!stat.isFile() || stat.size > MAX_BYTES) throw Error('INVALID_SIZE_OR_TYPE')
  const content = await fs.readFile(real)
  const hash = createHash('sha256').update(content).digest('hex')
  if (hash !== record.sha256) throw Error('SOURCE_CHANGED')
  return hash
}

async function checkCreate(root, filePath) {
  const absolute = path.resolve(root, filePath)
  if (!inside(root, absolute)) throw Error('OUTSIDE_PROJECT')
  const parent = await fs.realpath(path.dirname(absolute))
  if (!inside(root, parent)) throw Error('PARENT_SYMLINK_ESCAPE')
  try {
    await fs.lstat(absolute)
    throw Error('CREATE_TARGET_EXISTS')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

/**
 * Inputs are output objects from existing Plan Gate, Source Truth Guard,
 * and Verified Planning Loop — never take AI text as authority.
 */
export async function auditHearthwoodAutopilotSafety({
  plan, reliability, sourceTruth, gameRoot,
} = {}) {
  const issues = []
  const warnings = []
  const checked = []
  const fail = (code, filePath) => issues.push({ code, ...(filePath ? { filePath } : {}) })

  if (!plan || plan.success !== true || !Array.isArray(plan.files) ||
      plan.files.length === 0 || plan.files.length > MAX_FILES) {
    fail('INVALID_PLAN_SIZE')
  }
  if (reliability?.decision !== 'CAUTION' || reliability.sourceIntegrity !== 'verified' ||
      !Array.isArray(reliability.issues) || reliability.issues.length !== 0) {
    fail('PLAN_GATE_UNVERIFIED')
  }
  if (sourceTruth?.decision !== 'CAUTION' || sourceTruth.codeQuotationsVerified !== true ||
      !Array.isArray(sourceTruth.checkedQuotes) || sourceTruth.checkedQuotes.length === 0 ||
      !Array.isArray(sourceTruth.issues) || sourceTruth.issues.length !== 0) {
    fail('QUOTATIONS_UNVERIFIED')
  }
  if (plan?.executionApproved === true || reliability?.executionApproved === true ||
      sourceTruth?.executionApproved === true) {
    fail('UNEXPECTED_EXECUTION_APPROVAL')
  }

  const files = Array.isArray(plan?.files) ? plan.files.slice(0, MAX_FILES) : []
  const verifiedFiles = new Map()
  for (const item of Array.isArray(reliability?.checkedFiles) ? reliability.checkedFiles : []) {
    if (safePath(item?.filePath) && !verifiedFiles.has(item.filePath)) verifiedFiles.set(item.filePath, item)
  }
  const verifiedEvidence = new Set()
  for (const item of Array.isArray(reliability?.checkedEvidence) ? reliability.checkedEvidence : []) {
    if (safePath(item?.filePath) && shaPattern.test(item?.sha256 || '')) {
      verifiedEvidence.add(`${item.filePath}:${item.sha256}`)
    }
  }
  if (!verifiedEvidence.size) fail('NO_CHECKED_EVIDENCE')
  for (const quote of Array.isArray(sourceTruth?.checkedQuotes) ? sourceTruth.checkedQuotes : []) {
    if (!safePath(quote?.filePath) || !shaPattern.test(quote?.sha256 || '') ||
        !verifiedEvidence.has(`${quote.filePath}:${quote.sha256}`)) {
      fail('QUOTE_SOURCE_NOT_IN_EVIDENCE', quote?.filePath)
    }
  }

  let root = null
  try {
    if (typeof gameRoot !== 'string' || !gameRoot) throw Error('no root')
    root = await fs.realpath(gameRoot)
    if (!reliability?.projectRoot || (await fs.realpath(reliability.projectRoot)) !== root) {
      throw Error('inconsistent project root')
    }
  } catch { fail('PROJECT_ROOT_MISMATCH') }

  const seen = new Set()
  const inspected = new Map(
    (Array.isArray(plan?.inspectedFiles) ? plan.inspectedFiles : [])
      .filter(x => typeof x?.filePath === 'string')
      .map(x => [x.filePath, x]),
  )
  for (const file of files) {
    const filePath = file?.filePath
    if (!safePath(filePath)) { fail('INVALID_FILE_PATH', filePath); continue }
    if (seen.has(filePath)) { fail('DUPLICATE_FILE', filePath); continue }
    seen.add(filePath)
    if (!['modify', 'create'].includes(file.action)) { fail('INVALID_ACTION', filePath); continue }
    const verified = verifiedFiles.get(filePath)
    if (!verified || verified.action !== file.action) { fail('FILE_NOT_VERIFIED', filePath); continue }
    if (file.action === 'modify') {
      if (!inspected.has(filePath)) { fail('FILE_NOT_INSPECTED', filePath); continue }
      if (inspected.get(filePath).truncated) warnings.push({ code: 'PARTIAL_SOURCE_CONTEXT', filePath })
      if (!shaPattern.test(verified.sha256 || '')) { fail('INVALID_SOURCE_HASH', filePath); continue }
    }
    if (!root) continue
    try {
      if (file.action === 'modify') {
        const sha256 = await checkModify(root, verified)
        checked.push({ action: file.action, filePath, sha256 })
      } else {
        await checkCreate(root, filePath)
        checked.push({ action: file.action, filePath })
      }
    } catch { fail('FILE_CHANGED_OR_UNSAFE', filePath) }
  }
  const passed = issues.length === 0
  return {
    decision: passed ? 'CAUTION' : 'BLOCK',
    allowedToDisplay: passed,
    executionApproved: false,
    interpretationVerified: false,
    readyForCodeChanges: false, // Future edit engine needs separate full-file and test approvals.
    fullContextVerified: passed && warnings.length === 0,
    checkedFiles: checked,
    warnings,
    issues,
    message: passed
      ? 'Lähteet ovat ajantasaiset. Ehdotus voidaan näyttää, mutta tulkintaa tai toteutusta ei ole hyväksytty.'
      : 'Turvatarkistus epäonnistui. Älä näytä suunnitelmaa hyväksyttävänä.',
  }
}
