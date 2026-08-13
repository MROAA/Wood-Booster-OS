/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Base Agent
 *
 * Kaikkien agenttien yhteinen kantaluokka.
 */

class BaseAgent {

    constructor({

        id,

        name,

        keywords = [],

        planner,

        toolBus,

        memory,

        logger = console,

    } = {}) {

        if (!id) {
            throw new Error("Agent id missing.")
        }

        this.id = id

        this.name = name

        this.keywords = keywords

        this.planner = planner

        this.toolBus = toolBus

        this.memory = memory

        this.logger = logger

    }

    canHandle(task) {

        const text =
            JSON.stringify(task).toLowerCase()

        return this.keywords.some(
            keyword =>
                text.includes(
                    keyword.toLowerCase()
                )
        )

    }

    async beforeExecute(task) {

        return task

    }

    async afterExecute(result) {

        return result

    }

    async execute(task) {

        this.logger.info(
            `[${this.name}] Starting task`
        )

        await this.beforeExecute(task)

        const plan =
            await this.planner.createPlan(task)

        const result =
            await this.toolBus.execute(plan)

        await this.afterExecute(result)

        return {

            success: true,

            agent: this.id,

            plan,

            result,

        }

    }

}

export default BaseAgent
