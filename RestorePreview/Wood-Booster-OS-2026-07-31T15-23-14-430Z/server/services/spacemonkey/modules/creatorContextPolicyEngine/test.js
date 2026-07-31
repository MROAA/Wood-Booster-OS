import {
  evaluatePolicy,
  getPolicies,
  getPolicyEvents,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR CONTEXT POLICY ENGINE ==="
)



console.log(
  getPolicies()
)



console.log(
  "\n=== POLICY CHECK ==="
)



console.log(
  evaluatePolicy({

    requester:
      "personality-runtime",


    purpose:
      "Create operator context.",


    data:

      [
        "creator-philosophy",
        "development-principles",
      ],

  })
)



console.log(
  "\n=== POLICY EVENTS ==="
)



console.log(
  getPolicyEvents()
)
