import {
  addSecurityLesson,
  getSecurityMemory,
  getCriticalLessons,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY LEARNING MEMORY ==="
)



console.log(
  addSecurityLesson({

    event:
      "Blocked unknown external request",

    risk:
      "critical",

    lesson:
      "External actions require validation before execution.",

    source:
      "internet-safety-gateway",

  })
)



console.log(
  addSecurityLesson({

    event:
      "Unauthorized file modification attempt",

    risk:
      "high",

    lesson:
      "File operations require permission verification.",

    source:
      "tool-security-gateway",

  })
)



console.log(
  "\n=== SECURITY MEMORY ==="
)



console.log(
  getSecurityMemory()
)



console.log(
  "\n=== CRITICAL LESSONS ==="
)



console.log(
  getCriticalLessons()
)
