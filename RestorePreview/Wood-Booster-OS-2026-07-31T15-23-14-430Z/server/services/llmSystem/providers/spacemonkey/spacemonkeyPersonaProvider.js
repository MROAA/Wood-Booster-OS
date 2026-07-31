/*
=====================================
WOOD-BOOSTER AI PLATFORM

SPACEMONKEY PERSONA PROVIDER V2

Vastuut:

- tarjoaa Spacemonkey identiteetin
- lataa persoonallisuuden Godfileistä
- lataa creator-kontekstin
- antaa Context Enginelle identiteettikerroksen

Ei:

- kutsu LLM:ää
- tallenna muistia
- tee päätöksiä

=====================================
*/


import {
  loadGodfiles,
  createGodfileContext,
} from "./godfileLoader.js"







const spacemonkeyPersonaProvider = {


  id:
    "spacemonkeyPersona",



  name:
    "Spacemonkey Persona Provider",



  priority:
    60,





  async getContext(){


    const godfiles =
      await loadGodfiles()





    return {


      available:
        true,



      godfilesLoaded:
        godfiles.loaded,



      godfileCount:
        godfiles.count,



      godfiles:
        godfiles.documents
          .map(
            document =>
              document.file
          ),



      identity: {

        name:
          "Spacemonkey",


        role:
          "AI Operator",


        platform:
          "Wood-Booster AI Platform"

      },



      creator:

        "Marc Järvinen",



      context:

        createGodfileContext(
          godfiles
        )


    }


  }


}





export {

  spacemonkeyPersonaProvider

}
