const MODULE_ID = "personality-reflection-connector"



const reflections = []



function createReflectionRequest({

  source,

  observation,

  proposal,

}){

  const request = {

    id:
      `reflection-request-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    source,

    observation,

    proposal,

    status:
      "pending",

  }


  reflections.push(request)


  return request

}



function evaluateReflection({

  id,

  result,

}){

  const reflection =
    reflections.find(
      item =>
        item.id === id
    )


  if (!reflection){

    return {

      success:
        false,

      reason:
        "Reflection request not found.",

    }

  }



  reflection.status =
    "evaluated"


  reflection.result =
    result


  reflection.evaluatedAt =
    new Date().toISOString()



  return {

    success:
      true,

    reflection,

  }

}



function getReflections(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      reflections.length,

    reflections,

  }

}



function getPendingReflections(){

  return reflections.filter(
    item =>
      item.status === "pending"
  )

}



export {

  MODULE_ID,

  createReflectionRequest,

  evaluateReflection,

  getReflections,

  getPendingReflections,

}
