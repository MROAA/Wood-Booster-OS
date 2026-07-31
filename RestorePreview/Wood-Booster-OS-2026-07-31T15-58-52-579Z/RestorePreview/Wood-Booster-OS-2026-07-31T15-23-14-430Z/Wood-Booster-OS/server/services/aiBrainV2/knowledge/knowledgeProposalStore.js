/*
=====================================
WOOD-BOOSTER AI BRAIN V2
KNOWLEDGE PROPOSAL STORE

Vastuut:
- vastaanottaa validoidun knowledge proposalin
- muuntaa proposalin tietokantamuotoon
- tallentaa proposalin MemoryProposal-tauluun
- tallentaa vain pending-tilassa
- ei hyväksy proposalista muistia
- ei kirjoita Memory-tauluun
=====================================
*/


const DEFAULT_IMPORTANCE = 5

const MIN_IMPORTANCE = 1

const MAX_IMPORTANCE = 10


function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}


function normalizeImportance(value) {
  const numericValue =
    Number(value)

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_IMPORTANCE
  }

  return Math.max(
    MIN_IMPORTANCE,
    Math.min(
      MAX_IMPORTANCE,
      Math.round(numericValue),
    ),
  )
}


function confidenceToImportance(
  confidence,
) {
  const numericConfidence =
    Number(confidence)

  if (
    !Number.isFinite(
      numericConfidence,
    )
  ) {
    return DEFAULT_IMPORTANCE
  }

  const normalizedConfidence =
    Math.max(
      0,
      Math.min(
        1,
        numericConfidence,
      ),
    )

  return normalizeImportance(
    4 +
    normalizedConfidence * 4,
  )
}


function validateStoreInput({
  prisma,
  proposal,
}) {
  const errors = []

  if (
    !prisma ||
    !prisma.memoryProposal ||
    typeof prisma
      .memoryProposal
      .create !== "function"
  ) {
    errors.push({
      code:
        "INVALID_PRISMA_CLIENT",

      message:
        "Prisma MemoryProposal client is not available.",
    })
  }

  if (
    !proposal ||
    typeof proposal !==
      "object" ||
    Array.isArray(proposal)
  ) {
    errors.push({
      code:
        "INVALID_PROPOSAL",

      message:
        "Knowledge proposal must be an object.",
    })

    return errors
  }

  if (
    proposal.status !==
      "pending_approval"
  ) {
    errors.push({
      code:
        "INVALID_PROPOSAL_STATUS",

      message:
        "Only pending_approval proposals can be stored.",
    })
  }

  if (
    proposal.requiresApproval !==
      true
  ) {
    errors.push({
      code:
        "APPROVAL_NOT_REQUIRED",

      message:
        "Stored proposals must require user approval.",
    })
  }

  if (
    !normalizeText(
      proposal.category,
    )
  ) {
    errors.push({
      code:
        "MISSING_CATEGORY",

      message:
        "Proposal category is missing.",
    })
  }

  if (
    !normalizeText(
      proposal.key,
    )
  ) {
    errors.push({
      code:
        "MISSING_KEY",

      message:
        "Proposal key is missing.",
    })
  }

  if (
    !normalizeText(
      proposal.content,
    )
  ) {
    errors.push({
      code:
        "MISSING_CONTENT",

      message:
        "Proposal content is missing.",
    })
  }

  return errors
}


function createDatabaseData(
  proposal,
) {
  return {
    category:
      normalizeText(
        proposal.category,
      ),

    key:
      normalizeText(
        proposal.key,
      ),

    content:
      normalizeText(
        proposal.content,
      ),

    importance:
      confidenceToImportance(
        proposal.confidence,
      ),

    status:
      "pending",
  }
}


function createFailureResult({
  status,
  message,
  errors,
}) {
  return {
    success:
      false,

    stored:
      false,

    status,

    message,

    proposalRecord:
      null,

    errors,

    debug: {
      store:
        "knowledge-proposal-store",

      version:
        "mvp-1",
    },
  }
}


async function storeKnowledgeProposal({
  prisma,
  proposal,
} = {}) {
  const validationErrors =
    validateStoreInput({
      prisma,
      proposal,
    })

  if (
    validationErrors.length > 0
  ) {
    return createFailureResult({
      status:
        "invalid_store_request",

      message:
        "Knowledge proposal could not be stored.",

      errors:
        validationErrors,
    })
  }

  const databaseData =
    createDatabaseData(
      proposal,
    )

  try {
    const proposalRecord =
      await prisma
        .memoryProposal
        .create({
          data:
            databaseData,
        })

    return {
      success:
        true,

      stored:
        true,

      status:
        "pending",

      message:
        "Knowledge proposal was stored for approval.",

      proposalRecord,

      errors:
        [],

      debug: {
        store:
          "knowledge-proposal-store",

        version:
          "mvp-1",

        databaseModel:
          "MemoryProposal",

        databaseStatus:
          "pending",
      },
    }
  } catch (error) {
    return createFailureResult({
      status:
        "database_error",

      message:
        "Database could not store the knowledge proposal.",

      errors: [
        {
          code:
            "DATABASE_CREATE_FAILED",

          message:
            error instanceof Error
              ? error.message
              : "Unknown database error.",
        },
      ],
    })
  }
}


export {
  storeKnowledgeProposal,
}
