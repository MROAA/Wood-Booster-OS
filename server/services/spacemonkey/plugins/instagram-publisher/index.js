/**
 * Wood-Booster OS
 * Boosterverse
 *
 * Instagram Publisher Plugin
 *
 * Rekisteröi pluginin Toolin, Skillin, Workflow'n ja itsensä
 * annettuihin moottoreihin. Kutsutaan kerran käynnistyksen
 * yhteydessä (ks. spacemonkeyRuntimeBootstrap.js).
 */

import fs from "node:fs"

import InstagramGraphAPITool from "./tools/instagramGraphAPITool.js"

import publishInstagramPostSkill from "./skills/publishInstagramPostSkill.js"

import publishInstagramPostWorkflow from "./workflows/publishInstagramPostWorkflow.js"



const plugin = JSON.parse(
    fs.readFileSync(
        new URL("./plugin.json", import.meta.url),
    ),
)



function registerInstagramPublisherPlugin({

    toolBus,

    skillEngine,

    workflowEngine,

    pluginManager,

    logger = console,

}) {

    toolBus.register(
        new InstagramGraphAPITool({ logger }),
    )

    skillEngine.register(
        publishInstagramPostSkill,
    )

    workflowEngine.register(
        publishInstagramPostWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[instagram-publisher] plugin registered",
    )

}

export { registerInstagramPublisherPlugin }

export default registerInstagramPublisherPlugin
