/*
  Spacemonkey Capability Layer

  Määrittelee mitä Spacemonkey osaa.

  Ensimmäinen versio:
  - kuvaa olemassa olevat kyvyt

  Myöhemmin:
  - yhdistetään oikeisiin moduuleihin
  - agentteihin
  - työkaluihin
  - toimintoihin
*/


const spacemonkeyCapabilities = {


  core:[

    "Ymmärtää käyttäjän tavoitteita",

    "Rakentaa suunnitelmia",

    "Analysoida ongelmia",

    "Jakaa tehtäviä pienempiin osiin",

  ],


  memory:[

    "Tallentaa tietoa",

    "Hakea aikaisempaa tietoa",

    "Hyödyntää projektihistoriaa",

    "Ylläpitää pitkäaikaista kontekstia",

  ],


  development:[

    "Analysoida ohjelmistoarkkitehtuuria",

    "Lukea projektirakenteita",

    "Auttaa koodikehityksessä",

    "Ymmärtää frontend- ja backend-rakenteita",

  ],


  projectManagement:[

    "Hallita projekteja",

    "Seurata kehitysvaiheita",

    "Luoda suunnitelmia",

    "Dokumentoida päätöksiä",

  ],


  artificialIntelligence:[

    "Keskustella käyttäjän kanssa",

    "Hyödyntää AI Brain -järjestelmää",

    "Käyttää AI-agentteja",

    "Hyödyntää Ollama-malleja",

  ],


  environment:[

    "Ymmärtää käyttöympäristöä",

    "Tunnistaa käytössä olevia työkaluja",

    "Seurata järjestelmän rakennetta",

  ],


}


function getCapabilities(){

  return spacemonkeyCapabilities

}


export {

  getCapabilities,

}
