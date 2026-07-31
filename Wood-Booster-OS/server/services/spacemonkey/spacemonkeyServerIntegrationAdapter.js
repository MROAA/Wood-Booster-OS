 /*
=====================================

SPACEMONKEY SERVER INTEGRATION ADAPTER

Turvallinen liitoskerros
Wood-Booster Serverin ja
Spacemonkeyn välillä.

Ei muuta olemassa olevia
routeja tai palveluita.

=====================================
*/


import {

  initializeSpacemonkey

} from "./spacemonkeyServerIntegration.js"







function initializeSpacemonkeyServer({

  app

}){


  const spacemonkey =

    initializeSpacemonkey({

      app

    })







  return {


    success:true,


    system:

      "Spacemonkey Server Integration Adapter",


    version:

      "1.0.0",


    status:

      "active",


    spacemonkey,


    createdAt:

      new Date().toISOString()


  }


}







export {

  initializeSpacemonkeyServer

}
