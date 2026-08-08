/**
 * Wood-Booster OS
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

import SkillEngine from "./skills/SkillEngine.js"

import WorkflowEngine from "./workflows/WorkflowEngine.js"

import PluginManager from "./plugins/PluginManager.js"

import { registerInstagramPublisherPlugin } from "./plugins/instagram-publisher/index.js"



let booted = false

let kernel = null

let agentRuntime = null

let activeToolBus = null

let activeSkillEngine = null

let activeWorkflowEngine = null

let activePluginManager = null



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

    registerInstagramPublisherPlugin({
        toolBus,
        skillEngine,
        workflowEngine,
        pluginManager,
        logger,
    })

    activeToolBus = toolBus

    activeSkillEngine = skillEngine

    activeWorkflowEngine = workflowEngine

    activePluginManager = pluginManager



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



export {

    startSpacemonkeyRuntimeBootstrap,

    getSpacemonkeyBootstrapStatus,

    getSpacemonkeyToolBus,

    getSpacemonkeySkillEngine,

    getSpacemonkeyWorkflowEngine,

    getSpacemonkeyPluginManager,

}