/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * WordPress Agent
 *
 * Vastaa WordPressiin liittyvistä tehtävistä.
 */

class WordPressAgent {

    constructor({
        planner,
        toolBus,
        memory,
        logger = console,
    } = {}) {

        this.id = "wordpress-agent"
        this.name = "WordPress Agent"

        this.planner = planner
        this.toolBus = toolBus
        this.memory = memory
        this.logger = logger

    }

    /*
     * Agent Runtime kysyy tätä ennen valintaa. execute() tarvitsee
     * plannerin ja ToolBusin - ilman niitä agentti ei ole toimintakunnossa.
     */
    health() {

        const missing = []

        if (typeof this.planner?.createPlan !== "function") {
            missing.push("planner")
        }

        if (typeof this.toolBus?.execute !== "function") {
            missing.push("toolBus")
        }

        return { ready: missing.length === 0, missing }

    }

    canHandle(task) {

        const keywords = [

            "wordpress",
            "blog",
            "article",
            "page",
            "post",
            "woocommerce",
            "seo",
            "plugin",
            "theme"

        ]

        const text =
            JSON.stringify(task).toLowerCase()

        return keywords.some(
            keyword => text.includes(keyword)
        )

    }

    async execute(task) {

        this.logger.info(
            `[WordPressAgent] ${task.type ?? "task"}`
        )

        const plan =
            await this.planner.createPlan(task)

        const result =
            await this.toolBus.execute(plan)

        return {

            success: true,

            agent: this.id,

            plan,

            result,

        }

    }

}

export default WordPressAgent
