/*
=====================================

SPACEMONKEY INTEGRATION REGISTRY

Kokoaa Spacemonkey palvelukerrokset.

=====================================
*/


import {
  integrateSpacemonkeyEventLayer,
} from "./spacemonkeyEventServerIntegration.js"





export function integrateSpacemonkeyLayers(app){


  console.log(
    "SPACEMONKEY REGISTRY START"
  )



  integrateSpacemonkeyEventLayer(
    app
  )



  console.log(
    "SPACEMONKEY REGISTRY READY"
  )


}
