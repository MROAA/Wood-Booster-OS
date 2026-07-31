const reflectionHistory = []



function createReflection({

  task,

  workflow,

  audit,

  summary

}) {


  const reflection = {


    taskId:

      task?.id || null,


    target:

      task?.target || null,


    evaluation:

      evaluateResult({

        workflow,

        audit

      }),


    observations:

      createObservations({

        workflow,

        audit,

        summary

      }),


    improvements:

      createImprovements({

        audit

      }),


    createdAt:

      new Date().toISOString()

  }



  reflectionHistory.push(

    reflection

  )



  return reflection

}





function evaluateResult({

  workflow,

  audit

}) {


  if(

    audit?.execution?.status === "completed"

  ){

    return "success"

  }



  if(

    workflow?.status === "active"

  ){

    return "in_progress"

  }



  return "needs_review"

}





function createObservations({

  workflow,

  audit,

  summary

}) {


  const observations = []



  if(workflow){

    observations.push(

      "Workflow seurattu."

    )

  }



  if(audit){

    observations.push(

      "Suoritus kirjattu audit-lokiin."

    )

  }



  if(summary){

    observations.push(

      "Kehitystilanne analysoitu."

    )

  }



  return observations

}





function createImprovements({

  audit

}) {


  const improvements = []



  if(

    !audit

  ){

    improvements.push(

      "Varmista audit-lokin luominen."

    )

  }



  else {


    improvements.push(

      "Säilytä turvallinen hyväksyntävaihe ennen muutoksia."

    )

  }



  return improvements

}





function getReflectionHistory(){


  return [

    ...reflectionHistory

  ]

}





function getReflectionStatus(){


  return {


    engine:

      "Spacemonkey Self Reflection Engine",


    version:

      "0.1.0",


    reflections:

      reflectionHistory.length

  }

}



export {

  createReflection,

  getReflectionHistory,

  getReflectionStatus

}
