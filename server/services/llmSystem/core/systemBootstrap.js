import {
  getSystemModules
} from "../modules/index.js"



import {
  registerSystemModule,
  updateSystemModuleStatus
} from "./systemRegistry.js"



import {
  createLifecycleEntry,
  setLifecycleState,
  STATES
} from "./lifecycleManager.js"





let booted = false







async function bootstrapSystem(){


  if(
    booted
  ){

    return {

      success:true,

      status:
        "already_booted"

    }

  }





  const modules =
    getSystemModules()





  const registered = []





  for(
    const module
    of modules
  ){


    createLifecycleEntry({

      id:
        module.id

    })



    setLifecycleState({

      id:
        module.id,

      state:
        STATES.INITIALIZING

    })





    registerSystemModule({

      id:
        module.id,

      name:
        module.name,

      version:
        module.version,

      type:
        "module",

      capabilities:
        module.capabilities || []

    })





    try {


      if(
        module.initialize
      ){

        await module.initialize()

      }





      let status =
        STATES.READY





      if(
        module.health
      ){

        const health =
          await module.health()



        status =
          health.status

      }





      setLifecycleState({

        id:
          module.id,

        state:
          status === "READY"

            ?

            STATES.READY

            :

            STATES.ERROR

      })





      updateSystemModuleStatus({

        id:
          module.id,

        status

      })





      registered.push({

        id:
          module.id,

        status

      })


    }


    catch(error){


      setLifecycleState({

        id:
          module.id,

        state:
          STATES.ERROR,

        error:
          error.message

      })



      updateSystemModuleStatus({

        id:
          module.id,

        status:
          "ERROR"

      })



      registered.push({

        id:
          module.id,

        status:
          "ERROR"

      })


    }


  }





  booted = true





  return {

    success:true,

    status:
      "booted",

    modules:
      registered

  }


}







function getBootstrapStatus(){


  return {

    booted

  }


}







export {

  bootstrapSystem,

  getBootstrapStatus

}
