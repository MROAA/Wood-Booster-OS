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

import GitTool from "../../tools/GitTool.js"

import writePythonCodeSkill from "./skills/writePythonCodeSkill.js"

import writePythonCodeWorkflow from "./workflows/writePythonCodeWorkflow.js"

import revertPythonCodeSkill from "./skills/revertPythonCodeSkill.js"

import revertPythonCodeWorkflow from "./workflows/revertPythonCodeWorkflow.js"

import explainPythonCodeSkill from "./skills/explainPythonCodeSkill.js"

import explainPythonCodeWorkflow from "./workflows/explainPythonCodeWorkflow.js"

import reviewPythonCodeSkill from "./skills/reviewPythonCodeSkill.js"

import reviewPythonCodeWorkflow from "./workflows/reviewPythonCodeWorkflow.js"

import refactorPythonCodeSkill from "./skills/refactorPythonCodeSkill.js"

import refactorPythonCodeWorkflow from "./workflows/refactorPythonCodeWorkflow.js"

import debugPythonCodeSkill from "./skills/debugPythonCodeSkill.js"

import debugPythonCodeWorkflow from "./workflows/debugPythonCodeWorkflow.js"

import checkPythonReferencesSkill from "./skills/checkPythonReferencesSkill.js"

import checkPythonReferencesWorkflow from "./workflows/checkPythonReferencesWorkflow.js"

import generatePythonTestSkill from "./skills/generatePythonTestSkill.js"

import generatePythonTestWorkflow from "./workflows/generatePythonTestWorkflow.js"

import runPythonTestSkill from "./skills/runPythonTestSkill.js"

import runPythonTestWorkflow from "./workflows/runPythonTestWorkflow.js"

import runPythonDraftSkill from "./skills/runPythonDraftSkill.js"

import runPythonDraftWorkflow from "./workflows/runPythonDraftWorkflow.js"

import writePythonCodePullRequestSkill from "./skills/writePythonCodePullRequestSkill.js"

import writePythonCodePullRequestWorkflow from "./workflows/writePythonCodePullRequestWorkflow.js"



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

    if (!toolBus.has("git")) {

        toolBus.register(GitTool)

    }

    skillEngine.register(
        writePythonCodeSkill,
    )

    skillEngine.register(
        revertPythonCodeSkill,
    )

    skillEngine.register(
        explainPythonCodeSkill,
    )

    skillEngine.register(
        reviewPythonCodeSkill,
    )

    skillEngine.register(
        refactorPythonCodeSkill,
    )

    skillEngine.register(
        debugPythonCodeSkill,
    )

    skillEngine.register(
        checkPythonReferencesSkill,
    )

    skillEngine.register(
        generatePythonTestSkill,
    )

    skillEngine.register(
        runPythonTestSkill,
    )

    skillEngine.register(
        runPythonDraftSkill,
    )

    skillEngine.register(
        writePythonCodePullRequestSkill,
    )

    workflowEngine.register(
        writePythonCodeWorkflow,
    )

    workflowEngine.register(
        revertPythonCodeWorkflow,
    )

    workflowEngine.register(
        explainPythonCodeWorkflow,
    )

    workflowEngine.register(
        reviewPythonCodeWorkflow,
    )

    workflowEngine.register(
        refactorPythonCodeWorkflow,
    )

    workflowEngine.register(
        debugPythonCodeWorkflow,
    )

    workflowEngine.register(
        checkPythonReferencesWorkflow,
    )

    workflowEngine.register(
        generatePythonTestWorkflow,
    )

    workflowEngine.register(
        runPythonTestWorkflow,
    )

    workflowEngine.register(
        runPythonDraftWorkflow,
    )

    workflowEngine.register(
        writePythonCodePullRequestWorkflow,
    )

    pluginManager.register(plugin)

    logger.info?.(
        "[python-developer] plugin registered",
    )

}

export { registerPythonDeveloperPlugin }

export default registerPythonDeveloperPlugin
