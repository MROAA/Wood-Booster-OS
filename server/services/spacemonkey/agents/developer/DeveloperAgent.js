/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Developer Agent
 *
 * Ohjaa ohjelmistokehityksen workflowta.
 */

// Vain luku -haun hakusana: tiedostonimen osa, ei polkua eikä
// erikoismerkkejä.
const READ_ONLY_SEARCH_PATTERN = /^[\p{L}\p{N}._-]{2,60}$/u

class DeveloperAgent {


    constructor({

        workflow,

        planner,

        memory,

        toolBus,

        projectRoot = null,

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


        // Vain luku -haku tehdään aina tämän hakemiston sisällä -
        // tehtävä ei voi valita hakemistoa itse.
        this.projectRoot =
            projectRoot


        this.logger =
            logger

    }



    /*
     * Agent Runtime kysyy tätä ennen kuin valitsee agentin. Valmis vain
     * jos vain luku -haun riippuvuudet ovat oikeasti olemassa.
     */
    health() {


        const missing = []


        if (typeof this.workflow?.inspect !== "function") {
            missing.push("workflow.inspect")
        }


        if (!this.projectRoot) {
            missing.push("projectRoot")
        }


        return {

            ready:
                missing.length === 0,

            missing,

        }

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


        // Oikeustaso observe (Agent Runtime asettaa sen kyvykkyyden
        // mukaan): vain tiedostohaku, ei koskaan hyväksyntä-, kirjoitus-,
        // testi- tai commit-vaiheita.
        if (task?.access === "observe") {


            if (!this.projectRoot || typeof this.workflow?.inspect !== "function") {

                return {

                    success: false,

                    agent:
                        this.id,

                    error:
                        "read-only inspection is not available",

                }

            }


            if (!READ_ONLY_SEARCH_PATTERN.test(String(task.search ?? ""))) {

                return {

                    success: false,

                    agent:
                        this.id,

                    error:
                        "invalid search term",

                }

            }


            const inspection =
                await this.workflow.inspect({

                    projectPath:
                        this.projectRoot,

                    search:
                        task.search,

                })


            return {

                ...inspection,

                agent:
                    this.id,

            }


        }


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
