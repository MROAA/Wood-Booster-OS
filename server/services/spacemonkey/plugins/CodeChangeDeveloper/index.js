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

import generateVerificationTestSkill from "./skills/generateVerificationTestSkill.js"

import generateVerificationTestWorkflow from "./workflows/generateVerificationTestWorkflow.js"

import runVerificationTestSkill from "./skills/runVerificationTestSkill.js"

import runVerificationTestWorkflow from "./workflows/runVerificationTestWorkflow.js"

import generateChangePlanSkill from "./skills/generateChangePlanSkill.js"

import generateChangePlanWorkflow from "./workflows/generateChangePlanWorkflow.js"



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

    skillEngine.register(
        generateVerificationTestSkill,
    )

    skillEngine.register(
        runVerificationTestSkill,
    )

    skillEngine.register(
        generateChangePlanSkill,
    )

    workflowEngine.register(
        generateCodeChangeWorkflow,
    )

    workflowEngine.register(
        writeCodeChangeWorkflow,
    )

    workflowEngine.register(
        generateVerificationTestWorkflow,
    )

    workflowEngine.register(
        runVerificationTestWorkflow,
    )

    workflowEngine.register(
        generateChangePlanWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[code-change-developer] plugin registered",
    )

}

export { registerCodeChangeDeveloperPlugin }

export default registerCodeChangeDeveloperPlugin
