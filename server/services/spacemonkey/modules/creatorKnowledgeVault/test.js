import {
  addCreatorKnowledge,
  getCreatorKnowledge,
  getByCategory,
  searchKnowledge,
  getLatestKnowledge,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR KNOWLEDGE VAULT ==="
)



addCreatorKnowledge({

  category:
    "philosophy",

  title:
    "Modular Development Philosophy",

  content:
    "Build safe isolated modules and protect stable foundations.",

  source:
    "creator",

})



addCreatorKnowledge({

  category:
    "principle",

  title:
    "Long Term Thinking",

  content:
    "Prefer sustainable systems that can evolve over time.",

  source:
    "creator",

})



console.log(
  "\n=== KNOWLEDGE DATABASE ==="
)



console.log(
  getCreatorKnowledge()
)



console.log(
  "\n=== PHILOSOPHY ==="
)



console.log(
  getByCategory(
    "philosophy"
  )
)



console.log(
  "\n=== SEARCH MODULAR ==="
)



console.log(
  searchKnowledge(
    "modular"
  )
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestKnowledge()
)
