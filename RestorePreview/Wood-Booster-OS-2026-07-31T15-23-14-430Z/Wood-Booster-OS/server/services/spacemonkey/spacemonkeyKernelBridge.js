/*
=====================================

SPACEMONKEY KERNEL BRIDGE

Yhdistää Spacemonkey Kernel
API-kerroksen.

Hallintakerros.

Ei sisällä liiketoimintalogiikkaa.

=====================================
*/


import {

  getSpacemonkeyKernel

} from "./spacemonkeyKernelAdapter.js"







function getKernelBridgeStatus(){


  return {


    success:true,


    system:

      "Spacemonkey Kernel Bridge",


    version:

      "1.0.0",


    kernel:

      getSpacemonkeyKernel(),


    createdAt:

      new Date().toISOString()


  }


}







export {

  getKernelBridgeStatus

}
