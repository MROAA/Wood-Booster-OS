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

import GitTool from "../../tools/GitTool.js"

import generateCodeChangeSkill from "./skills/generateCodeChangeSkill.js"

import generateCodeChangeWorkflow from "./workflows/generateCodeChangeWorkflow.js"

import writeCodeChangeSkill from "./skills/writeCodeChangeSkill.js"

import writeCodeChangeWorkflow from "./workflows/writeCodeChangeWorkflow.js"

import revertCodeChangeSkill from "./skills/revertCodeChangeSkill.js"

import revertCodeChangeWorkflow from "./workflows/revertCodeChangeWorkflow.js"

import generateVerificationTestSkill from "./skills/generateVerificationTestSkill.js"

import generateVerificationTestWorkflow from "./workflows/generateVerificationTestWorkflow.js"

import runVerificationTestSkill from "./skills/runVerificationTestSkill.js"

import runVerificationTestWorkflow from "./workflows/runVerificationTestWorkflow.js"

import runCodeChangeDraftSkill from "./skills/runCodeChangeDraftSkill.js"

import runCodeChangeDraftWorkflow from "./workflows/runCodeChangeDraftWorkflow.js"

import explainCodeChangeSkill from "./skills/explainCodeChangeSkill.js"

import explainCodeChangeWorkflow from "./workflows/explainCodeChangeWorkflow.js"

import reviewCodeChangeSkill from "./skills/reviewCodeChangeSkill.js"

import reviewCodeChangeWorkflow from "./workflows/reviewCodeChangeWorkflow.js"

import generateChangePlanSkill from "./skills/generateChangePlanSkill.js"

import generateChangePlanWorkflow from "./workflows/generateChangePlanWorkflow.js"

import checkCodeReferencesSkill from "./skills/checkCodeReferencesSkill.js"

import checkCodeReferencesWorkflow from "./workflows/checkCodeReferencesWorkflow.js"

import writeCodeChangePullRequestSkill from "./skills/writeCodeChangePullRequestSkill.js"

import writeCodeChangePullRequestWorkflow from "./workflows/writeCodeChangePullRequestWorkflow.js"

import revertPullRequestSkill from "./skills/revertPullRequestSkill.js"

import revertPullRequestWorkflow from "./workflows/revertPullRequestWorkflow.js"



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

    if (!toolBus.has("git")) {

        toolBus.register(GitTool)

    }

    skillEngine.register(
        generateCodeChangeSkill,
    )

    skillEngine.register(
        writeCodeChangeSkill,
    )

    skillEngine.register(
        revertCodeChangeSkill,
    )

    skillEngine.register(
        generateVerificationTestSkill,
    )

    skillEngine.register(
        runVerificationTestSkill,
    )

    skillEngine.register(
        runCodeChangeDraftSkill,
    )

    skillEngine.register(
        explainCodeChangeSkill,
    )

    skillEngine.register(
        reviewCodeChangeSkill,
    )

    skillEngine.register(
        generateChangePlanSkill,
    )

    skillEngine.register(
        checkCodeReferencesSkill,
    )

    skillEngine.register(
        writeCodeChangePullRequestSkill,
    )

    skillEngine.register(
        revertPullRequestSkill,
    )

    workflowEngine.register(
        generateCodeChangeWorkflow,
    )

    workflowEngine.register(
        writeCodeChangeWorkflow,
    )

    workflowEngine.register(
        revertCodeChangeWorkflow,
    )

    workflowEngine.register(
        generateVerificationTestWorkflow,
    )

    workflowEngine.register(
        runVerificationTestWorkflow,
    )

    workflowEngine.register(
        runCodeChangeDraftWorkflow,
    )

    workflowEngine.register(
        explainCodeChangeWorkflow,
    )

    workflowEngine.register(
        reviewCodeChangeWorkflow,
    )

    workflowEngine.register(
        generateChangePlanWorkflow,
    )

    workflowEngine.register(
        checkCodeReferencesWorkflow,
    )

    workflowEngine.register(
        writeCodeChangePullRequestWorkflow,
    )

    workflowEngine.register(
        revertPullRequestWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[code-change-developer] plugin registered",
    )

}

export { registerCodeChangeDeveloperPlugin }

export default registerCodeChangeDeveloperPlugin
