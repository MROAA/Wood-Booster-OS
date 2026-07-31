const intentHistory = []



const MODES = {

  CODING:
    "coding",

  MEMORY:
    "memory",

  PLANNING:
    "planning",

  DEBUG:
    "debug",

  GENERAL:
    "general"

}



function routeIntent({

  intent

}) {


  let mode =
    MODES.GENERAL



  switch(intent.intent){


    case "CODING_REQUEST":

      mode =
        MODES.CODING

      break



    case "MEMORY_REQUEST":

      mode =
        MODES.MEMORY

      break



    case "PLANNING_REQUEST":

      mode =
        MODES.PLANNING

      break



    case "DEBUG_REQUEST":

      mode =
        MODES.DEBUG

      break


  }



  const result = {


    intent:
      intent.intent,


    confidence:
      intent.confidence,


    mode,


    createdAt:
      new Date().toISOString()

  }



  intentHistory.push(

    result

  )



  return result

}



function getIntentRouterStatus(){

  return {


    engine:
      "Spacemonkey Intent Router",


    version:
      "0.1.0",


    routes:
      intentHistory.length

  }

}



export {

  routeIntent,

  getIntentRouterStatus,

  MODES

}
