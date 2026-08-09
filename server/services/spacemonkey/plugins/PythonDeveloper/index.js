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

import explainPythonCodeSkill from "./skills/explainPythonCodeSkill.js"

import explainPythonCodeWorkflow from "./workflows/explainPythonCodeWorkflow.js"

import reviewPythonCodeSkill from "./skills/reviewPythonCodeSkill.js"

import reviewPythonCodeWorkflow from "./workflows/reviewPythonCodeWorkflow.js"



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

    skillEngine.register(
        explainPythonCodeSkill,
    )

    skillEngine.register(
        reviewPythonCodeSkill,
    )

    workflowEngine.register(
        writePythonCodeWorkflow,
    )

    workflowEngine.register(
        explainPythonCodeWorkflow,
    )

    workflowEngine.register(
        reviewPythonCodeWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[python-developer] plugin registered",
    )

}

export { registerPythonDeveloperPlugin }

export default registerPythonDeveloperPlugin
