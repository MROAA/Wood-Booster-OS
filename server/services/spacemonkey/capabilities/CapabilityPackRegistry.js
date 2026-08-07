/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Capability Pack Registry
 *
 * Capability Pack = yksi kokonainen osaamisalue.
 *
 * Esim:
 * - Development Pack
 * - WordPress Pack
 * - Instagram Pack
 * - Python Pack
 * - C++ Pack
 * - Video Pack
 */

class CapabilityPackRegistry {

  constructor({
    logger = null,
  } = {}) {

    this.logger = logger

    this.packs = new Map()
  }

  register(pack) {

    if (!pack?.id) {
      throw new Error("Capability Pack id missing")
    }

    this.packs.set(
      pack.id,
      {
        enabled: true,
        version: "1.0.0",
        capabilities: [],
        skills: [],
        tools: [],
        permissions: [],
        workflows: [],
        ...pack,
      }
    )

    this.logger?.info?.(
      `Capability Pack registered: ${pack.id}`
    )

    return true
  }

  unregister(id) {

    return this.packs.delete(id)
  }

  has(id) {

    return this.packs.has(id)
  }

  get(id) {

    return this.packs.get(id)
  }

  enable(id) {

    const pack =
      this.packs.get(id)

    if (!pack) {
      return false
    }

    pack.enabled = true

    return true
  }

  disable(id) {

    const pack =
      this.packs.get(id)

    if (!pack) {
      return false
    }

    pack.enabled = false

    return true
  }

  list() {

    return [
      ...this.packs.values(),
    ]
  }

  enabled() {

    return this.list().filter(
      pack => pack.enabled
    )
  }

  summary() {

    return {

      total:
        this.packs.size,

      enabled:
        this.enabled().length,

      disabled:
        this.list().filter(
          pack => !pack.enabled
        ).length,

      packs:
        this.list().map(pack => ({

          id:
            pack.id,

          version:
            pack.version,

          capabilities:
            pack.capabilities.length,

          skills:
            pack.skills.length,

          tools:
            pack.tools.length,

          workflows:
            pack.workflows.length,

        })),
    }
  }
}

export default CapabilityPackRegistry
