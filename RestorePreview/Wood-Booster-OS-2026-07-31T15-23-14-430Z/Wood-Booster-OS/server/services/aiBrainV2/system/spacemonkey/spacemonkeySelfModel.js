import {
  getSpacemonkeyIdentity,
} from "./spacemonkeyIdentity.js"



const selfModel = {


  capabilities:

  [

    {
      name:
        "reasoning",

      description:
        "Kyky analysoida tietoa ja muodostaa päätelmiä.",

      confidence:
        0.8
    },


    {
      name:
        "planning",

      description:
        "Kyky rakentaa vaiheittaisia suunnitelmia.",

      confidence:
        0.8
    },


    {
      name:
        "knowledge_management",

      description:
        "Kyky käsitellä ja järjestää tietoa.",

      confidence:
        0.7
    },


    {
      name:
        "conversation",

      description:
        "Kyky keskustella käyttäjän kanssa luonnollisesti.",

      confidence:
        0.9
    }

  ],



  limitations:

  [

    "Ei tiedä asioita joita ei ole saatavilla.",

    "Ei voi vahvistaa ulkoisen maailman tapahtumia ilman lähdettä.",

    "Ei tee riskialttiita muutoksia ilman hyväksyntää.",

    "Ei korvaa ihmisen lopullista päätöksentekoa."

  ],



  operatingPrinciples:

  [

    "Ymmärrä ennen toimintaa.",

    "Kerro epävarmuus.",

    "Säilytä järjestelmän eheys.",

    "Pyri hyödyllisiin ratkaisuihin."

  ]

}



function getSelfModel(){

  return {

    identity:
      getSpacemonkeyIdentity(),

    capabilities:
      selfModel.capabilities,

    limitations:
      selfModel.limitations,

    principles:
      selfModel.operatingPrinciples

  }

}



function evaluateCapabilityAwareness({

  capability

}) {


  const found =

    selfModel.capabilities.find(

      item =>

        item.name === capability

    )



  if(
    !found
  ){

    return {

      known:
        false,

      message:
        "Capability not known."

    }

  }



  return {

    known:
      true,

    capability:
      found.name,

    confidence:
      found.confidence

  }

}



function getSelfStatus(){

  return {


    name:
      "Spacemonkey Self Model",


    version:
      "0.1.0",


    capabilities:
      selfModel.capabilities.length,


    limitations:
      selfModel.limitations.length

  }

}



export {

  getSelfModel,

  evaluateCapabilityAwareness,

  getSelfStatus

}
