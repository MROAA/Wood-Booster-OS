/*
=====================================

AI BRAIN V2

SPACEMONKEY KERNEL ADAPTER V2


Vastuut:

- yhdistää Spacemonkey Kernelin AI Brainiin
- tarjoaa turvallisen context-rajapinnan
- välittää järjestelmän tilan Brainille
- välittää Spacemonkey identiteetin Brainille


Lisätty:

- Identity Runtime Layer


Ei:

- tee päätöksiä
- kutsu LLM:ää
- suorita työkaluja
- muuta Brain Pipelinea

=====================================
*/


import {
  createSpacemonkeySystemKernel,
  getSpacemonkeyKernelStatus,
} from "../../spacemonkey/spacemonkeySystemKernel.js"



import {
  getSpacemonkeyIdentityContext,
} from "../../spacemonkey/spacemonkeyIdentityRuntime.js"







function createSpacemonkeyKernelContext(){


  const kernel =

    createSpacemonkeySystemKernel()





  return {


    system:

      "Spacemonkey Kernel Context",



    kernelStatus:

      getSpacemonkeyKernelStatus(
        kernel
      ),



    identity:

      getSpacemonkeyIdentityContext(),



    runtime:

      kernel.runtime,



    integrations:

      kernel.integrations,



    capabilities:

      kernel.capabilities,


  }


}







function injectSpacemonkeyKernelContext(
  runtimeContext = {}
){


  return {


    ...runtimeContext,



    spacemonkey:

      createSpacemonkeyKernelContext(),



    spacemonkeyKernelEnabled:

      true,


  }


}







export {

  createSpacemonkeyKernelContext,

  injectSpacemonkeyKernelContext,

}
