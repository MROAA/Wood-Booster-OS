import {
  analyzeDecision,
  evaluateRisk,
  explainDecision,
  getDecisions,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE DECISION ENGINE ==="
)



const decision =
  analyzeDecision({

    question:
      "Should Creator Layer evolve with new module?",


    options:

      [
        "Create isolated MVP module.",
        "Modify core system.",
      ],


    context:

      {
        principle:
          "Protect stable foundations.",

      },


    risks:

      [
        "Architecture complexity.",
      ],

  })



console.log(
  "\n=== ANALYSIS ==="
)



console.log(
  decision
)



console.log(
  "\n=== RISK ==="
)



console.log(
  evaluateRisk({

    decision,

    riskLevel:
      "medium",

  })
)



console.log(
  "\n=== EXPLANATION ==="
)



console.log(
  explainDecision(
    decision
  )
)



console.log(
  "\n=== HISTORY ==="
)



console.log(
  getDecisions()
)
