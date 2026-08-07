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



let booted = false

let kernel = null

let agentRuntime = null



function startSpacemonkeyRuntimeBootstrap({

    planner,

    toolBus,

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



export {

    startSpacemonkeyRuntimeBootstrap,

    getSpacemonkeyBootstrapStatus,

}