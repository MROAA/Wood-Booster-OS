import {
  executeNavigationTool,
  supportsNavigationAction,
} from "./navigationTool"

import {
  executeProjectTool,
  supportsProjectAction,
} from "./projectTool"

import {
  executeCustomerTool,
  supportsCustomerAction,
} from "./customerTool"

import {
  findToolByAction,
} from "./toolManifest"

function createResult({
  success,
  type,
  message,
  action = null,
  data = null,
}) {
  return {
    success,
    type,
    message,
    action,
    data,
  }
}

function normalizeActionType(action) {
  return String(
    action?.type || "",
  )
    .trim()
    .toLowerCase()
}

async function executeRegisteredTool({
  action,
  navigate,
}) {
  const actionType =
    normalizeActionType(action)

  if (!actionType) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "AI-toiminnon tyyppi puuttuu.",
      action,
    })
  }

  const tool =
    findToolByAction(actionType)

  if (!tool) {
    return createResult({
      success: false,
      type: "unsupported",
      message: `Tool Manifest ei löytänyt aktiivista työkalua toiminnolle: ${actionType}.`,
      action,
    })
  }

  if (
    tool.id === "navigation" &&
    supportsNavigationAction(
      actionType,
    )
  ) {
    return executeNavigationTool({
      action,
      actionType,
      navigate,
    })
  }

  if (
    tool.id === "projects" &&
    supportsProjectAction(
      actionType,
    )
  ) {
    return executeProjectTool({
      action,
      actionType,
      navigate,
    })
  }

  if (
    tool.id === "customers" &&
    supportsCustomerAction(
      actionType,
    )
  ) {
    return executeCustomerTool({
      action,
      actionType,
      navigate,
    })
  }

  return createResult({
    success: false,
    type: "configuration_error",
    message: `Työkalu "${tool.name}" löytyi, mutta sen suorittajaa ei ole rekisteröity.`,
    action,
    data: {
      toolId: tool.id,
      actionType,
    },
  })
}

export {
  executeRegisteredTool,
  normalizeActionType,
}
