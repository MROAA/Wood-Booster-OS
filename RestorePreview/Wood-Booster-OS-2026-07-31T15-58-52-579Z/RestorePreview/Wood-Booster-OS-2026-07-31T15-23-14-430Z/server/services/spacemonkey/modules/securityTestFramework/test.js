import {
  runSecurityTests,
  getSecurityReport,
  getAvailableTests,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY TEST FRAMEWORK ==="
)



console.log(
  runSecurityTests()
)



console.log(
  "\n=== SECURITY REPORT ==="
)



console.log(
  getSecurityReport()
)



console.log(
  "\n=== AVAILABLE TESTS ==="
)



console.log(
  getAvailableTests()
)
