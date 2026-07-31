/*
=====================================

SPACEMONKEY MODULE MANIFEST

Yhtenäinen moduulimäärittely.

Ei suorita moduuleita.

Vain metadata.

=====================================
*/



function createModuleManifest({

  id,

  name,

  version = "1.0.0",

  type = "system",

  enabled = true,

  health = "ok"

}){


  return {


    id,


    name,


    version,


    type,


    enabled,


    health



  }


}







export {

  createModuleManifest

}
