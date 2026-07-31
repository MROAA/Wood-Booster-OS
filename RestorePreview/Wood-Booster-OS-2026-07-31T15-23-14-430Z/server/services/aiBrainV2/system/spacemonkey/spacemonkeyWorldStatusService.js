import {
  getWorldEntities,
  getWorldRelations,
} from "./spacemonkeyWorldPersistence.js"







async function getSpacemonkeyWorldStatus({

  prisma,

} = {}){


  const entities =

    await getWorldEntities({

      prisma

    })





  const relations =

    await getWorldRelations({

      prisma

    })







  return {


    engine:

      "Spacemonkey Persistent World Model",



    version:

      "1.0.0",



    persistent:

      true,



    entities:

      entities.length,



    relations:

      relations.length,



    lastUpdated:

      new Date().toISOString()

  }

}







export {

  getSpacemonkeyWorldStatus

}
