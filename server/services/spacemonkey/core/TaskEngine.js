/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Task Engine
 *
 * Muuttaa käyttäjän pyynnön suoritettavaksi tehtäväksi.
 */

class TaskEngine {

    constructor({
        orchestrator,
        logger = console,
    } = {}) {

        this.orchestrator = orchestrator
        this.logger = logger

    }

    async execute(request) {

        const task = {

            id:
                crypto.randomUUID(),

            createdAt:
                new Date().toISOString(),

            status:
                "pending",

            request,

            plan: null,

            result: null,

        }

        task.plan =
            await this.orchestrator.process(
                request
            )

        task.status = "running"

        task.result =
            task.plan.result

        task.status = "completed"

        return task

    }

}

export default TaskEngine
