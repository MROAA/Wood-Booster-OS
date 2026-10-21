/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Browser Operator Plugin
 *
 * Rekisteröi selainoperaattorin työkalun, skillin, workflow'n ja
 * keskustelun kyvykkyyden. Kutsutaan kerran käynnistyksessä
 * (spacemonkeyRuntimeBootstrap.js). Playwright ladataan vasta, kun
 * testi ajetaan.
 */

import fs from "node:fs"

import browserTool from "./tools/browserTool.js"

import runUiCheckSkill from "./skills/runUiCheckSkill.js"

import runUiCheckWorkflow from "./workflows/runUiCheckWorkflow.js"

import browserOperatorCapabilities from "./capabilities/browserOperatorCapabilities.js"

import { validateChatCapability } from "../../capabilities/chatCapability.js"



const plugin = JSON.parse(
    fs.readFileSync(
        new URL("./plugin.json", import.meta.url),
    ),
)



function registerBrowserOperatorPlugin({

    toolBus,

    skillEngine,

    workflowEngine,

    pluginManager,

    capabilityRegistry = null,

    logger = console,

}) {

    if (!toolBus.has(browserTool.id)) {

        toolBus.register(browserTool)

    }

    skillEngine.register(
        runUiCheckSkill,
    )

    workflowEngine.register(
        runUiCheckWorkflow,
    )

    if (capabilityRegistry) {

        for (const capability of browserOperatorCapabilities) {

            const errors = validateChatCapability(capability)

            if (errors.length > 0) {

                logger.warn?.(
                    `[browser-operator] capability ${capability?.id} skipped: ` +
                    errors.join(", "),
                )

                continue

            }

            capabilityRegistry.register({
                category: plugin.category,
                ...capability,
                plugin: plugin.id,
            })

        }

    }

    pluginManager.register(plugin)

    logger.info?.(
        "[browser-operator] plugin registered",
    )

}

export { registerBrowserOperatorPlugin }

export default registerBrowserOperatorPlugin
