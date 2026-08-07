import {
  createEngine,
} from "../../sdk/index.js"

const MAX_WORKING_MEMORY = 100

const MemoryEngine = createEngine({
  id: "memory-engine",

  name: "Memory Engine",

  description:
    "Ylläpitää Spacemonkeyn työmuistia.",

  async initialize(runtime) {

    runtime.writeState(
      "memory",
      {
        working: [],
        recentProjects: [],
        recentCustomers: [],
        lastPrompt: null,
        lastResponse: null,
        updatedAt: null,
      }
    )

    runtime.logger.info(
      "Memory Engine initialized"
    )
  },

  async update(runtime) {

    const memory =
      runtime.readState(
        "memory",
        {}
      )

    const context =
      runtime.readState(
        "context",
        {}
      )

    if (context.project) {

      if (
        !memory.recentProjects.includes(
          context.project
        )
      ) {

        memory.recentProjects.unshift(
          context.project
        )

        memory.recentProjects =
          memory.recentProjects.slice(
            0,
            10
          )
      }
    }

    if (context.customer) {

      if (
        !memory.recentCustomers.includes(
          context.customer
        )
      ) {

        memory.recentCustomers.unshift(
          context.customer
        )

        memory.recentCustomers =
          memory.recentCustomers.slice(
            0,
            10
          )
      }
    }

    memory.updatedAt =
      new Date().toISOString()

    runtime.writeState(
      "memory",
      memory
    )
  },

  async remember(runtime, item) {

    const memory =
      runtime.readState(
        "memory"
      )

    memory.working.unshift({
      timestamp:
        new Date().toISOString(),

      ...item,
    })

    memory.working =
      memory.working.slice(
        0,
        MAX_WORKING_MEMORY
      )

    runtime.writeState(
      "memory",
      memory
    )

    return true
  },

  async evaluate(input) {

    return {
      confidence: 1,

      result: input,

      reason:
        "Working memory active."
    }
  },

  async health(runtime) {

    const memory =
      runtime.readState(
        "memory"
      )

    return {

      healthy: true,

      workingMemory:
        memory.working.length,

      recentProjects:
        memory.recentProjects.length,

      recentCustomers:
        memory.recentCustomers.length,
    }
  },

  async snapshot(runtime) {

    return runtime.readState(
      "memory"
    )
  },

  async reset(runtime) {

    runtime.writeState(
      "memory",
      {
        working: [],
        recentProjects: [],
        recentCustomers: [],
        lastPrompt: null,
        lastResponse: null,
        updatedAt: null,
      }
    )
  },
})

export default MemoryEngine
