/*
=====================================

SPACEMONKEY SNAPSHOT ADAPTER

Yhdistää:

- Core Snapshot
- System State

Frontend käyttöä varten.

Ei muuta järjestelmää.

=====================================
*/


import {

  createCoreSnapshot

} from "./core/coreSnapshot.js"







function buildSpacemonkeySnapshot(){


  const coreSnapshot =

    createCoreSnapshot()





  return {


    system:

      "Spacemonkey Snapshot",



    version:

      "1.0.0",



    status:

      "READY",



    core:


      {


        version:

          coreSnapshot.version,


        modules:

          coreSnapshot.moduleCount,


        names:

          coreSnapshot.modules


      },



    recovery:


      {


        available:

          true,


        approvalRequired:

          true


      },



    createdAt:

      coreSnapshot.timestamp



  }


}







export {

  buildSpacemonkeySnapshot

}
