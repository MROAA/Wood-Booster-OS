import {
  getThreatIntelligence,
  findThreat,
  getCriticalThreats,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY THREAT INTELLIGENCE ==="
)



console.log(
  getThreatIntelligence()
)



console.log(
  "\n=== UNAUTHORIZED ACCESS ==="
)



console.log(
  findThreat(
    "unauthorized-access"
  )
)



console.log(
  "\n=== CRITICAL THREATS ==="
)



console.log(
  getCriticalThreats()
)
