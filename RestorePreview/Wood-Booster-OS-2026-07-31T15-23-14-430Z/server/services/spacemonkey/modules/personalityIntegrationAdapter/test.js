import {
  createPersonalityPayload,
  validatePersonalityPayload,
  getAdapterStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY INTEGRATION ADAPTER ==="
)



console.log(
  getAdapterStatus()
)



const payload =
  createPersonalityPayload({

    context:

      {
        identity:
          "Spacemonkey",

        traits:

          [
            "friendly",
            "polite",
            "patient",
          ],

        communication:

          {
            humor:
              true,

            respectful:
              true,

          },

      },


    runtime:

      {
        status:
          "active",

        activeModules:

          [
            "personality-runtime-engine",
            "personality-memory",
          ],

      },

  })



console.log(
  "\n=== PAYLOAD ==="
)



console.log(
  payload
)



console.log(
  "\n=== VALIDATION ==="
)



console.log(
  validatePersonalityPayload(
    payload
  )
)
