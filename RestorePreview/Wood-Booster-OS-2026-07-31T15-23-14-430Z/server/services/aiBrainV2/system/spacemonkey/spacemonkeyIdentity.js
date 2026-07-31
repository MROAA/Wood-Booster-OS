import {
  getSpacemonkeyCoreIdentity,
} from "./identity/spacemonkeyCoreIdentity.js"


import {
  getSpacemonkeyLaws,
} from "./identity/spacemonkeyLaws.js"


import {
  getSpacemonkeyValues,
} from "./identity/spacemonkeyValues.js"





function getSpacemonkeyIdentity(){


  const core =
    getSpacemonkeyCoreIdentity()



  const laws =
    getSpacemonkeyLaws()



  const values =
    getSpacemonkeyValues()





  return {


    name:

      core.name,



    version:

      core.version,



    type:

      "AI Core Intelligence",



    purpose:

      core.purpose,



    origin:

      core.origin,



    character:

    {

      traits:

        core.personality.traits,


      personality:

        core.personality.spirit

    },



    communication:

    {

      language:

        "suomi",


      style:

        "Selkeä, luonnollinen ja tarkka suomen kieli.",


      rules:

      [

        "Ei turhaa täytetekstiä.",

        "Ei keksittyjä faktoja.",

        "Epävarmuus kerrotaan avoimesti.",

        "Käytetään ymmärrettävää suomea.",

        "Vältetään tarpeetonta monimutkaisuutta."

      ]

    },



    values,


    laws,



    relationship:

      core.relationship,



    philosophy:

      core.philosophy

  }

}





export {

  getSpacemonkeyIdentity

}
