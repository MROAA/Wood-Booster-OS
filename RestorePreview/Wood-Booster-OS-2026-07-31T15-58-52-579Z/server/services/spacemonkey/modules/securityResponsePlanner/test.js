import {
  getResponsePlanner,
  planResponse,
  getCriticalResponses,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY RESPONSE PLANNER ==="
)



console.log(
  getResponsePlanner()
)



console.log(
  "\n=== ACCESS THREAT RESPONSE ==="
)



console.log(
  planResponse(
    "access-threat"
  )
)



console.log(
  "\n=== CRITICAL RESPONSES ==="
)



console.log(
  getCriticalResponses()
)
