import {
  locateProtectedAlias,
  getProtectionStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECRET ALIAS PROTECTION ==="
)



console.log(
  getProtectionStatus()
)



console.log(
  "\n=== PROTECTED LOCATION SEARCH ==="
)



console.log(
  locateProtectedAlias(
    "protected-secret-03",
    process.cwd()
  )
)
