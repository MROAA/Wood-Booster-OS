const navigationCommands = [
  {
    path: "/",
    label: "AI Workspace",
    phrases: [
      "avaa workspace",
      "avaa ai workspace",
      "avaa työtila",
      "siirry workspaceen",
      "mene workspaceen",
      "avaa etusivu",
    ],
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    phrases: [
      "avaa dashboard",
      "avaa dashboardi",
      "näytä dashboard",
      "näytä dashboardi",
      "siirry dashboardiin",
      "mene dashboardiin",
      "avaa yleisnäkymä",
      "näytä yleisnäkymä",
    ],
  },
  {
    path: "/projects",
    label: "Projects",
    phrases: [
      "avaa projektit",
      "näytä projektit",
      "siirry projekteihin",
      "mene projekteihin",
      "avaa projektinhallinta",
      "näytä kaikki projektit",
    ],
  },
  {
    path: "/customers",
    label: "Customers",
    phrases: [
      "avaa asiakkaat",
      "näytä asiakkaat",
      "siirry asiakkaisiin",
      "mene asiakkaisiin",
      "avaa crm",
      "näytä crm",
      "siirry crm näkymään",
    ],
  },
  {
    path: "/agents",
    label: "AI Agents",
    phrases: [
      "avaa agentit",
      "näytä agentit",
      "avaa ai agentit",
      "näytä ai agentit",
      "siirry agentteihin",
    ],
  },
  {
    path: "/knowledge",
    label: "Knowledge",
    phrases: [
      "avaa knowledge",
      "avaa tietopankki",
      "näytä tietopankki",
      "siirry tietopankkiin",
      "mene tietopankkiin",
      "avaa tieto",
    ],
  },
  {
    path: "/memory",
    label: "Memory",
    phrases: [
      "avaa memory",
      "avaa muisti",
      "näytä muisti",
      "siirry muistiin",
      "mene muistiin",
    ],
  },
  {
    path: "/tools",
    label: "Tools",
    phrases: [
      "avaa tools",
      "avaa työkalut",
      "näytä työkalut",
      "siirry työkaluihin",
      "mene työkaluihin",
    ],
  },
  {
    path: "/settings",
    label: "Settings",
    phrases: [
      "avaa settings",
      "avaa asetukset",
      "näytä asetukset",
      "siirry asetuksiin",
      "mene asetuksiin",
    ],
  },
]

function normalizeCommandText(value) {
  return String(value || "")
    .toLocaleLowerCase("fi-FI")
    .replace(/[.,!?;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanEntityName(value) {
  return String(value || "")
    .replace(
      /^(nimeltä|nimellä)\s+/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim()
}

function isValidEntityName(value) {
  return (
    value.length >= 2 &&
    value.length <= 120
  )
}

function createNavigateAction(command) {
  return {
    type: "navigate",
    path: command.path,
    label: command.label,
    source: "local-command-parser",
  }
}

function createProjectAction(projectName) {
  return {
    type: "create_project",
    label: `Luo projekti: ${projectName}`,
    source: "local-command-parser",
    payload: {
      name: projectName,
      status: "Suunnittelu",
    },
  }
}

function createCustomerAction(customerName) {
  return {
    type: "create_customer",
    label: `Luo asiakas: ${customerName}`,
    source: "local-command-parser",
    payload: {
      name: customerName,
      email: "",
      phone: "",
      company: "",
      notes: "",
    },
  }
}

function parseCreateProjectCommand(message) {
  const originalMessage =
    String(message || "").trim()

  if (!originalMessage) {
    return null
  }

  const patterns = [
    /^luo uusi projekti(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
    /^luo projekti(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
    /^tee uusi projekti(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
    /^tee projekti(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
    /^aloita uusi projekti(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match =
      originalMessage.match(pattern)

    if (!match) {
      continue
    }

    const projectName =
      cleanEntityName(match[1])

    if (
      !isValidEntityName(
        projectName,
      )
    ) {
      return null
    }

    return createProjectAction(
      projectName,
    )
  }

  return null
}

function parseCreateCustomerCommand(message) {
  const originalMessage =
    String(message || "").trim()

  if (!originalMessage) {
    return null
  }

  const patterns = [
    /^luo uusi asiakas(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
    /^luo asiakas(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
    /^lisää uusi asiakas(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
    /^lisää asiakas(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
    /^tee uusi asiakas(?:\s+nimeltä|\s+nimellä)?\s+(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match =
      originalMessage.match(pattern)

    if (!match) {
      continue
    }

    const customerName =
      cleanEntityName(match[1])

    if (
      !isValidEntityName(
        customerName,
      )
    ) {
      return null
    }

    return createCustomerAction(
      customerName,
    )
  }

  return null
}

function parseDirectNavigationCommand(message) {
  const normalizedMessage =
    normalizeCommandText(message)

  if (!normalizedMessage) {
    return null
  }

  for (const command of navigationCommands) {
    const exactMatch =
      command.phrases.some(
        (phrase) =>
          normalizedMessage === phrase,
      )

    if (exactMatch) {
      return createNavigateAction(
        command,
      )
    }
  }

  return null
}

function parseFlexibleNavigationCommand(message) {
  const normalizedMessage =
    normalizeCommandText(message)

  if (!normalizedMessage) {
    return null
  }

  const navigationWords = [
    "avaa",
    "näytä",
    "siirry",
    "mene",
  ]

  const containsNavigationWord =
    navigationWords.some((word) =>
      normalizedMessage.includes(word),
    )

  if (!containsNavigationWord) {
    return null
  }

  for (const command of navigationCommands) {
    const phraseMatch =
      command.phrases.some(
        (phrase) =>
          normalizedMessage.includes(
            phrase,
          ),
      )

    if (phraseMatch) {
      return createNavigateAction(
        command,
      )
    }
  }

  const fallbackTargets = [
    {
      words: [
        "projekti",
        "projektit",
        "projects",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/projects",
      ),
    },
    {
      words: [
        "asiakas",
        "asiakkaat",
        "customers",
        "crm",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/customers",
      ),
    },
    {
      words: [
        "tietopankki",
        "knowledge",
        "tieto",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/knowledge",
      ),
    },
    {
      words: [
        "muisti",
        "memory",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/memory",
      ),
    },
    {
      words: [
        "työkalut",
        "tools",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/tools",
      ),
    },
    {
      words: [
        "asetukset",
        "settings",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/settings",
      ),
    },
    {
      words: [
        "agentit",
        "agents",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/agents",
      ),
    },
    {
      words: [
        "dashboard",
        "dashboardi",
        "yleisnäkymä",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/dashboard",
      ),
    },
    {
      words: [
        "workspace",
        "työtila",
        "etusivu",
      ],
      command: navigationCommands.find(
        (item) =>
          item.path === "/",
      ),
    },
  ]

  for (const target of fallbackTargets) {
    const matchesTarget =
      target.words.some((word) =>
        normalizedMessage.includes(word),
      )

    if (
      matchesTarget &&
      target.command
    ) {
      return createNavigateAction(
        target.command,
      )
    }
  }

  return null
}

function parseAICommand(message) {
  return (
    parseCreateProjectCommand(
      message,
    ) ||
    parseCreateCustomerCommand(
      message,
    ) ||
    parseDirectNavigationCommand(
      message,
    ) ||
    parseFlexibleNavigationCommand(
      message,
    )
  )
}

function isNavigationCommand(message) {
  const action =
    parseAICommand(message)

  return (
    action?.type === "navigate"
  )
}

function isProjectCreationCommand(message) {
  const action =
    parseAICommand(message)

  return (
    action?.type ===
    "create_project"
  )
}

function isCustomerCreationCommand(message) {
  const action =
    parseAICommand(message)

  return (
    action?.type ===
    "create_customer"
  )
}

export {
  isCustomerCreationCommand,
  isNavigationCommand,
  isProjectCreationCommand,
  normalizeCommandText,
  parseAICommand,
  parseCreateCustomerCommand,
  parseCreateProjectCommand,
}
