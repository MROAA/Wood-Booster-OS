import {
  createDiagnosticReport,
  getDiagnosticStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY SYSTEM DIAGNOSTICS ==="
)



console.log(
  createDiagnosticReport()
)



console.log(
  "\n=== STATUS ==="
)



console.log(
  getDiagnosticStatus()
)
