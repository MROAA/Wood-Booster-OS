import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



function evaluateInformationQuality({

  context,

}) {


  const knowledgeAmount =
    Array.isArray(context.knowledge)
      ? context.knowledge.length
      : 0


  const memoryAmount =
    Array.isArray(context.memory)
      ? context.memory.length
      : 0



  let confidence = 0.5


  if(knowledgeAmount > 0){

    confidence += 0.2

  }


  if(memoryAmount > 0){

    confidence += 0.1

  }


  if(confidence > 1){

    confidence = 1

  }


  return {


    confidence,


    knowledgeAvailable:
      knowledgeAmount > 0,


    memoryAvailable:
      memoryAmount > 0


  }


}



function identifyProblemType(message){


  const text =
    String(message || "")
      .toLowerCase()



  if(
    text.includes("virhe") ||
    text.includes("error") ||
    text.includes("ei toimi")
  ){

    return "debugging"

  }



  if(
    text.includes("rakenna") ||
    text.includes("luo") ||
    text.includes("tee")
  ){

    return "creation"

  }



  if(
    text.includes("suunnittele") ||
    text.includes("miten")
  ){

    return "planning"

  }



  return "general_analysis"


}



function generateReasoningQuestions({

  problemType,

}) {


  const questions = []



  questions.push(
    "What is the real objective?"
  )


  questions.push(
    "What information is already available?"
  )


  questions.push(
    "What information is missing?"
  )



  if(problemType === "debugging"){

    questions.push(
      "What is the root cause?"
    )

  }



  if(problemType === "creation"){

    questions.push(
      "What architecture supports future growth?"
    )

  }



  if(problemType === "planning"){

    questions.push(
      "What are the required steps?"
    )

  }



  return questions


}



function createReasoningSummary({

  message,

  context,

}) {


  const problemType =
    identifyProblemType(
      message
    )


  const information =
    evaluateInformationQuality({

      context

    })



  const questions =
    generateReasoningQuestions({

      problemType

    })



  return {


    problemType,


    information,


    questions,


    assumptions:


      [

        "Current understanding may be incomplete",

        "Additional context may improve accuracy"

      ]

  }


}



function runSpacemonkeyReasoning({

  message,

  context,

}) {


  const core =
    getSpacemonkeyCore()



  const analysis =
    createReasoningSummary({

      message,

      context

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    reasoning:


    {

      analysis,


      principles:


      [

        "Truth before confidence",

        "Understanding before action",

        "Protect long-term system health"

      ]

    }

  }


}



export {

  runSpacemonkeyReasoning,

  identifyProblemType

}
