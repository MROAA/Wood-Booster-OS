/*
=====================================
WOOD-BOOSTER AI PLATFORM

CREATOR IDENTITY CONTEXT PROVIDER V1

=====================================
*/


import {
  loadCreatorIdentity,
} from "./creatorIdentityLoader.js"







const creatorIdentityProvider = {


  id:
    "creator_identity",


  name:
    "Creator Identity Provider",


  priority:
    45,



  async getContext(){


    const identity =
      await loadCreatorIdentity()



    return {

      available:
        identity.success,


      pdfLoaded:
        identity.pdfLoaded,


      sourceCount:
        identity.sourceCount,


      contextAvailable:
        Boolean(
          identity.context
        ),


      source:
        "creator-identity-provider"

    }


  }


}







export {

  creatorIdentityProvider

}
