import {
  createEngine,
  EventTypes,
} from "../../sdk/index.js"

const EMPTY_CONTEXT = {
  page: null,
  project: null,
  customer: null,
  workflow: null,
  task: null,

  attention: null,
  intent: null,
  goal: null,

  timestamp: null,
}

const ContextEngine = createEngine({
  id: "context-engine",

  name: "Context Engine",

  description:
    "Rakentaa Spacemonkeyn aktiivisen AI-kontekstin.",

  async initialize(runtime) {

    runtime.writeState(
      "context",
      {
        ...EMPTY_CONTEXT,
      }
    )

    runtime.logger.info(
      "Context Engine initialized"
    )
  },

  async start(runtime) {

    runtime.logger.info(
      "Context Engine started"
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

    const context = {

      page:
        awareness.page ?? null,

      project:
        awareness.project ?? null,

      customer:
        awareness.customer ?? null,

      workflow:
        awareness.workflow ?? null,

      task:
        awareness.task ?? null,

      attention:
        attention.primary ?? null,

      intent:
        awareness.intent ?? null,

      goal:
        awareness.goal ?? null,

      timestamp:
        new Date().toISOString(),
    }

    runtime.writeState(
      "context",
      context
    )

    await runtime.emit(
      EventTypes.CONTEXT_UPDATED,
      context
    )
  },

  async evaluate(input, evaluationContext, runtime) {

    return {
      confidence: 1,

      result: {
        input,

        context:
          runtime.readState(
            "context"
          ),
      },

      reason:
        "Current runtime context attached."
    }
  },

  async health(runtime) {

    return {
      healthy: true,

      context:
        runtime.readState(
          "context"
        ),
    }
  },

  async snapshot(runtime) {

    return runtime.readState(
      "context"
    )
  },

  async reset(runtime) {

    runtime.writeState(
      "context",
      {
        ...EMPTY_CONTEXT,
      }
    )
  },
})

export default ContextEngine
