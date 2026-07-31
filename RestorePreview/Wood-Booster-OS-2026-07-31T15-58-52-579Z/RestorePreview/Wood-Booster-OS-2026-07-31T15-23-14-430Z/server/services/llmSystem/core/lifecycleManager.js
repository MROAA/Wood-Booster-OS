const lifecycle = {}





const STATES = {

  CREATED:
    "CREATED",

  INITIALIZING:
    "INITIALIZING",

  READY:
    "READY",

  RUNNING:
    "RUNNING",

  ERROR:
    "ERROR",

  STOPPED:
    "STOPPED"

}







function createLifecycleEntry({

  id

}) {


  lifecycle[id] = {

    id,

    state:
      STATES.CREATED,

    createdAt:
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString(),

    error:
      null

  }



  return lifecycle[id]

}







function setLifecycleState({

  id,

  state,

  error = null

}) {


  if(
    !lifecycle[id]
  ){

    createLifecycleEntry({

      id

    })

  }





  lifecycle[id].state =
    state



  lifecycle[id].error =
    error



  lifecycle[id].updatedAt =
    new Date()
      .toISOString()



  return lifecycle[id]

}







function getLifecycleState(id){


  return lifecycle[id] || null


}







function getAllLifecycleStates(){


  return Object.values(
    lifecycle
  )


}







function clearLifecycle(){


  Object.keys(lifecycle)
    .forEach(
      key => {

        delete lifecycle[key]

      }
    )


}







export {

  STATES,

  createLifecycleEntry,

  setLifecycleState,

  getLifecycleState,

  getAllLifecycleStates,

  clearLifecycle

}
