import {
  addPersonalityMemory,
  getPersonalityMemory,
  findMemoriesByCategory,
  getLatestMemories,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY MEMORY ==="
)



console.log(
  addPersonalityMemory({

    category:
      "communication",

    observation:
      "User prefers clear step-by-step explanations.",

    lesson:
      "Use structured and practical responses.",

  })
)



console.log(
  addPersonalityMemory({

    category:
      "personality",

    observation:
      "Humor can be used occasionally.",

    lesson:
      "Keep humor supportive and not distracting.",

  })
)



console.log(
  "\n=== MEMORY DATABASE ==="
)



console.log(
  getPersonalityMemory()
)



console.log(
  "\n=== COMMUNICATION MEMORIES ==="
)



console.log(
  findMemoriesByCategory(
    "communication"
  )
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestMemories()
)
