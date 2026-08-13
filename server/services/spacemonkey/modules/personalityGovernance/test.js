import {
  requestPersonalityChange,
  approvePersonalityChange,
  getGovernanceRules,
  getChangeRequests,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY GOVERNANCE ==="
)



console.log(
  getGovernanceRules()
)



const request =
  requestPersonalityChange({

    area:
      "communication",

    change:
      "Increase friendly explanations.",

    reason:
      "Improve user experience.",

    requestedBy:
      "personality-learning",

  })



console.log(
  "\n=== CHANGE REQUEST ==="
)



console.log(
  request
)



console.log(
  "\n=== APPROVAL ==="
)



console.log(
  approvePersonalityChange(
    request.id
  )
)



console.log(
  "\n=== REQUEST HISTORY ==="
)



console.log(
  getChangeRequests()
)
