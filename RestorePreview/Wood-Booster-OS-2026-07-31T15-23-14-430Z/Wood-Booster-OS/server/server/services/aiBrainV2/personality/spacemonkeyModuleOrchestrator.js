import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const moduleRegistry = [


  {


    id:
      "memory",


    name:
      "Memory Module",


    capabilities:

    [

      "memory_management"

    ],


    status:
      "active",


    priority:
      10

  },


  {


    id:
      "knowledge",


    name:
      "Knowledge Module",


    capabilities:

    [

      "knowledge_management"

    ],


    status:
      "active",


    priority:
      10

  },


  {


    id:
      "reasoning",


    name:
      "Reasoning Module",


    capabilities:

    [

      "reasoning"

    ],


    status:
      "active",


    priority:
      10

  },


  {


    id:
      "planner",


    name:
      "Planning Module",


    capabilities:

    [

      "planning"

    ],


    status:
      "active",


    priority:
      10

  }

]



const routingHistory = []



function findModulesForCapability({

  capability,

}) {


  return moduleRegistry.filter(

    module =>

      module.capabilities.includes(

        capability

      )

  )

}



function evaluateModule({

  module,

  requirement

}) {


  return {


    module,


    requirement,


    score:

      module.priority / 10,


    available:

      module.status === "active"

  }

}



function selectModule({

  capability,

}) {


  const modules =

    findModulesForCapability({

      capability

    })



  if(
    modules.length === 0
  ){


    return {


      found:false,


      capability,


      reason:
        "No matching module found"

    }

  }



  const evaluated =

    modules.map(

      module =>

        evaluateModule({

          module,

          requirement:
            capability

        })

    )



  const selected =

    evaluated.sort(

      (a,b)=>

        b.score -
        a.score

    )[0]



  const route = {


    capability,


    selected,


    timestamp:
      new Date().toISOString()

  }



  routingHistory.push(

    route

  )



  return {


    found:true,


    route

  }

}



function suggestModuleCreation({

  capability,

}) {


  return {


    type:
      "module_creation",


    capability,


    reason:
      "Capability exists but no module provides it.",


    status:
      "proposal"

  }

}



function getModuleStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    modules:
      moduleRegistry,


    routes:
      routingHistory

  }

}



export {

  findModulesForCapability,

  selectModule,

  suggestModuleCreation,

  getModuleStatus

}
