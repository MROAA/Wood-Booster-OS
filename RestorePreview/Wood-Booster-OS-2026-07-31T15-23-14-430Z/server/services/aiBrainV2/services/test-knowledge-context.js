import {
  buildKnowledgeContext
} from "../knowledge/builders/knowledgeContextBuilder.js"



const context =
  buildKnowledgeContext(
    "Mikä on Spacemonkeyn persoonallisuus?"
  )



console.log(
  "KNOWLEDGE CONTEXT V2"
)



console.log(
  "SOURCES:",
  context.totalSources
)



console.log(
  "CHARACTERS:",
  context.totalCharacters
)



console.dir(
  context.knowledge.slice(0,3),
  {
    depth:null
  }
)
