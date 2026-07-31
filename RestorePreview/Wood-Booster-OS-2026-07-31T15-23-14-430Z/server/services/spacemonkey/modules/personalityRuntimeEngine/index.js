const MODULE_ID = "personality-runtime-engine"



const runtimeState = {

  status:
    "initialized",

  activeRules:
    [],

  lastUpdate:
    null,

}



function initializePersonalityRuntime({

  modules = [],

  context = null,

}){

  runtimeState.status =
    "active"


  runtimeState.activeRules =
    modules.map(
      module => ({
        id:
          module.id,

        status:
          module.status || "active",

      })
    )


  runtimeState.lastUpdate =
    new Date().toISOString()



  return {

    moduleId:
      MODULE_ID,

    status:
      runtimeState.status,

    loadedModules:
      runtimeState.activeRules.length,

    contextLoaded:
      Boolean(context),

    timestamp:
      runtimeState.lastUpdate,

  }

}



function processPersonalityInput(message){

  const input =
    String(message)
      .toLowerCase()



  const result = {

    moduleId:
      MODULE_ID,

    input,

    effects:

      [],

  }



  if (
    input.includes("kiitos")
  ){

    result.effects.push(
      "positive-reinforcement"
    )

  }



  if (
    input.includes("vittu") ||
    input.includes("perkele")
  ){

    result.effects.push(
      "frustration-detection"
    )

  }



  return result

}



function getRuntimeStatus(){

  return {

    moduleId:
      MODULE_ID,

    status:
      runtimeState.status,

    activeRules:
      runtimeState.activeRules.length,

    lastUpdate:
      runtimeState.lastUpdate,

  }

}



export {

  MODULE_ID,

  initializePersonalityRuntime,

  processPersonalityInput,

  getRuntimeStatus,

}
