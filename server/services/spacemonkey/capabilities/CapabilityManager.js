/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Capability Manager
 *
 * Hallitsee kaikki Capability Packit.
 */

class CapabilityManager {

    constructor({
        registry,
        logger = console,
    } = {}) {

        if (!registry) {
            throw new Error(
                "CapabilityPackRegistry required."
            )
        }

        this.registry = registry
        this.logger = logger
    }

    install(pack) {

        if (this.registry.has(pack.id)) {

            return {
                success: false,
                error: "Pack already installed",
            }

        }

        this.registry.register(pack)

        this.logger.info?.(
            `Installed ${pack.id}`
        )

        return {
            success: true,
        }
    }

    uninstall(id) {

        if (!this.registry.has(id)) {

            return {
                success: false,
                error: "Pack not installed",
            }

        }

        this.registry.unregister(id)

        this.logger.info?.(
            `Removed ${id}`
        )

        return {
            success: true,
        }
    }

    enable(id) {

        this.registry.enable(id)

        return {
            success: true,
        }
    }

    disable(id) {

        this.registry.disable(id)

        return {
            success: true,
        }
    }

    installed() {

        return this.registry.list()
    }

    enabled() {

        return this.registry.enabled()
    }

    summary() {

        return {

            installed:
                this.installed().length,

            enabled:
                this.enabled().length,

            packs:
                this.installed().map(pack => ({

                    id:
                        pack.id,

                    version:
                        pack.version,

                    enabled:
                        pack.enabled,

                })),
        }
    }

}

export default CapabilityManager
