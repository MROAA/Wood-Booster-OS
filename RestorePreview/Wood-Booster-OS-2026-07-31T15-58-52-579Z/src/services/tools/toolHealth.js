import {
  getToolManifest,
} from "./toolManifest"

import {
  supportsNavigationAction,
} from "./navigationTool"

import {
  supportsProjectAction,
} from "./projectTool"

import {
  supportsCustomerAction,
} from "./customerTool"


const toolExecutors = {
  navigation: {
    supports:
      supportsNavigationAction,
  },

  projects: {
    supports:
      supportsProjectAction,
  },

  customers: {
    supports:
      supportsCustomerAction,
  },
}


function checkToolHealth(tool) {
  const executor =
    toolExecutors[tool.id]

  if (!tool.enabled) {
    return {
      ...tool,
      health: "disabled",
      healthy: false,
      supportedActions: [],
      missingActions: [],
    }
  }

  if (!executor) {
    return {
      ...tool,
      health: "missing_executor",
      healthy: false,
      supportedActions: [],
      missingActions: [
        ...tool.actions,
      ],
    }
  }

  const supportedActions =
    tool.actions.filter(
      (actionType) =>
        executor.supports(
          actionType,
        ),
    )

  const missingActions =
    tool.actions.filter(
      (actionType) =>
        !executor.supports(
          actionType,
        ),
    )

  return {
    ...tool,
    health:
      missingActions.length === 0
        ? "healthy"
        : "partial",
    healthy:
      missingActions.length === 0,
    supportedActions,
    missingActions,
  }
}


function getToolHealthReport() {
  const tools =
    getToolManifest().map(
      checkToolHealth,
    )

  const healthyTools =
    tools.filter(
      (tool) => tool.healthy,
    )

  const unhealthyTools =
    tools.filter(
      (tool) =>
        tool.enabled &&
        !tool.healthy,
    )

  return {
    tools,
    summary: {
      total: tools.length,
      enabled:
        tools.filter(
          (tool) => tool.enabled,
        ).length,
      healthy:
        healthyTools.length,
      unhealthy:
        unhealthyTools.length,
    },
  }
}


export {
  checkToolHealth,
  getToolHealthReport,
}
