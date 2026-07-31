import {
  registerDefaultBrainModules,
} from "./services/aiBrainV2/registerDefaultModules.js"


import {
  getRegisteredBrainModules,
} from "./services/aiBrainV2/moduleRegistry.js"



console.log(
  "INITIALIZING MODULES",
)



const result =
  registerDefaultBrainModules()



console.log(
  result,
)



console.log(
  "\nREGISTERED MODULES",
)



const modules =
  getRegisteredBrainModules()



console.log(

  modules.map(
    module => ({

      id:
        module.id,

      name:
        module.name,

      version:
        module.version,

      priority:
        module.priority,

    }),
  ),

)
