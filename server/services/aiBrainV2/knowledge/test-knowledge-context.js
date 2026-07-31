import {
  buildKnowledgeContext
} from "./builders/knowledgeContextBuilder.js"



const context =
  buildKnowledgeContext()



console.log(
  "KNOWLEDGE CONTEXT"
)


console.dir(
  context,
  {
    depth:null
  }
)
