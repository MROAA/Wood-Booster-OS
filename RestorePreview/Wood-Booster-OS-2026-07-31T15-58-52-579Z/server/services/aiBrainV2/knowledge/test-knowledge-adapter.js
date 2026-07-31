import {
  createKnowledgeContext
} from "./adapters/knowledgeContextAdapter.js"



const context =
  createKnowledgeContext(
    "Mikä on Spacemonkeyn persoonallisuus?"
  )


console.log(
  "KNOWLEDGE ADAPTER RESULT"
)


console.dir(
  context,
  {
    depth:null
  }
)
