import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"


import {
  getSpacemonkeyState,
} from "./spacemonkeyStateManager.js"



function normalizeContextInput({

  message,

  memory = [],

  knowledge = [],

  systemState = {},

}) {


  return {


    message:
      String(message || ""),


    memory:
      Array.isArray(memory)
        ? memory
        : [],


    knowledge:
      Array.isArray(knowledge)
        ? knowledge
        : [],


    systemState:
      systemState || {}


  }


}



function evaluateContextCompleteness({

  context,

}) {


  const checks = {


    hasMessage:
      Boolean(context.message),


    hasMemory:
      context.memory.length > 0,


    hasKnowledge:
      context.knowledge.length > 0,


    hasSystemState:
      Object.keys(
        context.systemState
      ).length > 0

  }



  const completed =
    Object.values(checks)
      .filter(Boolean)
      .length



  return {


    checks,


    score:
      completed / 4


  }


}



function prioritizeContext({

  context,

}) {


  return {


    primary:

    {

      message:
        context.message

    },


    supporting:


    {

      memory:
        context.memory,


      knowledge:
        context.knowledge,


      systemState:
        context.systemState

    }

  }


}



function createSpacemonkeyContext({

  message,

  memory = [],

  knowledge = [],

  systemState = {},

}) {


  const core =
    getSpacemonkeyCore()



  const normalized =
    normalizeContextInput({

      message,

      memory,

      knowledge,

      systemState

    })



  const completeness =
    evaluateContextCompleteness({

      context:
        normalized

    })



  const priority =
    prioritizeContext({

      context:
        normalized

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    currentState:
      getSpacemonkeyState(),


    context:


    {

      ...priority,


      completeness,


      createdAt:
        new Date().toISOString()

    }

  }


}



function mergeContextLayers({

  baseContext,

  additionalContext,

}) {


  return {


    ...baseContext,


    ...additionalContext,


    mergedAt:
      new Date().toISOString()

  }


}



export {

  createSpacemonkeyContext,

  mergeContextLayers,

  evaluateContextCompleteness

}
