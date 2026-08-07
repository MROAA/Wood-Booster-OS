/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Decision Engine
 *
 * Valitsee sopivan agentin ja workflow'n.
 */

class DecisionEngine {

    constructor({
        agentRuntime,
        workflowEngine,
        logger = console,
    } = {}) {

        this.agentRuntime = agentRuntime
        this.workflowEngine = workflowEngine
        this.logger = logger

    }

    async decide(task) {

        const agent =
            this.agentRuntime.find(task)

        if (!agent) {

            return {

                success: false,

                reason:
                    "No suitable agent found.",

            }

        }

        return {

            success: true,

            agentId:
                agent.id,

            workflowId:
                task.workflow ?? null,

            priority:
                task.priority ?? "normal",

        }

    }

}

export default DecisionEngine
