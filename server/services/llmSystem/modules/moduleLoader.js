import {
  registerModule
} from "./moduleRegistry.js"



import {
  validateModule
} from "./moduleInterface.js"





async function loadModule(moduleDefinition){


  const validation =
    validateModule(
      moduleDefinition
    )



  if(
    !validation.valid
  ){

    return {

      success:false,

      error:
        validation.error

    }

  }





  try {


    if(
      moduleDefinition.initialize
    ){

      await moduleDefinition.initialize()

    }




    const registeredModule =
      registerModule(
        moduleDefinition
      )



    return {

      success:true,

      module:
        registeredModule

    }


  }

  catch(error){


    return {

      success:false,

      error:
        error.message

    }


  }


}





async function loadModules(
  moduleDefinitions = []
){


  const results = []



  for(
    const moduleDefinition
    of moduleDefinitions
  ){

    const result =
      await loadModule(
        moduleDefinition
      )


    results.push(
      result
    )

  }



  return results

}





export {

  loadModule,

  loadModules

}
