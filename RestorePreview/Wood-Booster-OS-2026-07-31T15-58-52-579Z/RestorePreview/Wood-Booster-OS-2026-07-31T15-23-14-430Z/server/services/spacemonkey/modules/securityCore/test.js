import {
  getSecurityCore,
  findSecurityRule,
  getCriticalRules,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY CORE ==="
)



console.log(
  getSecurityCore()
)



console.log(
  "\n=== CORE PROTECTION ==="
)



console.log(
  findSecurityRule(
    "core-protection"
  )
)



console.log(
  "\n=== CRITICAL RULES ==="
)



console.log(
  getCriticalRules()
)
