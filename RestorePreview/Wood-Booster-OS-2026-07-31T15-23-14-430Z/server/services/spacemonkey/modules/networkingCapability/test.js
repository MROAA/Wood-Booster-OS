import {
  getNetworkingCapability,
  findNetworkingCapability,
  getCapabilitiesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY NETWORKING CAPABILITY ==="
)



console.log(
  getNetworkingCapability()
)



console.log(
  "\n=== API COMMUNICATION ==="
)



console.log(
  findNetworkingCapability(
    "api-communication"
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
