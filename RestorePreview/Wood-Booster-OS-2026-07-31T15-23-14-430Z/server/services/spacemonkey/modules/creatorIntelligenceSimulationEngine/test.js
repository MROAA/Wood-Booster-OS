import {
  createSimulation,
  evaluateOutcome,
  compareScenarios,
  getSimulations,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE SIMULATION ENGINE ==="
)



const evaluation =
  evaluateOutcome({

    positive:
      true,


    negative:
      false,


    uncertainty:
      true,

  })



console.log(
  "\n=== OUTCOME ==="
)



console.log(
  evaluation
)



console.log(
  "\n=== SIMULATION ==="
)



console.log(
  createSimulation({

    decision:
      "Add new isolated security module.",


    scenario:
      "Creator Layer expansion.",


    expectedOutcome:
      "Improved long-term stability.",


    risks:

      [
        "More complexity.",
      ],


    alternatives:

      [
        "Modify existing core.",
        "Create separate module.",
      ],

  })
)



console.log(
  "\n=== SCENARIO COMPARISON ==="
)



console.log(
  compareScenarios(

    [
      "Expand module system.",
      "Change core architecture.",
    ]

  )
)



console.log(
  "\n=== HISTORY ==="
)



console.log(
  getSimulations()
)
