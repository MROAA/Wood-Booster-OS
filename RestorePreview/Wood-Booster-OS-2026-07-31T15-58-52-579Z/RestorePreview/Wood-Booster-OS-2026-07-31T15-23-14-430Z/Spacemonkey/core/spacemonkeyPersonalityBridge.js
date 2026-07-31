import {
  getPersonalityRules,
} from "../../server/services/aiBrainV2/system/spacemonkey/spacemonkeyPersonalityEngine.js"


import {
  getDomain,
} from "./spacemonkeyGodFileBridge.js"





const personalityHistory = []







function loadCorePersonality(){


  const personality =

    getPersonalityRules()



  const personalityGodFiles =

    getDomain(

      "personality"

    )





  const result = {


    system:

      "Spacemonkey Personality Bridge",



    personality:

      {

        communication:

          personality.communication,


        behavior:

          personality.behavior,


        interactionModes:

          personality.interactionModes

      },



    source:

      {

        type:

          "Central Core GodFile Personality",



        domain:

          "personality",



        files:

          personalityGodFiles?.files

          ||

          []

      },



    loadedAt:

      new Date().toISOString()

  }





  personalityHistory.push(

    result

  )





  return result

}







function getPersonality(){


  return loadCorePersonality()

}







function getPersonalityStatus(){


  return {


    engine:

      "Spacemonkey Personality Bridge",


    version:

      "1.0.0",


    requests:

      personalityHistory.length

  }

}







function getPersonalityHistory(){


  return [

    ...personalityHistory

  ]

}







export {

  getPersonality,

  loadCorePersonality,

  getPersonalityStatus,

  getPersonalityHistory

}
