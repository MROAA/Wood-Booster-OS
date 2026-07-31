import {
  findCapabilityByAction,
  findCapabilityById,
} from "./capabilityManifest"

function createCapabilityResult({
  success,
  type,
  message,
  capability = null,
  action = null,
  data = null,
}) {
  return {
    success,
    type,
    message,
    capability,
    action,
    data,
  }
}

function normalizeCapabilityId(
  capabilityId,
) {
  return String(
    capabilityId || "",
  )
    .trim()
    .toLowerCase()
}

function normalizeActionType(
  actionType,
) {
  return String(
    actionType || "",
  )
    .trim()
    .toLowerCase()
}

function resolveCapability({
  capabilityId = null,
  actionType = null,
}) {
  const normalizedCapabilityId =
    normalizeCapabilityId(
      capabilityId,
    )

  const normalizedActionType =
    normalizeActionType(
      actionType,
    )

  if (normalizedCapabilityId) {
    const capability =
      findCapabilityById(
        normalizedCapabilityId,
      )

    if (!capability) {
      return createCapabilityResult({
        success: false,
        type: "unsupported_capability",
        message: `Capability Manifest ei löytänyt aktiivista kyvykkyyttä: ${normalizedCapabilityId}.`,
        data: {
          capabilityId:
            normalizedCapabilityId,
        },
      })
    }

    return createCapabilityResult({
      success: true,
      type: "capability_resolved",
      message: `Kyvykkyys "${capability.name}" löytyi.`,
      capability,
      data: {
        capabilityId:
          capability.id,
        tools: [
          ...capability.tools,
        ],
        actions: [
          ...capability.actions,
        ],
      },
    })
  }

  if (normalizedActionType) {
    const capability =
      findCapabilityByAction(
        normalizedActionType,
      )

    if (!capability) {
      return createCapabilityResult({
        success: false,
        type: "unsupported_action",
        message: `Capability Manifest ei löytänyt kyvykkyyttä toiminnolle: ${normalizedActionType}.`,
        action: {
          type:
            normalizedActionType,
        },
        data: {
          actionType:
            normalizedActionType,
        },
      })
    }

    return createCapabilityResult({
      success: true,
      type: "capability_resolved",
      message: `Toiminto kuuluu kyvykkyyteen "${capability.name}".`,
      capability,
      action: {
        type:
          normalizedActionType,
      },
      data: {
        capabilityId:
          capability.id,
        tools: [
          ...capability.tools,
        ],
        actions: [
          ...capability.actions,
        ],
      },
    })
  }

  return createCapabilityResult({
    success: false,
    type: "invalid_request",
    message:
      "Kyvykkyyden tunniste tai toiminnon tyyppi puuttuu.",
  })
}

function supportsCapabilityAction({
  capabilityId,
  actionType,
}) {
  const capability =
    findCapabilityById(
      normalizeCapabilityId(
        capabilityId,
      ),
    )

  const normalizedActionType =
    normalizeActionType(
      actionType,
    )

  if (
    !capability ||
    !normalizedActionType
  ) {
    return false
  }

  return capability.actions.includes(
    normalizedActionType,
  )
}

export {
  normalizeActionType,
  normalizeCapabilityId,
  resolveCapability,
  supportsCapabilityAction,
}
