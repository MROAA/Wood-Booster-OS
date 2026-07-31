import {
  validateModule
} from "./moduleInterface.js"



const modules = new Map()



function registerModule(module){


  const validation =
    validateModule(module)



  if(
    !validation.valid
  ){

    throw new Error(
      validation.error
    )

  }



  if(
    modules.has(module.id)
  ){

    throw new Error(
      `Module already registered: ${module.id}`
    )

  }



  modules.set(
    module.id,
    module
  )



  return module

}





function unregisterModule(moduleId){


  return modules.delete(
    moduleId
  )

}





function getModule(moduleId){


  return modules.get(
    moduleId
  )

}





function getAllModules(){


  return Array.from(
    modules.values()
  )

}





function getModuleList(){


  return getAllModules()
    .map(module => ({

      id:
        module.id,

      name:
        module.name,

      version:
        module.version,

      capabilities:
        module.capabilities

    }))

}





async function checkModuleHealth(moduleId){


  const module =
    getModule(moduleId)



  if(
    !module
  ){

    return {

      status:
        "NOT_FOUND"

    }

  }



  try {


    return await module.health()


  }

  catch(error){


    return {

      status:
        "ERROR",

      message:
        error.message

    }

  }


}





async function checkAllHealth(){


  const results = {}



  for(
    const module
    of modules.values()
  ){

    results[module.id] =
      await checkModuleHealth(
        module.id
      )

  }



  return results

}





export {

  registerModule,

  unregisterModule,

  getModule,

  getAllModules,

  getModuleList,

  checkModuleHealth,

  checkAllHealth

}
