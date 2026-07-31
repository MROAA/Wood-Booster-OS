import {
  createCapabilityHealthReport,
  getCapabilityStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY CAPABILITY HEALTH CHECK ==="
)



console.log(
  createCapabilityHealthReport()
)



console.log(
  "\n=== NODE.JS CAPABILITY ==="
)



console.log(
  getCapabilityStatus(
    "nodejs"
  )
)
