import {
  getToolSecurityModel,
  checkToolPermission,
  getCriticalTools,
} from "./index.js"



console.log(
  "=== SPACEMONEY TOOL SECURITY GATEWAY ==="
)



console.log(
  getToolSecurityModel()
)



console.log(
  "\n=== TERMINAL CHECK ==="
)



console.log(
  checkToolPermission(
    "terminal"
  )
)



console.log(
  "\n=== CRITICAL TOOLS ==="
)



console.log(
  getCriticalTools()
)
