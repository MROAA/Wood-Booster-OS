const MODULE_ID = "personality-integration-adapter"



function createPersonalityPayload({

  context = {},

  runtime = {},

}){

  return {

    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),


    personality:

      {
        identity:
          context.identity || "Spacemonkey",


        traits:
          context.traits || [],


        communication:
          context.communication || {},

      },


    runtime:

      {
        status:
          runtime.status || "unknown",


        activeModules:
          runtime.activeModules || [],

      },


    integration:

      {
        target:
          "AI Brain V2",

        mode:
          "context-provider",

        writable:
          false,

      },

  }

}



function validatePersonalityPayload(payload){

  if (!payload){

    return {

      valid:
        false,

      reason:
        "Payload missing.",

    }

  }



  if (
    !payload.personality ||
    !payload.integration
  ){

    return {

      valid:
        false,

      reason:
        "Invalid personality payload.",

    }

  }



  return {

    valid:
      true,

    payload,

  }

}



function getAdapterStatus(){

  return {

    moduleId:
      MODULE_ID,

    status:
      "ready",

    integration:
      "not-connected",

    safety:
      "read-only",

  }

}



export {

  MODULE_ID,

  createPersonalityPayload,

  validatePersonalityPayload,

  getAdapterStatus,

}
