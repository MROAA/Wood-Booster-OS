import {
  createReflectionRequest,
  evaluateReflection,
  getReflections,
  getPendingReflections,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY REFLECTION CONNECTOR ==="
)



const reflection =
  createReflectionRequest({

    source:
      "personality-learning-bridge",

    observation:
      "User interaction shows preference for structured explanations.",

    proposal:
      "Continue clear step-by-step communication style.",

  })



console.log(
  reflection
)



console.log(
  "\n=== EVALUATION ==="
)



console.log(
  evaluateReflection({

    id:
      reflection.id,

    result:
      "approved",

  })
)



console.log(
  "\n=== ALL REFLECTIONS ==="
)



console.log(
  getReflections()
)



console.log(
  "\n=== PENDING ==="
)



console.log(
  getPendingReflections()
)
