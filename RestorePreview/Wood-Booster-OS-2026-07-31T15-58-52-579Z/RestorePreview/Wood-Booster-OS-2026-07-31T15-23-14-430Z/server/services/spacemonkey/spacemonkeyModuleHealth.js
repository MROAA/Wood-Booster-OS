/*
=====================================

SPACEMONKEY MODULE HEALTH

Tarkistaa moduulin perustilan.

Ei muuta moduulia.

=====================================
*/



function checkModuleHealth(module){


  if(!module){


    return {


      status:"missing",

      healthy:false


    }

  }







  if(module.enabled === false){


    return {


      id:

        module.id,


      status:

        "disabled",


      healthy:

        false


    }

  }







  return {


    id:

      module.id,


    status:

      "healthy",


    healthy:

      true,


    version:

      module.version


  }


}







export {

  checkModuleHealth

}
