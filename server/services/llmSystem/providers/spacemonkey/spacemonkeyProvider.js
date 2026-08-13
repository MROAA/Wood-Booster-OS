/*
=====================================
WOOD-BOOSTER AI PLATFORM

SPACEMONKEY CONTEXT PROVIDER V2

Vastuut:

- tarjoaa Spacemonkey identiteettitilan
- suojaa raakaa identiteettidataa
- antaa vain metatiedon ulospäin

=====================================
*/


import {
  loadSpacemonkeyIdentity,
} from "./spacemonkeyIdentityProvider.js"





const spacemonkeyProvider = {


  id:
    "spacemonkey",


  name:
    "Spacemonkey Identity Provider",


  priority:
    50,



  async provide(){


    const identity =
      await loadSpacemonkeyIdentity()



    return {


      available:
        identity.success,


      identityLoaded:
        true,


      name:
        identity.name,


      role:
        identity.role,


      creatorLoaded:
        identity.creatorLoaded,


      contextAvailable:
        Boolean(
          identity.context
        ),


      source:
        "spacemonkey-provider"


    }


  }


}





export {

  spacemonkeyProvider

}
