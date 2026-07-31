import {
  registerSystemModule,
  getSystemRegistry,
  getSystemStatus,
} from "./services/systemRegistry.js"



registerSystemModule({

  id:
    "system-activity",

  name:
    "System Activity",

  status:
    "ACTIVE"

})



console.log(
  getSystemRegistry()
)



console.log(
  getSystemStatus()
)
