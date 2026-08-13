import {
  getInternetSafetyModel,
  evaluateExternalRequest,
  getCriticalPolicies,
} from "./index.js"



console.log(
  "=== SPACEMONEY INTERNET SAFETY GATEWAY ==="
)



console.log(
  getInternetSafetyModel()
)



console.log(
  "\n=== REQUEST TEST ==="
)



console.log(
  evaluateExternalRequest(
    "Access external API"
  )
)



console.log(
  "\n=== CRITICAL POLICIES ==="
)



console.log(
  getCriticalPolicies()
)
