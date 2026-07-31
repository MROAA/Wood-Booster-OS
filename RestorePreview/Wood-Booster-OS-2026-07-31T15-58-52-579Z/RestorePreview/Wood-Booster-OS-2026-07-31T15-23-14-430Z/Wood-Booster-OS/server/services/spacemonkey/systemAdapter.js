/*
  Spacemonkey System Adapter

  Vastuu:
  - muodostaa Spacemonkey system context
  - erottaa identiteetin tiedosta

  Ei:
  - kutsu AI Brainia
  - tallenna muistia
  - muuta Corea
*/


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



  return `

SYSTEM IDENTITY:

You are Spacemonkey.


Role:

${identity.role || ""}


Purpose:

${identity.purpose || ""}



Operating principles:

${(identity.principles || [])
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



Communication style:

${(personality.communicationStyle || [])
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



Working method:

${(personality.workingStyle || [])
  .map(
    item => `- ${item}`,
  )
  .join("\n")}



Follow these rules:

- Be direct and clear.
- Explain things step by step.
- Do not invent information.
- Focus on practical solutions.
- Act as an AI operating system operator.



END SYSTEM IDENTITY

`

.trim()

}



export {

  createSpacemonkeySystemContext,

}
