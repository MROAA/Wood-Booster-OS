/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * SPACEMONKEY RUNTIME BOOTSTRAP V1
 *
 * Vastuut:
 *
 * - käynnistää Spacemonkey moduulit
 * - yhdistää integraatiot
 * - luo System Kernelin
 * - käynnistää Agent Runtime Layerin
 *
 * Ei:
 *
 * - ei tee AI päätöksiä
 * - ei kutsu LLM:ää
 * - ei suorita työkaluja
 * - ei kirjoita muistia
 */

import {
    createSpacemonkeySystemKernel,
} from "./spacemonkeySystemKernel.js"


import {
    startSpacemonkeyEventIntegration,
} from "./spacemonkeyEventIntegration.js"


import {
    startSpacemonkeyLearningIntegration,
} from "./spacemonkeyLearningIntegration.js"


import {
    startSpacemonkeyLearningEventBridge,
} from "./spacemonkeyLearningEventBridge.js"


import {
    integrateAgentRuntime,
} from "./agents/runtime/agentRuntimeIntegration.js"


import ToolBus from "./toolbus/ToolBus.js"

import CapabilityRegistry from "./toolbus/CapabilityRegistry.js"

import SkillEngine from "./skills/SkillEngine.js"

import WorkflowEngine from "./workflows/WorkflowEngine.js"

import PluginManager from "./plugins/PluginManager.js"

import { registerInstagramPublisherPlugin } from "./plugins/instagram-publisher/index.js"

import { registerWordPressPublisherPlugin } from "./plugins/wordpress-publisher/index.js"

import { registerMoltbookPublisherPlugin } from "./plugins/moltbook-publisher/index.js"

import { registerPythonDeveloperPlugin } from "./plugins/PythonDeveloper/index.js"

import { registerCodeChangeDeveloperPlugin } from "./plugins/CodeChangeDeveloper/index.js"

import { registerHqAssistantPlugin } from "./plugins/HqAssistant/index.js"

import { registerSystemOperatorPlugin } from "./plugins/SystemOperator/index.js"

import { registerBrowserOperatorPlugin } from "./plugins/BrowserOperator/index.js"

import SpacemonkeyWorkspace from "./workspace/SpacemonkeyWorkspace.js"

import { DEFAULT_PROJECT_ROOT } from "./agents/runtime/registerAgents.js"



let booted = false

let kernel = null

let agentRuntime = null

let activeToolBus = null

let activeSkillEngine = null

let activeWorkflowEngine = null

let activePluginManager = null

let activeCapabilityRegistry = null

let activeWorkspace = null



function startSpacemonkeyRuntimeBootstrap({

    planner,

    toolBus: injectedToolBus,

    memory,

    logger = console,

} = {}) {


    if (booted) {

        return {

            success: true,

            status:
                "already_started",

            kernel,

            agentRuntime,

        }

    }



    const eventResult =
        startSpacemonkeyEventIntegration()



    const learningBridgeResult =
        startSpacemonkeyLearningEventBridge()



    const learningResult =
        startSpacemonkeyLearningIntegration()



    kernel =
        createSpacemonkeySystemKernel()



    const toolBus =
        injectedToolBus || new ToolBus({ logger })

    const skillEngine =
        new SkillEngine({ logger })

    const workflowEngine =
        new WorkflowEngine({ skillEngine, logger })

    const pluginManager =
        new PluginManager({ logger })

    const capabilityRegistry =
        new CapabilityRegistry({ logger })

    registerInstagramPublisherPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        logger,
    })

    registerWordPressPublisherPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        logger,
    })

    registerMoltbookPublisherPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        logger,
    })

    registerPythonDeveloperPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        logger,
    })

    registerCodeChangeDeveloperPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        logger,
    })

    registerHqAssistantPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        capabilityRegistry,
        logger,
    })

    registerSystemOperatorPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        capabilityRegistry,
        logger,
    })

    registerBrowserOperatorPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        capabilityRegistry,
        logger,
    })

    // Spacemonkeyn oma työtila (XDG-tila, ei projektin sisällä). Ei luo
    // hakemistoa vielä - se tehdään ensimmäisellä käytöllä.
    activeWorkspace =
        new SpacemonkeyWorkspace({
            projectRoot: DEFAULT_PROJECT_ROOT,
        })

    activeToolBus = toolBus

    activeSkillEngine = skillEngine

    activeWorkflowEngine = workflowEngine

    activePluginManager = pluginManager

    activeCapabilityRegistry = capabilityRegistry



    const agentRuntimeResult =
        integrateAgentRuntime({

            planner,

            toolBus,

            memory,

            logger,

        })



    agentRuntime =
        agentRuntimeResult.runtime



    booted = true



    console.log(
        "SPACEMONKEY RUNTIME BOOTSTRAP READY"
    )



    return {

        success: true,

        status:
            "started",


        startup: {

            events:
                eventResult,


            learningBridge:
                learningBridgeResult,


            learning:
                learningResult,


            agentRuntime:
                agentRuntimeResult,

        },


        kernel,

        agentRuntime,

    }

}



function getSpacemonkeyBootstrapStatus(){


    return {

        system:
            "Spacemonkey Runtime Bootstrap",


        version:
            "1.0.0",


        booted,


        kernel:
            kernel
                ? "READY"
                : "NOT_STARTED",


        agentRuntime:
            agentRuntime
                ? "READY"
                : "NOT_STARTED",

    }

}



function getSpacemonkeyToolBus() {

    return activeToolBus

}



function getSpacemonkeySkillEngine() {

    return activeSkillEngine

}



function getSpacemonkeyWorkflowEngine() {

    return activeWorkflowEngine

}



function getSpacemonkeyPluginManager() {

    return activePluginManager

}



function getSpacemonkeyCapabilityRegistry() {

    return activeCapabilityRegistry

}



function getSpacemonkeyAgentRuntime() {

    return agentRuntime

}



function getSpacemonkeyWorkspace() {

    return activeWorkspace

}



export {

    startSpacemonkeyRuntimeBootstrap,

    getSpacemonkeyBootstrapStatus,

    getSpacemonkeyToolBus,

    getSpacemonkeySkillEngine,

    getSpacemonkeyWorkflowEngine,

    getSpacemonkeyPluginManager,

    getSpacemonkeyCapabilityRegistry,

    getSpacemonkeyAgentRuntime,

    getSpacemonkeyWorkspace,

}