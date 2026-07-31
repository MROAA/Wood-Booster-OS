/*
=====================================

SPACEMONKEY ROUTE MANIFEST

Määrittää Spacemonkey route-identiteetin.

Ei käynnistä routea.

Vain määrittely.

=====================================
*/


function createRouteManifest({

  id,

  name,

  path,

  version = "1.0.0",

  type = "api"

}){


  return {


    id,

    name,

    path,

    version,

    type,

    enabled:true,

    status:"active"


  }


}







export {

  createRouteManifest

}
