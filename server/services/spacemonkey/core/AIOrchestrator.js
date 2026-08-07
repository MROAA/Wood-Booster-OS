/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * AI Orchestrator
 *
 * Keskitetty päätöksentekokerros.
 */

class AIOrchestrator {

    constructor({

        awareness,

        attention,

        context,

        memory,

        planner,

        executor,

        logger = console,

    }) {

        this.awareness = awareness
        this.attention = attention
        this.context = context
        this.memory = memory
        this.planner = planner
        this.executor = executor
        this.logger = logger

    }

    async process(input) {

        this.logger.info(
            "AI Orchestrator started."
        )

        const awareness =
            await this.awareness.snapshot()

        const attention =
            await this.attention.snapshot()

        const context =
            await this.context.snapshot()

        const memory =
            await this.memory.snapshot()

        const plan =
            await this.planner.createPlan({

                input,

                awareness,

                attention,

                context,

                memory,

            })

        const result =
            await this.executor.executePlan(
                plan
            )

        return {

            success: true,

            awareness,

            attention,

            context,

            memory,

            plan,

            result,

        }

    }

}

export default AIOrchestrator
