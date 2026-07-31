import {
  createSecuritySnapshot,
  getSecurityStatus,
  findSecuritySystem,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY RUNTIME MONITOR ==="
)



console.log(
  createSecuritySnapshot()
)



console.log(
  "\n=== SECURITY STATUS ==="
)



console.log(
  getSecurityStatus()
)



console.log(
  "\n=== TOOL SECURITY GATEWAY ==="
)



console.log(
  findSecuritySystem(
    "tool-security-gateway"
  )
)
