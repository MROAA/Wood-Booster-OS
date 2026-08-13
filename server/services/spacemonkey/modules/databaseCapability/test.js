import {
  getDatabaseCapability,
  findDatabaseCapability,
  getCapabilitiesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY DATABASE CAPABILITY ==="
)



console.log(
  getDatabaseCapability()
)



console.log(
  "\n=== DATA MODELING ==="
)



console.log(
  findDatabaseCapability(
    "data-modeling"
  )
)



console.log(
  "\n=== SECURITY CAPABILITIES ==="
)



console.log(
  getCapabilitiesByCategory(
    "security"
  )
)
