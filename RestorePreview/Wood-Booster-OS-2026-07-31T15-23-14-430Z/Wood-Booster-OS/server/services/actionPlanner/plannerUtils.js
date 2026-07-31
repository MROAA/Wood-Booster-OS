function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[!?.,:;]/g, " ")
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
}


function includesPhrase(
  normalizedMessage,
  phrase,
) {
  const normalizedPhrase =
    normalizeText(phrase)

  if (!normalizedPhrase) {
    return false
  }

  return (
    normalizedMessage ===
      normalizedPhrase ||
    normalizedMessage.includes(
      normalizedPhrase,
    )
  )
}


function cleanTextValue(value) {
  return String(value || "")
    .trim()
    .replace(/^["'“”]+/, "")
    .replace(/["'“”]+$/, "")
    .replace(/[!?.,:;]+$/, "")
    .trim()
}


function splitMessageIntoCommands(
  message,
) {
  const rawMessage =
    String(message || "")
      .trim()

  if (!rawMessage) {
    return []
  }

  const commands =
    rawMessage
      .split(
        /\s+(?:ja sitten|jonka jälkeen|sen jälkeen|ja)\s+|[;\n]+/i,
      )
      .map(
        (command) =>
          command.trim(),
      )
      .filter(Boolean)

  if (commands.length === 0) {
    return [
      rawMessage,
    ]
  }

  return commands
}


function getActiveProject(
  runtimeContext,
) {
  const activeProject =
    runtimeContext?.activeProject

  if (
    !activeProject ||
    typeof activeProject !==
      "object" ||
    !activeProject.id
  ) {
    return null
  }

  return {
    id:
      activeProject.id,

    name:
      activeProject.name ||
      null,

    status:
      activeProject.status ||
      null,

    notes:
      activeProject.notes ||
      null,

    customerId:
      activeProject.customerId ||
      null,
  }
}


function createActionResult({
  matched = false,
  actions = [],
  answer = null,
  reason = null,
}) {
  const safeActions =
    Array.isArray(actions)
      ? actions.filter(Boolean)
      : []

  return {
    matched,

    action:
      safeActions[0] ||
      null,

    actions:
      safeActions,

    answer,

    reason,
  }
}


function createNoMatchResult(
  reason = "planner did not match",
) {
  return createActionResult({
    matched: false,
    actions: [],
    answer: null,
    reason,
  })
}


export {
  cleanTextValue,
  createActionResult,
  createNoMatchResult,
  getActiveProject,
  includesPhrase,
  normalizeText,
  splitMessageIntoCommands,
}
