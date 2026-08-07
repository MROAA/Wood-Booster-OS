import {
  createEngine,
} from "../../sdk/index.js"

const CognitiveEngine = createEngine({
  id: "cognitive-engine",

  name: "Cognitive Engine",

  description:
    "Yhdistää Awareness-, Attention-, Context- ja MemoryEnginen yhdeksi ajattelutilaksi.",

  async initialize(runtime) {

    runtime.writeState(
      "cognition",
      {
        state: "idle",
        focus: null,
        goal: null,
        intent: null,
        confidence: 1,
        reasoning: [],
        updatedAt: null,
      }
    )

    runtime.logger.info(
      "Cognitive Engine initialized"
    )
  },

  async update(runtime) {

    const awareness =
      runtime.readState(
        "awareness",
        {}
      )

    const attention =
      runtime.readState(
        "attention",
        {}
      )

    const context =
      runtime.readState(
        "context",
        {}
      )

    const memory =
      runtime.readState(
        "memory",
        {}
      )

    const cognition = {

      state: "thinking",

      focus:
        attention.primary ??
        null,

      goal:
        context.goal ??
        null,

      intent:
        context.intent ??
        null,

      confidence:
        attention.confidence ??
        1,

      reasoning: [

        {
          type: "awareness",
          value: awareness.page,
        },

        {
          type: "project",
          value: context.project,
        },

        {
          type: "customer",
          value: context.customer,
        },

        {
          type: "working-memory",
          value:
            memory.working.length,
        },
      ],

      updatedAt:
        new Date().toISOString(),
    }

    runtime.writeState(
      "cognition",
      cognition
    )
  },

  async evaluate(input, evaluationContext, runtime) {

    return {

      confidence: 1,

      result: {

        cognition:
          runtime.readState(
            "cognition"
          ),

        input,
      },

      reason:
        "Cognitive state prepared."
    }
  },

  async health(runtime) {

    return {

      healthy: true,

      cognition:
        runtime.readState(
          "cognition"
        ),
    }
  },

  async snapshot(runtime) {

    return runtime.readState(
      "cognition"
    )
  },

  async reset(runtime) {

    runtime.writeState(
      "cognition",
      {
        state: "idle",
        focus: null,
        goal: null,
        intent: null,
        confidence: 1,
        reasoning: [],
        updatedAt: null,
      }
    )
  },
})

export default CognitiveEngine
