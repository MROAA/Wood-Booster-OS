/*
=====================================

SPACEMONKEY API REGISTRY

Hallinnoi Spacemonkey API routeja.

Ei käynnistä Expressiä.

Vain rekisteri.

=====================================
*/


const apiRoutes = []







function registerSpacemonkeyApiRoute(route){


  apiRoutes.push(route)


}







function getSpacemonkeyApiRoutes(){


  return apiRoutes


}







export {

  registerSpacemonkeyApiRoute,

  getSpacemonkeyApiRoutes

}
