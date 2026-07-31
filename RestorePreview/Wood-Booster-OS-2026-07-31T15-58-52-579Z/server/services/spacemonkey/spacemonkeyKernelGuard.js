/*
=====================================

SPACEMONKEY KERNEL GUARD V1


Vastuut:

- yhdistää Spacemonkey suojauskerrokset
- suorittaa Identity Guardin
- suorittaa Behavior Guardin
- palauttaa yhtenäisen tuloksen


Ei:

- ei kutsu AI-mallia
- ei kirjoita muistia
- ei tee päätöksiä
- ei muuta Brain Pipelinea


=====================================
*/


import {
  validateSpacemonkeyIdentityResponse,
} from "./spacemonkeyResponseIdentityGuard.js"



import {
  validateSpacemonkeyBehaviorResponse,
} from "./spacemonkeyBehaviorGuard.js"





function applySpacemonkeyKernelGuard({

  answer,

} = {}){


  const identityResult =

    validateSpacemonkeyIdentityResponse({

      answer,

    })



  const behaviorResult =

    validateSpacemonkeyBehaviorResponse({

      answer:
        identityResult.answer,

    })



  return {


    success:
      true,



    answer:

      behaviorResult.answer,



    guards: {


      identity: {

        changed:
          identityResult.changed,


        guard:
          identityResult.guard,

      },



      behavior: {

        changed:
          behaviorResult.changed,


        guard:
          behaviorResult.guard,

      },


    },



    metadata: {


      kernel:

        "Spacemonkey Kernel Guard",


      version:

        "1.0.0",


      timestamp:

        new Date()
          .toISOString(),


    },


  }

}







function getSpacemonkeyKernelGuardStatus(){


  return {


    system:

      "Spacemonkey Kernel Guard",


    version:

      "1.0.0",


    status:

      "READY",


    layers:

      [

        "identity",

        "behavior",

      ],


  }


}







export {

  applySpacemonkeyKernelGuard,

  getSpacemonkeyKernelGuardStatus,

}
