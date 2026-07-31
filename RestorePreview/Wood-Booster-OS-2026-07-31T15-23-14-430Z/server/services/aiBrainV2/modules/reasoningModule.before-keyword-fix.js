/*
=====================================
WOOD-BOOSTER AI BRAIN V2

REASONING MODULE V1.2

Vastuut:
- analysoi käyttäjän pyynnön
- tunnistaa pyynnön tavoitteen
- tunnistaa mahdolliset moduulitarpeet
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
  "1.2.0"


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
  "api-avain",
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
  return String(value || "")
    .trim()
    .toLowerCase()
}


function includesKeyword(
  normalizedMessage,
  keyword,
) {
  const normalizedKeyword =
    normalizeText(
      keyword,
    )

  if (!normalizedKeyword) {
    return false
  }

  return normalizedMessage.includes(
    normalizedKeyword,
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


function detectIntent({
  isQuestion,
  actionMatches,
  memoryMatches,
  knowledgeMatches,
  credentialsMatches,
}) {
  if (
    credentialsMatches.length > 0
  ) {
    return "credentials_request"
  }

  if (
    memoryMatches.length > 0 &&
    actionMatches.length > 0
  ) {
    return "memory_action"
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

  return {
    action:
      intent === "action_request" ||
      intent === "memory_action" ||
      intent === "knowledge_action",

    memory:
      domains.includes(
        "memory",
      ),

    knowledge:
      domains.includes(
        "knowledge",
      ),

    credentials:
      credentialsNeeded,

    conversation:
      !credentialsNeeded &&
      (
        intent ===
          "conversation" ||
        intent ===
          "information_request"
      ),

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

  if (
    projectDomainDetected &&
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

  const totalMatches =
    actionMatches.length +
    memoryMatches.length +
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

  const isQuestion =
    detectQuestion(
      normalizedMessage,
    )

  const intent =
    detectIntent({
      isQuestion,
      actionMatches,
      memoryMatches,
      knowledgeMatches,
      credentialsMatches,
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
      "Analysoi käyttäjän pyynnön ja yhdistää Interaction Enginen tuottaman vuorovaikutuskontekstin rakenteiseen reasoning-tulokseen.",

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
  REASONING_MODULE_VERSION,
  analyzeMessage,
  createInteractionAnalysis,
  createReasoningModule,
}