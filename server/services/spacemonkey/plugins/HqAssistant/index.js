/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * HQ Assistant Plugin
 *
 * Rekisteröi HQ-keskustelun vain luku -työkalun, skillit ja workflow't
 * annettuihin moottoreihin, sekä keskustelussa valittavat kyvykkyydet
 * Capability Registryyn. Kutsutaan kerran käynnistyksen yhteydessä
 * (ks. spacemonkeyRuntimeBootstrap.js).
 *
 * Kyvykkyyskuvaus joka ei läpäise validointia jätetään rekisteröimättä
 * ja siitä kirjoitetaan varoitus - palvelimen käynnistys ei kaadu
 * yhden virheellisen kuvauksen takia, mutta keskustelu ei myöskään
 * voi koskaan valita sitä.
 */

import fs from "node:fs"

import hqProjectsTool from "./tools/hqProjectsTool.js"

import agentInventoryTool from "./tools/agentInventoryTool.js"

import atlasTool from "./tools/atlasTool.js"

import listUnfinishedProjectsSkill from "./skills/listUnfinishedProjectsSkill.js"

import summarizeProjectSkill from "./skills/summarizeProjectSkill.js"

import listSpacemonkeyAgentsSkill from "./skills/listSpacemonkeyAgentsSkill.js"

import atlasOverviewSkill from "./skills/atlasOverviewSkill.js"

import listUnfinishedProjectsWorkflow from "./workflows/listUnfinishedProjectsWorkflow.js"

import summarizeProjectWorkflow from "./workflows/summarizeProjectWorkflow.js"

import listSpacemonkeyAgentsWorkflow from "./workflows/listSpacemonkeyAgentsWorkflow.js"

import atlasOverviewWorkflow from "./workflows/atlasOverviewWorkflow.js"

import hqAssistantCapabilities, {
    validateChatCapability,
} from "./capabilities/hqAssistantCapabilities.js"



const plugin = JSON.parse(
    fs.readFileSync(
        new URL("./plugin.json", import.meta.url),
    ),
)



function registerHqAssistantPlugin({

    toolBus,

    skillEngine,

    workflowEngine,

    pluginManager,

    capabilityRegistry = null,

    logger = console,

}) {

    if (!toolBus.has(hqProjectsTool.id)) {

        toolBus.register(hqProjectsTool)

    }

    if (!toolBus.has(agentInventoryTool.id)) {

        toolBus.register(agentInventoryTool)

    }

    if (!toolBus.has(atlasTool.id)) {

        toolBus.register(atlasTool)

    }

    skillEngine.register(
        listUnfinishedProjectsSkill,
    )

    skillEngine.register(
        summarizeProjectSkill,
    )

    skillEngine.register(
        listSpacemonkeyAgentsSkill,
    )

    skillEngine.register(
        atlasOverviewSkill,
    )

    workflowEngine.register(
        listUnfinishedProjectsWorkflow,
    )

    workflowEngine.register(
        summarizeProjectWorkflow,
    )

    workflowEngine.register(
        listSpacemonkeyAgentsWorkflow,
    )

    workflowEngine.register(
        atlasOverviewWorkflow,
    )

    if (capabilityRegistry) {

        for (const capability of hqAssistantCapabilities) {

            const errors = validateChatCapability(capability)

            if (errors.length > 0) {

                logger.warn?.(
                    `[hq-assistant] capability ${capability?.id} skipped: ` +
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
        "[hq-assistant] plugin registered",
    )

}

export { registerHqAssistantPlugin }

export default registerHqAssistantPlugin
