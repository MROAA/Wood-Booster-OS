import {
  cleanTextValue,
  includesPhrase,
  normalizeText,
  splitMessageIntoCommands,
} from "./plannerUtils.js"

import {
  getRequestedProjectName,
} from "./createProjectPlanner.js"

import {
  findRequestedProjectStatus,
} from "./updateProjectPlanner.js"

import {
  findRequestedProjectTab,
} from "./openProjectPlanner.js"


const unknownIntentId =
  "unknown"


const projectStatusDefinitions = [
  {
    status:
      "Suunnittelu",

    keywords: [
      "suunnittelu",
      "suunnittelussa",
      "suunnitteluun",
      "suunnitteluvaihe",
      "planning",
    ],
  },

  {
    status:
      "Valmistus",

    keywords: [
      "valmistus",
      "valmistuksessa",
      "valmistukseen",
      "tuotanto",
      "tuotannossa",
      "tuotantoon",
      "production",
    ],
  },

  {
    status:
      "Valmis",

    keywords: [
      "valmis",
      "valmiina",
      "valmiiksi",
      "valmistunut",
      "valmistuneeksi",
      "completed",
      "complete",
      "done",
    ],
  },
]


const projectTabDefinitions = [
  {
    id:
      "overview",

    keywords: [
      "projektin tiedot",
      "perustiedot",
      "yleiskatsaus",
      "yhteenveto",
      "overview",
    ],
  },

  {
    id:
      "ai",

    keywords: [
      "ai assistant",
      "ai avustaja",
      "projektin chat",
      "projektin ai",
      "tekoäly",
    ],
  },

  {
    id:
      "tools",

    keywords: [
      "projektityökalut",
      "työkaluihin",
      "työkalut",
      "tools",
      "tool",
    ],
  },

  {
    id:
      "notes",

    keywords: [
      "notes välilehti",
      "muistiinpanoihin",
      "muistiinpanot",
      "muistiinpano",
      "notesiin",
      "notes",
      "note",
    ],
  },

  {
    id:
      "memory",

    keywords: [
      "projektimuisti",
      "memory",
      "muistiin",
      "muisti",
    ],
  },

  {
    id:
      "knowledge",

    keywords: [
      "projektin tieto",
      "projektitieto",
      "tietopankki",
      "knowledge",
    ],
  },

  {
    id:
      "files",

    keywords: [
      "projektitiedostot",
      "tiedostoihin",
      "tiedostot",
      "files",
      "file",
      "kuvat",
    ],
  },
]


const createProjectSignals = [
  "luo uusi projekti",
  "luo projekti",
  "tee uusi projekti",
  "tee projekti",
  "perusta uusi projekti",
  "perusta projekti",
  "create a new project",
  "create project",
]


const updateProjectSignals = [
  "vaihda projektin tila",
  "muuta projektin tila",
  "aseta projektin tila",
  "päivitä projektin tila",
  "merkitse projekti",
  "siirrä projekti",
  "set project status",
  "change project status",
  "mark project",
]


const openProjectSignals = [
  "vaihda välilehti",
  "voisitko avata",
  "voisitko näyttää",
  "avaa",
  "avata",
  "näytä",
  "näyttää",
  "siirry",
  "siirtyä",
  "mene",
  "mennä",
  "open",
  "show",
  "go to",
]


function createEmptyEntities() {
  return {
    projectName:
      null,

    projectStatus:
      null,

    projectTab:
      null,
  }
}


function createIntentResult({
  intentId = unknownIntentId,
  confidence = 0,
  entities = null,
  signals = [],
  originalMessage = "",
  normalizedMessage = "",
  commandIndex = 0,
}) {
  return {
    intentId,

    confidence,

    entities:
      entities ||
      createEmptyEntities(),

    signals:
      Array.isArray(signals)
        ? [...new Set(signals)]
        : [],

    originalMessage:
      String(originalMessage || "")
        .trim(),

    normalizedMessage:
      String(normalizedMessage || "")
        .trim(),

    commandIndex,

    isKnown:
      intentId !==
      unknownIntentId,
  }
}


function containsAnyPhrase(
  normalizedMessage,
  phrases,
) {
  return phrases.some(
    (phrase) =>
      includesPhrase(
        normalizedMessage,
        phrase,
      ),
  )
}


function findMentionedProjectStatus(
  message,
) {
  const normalizedMessage =
    normalizeText(message)

  if (!normalizedMessage) {
    return null
  }

  const statusDefinition =
    projectStatusDefinitions.find(
      (definition) =>
        definition.keywords.some(
          (keyword) =>
            includesPhrase(
              normalizedMessage,
              keyword,
            ),
        ),
    )

  return (
    statusDefinition?.status ||
    null
  )
}


function findMentionedProjectTab(
  message,
) {
  const normalizedMessage =
    normalizeText(message)

  if (!normalizedMessage) {
    return null
  }

  const tabDefinition =
    projectTabDefinitions.find(
      (definition) =>
        definition.keywords.some(
          (keyword) =>
            includesPhrase(
              normalizedMessage,
              keyword,
            ),
        ),
    )

  return (
    tabDefinition?.id ||
    null
  )
}


function findReferencedProjectName(
  message,
) {
  const rawMessage =
    String(message || "")
      .trim()

  if (!rawMessage) {
    return null
  }

  const requestedProjectName =
    getRequestedProjectName(
      rawMessage,
    )

  if (requestedProjectName) {
    return requestedProjectName
  }

  const patterns = [
    /^(.+?)-projekti\b/i,

    /^projekti\s+["'“”]?(.+?)["'“”]?\s+(?:on|näyttää|vaikuttaa)\b/i,
  ]

  for (const pattern of patterns) {
    const match =
      rawMessage.match(pattern)

    if (!match?.[1]) {
      continue
    }

    const projectName =
      cleanTextValue(
        match[1],
      )

    if (projectName) {
      return projectName
    }
  }

  return null
}


function analyzeCreateProjectIntent({
  message,
  normalizedMessage,
  commandIndex,
}) {
  const projectName =
    getRequestedProjectName(
      message,
    )

  const hasCreateSignal =
    containsAnyPhrase(
      normalizedMessage,
      createProjectSignals,
    )

  if (
    !hasCreateSignal &&
    !projectName
  ) {
    return null
  }

  const signals = [
    "create_project",
  ]

  if (projectName) {
    signals.push(
      "project_name",
    )
  }

  return createIntentResult({
    intentId:
      "create_project",

    confidence:
      projectName
        ? 1
        : 0.75,

    entities: {
      ...createEmptyEntities(),

      projectName,
    },

    signals,

    originalMessage:
      message,

    normalizedMessage,

    commandIndex,
  })
}


function analyzeUpdateProjectIntent({
  message,
  normalizedMessage,
  commandIndex,
}) {
  const requestedStatus =
    findRequestedProjectStatus(
      message,
    )

  const mentionedStatus =
    findMentionedProjectStatus(
      message,
    )

  const projectName =
    findReferencedProjectName(
      message,
    )

  const hasUpdateSignal =
    containsAnyPhrase(
      normalizedMessage,
      updateProjectSignals,
    )

  if (
    !hasUpdateSignal &&
    !requestedStatus
  ) {
    return null
  }

  const projectStatus =
    requestedStatus ||
    mentionedStatus

  const signals = [
    "update_project",
  ]

  if (projectStatus) {
    signals.push(
      "status_change",
    )
  }

  if (projectName) {
    signals.push(
      "project_name",
    )
  }

  return createIntentResult({
    intentId:
      "update_project",

    confidence:
      projectStatus
        ? 1
        : 0.7,

    entities: {
      ...createEmptyEntities(),

      projectName,

      projectStatus,
    },

    signals,

    originalMessage:
      message,

    normalizedMessage,

    commandIndex,
  })
}


function analyzeOpenProjectTabIntent({
  message,
  normalizedMessage,
  commandIndex,
}) {
  const plannerTab =
    findRequestedProjectTab(
      message,
    )

  const mentionedTab =
    findMentionedProjectTab(
      message,
    )

  const hasOpenSignal =
    containsAnyPhrase(
      normalizedMessage,
      openProjectSignals,
    )

  if (
    !hasOpenSignal ||
    (
      !plannerTab &&
      !mentionedTab
    )
  ) {
    return null
  }

  const projectTab =
    plannerTab?.id ||
    mentionedTab

  return createIntentResult({
    intentId:
      "open_project_tab",

    confidence:
      plannerTab
        ? 1
        : 0.9,

    entities: {
      ...createEmptyEntities(),

      projectTab,
    },

    signals: [
      "open_project_tab",
      "project_tab",
    ],

    originalMessage:
      message,

    normalizedMessage,

    commandIndex,
  })
}


function analyzeUnknownIntent({
  message,
  normalizedMessage,
  commandIndex,
}) {
  const projectName =
    findReferencedProjectName(
      message,
    )

  const projectStatus =
    findMentionedProjectStatus(
      message,
    )

  const projectTab =
    findMentionedProjectTab(
      message,
    )

  const signals = []

  if (projectName) {
    signals.push(
      "project_name",
    )
  }

  if (projectStatus) {
    signals.push(
      "project_status_reference",
    )
  }

  if (projectTab) {
    signals.push(
      "project_tab_reference",
    )
  }

  return createIntentResult({
    intentId:
      unknownIntentId,

    confidence:
      signals.length > 0
        ? 0.35
        : 0,

    entities: {
      projectName,
      projectStatus,
      projectTab,
    },

    signals,

    originalMessage:
      message,

    normalizedMessage,

    commandIndex,
  })
}


function analyzeSingleIntent({
  message,
  commandIndex = 0,
}) {
  const originalMessage =
    String(message || "")
      .trim()

  const normalizedMessage =
    normalizeText(
      originalMessage,
    )

  if (!normalizedMessage) {
    return createIntentResult({
      intentId:
        unknownIntentId,

      confidence:
        0,

      entities:
        createEmptyEntities(),

      signals: [
        "empty_message",
      ],

      originalMessage,

      normalizedMessage,

      commandIndex,
    })
  }

  const analyzers = [
    analyzeCreateProjectIntent,
    analyzeUpdateProjectIntent,
    analyzeOpenProjectTabIntent,
  ]

  for (const analyzer of analyzers) {
    const intent =
      analyzer({
        message:
          originalMessage,

        normalizedMessage,

        commandIndex,
      })

    if (intent) {
      return intent
    }
  }

  return analyzeUnknownIntent({
    message:
      originalMessage,

    normalizedMessage,

    commandIndex,
  })
}


function analyzeIntents({
  message,
}) {
  const originalMessage =
    String(message || "")
      .trim()

  const commands =
    splitMessageIntoCommands(
      originalMessage,
    )

  const intents =
    commands.map(
      (command, commandIndex) =>
        analyzeSingleIntent({
          message:
            command,

          commandIndex,
        }),
    )

  const knownIntents =
    intents.filter(
      (intent) =>
        intent.isKnown,
    )

  return {
    version:
      1,

    originalMessage,

    commandCount:
      commands.length,

    hasMultipleCommands:
      commands.length > 1,

    hasKnownIntent:
      knownIntents.length > 0,

    hasUnknownIntent:
      intents.some(
        (intent) =>
          !intent.isKnown,
      ),

    primaryIntent:
      knownIntents[0] ||
      intents[0] ||
      null,

    intents,
  }
}


function getIntentAnalyzerInfo() {
  return {
    version:
      1,

    deterministic:
      true,

    usesLLM:
      false,

    supportsMultipleCommands:
      true,

    supportedIntents: [
      "create_project",
      "update_project",
      "open_project_tab",
      unknownIntentId,
    ],

    supportedEntities: [
      "projectName",
      "projectStatus",
      "projectTab",
    ],
  }
}


export {
  analyzeIntents,
  analyzeSingleIntent,
  findMentionedProjectStatus,
  findMentionedProjectTab,
  findReferencedProjectName,
  getIntentAnalyzerInfo,
}
