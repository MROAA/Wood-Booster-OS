import {
  SERVER_CONFIG,
} from "./serverConfig.js"





const registry = {


  system:

    SERVER_CONFIG,



  modules: [],



  status:

    "READY"


}







export function registerSystemModule(module){


  registry.modules.push(

    {

      id:
        module.id,


      name:
        module.name,


      status:
        module.status || "READY"


    }

  )



}







export function getSystemRegistry(){


  return registry


}







export function getSystemStatus(){


  return {


    name:
      registry.system.name,


    version:
      registry.system.version,


    status:
      registry.status,


    modules:
      registry.modules.length


  }


}
