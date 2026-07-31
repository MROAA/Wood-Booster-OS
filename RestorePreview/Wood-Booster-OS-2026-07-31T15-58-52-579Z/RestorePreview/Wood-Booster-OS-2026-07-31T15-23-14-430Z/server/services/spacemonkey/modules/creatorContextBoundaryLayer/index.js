const MODULE_ID = "creator-context-boundary-layer"



const classifications = [

  {
    id:
      "public",

    description:
      "Safe general information.",

  },


  {
    id:
      "internal",

    description:
      "Internal system context.",

  },


  {
    id:
      "creator",

    description:
      "Creator-specific information.",

  },

]



const boundaryEvents = []



function classifyData(data){

  if (
    !data
  ){

    return "unknown"

  }


  const text =
    JSON.stringify(data)
      .toLowerCase()



  if (
    text.includes("creator")
    ||
    text.includes("marc")
  ){

    return "creator"

  }



  if (
    text.includes("system")
    ||
    text.includes("module")
  ){

    return "internal"

  }



  return "public"

}



function sanitizeContext(context){

  const classification =
    classifyData(context)



  return {

    classification,

    data:

      {
        available:
          true,

        content:
          context,

      },


    timestamp:
      new Date().toISOString(),

  }

}



function minimizeContext({

  context,

  requiredFields,

}){

  const minimized = {}



  requiredFields.forEach(
    field => {

      if (
        context[field]
      ){

        minimized[field] =
          context[field]

      }

    }
  )



  return {

    data:
      minimized,

    minimized:
      true,

  }

}



function recordBoundaryEvent({

  action,

  classification,

  result,

}){

  const event = {

    id:
      `boundary-event-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    action,

    classification,

    result,

  }


  boundaryEvents.push(event)


  return event

}



function getBoundaryEvents(){

  return {

    moduleId:
      MODULE_ID,

    count:
      boundaryEvents.length,

    events:
      boundaryEvents,

  }

}



function getClassifications(){

  return {

    moduleId:
      MODULE_ID,

    classifications,

  }

}



export {

  MODULE_ID,

  classifyData,

  sanitizeContext,

  minimizeContext,

  recordBoundaryEvent,

  getBoundaryEvents,

  getClassifications,

}
