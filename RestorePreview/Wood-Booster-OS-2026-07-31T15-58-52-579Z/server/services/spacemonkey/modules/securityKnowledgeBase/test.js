import {
  getSecurityKnowledge,
  findKnowledge,
  getKnowledgeByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY KNOWLEDGE BASE ==="
)



console.log(
  getSecurityKnowledge()
)



console.log(
  "\n=== DEFENSE IN DEPTH ==="
)



console.log(
  findKnowledge(
    "defense-in-depth"
  )
)



console.log(
  "\n=== DEVELOPMENT SECURITY ==="
)



console.log(
  getKnowledgeByCategory(
    "development"
  )
)
