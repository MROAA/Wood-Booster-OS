/**
 * Wood-Booster OS
 * Boosterverse
 *
 * WordPress Publisher Plugin
 *
 * Rekisteröi pluginin Toolin, Skillin, Workflow'n ja itsensä
 * annettuihin moottoreihin. Kutsutaan kerran käynnistyksen
 * yhteydessä (ks. spacemonkeyRuntimeBootstrap.js).
 */

import fs from "node:fs"

import WordPressPublishTool from "./tools/wordPressPublishTool.js"

import publishWordPressPostSkill from "./skills/publishWordPressPostSkill.js"

import publishWordPressPostWorkflow from "./workflows/publishWordPressPostWorkflow.js"



const plugin = JSON.parse(
    fs.readFileSync(
        new URL("./plugin.json", import.meta.url),
    ),
)



function registerWordPressPublisherPlugin({

    toolBus,

    skillEngine,

    workflowEngine,

    pluginManager,

    logger = console,

}) {

    toolBus.register(
        new WordPressPublishTool({ logger }),
    )

    skillEngine.register(
        publishWordPressPostSkill,
    )

    workflowEngine.register(
        publishWordPressPostWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[wordpress-publisher] plugin registered",
    )

}

export { registerWordPressPublisherPlugin }

export default registerWordPressPublisherPlugin
