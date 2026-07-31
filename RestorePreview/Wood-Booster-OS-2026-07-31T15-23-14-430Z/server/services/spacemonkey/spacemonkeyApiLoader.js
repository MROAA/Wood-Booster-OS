/*
=====================================

SPACEMONKEY API LOADER

Lataa rekisteröidyt API:t.

Ei käynnistä Expressiä.

Vain hallittu lataus.

=====================================
*/


import {

  getSpacemonkeyApiRoutes

} from "./spacemonkeyApiRegistry.js"







function loadSpacemonkeyApis(){


  const routes =

    getSpacemonkeyApiRoutes()







  return {


    success:true,


    system:

      "Spacemonkey API Loader",


    version:

      "1.0.0",


    apis:

      routes.map(

        route => ({

          ...route

        })

      ),


    count:

      routes.length,


    createdAt:

      new Date().toISOString()


  }


}







export {

  loadSpacemonkeyApis

}
