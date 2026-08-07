/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Bootstrap Test
 */

import SpacemonkeyBootstrap from "../bootstrap/spacemonkeyBootstrap.js"


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


const bootstrap =
    new SpacemonkeyBootstrap({

        planner:
            mockPlanner,

        toolBus:
            mockToolBus,

        memory:
            null,

        logger,

    })


const result =
    await bootstrap.start()


console.log(
    "BOOTSTRAP RESULT"
)


console.log(
    JSON.stringify(
        {
            success:
                result.success,

            agents:
                result.agentRuntime.summary(),

        },
        null,
        2
    )
)


const taskResult =
    await result.agentRuntime.execute({

        message:
            "Analysoi Wood-Booster-OS projekti",

        language:
            "javascript",

        projectPath:
            "/home/marc/Wood-Booster-AI/Wood-Booster-OS",

        search:
            ".js",

        type:
            "analysis",

    })

console.log(
    "TASK RESULT"
)


console.log(
    JSON.stringify(
        taskResult,
        null,
        2
    )
)
