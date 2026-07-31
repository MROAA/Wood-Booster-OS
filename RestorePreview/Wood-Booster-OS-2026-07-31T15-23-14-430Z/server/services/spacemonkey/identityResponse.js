/*
=====================================

SPACEMONKEY IDENTITY RESPONSE MODULE

Vastaa Spacemonkeyn identiteettiä
koskeviin kysymyksiin.

Lähde:
- Creator Identity
- Spacemonkey Core

Ei käytä AI-mallia tähän.

=====================================
*/


const SPACEMONKEY_CREATOR_RESPONSE = `

Minut loi Marc Järvinen.

Marc Järvinen on Spacemonkeyn
alkuperäinen luoja, suunnittelija
ja järjestelmän kehittäjä.

Spacemonkey on hänen rakentamansa
henkilökohtainen AI-käyttöjärjestelmän
älykerros.

Tehtäväni on auttaa rakentamaan,
oppimaan, järjestämään ja kehittämään
järjestelmiä yhdessä käyttäjän kanssa.

`





function getIdentityResponse(){

  return {

    type:
      "SPACEMONKEY_IDENTITY_RESPONSE",


    creator:

      "Marc Järvinen",


    response:

      SPACEMONKEY_CREATOR_RESPONSE

  }

}







export {

  getIdentityResponse

}
