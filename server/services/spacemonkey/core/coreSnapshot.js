/*
=====================================

SPACEMONKEY CORE SNAPSHOT

Luo turvallisen näkymän
Spacemonkey Core -tilasta.

Ei muuta järjestelmää.

Ei käytä AI-mallia.

=====================================
*/


import {

  getSpacemonkeyCore

} from "./coreRegistry.js"







function createCoreSnapshot(){


  const core =

    getSpacemonkeyCore()





  return {


    system:

      core.system,



    version:

      core.version,



    status:

      "stable",



    moduleCount:

      core.modules.length,



    modules:

      core.modules,



    timestamp:

      new Date().toISOString()



  }


}







export {

  createCoreSnapshot

}
