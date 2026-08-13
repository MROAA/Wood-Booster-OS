const navigationCommands = [
  {
    type: "navigate",
    path: "/",
    label: "AI Workspace",
    capability:
      "workspace_navigation",
    keywords: [
      "avaa ai workspace",
      "avaa workspace",
      "siirry workspaceen",
      "näytä workspace",
      "avaa ai brain",
    ],
  },
  {
    type: "navigate",
    path: "/dashboard",
    label: "Dashboard",
    capability:
      "workspace_navigation",
    keywords: [
      "avaa dashboard",
      "näytä dashboard",
      "siirry dashboardiin",
      "avaa etusivu",
      "näytä etusivu",
    ],
  },
  {
    type: "navigate",
    path: "/projects",
    label: "Projektit",
    capability:
      "project_navigation",
    keywords: [
      "avaa projektit",
      "näytä projektit",
      "siirry projekteihin",
      "avaa projects",
      "show projects",
      "open projects",
    ],
  },
  {
    type: "navigate",
    path: "/customers",
    label: "Asiakkaat",
    capability:
      "customer_navigation",
    keywords: [
      "avaa asiakkaat",
      "näytä asiakkaat",
      "siirry asiakkaisiin",
      "avaa crm",
      "näytä crm",
      "open customers",
    ],
  },
  {
    type: "navigate",
    path: "/knowledge",
    label: "Knowledge",
    capability:
      "knowledge_navigation",
    keywords: [
      "avaa knowledge",
      "näytä knowledge",
      "avaa tietopankki",
      "näytä tietopankki",
      "siirry tietopankkiin",
    ],
  },
  {
    type: "navigate",
    path: "/memory",
    label: "Muisti",
    capability:
      "memory_navigation",
    keywords: [
      "avaa muisti",
      "näytä muisti",
      "siirry muistiin",
      "open memory",
    ],
  },
  {
    type: "navigate",
    path: "/tools",
    label: "Työkalut",
    capability:
      "tools_navigation",
    keywords: [
      "avaa työkalut",
      "näytä työkalut",
      "siirry työkaluihin",
      "avaa tools",
      "open tools",
    ],
  },
  {
    type: "navigate",
    path: "/settings",
    label: "Asetukset",
    capability:
      "settings_navigation",
    keywords: [
      "avaa asetukset",
      "näytä asetukset",
      "siirry asetuksiin",
      "avaa settings",
      "open settings",
    ],
  },
]


const commandSeparators = [
  /\s+ja\s+sitten\s+/i,
  /\s+sen\s+jälkeen\s+/i,
  /\s+ja\s+seuraavaksi\s+/i,
  /\s*;\s*/,
]


function normalizeMessage(message) {
  return String(message || "")
    .trim()
    .toLowerCase()
    .replace(/[!?.,:]/g, "")
    .replace(/\s+/g, " ")
}


function splitActionCommands(message) {
  const normalizedMessage =
    normalizeMessage(message)

  if (!normalizedMessage) {
    return []
  }

  let commandParts = [
    normalizedMessage,
  ]

  for (
    const separator
    of commandSeparators
  ) {
    commandParts =
      commandParts.flatMap(
        (commandPart) =>
          commandPart.split(
            separator,
          ),
      )
  }

  return commandParts
    .map(
      (commandPart) =>
        commandPart.trim(),
    )
    .filter(Boolean)
}


function findNavigationAction(
  commandMessage,
) {
  const normalizedCommand =
    normalizeMessage(
      commandMessage,
    )

  const command =
    navigationCommands.find(
      (
        navigationCommand,
      ) =>
        navigationCommand
          .keywords
          .some(
            (keyword) =>
              normalizedCommand ===
              keyword,
          ),
    )

  if (!command) {
    return null
  }

  return {
    type:
      command.type,

    path:
      command.path,

    label:
      command.label,

    capability:
      command.capability,
  }
}


function createIntentAnalysis({
  message,
  commandParts,
  actions,
  unknownCommands,
}) {
  const primaryAction =
    actions[0] || null

  return {
    primaryIntent:
      primaryAction
        ? primaryAction.type
        : "unknown",

    intent:
      primaryAction
        ? primaryAction.type
        : "unknown",

    intents:
      actions.map(
        (action) => ({
          intent:
            action.type,

          target:
            action.path,

          label:
            action.label,

          capability:
            action.capability,
        }),
      ),

    commandCount:
      commandParts.length,

    recognizedCommandCount:
      actions.length,

    unknownCommandCount:
      unknownCommands.length,

    unknownCommands,

    confidence:
      commandParts.length > 0
        ? actions.length /
          commandParts.length
        : 0,

    source:
      "action-planner",

    message,
  }
}


function createPlannerDecision({
  actions,
  complete,
}) {
  const capabilities = [
    ...new Set(
      actions
        .map(
          (action) =>
            action.capability,
        )
        .filter(Boolean),
    ),
  ]

  return {
    plannerId:
      "navigation-action-planner",

    selectedPlanner:
      "navigation-action-planner",

    hasMatchedPlanner:
      actions.length > 0,

    complete,

    confidence:
      complete
        ? 1
        : actions.length > 0
          ? 0.5
          : 0,

    capabilities,

    reason:
      complete
        ? "Kaikki komennot tunnistettiin navigointitoiminnoiksi."
        : actions.length > 0
          ? "Osa komennoista tunnistettiin navigointitoiminnoiksi."
          : "Navigointikomentoja ei tunnistettu.",

    source:
      "action-planner",
  }
}


function createExecutionPlan(
  actions,
) {
  return {
    id:
      `execution-plan-${Date.now()}`,

    type:
      "sequential",

    source:
      "action-planner",

    totalSteps:
      actions.length,

    steps:
      actions.map(
        (action, index) => {
          const stepId =
            `step-${index + 1}`

          return {
            id:
              stepId,

            index,

            order:
              index + 1,

            plannerId:
              "navigation-action-planner",

            capability:
              action.capability,

            command:
              action.label,

            action,

            dependsOn:
              index === 0
                ? []
                : [
                    `step-${index}`,
                  ],
          }
        },
      ),
  }
}


function planActions(message) {
  const commandParts =
    splitActionCommands(
      message,
    )

  if (
    commandParts.length < 2
  ) {
    const actions = []
    const unknownCommands = []

    const intentAnalysis =
      createIntentAnalysis({
        message,
        commandParts,
        actions,
        unknownCommands,
      })

    const plannerDecision =
      createPlannerDecision({
        actions,
        complete: false,
      })

    const executionPlan =
      createExecutionPlan(
        actions,
      )

    return {
      matched: false,
      complete: false,
      actions,
      unknownCommands,
      intentAnalysis,
      plannerDecision,
      executionPlan,
    }
  }

  const actions = []
  const unknownCommands = []

  for (
    const commandPart
    of commandParts
  ) {
    const action =
      findNavigationAction(
        commandPart,
      )

    if (!action) {
      unknownCommands.push(
        commandPart,
      )

      continue
    }

    actions.push(action)
  }

  const complete =
    actions.length ===
      commandParts.length &&
    unknownCommands.length === 0

  const intentAnalysis =
    createIntentAnalysis({
      message,
      commandParts,
      actions,
      unknownCommands,
    })

  const plannerDecision =
    createPlannerDecision({
      actions,
      complete,
    })

  const executionPlan =
    createExecutionPlan(
      actions,
    )

  return {
    matched:
      actions.length > 0,

    complete,

    actions,

    unknownCommands,

    intentAnalysis,

    plannerDecision,

    executionPlan,
  }
}


function createActionPlanAnswer(
  actions,
) {
  if (
    !Array.isArray(actions) ||
    actions.length === 0
  ) {
    return ""
  }

  const actionLabels =
    actions.map(
      (action, index) =>
        `${index + 1}. ${action.label}`,
    )

  return (
    `Suoritan ${actions.length} toimintoa järjestyksessä:\n\n` +
    actionLabels.join("\n")
  )
}


export {
  createActionPlanAnswer,
  createExecutionPlan,
  createIntentAnalysis,
  createPlannerDecision,
  findNavigationAction,
  normalizeMessage,
  planActions,
  splitActionCommands,
}
