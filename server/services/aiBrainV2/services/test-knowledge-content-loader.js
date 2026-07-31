import {
  buildGodfileIndex
} from "../knowledge/index/godfileIndex.js"


import {
  filterKnowledge
} from "../knowledge/filters/knowledgeFilter.js"


import {
  loadKnowledgeContent
} from "../knowledge/loaders/knowledgeContentLoader.js"



const index =
  buildGodfileIndex()



const filtered =
  filterKnowledge(
    "Mikä on Spacemonkeyn persoonallisuus?",
    index
  )



const content =
  loadKnowledgeContent(
    filtered
  )



console.log(
  "KNOWLEDGE CONTENT RESULT"
)


console.log(
  "FILES:",
  content.length
)


console.dir(
  content.slice(0,3),
  {
    depth:null
  }
)
