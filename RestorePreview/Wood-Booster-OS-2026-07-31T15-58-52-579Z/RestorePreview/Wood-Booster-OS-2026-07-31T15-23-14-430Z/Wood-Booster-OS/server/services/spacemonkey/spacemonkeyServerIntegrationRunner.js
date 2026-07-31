/*
=====================================

SPACEMONKEY SERVER INTEGRATION RUNNER

Kutsuu Spacemonkey Integration Layeria
yhdestä paikasta.

Ei sisällä serverin logiikkaa.

=====================================
*/


import {

  initializeSpacemonkeyServer

} from "./spacemonkeyServerIntegrationAdapter.js"







function runSpacemonkeyServerIntegration({

  app

}){


  const result =

    initializeSpacemonkeyServer({

      app

    })







  return {


    success:true,


    system:

      "Spacemonkey Server Integration Runner",


    version:

      "1.0.0",


    result,


    status:

      "active",


    createdAt:

      new Date().toISOString()


  }


}







export {

  runSpacemonkeyServerIntegration

}
