/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Agent Context
 *
 * Yhteinen konteksti kaikille agenteille.
 */

class AgentContext {

    constructor({

        task = null,

        memory = null,

        planner = null,

        toolBus = null,

        runtime = null,

        operator = null,

        logger = console,

    } = {}) {

        this.task = task

        this.memory = memory

        this.planner = planner

        this.toolBus = toolBus

        this.runtime = runtime

        this.operator = operator

        this.logger = logger

        this.createdAt = new Date().toISOString()

        this.metadata = {}

    }

    set(key, value) {

        this.metadata[key] = value

    }

    get(key) {

        return this.metadata[key]

    }

    snapshot() {

        return {

            createdAt: this.createdAt,

            task: this.task,

            metadata: this.metadata,

        }

    }

}

export default AgentContext
