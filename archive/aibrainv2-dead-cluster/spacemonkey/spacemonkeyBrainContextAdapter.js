function createBrainContextFromSpacemonkey(
  unifiedContext
){

  return {

    spacemonkey:{

      identity:
        unifiedContext.identity,


      personality:
        unifiedContext.personality,


      responseStyle:
        unifiedContext.responseStyle,


      kernel:
        unifiedContext.kernel

    },


    knowledge:{

      source:
        unifiedContext.knowledge.source,


      matchedSources:
        unifiedContext
          .knowledge
          .matchedSources,


      sources:
        unifiedContext
          .knowledge
          .knowledge

    },


    createdAt:

      new Date().toISOString()

  }

}



export {

  createBrainContextFromSpacemonkey

}
