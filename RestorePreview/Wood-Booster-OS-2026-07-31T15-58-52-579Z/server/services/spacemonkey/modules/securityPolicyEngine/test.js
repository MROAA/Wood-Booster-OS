import {
  getSecurityPolicy,
  evaluateSecurityRisk,
  getCriticalPolicies,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY POLICY ENGINE ==="
)



console.log(
  getSecurityPolicy()
)



console.log(
  "\n=== TERMINAL ACTION ==="
)



console.log(
  evaluateSecurityRisk({

    action:
      "execute terminal command",

    risk:
      "critical",

  })
)



console.log(
  "\n=== CRITICAL POLICIES ==="
)



console.log(
  getCriticalPolicies()
)
