import {
  searchFiles,
  getProtectionStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECRET PROTECTION ==="
)



console.log(
  getProtectionStatus()
)



console.log(
  "\n=== SEARCH RESULT ==="
)



console.log(
  searchFiles(
    process.cwd()
  )
)
