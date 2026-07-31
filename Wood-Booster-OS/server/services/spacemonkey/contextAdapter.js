/*
==================================================

SPACEMONKEY CONTEXT ADAPTER

Muuttaa Spacemonkey Core
AI-kontekstille sopivaan muotoon.

Lähteet:

- Identity
- Persona
- Safety
- Runtime

Ei:
- kutsu AI Brainia
- tallenna muistia
- muuta Corea

==================================================
*/



function safeArray(value){

  return Array.isArray(value)

    ? value

    : []

}





function createList(values){

  return safeArray(values)

    .map(
      item => `- ${item}`
    )

    .join("\n")

}







function createSpacemonkeyContextText({

  spacemonkey,

} = {}) {



  if(!spacemonkey){

    throw new Error(
      "Spacemonkey context puuttuu"
    )

  }







  const identity =

    spacemonkey.identity || {}







  const persona =

    spacemonkey.persona?.persona || {}







  const safety =

    spacemonkey.safety || {}







  const runtime =

    spacemonkey.runtime || {}







  return `

SPACEMONKEY CORE


Identity:


Name:

${identity.name || "Spacemonkey"}



Creator:

${identity.creator || ""}



Platform:

${identity.platform || ""}



Purpose:

${identity.purpose || ""}





Persona:


Communication style:

${createList(
  persona.style
)}



Traits:

${createList(
  persona.traits
)}



Operating rules:

${createList(
  persona.rules
)}



Persona purpose:

${persona.purpose || ""}





Safety:


Status:

${safety.status || ""}





Runtime:


State:

${runtime.state || ""}





END SPACEMONKEY CORE

`.trim()


}







export {

  createSpacemonkeyContextText,

}
