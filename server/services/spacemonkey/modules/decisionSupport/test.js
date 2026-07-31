import {
  createDecisionFramework,
  evaluateDecision,
} from "./index.js"



console.log(
  "=== SPACEMONEY DECISION SUPPORT ==="
)



console.log(
  createDecisionFramework()
)



console.log(
  "\n=== DECISION TEST ==="
)



console.log(
  evaluateDecision(
    "Add new AI capability module"
  )
)
