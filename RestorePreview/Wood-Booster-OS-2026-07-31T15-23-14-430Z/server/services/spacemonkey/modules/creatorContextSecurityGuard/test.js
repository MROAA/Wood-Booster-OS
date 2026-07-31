import {
  requestAccess,
  validateRequester,
  getSecurityRules,
  getAccessLog,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR CONTEXT SECURITY GUARD ==="
)



console.log(
  getSecurityRules()
)



console.log(
  "\n=== VALIDATION ==="
)



console.log(
  validateRequester(
    "personality-runtime"
  )
)



console.log(
  "\n=== ACCESS REQUEST ==="
)



console.log(
  requestAccess({

    requester:
      "personality-runtime",


    purpose:
      "Build personality context.",


    requestedData:

      [
        "creator-philosophy",
        "development-principles",
      ],

  })
)



console.log(
  "\n=== ACCESS LOG ==="
)



console.log(
  getAccessLog()
)
