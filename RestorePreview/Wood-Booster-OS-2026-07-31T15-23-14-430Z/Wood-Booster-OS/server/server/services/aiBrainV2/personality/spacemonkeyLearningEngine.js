import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const LEARNING_TYPES = {


  LESSON:
    "lesson",


  IMPROVEMENT:
    "improvement",


  PRINCIPLE:
    "principle",


  PATTERN:
    "pattern"

}



function analyzeExperience({

  experience,

}) {


  const text =
    String(experience || "")
      .toLowerCase()



  const insights = []



  if(
    text.includes("error") ||
    text.includes("virhe")
  ){

    insights.push({

      type:
        LEARNING_TYPES.LESSON,


      insight:
        "Errors should create improvement opportunities."

    })

  }



  if(
    text.includes("test")
  ){

    insights.push({

      type:
        LEARNING_TYPES.PRINCIPLE,


      insight:
        "Validate important changes before expanding."

    })

  }



  if(
    text.includes("onnistui") ||
    text.includes("success")
  ){

    insights.push({

      type:
        LEARNING_TYPES.PATTERN,


      insight:
        "Successful approaches should be identified and repeated."

    })

  }



  return insights

}



function createLearningRecord({

  experience,

  reflection,

}) {


  const lessons =
    analyzeExperience({

      experience

    })



  return {


    source:
      "spacemonkey-learning-engine",


    experience,


    reflection,


    lessons,


    createdAt:
      new Date().toISOString()


  }

}



function shouldLearn({

  learningRecord,

}) {


  if(
    !learningRecord
  ){

    return false

  }



  return (

    learningRecord.lessons.length > 0

  )

}



function createImprovementProposal({

  learningRecord,

}) {


  return {


    type:
      "system_improvement",


    basedOn:
      learningRecord.experience,


    recommendations:

      learningRecord.lessons.map(

        lesson =>
          lesson.insight

      ),


    confidence:
      0.8,


    createdAt:
      new Date().toISOString()

  }

}



function runLearningCycle({

  experience,

  reflection = null

}) {


  const core =
    getSpacemonkeyCore()



  const learningRecord =
    createLearningRecord({

      experience,

      reflection

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    learned:

      shouldLearn({

        learningRecord

      }),


    learningRecord,


    improvement:

      createImprovementProposal({

        learningRecord

      })

  }

}



export {

  LEARNING_TYPES,

  runLearningCycle,

  createLearningRecord,

  shouldLearn

}
