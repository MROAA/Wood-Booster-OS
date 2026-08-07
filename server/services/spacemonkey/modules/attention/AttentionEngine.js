import {
  createEngine,
  EventTypes,
} from "../../sdk/index.js"

const DEFAULT_ATTENTION = {
  primary: null,
  secondary: [],
  priority: "normal",
  confidence: 1,
  reason: null,
  updatedAt: null,
}

const AttentionEngine = createEngine({
  id: "attention-engine",

  name: "Attention Engine",

  description:
    "Hallinnoi Spacemonkeyn tämänhetkistä tarkkaavaisuutta.",

  async initialize(runtime) {
    runtime.writeState(
      "attention",
      {
        ...DEFAULT_ATTENTION,
      }
    )

    runtime.logger.info(
      "Attention Engine initialized"
    )
  },

  async start(runtime) {
    runtime.logger.info(
      "Attention Engine started"
    )
  },

  async update(runtime) {
    const awareness =
      runtime.readState(
        "awareness",
        {}
      )

    const attention = {
      primary:
        awareness.page ??
        "dashboard",

      secondary: [
        awareness.project,
        awareness.customer,
        awareness.workflow,
      ].filter(Boolean),

      priority: "normal",

      confidence: 1,

      reason:
        "Derived from current awareness.",

      updatedAt:
        new Date().toISOString(),
    }

    runtime.writeState(
      "attention",
      attention
    )

    await runtime.emit(
      EventTypes.ATTENTION_CHANGED,
      attention
    )
  },

  async evaluate(input) {
    return {
      confidence: 1,
      result: input,
      reason:
        "Attention evaluated.",
    }
  },

  async health(runtime) {
    return {
      healthy: true,
      attention:
        runtime.readState(
          "attention"
        ),
    }
  },

  async snapshot(runtime) {
    return runtime.readState(
      "attention"
    )
  },

  async reset(runtime) {
    runtime.writeState(
      "attention",
      {
        ...DEFAULT_ATTENTION,
      }
    )
  },
})

export default AttentionEngine
