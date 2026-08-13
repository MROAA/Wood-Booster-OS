/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Action Executor
 *
 * Turvallinen suorituskerros Planner -> Permission ->
 * Capability -> ToolBus.
 */

class ActionExecutor {
  constructor({
    logger = null,
    toolBus,
    capabilityRegistry,
    permissionManager,
  }) {
    this.logger = logger

    this.toolBus = toolBus

    this.capabilityRegistry =
      capabilityRegistry

    this.permissionManager =
      permissionManager
  }

  async execute(action, runtime = null) {

    if (!action?.tool) {
      return {
        success: false,
        error: "Action missing tool",
      }
    }

    const capability =
      this.capabilityRegistry.get(
        action.tool
      )

    if (!capability) {
      return {
        success: false,
        error:
          "Capability not found",
      }
    }

    if (
      !this.capabilityRegistry.canExecute(
        action.tool
      )
    ) {
      return {
        success: false,
        error:
          "Capability disabled",
      }
    }

    const permission =
      this.permissionManager.canExecute(
        action.tool
      )

    if (!permission.allowed) {
      return {
        success: false,
        error: permission.reason,
      }
    }

    if (permission.approvalRequired) {
      return {
        success: false,
        approvalRequired: true,
        action,
      }
    }

    this.logger?.info?.(
      `Executing action: ${action.tool}`
    )

    return this.toolBus.execute(
      action.tool,
      action.input ?? {},
      runtime
    )
  }

  async executePlan(
    plan = [],
    runtime = null
  ) {

    const results = []

    for (const action of plan) {

      const result =
        await this.execute(
          action,
          runtime
        )

      results.push({
        action,
        result,
      })

      if (!result.success) {
        break
      }
    }

    return {
      success: results.every(
        item => item.result.success
      ),
      results,
    }
  }
}

export default ActionExecutor
