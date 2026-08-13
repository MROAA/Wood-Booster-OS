/**
 * Wood-Booster HQ
 * Spacemonkey Runtime
 *
 * Käynnistää koko Spacemonkey-järjestelmän.
 */

import OperatorProfile from "../core/OperatorProfile.js"

import AgentRuntime from "../agents/runtime/AgentRuntime.js"

import registerAgents from "../agents/runtime/registerAgents.js"

import CapabilityManager from "../capabilities/CapabilityManager.js"

import CapabilityPackRegistry from "../capabilities/CapabilityPackRegistry.js"

import PluginManager from "../plugins/PluginManager.js"

import ToolBus from "../toolbus/ToolBus.js"



class SpacemonkeyRuntime {


    constructor({

        logger = console,

    } = {}) {


        this.logger = logger


        this.operator =
            OperatorProfile



        this.packRegistry =
            new CapabilityPackRegistry({

                logger,

            })



        this.capabilityManager =
            new CapabilityManager({

                registry:
                    this.packRegistry,

                logger,

            })



        this.pluginManager =
            new PluginManager({

                logger,

            })



        this.toolBus =
            new ToolBus({

                logger,

            })



        this.agentRuntime =
            new AgentRuntime({

                logger,

            })



        registerAgents({

            agentRuntime:
                this.agentRuntime,

            planner:
                null,

            toolBus:
                this.toolBus,

            memory:
                null,

            logger,

        })



        this.state =
            "stopped"

    }



    async start() {


        this.logger.info(
            "================================="
        )


        this.logger.info(
            "Starting Spacemonkey..."
        )


        this.logger.info(
            "Operator:",
            this.operator.name
        )


        this.logger.info(
            "Role:",
            this.operator.role
        )


        this.state =
            "running"



        this.logger.info(
            "Spacemonkey Ready."
        )


        this.logger.info(
            "================================="
        )


    }



    async stop() {


        this.logger.info(
            "Stopping Spacemonkey..."
        )


        this.state =
            "stopped"

    }



    status() {


        return {


            state:
                this.state,


            operator:
                this.operator.name,


            role:
                this.operator.role,


            packs:
                this.capabilityManager.summary(),


            plugins:
                this.pluginManager.summary(),


            tools:
                this.toolBus.list(),


            agents:
                this.agentRuntime.summary(),

        }

    }


}


export default SpacemonkeyRuntime