/*
=====================================
WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY MEMORY MODULE V1

Vastuut:

- tunnistaa Spacemonkeyn historiaan liittyvät asiat
- määrittelee AI:n omat kehitysmuistot
- erottaa AI-historian käyttäjämuistista

Tämä moduuli EI:

- kirjoita tietokantaan
- hyväksy muistoja
- muuta Memory Modulea
- kutsu kielimallia

=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"



function detectSpacemonkeyMemoryContext(
  message = "",
){

  const text =
    String(message)
      .toLowerCase()


  const keywords = [

    "spacemonkey",

    "syntyi",

    "syntymä",

    "alku",

    "historia",

    "kehitys",

    "oppia",

    "muistaa",

    "ensimmäinen",

    "ai",

  ]


  const matches =
    keywords.filter(
      keyword =>
        text.includes(keyword)
    )


  return {

    detected:
      matches.length > 0,


    matches,


    confidence:
      matches.length > 0
        ? 0.9
        : 0,

  }

}



function createSpacemonkeyMemoryModule(){

  return createBrainModule({

    id:
      "spacemonkey_memory",


    name:
      "Spacemonkey Memory Module",


    version:
      "1.0.0",


    priority:
      75,


    description:
      "Spacemonkey AI:n kehityshistorian muistikerros.",



    canHandle({

      message,

    }){


      const result =
        detectSpacemonkeyMemoryContext(
          message,
        )


      return {

        matched:
          result.detected,


        confidence:
          result.confidence,


        reason:
          result.detected
            ? "Spacemonkey historia- tai muistokonteksti tunnistettu."
            : "Ei Spacemonkey muistokontekstia.",


        metadata:{

          matches:
            result.matches,

        },

      }

    },



    async execute({

      request,

      message,

    }){


      return {

        type:
          "spacemonkey_memory_result",



        requestId:
          request.requestId,



        memoryType:

          "spacemonkey_history",



        detectedMessage:

          message,



        memoryRules:[

          "Spacemonkeyn historia säilytetään erillään käyttäjämuistista.",

          "Kehitysvaiheet dokumentoidaan pitkäjänteisesti.",

          "Tärkeät syntytapahtumat voidaan tallentaa pysyviksi muistoiksi.",

          "AI:n kehityshistoria muodostaa oman kokonaisuuden.",

        ],



        categories:[

          "birth",

          "identity",

          "development",

          "milestone",

        ],



      }

    },

  })

}



export {

  createSpacemonkeyMemoryModule,

  detectSpacemonkeyMemoryContext,

}
