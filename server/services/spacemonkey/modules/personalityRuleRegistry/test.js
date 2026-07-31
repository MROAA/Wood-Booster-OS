import {
  getPersonalityRegistry,
  findPersonalityRule,
  getRulesByCategory,
  getHighPriorityRules,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY RULE REGISTRY ==="
)



console.log(
  getPersonalityRegistry()
)



console.log(
  "\n=== FRIENDLY RULE ==="
)



console.log(
  findPersonalityRule(
    "friendly-character"
  )
)



console.log(
  "\n=== COMMUNICATION RULES ==="
)



console.log(
  getRulesByCategory(
    "communication"
  )
)



console.log(
  "\n=== HIGH PRIORITY RULES ==="
)



console.log(
  getHighPriorityRules()
)
