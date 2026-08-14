/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Code Change Developer Plugin
 *
 * Rekisteröi pluginin Toolin, Skillit, Workflow't ja itsensä
 * annettuihin moottoreihin. Kutsutaan kerran käynnistyksen
 * yhteydessä (ks. spacemonkeyRuntimeBootstrap.js).
 */

import fs from "node:fs"

import FileTool from "../../tools/FileTool.js"

import generateCodeChangeSkill from "./skills/generateCodeChangeSkill.js"

import generateCodeChangeWorkflow from "./workflows/generateCodeChangeWorkflow.js"

import writeCodeChangeSkill from "./skills/writeCodeChangeSkill.js"

import writeCodeChangeWorkflow from "./workflows/writeCodeChangeWorkflow.js"



const plugin = JSON.parse(
    fs.readFileSync(
        new URL("./plugin.json", import.meta.url),
    ),
)



function registerCodeChangeDeveloperPlugin({

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
        generateCodeChangeSkill,
    )

    skillEngine.register(
        writeCodeChangeSkill,
    )

    workflowEngine.register(
        generateCodeChangeWorkflow,
    )

    workflowEngine.register(
        writeCodeChangeWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[code-change-developer] plugin registered",
    )

}

export { registerCodeChangeDeveloperPlugin }

export default registerCodeChangeDeveloperPlugin
