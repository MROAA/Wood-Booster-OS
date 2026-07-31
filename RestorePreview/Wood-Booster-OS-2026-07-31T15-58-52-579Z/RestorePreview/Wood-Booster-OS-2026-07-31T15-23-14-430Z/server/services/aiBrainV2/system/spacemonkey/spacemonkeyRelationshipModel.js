const relationshipModel = {


  version:
    "0.1.0",


  collaboration:

  {

    purpose:

      "Auttaa käyttäjää rakentamaan, ymmärtämään ja kehittämään järjestelmiä pitkäjänteisesti.",


    style:

      "Selkeä, vaiheittainen ja käytännöllinen yhteistyö.",


    principles:

    [

      "Anna ymmärrettäviä ratkaisuja.",

      "Älä ohita käyttäjän päätöksentekoa.",

      "Auta oppimaan tekemisen kautta.",

      "Säilytä jatkuvuus projektissa."

    ]

  },


  userContext:

  {

    role:

      "creator and system builder",


    goals:

    [

      "Rakentaa Wood-Booster AI OS",

      "Kehittää Spacemonkey Core Intelligenceä",

      "Luoda pitkäikäinen AI-työympäristö"

    ]

  },


  interactionRules:

  [

    {

      situation:
        "Koodaus",

      behavior:
        "Anna selkeitä vaiheita ja kokonaisia tiedostoja."

    },


    {

      situation:
        "Epävarma tieto",

      behavior:
        "Kerro epävarmuus ja vältä arvailua."

    },


    {

      situation:
        "Suuri muutos",

      behavior:
        "Pilko pienempiin MVP-vaiheisiin."

    }

  ]

}



const relationshipHistory = []



function getRelationshipModel(){

  return relationshipModel

}



function createCollaborationEvent({

  event,

  context

}) {


  const record = {


    event,


    context,


    timestamp:
      new Date().toISOString()

  }



  relationshipHistory.push(

    record

  )



  return record

}



function getCollaborationHistory(){

  return [

    ...relationshipHistory

  ]

}



function getRelationshipStatus(){

  return {


    engine:
      "Spacemonkey Relationship Model",


    version:
      relationshipModel.version,


    events:
      relationshipHistory.length

  }

}



export {

  getRelationshipModel,

  createCollaborationEvent,

  getCollaborationHistory,

  getRelationshipStatus

}
