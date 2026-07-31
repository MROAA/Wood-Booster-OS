/*
=====================================
WOOD-BOOSTER AI BRAIN V2
KNOWLEDGE CANDIDATE VALIDATOR
SPACEMONKEY
Vastuut:
- tarkistaa knowledge candidate -ehdotuksen
- estää tyhjät ja liian lyhyet ehdotukset
- estää pelkät komennot
- estää epäkelvot rakenteet
- palauttaa validointituloksen
- ei tallenna tietoa
- ei hyväksy tietoa
- ei muuta tietokantaa
=====================================
*/


const MIN_CONTENT_LENGTH = 8

const MAX_CONTENT_LENGTH = 2000


const ALLOWED_CATEGORIES = new Set([
  "general",
  "brand",
  "product",
  "workshop",
  "project",
  "development",
  "workflow",
  "preference",
])


const ALLOWED_SOURCES = new Set([
  "chat",
  "manual",
  "import",
  "system",
])


const COMMAND_ONLY_PATTERNS = [
  /^avaa\b/i,
  /^sulje\b/i,
  /^siirry\b/i,
  /^mene\b/i,
  /^näytä\b/i,
  /^nayta\b/i,
  /^poista\b/i,
  /^delete\b/i,
  /^open\b/i,
  /^close\b/i,
  /^go\b/i,
  /^show\b/i,
  /^run\b/i,
  /^execute\b/i,
]


function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}


function normalizeValue(value) {
  return normalizeText(value)
    .toLocaleLowerCase("fi-FI")
}


function createValidationError({
  code,
  message,
  field = null,
}) {
  return {
    code,
    message,
    field,
  }
}


function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
}


function isCommandOnly(content) {
  const normalizedContent =
    normalizeText(content)

  if (!normalizedContent) {
    return false
  }

  const wordCount =
    normalizedContent
      .split(" ")
      .filter(Boolean)
      .length

  if (wordCount > 6) {
    return false
  }

  return COMMAND_ONLY_PATTERNS.some(
    (pattern) =>
      pattern.test(
        normalizedContent,
      ),
  )
}


function validateCandidateStructure(
  candidate,
) {
  const errors = []

  if (!isPlainObject(candidate)) {
    errors.push(
      createValidationError({
        code:
          "INVALID_CANDIDATE",

        message:
          "Knowledge candidate must be an object.",
      }),
    )

    return errors
  }

  if (
    normalizeValue(
      candidate.type,
    ) !== "knowledge"
  ) {
    errors.push(
      createValidationError({
        code:
          "INVALID_TYPE",

        message:
          "Candidate type must be knowledge.",

        field:
          "type",
      }),
    )
  }

  if (
    normalizeValue(
      candidate.status,
    ) !== "proposal"
  ) {
    errors.push(
      createValidationError({
        code:
          "INVALID_STATUS",

        message:
          "Candidate status must be proposal.",

        field:
          "status",
      }),
    )
  }

  if (
    candidate.requiresApproval !==
    true
  ) {
    errors.push(
      createValidationError({
        code:
          "APPROVAL_REQUIRED",

        message:
          "Candidate must require approval.",

        field:
          "requiresApproval",
      }),
    )
  }

  return errors
}


function validateCandidateContent(
  candidate,
) {
  const errors = []

  const content =
    normalizeText(
      candidate?.content,
    )

  if (!content) {
    errors.push(
      createValidationError({
        code:
          "EMPTY_CONTENT",

        message:
          "Candidate content is empty.",

        field:
          "content",
      }),
    )

    return errors
  }

  if (
    content.length <
    MIN_CONTENT_LENGTH
  ) {
    errors.push(
      createValidationError({
        code:
          "CONTENT_TOO_SHORT",

        message:
          `Candidate content must contain at least ${MIN_CONTENT_LENGTH} characters.`,

        field:
          "content",
      }),
    )
  }

  if (
    content.length >
    MAX_CONTENT_LENGTH
  ) {
    errors.push(
      createValidationError({
        code:
          "CONTENT_TOO_LONG",

        message:
          `Candidate content may contain at most ${MAX_CONTENT_LENGTH} characters.`,

        field:
          "content",
      }),
    )
  }

  if (
    isCommandOnly(content)
  ) {
    errors.push(
      createValidationError({
        code:
          "COMMAND_ONLY_CONTENT",

        message:
          "A command alone is not valid knowledge.",

        field:
          "content",
      }),
    )
  }

  return errors
}


function validateCandidateCategory(
  candidate,
) {
  const errors = []

  const category =
    normalizeValue(
      candidate?.category,
    )

  if (!category) {
    errors.push(
      createValidationError({
        code:
          "MISSING_CATEGORY",

        message:
          "Candidate category is missing.",

        field:
          "category",
      }),
    )

    return errors
  }

  if (
    !ALLOWED_CATEGORIES.has(
      category,
    )
  ) {
    errors.push(
      createValidationError({
        code:
          "INVALID_CATEGORY",

        message:
          `Candidate category is not allowed: ${category}`,

        field:
          "category",
      }),
    )
  }

  return errors
}


function validateCandidateSource(
  candidate,
) {
  const errors = []

  const source =
    normalizeValue(
      candidate?.source,
    )

  if (!source) {
    errors.push(
      createValidationError({
        code:
          "MISSING_SOURCE",

        message:
          "Candidate source is missing.",

        field:
          "source",
      }),
    )

    return errors
  }

  if (
    !ALLOWED_SOURCES.has(
      source,
    )
  ) {
    errors.push(
      createValidationError({
        code:
          "INVALID_SOURCE",

        message:
          `Candidate source is not allowed: ${source}`,

        field:
          "source",
      }),
    )
  }

  return errors
}


function validateCandidateKey(
  candidate,
) {
  const errors = []

  const key =
    normalizeText(
      candidate?.key,
    )

  if (!key) {
    errors.push(
      createValidationError({
        code:
          "MISSING_KEY",

        message:
          "Candidate key is missing.",

        field:
          "key",
      }),
    )

    return errors
  }

  if (
    !/^[a-z0-9_]+$/i.test(key)
  ) {
    errors.push(
      createValidationError({
        code:
          "INVALID_KEY",

        message:
          "Candidate key may only contain letters, numbers and underscores.",

        field:
          "key",
      }),
    )
  }

  return errors
}


function createValidationResult({
  valid,
  candidate,
  errors,
}) {
  return {
    valid,

    canProceed:
      valid,

    requiresApproval:
      candidate?.requiresApproval ===
      true,

    candidate:
      valid
        ? candidate
        : null,

    errors,

    debug: {
      validator:
        "knowledge-candidate-validator",

      version:
        "mvp-1",

      errorCount:
        errors.length,
    },
  }
}


function validateKnowledgeCandidate({
  candidate,
} = {}) {
  const errors = [
    ...validateCandidateStructure(
      candidate,
    ),

    ...validateCandidateContent(
      candidate,
    ),

    ...validateCandidateCategory(
      candidate,
    ),

    ...validateCandidateSource(
      candidate,
    ),

    ...validateCandidateKey(
      candidate,
    ),
  ]

  return createValidationResult({
    valid:
      errors.length === 0,

    candidate,

    errors,
  })
}


export {
  validateKnowledgeCandidate,
}
