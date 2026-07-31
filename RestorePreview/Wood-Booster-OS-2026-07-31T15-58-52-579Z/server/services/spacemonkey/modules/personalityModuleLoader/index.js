const MODULE_ID = "personality-module-loader"



const loadedModules = []



function validateModule(module){

  if (!module){

    return {

      valid:
        false,

      reason:
        "Module missing.",

    }

  }



  if (
    !module.id ||
    !module.name
  ){

    return {

      valid:
        false,

      reason:
        "Module metadata incomplete.",

    }

  }



  return {

    valid:
      true,

    module,

  }

}



function loadModule(module){

  const validation =
    validateModule(module)


  if (
    !validation.valid
  ){

    return validation

  }



  const loaded = {

    id:
      module.id,

    name:
      module.name,

    category:
      module.category,

    status:
      "loaded",

    loadedAt:
      new Date().toISOString(),

  }


  loadedModules.push(
    loaded
  )


  return {

    success:
      true,

    module:
      loaded,

  }

}



function getLoadedModules(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      loadedModules.length,

    modules:
      loadedModules,

  }

}



function clearLoadedModules(){

  loadedModules.length = 0


  return {

    cleared:
      true,

  }

}



export {

  MODULE_ID,

  validateModule,

  loadModule,

  getLoadedModules,

  clearLoadedModules,

}
