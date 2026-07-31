import {
  getDockerCapability,
  findDockerCapability,
  getCapabilitiesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY DOCKER CAPABILITY ==="
)



console.log(
  getDockerCapability()
)



console.log(
  "\n=== CONTAINER CAPABILITY ==="
)



console.log(
  findDockerCapability(
    "containers"
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
