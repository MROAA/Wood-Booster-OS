import {
  parseAICommand,
} from "./aiCommandParser"

import {
  createCapabilityPlan,
} from "./capabilities/capabilityPlanner"


const commandSeparators = [
  /\s+ja\s+sen\s+jälkeen\s+/i,
  /\s+ja\s+sitten\s+/i,
  /\s+sen\s+jälkeen\s+/i,
  /\s+ja\s+seuraavaksi\s+/i,
  /\s+seuraavaksi\s+/i,
  /\s*;\s*/,
]


const navigationVerbs = [
  "avaa",
  "näytä",
  "siirry",
  "mene",
]


function normalizeMessage(
  message,
) {
  return String(
    message ||
    "",
  )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
}


function splitCommandMessage(
  message,
) {
  const normalizedMessage =
    normalizeMessage(
      message,
    )

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


function getCommandVerb(
  commandPart,
) {
  const normalizedPart =
    normalizeMessage(
      commandPart,
    )
      .toLocaleLowerCase(
        "fi-FI",
      )

  return (
    navigationVerbs.find(
      (verb) =>
        normalizedPart ===
          verb ||
        normalizedPart.startsWith(
          `${verb} `,
        ),
    ) ||
    null
  )
}


function hasCommandVerb(
  commandPart,
) {
  return Boolean(
    getCommandVerb(
      commandPart,
    ),
  )
}


function addInheritedVerb({
  commandPart,
  inheritedVerb,
}) {
  if (
    !commandPart ||
    !inheritedVerb ||
    hasCommandVerb(
      commandPart,
    )
  ) {
    return commandPart
  }

  return `${inheritedVerb} ${commandPart}`
}


function normalizeCommandParts(
  commandParts,
) {
  if (
    !Array.isArray(
      commandParts,
    ) ||
    commandParts.length ===
      0
  ) {
    return []
  }

  let inheritedVerb =
    null

  return commandParts.map(
    (
      commandPart,
      index,
    ) => {
      const currentVerb =
        getCommandVerb(
          commandPart,
        )

      if (currentVerb) {
        inheritedVerb =
          currentVerb

        return commandPart
      }

      if (
        index > 0 &&
        inheritedVerb
      ) {
        return addInheritedVerb({
          commandPart,
          inheritedVerb,
        })
      }

      return commandPart
    },
  )
}


function parseAICommandQueue(
  message,
) {
  const commandParts =
    normalizeCommandParts(
      splitCommandMessage(
        message,
      ),
    )

  if (
    commandParts.length ===
      0
  ) {
    return []
  }

  const actions = []

  for (
    const commandPart
    of commandParts
  ) {
    const action =
      parseAICommand(
        commandPart,
      )

    if (!action) {
      return []
    }

    actions.push(
      action,
    )
  }

  return actions
}


function parseLocalAICommand(
  message,
) {
  const actions =
    parseAICommandQueue(
      message,
    )

  if (
    actions.length === 0
  ) {
    return null
  }

  return createCapabilityPlan({
    actions,

    source:
      actions.length === 1
        ? "local-command-parser"
        : "local-command-queue-parser",
  })
}


function isMultiActionCommand(
  message,
) {
  return (
    parseAICommandQueue(
      message,
    ).length > 1
  )
}


export {
  isMultiActionCommand,
  parseAICommandQueue,
  parseLocalAICommand,
  splitCommandMessage,
}
