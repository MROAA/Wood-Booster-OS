/*
=====================================
WOOD-BOOSTER AI PLATFORM

SPACEMONKEY IDENTITY PROVIDER V1

Vastuut:

- yhdistää Spacemonkeyn identiteettikerroksen
- käyttää Creator Identity Provideria
- tarjoaa identiteetin Context Enginelle

Ei:

- kutsu LLM:ää
- kirjoita tietokantaan
- muuta AI Brain moduuleja

=====================================
*/


import {
  loadCreatorIdentity,
  createCreatorIdentityContext,
} from "./creator/creatorIdentityProvider.js"







async function loadSpacemonkeyIdentity(){


  const creatorIdentity =
    await loadCreatorIdentity()





  return {


    success:
      true,


    type:
      "spacemonkey_identity",


    name:
      "Spacemonkey",


    role:
      "AI Operator",


    creatorLoaded:
      creatorIdentity.success,


    creatorIdentity,


    context:

      createCreatorIdentityContext(
        creatorIdentity
      )


  }


}







function createSpacemonkeyIdentityContext(
  identity
){


  if(
    !identity ||
    !identity.context
  ){

    return ""

  }



  return [

    "IDENTITY: Spacemonkey",

    "ROLE: AI Operator",

    identity.context

  ]

  .join("\n\n")


}







export {

  loadSpacemonkeyIdentity,

  createSpacemonkeyIdentityContext

}
