/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Agent Runtime Integration Test
 */

import {
    integrateAgentRuntime,
} from "../agents/runtime/agentRuntimeIntegration.js"


const logger = console


const mockPlanner = {

    async createPlan(task) {

        return {

            task,

            status:
                "planned",

        }

    }

}


const mockToolBus = {

    async execute(plan) {

        return {

            executed:
                true,

            plan,

        }

    }

}


const result =
    integrateAgentRuntime({

        planner:
            mockPlanner,

        toolBus:
            mockToolBus,

        memory:
            null,

        logger,

    })


console.log(
    "AGENT RUNTIME INTEGRATION RESULT"
)


console.log(
    JSON.stringify(
        {

            success:
                result.success,

            status:
                result.status,

            agents:
                result.runtime.summary(),

        },
        null,
        2
    )
)
