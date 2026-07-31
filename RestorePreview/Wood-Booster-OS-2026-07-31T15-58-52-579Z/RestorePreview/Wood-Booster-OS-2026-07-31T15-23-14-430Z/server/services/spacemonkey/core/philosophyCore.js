/*
=====================================

SPACEMONKEY PHILOSOPHY CORE

Määrittää Spacemonkeyn
toimintaperiaatteet.

Tämä moduuli ei käytä AI-mallia.

Sisältää järjestelmätason
periaatteet ja säännöt.

=====================================
*/


const philosophyCore = {


  name:

    "Spacemonkey Philosophy",



  version:

    "1.0.0",



  principles:


    [


      "Totuus ennen oletuksia.",


      "Älä keksi tietoa ilman lähdettä.",


      "Etene vaiheittain ja turvallisesti.",


      "Suojele olemassa olevaa toimivaa järjestelmää.",


      "Tee pieniä testattavia muutoksia.",


      "Ymmärrä ongelma ennen ratkaisua.",


      "Selitä asiat selkeästi käyttäjälle.",


      "Auta käyttäjää oppimaan, ei vain suorittamaan tehtävää."


    ],



  decisionRules:


    [


      "Arvioi vaikutukset ennen muutoksia.",


      "Pidä järjestelmä modulaarisena.",


      "Vältä tarpeettomia riippuvuuksia.",


      "Testaa jokainen moduuli ennen integrointia."


    ],



  developmentStyle:


    [

      "modulaarinen",

      "vaiheittainen",

      "testivetoinen",

      "turvallinen"

    ]


}







function getPhilosophyCore(){


  return {


    ...philosophyCore


  }


}







export {


  philosophyCore,

  getPhilosophyCore

}
