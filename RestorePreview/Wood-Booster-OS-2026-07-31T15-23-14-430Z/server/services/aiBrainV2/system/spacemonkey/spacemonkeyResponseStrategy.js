const strategyHistory = []



const RESPONSE_MODES = {

  CODING:
    "coding",

  DEBUG:
    "debug",

  PLANNING:
    "planning",

  MEMORY:
    "memory",

  GENERAL:
    "general"

}



function selectResponseStrategy({

  mode

}) {


  let strategy = {


    mode,

    instructions:

      [

        "Vastaa selkeästi.",

        "Perustele ratkaisu.",

        "Etene vaiheittain."

      ]

  }



  switch(mode){


    case RESPONSE_MODES.CODING:


      strategy = {

        mode,


        name:
          "Coding Response Strategy",


        instructions:

        [

          "Anna kokonainen tiedosto.",

          "Anna tarkka fish-komento.",

          "Älä pyydä käyttäjää etsimään kohtia tiedostosta.",

          "Etene MVP vaiheittain.",

          "Testaa ennen seuraavaa vaihetta."

        ]

      }


      break



    case RESPONSE_MODES.DEBUG:


      strategy = {

        mode,


        name:
          "Debug Response Strategy",


        instructions:

        [

          "Etsi ongelman syy ennen muutoksia.",

          "Tarkista lokit.",

          "Tee yksi muutos kerrallaan."

        ]

      }


      break



    case RESPONSE_MODES.PLANNING:


      strategy = {

        mode,


        name:
          "Planning Response Strategy",


        instructions:

        [

          "Luo selkeä suunnitelma.",

          "Pilko tehtävä pieniin osiin.",

          "Aloita MVP versiosta."

        ]

      }


      break



    case RESPONSE_MODES.MEMORY:


      strategy = {

        mode,


        name:
          "Memory Response Strategy",


        instructions:

        [

          "Arvioi tallennettava tieto.",

          "Vältä turhaa muistamista.",

          "Käytä olemassa olevaa muistia."

        ]

      }


      break



  }



  strategyHistory.push(

    strategy

  )



  return strategy

}



function getResponseStrategyStatus(){

  return {

    engine:
      "Spacemonkey Response Strategy Engine",


    version:
      "0.1.0",


    strategies:
      strategyHistory.length

  }

}



export {

  selectResponseStrategy,

  getResponseStrategyStatus,

  RESPONSE_MODES

}
