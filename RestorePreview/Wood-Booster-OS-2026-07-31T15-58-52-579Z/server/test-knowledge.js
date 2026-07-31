import {
  searchKnowledge,
} from "./services/knowledgeSearch.js"



const result =
  await searchKnowledge(
    "Wood-Booster filosofia",
  )


console.log(result)