/*
=====================================

SPACEMONKEY CORE REGISTRY

Yhdistää Spacemonkeyn
järjestelmätason moduulit.

Tämä ei käytä AI-mallia.

=====================================
*/


import {

  getCreatorCore

} from "./creatorCore.js"



import {

  getPersonalityCore

} from "./personalityCore.js"



import {

  getPhilosophyCore

} from "./philosophyCore.js"



import {

  getSafetyCore

} from "./safetyCore.js"



import {

  getLanguageCore

} from "./languageCore.js"







function getSpacemonkeyCore(){


  return {


    system:

      "Spacemonkey Core",



    version:

      "1.0.0",



    creator:

      getCreatorCore(),



    personality:

      getPersonalityCore(),



    philosophy:

      getPhilosophyCore(),



    safety:

      getSafetyCore(),



    language:

      getLanguageCore(),



    modules:


      [

        "creatorCore",

        "personalityCore",

        "philosophyCore",

        "safetyCore",

        "languageCore"

      ]



  }


}







export {

  getSpacemonkeyCore

}
