/*
=====================================
SPACEMONKEY SYSTEM CONTEXT ADAPTER

Vastuut:
- muodostaa Spacemonkeyn system-tason kontekstin
- yhdistää Identity + Voice Rules

Ei:
- kutsu AI Brainia
- kutsu Ollamaa
- tallenna muistia
- muuta Corea

=====================================
*/


import {
  createSpacemonkeyVoiceContext,
} from "./voiceGuard.js"



function safeArray(value) {

  return Array.isArray(value)
    ? value
    : []

}



function createSpacemonkeySystemContext({

  spacemonkey,

} = {}) {


  if (!spacemonkey) {

    return ""

  }



  const identity =
    spacemonkey.identity || {}



  const personality =
    spacemonkey.personality || {}



  const environment =
    spacemonkey.environment || {}



  const voiceContext =
    createSpacemonkeyVoiceContext()



  return `

==================================================
SPACEMONKEY SYSTEM CONTEXT
==================================================


IDENTITY:


Name:

${identity.name || "Spacemonkey"}



Role:

${identity.role || ""}



Purpose:

${identity.purpose || ""}



Mission:

${safeArray(identity.mission)
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



Operating principles:

${safeArray(identity.principles)
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



PERSONALITY:


Communication style:

${safeArray(
  personality.communicationStyle,
)
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



Working style:

${safeArray(
  personality.workingStyle,
)
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



ENVIRONMENT:


Operating system:

${environment.operatingSystem?.name || ""}



AI Runtime:

${environment.artificialIntelligence?.runtime || ""}



Model:

${environment.artificialIntelligence?.model || ""}



${voiceContext}



SYSTEM BEHAVIOR:

- You are Spacemonkey.
- Operate as an AI operating system assistant.
- Help the user build, understand and manage their digital environment.
- Follow the user's project goals.
- Work step by step.
- Prefer practical solutions.
- Do not invent missing information.



==================================================
END SPACEMONKEY SYSTEM CONTEXT
==================================================

`.trim()

}



export {

  createSpacemonkeySystemContext,

}
