/**
 * Wood-Booster OS
 * Spacemonkey Kernel
 *
 * Keskitetty ydin, joka hallitsee kaikkia järjestelmän palveluita.
 */

class Kernel {

    constructor({
        logger = console,
    } = {}) {

        this.logger = logger

        this.services = new Map()

        this.state = "stopped"

    }

    register(id, service) {

        if (!id) {
            throw new Error("Service id missing")
        }

        this.services.set(id, service)

        this.logger.info?.(
            `Kernel registered: ${id}`
        )

        return service
    }

    has(id) {
        return this.services.has(id)
    }

    get(id) {
        return this.services.get(id)
    }

    list() {

        return [...this.services.keys()]

    }

    async start() {

        this.state = "starting"

        for (const service of this.services.values()) {

            if (typeof service.start === "function") {
                await service.start()
            }

        }

        this.state = "running"

    }

    async stop() {

        this.state = "stopping"

        const services =
            [...this.services.values()].reverse()

        for (const service of services) {

            if (typeof service.stop === "function") {
                await service.stop()
            }

        }

        this.state = "stopped"

    }

    status() {

        return {

            state: this.state,

            services: this.list(),

            totalServices:
                this.services.size,

        }

    }

}

export default Kernel
