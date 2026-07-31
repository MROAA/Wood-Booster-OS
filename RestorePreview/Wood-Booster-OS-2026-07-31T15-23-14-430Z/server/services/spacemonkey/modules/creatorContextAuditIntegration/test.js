import {
  createAuditEvent,
  getAuditEvents,
  getEventsByRequester,
  getLatestEvents,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR CONTEXT AUDIT INTEGRATION ==="
)



console.log(
  createAuditEvent({

    requester:
      "personality-runtime",


    action:
      "request-creator-context",


    dataScope:

      [
        "creator-philosophy",
        "development-principles",
      ],


    purpose:
      "Build operator context.",


    result:
      "approved",

  })
)



console.log(
  "\n=== AUDIT HISTORY ==="
)



console.log(
  getAuditEvents()
)



console.log(
  "\n=== REQUESTER EVENTS ==="
)



console.log(
  getEventsByRequester(
    "personality-runtime"
  )
)



console.log(
  "\n=== LATEST EVENTS ==="
)



console.log(
  getLatestEvents()
)
