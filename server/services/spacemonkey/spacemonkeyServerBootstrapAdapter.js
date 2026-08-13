/*
=====================================

SPACEMONKEY SERVER BOOTSTRAP ADAPTER

Yhdistää:

- Express Server
- Spacemonkey Start

Ei sisällä serverin luontia.

Vain adapteri.

=====================================
*/


import {

  startSpacemonkey

} from "./spacemonkeyStart.js"







function startSpacemonkeyServer({

  app

}){


  const spacemonkey =

    startSpacemonkey({

      app

    })







  return {


    success:true,


    system:

      "Spacemonkey Server Bootstrap Adapter",


    version:

      "1.0.0",


    spacemonkey,


    createdAt:

      new Date().toISOString()


  }


}







export {

  startSpacemonkeyServer

}
