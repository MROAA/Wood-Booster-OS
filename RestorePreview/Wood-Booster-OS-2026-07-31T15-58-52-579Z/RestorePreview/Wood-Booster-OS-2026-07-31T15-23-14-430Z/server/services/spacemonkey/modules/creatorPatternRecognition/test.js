import {
  analyzePattern,
  recognizeDecisionPattern,
  getPatterns,
  getPatternsByCategory,
  getLatestPatterns,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR PATTERN RECOGNITION ==="
)



const pattern =
  analyzePattern({

    source:
      "creator-decision-memory",


    category:
      "development",


    observation:
      "Creator prefers isolated modular growth.",


    evidence:

      [
        "Protect stable core.",
        "Build one module at a time.",
      ],

  })



console.log(
  pattern
)



console.log(
  "\n=== DECISION ANALYSIS ==="
)



console.log(
  recognizeDecisionPattern([

    {

      reason:
        "Protect stable architecture.",

      lesson:
        "Modules allow safe evolution.",

    },

    {

      reason:
        "Keep systems understandable.",

      lesson:
        "Small modules are easier to maintain.",

    },

  ])
)



console.log(
  "\n=== ALL PATTERNS ==="
)



console.log(
  getPatterns()
)



console.log(
  "\n=== DEVELOPMENT PATTERNS ==="
)



console.log(
  getPatternsByCategory(
    "development"
  )
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestPatterns()
)
