import {
  buildUnifiedKnowledgeContext,
} from "../knowledge/builders/unifiedKnowledgeContextBuilder.js"



const context =
  buildUnifiedKnowledgeContext()



console.log(
  "UNIFIED KNOWLEDGE CONTEXT"
)



console.dir(
  context,
  {
    depth:null
  }
)
