import {
  evaluateConstitutionGuard,
} from "./index.js"



console.log(
  "=== CONSTITUTION GUARD TEST ==="
)



console.log(
  "\nNORMAL ACTION"
)

console.log(
  evaluateConstitutionGuard({
    actionType:
      "conversation",

    requiresHumanApproval:
      false,
  })
)



console.log(
  "\nAPPROVAL ACTION"
)

console.log(
  evaluateConstitutionGuard({
    actionType:
      "external-action",

    requiresHumanApproval:
      true,
  })
)
