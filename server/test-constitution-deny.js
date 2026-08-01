import {
  evaluateConstitutionGuard,
} from "./services/aiBrainV2/services/constitutionGuard/index.js"



console.log(
  "=== CONSTITUTION DENY TEST ==="
)



const result =
  evaluateConstitutionGuard({

    actionType:
      "data-sharing",

    exposesPrivateData:
      true,

  })



console.dir(
  result,
  {
    depth:
      null,
  },
)
