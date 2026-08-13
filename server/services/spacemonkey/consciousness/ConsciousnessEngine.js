/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Consciousness Engine
 *
 * Muodostaa Spacemonkeyn ajantasaisen
 * tilannekuvan ennen päätöksentekoa.
 */

class ConsciousnessEngine {

    constructor({

        awareness,
        memory,
        context,
        decisionEngine,
        agentRuntime,
        workflowEngine,
        skillEngine,
        logger = console,

    } = {}) {

        this.awareness = awareness
        this.memory = memory
        this.context = context
        this.decisionEngine = decisionEngine
        this.agentRuntime = agentRuntime
        this.workflowEngine = workflowEngine
        this.skillEngine = skillEngine
        this.logger = logger

    }

    async snapshot() {

        return {

            timestamp: new Date().toISOString(),

            awareness:
                await this.awareness?.snapshot?.(),

            memory:
                await this.memory?.snapshot?.(),

            context:
                await this.context?.snapshot?.(),

            agents:
                this.agentRuntime?.summary?.(),

            workflows:
                this.workflowEngine?.list?.() ?? [],

            skills:
                this.skillEngine?.summary?.(),

        }

    }

    async think(task) {

        const state =
            await this.snapshot()

        const decision =
            await this.decisionEngine.decide(task)

        return {

            state,

            decision,

        }

    }

}

export default ConsciousnessEngine
