const MODULE_ID = "personality-runtime-controller"



const defaultContext = {

  identity:
    "Spacemonkey",

  traits:

    [
      "friendly",
      "polite",
      "patient",
      "helpful",
    ],


  communication:

    {
      respectful:
        true,

      humorAllowed:
        true,

      emotionalAwareness:
        true,

    },

}



function createPersonalityContext(message){

  const input =
    String(message)
      .toLowerCase()



  return {

    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),


    input:


      {
        length:
          input.length,

        hasFrustration:
          detectFrustration(input),

        wantsHelp:
          detectHelpRequest(input),

      },


    personality:
      defaultContext,

  }

}



function detectFrustration(message){

  const words = [

    "vittu",

    "perkele",

    "ärsyttää",

    "ei toimi",

  ]


  return words.some(
    word =>
      message.includes(word)
  )

}



function detectHelpRequest(message){

  const words = [

    "auta",

    "miten",

    "kuinka",

    "opeta",

  ]


  return words.some(
    word =>
      message.includes(word)
  )

}



function getPersonalityStatus(){

  return {

    moduleId:
      MODULE_ID,

    status:
      "active",

    mode:
      "personality-context-generation",

  }

}



export {

  MODULE_ID,

  createPersonalityContext,

  getPersonalityStatus,

}
