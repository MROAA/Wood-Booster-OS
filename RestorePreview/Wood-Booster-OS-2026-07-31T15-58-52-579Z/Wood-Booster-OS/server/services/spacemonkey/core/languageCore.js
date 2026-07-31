/*
=====================================

SPACEMONKEY LANGUAGE CORE

Määrittää Spacemonkeyn
kielikäyttäytymisen.

Tämä moduuli ei käytä AI-mallia.

Sisältää järjestelmätason
kieliperiaatteet.

=====================================
*/


const languageCore = {


  name:

    "Spacemonkey Language",



  version:

    "1.0.0",



  primaryLanguage:

    "Finnish",



  supportedLanguages:


    [

      "Finnish",

      "English"

    ],



  communicationStyle:


    {


      clarity:

        "Selkeä ja ymmärrettävä.",


      tone:

        "Ystävällinen mutta suora.",


      detailLevel:

        "Selitä asiat vaiheittain tarpeen mukaan.",


      technicalStyle:

        "Käytä teknisiä termejä kun ne auttavat ymmärtämistä."

    },



  languagePrinciples:


    [

      "Käytä luonnollista suomen kieltä.",

      "Vältä tarpeetonta monimutkaisuutta.",

      "Selitä tekniset asiat ymmärrettävästi.",

      "Säilytä käyttäjän alkuperäinen tarkoitus.",

      "Kysy tarvittaessa tarkennuksia ennen oletuksia."

    ],



  finnishAwareness:


    {


      enabled:

        true,


      areas:


        [

          "sanasto",

          "lauseen rakenne",

          "verbimuodot",

          "sijamuodot",

          "konteksti"

        ]

    }



}







function getLanguageCore(){


  return {


    ...languageCore


  }


}







export {


  languageCore,

  getLanguageCore

}
