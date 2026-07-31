import {
  getPersonalKnowledgeBase,
  findKnowledgeEntry,
  getKnowledgeByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONAL KNOWLEDGE BASE ==="
)



console.log(
  getPersonalKnowledgeBase()
)



console.log(
  "\n=== WOOD-BOOSTER PROJECT ==="
)



console.log(
  findKnowledgeEntry(
    "wood-booster-project"
  )
)



console.log(
  "\n=== SKILL KNOWLEDGE ==="
)



console.log(
  getKnowledgeByCategory(
    "skills"
  )
)
