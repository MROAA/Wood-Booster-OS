/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Developer Agent Test
 */

import AgentRuntime from "../agents/runtime/AgentRuntime.js"

import DeveloperAgent from "../agents/developer/DeveloperAgent.js"


const logger = console


const mockPlanner = {

    async createPlan(task) {

        return {

            task,

            status: "planned",

        }

    }

}


const mockToolBus = {

    async execute(plan) {

        return {

            executed: true,

            plan,

        }

    }

}


const runtime =
    new AgentRuntime({
        logger,
    })


const developerAgent =
    new DeveloperAgent({

        planner:
            mockPlanner,

        toolBus:
            mockToolBus,

        memory:
            null,

        logger,

    })


runtime.register(
    developerAgent
)


const result =
    await runtime.execute({

        message:
            "Analysoi Python projekti",

        language:
            "python",

    })


console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
