const MODULE_ID = "creator-context-provider"



const contextState = {

  identity: null,

  philosophy: [],

  decisions: [],

  vision: [],

  patterns: [],

}



function updateCreatorContext({

  identity,

  philosophy,

  decisions,

  vision,

  patterns,

}){

  contextState.identity =
    identity || contextState.identity


  contextState.philosophy =
    philosophy || contextState.philosophy


  contextState.decisions =
    decisions || contextState.decisions


  contextState.vision =
    vision || contextState.vision


  contextState.patterns =
    patterns || contextState.patterns



  return getCreatorContext()

}



function getCreatorContext(){

  return {

    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),


    context:

      {
        identity:
          contextState.identity,

        philosophy:
          contextState.philosophy,

        decisions:
          contextState.decisions,

        vision:
          contextState.vision,

        patterns:
          contextState.patterns,

      },

  }

}



function getIdentityContext(){

  return contextState.identity

}



function getPhilosophyContext(){

  return contextState.philosophy

}



function getDecisionContext(){

  return contextState.decisions

}



function getVisionContext(){

  return contextState.vision

}



function getPatternContext(){

  return contextState.patterns

}



function clearContext(){

  contextState.identity = null

  contextState.philosophy = []

  contextState.decisions = []

  contextState.vision = []

  contextState.patterns = []


  return {

    cleared:
      true,

  }

}



export {

  MODULE_ID,

  updateCreatorContext,

  getCreatorContext,

  getIdentityContext,

  getPhilosophyContext,

  getDecisionContext,

  getVisionContext,

  getPatternContext,

  clearContext,

}
