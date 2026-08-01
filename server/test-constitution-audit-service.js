import {
  createAuditReport,
} from "./services/aiBrainV2/services/capabilityExecution/capabilityAuditService.js"



console.log(
  "=== CONSTITUTION AUDIT SERVICE TEST ==="
)



console.dir(
  createAuditReport(),
  {
    depth:
      null,
  },
)
