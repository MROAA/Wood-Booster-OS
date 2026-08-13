/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Plugin Manager
 *
 * Hallitsee kaikkia Boosterverse Plugineja.
 */

class PluginManager {

    constructor({
        logger = console,
    } = {}) {

        this.logger = logger

        this.plugins = new Map()

    }

    register(plugin) {

        if (!plugin?.id) {

            throw new Error(
                "Plugin id missing."
            )

        }

        this.plugins.set(
            plugin.id,
            {
                enabled: true,
                version: "1.0.0",
                ...plugin,
            }
        )

        this.logger.info?.(
            `Plugin loaded: ${plugin.id}`
        )

        return true

    }

    unregister(id) {

        return this.plugins.delete(id)

    }

    has(id) {

        return this.plugins.has(id)

    }

    get(id) {

        return this.plugins.get(id)

    }

    enable(id) {

        const plugin =
            this.plugins.get(id)

        if (!plugin)
            return false

        plugin.enabled = true

        return true

    }

    disable(id) {

        const plugin =
            this.plugins.get(id)

        if (!plugin)
            return false

        plugin.enabled = false

        return true

    }

    list() {

        return [
            ...this.plugins.values(),
        ]

    }

    enabled() {

        return this.list().filter(
            plugin =>
                plugin.enabled
        )

    }

    summary() {

        return {

            total:
                this.plugins.size,

            enabled:
                this.enabled().length,

            disabled:
                this.list().filter(
                    plugin =>
                        !plugin.enabled
                ).length,

            plugins:
                this.list().map(
                    plugin => ({

                        id:
                            plugin.id,

                        version:
                            plugin.version,

                        enabled:
                            plugin.enabled,

                    })
                ),

        }

    }

}

export default PluginManager
