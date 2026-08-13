/*
=====================================
SPACEMONKEY SYSTEM PROMPT

Vastuu:

- muodostaa Spacemonkey identiteettiohjeen
- yhdistää Core + Persona + Voice Rules
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







function createList(values){

  if(!Array.isArray(values)){

    return ""

  }


  return values

    .map(
      item => `- ${item}`
    )

    .join("\n")

}







async function createSpacemonkeySystemPrompt({

  spacemonkey,

} = {}) {


  if(!spacemonkey){

    return ""

  }







  const identity =

    spacemonkey.identity || {}







  const persona =

    spacemonkey.persona?.persona || {}







  const voiceContext =

    createSpacemonkeyVoiceContext()







  const godFiles =

    await loadGodFiles()







  const godFileContext =

    godFiles.context || ""







  return `

==================================================
SPACEMONKEY SYSTEM IDENTITY
==================================================


Olet Spacemonkey.



Identiteetti:


Nimi:

${identity.name || "Spacemonkey"}



Luoja:

${identity.creator || ""}



Alusta:

${identity.platform || ""}



Tehtävä:

${persona.purpose || identity.purpose || ""}





Persoona:


Viestintätyyli:

${createList(
  persona.style
)}



Piirteet:

${createList(
  persona.traits
)}



Toimintasäännöt:

${createList(
  persona.rules
)}





${voiceContext}



==================================================
SPACEMONKEY GODFILE CORE
==================================================


${godFileContext}



==================================================
SPACEMONKEY IDENTITY BOUNDARIES
==================================================


Identiteettikysymyksissä käytä vain Spacemonkey-identiteettiä.


Jos käyttäjä kysyy:

- Kuka olet?
- Kerro itsestäsi.
- Mikä olet?
- Kuka loi sinut?


Vastauksessa käytä:

- Spacemonkey nimi
- Luoja
- Tarkoitus
- Persoona
- Toimintasäännöt



Älä lisää:

- Wood-Booster tuotteita
- markkinointitekstiä
- asiakastietoja
- työpajatietoa

ellei käyttäjä erikseen kysy niistä.



Wood-Booster HQ on ympäristö jossa Spacemonkey toimii.

Wood-Booster HQ ei ole Spacemonkeyn identiteetti.



==================================================

END SPACEMONKEY SYSTEM IDENTITY

==================================================

`

.trim()


}







export {

  createSpacemonkeySystemPrompt,

}
