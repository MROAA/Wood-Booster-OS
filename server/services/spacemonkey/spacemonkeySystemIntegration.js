/*
=====================================

SPACEMONKEY SYSTEM INTEGRATION

Keskitetty Spacemonkey integraatiokerros.

Kytkee:

- Event Layer
- Memory Bridge
- Cognitive Event Bridge
- API Routes
- Future Modules

=====================================
*/


import {
  integrateSpacemonkeyLayers,
} from "./spacemonkeyIntegrationRegistry.js"



import {
  startSpacemonkeyMemoryBridge,
} from "./spacemonkeyMemoryBridge.js"



import {
  startSpacemonkeyCognitiveEventBridge,
} from "./spacemonkeyCognitiveEventBridge.js"



import {
  integrateSpacemonkeyRoutes,
} from "./spacemonkeyRouteIntegration.js"







export function integrateSpacemonkeySystem(app){


  console.log(
    "SPACEMONKEY SYSTEM INTEGRATION START"
  )



  integrateSpacemonkeyLayers(
    app
  )



  startSpacemonkeyMemoryBridge()



  console.log(
    "SPACEMONKEY MEMORY BRIDGE READY"
  )



  startSpacemonkeyCognitiveEventBridge()



  console.log(
    "SPACEMONKEY COGNITIVE BRIDGE READY"
  )



  integrateSpacemonkeyRoutes(
    app
  )



  console.log(
    "SPACEMONKEY ROUTES READY"
  )



  console.log(
    "SPACEMONKEY SYSTEM INTEGRATION READY"
  )


}
