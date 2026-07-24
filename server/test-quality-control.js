import {
  validateAIResponse
} from "./services/aiQualityControl.js"



const result =
  validateAIResponse({

    answer:
      `
      Wood-Boosterin filosofia perustuu
      aitouteen, laatuun ja puun tarinaan.
      Yritys perustettiin vuonna 2020.
      `,


    knowledge:[

      {
        content:
          "Wood-Booster perustuu ajatukseen: Me jatkamme puun tarinaa. Aitous ja laatu ovat tärkeitä."
      }

    ],

    memories:[]

  })



console.log(result)