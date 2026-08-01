/*
=====================================

SPACEMONKEY CAPABILITY ADAPTER

Turvallinen lukuväylä
Spacemonkey Capability Registrylle.

Read-only.

Ei muuta moduuleita.

=====================================
*/


import {

  getCapabilityRegistry

} from "./modules/capabilityRegistry/index.js"







function getSpacemonkeyCapabilities(){


  const registry =

    getCapabilityRegistry()







  return {


    success:true,


    system:

      "Spacemonkey Capability API",


    version:

      "1.0.0",


    capabilities:

      registry,


    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyCapabilities

}
