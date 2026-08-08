import {
  createDecision,
  getDecisionMemory,
  findDecision,
  getLessons,
  getLatestDecisions,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR DECISION MEMORY ==="
)



const decision =
  createDecision({

    decision:
      "Build Spacemonkey as modular system.",


    reason:
      "Avoid changing stable core architecture.",


    context:
      "Wood-Booster HQ AI development.",


    outcome:
      "New features can be added safely as modules.",


    lesson:
      "Protect stable foundations and expand through isolated modules.",

  })



console.log(
  decision
)



console.log(
  "\n=== DECISION MEMORY ==="
)



console.log(
  getDecisionMemory()
)



console.log(
  "\n=== FIND DECISION ==="
)



console.log(
  findDecision(
    decision.id
  )
)



console.log(
  "\n=== LESSONS ==="
)



console.log(
  getLessons()
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestDecisions()
)
