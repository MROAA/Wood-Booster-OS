import {
  evaluateAction,
  approveDecision,
  getRules,
  getDecisions,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE GOVERNANCE ENGINE ==="
)



console.log(
  getRules()
)



const decision =
  evaluateAction({

    action:
      "update creator philosophy",


    riskLevel:
      "high",


    requiresApproval:
      true,

  })



console.log(
  "\n=== DECISION ==="
)



console.log(
  decision
)



console.log(
  "\n=== APPROVAL ==="
)



console.log(
  approveDecision(
    decision.id
  )
)



console.log(
  "\n=== HISTORY ==="
)



console.log(
  getDecisions()
)
