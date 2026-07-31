/*
=====================================
WOOD-BOOSTER AI BRAIN V2

REASONING MODULE V1.3

Vastuut:
- analysoi käyttäjän pyynnön
- tunnistaa pyynnön tavoitteen
- tunnistaa mahdolliset moduulitarpeet
- erottaa muistien hallinnan
  muistiksi oppimisesta
- tunnistaa credentials-pyynnöt
- tunnistaa puuttuvat tiedot
- liittää Interaction Enginen tuottaman
  vuorovaikutuskontekstin analyysiin
- muodostaa rakenteisen reasoning-tuloksen

Reasoning Module ei:
- suorita toimintoja
- kirjoita tietokantaan
- valitse lopullista moduulia
- kutsu kielimallia
- lue salaisia credentials-arvoja
- luo muistiehdotuksia
- hyväksy tai hylkää muistiehdotuksia
- analysoi vuorovaikutusta uudelleen
- korvaa Interaction Engineä
- korvaa Action Modulea
- korvaa Decision Modulea
=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"


const REASONING_MODULE_VERSION =
  "1.3.0"


const MEMORY_MODES = {
  MANAGEMENT:
    "management",

  LEARNING:
    "learning",

  REFERENCE:
    "reference",
}


const actionKeywords = [
  "avaa",
  "näytä",
  "siirry",
  "mene",
  "luo",
  "tee",
  "päivitä",
  "muuta",
  "vaihda",
  "poista",
  "tallenna",
  "hyväksy",
  "hylkää",
  "open",
  "show",
  "create",
  "update",
  "change",
  "delete",
  "save",
  "approve",
  "reject",
]


const navigationKeywords = [
  "avaa",
  "näytä",
  "siirry",
  "mene",
  "open",
  "show",
]


const memoryKeywords = [
  "muista",
  "muisti",
  "muistot",
  "muistissa",
  "muistiehdotus",
  "muistiehdotukset",
  "remember",
  "memory",
  "memories",
]


const memoryManagementPhrases = [
  "näytä muistot",
  "listaa muistot",
  "hae muistot",
  "mitä muistat",
  "näytä ai muisti",
  "näytä tekoälyn muisti",
  "näytä muistiehdotukset",
  "listaa muistiehdotukset",
  "hae muistiehdotukset",
  "näytä odottavat muistot",
  "näytä odottavat muistiehdotukset",
  "hyväksy muistiehdotus",
  "hyväksy muisti",
  "hylkää muistiehdotus",
  "hylkää muisti",
  "show memories",
  "list memories",
  "show memory proposals",
  "list memory proposals",
  "approve memory proposal",
  "reject memory proposal",
]


const memoryLearningPhrases = [
  "muista tämä",
  "muista että",
  "muista, että",
  "haluan että muistat",
  "haluan muistaa",
  "haluan muistaa tämän",
  "haluan muistaa että",
  "haluan muistaa, että",
  "haluan, että muistat",
  "pidä tämä mielessä",
  "pidä mielessä että",
  "pidä mielessä, että",
  "tallenna tämä muistiin",
  "tallenna muistiin",
  "laita tämä muistiin",
  "lisää tämä muistiin",
  "tästä kannattaa oppia",
  "opi tästä",
  "remember this",
  "remember that",
  "i want you to remember",
  "keep this in mind",
  "save this to memory",
  "store this in memory",
  "learn this",
]


const knowledgeKeywords = [
  "tietopankki",
  "tieto",
  "tiedot",
  "dokumentti",
  "dokumentit",
  "knowledge",
  "document",
  "documents",
]


const projectKeywords = [
  "projekti",
  "projektit",
  "projektin",
  "projektia",
  "project",
  "projects",
]


const customerKeywords = [
  "asiakas",
  "asiakkaat",
  "asiakkaan",
  "customer",
  "customers",
]


const credentialsKeywords = [
  "credential",
  "credentials",
  "tunnistetieto",
  "tunnistetiedot",
  "kirjautumistieto",
  "kirjautumistiedot",
  "api-avain",
  "api-avaimen",
  "api-key",
  "api key",
  "access token",
  "token",
  "salainen avain",
  "salaisuus",
  "secret",
  "palveluyhteys",
  "palveluyhteydet",
  "yhdistetty",
  "integraatio",
  "integration",
  "moltbook",
  "instagram",
]


const questionKeywords = [
  "mikä",
  "mitä",
  "miten",
  "miksi",
  "milloin",
  "missä",
  "kuka",
  "voiko",
  "onko",
  "kuinka",
  "saako",
  "what",
  "how",
  "why",
  "when",
  "where",
  "who",
  "can",
  "is",
  "may",
]


function normalizeText(value) {
  return String(
    value ||
    "",
  )
    .trim()
    .toLowerCase()
}


function normalizeSearchText(
  value,
) {
  return normalizeText(
    value,
  )
    .replace(
      /[^a-zåäö0-9_]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
}


function includesKeyword(
  normalizedMessage,
  keyword,
) {
  const searchableMessage =
    normalizeSearchText(
      normalizedMessage,
    )

  const searchableKeyword =
    normalizeSearchText(
      keyword,
    )

  if (
    !searchableMessage ||
    !searchableKeyword
  ) {
    return false
  }

  return (
    ` ${searchableMessage} `
      .includes(
        ` ${searchableKeyword} `,
      )
  )
}


function includesPhrase(
  normalizedMessage,
  phrase,
) {
  const searchableMessage =
    normalizeSearchText(
      normalizedMessage,
    )

  const searchablePhrase =
    normalizeSearchText(
      phrase,
    )

  if (
    !searchableMessage ||
    !searchablePhrase
  ) {
    return false
  }

  return searchableMessage.includes(
    searchablePhrase,
  )
}


function findMatchingKeywords({
  normalizedMessage,
  keywords,
}) {
  return keywords.filter(
    (keyword) =>
      includesKeyword(
        normalizedMessage,
        keyword,
      ),
  )
}


function findMatchingPhrases({
  normalizedMessage,
  phrases,
}) {
  return phrases.filter(
    (phrase) =>
      includesPhrase(
        normalizedMessage,
        phrase,
      ),
  )
}


function detectQuestion(
  normalizedMessage,
) {
  if (
    normalizedMessage.includes("?")
  ) {
    return true
  }

  return questionKeywords.some(
    (keyword) =>
      normalizedMessage.startsWith(
        `${keyword} `,
      ) ||
      normalizedMessage ===
        keyword,
  )
}


function detectMemoryMode({
  memoryMatches,
  memoryManagementMatches,
  memoryLearningMatches,
}) {
  if (
    memoryManagementMatches.length >
    0
  ) {
    return MEMORY_MODES.MANAGEMENT
  }

  if (
    memoryLearningMatches.length >
    0
  ) {
    return MEMORY_MODES.LEARNING
  }

  if (
    memoryMatches.length >
    0
  ) {
    return MEMORY_MODES.REFERENCE
  }

  return null
}


function detectIntent({
  isQuestion,
  actionMatches,
  knowledgeMatches,
  credentialsMatches,
  memoryMode,
}) {
  if (
    credentialsMatches.length > 0
  ) {
    return "credentials_request"
  }

  if (
    memoryMode ===
    MEMORY_MODES.MANAGEMENT
  ) {
    return "memory_management"
  }

  if (
    memoryMode ===
    MEMORY_MODES.LEARNING
  ) {
    return "memory_learning"
  }

  if (
    knowledgeMatches.length > 0 &&
    actionMatches.length > 0
  ) {
    return "knowledge_action"
  }

  if (
    actionMatches.length > 0
  ) {
    return "action_request"
  }

  if (isQuestion) {
    return "information_request"
  }

  return "conversation"
}


function detectDomains({
  projectMatches,
  customerMatches,
  memoryMatches,
  knowledgeMatches,
  credentialsMatches,
}) {
  const domains = []

  if (
    projectMatches.length > 0
  ) {
    domains.push(
      "project",
    )
  }

  if (
    customerMatches.length > 0
  ) {
    domains.push(
      "customer",
    )
  }

  if (
    memoryMatches.length > 0
  ) {
    domains.push(
      "memory",
    )
  }

  if (
    knowledgeMatches.length > 0
  ) {
    domains.push(
      "knowledge",
    )
  }

  if (
    credentialsMatches.length > 0
  ) {
    domains.push(
      "credentials",
    )
  }

  if (
    domains.length === 0
  ) {
    domains.push(
      "general",
    )
  }

  return domains
}


function detectModuleNeeds({
  intent,
  domains,
}) {
  const credentialsNeeded =
    intent ===
      "credentials_request" ||
    domains.includes(
      "credentials",
    )

  const memoryManagementNeeded =
    intent ===
    "memory_management"

  const memoryLearningNeeded =
    intent ===
    "memory_learning"

  const knowledgeNeeded =
    intent ===
      "knowledge_action" ||
    (
      domains.includes(
        "knowledge",
      ) &&
      !memoryLearningNeeded
    )

  const actionNeeded =
    intent ===
      "action_request" ||
    intent ===
      "knowledge_action" ||
    memoryManagementNeeded

  const conversationNeeded =
    !credentialsNeeded &&
    (
      intent ===
        "conversation" ||
      intent ===
        "information_request" ||
      memoryLearningNeeded
    )

  return {
    credentials:
      credentialsNeeded,

    action:
      actionNeeded,

    memory:
      memoryManagementNeeded,

    knowledge:
      knowledgeNeeded,

    conversation:
      conversationNeeded,

    project:
      domains.includes(
        "project",
      ),

    customer:
      domains.includes(
        "customer",
      ),
  }
}


function startsWithKeyword({
  normalizedMessage,
  keywords,
}) {
  return keywords.some(
    (keyword) => {
      return (
        normalizedMessage ===
          keyword ||
        normalizedMessage.startsWith(
          `${keyword} `,
        )
      )
    },
  )
}


function isProjectListNavigation(
  normalizedMessage,
) {
  const isNavigation =
    startsWithKeyword({
      normalizedMessage,
      keywords:
        navigationKeywords,
    })

  if (!isNavigation) {
    return false
  }

  return (
    normalizedMessage.includes(
      "projektit",
    ) ||
    normalizedMessage.includes(
      "projects",
    )
  )
}


function hasProjectReference(
  normalizedMessage,
) {
  const quotedReference =
    normalizedMessage.match(
      /["“”'][^"“”']+["“”']/u,
    )

  if (quotedReference) {
    return true
  }

  const projectReference =
    normalizedMessage.match(
      /\bprojekt(?:i|in|ia|ille|ista|issa)\s+[\p{L}\p{N}-]+/u,
    )

  if (projectReference) {
    return true
  }

  const englishProjectReference =
    normalizedMessage.match(
      /\bproject\s+[\p{L}\p{N}-]+/u,
    )

  return Boolean(
    englishProjectReference,
  )
}


function detectMissingInformation({
  normalizedMessage,
  intent,
  domains,
}) {
  const missingInformation = []

  if (!normalizedMessage) {
    missingInformation.push(
      "message",
    )

    return missingInformation
  }

  if (
    intent ===
      "action_request" &&
    normalizedMessage.length < 5
  ) {
    missingInformation.push(
      "action_details",
    )
  }

  const projectDomainDetected =
    domains.includes(
      "project",
    )

  const projectListNavigation =
    isProjectListNavigation(
      normalizedMessage,
    )

  const projectReferenceExists =
    hasProjectReference(
      normalizedMessage,
    )

  const shouldRequireProjectReference =
    intent !==
      "memory_learning" &&
    intent !==
      "conversation" &&
    intent !==
      "information_request"

  if (
    projectDomainDetected &&
    shouldRequireProjectReference &&
    !projectListNavigation &&
    !projectReferenceExists
  ) {
    missingInformation.push(
      "project_reference_may_be_missing",
    )
  }

  return missingInformation
}


function calculateConfidence({
  intent,
  domains,
  actionMatches,
  memoryMatches,
  memoryManagementMatches,
  memoryLearningMatches,
  knowledgeMatches,
  projectMatches,
  customerMatches,
  credentialsMatches,
}) {
  let confidence = 0.4

  if (
    intent !== "conversation"
  ) {
    confidence += 0.15
  }

  if (
    domains.length > 0 &&
    !domains.includes(
      "general",
    )
  ) {
    confidence += 0.1
  }

  if (
    intent ===
      "credentials_request"
  ) {
    confidence += 0.15
  }

  if (
    intent ===
      "memory_management" ||
    intent ===
      "memory_learning"
  ) {
    confidence += 0.15
  }

  const totalMatches =
    actionMatches.length +
    memoryMatches.length +
    memoryManagementMatches.length +
    memoryLearningMatches.length +
    knowledgeMatches.length +
    projectMatches.length +
    customerMatches.length +
    credentialsMatches.length

  confidence +=
    Math.min(
      totalMatches * 0.05,
      0.3,
    )

  return Math.min(
    Number(
      confidence.toFixed(2),
    ),
    1,
  )
}


function createInteractionAnalysis(
  interaction,
) {
  if (
    !interaction ||
    typeof interaction !==
      "object"
  ) {
    return {
      available:
        false,

      mode:
        null,

      modeConfidence:
        null,

      state:
        null,

      stateConfidence:
        null,

      responseStyle:
        null,

      humorAllowed:
        null,

      boundaryRequired:
        null,

      continueHelping:
        true,
    }
  }

  return {
    available:
      true,

    mode:
      interaction.mode ||
      null,

    modeConfidence:
      interaction.modeConfidence ??
      null,

    state:
      interaction.state ||
      null,

    stateConfidence:
      interaction.stateConfidence ??
      null,

    responseStyle:
      interaction.policy
        ?.responseStyle ||
      null,

    humorAllowed:
      interaction.policy
        ?.humorAllowed ??
      null,

    boundaryRequired:
      interaction.policy
        ?.boundaryRequired ??
      null,

    continueHelping:
      interaction.policy
        ?.continueHelping ??
      true,
  }
}


function analyzeMessage(
  message,
  {
    interaction = null,
  } = {},
) {
  const normalizedMessage =
    normalizeText(
      message,
    )

  const actionMatches =
    findMatchingKeywords({
      normalizedMessage,
      keywords:
        actionKeywords,
    })

  const memoryMatches =
    findMatchingKeywords({
      normalizedMessage,
      keywords:
        memoryKeywords,
    })

  const memoryManagementMatches =
    findMatchingPhrases({
      normalizedMessage,
      phrases:
        memoryManagementPhrases,
    })

  const memoryLearningMatches =
    findMatchingPhrases({
      normalizedMessage,
      phrases:
        memoryLearningPhrases,
    })

  const knowledgeMatches =
    findMatchingKeywords({
      normalizedMessage,
      keywords:
        knowledgeKeywords,
    })

  const projectMatches =
    findMatchingKeywords({
      normalizedMessage,
      keywords:
        projectKeywords,
    })

  const customerMatches =
    findMatchingKeywords({
      normalizedMessage,
      keywords:
        customerKeywords,
    })

  const credentialsMatches =
    findMatchingKeywords({
      normalizedMessage,
      keywords:
        credentialsKeywords,
    })

  const memoryMode =
    detectMemoryMode({
      memoryMatches,
      memoryManagementMatches,
      memoryLearningMatches,
    })

  const isQuestion =
    detectQuestion(
      normalizedMessage,
    )

  const intent =
    detectIntent({
      isQuestion,
      actionMatches,
      knowledgeMatches,
      credentialsMatches,
      memoryMode,
    })

  const domains =
    detectDomains({
      projectMatches,
      customerMatches,
      memoryMatches,
      knowledgeMatches,
      credentialsMatches,
    })

  const moduleNeeds =
    detectModuleNeeds({
      intent,
      domains,
    })

  const missingInformation =
    detectMissingInformation({
      normalizedMessage,
      intent,
      domains,
    })

  const confidence =
    calculateConfidence({
      intent,
      domains,
      actionMatches,
      memoryMatches,
      memoryManagementMatches,
      memoryLearningMatches,
      knowledgeMatches,
      projectMatches,
      customerMatches,
      credentialsMatches,
    })

  const interactionAnalysis =
    createInteractionAnalysis(
      interaction,
    )

  return {
    intent,

    domains,

    isQuestion,

    requiresAction:
      moduleNeeds.action,

    moduleNeeds,

    missingInformation,

    confidence,

    interaction:
      interactionAnalysis,

    signals: {
      actionKeywords:
        actionMatches,

      memoryKeywords:
        memoryMatches,

      memoryMode,

      memoryManagementPhrases:
        memoryManagementMatches,

      memoryLearningPhrases:
        memoryLearningMatches,

      knowledgeKeywords:
        knowledgeMatches,

      projectKeywords:
        projectMatches,

      customerKeywords:
        customerMatches,

      credentialsKeywords:
        credentialsMatches,

      interactionAvailable:
        interactionAnalysis
          .available,
    },
  }
}


function createReasoningModule() {
  return createBrainModule({
    id:
      "reasoning",

    name:
      "Reasoning Module",

    version:
      REASONING_MODULE_VERSION,

    description:
      "Analysoi käyttäjän pyynnön, erottaa muistien hallinnan muistiksi oppimisesta ja yhdistää Interaction Enginen tuottaman vuorovaikutuskontekstin reasoning-tulokseen.",

    priority:
      50,

    canHandle({
      runtimeContext,
    }) {
      const reasoningRequested =
        runtimeContext
          ?.reasoningOnly ===
        true

      return {
        matched:
          reasoningRequested,

        confidence:
          reasoningRequested
            ? 1
            : 0,

        reason:
          reasoningRequested
            ? "Reasoning-analyysi pyydettiin erikseen."
            : "Reasoning Modulea ei suoriteta vielä oletusreitityksessä.",

        metadata: {
          reasoningOnly:
            reasoningRequested,

          interactionAvailable:
            Boolean(
              runtimeContext
                ?.interaction,
            ),
        },
      }
    },

    async execute({
      message,
      request,
      runtimeContext,
    }) {
      const analysis =
        analyzeMessage(
          message,
          {
            interaction:
              runtimeContext
                ?.interaction ||
              null,
          },
        )

      return {
        type:
          "reasoning_result",

        requestId:
          request.requestId,

        message,

        moduleVersion:
          REASONING_MODULE_VERSION,

        analysis,
      }
    },
  })
}


export {
  MEMORY_MODES,
  REASONING_MODULE_VERSION,
  analyzeMessage,
  createInteractionAnalysis,
  createReasoningModule,
}
