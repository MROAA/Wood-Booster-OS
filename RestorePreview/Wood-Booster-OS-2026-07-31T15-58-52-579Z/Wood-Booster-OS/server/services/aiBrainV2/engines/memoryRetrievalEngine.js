/*
=====================================
WOOD-BOOSTER AI BRAIN V2
MEMORY RETRIEVAL ENGINE
SPACEMONKEYPERSBABACROCODILEDUNDEE

Vastuut:
- hakee hyväksytyt muistit
- normalisoi hakusanat
- tunnistaa suomen taivutusmuotoja
- tunnistaa yhdyssanoja
- tunnistaa semanttisesti liittyvät käsitteet
- erottaa suorat ja semanttiset osumat
- arvioi muistien merkityksellisyyden
- järjestää muistit pisteiden mukaan
- palauttaa vain relevantit muistit
- ei tallenna eikä muuta muistia
=====================================
*/


import {
  getMemory,
} from "../../memoryService.js"


import {
  expandSemanticTokens,
  normalizeSemanticText,
} from "./semanticTokenNormalizer.js"


const DEFAULT_LIMIT = 8

const MEMORY_POOL_LIMIT = 100


const STOP_WORDS = new Set([
  "ja",
  "se",
  "ne",
  "etta",
  "joka",
  "jotka",
  "kun",
  "kuin",
  "mutta",
  "myos",
  "niin",
  "olen",
  "olla",
  "ovat",
  "oli",
  "tama",
  "tassa",
  "tuo",
  "sita",
  "sitten",
  "vain",
  "viela",
  "mina",
  "minun",
  "sina",
  "sinun",
  "meidan",
  "teidan",
  "haluan",
  "voin",
  "pitaa",
  "jokainen",
  "please",
  "with",
  "from",
  "that",
  "this",
  "have",
  "will",
  "would",
  "should",
  "about",
  "into",
  "your",
  "user",
])


const SEMANTIC_CONCEPTS = {
  development: [
    "development",
    "develop",
    "developer",
    "kehitys",
    "kehittaa",
    "kehittaminen",
    "rakentaa",
    "rakentaminen",
    "toteutus",
    "implementation",
  ],

  coding: [
    "coding",
    "code",
    "programming",
    "program",
    "koodi",
    "koodaus",
    "ohjelmointi",
    "javascript",
    "react",
    "node",
  ],

  architecture: [
    "architecture",
    "architectural",
    "arkkitehtuuri",
    "rakenne",
    "rakenteellinen",
    "module",
    "modules",
    "modular",
    "modulaarinen",
    "system",
    "jarjestelma",
  ],

  workflow: [
    "workflow",
    "process",
    "procedure",
    "tyotapa",
    "tyovaihe",
    "prosessi",
    "vaihe",
    "vaiheittain",
    "jarjestys",
    "eteneminen",
  ],

  project: [
    "project",
    "projects",
    "projekti",
    "projektit",
    "hanke",
    "projectmanagement",
    "projektinhallinta",
  ],

  aiBrain: [
    "ai",
    "brain",
    "aibrain",
    "tekoaly",
    "assistant",
    "avustaja",
    "agent",
    "agentti",
    "ollama",
    "qwen",
  ],

  memory: [
    "memory",
    "memories",
    "muisti",
    "muistot",
    "oppia",
    "oppiminen",
    "learn",
    "learning",
    "remember",
    "muistaa",
  ],

  knowledge: [
    "knowledge",
    "knowledgebase",
    "tieto",
    "tietopankki",
    "tietokanta",
    "document",
    "documents",
    "dokumentti",
    "source",
    "lahde",
  ],

  frontend: [
    "frontend",
    "front",
    "ui",
    "userinterface",
    "kayttoliittyma",
    "react",
    "component",
    "komponentti",
    "page",
    "sivu",
  ],

  backend: [
    "backend",
    "server",
    "api",
    "route",
    "router",
    "service",
    "palvelin",
    "endpoint",
    "prisma",
    "database",
  ],

  testing: [
    "test",
    "tests",
    "testing",
    "testata",
    "testaus",
    "verify",
    "verification",
    "tarkistaa",
    "tarkistus",
    "debug",
    "debugging",
  ],

  mvp: [
    "mvp",
    "minimum",
    "minimal",
    "simple",
    "first",
    "ensimmainen",
    "yksinkertainen",
    "perusversio",
  ],

  preference: [
    "preference",
    "preferences",
    "prefer",
    "mieltymys",
    "toive",
    "haluan",
    "kayttajatapa",
  ],

  instructions: [
    "instruction",
    "instructions",
    "guide",
    "guidance",
    "ohje",
    "ohjeet",
    "komento",
    "commands",
    "step",
    "steps",
  ],

  quality: [
    "quality",
    "laatu",
    "huolellinen",
    "careful",
    "carefully",
    "reliable",
    "luotettava",
    "tarkka",
  ],

  brand: [
    "brand",
    "branding",
    "brandi",
    "wood",
    "booster",
    "woodbooster",
    "wood-booster",
    "puustaaja",
    "philosophy",
    "filosofia",
    "identity",
    "identiteetti",
  ],

  product: [
    "product",
    "products",
    "tuote",
    "tuotteet",
    "furniture",
    "huonekalu",
    "table",
    "poyta",
    "rivertable",
    "jokipoyta",
  ],

  workshop: [
    "workshop",
    "verstas",
    "production",
    "valmistus",
    "valmistaa",
    "materiaali",
    "material",
    "woodworking",
    "puutyo",
  ],
}


function normalizeText(value) {
  return normalizeSemanticText(
    value,
  )
}


function tokenizeDirect(value) {
  const normalized =
    normalizeText(value)

  if (!normalized) {
    return []
  }

  return [
    ...new Set(
      normalized
        .split(" ")
        .map(
          (word) =>
            word.trim(),
        )
        .filter(
          (word) =>
            word.length >= 2 &&
            !STOP_WORDS.has(word),
        ),
    ),
  ]
}


function createSemanticTokens(
  directTokens,
) {
  return [
    ...new Set(
      expandSemanticTokens(
        Array.isArray(directTokens)
          ? directTokens
          : [],
      ).filter(
        (word) =>
          word.length >= 2 &&
          !STOP_WORDS.has(word),
      ),
    ),
  ]
}


function normalizeImportance(value) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return 0
  }

  return Math.max(
    0,
    Math.min(
      10,
      number,
    ),
  )
}


function createSemanticIndex() {
  const semanticIndex =
    new Map()

  for (
    const [
      concept,
      conceptWords,
    ]
    of Object.entries(
      SEMANTIC_CONCEPTS,
    )
  ) {
    semanticIndex.set(
      normalizeText(concept),
      concept,
    )

    for (
      const conceptWord
      of conceptWords
    ) {
      semanticIndex.set(
        normalizeText(
          conceptWord,
        ),
        concept,
      )
    }
  }

  return semanticIndex
}


const SEMANTIC_INDEX =
  createSemanticIndex()


function findSemanticConcepts(tokens) {
  const concepts =
    new Set()

  const semanticTokens =
    createSemanticTokens(
      tokens,
    )

  for (
    const token
    of semanticTokens
  ) {
    const concept =
      SEMANTIC_INDEX.get(
        normalizeText(token),
      )

    if (concept) {
      concepts.add(
        concept,
      )
    }
  }

  return [
    ...concepts,
  ]
}


function createSemanticData(
  directTokens,
) {
  const semanticTokens =
    createSemanticTokens(
      directTokens,
    )

  const concepts =
    findSemanticConcepts(
      semanticTokens,
    )

  return {
    tokens:
      semanticTokens,

    concepts,
  }
}


function calculateDirectMatches({
  messageTokens,
  memoryTokens,
}) {
  if (
    messageTokens.length === 0 ||
    memoryTokens.length === 0
  ) {
    return 0
  }

  const memoryTokenSet =
    new Set(
      memoryTokens,
    )

  return messageTokens.filter(
    (token) =>
      memoryTokenSet.has(token),
  ).length
}


function calculateSemanticMatches({
  messageConcepts,
  memoryConcepts,
}) {
  if (
    messageConcepts.length === 0 ||
    memoryConcepts.length === 0
  ) {
    return {
      count:
        0,

      concepts:
        [],
    }
  }

  const memoryConceptSet =
    new Set(
      memoryConcepts,
    )

  const matchingConcepts =
    messageConcepts.filter(
      (concept) =>
        memoryConceptSet.has(
          concept,
        ),
    )

  return {
    count:
      matchingConcepts.length,

    concepts:
      matchingConcepts,
  }
}


function calculateMemoryScore({
  memory,
  messageDirectTokens,
  messageSemantic,
}) {
  const categoryDirectTokens =
    tokenizeDirect(
      memory.category,
    )

  const keyDirectTokens =
    tokenizeDirect(
      memory.key,
    )

  const contentDirectTokens =
    tokenizeDirect(
      memory.content,
    )

  const categorySemantic =
    createSemanticData(
      categoryDirectTokens,
    )

  const keySemantic =
    createSemanticData(
      keyDirectTokens,
    )

  const contentSemantic =
    createSemanticData(
      contentDirectTokens,
    )

  const categoryDirectMatches =
    calculateDirectMatches({
      messageTokens:
        messageDirectTokens,

      memoryTokens:
        categoryDirectTokens,
    })

  const keyDirectMatches =
    calculateDirectMatches({
      messageTokens:
        messageDirectTokens,

      memoryTokens:
        keyDirectTokens,
    })

  const contentDirectMatches =
    calculateDirectMatches({
      messageTokens:
        messageDirectTokens,

      memoryTokens:
        contentDirectTokens,
    })

  const categorySemanticMatches =
    calculateSemanticMatches({
      messageConcepts:
        messageSemantic.concepts,

      memoryConcepts:
        categorySemantic.concepts,
    })

  const keySemanticMatches =
    calculateSemanticMatches({
      messageConcepts:
        messageSemantic.concepts,

      memoryConcepts:
        keySemantic.concepts,
    })

  const contentSemanticMatches =
    calculateSemanticMatches({
      messageConcepts:
        messageSemantic.concepts,

      memoryConcepts:
        contentSemantic.concepts,
    })

  const semanticConcepts = [
    ...new Set([
      ...categorySemanticMatches
        .concepts,

      ...keySemanticMatches
        .concepts,

      ...contentSemanticMatches
        .concepts,
    ]),
  ]

  const totalDirectMatches =
    categoryDirectMatches +
    keyDirectMatches +
    contentDirectMatches

  const totalSemanticMatches =
    semanticConcepts.length

  const relevant =
    totalDirectMatches > 0 ||
    totalSemanticMatches > 0

  if (!relevant) {
    return {
      relevant:
        false,

      score:
        0,

      matches: {
        category:
          0,

        key:
          0,

        content:
          0,

        semantic:
          0,

        semanticConcepts:
          [],
      },
    }
  }

  let score = 0

  score +=
    categoryDirectMatches * 3

  score +=
    keyDirectMatches * 4

  score +=
    contentDirectMatches * 2

  score +=
    categorySemanticMatches.count *
    1.5

  score +=
    keySemanticMatches.count *
    2.5

  score +=
    contentSemanticMatches.count *
    1.25

  const importance =
    normalizeImportance(
      memory.importance,
    )

  score +=
    importance * 0.25

  const category =
    normalizeText(
      memory.category,
    )

  if (
    category === "workflow" ||
    category === "preference" ||
    category === "preferences" ||
    category === "user preference"
  ) {
    score +=
      importance * 0.1
  }

  return {
    relevant:
      true,

    score,

    matches: {
      category:
        categoryDirectMatches,

      key:
        keyDirectMatches,

      content:
        contentDirectMatches,

      semantic:
        totalSemanticMatches,

      semanticConcepts,
    },
  }
}


function createRetrievalResult({
  memories,
  candidates,
  messageDirectTokens,
  messageSemantic,
  limit,
}) {
  return {
    memories,

    debug: {
      enabled:
        true,

      semanticEnabled:
        true,

      semanticNormalizerEnabled:
        true,

      scoringVersion:
        "v3",

      candidateCount:
        candidates.length,

      selectedCount:
        memories.length,

      limit,

      messageTokens:
        messageDirectTokens,

      expandedMessageTokens:
        messageSemantic.tokens,

      messageSemanticConcepts:
        messageSemantic.concepts,

      selectedMemories:
        memories.map(
          (memory) => ({
            id:
              memory.id,

            category:
              memory.category,

            key:
              memory.key,

            importance:
              memory.importance,

            retrievalScore:
              memory.retrievalScore,

            retrievalMatches:
              memory.retrievalMatches,
          }),
        ),
    },
  }
}


async function retrieveRelevantMemories({
  prisma,
  message,
  limit = DEFAULT_LIMIT,
}) {
  const messageDirectTokens =
    tokenizeDirect(
      message,
    )

  const messageSemantic =
    createSemanticData(
      messageDirectTokens,
    )

  if (!prisma) {
    return createRetrievalResult({
      memories:
        [],

      candidates:
        [],

      messageDirectTokens,

      messageSemantic,

      limit,
    })
  }

  const safeLimit =
    Math.max(
      1,
      Math.min(
        20,
        Number(limit) ||
        DEFAULT_LIMIT,
      ),
    )

  const candidates =
    await getMemory({
      prisma,

      limit:
        MEMORY_POOL_LIMIT,
    })

  const normalizedCandidates =
    Array.isArray(candidates)
      ? candidates
      : []

  const scoredMemories =
    normalizedCandidates
      .map(
        (memory) => {
          const scoring =
            calculateMemoryScore({
              memory,
              messageDirectTokens,
              messageSemantic,
            })

          return {
            ...memory,

            retrievalRelevant:
              scoring.relevant,

            retrievalScore:
              Number(
                scoring.score.toFixed(
                  2,
                ),
              ),

            retrievalMatches:
              scoring.matches,
          }
        },
      )
      .filter(
        (memory) =>
          memory.retrievalRelevant ===
          true,
      )
      .sort(
        (
          firstMemory,
          secondMemory,
        ) => {
          if (
            secondMemory
              .retrievalScore !==
            firstMemory
              .retrievalScore
          ) {
            return (
              secondMemory
                .retrievalScore -
              firstMemory
                .retrievalScore
            )
          }

          return (
            normalizeImportance(
              secondMemory.importance,
            ) -
            normalizeImportance(
              firstMemory.importance,
            )
          )
        },
      )
      .slice(
        0,
        safeLimit,
      )
      .map(
        ({
          retrievalRelevant,
          ...memory
        }) =>
          memory,
      )

  return createRetrievalResult({
    memories:
      scoredMemories,

    candidates:
      normalizedCandidates,

    messageDirectTokens,

    messageSemantic,

    limit:
      safeLimit,
  })
}


export {
  retrieveRelevantMemories,
}
