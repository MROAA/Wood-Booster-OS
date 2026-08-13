/*
=====================================
WOOD-BOOSTER AI BRAIN V2

RUNTIME CONTEXT ACCESS

Vastuu:

- tarjoaa yhtenäisen rajapinnan runtimeContextiin
- piilottaa context-rakenteen moduuleilta
- mahdollistaa tulevat context providerit

Ei:

- muuta runtimeContextia
- tallenna dataa
- kutsu LLM:ää

=====================================
*/







function getSystemContext(runtimeContext = {}) {


  return (
    runtimeContext.systemContext ||
    null
  )


}







function getIdentityContext(runtimeContext = {}) {


  return (
    runtimeContext.identityContext ||
    null
  )


}







function getMemoryContext(runtimeContext = {}) {


  return (
    runtimeContext.memoryContext ||
    runtimeContext.memoryContextLayer ||
    null
  )


}







function getKnowledgeContext(runtimeContext = {}) {


  return (
    runtimeContext.knowledgeContext ||
    runtimeContext.knowledge ||
    null
  )


}







function getSpacemonkeyContext(runtimeContext = {}) {


  return (
    runtimeContext.spacemonkey ||
    null
  )


}







function hasContext(runtimeContext = {}) {


  return (
    Object.keys(runtimeContext)
      .length > 0
  )


}







function getContextSummary(runtimeContext = {}) {


  return {

    hasContext:
      hasContext(runtimeContext),


    system:
      Boolean(
        getSystemContext(runtimeContext)
      ),


    identity:
      Boolean(
        getIdentityContext(runtimeContext)
      ),


    memory:
      Boolean(
        getMemoryContext(runtimeContext)
      ),


    knowledge:
      Boolean(
        getKnowledgeContext(runtimeContext)
      ),


    spacemonkey:
      Boolean(
        getSpacemonkeyContext(runtimeContext)
      )

  }


}







export {

  getSystemContext,

  getIdentityContext,

  getMemoryContext,

  getKnowledgeContext,

  getSpacemonkeyContext,

  getContextSummary,

  hasContext

}
