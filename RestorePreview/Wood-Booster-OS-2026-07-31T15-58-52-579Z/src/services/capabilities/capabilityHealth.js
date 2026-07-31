import {
  getCapabilityManifest,
} from "./capabilityManifest"

import {
  getToolHealthReport,
} from "../tools/toolHealth"


function getHealthyToolIds() {
  const toolHealthReport =
    getToolHealthReport()

  return new Set(
    toolHealthReport.tools
      .filter(
        (tool) =>
          tool.enabled &&
          tool.healthy,
      )
      .map(
        (tool) => tool.id,
      ),
  )
}


function checkCapabilityHealth(
  capability,
  healthyToolIds,
) {
  if (!capability.enabled) {
    return {
      ...capability,
      health: "disabled",
      healthy: false,
      availableTools: [],
      missingTools: [],
    }
  }

  const availableTools =
    capability.tools.filter(
      (toolId) =>
        healthyToolIds.has(
          toolId,
        ),
    )

  const missingTools =
    capability.tools.filter(
      (toolId) =>
        !healthyToolIds.has(
          toolId,
        ),
    )

  return {
    ...capability,
    health:
      missingTools.length === 0
        ? "healthy"
        : availableTools.length > 0
          ? "partial"
          : "unavailable",
    healthy:
      missingTools.length === 0,
    availableTools,
    missingTools,
  }
}


function getCapabilityHealthReport() {
  const healthyToolIds =
    getHealthyToolIds()

  const capabilities =
    getCapabilityManifest().map(
      (capability) =>
        checkCapabilityHealth(
          capability,
          healthyToolIds,
        ),
    )

  const healthyCapabilities =
    capabilities.filter(
      (capability) =>
        capability.healthy,
    )

  const unhealthyCapabilities =
    capabilities.filter(
      (capability) =>
        capability.enabled &&
        !capability.healthy,
    )

  return {
    capabilities,
    summary: {
      total:
        capabilities.length,
      enabled:
        capabilities.filter(
          (capability) =>
            capability.enabled,
        ).length,
      healthy:
        healthyCapabilities.length,
      unhealthy:
        unhealthyCapabilities.length,
    },
  }
}


export {
  checkCapabilityHealth,
  getCapabilityHealthReport,
}
