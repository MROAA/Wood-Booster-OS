/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Agent Runtime Integration
 *
 * Liittää agenttikerroksen Spacemonkey runtimeen.
 */

import {
    startAgentRuntimeBootstrap,
} from "./agentRuntimeBootstrap.js"


let started = false

let runtime = null


function integrateAgentRuntime({

    planner,

    toolBus,

    memory,

    logger = console,

} = {}) {


    if (started) {

        return {

            success: true,

            status:
                "already_started",

            runtime,

        }

    }


    const result =
        startAgentRuntimeBootstrap({

            planner,

            toolBus,

            memory,

            logger,

        })


    runtime =
        result.agentRuntime


    started = true


    logger.info?.(
        "Agent Runtime Integration READY"
    )


    return {

        success: true,

        status:
            "ready",

        runtime,

    }

}


function getAgentRuntimeIntegrationStatus() {

    return {

        started,

        runtime:
            runtime
                ? "READY"
                : "NOT_STARTED",

    }

}


export {

    integrateAgentRuntime,

    getAgentRuntimeIntegrationStatus,

}
