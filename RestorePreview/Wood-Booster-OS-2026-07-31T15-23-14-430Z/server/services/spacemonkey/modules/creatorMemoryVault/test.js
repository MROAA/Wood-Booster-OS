import {
  getCreatorMemories,
  findMemory,
  getImportantMemories,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR MEMORY VAULT ==="
)



console.log(
  getCreatorMemories()
)



console.log(
  "\n=== MEMORY LOOKUP ==="
)



console.log(
  findMemory(
    "memory-mimmi"
  )
)



console.log(
  "\n=== IMPORTANT MEMORIES ==="
)



console.log(
  getImportantMemories()
)
