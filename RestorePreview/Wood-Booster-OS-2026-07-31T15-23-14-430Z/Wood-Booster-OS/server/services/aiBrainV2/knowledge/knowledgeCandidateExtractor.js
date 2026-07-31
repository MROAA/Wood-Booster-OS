/*
=====================================
WOOD-BOOSTER AI BRAIN V2
KNOWLEDGE CANDIDATE EXTRACTOR
SPACEMONKEY CROCODILE DUNDEE
Vastuut:
- tunnistaa käyttäjän tallennuspyynnön
- poimii mahdollisen tallennettavan tiedon
- muodostaa knowledge candidate -ehdotuksen
- ei tallenna tietoa
- ei hyväksy tietoa
- ei muuta tietokantaa
=====================================
*/


const SAVE_PATTERNS = [
  {
    id: "remember_that",
    expressions: [
      /^muista\s+(?:että\s+)?(.+)$/i,
      /^muista\s+tämä[:\s]+(.+)$/i,
      /^muista\s+tama[:\s]+(.+)$/i,
      /^remember\s+(?:that\s+)?(.+)$/i,
    ],
  },

  {
    id: "save_information",
    expressions: [
      /^tallenna\s+(?:tieto|tämä|tama)?[:\s]+(.+)$/i,
      /^tallenna\s+tietopankkiin[:\s]+(.+)$/i,
      /^tallenna\s+muistiin[:\s]+(.+)$/i,
      /^save\s+(?:this|information)?[:\s]+(.+)$/i,
    ],
  },

  {
    id: "add_to_knowledge",
    expressions: [
      /^lisää\s+tietopankkiin[:\s]+(.+)$/i,
      /^lisaa\s+tietopankkiin[:\s]+(.+)$/i,
      /^lisää\s+tiedoksi[:\s]+(.+)$/i,
      /^lisaa\s+tiedoksi[:\s]+(.+)$/i,
      /^add\s+to\s+(?:the\s+)?knowledge\s+base[:\s]+(.+)$/i,
    ],
  },

  {
    id: "explicit_fact",
    expressions: [
      /^tieto[:\s]+(.+)$/i,
      /^fakta[:\s]+(.+)$/i,
      /^knowledge[:\s]+(.+)$/i,
      /^fact[:\s]+(.+)$/i,
    ],
  },
]


const CATEGORY_PATTERNS = [
  {
    category: "brand",
    words: [
      "brändi",
      "brandi",
      "brand",
      "puustaaja",
      "wood-booster",
      "wood booster",
      "slogan",
      "arvo",
      "arvot",
      "filosofia",
    ],
  },

  {
    category: "product",
    words: [
      "tuote",
      "tuotteet",
      "pöytä",
      "poyta",
      "jokipöytä",
      "jokipoyta",
      "huonekalu",
      "aurora",
    ],
  },

  {
    category: "workshop",
    words: [
      "verstas",
      "valmistus",
      "työvaihe",
      "tyovaihe",
      "materiaali",
      "puu",
      "epoksi",
      "viimeistely",
    ],
  },

  {
    category: "project",
    words: [
      "projekti",
      "projektit",
      "hanke",
      "aikataulu",
      "deadline",
      "asiakasprojekti",
    ],
  },

  {
    category: "development",
    words: [
      "kehitys",
      "kehittäminen",
      "kehittaminen",
      "koodi",
      "ohjelmointi",
      "arkkitehtuuri",
      "moduuli",
      "backend",
      "frontend",
      "api",
    ],
  },

  {
    category: "workflow",
    words: [
      "workflow",
      "prosessi",
      "vaihe",
      "vaiheittain",
      "toimintatapa",
      "työtapa",
      "tyotapa",
    ],
  },

  {
    category: "preference",
    words: [
      "haluan",
      "toivon",
      "mieluummin",
      "pidän",
      "pidan",
      "en halua",
      "käyttäjän tapa",
      "kayttajan tapa",
    ],
  },
]


function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}


function normalizeForComparison(value) {
  return normalizeText(value)
    .toLocaleLowerCase("fi-FI")
}


function removeEndingPunctuation(value) {
  return normalizeText(value)
    .replace(/[.!?;:,]+$/g, "")
    .trim()
}


function createCandidateKey({
  category,
  content,
}) {
  const normalizedContent =
    normalizeForComparison(content)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9äöå]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60)

  if (!normalizedContent) {
    return `${category}_knowledge`
  }

  return `${category}_${normalizedContent}`
}


function detectCategory(content) {
  const normalizedContent =
    normalizeForComparison(content)

  let bestCategory =
    "general"

  let bestScore =
    0

  for (
    const categoryDefinition
    of CATEGORY_PATTERNS
  ) {
    const score =
      categoryDefinition.words.reduce(
        (
          total,
          word,
        ) => {
          const normalizedWord =
            normalizeForComparison(word)

          if (
            normalizedContent.includes(
              normalizedWord,
            )
          ) {
            return total + 1
          }

          return total
        },
        0,
      )

    if (score > bestScore) {
      bestCategory =
        categoryDefinition.category

      bestScore =
        score
    }
  }

  return {
    category:
      bestCategory,

    confidence:
      bestScore > 0
        ? Math.min(
            0.95,
            0.55 + bestScore * 0.1,
          )
        : 0.4,

    matchedWords:
      bestScore,
  }
}


function extractExplicitContent(message) {
  const normalizedMessage =
    normalizeText(message)

  if (!normalizedMessage) {
    return null
  }

  for (
    const patternGroup
    of SAVE_PATTERNS
  ) {
    for (
      const expression
      of patternGroup.expressions
    ) {
      const match =
        normalizedMessage.match(
          expression,
        )

      const extractedContent =
        removeEndingPunctuation(
          match?.[1],
        )

      if (!extractedContent) {
        continue
      }

      return {
        instructionId:
          patternGroup.id,

        content:
          extractedContent,
      }
    }
  }

  return null
}


function createEmptyExtractionResult() {
  return {
    matched:
      false,

    shouldPropose:
      false,

    reason:
      "No explicit knowledge save request detected.",

    candidate:
      null,

    debug: {
      extractor:
        "knowledge-candidate-extractor",

      version:
        "mvp-1",

      explicitSaveRequest:
        false,
    },
  }
}


function extractKnowledgeCandidate({
  message,
  source = "chat",
} = {}) {
  const extracted =
    extractExplicitContent(
      message,
    )

  if (!extracted) {
    return createEmptyExtractionResult()
  }

  const categoryResult =
    detectCategory(
      extracted.content,
    )

  const candidate = {
    type:
      "knowledge",

    category:
      categoryResult.category,

    key:
      createCandidateKey({
        category:
          categoryResult.category,

        content:
          extracted.content,
      }),

    content:
      extracted.content,

    source:
      normalizeText(source) ||
      "chat",

    status:
      "proposal",

    requiresApproval:
      true,

    confidence:
      categoryResult.confidence,

    metadata: {
      extractorVersion:
        "mvp-1",

      instructionId:
        extracted.instructionId,

      categoryMatchedWords:
        categoryResult.matchedWords,
    },
  }

  return {
    matched:
      true,

    shouldPropose:
      true,

    reason:
      "Explicit knowledge save request detected.",

    candidate,

    debug: {
      extractor:
        "knowledge-candidate-extractor",

      version:
        "mvp-1",

      explicitSaveRequest:
        true,

      instructionId:
        extracted.instructionId,
    },
  }
}


export {
  extractKnowledgeCandidate,
}
