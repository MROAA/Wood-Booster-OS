import {
  createHealthSnapshot,
  getHealthStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY HEALTH MONITORING ==="
)



console.log(
  createHealthSnapshot()
)



console.log(
  "\n=== HEALTH STATUS ==="
)



console.log(
  getHealthStatus()
)
