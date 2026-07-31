/*
=====================================

SPACEMONKEY SERVER BOOTSTRAP

Korkean tason serverikäynnistys.

Yhdistää:

- Server Bootstrap Adapter

Ei luo Express appia.

=====================================
*/


import {

  startSpacemonkeyServer

} from "./spacemonkeyServerBootstrapAdapter.js"







function bootSpacemonkeyServer({

  app

}){


  const spacemonkey =

    startSpacemonkeyServer({

      app

    })







  return {


    success:true,


    system:

      "Spacemonkey Server Bootstrap",


    version:

      "1.0.0",


    spacemonkey,


    status:

      "active",


    createdAt:

      new Date().toISOString()


  }


}







export {

  bootSpacemonkeyServer

}
