import {
  loadSpacemonkeyCore,
} from "./spacemonkeyCoreLoader.js"





const resolverHistory = []







function getRegistryModules(){


  const core =

    loadSpacemonkeyCore()



  return (

    core
      ?.registry
      ?.modules

    ||

    []

  )

}







function getEnabledModules(){


  return getRegistryModules()

    .filter(

      module =>

        module.enabled === true

    )

}







function resolveModule(moduleId){


  const modules =

    getEnabledModules()



  const module =

    modules.find(

      item =>

        item.id === moduleId

    )





  const result = {


    requested:

      moduleId,


    found:

      Boolean(module),


    module:

      module || null,


    resolvedAt:

      new Date().toISOString()

  }





  resolverHistory.push(
    result
  )





  return result

}







function resolveEngine(engineName){


  const modules =

    getEnabledModules()



  return (

    modules.find(

      module =>

        module.engine === engineName

    )

    ||

    null

  )

}







function getModuleList(){


  return getEnabledModules()

    .map(

      module => ({

        id:

          module.id,


        name:

          module.name,


        engine:

          module.engine,


        category:

          module.category,


        priority:

          module.priority

      })

    )

}







function getResolverStatus(){


  return {


    engine:

      "Spacemonkey Module Resolver",


    version:

      "1.0.0",


    modules:

      getEnabledModules().length,


    requests:

      resolverHistory.length

  }

}







function getResolverHistory(){

  return [

    ...resolverHistory

  ]

}







export {

  getRegistryModules,

  getEnabledModules,

  resolveModule,

  resolveEngine,

  getModuleList,

  getResolverStatus,

  getResolverHistory

}
