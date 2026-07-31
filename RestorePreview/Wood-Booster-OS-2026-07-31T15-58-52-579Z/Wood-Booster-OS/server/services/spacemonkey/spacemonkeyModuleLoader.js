/*
=====================================

SPACEMONKEY MODULE LOADER

Lataa ja alustaa Spacemonkey moduulit.

Ei suorita moduulien sisäistä logiikkaa.

Vain hallinta.

=====================================
*/


import {

  registerSpacemonkeyModule,

  getSpacemonkeyModules

} from "./spacemonkeyModuleRegistry.js"







function loadSpacemonkeyModule(module){


  if(!module || !module.id){


    return {


      success:false,


      error:"Invalid module"


    }

  }





  registerSpacemonkeyModule(

    module

  )





  return {


    success:true,


    module:

      module.id


  }


}







function getLoadedSpacemonkeyModules(){


  return getSpacemonkeyModules()


}







export {

  loadSpacemonkeyModule,

  getLoadedSpacemonkeyModules

}
