import {
  getLinuxCapability,
  findLinuxCapability,
  getCapabilitiesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY LINUX ADVANCED CAPABILITY ==="
)



console.log(
  getLinuxCapability()
)



console.log(
  "\n=== FILESYSTEM CAPABILITY ==="
)



console.log(
  findLinuxCapability(
    "filesystem"
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
