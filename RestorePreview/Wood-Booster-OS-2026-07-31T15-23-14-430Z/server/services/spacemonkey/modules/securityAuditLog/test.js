import {
  createAuditEvent,
  getAuditLog,
  getCriticalEvents,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY AUDIT LOG ==="
)



console.log(
  createAuditEvent({

    action:
      "system inspection",

    module:
      "runtime-awareness",

    risk:
      "low",

    status:
      "approved",

  })
)



console.log(
  createAuditEvent({

    action:
      "terminal execution",

    module:
      "tool-security-gateway",

    risk:
      "critical",

    status:
      "blocked",

  })
)



console.log(
  "\n=== AUDIT LOG ==="
)



console.log(
  getAuditLog()
)



console.log(
  "\n=== CRITICAL EVENTS ==="
)



console.log(
  getCriticalEvents()
)
