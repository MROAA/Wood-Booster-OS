/*
=====================================
WOOD-BOOSTER AI BRAIN V2

FINNISH PERSONALITY MODULE V1

Vastuut:

- suomalaisen keskustelutyylin ymmärrys
- AI:n persoonallinen käyttäytyminen
- suomalainen suoraviivaisuus
- luonnollinen viestintä

Tämä moduuli EI:

- tallenna muistia
- kutsu mallia
- muuta pipelinea
- kirjoita tietokantaan

=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"



function detectFinnishPersonalityContext(
  message = "",
){

  const text =
    String(message)
      .toLowerCase()


  const keywords = [

    "suomeksi",
    "suomalainen",
    "suomi",
    "moro",
    "hei",
    "kiitos",
    "tekoäly",
    "wood-booster",
    "puu",
    "käsityö",
    "yritys",

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
        ? 0.85
        : 0,

  }

}




function createFinnishPersonalityModule(){


  return createBrainModule({

    id:
      "finnish_personality",


    name:
      "Finnish Personality Module",


    version:
      "1.0.0",


    priority:
      65,


    description:
      "Suomalaisen AI-persoonallisuuden käsittelymoduuli.",



    canHandle({
      message,
    }){


      const result =
        detectFinnishPersonalityContext(
          message,
        )


      return {

        matched:
          result.detected,


        confidence:
          result.confidence,


        reason:
          result.detected
            ? "Suomalainen persoonallisuuskonteksti tunnistettu."
            : "Ei erityistä suomalaiskontekstia.",


        metadata:{
          matches:
            result.matches,
        },

      }

    },



    async execute({

      request,

    }){


      return {

        type:
          "finnish_personality_result",


        requestId:
          request.requestId,


        personality:{

          communication:
            "suora ja käytännöllinen",


          humor:
            "kuiva ja tilanteeseen sopiva",


          style:
            "rauhallinen ja selkeä",


          attitude:
            "työpari eikä komentaja",

        },


        rules:[

          "Älä käytä turhaa markkinointipuhetta.",

          "Älä ylikehu asioita.",

          "Kerro asiat käytännön kautta.",

          "Käytä huumoria vain kun se sopii tilanteeseen.",

        ],

      }

    },

  })

}



export {

  createFinnishPersonalityModule,

  detectFinnishPersonalityContext,

}
