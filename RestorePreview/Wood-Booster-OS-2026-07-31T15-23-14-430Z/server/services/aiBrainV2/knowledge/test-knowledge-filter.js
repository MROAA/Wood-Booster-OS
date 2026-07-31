import {
  buildGodfileIndex
} from "./index/godfileIndex.js"


import {
  filterKnowledge
} from "./filters/knowledgeFilter.js"



const index =
  buildGodfileIndex()



const result =
  filterKnowledge(
    "Mikä on Spacemonkeyn persoonallisuus?",
    index
  )



console.log(
  "FILTER RESULT"
)


console.log(
  "FOUND:",
  result.length
)


console.dir(
  result.slice(0,10),
  {
    depth:null
  }
)
