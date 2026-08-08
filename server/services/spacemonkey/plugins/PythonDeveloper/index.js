/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Python Developer Plugin
 *
 * Rekisteröi pluginin Toolin, Skillin, Workflow'n ja itsensä
 * annettuihin moottoreihin. Kutsutaan kerran käynnistyksen
 * yhteydessä (ks. spacemonkeyRuntimeBootstrap.js).
 */

import fs from "node:fs"

import FileTool from "../../tools/FileTool.js"

import writePythonCodeSkill from "./skills/writePythonCodeSkill.js"

import writePythonCodeWorkflow from "./workflows/writePythonCodeWorkflow.js"



const plugin = JSON.parse(
    fs.readFileSync(
        new URL("./plugin.json", import.meta.url),
    ),
)



function registerPythonDeveloperPlugin({

    toolBus,

    skillEngine,

    workflowEngine,

    pluginManager,

    logger = console,

}) {

    if (!toolBus.has("file")) {

        toolBus.register(FileTool)

    }

    skillEngine.register(
        writePythonCodeSkill,
    )

    workflowEngine.register(
        writePythonCodeWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[python-developer] plugin registered",
    )

}

export { registerPythonDeveloperPlugin }

export default registerPythonDeveloperPlugin
