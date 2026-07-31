/*
=====================================
WOOD-BOOSTER AI BRAIN V2
KNOWLEDGE PIPELINE

Vastuut:
- vastaanottaa käyttäjän viestin
- muodostaa knowledge proposalin
- validoi proposalin proposal servicen kautta
- tallentaa hyväksyntää odottavan proposalin
- palauttaa yhden yhtenäisen pipeline-tuloksen
- ei hyväksy tietoa automaattisesti
- ei kirjoita Memory-tauluun
=====================================
*/


import {
  createKnowledgeProposal,
} from "./knowledgeProposalService.js"


import {
  storeKnowledgeProposal,
} from "./knowledgeProposalStore.js"


function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}


function createSkippedResult({
  proposalResult,
}) {
  return {
    success:
      true,

    matched:
      false,

    stored:
      false,

    status:
      "skipped",

    message:
      "Message did not contain an explicit knowledge save request.",

    proposal:
      null,

    proposalRecord:
      null,

    errors:
      [],

    debug: {
      pipeline:
        "knowledge-pipeline",

      version:
        "mvp-1",

      proposalService:
        proposalResult?.debug ||
        null,

      proposalStore:
        null,
    },
  }
}


function createProposalFailureResult({
  proposalResult,
}) {
  return {
    success:
      false,

    matched:
      proposalResult?.matched ===
      true,

    stored:
      false,

    status:
      "proposal_failed",

    message:
      proposalResult?.message ||
      "Knowledge proposal could not be created.",

    proposal:
      null,

    proposalRecord:
      null,

    errors:
      Array.isArray(
        proposalResult?.errors,
      )
        ? proposalResult.errors
        : [],

    debug: {
      pipeline:
        "knowledge-pipeline",

      version:
        "mvp-1",

      proposalService:
        proposalResult?.debug ||
        null,

      proposalStore:
        null,
    },
  }
}


function createStoreFailureResult({
  proposalResult,
  storeResult,
}) {
  return {
    success:
      false,

    matched:
      true,

    stored:
      false,

    status:
      "store_failed",

    message:
      storeResult?.message ||
      "Knowledge proposal could not be stored.",

    proposal:
      proposalResult.proposal,

    proposalRecord:
      null,

    errors:
      Array.isArray(
        storeResult?.errors,
      )
        ? storeResult.errors
        : [],

    debug: {
      pipeline:
        "knowledge-pipeline",

      version:
        "mvp-1",

      proposalService:
        proposalResult.debug,

      proposalStore:
        storeResult?.debug ||
        null,
    },
  }
}


function createStoredResult({
  proposalResult,
  storeResult,
}) {
  return {
    success:
      true,

    matched:
      true,

    stored:
      true,

    status:
      "pending_approval",

    message:
      "Knowledge proposal was created and stored for approval.",

    proposal:
      proposalResult.proposal,

    proposalRecord:
      storeResult.proposalRecord,

    errors:
      [],

    debug: {
      pipeline:
        "knowledge-pipeline",

      version:
        "mvp-1",

      proposalService:
        proposalResult.debug,

      proposalStore:
        storeResult.debug,
    },
  }
}


async function runKnowledgePipeline({
  prisma,
  message,
  source = "chat",
} = {}) {
  const normalizedMessage =
    normalizeText(message)

  const proposalResult =
    createKnowledgeProposal({
      message:
        normalizedMessage,

      source,
    })

  if (
    proposalResult.matched !==
      true
  ) {
    return createSkippedResult({
      proposalResult,
    })
  }

  if (
    proposalResult.success !==
      true ||
    proposalResult
      .proposalCreated !==
      true ||
    !proposalResult.proposal
  ) {
    return createProposalFailureResult({
      proposalResult,
    })
  }

  const storeResult =
    await storeKnowledgeProposal({
      prisma,

      proposal:
        proposalResult.proposal,
    })

  if (
    storeResult.success !==
      true ||
    storeResult.stored !==
      true
  ) {
    return createStoreFailureResult({
      proposalResult,
      storeResult,
    })
  }

  return createStoredResult({
    proposalResult,
    storeResult,
  })
}


export {
  runKnowledgePipeline,
}
