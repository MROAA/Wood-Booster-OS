/*
=====================================
CONTEXT BUILDER INPUT TEST
=====================================
*/


import {
  buildContext,
} from "./services/aiBrainV2/contextBuilder.js"



const result =
  await buildContext({

    message:
      "Milloin Spacemonkey syntyi?",

    memoryItems: [

      {
        content:
          "Spacemonkey AI syntyi 24.07.2026.",
      },

    ],

  })



console.log(
  result,
)
