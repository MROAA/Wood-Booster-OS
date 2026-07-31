import {
  createExplanation,
  evaluateConfidence,
  getExplanations,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE EXPLANATION ENGINE ==="
)



const confidence =
  evaluateConfidence({

    evidence:
      true,


    validation:
      true,


    trust:
      true,

  })



console.log(
  "\n=== CONFIDENCE ==="
)



console.log(
  confidence
)



console.log(
  "\n=== EXPLANATION ==="
)



console.log(
  createExplanation({

    decision:
      "Create isolated MVP module.",


    sources:

      [
        "Creator Philosophy",
        "Architecture Principles",
      ],


    rules:

      [
        "Protect stable foundations.",
        "Prefer modular growth.",
      ],


    risks:

      [
        "Increased module count.",
      ],


    confidence:
      confidence.score,

  })
)



console.log(
  "\n=== HISTORY ==="
)



console.log(
  getExplanations()
)
