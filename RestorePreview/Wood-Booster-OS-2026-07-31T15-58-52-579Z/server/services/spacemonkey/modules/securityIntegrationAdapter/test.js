import {
  createSecurityContext,
  evaluateAction,
  getIntegrationStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY INTEGRATION ADAPTER ==="
)



console.log(
  createSecurityContext()
)



console.log(
  "\n=== ACTION VALIDATION ==="
)



console.log(
  evaluateAction(
    "execute external tool"
  )
)



console.log(
  "\n=== INTEGRATION STATUS ==="
)



console.log(
  getIntegrationStatus()
)
