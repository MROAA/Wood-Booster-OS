/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Agent Runtime Bootstrap
 *
 * Liittää Agent Layerin
 * olemassa olevaan Runtimeen.
 */

import AgentRuntime from "./AgentRuntime.js"

import registerAgents from "./registerAgents.js"


let started = false

let agentRuntime = null


function startAgentRuntimeBootstrap({

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

            agentRuntime,

        }

    }


    agentRuntime =
        new AgentRuntime({
            logger,
        })


    registerAgents({

        agentRuntime,

        planner,

        toolBus,

        memory,

        logger,

    })


    started = true


    logger.info?.(
        "Agent Runtime Bootstrap READY"
    )


    return {

        success: true,

        status:
            "started",

        agentRuntime,

    }

}


function getAgentRuntimeStatus() {

    return {

        started,

        agents:
            agentRuntime
                ? agentRuntime.summary()
                : null,

    }

}


export {

    startAgentRuntimeBootstrap,

    getAgentRuntimeStatus,

}
