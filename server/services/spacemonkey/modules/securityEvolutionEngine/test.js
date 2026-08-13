import {
  createSecurityObservation,
  createImprovementProposal,
  getSecurityEvolution,
  getHighPriorityItems,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY EVOLUTION ENGINE ==="
)



console.log(
  createSecurityObservation({

    area:
      "internet-access",

    observation:
      "External access requires stronger validation.",

    severity:
      "high",

  })
)



console.log(
  createImprovementProposal({

    title:
      "Improve external request validation",

    reason:
      "Reduce risk before internet connectivity.",

    priority:
      "high",

  })
)



console.log(
  "\n=== SECURITY EVOLUTION ==="
)



console.log(
  getSecurityEvolution()
)



console.log(
  "\n=== HIGH PRIORITY ==="
)



console.log(
  getHighPriorityItems()
)
