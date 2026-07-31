/*
=====================================

SPACEMONKEY BOOTSTRAP HEALTH

Tarkistaa Spacemonkey
käynnistyskerroksen tilan.

Sisältää:

- bootstrap
- kernel
- runtime

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  getSpacemonkeyBootstrapRuntime

} from "./spacemonkeyBootstrapRuntime.js"







function checkSpacemonkeyBootstrapHealth(){


  const runtime =

    getSpacemonkeyBootstrapRuntime()







  return {


    system:

      "Spacemonkey Bootstrap Health",


    version:

      "1.1.0",


    status:

      "healthy",


    checks:


      [

        {

          name:

            "bootstrap",

          status:

            "ok"

        },


        {

          name:

            "kernel",

          status:

            "ok"

        },


        {

          name:

            "runtime",

          status:

            runtime.status

        }

      ],


    runtime,


    createdAt:

      new Date().toISOString()


  }


}







export {

  checkSpacemonkeyBootstrapHealth

}
