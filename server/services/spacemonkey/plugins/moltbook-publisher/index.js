/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Moltbook Publisher Plugin
 *
 * Rekisteröi pluginin Toolin, Skillit, Workflow'n ja itsensä
 * annettuihin moottoreihin. Kutsutaan kerran käynnistyksen
 * yhteydessä (ks. spacemonkeyRuntimeBootstrap.js).
 */

import fs from "node:fs"

import MoltbookAPITool from "./tools/moltbookAPITool.js"

import readMoltbookFeedSkill from "./skills/readMoltbookFeedSkill.js"

import publishMoltbookPostSkill from "./skills/publishMoltbookPostSkill.js"

import publishMoltbookPostWorkflow from "./workflows/publishMoltbookPostWorkflow.js"



const plugin = JSON.parse(
    fs.readFileSync(
        new URL("./plugin.json", import.meta.url),
    ),
)



function registerMoltbookPublisherPlugin({

    toolBus,

    skillEngine,

    workflowEngine,

    pluginManager,

    logger = console,

}) {

    toolBus.register(
        new MoltbookAPITool({ logger }),
    )

    skillEngine.register(
        readMoltbookFeedSkill,
    )

    skillEngine.register(
        publishMoltbookPostSkill,
    )

    workflowEngine.register(
        publishMoltbookPostWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[moltbook-publisher] plugin registered",
    )

}

export { registerMoltbookPublisherPlugin }

export default registerMoltbookPublisherPlugin
