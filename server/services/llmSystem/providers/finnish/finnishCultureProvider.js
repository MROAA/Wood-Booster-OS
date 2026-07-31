/*
=====================================
WOOD-BOOSTER AI PLATFORM

FINNISH CULTURE PROVIDER V1

Vastuut:

- tarjoaa suomalaisen identiteettikontekstin
- lataa suomalaiset tietolähteet
- antaa Context Enginelle suomalaisen
  kulttuurikerroksen

Ei:

- kutsu LLM:ää
- tallenna muistia
- päätä reititystä

=====================================
*/


import {
  loadFinnishIdentity,
  createFinnishIdentityContext,
} from "../../../aiBrainV2/engines/finnishIdentityEngine.js"







const finnishCultureProvider = {


  id:
    "finnishCulture",


  name:
    "Finnish Culture Provider",


  priority:
    50,



  async getContext(){


    const identity =
      await loadFinnishIdentity()





    return {

      available:
        identity.success,


      language:
        identity.language,


      culture:
        identity.culture,


      documents:
        identity.documentCount,


      context:
        createFinnishIdentityContext(
          identity,
        )

    }


  }


}





export {

  finnishCultureProvider

}
