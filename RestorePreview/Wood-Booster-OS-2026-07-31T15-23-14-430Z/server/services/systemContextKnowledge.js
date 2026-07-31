const MAX_SYSTEM_CONTEXT_LENGTH = 12000


function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return ""
  }

  return String(value)
    .replace(/\r\n/g, "\n")
    .trim()
}


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : []
}


function truncateText(
  value,
  maximumLength,
) {
  const text =
    cleanText(value)

  if (
    text.length <= maximumLength
  ) {
    return text
  }

  return `${text
    .slice(
      0,
      maximumLength,
    )
    .trim()}

[SYSTEM CONTEXT TRUNCATED]`
}


function normalizeSystemContext(
  systemContext,
) {
  if (
    !systemContext ||
    typeof systemContext !== "object"
  ) {
    return null
  }

  return {
    system: {
      id:
        cleanText(
          systemContext.system?.id,
        ),
      name:
        cleanText(
          systemContext.system?.name,
        ),
      version:
        cleanText(
          systemContext.system?.version,
        ),
      environment:
        cleanText(
          systemContext.system?.environment,
        ),
      status:
        cleanText(
          systemContext.system?.status,
        ),
      mode:
        cleanText(
          systemContext.system?.mode,
        ),
    },

    agents:
      safeArray(
        systemContext.agents,
      ).map((agent) => ({
        id:
          cleanText(agent?.id),
        name:
          cleanText(agent?.name),
        status:
          cleanText(agent?.status),
        description:
          cleanText(
            agent?.description,
          ),
        capabilities:
          safeArray(
            agent?.capabilities,
          )
            .map(cleanText)
            .filter(Boolean),
        truthSources:
          safeArray(
            agent?.truthSources,
          )
            .map(cleanText)
            .filter(Boolean),
      })),

    capabilities:
      safeArray(
        systemContext.capabilities,
      ).map((capability) => ({
        id:
          cleanText(
            capability?.id,
          ),
        name:
          cleanText(
            capability?.name,
          ),
        description:
          cleanText(
            capability?.description,
          ),
        enabled:
          Boolean(
            capability?.enabled,
          ),
        actions:
          safeArray(
            capability?.actions,
          )
            .map(cleanText)
            .filter(Boolean),
        tools:
          safeArray(
            capability?.tools,
          )
            .map(cleanText)
            .filter(Boolean),
      })),

    tools:
      safeArray(
        systemContext.tools,
      ).map((tool) => ({
        id:
          cleanText(tool?.id),
        name:
          cleanText(tool?.name),
        description:
          cleanText(
            tool?.description,
          ),
        enabled:
          Boolean(tool?.enabled),
        healthy:
          Boolean(tool?.healthy),
        actions:
          safeArray(
            tool?.actions,
          )
            .map(cleanText)
            .filter(Boolean),
        supportedActions:
          safeArray(
            tool?.supportedActions,
          )
            .map(cleanText)
            .filter(Boolean),
        missingActions:
          safeArray(
            tool?.missingActions,
          )
            .map(cleanText)
            .filter(Boolean),
      })),

    routes:
      safeArray(
        systemContext.routes,
      ).map((route) => ({
        id:
          cleanText(route?.id),
        name:
          cleanText(route?.name),
        path:
          cleanText(route?.path),
        category:
          cleanText(
            route?.category,
          ),
      })),

    actions:
      safeArray(
        systemContext.actions,
      )
        .map(cleanText)
        .filter(Boolean),

    truthSources:
      safeArray(
        systemContext.truthSources,
      )
        .map(cleanText)
        .filter(Boolean),

    summary: {
      ...systemContext.summary,
    },
  }
}


function createSystemContextKnowledge(
  systemContext,
) {
  const normalizedContext =
    normalizeSystemContext(
      systemContext,
    )

  if (!normalizedContext) {
    return null
  }

  const content =
    truncateText(
      JSON.stringify(
        normalizedContext,
        null,
        2,
      ),
      MAX_SYSTEM_CONTEXT_LENGTH,
    )

  return {
    name:
      "AI_OS_SYSTEM_REGISTRY",
    title:
      "Wood-Booster AI OS System Registry",
    category:
      "system_registry",
    content,
  }
}


export {
  createSystemContextKnowledge,
  normalizeSystemContext,
}
