/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Bootstrap
 *
 * Käynnistää Spacemonkeyn palvelut.
 */

import AgentRuntime from "../agents/runtime/AgentRuntime.js"

import registerAgents from "../agents/runtime/registerAgents.js"


class SpacemonkeyBootstrap {

    constructor({

        planner,

        toolBus,

        memory,

        logger = console,

    } = {}) {


        this.logger = logger


        this.agentRuntime =
            new AgentRuntime({
                logger,
            })


        this.planner =
            planner


        this.toolBus =
            toolBus


        this.memory =
            memory

    }


    async start() {


        this.logger.info(
            "Starting Spacemonkey..."
        )


        registerAgents({

            agentRuntime:
                this.agentRuntime,

            planner:
                this.planner,

            toolBus:
                this.toolBus,

            memory:
                this.memory,

            logger:
                this.logger,

        })


        this.logger.info(
            "Spacemonkey agents loaded."
        )


        return {

            success: true,

            agentRuntime:
                this.agentRuntime,

        }

    }


}


export default SpacemonkeyBootstrap
