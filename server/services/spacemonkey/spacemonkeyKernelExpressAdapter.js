/*
=====================================

SPACEMONKEY KERNEL EXPRESS ADAPTER

Liittää Spacemonkey Kernelin
Express sovellukseen.

Ei sisällä liiketoimintalogiikkaa.

Vain integraatiosilta.

=====================================
*/


import {

  createSpacemonkeyKernelApiRouter

} from "../../routes/spacemonkeyKernelApi.js"







function mountSpacemonkeyKernel(app){


  const router =

    createSpacemonkeyKernelApiRouter()







  app.use(

    "/api",

    router

  )







  return {


    success:true,


    system:

      "Spacemonkey Kernel Express Adapter",


    version:

      "1.0.0",


    mounted:

      true


  }


}







export {

  mountSpacemonkeyKernel

}
