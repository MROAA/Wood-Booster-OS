/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Workflow Engine
 *
 * Suorittaa useasta Skillistä koostuvia työnkulkuja.
 */

class WorkflowEngine {

    constructor({
        skillEngine,
        logger = console,
    } = {}) {

        if (!skillEngine) {
            throw new Error("SkillEngine required.")
        }

        this.skillEngine = skillEngine
        this.logger = logger

        this.workflows = new Map()

    }

    register(workflow) {

        if (!workflow?.id) {
            throw new Error("Workflow id missing.")
        }

        this.workflows.set(workflow.id, workflow)

        this.logger.info?.(
            `Workflow registered: ${workflow.id}`
        )

        return workflow

    }

    async execute(id, context) {

        const workflow = this.workflows.get(id)

        if (!workflow) {
            throw new Error(
                `Workflow not found: ${id}`
            )
        }

        const results = []

        for (const skillId of workflow.skills) {

            const result =
                await this.skillEngine.execute(
                    skillId,
                    context
                )

            results.push(result)
        }

        return {

            workflow: id,

            success: true,

            results,

        }

    }

    list() {

        return [...this.workflows.values()]

    }

}

export default WorkflowEngine
