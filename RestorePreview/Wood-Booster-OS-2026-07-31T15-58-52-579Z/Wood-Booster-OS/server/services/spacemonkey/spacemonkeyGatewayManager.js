/*
=====================================

SPACEMONKEY GATEWAY MANAGER

Yhdistää:

- API Registry
- API Loader
- API Router Loader

Hallinnoi API gatewayn tilaa.

Ei käynnistä Expressiä.

=====================================
*/


import {

  loadSpacemonkeyApis

} from "./spacemonkeyApiLoader.js"



import {

  loadSpacemonkeyApiRouters

} from "./spacemonkeyApiRouterLoader.js"







function getGatewayStatus(){


  const apis =

    loadSpacemonkeyApis()





  const routers =

    loadSpacemonkeyApiRouters()







  return {


    success:true,


    system:

      "Spacemonkey Gateway Manager",


    version:

      "1.0.0",


    apis,

    routers,


    createdAt:

      new Date().toISOString()


  }


}







export {

  getGatewayStatus

}
