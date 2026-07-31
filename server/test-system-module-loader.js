import {
  loadSystemModule,
} from "./services/systemModuleLoader.js"



import {
  getSystemRegistry,
} from "./services/systemRegistry.js"



loadSystemModule({

  id:
    "backup",

  name:
    "Backup System",

  status:
    "ACTIVE"

})



console.log(
  getSystemRegistry()
)
