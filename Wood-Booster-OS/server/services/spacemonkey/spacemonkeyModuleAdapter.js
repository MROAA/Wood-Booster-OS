/*
=====================================

SPACEMONKEY MODULE ADAPTER

Turvallinen lukuväylä
muille järjestelmille.

Ei muuta moduuleita.

Read-only.

=====================================
*/


import {

  createModuleCatalog

} from "./spacemonkeyModuleCatalog.js"







function getSpacemonkeyModules(){


  const catalog =

    createModuleCatalog()







  return {


    success:true,


    system:

      "Spacemonkey Module API",


    version:

      "1.0.0",


    modules:

      catalog.modules,


    createdAt:

      catalog.createdAt


  }


}







export {

  getSpacemonkeyModules

}
