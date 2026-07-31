import {
  analyzeIntent,
  getIntentMemory,
  findIntent,
  getLatestIntents,
  getGoals,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTENT UNDERSTANDING ==="
)



const intent =
  analyzeIntent({

    request:
      "Build Spacemonkey as modular AI operator.",


    goal:
      "Create a safe evolving AI system.",


    motivation:
      "Allow long-term development without breaking stable architecture.",


    constraints:

      [
        "Do not modify stable core.",
        "Build isolated modules.",
      ],


    desiredOutcome:
      "Reliable intelligent operating system.",

  })



console.log(
  intent
)



console.log(
  "\n=== INTENT MEMORY ==="
)



console.log(
  getIntentMemory()
)



console.log(
  "\n=== FIND INTENT ==="
)



console.log(
  findIntent(
    intent.id
  )
)



console.log(
  "\n=== GOALS ==="
)



console.log(
  getGoals()
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestIntents()
)
