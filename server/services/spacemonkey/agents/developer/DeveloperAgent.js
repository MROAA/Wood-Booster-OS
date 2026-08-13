/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Developer Agent
 *
 * Ohjaa ohjelmistokehityksen workflowta.
 */

class DeveloperAgent {


    constructor({

        workflow,

        planner,

        memory,

        toolBus,

        logger = console,

    } = {}) {


        this.id =
            "developer-agent"


        this.name =
            "Developer Agent"


        this.workflow =
            workflow


        this.planner =
            planner


        this.memory =
            memory


        this.toolBus =
            toolBus


        this.logger =
            logger

    }



    canHandle(task) {


        const keywords = [

            "python",

            "javascript",

            "typescript",

            "react",

            "node",

            "c++",

            "cpp",

            "docker",

            "git",

            "linux",

            "code",

            "program",

            "bug",

            "error",

            "fix",

        ]


        const text =
            JSON.stringify(task)
                .toLowerCase()



        return keywords.some(
            keyword =>
                text.includes(keyword)
        )

    }



    async execute(task) {


        this.logger.info(
            `[DeveloperAgent] ${task.type ?? "task"}`
        )


        if (this.workflow) {


            return await this.workflow.execute({

                ...task,

                agent:
                    this.id,

            })


        }


        const plan =
            await this.planner.createPlan(task)



        const result =
            await this.toolBus.execute(plan)



        return {

            success: true,

            agent:
                this.id,

            plan,

            result,

        }

    }


}


export default DeveloperAgent
