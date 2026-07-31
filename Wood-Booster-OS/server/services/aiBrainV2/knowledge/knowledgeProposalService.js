/*
=====================================
WOOD-BOOSTER AI BRAIN V2
KNOWLEDGE PROPOSAL SERVICE
SPACEMONKEY

Vastuut:
- vastaanottaa käyttäjän viestin
- suorittaa knowledge candidate extractorin
- suorittaa knowledge candidate validatorin
- muodostaa yhden selkeän proposal-tuloksen
- ei tallenna tietoa
- ei hyväksy tietoa automaattisesti
- ei muuta tietokantaa
=====================================
*/


import {
  extractKnowledgeCandidate,
} from "./knowledgeCandidateExtractor.js"


import {
  validateKnowledgeCandidate,
} from "./knowledgeCandidateValidator.js"


function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}


function createNoProposalResult({
  extraction,
}) {
  return {
    success:
      true,

    matched:
      false,

    proposalCreated:
      false,

    status:
      "no_proposal",

    message:
      "No explicit knowledge save request was detected.",

    proposal:
      null,

    errors:
      [],

    debug: {
      service:
        "knowledge-proposal-service",

      version:
        "mvp-1",

      extraction:
        extraction?.debug ||
        null,

      validation:
        null,
    },
  }
}


function createInvalidProposalResult({
  extraction,
  validation,
}) {
  return {
    success:
      false,

    matched:
      true,

    proposalCreated:
      false,

    status:
      "invalid_proposal",

    message:
      "Knowledge proposal did not pass validation.",

    proposal:
      null,

    errors:
      validation.errors,

    debug: {
      service:
        "knowledge-proposal-service",

      version:
        "mvp-1",

      extraction:
        extraction.debug,

      validation:
        validation.debug,
    },
  }
}


function createValidProposalResult({
  extraction,
  validation,
}) {
  const candidate =
    validation.candidate

  const proposal = {
    type:
      candidate.type,

    category:
      candidate.category,

    key:
      candidate.key,

    content:
      candidate.content,

    source:
      candidate.source,

    status:
      "pending_approval",

    requiresApproval:
      true,

    confidence:
      candidate.confidence,

    metadata: {
      ...candidate.metadata,

      proposalServiceVersion:
        "mvp-1",
    },
  }

  return {
    success:
      true,

    matched:
      true,

    proposalCreated:
      true,

    status:
      "pending_approval",

    message:
      "Knowledge proposal is ready for user approval.",

    proposal,

    errors:
      [],

    debug: {
      service:
        "knowledge-proposal-service",

      version:
        "mvp-1",

      extraction:
        extraction.debug,

      validation:
        validation.debug,
    },
  }
}


function createKnowledgeProposal({
  message,
  source = "chat",
} = {}) {
  const normalizedMessage =
    normalizeText(message)

  const extraction =
    extractKnowledgeCandidate({
      message:
        normalizedMessage,

      source,
    })

  if (
    extraction.matched !==
    true
  ) {
    return createNoProposalResult({
      extraction,
    })
  }

  const validation =
    validateKnowledgeCandidate({
      candidate:
        extraction.candidate,
    })

  if (
    validation.valid !== true ||
    validation.canProceed !==
      true
  ) {
    return createInvalidProposalResult({
      extraction,
      validation,
    })
  }

  return createValidProposalResult({
    extraction,
    validation,
  })
}


export {
  createKnowledgeProposal,
}
