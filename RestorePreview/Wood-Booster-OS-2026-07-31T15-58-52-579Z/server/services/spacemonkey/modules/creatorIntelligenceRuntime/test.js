import {
  initializeCreatorRuntime,
  createCreatorIntelligenceContext,
  getRuntimeStatus,
  shutdownCreatorRuntime,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE RUNTIME ==="
)



console.log(
  initializeCreatorRuntime({

    modules:

      [

        "creator-context-provider",

        "creator-context-security",

        "creator-context-permission",

        "creator-context-policy",

        "creator-context-export",

      ],

  })
)



console.log(
  "\n=== RUNTIME STATUS ==="
)



console.log(
  getRuntimeStatus()
)



console.log(
  "\n=== CREATOR CONTEXT ==="
)



console.log(
  createCreatorIntelligenceContext()
)



console.log(
  "\n=== SHUTDOWN TEST ==="
)



console.log(
  shutdownCreatorRuntime()
)
