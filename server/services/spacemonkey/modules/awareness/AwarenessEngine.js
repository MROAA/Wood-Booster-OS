import {
  createEngine,
  EventTypes,
} from "../../sdk/index.js"

const AwarenessEngine = createEngine({
  id: "awareness-engine",

  name: "Awareness Engine",

  description:
    "Ylläpitää Spacemonkeyn reaaliaikaista tilannetietoisuutta.",

  async initialize(runtime) {
    runtime.logger.info(
      "Awareness Engine initialized"
    )

    runtime.writeState(
      "awareness",
      {
        page: null,
        project: null,
        customer: null,
        workflow: null,
        task: null,

        intent: null,
        goal: null,
        attention: null,

        updatedAt:
          new Date().toISOString(),
      }
    )
  },

  async start(runtime) {
    runtime.logger.info(
      "Awareness Engine started"
    )
  },

  async update(runtime, tick) {

    const awareness =
      runtime.readState(
        "awareness",
        {}
      )

    awareness.updatedAt =
      new Date().toISOString()

    runtime.writeState(
      "awareness",
      awareness
    )

    await runtime.emit(
      EventTypes.CONTEXT_UPDATED,
      awareness
    )
  },

  async evaluate(input) {

    return {
      confidence: 1,
      result: input,
      reason:
        "Awareness tracks runtime state.",
    }
  },

  async health(runtime) {

    return {
      healthy: true,

      awareness:
        runtime.readState(
          "awareness"
        ),
    }
  },

  async snapshot(runtime) {

    return runtime.readState(
      "awareness"
    )
  },

  async reset(runtime) {

    runtime.writeState(
      "awareness",
      {}
    )
  },
})

export default AwarenessEngine
