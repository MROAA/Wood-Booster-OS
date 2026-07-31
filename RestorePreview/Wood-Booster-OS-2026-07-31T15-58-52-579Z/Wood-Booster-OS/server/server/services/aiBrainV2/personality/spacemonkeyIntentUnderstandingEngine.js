import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const INTENT_TYPES = {


  QUESTION:
    "question",


  CREATE:
    "create",


  UPDATE:
    "update",


  ANALYZE:
    "analyze",


  REMEMBER:
    "remember",


  EXECUTE:
    "execute",


  PLAN:
    "plan"

}



const intentHistory = []



function normalizeMessage(message){

  return String(message || "")

    .toLowerCase()

    .trim()

}



function detectIntent(message){


  const text =
    normalizeMessage(message)



  if(

    text.includes("muista") ||

    text.includes("tallenna") ||

    text.includes("muisti")

  ){

    return INTENT_TYPES.REMEMBER

  }



  if(

    text.includes("rakenna") ||

    text.includes("luo") ||

    text.includes("tee")

  ){

    return INTENT_TYPES.CREATE

  }



  if(

    text.includes("suunnittele") ||

    text.includes("suunnitelma")

  ){

    return INTENT_TYPES.PLAN

  }



  if(

    text.includes("analysoi") ||

    text.includes("selitä") ||

    text.includes("miksi")

  ){

    return INTENT_TYPES.ANALYZE

  }



  if(

    text.includes("päivitä") ||

    text.includes("muuta") ||

    text.includes("korjaa")

  ){

    return INTENT_TYPES.UPDATE

  }



  if(

    text.includes("?")

  ){

    return INTENT_TYPES.QUESTION

  }



  return INTENT_TYPES.EXECUTE

}



function determineObjective({

  intent,

  message

}) {


  const objectives = {


    question:

      "Provide useful information",


    create:

      "Create a new result",


    update:

      "Improve an existing system",


    analyze:

      "Understand and explain",


    remember:

      "Store important information",


    execute:

      "Perform requested operation",


    plan:

      "Create an actionable strategy"

  }



  return {


    intent,


    objective:

      objectives[intent],


    source:
      message

  }

}



function understandIntent({

  message

}) {


  const intent =
    detectIntent(message)



  const result =
    determineObjective({

      intent,

      message

    })



  const record = {


    ...result,


    createdAt:
      new Date().toISOString()

  }



  intentHistory.push(

    record

  )



  return {


    agent:
      "spacemonkey",


    intent:
      result,


    confidence:
      0.7,


    timestamp:
      record.createdAt

  }

}



function getIntentHistory(){


  return [

    ...intentHistory

  ]

}



function getIntentStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    detectedIntents:
      intentHistory.length,


    history:
      intentHistory

  }

}



export {

  INTENT_TYPES,

  understandIntent,

  getIntentHistory,

  getIntentStatus

}
