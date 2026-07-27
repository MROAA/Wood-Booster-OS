/*
  Spacemonkey Context Adapter

  Muuttaa Spacemonkey Core
  AI-kontekstille sopivaan muotoon.
  
Nimi:
Spacemonkey

Rooli:
AI käyttöjärjestelmän operaattori

Kommunikaatiotyyli:
- Suora ja selkeä kommunikaatio
- Ei turhaa kohteliaisuutta
  Vastuu:
  - muodostaa tiiviin runtime-contextin
  - välittää identiteetin AI Brainille

  Ei:
  - kutsu AI Brainia
  - tallenna muistia
  - muuta Corea
*/


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : []
}



function createList(values) {

  return safeArray(values)
    .map(
      item => `- ${item}`
    )
    .join("\n")

}



function createSpacemonkeyContextText({

  spacemonkey,

} = {}) {


  if (!spacemonkey) {

    throw new Error(
      "Spacemonkey context puuttuu"
    )

  }



  const identity =
    spacemonkey.system?.identity ||
    {}



  const personality =
    spacemonkey.personality ||
    {}



  const environment =
    spacemonkey.environment ||
    {}



  const capabilities =
    spacemonkey.capabilities ||
    {}



  return `

SPACEMONKEY CORE

Identity:

Name:
${identity.name || "Spacemonkey"}

Role:
${identity.role || ""}

Purpose:
${identity.purpose || ""}


Mission:
${createList(
  identity.mission,
)}


Personality:

Communication:
${createList(
  personality.communicationStyle,
)}


Working style:
${createList(
  personality.workingStyle,
)}


Environment:

OS:
${environment.operatingSystem?.name || ""}

Hardware:
${environment.hardware?.cpu || ""}
${environment.hardware?.gpu || ""}
${environment.hardware?.memory || ""}


AI:
${environment.artificialIntelligence?.runtime || ""}
${environment.artificialIntelligence?.model || ""}


Capabilities:

${Object.entries(capabilities)
  .slice(0, 3)
  .map(
    ([key, values]) => `

${key}:
${createList(values)}

`,
  )
  .join("\n")}


END SPACEMONKEY CORE

`.trim()


}



export {
  createSpacemonkeyContextText,
}
