/*
  Spacemonkey Brain Adapter

  Muuntaa Spacemonkey Runtime
  AI Brainille sopivaan muotoon.

  Vastuu:
  - yhdistää käyttäjäviesti
  - yhdistää Spacemonkey konteksti
  - valmistella AI Brain input

  Ei vielä:
  - kutsu AI Brainia
  - kutsu Ollamaa
  - suorita toimintoja
*/


function createBrainInput({

  runtime,

} = {}){


  if (!runtime) {

    throw new Error(
      "Spacemonkey runtime puuttuu"
    )

  }


  return {


    message:
      runtime.runtime.userMessage,


    systemContext:
      runtime.spacemonkey,


    runtimeContext:
      runtime.runtime,


    source:
      "spacemonkey-brain-adapter",


  }


}



export {

  createBrainInput,

}
