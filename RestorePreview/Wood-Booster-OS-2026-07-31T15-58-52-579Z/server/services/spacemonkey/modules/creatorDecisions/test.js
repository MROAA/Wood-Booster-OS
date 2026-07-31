import {
  getCreatorDecisions,
  findDecision,
  getDecisionsByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR DECISIONS ==="
)



console.log(
  getCreatorDecisions()
)



console.log(
  "\n=== CORE PROTECTION ==="
)



console.log(
  findDecision(
    "core-protection"
  )
)



console.log(
  "\n=== ARCHITECTURE DECISIONS ==="
)



console.log(
  getDecisionsByCategory(
    "architecture"
  )
)
