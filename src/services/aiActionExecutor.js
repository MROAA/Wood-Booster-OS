import {
  executeCapabilityToolchain,
} from "./capabilities/capabilityToolchain"


function normalizeAction(action) {
  if (!action) {
    return null
  }

  if (typeof action === "string") {
    return {
      type: "navigate",
      path: action,
    }
  }

  if (
    typeof action !== "object" ||
    Array.isArray(action)
  ) {
    return null
  }

  return action
}


function createResult({
  success,
  type,
  message,
  action = null,
}) {
  return {
    success,
    type,
    message,
    action,
  }
}


async function executeAIAction({
  action,
  navigate,
}) {
  const normalizedAction =
    normalizeAction(action)

  if (!normalizedAction) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "AI ei palauttanut suoritettavaa toimintoa.",
      action,
    })
  }

  try {
    return await executeCapabilityToolchain({
      action: normalizedAction,
      navigate,
    })
  } catch (error) {
    console.error(
      "AI Action Executor error:",
      error,
    )

    return createResult({
      success: false,
      type: "executor_error",
      message:
        error?.message ||
        "AI-toiminnon suorittaminen epäonnistui.",
      action: normalizedAction,
    })
  }
}


export {
  executeAIAction,
}
