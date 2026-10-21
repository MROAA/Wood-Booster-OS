/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Instagram Agent
 *
 * Vastaa Instagramiin liittyvistä tehtävistä.
 */

class InstagramAgent {

    constructor({
        planner,
        toolBus,
        memory,
        logger = console,
    } = {}) {

        this.id = "instagram-agent"
        this.name = "Instagram Agent"

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

            "instagram",
            "reel",
            "story",
            "post",
            "carousel",
            "caption",
            "hashtag",
            "social media",
            "meta"

        ]

        const text =
            JSON.stringify(task).toLowerCase()

        return keywords.some(
            keyword => text.includes(keyword)
        )

    }

    async execute(task) {

        this.logger.info(
            `[InstagramAgent] ${task.type ?? "task"}`
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

export default InstagramAgent
