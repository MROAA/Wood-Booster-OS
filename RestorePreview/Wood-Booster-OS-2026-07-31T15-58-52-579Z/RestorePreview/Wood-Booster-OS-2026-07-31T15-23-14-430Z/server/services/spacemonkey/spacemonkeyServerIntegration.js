/*
=====================================

SPACEMONKEY SERVER INTEGRATION

Ylin serveriliitoskerros.

Yhdistää:

- Express Server
- Spacemonkey Server Bootstrap

Ei sisällä serverin logiikkaa.

=====================================
*/


import {

  bootSpacemonkeyServer

} from "./spacemonkeyServerBootstrap.js"







function initializeSpacemonkey({

  app

}){


  const spacemonkey =

    bootSpacemonkeyServer({

      app

    })







  return {


    success:true,


    system:

      "Spacemonkey Server Integration",


    version:

      "1.0.0",


    status:

      "initialized",


    spacemonkey,


    createdAt:

      new Date().toISOString()


  }


}







export {

  initializeSpacemonkey

}
