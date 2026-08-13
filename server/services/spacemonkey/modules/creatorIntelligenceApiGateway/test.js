import {
  handleRequest,
  getAvailableActions,
  getRequestHistory,
  getLatestRequests,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE API GATEWAY ==="
)



console.log(
  getAvailableActions()
)



console.log(
  "\n=== CONTEXT REQUEST ==="
)



console.log(
  handleRequest({

    requester:
      "operator-runtime",


    action:
      "get-context",


    payload:

      {
        scope:
          "creator-principles",

      },

  })
)



console.log(
  "\n=== HEALTH REQUEST ==="
)



console.log(
  handleRequest({

    requester:
      "system-monitor",


    action:
      "get-health",

  })
)



console.log(
  "\n=== REQUEST HISTORY ==="
)



console.log(
  getRequestHistory()
)



console.log(
  "\n=== LATEST REQUESTS ==="
)



console.log(
  getLatestRequests()
)
