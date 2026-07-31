import {
  getCapabilityRegistry,
  findCapability,
  getCapabilitiesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY CAPABILITY REGISTRY ==="
)



console.log(
  getCapabilityRegistry()
)



console.log(
  "\n=== AI ENGINEERING ==="
)



console.log(
  findCapability(
    "ai-engineering"
  )
)



console.log(
  "\n=== SECURITY CAPABILITIES ==="
)



console.log(
  getCapabilitiesByCategory(
    "security"
  )
)
