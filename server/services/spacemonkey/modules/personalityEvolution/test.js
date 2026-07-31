import {
  createEvolutionObservation,
  analyzeBehavior,
  getEvolutionHistory,
  getHighPrioritySuggestions,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY EVOLUTION ==="
)



console.log(
  createEvolutionObservation({

    area:
      "communication",

    observation:
      "Users benefit from clear explanations.",

    suggestion:
      "Maintain structured teaching style.",

    priority:
      "high",

  })
)



console.log(
  "\n=== BEHAVIOR ANALYSIS ==="
)



console.log(
  analyzeBehavior({

    behavior:
      "uses humor",

    result:
      "positive user interaction",

  })
)



console.log(
  "\n=== EVOLUTION HISTORY ==="
)



console.log(
  getEvolutionHistory()
)



console.log(
  "\n=== HIGH PRIORITY ==="
)



console.log(
  getHighPrioritySuggestions()
)
