/*
  Spacemonkey Runtime Layer

  Rakentaa reaaliaikaisen
  käyttötilan AI Brainille.

  Vastuu:
  - yhdistää Spacemonkey Context
  - muodostaa System Context
  - lisätä runtime-tietoja

  Ei:
  - kutsu AI Brainia
  - suorita toimintoja
  - käsittele muistia

*/


import {
  createSpacemonkeyContext,
} from "./context.js"


import {
  createSpacemonkeySystemContext,
} from "./systemContextAdapter.js"



function createSpacemonkeyRuntime({

  userMessage = "",

  memory = null,

  conversation = [],

} = {}){


  const context =
    createSpacemonkeyContext()



  const systemContext =
    createSpacemonkeySystemContext({

      spacemonkey:
        context,

    })



  return {


    spacemonkey:
      context,


    systemContext,


    runtime: {

      userMessage,


      memory,


      conversation,


      timestamp:
        new Date().toISOString(),

    },


    source:
      "spacemonkey-runtime",


  }


}



export {

  createSpacemonkeyRuntime,

}
