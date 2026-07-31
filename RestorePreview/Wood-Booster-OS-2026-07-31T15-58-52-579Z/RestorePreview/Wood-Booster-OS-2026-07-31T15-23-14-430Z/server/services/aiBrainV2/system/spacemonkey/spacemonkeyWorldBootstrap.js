import {
  createEntity,
  createRelation,
  ENTITY_TYPES,
  RELATION_TYPES,
} from "./spacemonkeyWorldModel.js"





function initializeSpacemonkeyWorld(){


  const marc =

    createEntity({

      name:
        "Marc Järvinen",

      type:
        ENTITY_TYPES.PERSON,

      description:
        "Spacemonkeyn luoja ja Wood-Booster OS järjestelmän rakentaja."

    })





  const spacemonkey =

    createEntity({

      name:
        "Spacemonkey",

      type:
        ENTITY_TYPES.KNOWLEDGE,

      description:
        "Wood-Booster OS:n älykkyysydin."

    })





  const woodBoosterOS =

    createEntity({

      name:
        "Wood-Booster OS",

      type:
        ENTITY_TYPES.PROJECT,

      description:
        "Paikallinen AI käyttöjärjestelmä ja kehitysympäristö."

    })





  const woodBoosterAI =

    createEntity({

      name:
        "Wood-Booster AI",

      type:
        ENTITY_TYPES.PROJECT,

      description:
        "AI-järjestelmä, jonka ympärille Spacemonkey rakennetaan."

    })







  createRelation({

    from:
      spacemonkey.id,

    to:
      marc.id,

    type:
      RELATION_TYPES.CREATED_BY,

    description:
      "Spacemonkey on Marc Järvisen luoma."

  })







  createRelation({

    from:
      spacemonkey.id,

    to:
      woodBoosterOS.id,

    type:
      RELATION_TYPES.BELONGS_TO,

    description:
      "Spacemonkey toimii Wood-Booster OS ympäristössä."

  })







  createRelation({

    from:
      woodBoosterOS.id,

    to:
      woodBoosterAI.id,

    type:
      RELATION_TYPES.SUPPORTS,

    description:
      "Wood-Booster OS tukee Wood-Booster AI kehitystä."

  })







  return {

    system:
      "Spacemonkey World Bootstrap",


    version:
      "1.0.0",


    created:

    {

      entities:
        4,


      relations:
        3

    }

  }


}







export {

  initializeSpacemonkeyWorld

}
