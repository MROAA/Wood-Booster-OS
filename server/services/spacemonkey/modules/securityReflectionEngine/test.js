import {
  createSecurityReflection,
  analyzeSecurityEvent,
  getSecurityReflections,
  getLatestReflections,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY REFLECTION ENGINE ==="
)



console.log(
  createSecurityReflection({

    source:
      "security-audit-log",

    observation:
      "External request required approval.",

    lesson:
      "High risk operations need controlled access.",

    recommendation:
      "Maintain approval gateway protection.",

  })
)



console.log(
  "\n=== EVENT ANALYSIS ==="
)



console.log(
  analyzeSecurityEvent(
    "Blocked external command execution"
  )
)



console.log(
  "\n=== REFLECTION HISTORY ==="
)



console.log(
  getSecurityReflections()
)



console.log(
  "\n=== LATEST REFLECTIONS ==="
)



console.log(
  getLatestReflections()
)
