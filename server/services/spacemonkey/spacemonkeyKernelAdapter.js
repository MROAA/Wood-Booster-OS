/*
=====================================

SPACEMONEKY KERNEL ADAPTER

Turvallinen lukuväylä
Spacemonkey Kernel Catalogille.

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  createKernelCatalog

} from "./spacemonkeyKernelCatalog.js"







async function getSpacemonkeyKernel(){


  const catalog =

    await createKernelCatalog()







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
