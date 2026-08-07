import {
  createEngine,
} from "../../sdk/index.js"

const PlannerEngine = createEngine({
  id: "planner-engine",

  name: "Planner Engine",

  description:
    "Muodostaa seuraavan toimintasuunnitelman käyttäjän nykyisen tilanteen perusteella.",

  async initialize(runtime) {

    runtime.writeState(
      "planner",
      {
        currentPlan: [],
        nextAction: null,
        confidence: 1,
        updatedAt: null,
      }
    )

    runtime.logger.info(
      "Planner Engine initialized"
    )
  },

  async update(runtime) {

    const context =
      runtime.readState(
        "context",
        {}
      )

    const cognition =
      runtime.readState(
        "cognition",
        {}
      )

    const plan = []

    if (context.project) {
      plan.push(
        "Continue current project"
      )
    }

    if (context.workflow) {
      plan.push(
        `Continue workflow: ${context.workflow}`
      )
    }

    if (!context.project) {
      plan.push(
        "Select or create a project"
      )
    }

    const planner = {

      currentPlan: plan,

      nextAction:
        plan[0] ?? null,

      confidence:
        cognition.confidence ?? 1,

      updatedAt:
        new Date().toISOString(),
    }

    runtime.writeState(
      "planner",
      planner
    )
  },

  async evaluate(input, evaluationContext, runtime) {

    return {

      confidence: 1,

      result: {

        planner:
          runtime.readState(
            "planner"
          ),

        input,
      },

      reason:
        "Planning completed."
    }
  },

  async health(runtime) {

    return {

      healthy: true,

      planner:
        runtime.readState(
          "planner"
        ),
    }
  },

  async snapshot(runtime) {

    return runtime.readState(
      "planner"
    )
  },

  async reset(runtime) {

    runtime.writeState(
      "planner",
      {
        currentPlan: [],
        nextAction: null,
        confidence: 1,
        updatedAt: null,
      }
    )
  },
})

export default PlannerEngine
