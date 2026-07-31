import {
  getSandboxModel,
  findEnvironment,
  evaluateEnvironmentAccess,
  getCriticalEnvironments,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY SANDBOX AWARENESS ==="
)



console.log(
  getSandboxModel()
)



console.log(
  "\n=== SANDBOX ACCESS ==="
)



console.log(
  evaluateEnvironmentAccess(
    "sandbox"
  )
)



console.log(
  "\n=== CORE SYSTEM ==="
)



console.log(
  findEnvironment(
    "core-system"
  )
)



console.log(
  "\n=== CRITICAL ENVIRONMENTS ==="
)



console.log(
  getCriticalEnvironments()
)
