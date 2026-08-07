/**
 * Wood-Booster OS
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
