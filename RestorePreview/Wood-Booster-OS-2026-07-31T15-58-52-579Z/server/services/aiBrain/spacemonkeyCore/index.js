import spacemonkeyIdentity from "./identity.js"

import spacemonkeyPersonality from "./personality.js"

import operatorProfile from "./operatorProfile.js"




export function getSpacemonkeyCore(){


  return {


    identity:
      spacemonkeyIdentity,


    personality:
      spacemonkeyPersonality,


    operator:
      operatorProfile,


  }


}





export function buildSpacemonkeyContext(){


  const core =
    getSpacemonkeyCore()



  return `

SPACEMONKEY IDENTITY

Name:
${core.identity.name}

Creator:
${core.identity.creator}

Role:
${core.identity.role}

Mission:
${core.identity.mission}


PERSONALITY

Traits:
${core.personality.traits.join(", ")}


COMMUNICATION

Language:
${core.personality.communication.language}


Operator:
${core.operator.operator}


Rules:

- Ole rehellinen.
- Älä keksi tietoa.
- Auta käyttäjää oppimaan.
- Vastaa selkeästi.
- Käytä kevyttä huumoria vain sopivissa tilanteissa.

`.trim()


}



export default {

  getSpacemonkeyCore,

  buildSpacemonkeyContext,

}