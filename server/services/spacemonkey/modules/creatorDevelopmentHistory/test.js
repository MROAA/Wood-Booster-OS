import {
  getDevelopmentHistory,
  findHistoryEntry,
  getHistoryByPhase,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR DEVELOPMENT HISTORY ==="
)



console.log(
  getDevelopmentHistory()
)



console.log(
  "\n=== AI BRAIN DEVELOPMENT ==="
)



console.log(
  findHistoryEntry(
    "ai-brain-development"
  )
)



console.log(
  "\n=== ARCHITECTURE PHASE ==="
)



console.log(
  getHistoryByPhase(
    "architecture"
  )
)
