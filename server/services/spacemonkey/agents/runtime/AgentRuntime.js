/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Agent Runtime
 *
 * Vastaa agenttien rekisteröinnistä,
 * valinnasta ja tehtävien suorittamisesta.
 */

class AgentRuntime {

    constructor({
        logger = console,
    } = {}) {

        this.logger = logger
        this.agents = new Map()

    }

    register(agent) {

        if (!agent?.id) {
            throw new Error("Agent id missing.")
        }

        this.agents.set(agent.id, agent)

        this.logger.info?.(
            `Agent registered: ${agent.id}`
        )

        return agent

    }

    unregister(id) {

        return this.agents.delete(id)

    }

    list() {

        return [...this.agents.values()]

    }

    find(task) {

        for (const agent of this.agents.values()) {

            if (
                typeof agent.canHandle === "function" &&
                agent.canHandle(task)
            ) {
                return agent
            }

        }

        return null

    }

    async execute(task) {

        const agent = this.find(task)

        if (!agent) {

            return {

                success: false,

                error: "No suitable agent found.",

                task,

            }

        }

        this.logger.info?.(
            `Selected agent: ${agent.id}`
        )

        return await agent.execute(task)

    }

    summary() {

        return {

            totalAgents:
                this.agents.size,

            agents:
                [...this.agents.keys()],

        }

    }

}

export default AgentRuntime
