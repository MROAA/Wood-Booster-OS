import {
  loadDefaultSystemModules,
} from "./services/defaultSystemModules.js"



import {
  getSystemRegistry,
} from "./services/systemRegistry.js"



loadDefaultSystemModules()



console.log(
  JSON.stringify(
    getSystemRegistry(),
    null,
    2
  )
)
