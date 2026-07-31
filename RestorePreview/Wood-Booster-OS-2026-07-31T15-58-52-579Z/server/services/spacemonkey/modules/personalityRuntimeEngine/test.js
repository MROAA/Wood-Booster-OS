import {
  initializePersonalityRuntime,
  processPersonalityInput,
  getRuntimeStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY RUNTIME ENGINE ==="
)



console.log(
  initializePersonalityRuntime({

    modules:

      [
        {
          id:
            "personality-character",

          status:
            "active",
        },

        {
          id:
            "personality-humor",

          status:
            "active",
        },

      ],


    context:
      {
        identity:
          "Spacemonkey",
      },

  })
)



console.log(
  "\n=== INPUT TEST ==="
)



console.log(
  processPersonalityInput(
    "Kiitos avusta, tämä toimii!"
  )
)



console.log(
  processPersonalityInput(
    "Vittu tämä ei toimi"
  )
)



console.log(
  "\n=== STATUS ==="
)



console.log(
  getRuntimeStatus()
)
