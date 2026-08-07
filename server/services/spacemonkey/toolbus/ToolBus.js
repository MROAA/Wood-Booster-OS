/**
 * Wood-Booster OS
 * Spacemonkey ToolBus
 *
 * Keskitetty turvallinen rajapinta kaikille työkaluille.
 */

class ToolBus {
  constructor({
    logger = null,
  } = {}) {
    this.logger = logger

    this.tools = new Map()
  }

  register(tool) {

    if (!tool?.id) {
      throw new Error("Tool id missing")
    }

    if (typeof tool.execute !== "function") {
      throw new Error(
        `${tool.id} missing execute()`
      )
    }

    this.tools.set(
      tool.id,
      tool
    )

    this.logger?.info?.(
      `Tool registered: ${tool.id}`
    )

    return true
  }

  has(id) {
    return this.tools.has(id)
  }

  get(id) {
    return this.tools.get(id)
  }

  list() {
    return [...this.tools.values()].map(
      tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
      })
    )
  }

  async execute(
    id,
    input = {},
    runtime = null
  ) {

    const tool =
      this.tools.get(id)

    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${id}`,
      }
    }

    this.logger?.info?.(
      `Executing ${id}`
    )

    return tool.execute(
      input,
      runtime
    )
  }
}

export default ToolBus
