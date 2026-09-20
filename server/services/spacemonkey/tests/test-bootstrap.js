/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Bootstrap Test
 */

import path from "node:path"

import { fileURLToPath } from "node:url"

import SpacemonkeyBootstrap from "../bootstrap/spacemonkeyBootstrap.js"

// tests/ -> spacemonkey -> services -> server -> repo root. Ei
// kiinteää /home/marc-polkua - ks. perustelu
// test-code-dependency-analyzer.js:ssä.
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

const PROJECT_ROOT = path.resolve(currentDirectory, "../../../..")


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
            PROJECT_ROOT,

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
