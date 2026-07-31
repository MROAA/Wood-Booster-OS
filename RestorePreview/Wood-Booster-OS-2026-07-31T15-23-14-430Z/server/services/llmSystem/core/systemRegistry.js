const registry = {

  modules: {}

}







function registerSystemModule({

  id,

  name,

  version,

  type = "module",

  status = "REGISTERED",

  dependencies = [],

  capabilities = []

}) {


  registry.modules[id] = {

    id,

    name,

    version,

    type,

    status,

    dependencies,

    capabilities,

    registeredAt:
      new Date()
        .toISOString()

  }


  return registry.modules[id]

}







function getSystemModule(id){


  return registry.modules[id] || null


}







function getSystemModules(){


  return Object.values(
    registry.modules
  )


}







function updateSystemModuleStatus({

  id,

  status

}) {


  if(
    !registry.modules[id]
  ){

    return null

  }



  registry.modules[id].status =
    status



  registry.modules[id].updatedAt =
    new Date()
      .toISOString()



  return registry.modules[id]

}







function clearSystemRegistry(){


  registry.modules = {}


}







export {

  registerSystemModule,

  getSystemModule,

  getSystemModules,

  updateSystemModuleStatus,

  clearSystemRegistry

}
