import {
  getAIEngineeringCapability,
  findAICapability,
  getCapabilitiesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY AI ENGINEERING CAPABILITY ==="
)



console.log(
  getAIEngineeringCapability()
)



console.log(
  "\n=== AGENT SYSTEMS ==="
)



console.log(
  findAICapability(
    "agent-systems"
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
