import {
  createAIContext
} from "../../llmSystem/core/contextBridge.js"







async function injectContextEngineContext({

  runtimeContext = {},

  message,

  source = "aiBrainV2"

} = {}) {


  const result =
    await createAIContext({

      message,

      source,

      runtimeContext

    })



  const context =
    result.context || {}



  const systemContext =
    context.system || null



  const identityContext =
    context.identity || null



  const memoryContext =
    context.memory || null



  const knowledgeContext =
    context.knowledge || null



  const finnishCultureContext =
    context.finnishCulture || null



  const spacemonkeyPersonaContext =
    context.spacemonkeyPersona || null



  const creatorIdentityContext =
    context.creator_identity || null





  return {

    ...runtimeContext,


    systemContext,


    identityContext,


    memoryContext,


    memoryContextLayer:
      memoryContext,


    knowledgeContext,


    knowledge:
      knowledgeContext,



    finnishCultureContext,


    spacemonkeyPersonaContext,


    creatorIdentityContext,



    contextMetadata: {


      providers:
        Object.keys(
          context
        )
        .filter(
          key =>
            ![
              "createdAt",
              "request",
              "runtime"
            ]
            .includes(key)
        ),



      creatorIdentity:
        Boolean(
          creatorIdentityContext
        ),



      finnishCulture:
        Boolean(
          finnishCultureContext
        ),



      spacemonkeyPersona:
        Boolean(
          spacemonkeyPersonaContext
        ),



    },



    llmSystemContext:
      context

  }


}







export {

  injectContextEngineContext

}
