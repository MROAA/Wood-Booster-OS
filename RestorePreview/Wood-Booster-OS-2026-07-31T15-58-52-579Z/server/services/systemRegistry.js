import {
  SERVER_CONFIG,
} from "./serverConfig.js"



const registry =
  globalThis.__WOOD_BOOSTER_SYSTEM_REGISTRY ||
  {


    system:
      SERVER_CONFIG,


    modules:
      [],


    status:
      "READY"


  }



globalThis.__WOOD_BOOSTER_SYSTEM_REGISTRY =
  registry






export function registerSystemModule(module){


  const exists =
    registry.modules.some(
      item =>
        item.id === module.id
    )



  if(exists){

    return

  }



  registry.modules.push({

    id:
      module.id,


    name:
      module.name,


    status:
      module.status || "READY"


  })


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
