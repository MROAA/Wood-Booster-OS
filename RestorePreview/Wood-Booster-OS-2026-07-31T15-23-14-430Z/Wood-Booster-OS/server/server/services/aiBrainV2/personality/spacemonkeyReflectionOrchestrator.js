import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



import {
  runLearningCycle,
} from "./spacemonkeyLearningEngine.js"



import {
  createEvolutionProposal,
} from "./spacemonkeyEvolutionManager.js"



const reflectionHistory = []



const REFLECTION_TYPES = {


  SUCCESS:
    "success",


  FAILURE:
    "failure",


  IMPROVEMENT:
    "improvement",


  DISCOVERY:
    "discovery"

}



function analyzeExecutionResult({

  execution,

}) {


  const success =
    execution?.status === "completed"



  if(success){


    return {


      type:
        REFLECTION_TYPES.SUCCESS,


      observation:
        "Execution completed successfully.",


      improvement:

        "Identify repeatable patterns."

    }

  }



  return {


    type:
      REFLECTION_TYPES.FAILURE,


    observation:
      "Execution failed or was incomplete.",


    improvement:

      "Analyze failure cause before retry."

  }

}



function createReflectionRecord({

  execution,

}) {


  const analysis =
    analyzeExecutionResult({

      execution

    })



  return {


    id:
      `reflection-${Date.now()}`,


    execution,


    analysis,


    createdAt:
      new Date().toISOString()

  }

}



function reflectOnExecution({

  execution,

}) {


  const core =
    getSpacemonkeyCore()



  const reflection =
    createReflectionRecord({

      execution

    })



  const learning =
    runLearningCycle({

      experience:

        JSON.stringify(
          reflection
        ),


      reflection

    })



  let evolution = null



  if(
    learning.learned
  ){

    evolution =
      createEvolutionProposal({

        learningRecord:
          learning.learningRecord

      })

  }



  const result = {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    reflection,


    learning,


    evolution,


    completedAt:
      new Date().toISOString()

  }



  reflectionHistory.push(

    result

  )



  return result

}



function getReflectionHistory(){


  return [

    ...reflectionHistory

  ]

}



function getReflectionStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    reflections:
      reflectionHistory.length,


    history:
      reflectionHistory

  }

}



export {

  REFLECTION_TYPES,

  reflectOnExecution,

  getReflectionHistory,

  getReflectionStatus

}
