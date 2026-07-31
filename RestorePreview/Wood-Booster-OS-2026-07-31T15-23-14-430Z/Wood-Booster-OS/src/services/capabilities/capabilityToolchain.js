import {
  resolveCapability,
  supportsCapabilityAction,
} from "./capabilityRegistry"

import {
  executeRegisteredTool,
} from "../tools/toolRegistry"


function createToolchainResult({
  success,
  type,
  message,
  action = null,
  capability = null,
  toolResult = null,
  data = null,
}) {
  return {
    success,
    type,
    message,
    action,
    capability,
    toolResult,
    data,
  }
}


async function executeCapabilityToolchain({
  action,
  navigate,
}) {
  const actionType =
    String(action?.type || "")
      .trim()
      .toLowerCase()

  if (!actionType) {
    return createToolchainResult({
      success: false,
      type: "invalid_action",
      message:
        "Capability Toolchain ei saanut kelvollista toimintotyyppiä.",
      action,
    })
  }

  const capabilityResult =
    resolveCapability({
      actionType,
    })

  if (
    !capabilityResult.success ||
    !capabilityResult.capability
  ) {
    return createToolchainResult({
      success: false,
      type:
        capabilityResult.type,
      message:
        capabilityResult.message,
      action,
      data:
        capabilityResult.data,
    })
  }

  const capability =
    capabilityResult.capability

  const supported =
    supportsCapabilityAction({
      capabilityId:
        capability.id,
      actionType,
    })

  if (!supported) {
    return createToolchainResult({
      success: false,
      type:
        "unsupported_capability_action",
      message: `Kyvykkyys "${capability.name}" ei tue toimintoa: ${actionType}.`,
      action,
      capability,
    })
  }

  const toolResult =
    await executeRegisteredTool({
      action,
      navigate,
    })

  return createToolchainResult({
    success:
      toolResult.success,
    type:
      toolResult.success
        ? "capability_executed"
        : "tool_execution_failed",
    message:
      toolResult.success
        ? `Kyvykkyys "${capability.name}" suoritti toiminnon onnistuneesti.`
        : toolResult.message,
    action,
    capability,
    toolResult,
    data: {
      capabilityId:
        capability.id,
      capabilityName:
        capability.name,
      actionType,
      tools: [
        ...capability.tools,
      ],
    },
  })
}


export {
  executeCapabilityToolchain,
}
