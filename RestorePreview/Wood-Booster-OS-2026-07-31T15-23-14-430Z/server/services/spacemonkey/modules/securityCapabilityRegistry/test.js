import {
  getSecurityRegistry,
  findSecurityCapability,
  getCapabilitiesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY CAPABILITY REGISTRY ==="
)



console.log(
  getSecurityRegistry()
)



console.log(
  "\n=== POLICY ENGINE ==="
)



console.log(
  findSecurityCapability(
    "security-policy-engine"
  )
)



console.log(
  "\n=== SECURITY MONITORING ==="
)



console.log(
  getCapabilitiesByCategory(
    "monitoring"
  )
)
