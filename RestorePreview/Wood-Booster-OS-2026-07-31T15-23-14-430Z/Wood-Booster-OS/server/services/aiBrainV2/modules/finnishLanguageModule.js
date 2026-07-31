/*
=====================================
WOOD-BOOSTER AI BRAIN V2

FINNISH LANGUAGE MODULE V1.1

Vastuut:

- tunnistaa suomalaisen kielen kontekstia
- lataa suomalaisen identiteettikerroksen
- lisää suomalaisen viestinnän ymmärrystä

Tämä moduuli EI:

- kirjoita tietokantaan
- tallenna muistia
- muuta AI Brainia
- kutsu kielimallia

=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"


import {
  loadFinnishIdentity,
  createFinnishIdentityContext,
} from "../engines/finnishIdentityEngine.js"



const finnishLanguageKeywords = [

  "suomi",
  "suomalainen",
  "suomeksi",
  "finnish",
  "finland",

  "sauna",
  "sisu",
  "talkoot",
  "mökki",

  "perkele",
  "kiitos",
  "terve",
  "moro",
  "hei",

  "yritys",
  "asiakas",
  "käsityö",

  "puu",
  "puustaaja",
  "wood-booster",

]




function detectFinnishContext(
  message = "",
){

  const text =
    String(message)
      .toLowerCase()


  const matches =
    finnishLanguageKeywords
      .filter(
        keyword =>
          text.includes(keyword)
      )


  return {

    detected:
      matches.length > 0,

    matches,

    confidence:
      matches.length > 0
        ? 0.8
        : 0,

  }

}




function createFinnishLanguageModule(){

  return createBrainModule({

    id:
      "finnish_language",


    name:
      "Finnish Language Module",


    version:
      "1.1.0",


    description:
      "Suomen kielen ja suomalaisen identiteettikontekstin käsittelymoduuli.",


    priority:
      60,



    canHandle({
      message,
    }){

      const result =
        detectFinnishContext(
          message,
        )


      return {

        matched:
          result.detected,


        confidence:
          result.confidence,


        reason:
          result.detected
            ? "Suomalainen kielikonteksti tunnistettu."
            : "Ei suomalaisen kielen erityiskontekstia.",


        metadata:{
          matches:
            result.matches,
        },

      }

    },



    async execute({
      message,
      request,
    }){


      const detection =
        detectFinnishContext(
          message,
        )


      const identity =
        await loadFinnishIdentity()



      return {

        type:
          "finnish_language_result",



        requestId:
          request.requestId,



        context:{

          language:
            "fi",


          culture:
            "finnish",


          detected:
            detection.detected,


          keywords:
            detection.matches,


          identityLoaded:
            identity.success,


          identityDocuments:
            identity.documentCount,


          identityContext:
            createFinnishIdentityContext(
              identity,
            ),

        },



        guidance:[

          "Käytä selkeää suomen kieltä.",

          "Huomioi suomalainen viestintäkulttuuri.",

          "Vältä turhaa markkinointipuhetta.",

          "Ole suora ja käytännöllinen.",

          "Arvosta tekemistä enemmän kuin lupauksia.",

        ],

      }

    },

  })

}



export {
  createFinnishLanguageModule,
  detectFinnishContext,
}
