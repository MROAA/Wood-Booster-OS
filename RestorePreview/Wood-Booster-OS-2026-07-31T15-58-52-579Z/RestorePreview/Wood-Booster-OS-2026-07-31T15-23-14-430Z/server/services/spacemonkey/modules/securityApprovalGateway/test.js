import {
  createApprovalRequest,
  approveRequest,
  getApprovalRequests,
  getApprovalRules,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY APPROVAL GATEWAY ==="
)



const request =
  createApprovalRequest({

    action:
      "execute terminal command",

    module:
      "tool-security-gateway",

    risk:
      "critical",

  })



console.log(
  request
)



console.log(
  "\n=== APPROVE REQUEST ==="
)



console.log(
  approveRequest(
    request.id
  )
)



console.log(
  "\n=== REQUEST HISTORY ==="
)



console.log(
  getApprovalRequests()
)



console.log(
  "\n=== APPROVAL RULES ==="
)



console.log(
  getApprovalRules()
)
