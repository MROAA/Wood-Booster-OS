/**
 * Hearthwood decision triage V4.3 — advisory only.
 * A model's decision is NEVER proof that existing mechanics are implemented.
 * Zero-file responses may be shown only as unverified human-review candidates.
 */
export const REVIEW_DECISIONS = Object.freeze([
  'NO_CHANGE_NEEDED',
  'INSUFFICIENT_EVIDENCE',
])

export function parseHearthwoodPlanningDecision(raw) {
  if (typeof raw !== 'string' || raw.length > 24000) return null
  const lines = raw.split(/\r?\n/)
  const headings = lines.filter(line => /^PÄÄTÖS\s*:/i.test(line.trim()))
  if (headings.length !== 1) return null
  const match = headings[0].trim().match(/^PÄÄTÖS\s*:\s*(CHANGE_REQUIRED|NO_CHANGE_NEEDED|INSUFFICIENT_EVIDENCE)\s*$/i)
  return match ? match[1].toUpperCase() : null
}

export function isHearthwoodReviewCandidate(plan) {
  return !!plan && plan.status === 'human_review_required' &&
    REVIEW_DECISIONS.includes(plan.proposedDecision) &&
    Array.isArray(plan.files) && plan.files.length === 0 &&
    plan.executionApproved === false && plan.interpretationVerified === false
}

/** Never echo unscreened model prose or claim that a mechanic was proved. */
export function hearthwoodReviewSummary(proposedDecision) {
  if (proposedDecision === 'NO_CHANGE_NEEDED') {
    return 'AI epäilee, että pyydetty ominaisuus voi jo olla olemassa. TOTEUTUSTA EI OLE VAHVISTETTU. Tarkista koko toimintaketju ja riippumaton pelitesti ennen päätöstä. Tiedostomuutoksia ei ehdoteta.'
  }
  return 'Lähdekoodia tai toimintatestejä ei ole riittävästi perustellun muutospäätöksen tekemiseen. Selvitä puuttuvat tiedot. Tiedostomuutoksia ei ehdoteta.'
}

/** Structured, bounded, never execution-approved even with genuine symbols. */
export function createHearthwoodReviewCandidate({ proposedDecision, codeFiles, evidence, matchedFiles = [] }) {
  if (!REVIEW_DECISIONS.includes(proposedDecision)) throw new Error('Tuntematon arviointipäätös')
  if (!Array.isArray(codeFiles) || !codeFiles.length) throw new Error('Lähdetiedostot puuttuvat')
  if (proposedDecision === 'NO_CHANGE_NEEDED' &&
      (!evidence?.valid || !Array.isArray(evidence.references) || !evidence.references.length)) {
    throw new Error('Ei muutostarvetta -väite edellyttää ainakin yhtä todellista lähdesymbolia')
  }
  return {
    success: true,
    project: 'hearthwood',
    status: 'human_review_required',
    proposedDecision,
    explanation: hearthwoodReviewSummary(proposedDecision),
    files: [],
    matchedFiles: matchedFiles.slice(0, 30),
    inspectedFiles: codeFiles.map(f => ({ filePath: f.filePath, truncated: !!f.truncated })),
    evidence: {
      valid: !!evidence?.valid,
      references: Array.isArray(evidence?.references) ? evidence.references : [],
      warning: 'Viittauksen olemassaolo ei todista AI:n johtopäätöstä.',
    },
    interpretationVerified: false,
    executionApproved: false,
    reviewRequired: true,
    verificationStatus: 'UNVERIFIED',
    nextAction: proposedDecision === 'NO_CHANGE_NEEDED' ?
      'Todennettava koko mekaniikan toimintaketju ja suoritettava testit.' :
      'Lähdekoodin lisätutkimus ennen muutospäätöstä.',
  }
}
