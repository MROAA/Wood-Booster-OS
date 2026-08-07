/**
 * Wood-Booster OS
 * Capability Registry
 *
 * Keskitetty rekisteri kaikille Spacemonkeyn kyvykkyyksille.
 */

class CapabilityRegistry {
  constructor({
    logger = null,
  } = {}) {
    this.logger = logger
    this.capabilities = new Map()
  }

  register(capability) {
    if (!capability?.id) {
      throw new Error("Capability id missing")
    }

    this.capabilities.set(
      capability.id,
      {
        enabled: true,
        category: "general",
        permissions: [],
        ...capability,
      }
    )

    this.logger?.info?.(
      `Capability registered: ${capability.id}`
    )

    return true
  }

  unregister(id) {
    return this.capabilities.delete(id)
  }

  has(id) {
    return this.capabilities.has(id)
  }

  get(id) {
    return this.capabilities.get(id)
  }

  enable(id) {
    const capability =
      this.capabilities.get(id)

    if (!capability) {
      return false
    }

    capability.enabled = true

    return true
  }

  disable(id) {
    const capability =
      this.capabilities.get(id)

    if (!capability) {
      return false
    }

    capability.enabled = false

    return true
  }

  list() {
    return [...this.capabilities.values()]
  }

  byCategory(category) {
    return this.list().filter(
      capability =>
        capability.category === category
    )
  }

  available() {
    return this.list().filter(
      capability =>
        capability.enabled
    )
  }

  canExecute(id) {
    const capability =
      this.capabilities.get(id)

    if (!capability) {
      return false
    }

    return capability.enabled === true
  }

  summary() {
    return {
      total:
        this.capabilities.size,

      enabled:
        this.available().length,

      disabled:
        this.list().filter(
          capability =>
            !capability.enabled
        ).length,
    }
  }
}

export default CapabilityRegistry
