/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * System Operator Plugin
 *
 * Rekisteröi Spacemonkeyn työtilan ja järjestelmän tarkkailun
 * työkalut, skillit, workflow't ja keskustelun kyvykkyydet. Kutsutaan
 * kerran käynnistyksessä (spacemonkeyRuntimeBootstrap.js). Rekisteröinti
 * ei koske levyyn: työtila luodaan vasta ensimmäisellä käytöllä.
 */

import fs from "node:fs"

import systemObserverTool from "./tools/systemObserverTool.js"

import workspaceTool from "./tools/workspaceTool.js"

import checkSystemStatusSkill from "./skills/checkSystemStatusSkill.js"

import describeWorkspaceSkill from "./skills/describeWorkspaceSkill.js"

import checkSystemStatusWorkflow from "./workflows/checkSystemStatusWorkflow.js"

import describeWorkspaceWorkflow from "./workflows/describeWorkspaceWorkflow.js"

import systemOperatorCapabilities from "./capabilities/systemOperatorCapabilities.js"

import { validateChatCapability } from "../../capabilities/chatCapability.js"



const plugin = JSON.parse(
    fs.readFileSync(
        new URL("./plugin.json", import.meta.url),
    ),
)



function registerSystemOperatorPlugin({

    toolBus,

    skillEngine,

    workflowEngine,

    pluginManager,

    capabilityRegistry = null,

    logger = console,

}) {

    for (const tool of [systemObserverTool, workspaceTool]) {

        if (!toolBus.has(tool.id)) {

            toolBus.register(tool)

        }

    }

    skillEngine.register(
        checkSystemStatusSkill,
    )

    skillEngine.register(
        describeWorkspaceSkill,
    )

    workflowEngine.register(
        checkSystemStatusWorkflow,
    )

    workflowEngine.register(
        describeWorkspaceWorkflow,
    )

    if (capabilityRegistry) {

        for (const capability of systemOperatorCapabilities) {

            const errors = validateChatCapability(capability)

            if (errors.length > 0) {

                logger.warn?.(
                    `[system-operator] capability ${capability?.id} skipped: ` +
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
        "[system-operator] plugin registered",
    )

}

export { registerSystemOperatorPlugin }

export default registerSystemOperatorPlugin
