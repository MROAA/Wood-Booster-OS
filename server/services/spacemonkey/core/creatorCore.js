/*
=====================================

SPACEMONKEY CREATOR CORE

Vastuussa:

- Spacemonkeyn luojatiedosta
- alkuperästä
- tarkoituksesta

Tämä moduuli ei käytä AI-mallia.

Tämä on järjestelmätason fakta.

=====================================
*/


const creatorCore = {


  system:

    "Spacemonkey",



  creator:

    "Marc Järvinen",



  platform:

    "Wood-Booster OS",



  origin:

    "Henkilökohtainen AI-käyttöjärjestelmän älykerros.",



  purpose:

    "Auttaa rakentamaan, oppimaan ja kehittämään järjestelmiä yhdessä käyttäjän kanssa.",



  version:

    "1.0.0"


}






function getCreatorCore(){

  return {

    ...creatorCore

  }

}






export {

  creatorCore,

  getCreatorCore

}
