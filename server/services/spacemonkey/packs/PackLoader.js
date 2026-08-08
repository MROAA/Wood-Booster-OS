/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Pack Loader
 *
 * Lataa ja rekisteröi kaikki Capability Packit.
 */

class PackLoader {

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

    load(packs = []) {

        const loaded = []
        const failed = []

        for (const pack of packs) {

            try {

                this.validate(pack)

                this.registry.register(pack)

                loaded.push(pack.id)

                this.logger.info?.(
                    `Loaded Capability Pack: ${pack.id}`
                )

            } catch (error) {

                failed.push({
                    id: pack?.id ?? "unknown",
                    error: error.message,
                })

                this.logger.error?.(
                    error.message
                )
            }
        }

        return {

            success:
                failed.length === 0,

            loaded,

            failed,

            total:
                packs.length,

        }
    }

    validate(pack) {

        if (!pack) {
            throw new Error("Pack missing")
        }

        if (!pack.id) {
            throw new Error(
                "Pack id missing"
            )
        }

        if (!pack.name) {
            throw new Error(
                `${pack.id}: name missing`
            )
        }

        if (!Array.isArray(pack.capabilities)) {
            throw new Error(
                `${pack.id}: capabilities missing`
            )
        }

        if (!Array.isArray(pack.skills)) {
            throw new Error(
                `${pack.id}: skills missing`
            )
        }

        if (!Array.isArray(pack.tools)) {
            throw new Error(
                `${pack.id}: tools missing`
            )
        }

        return true
    }

}

export default PackLoader
