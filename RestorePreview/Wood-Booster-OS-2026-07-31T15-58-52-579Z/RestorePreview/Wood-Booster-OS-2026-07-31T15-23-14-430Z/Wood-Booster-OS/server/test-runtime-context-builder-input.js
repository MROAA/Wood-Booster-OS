/*
=====================================
RUNTIME CONTEXT BUILDER INPUT TEST

Testaa:

runtimeContextBuilder

ja miten se vastaanottaa:

memoryItems

=====================================
*/


import {
  buildRuntimeContext,
} from "./services/aiBrainV2/runtime/runtimeContextBuilder.js"



const result =
  await buildRuntimeContext({

    message:
      "Milloin Spacemonkey syntyi?",


    memoryItems: [

      {

        type:
          "memory",

        content:
          "Spacemonkey AI syntyi 24.07.2026.",

      },

    ],

  })



console.log(
  result,
)
