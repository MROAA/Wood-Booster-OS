/*
=====================================

SPACEMONKEY IDENTITY RESPONSE MODULE

Vastaa Spacemonkeyn identiteettiä
koskeviin kysymyksiin.

Lähde:
- spacemonkey_identity.json (kanoninen identiteetti)

Ei käytä AI-mallia tähän.

=====================================
*/


import {
  getCanonicalIdentity
} from "../aiBrainV2/system/spacemonkey/identity/getCanonicalIdentity.js"





function getIdentityResponse(){

  const identity =

    getCanonicalIdentity()


  return {

    type:
      "SPACEMONKEY_IDENTITY_RESPONSE",


    creator:

      identity.creator,


    response:

      identity.statement

  }

}







export {

  getIdentityResponse

}
