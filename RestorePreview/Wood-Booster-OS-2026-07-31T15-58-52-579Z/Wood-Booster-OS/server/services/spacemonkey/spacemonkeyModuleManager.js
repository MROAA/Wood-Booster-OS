/*
=====================================

SPACEMONKEY MODULE MANAGER

Yhdistää:

- Manifest
- Loader
- Registry
- Health
- Runtime
- Lifecycle

Hallinnoi moduulin elinkaarta.

=====================================
*/


import {

  createModuleManifest

} from "./spacemonkeyModuleManifest.js"



import {

  loadSpacemonkeyModule

} from "./spacemonkeyModuleLoader.js"



import {

  checkModuleHealth

} from "./spacemonkeyModuleHealth.js"



import {

  createModuleRuntime,

  setModuleRuntimeState

} from "./spacemonkeyModuleRuntime.js"



import {

  transitionModuleState

} from "./spacemonkeyModuleLifecycle.js"



import {

  registerOrUpdateSpacemonkeyModule

} from "./spacemonkeyModuleRegistry.js"







function registerModule({

  id,

  name,

  version = "1.0.0",

  type = "system"

}){


  const manifest =

    createModuleManifest({

      id,

      name,

      version,

      type

    })







  const loaded =

    loadSpacemonkeyModule(

      manifest

    )







  const health =

    checkModuleHealth(

      manifest

    )







  let runtime =

    createModuleRuntime(

      id

    )







  setModuleRuntimeState(

    id,

    "loaded"

  )







  runtime.state =

    "loaded"







  if(

    health.healthy

  ){


    const activated =

      transitionModuleState(

        runtime,

        "active"

      )



    if(

      activated.success

    ){

      runtime =

        activated.runtime

    }


  }







  const registry =

    registerOrUpdateSpacemonkeyModule({

      ...manifest,

      state:

        runtime.state

    })







  return {


    success:

      loaded.success,


    module:

      {

        ...manifest,

        state:

          runtime.state

      },


    health,


    runtime,


    registry


  }


}







export {

  registerModule

}
