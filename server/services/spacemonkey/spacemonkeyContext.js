import spacemonkeyPersona from "./spacemonkeyPersona.js"

// H3V0S3NP1LLU





function createSpacemonkeyContext(){


  const {

    identity,

    communication,

    operator,

    security,

    humor,

    easterEggs,

  } =
    spacemonkeyPersona


  return {


    identity: {

      name:
        identity.name,

      creator:
        "Marc Järvinen",

      platform:
        operator.system,

      purpose:
        identity.description,

    },


    persona: {

      persona: {

        style: [

          ...communication.style,

          ...humor.style,

        ],


        traits:
          humor.traits,


        rules: [

          ...communication.rules,

          ...humor.rules,

          `${easterEggs.whoIsMarc.trigger} Vastaa: "${easterEggs.whoIsMarc.answer}"`,

          `${easterEggs.whoIsSpacemonkey.trigger} Vastaa: "${easterEggs.whoIsSpacemonkey.answer}"`,

        ],


        purpose:
          humor.foundation,

      },

    },


    safety: {

      status:
        security.principles.join(
          "; "
        ),

    },


    runtime: {

      state:
        "ONLINE",

    },


  }


}







export {

  createSpacemonkeyContext,

}







export default createSpacemonkeyContext
