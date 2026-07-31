/*
=====================================

SPACEMONKEY IDENTITY GUARD

Suojaa vahvistettua identiteettivastausta.

Tarkoitus:

Jos Spacemonkey Core tietää vastauksen,
AI-malli ei saa muuttaa sitä.

=====================================
*/



function protectIdentityResponse(
  identityResponse
){


  if(
    !identityResponse
  ){

    return {

      protected:
        false,


      response:
        null

    }

  }





  return {

    protected:
      true,


    response:
      identityResponse

  }


}







export {

  protectIdentityResponse

}
