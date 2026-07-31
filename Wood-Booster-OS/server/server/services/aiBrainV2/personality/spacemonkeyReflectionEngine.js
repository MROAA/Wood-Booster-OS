import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



function evaluateResult({

  expected,

  actual,

}) {


  if(!actual){

    return {

      success:false,

      reason:
        "No execution result available"

    }

  }



  return {


    success:
      true,


    comparison:


    {

      expected,

      actual

    }

  }


}



function identifyLessons({

  evaluation,

}) {


  const lessons = []



  if(!evaluation.success){


    lessons.push(

      "Missing execution data prevents reliable evaluation"

    )


    return lessons

  }



  lessons.push(

    "Execution outcome should be compared against original intention"

  )



  lessons.push(

    "Successful patterns should become reusable knowledge"

  )



  lessons.push(

    "Failures should create process improvements"

  )



  return lessons


}



function createMemoryCandidates({

  lessons,

}) {


  return lessons.map(

    lesson => ({

      type:
        "experience_learning",


      content:
        lesson,


      importance:
        "medium"


    })

  )


}



function createImprovementSuggestions({

  lessons,

}) {


  return {


    suggestions:


      [

        "Review workflow quality",

        "Identify repeated patterns",

        "Improve future planning"

      ],


    basedOn:
      lessons

  }


}



function runSpacemonkeyReflection({

  executionResult,

  expectedOutcome,

}) {


  const core =
    getSpacemonkeyCore()



  const evaluation =
    evaluateResult({

      expected:
        expectedOutcome,

      actual:
        executionResult

    })



  const lessons =
    identifyLessons({

      evaluation

    })



  const memoryCandidates =
    createMemoryCandidates({

      lessons

    })



  const improvements =
    createImprovementSuggestions({

      lessons

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    reflection:


    {


      evaluation,


      lessons,


      memoryCandidates,


      improvements


    }


  }


}



export {

  runSpacemonkeyReflection,

  evaluateResult

}
