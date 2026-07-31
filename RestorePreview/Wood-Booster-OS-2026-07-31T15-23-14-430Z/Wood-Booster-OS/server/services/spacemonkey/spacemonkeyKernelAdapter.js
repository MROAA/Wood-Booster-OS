/*
=====================================

SPACEMONKEY KERNEL ADAPTER

Turvallinen lukuväylä
Spacemonkey Kernel Catalogille.

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  createKernelCatalog

} from "./spacemonkeyKernelCatalog.js"







function getSpacemonkeyKernel(){


  const catalog =

    createKernelCatalog()







  return {


    success:true,


    system:

      "Spacemonkey Kernel API",


    version:

      "1.0.0",


    catalog


  }


}







export {

  getSpacemonkeyKernel

}
