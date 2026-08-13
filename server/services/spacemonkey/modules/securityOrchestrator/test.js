import {
  createSecurityOverview,
  getSecurityComponent,
  getSecurityHealth,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY ORCHESTRATOR ==="
)



console.log(
  createSecurityOverview()
)



console.log(
  "\n=== POLICY ENGINE ==="
)



console.log(
  getSecurityComponent(
    "security-policy-engine"
  )
)



console.log(
  "\n=== SECURITY HEALTH ==="
)



console.log(
  getSecurityHealth()
)
