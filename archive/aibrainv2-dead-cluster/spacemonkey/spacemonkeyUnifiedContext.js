import {
  createKnowledgeContext
} from "../knowledge/adapters/knowledgeContextAdapter.js"



function createUnifiedContext({

  message,

  runtimeContext = {}

}){


  const knowledgeContext =
    createKnowledgeContext(
      message
    )



  return {

    identity:

      runtimeContext.identity
      ||
      null,


    personality:

      runtimeContext.personality
      ||
      null,


    responseStyle:

      runtimeContext.responseStyle
      ||
      null,


    kernel:

      runtimeContext.kernel
      ||
      null,


    knowledge:

      knowledgeContext,


    createdAt:

      new Date().toISOString()

  }

}



export {

  createUnifiedContext

}
