/*
=====================================

SPACEMONKEY IDENTITY BRIDGE

Yhdistää:

- identityQuestion.js
- identityResponse.js

Tarkoitus:

Tarjota yksi rajapinta
Spacemonkeyn identiteettikysymyksille.

AgentExecutor ei käsittele
identiteetin yksityiskohtia.

=====================================
*/


import {
  isIdentityQuestion
} from "./identityQuestion.js"



import {
  getIdentityResponse
} from "./identityResponse.js"







function handleIdentity(message){


  const matched =

    isIdentityQuestion(
      message
    )





  if(!matched){

    return {

      matched:
        false,


      response:
        null,


      data:
        null

    }

  }







  const identity =

    getIdentityResponse()





  return {


    matched:
      true,


    response:

      identity.response,


    data:

      identity

  }


}







export {

  handleIdentity

}
