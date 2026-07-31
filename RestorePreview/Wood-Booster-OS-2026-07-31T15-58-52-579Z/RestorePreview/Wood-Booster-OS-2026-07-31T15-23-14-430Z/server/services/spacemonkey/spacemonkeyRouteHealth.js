/*
=====================================

SPACEMONKEY ROUTE HEALTH

Tarkistaa Spacemonkey routejen tilan.

Read-only.

Ei muuta järjestelmää.

=====================================
*/







function checkRouteHealth(route){


  if(!route || !route.id){


    return {


      id:

        null,


      status:

        "unhealthy",


      healthy:

        false,


      reason:

        "Invalid route"

    }


  }







  return {


    id:

      route.id,


    status:

      "healthy",


    healthy:

      true,


    version:

      route.version || "1.0.0"


  }


}







export {

  checkRouteHealth

}
