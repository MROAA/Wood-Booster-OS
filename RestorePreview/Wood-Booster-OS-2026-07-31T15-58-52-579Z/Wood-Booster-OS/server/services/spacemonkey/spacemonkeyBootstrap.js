/*
=====================================

SPACEMONKEY BOOTSTRAP

Käynnistää Spacemonkey Kernelin.

MVP VERSION

Ei korvaa vanhaa serveriä vielä.

=====================================
*/


import {

  mountSpacemonkeyKernel

} from "./spacemonkeyKernelExpressAdapter.js"







function startSpacemonkey(app){


  const kernel =

    mountSpacemonkeyKernel(

      app

    )







  return {


    success:true,


    system:

      "Spacemonkey Bootstrap",


    version:

      "1.0.0",


    kernel


  }


}







export {

  startSpacemonkey

}
