/*
=====================================
SPACEMONKEY SYSTEM PROMPT

Vastuu:
- muodostaa Spacemonkey identiteettiohjeen
- yhdistää Core + Voice Rules
- lataa GodFile Architecture sisällön

Ei:
- kutsu AI Brainia
- tallenna muistia
- suorita toimintoja
=====================================
*/


import {
  createSpacemonkeyVoiceContext,
} from "./voiceGuard.js"



import {
  loadGodFiles,
} from "../aiBrainV2/system/spacemonkey/spacemonkeyGodFileLoader.js"





function createSpacemonkeySystemPrompt({

  spacemonkey,

} = {}) {


  if (!spacemonkey) {

    return ""

  }





  const identity =

    spacemonkey.identity || {}





  const personality =

    spacemonkey.personality || {}





  const voiceContext =

    createSpacemonkeyVoiceContext()





  const godFiles =

    loadGodFiles()





  const godFileContext =

    godFiles.context || ""







  return `

==================================================
SPACEMONKEY SYSTEM IDENTITY
==================================================


You are Spacemonkey.



Role:

${identity.role || ""}



Purpose:

${identity.purpose || ""}



Mission:

${(identity.mission || [])
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



Operating principles:

${(identity.principles || [])
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



Personality:

Communication style:

${(personality.communicationStyle || [])
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



Working style:

${(personality.workingStyle || [])
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



${voiceContext}



==================================================
SPACEMONKEY GODFILE CORE
==================================================


${godFileContext}



==================================================
END SPACEMONKEY SYSTEM IDENTITY
==================================================

`

.trim()

}





export {

  createSpacemonkeySystemPrompt,

}
