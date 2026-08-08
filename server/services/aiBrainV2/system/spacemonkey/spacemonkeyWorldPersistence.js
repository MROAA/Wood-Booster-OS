import {
  ENTITY_TYPES,
  RELATION_TYPES,
} from "./spacemonkeyWorldModel.js"





async function createWorldEntity({

  prisma,

  name,

  type,

  description = "",

  metadata = {}

}) {


  if(!prisma){

    return null

  }



  const entity =

    await prisma.spacemonkeyWorldEntity.create({

      data:{

        name,

        type,

        description,

        metadata:
          JSON.stringify(
            metadata
          )

      }

    })



  return entity

}







async function createWorldRelation({

  prisma,

  fromEntityId,

  toEntityId,

  type,

  description = ""

}) {


  if(!prisma){

    return null

  }



  return await prisma.spacemonkeyWorldRelation.create({

    data:{

      fromEntityId,

      toEntityId,

      type,

      description

    }

  })

}







async function findWorldEntity({

  prisma,

  name

}) {


  if(!prisma){

    return null

  }



  return await prisma.spacemonkeyWorldEntity.findFirst({

    where:{

      name

    }

  })

}







async function getWorldEntities({

  prisma

}) {


  if(!prisma){

    return []

  }



  return await prisma.spacemonkeyWorldEntity.findMany({

    orderBy:{

      createdAt:
        "asc"

    }

  })

}







async function getWorldRelations({

  prisma

}) {


  if(!prisma){

    return []

  }



  return await prisma.spacemonkeyWorldRelation.findMany({

    include:{

      fromEntity:true,

      toEntity:true

    },


    orderBy:{

      createdAt:
        "asc"

    }

  })

}







async function buildPersistentWorldContext({

  prisma

}) {


  const entities =

    await getWorldEntities({

      prisma

    })



  const relations =

    await getWorldRelations({

      prisma

    })





  return {

    entities,

    relations

  }

}







async function initializePersistentWorld({

  prisma

}) {


  const existing =

    await getWorldEntities({

      prisma

    })



  if(existing.length > 0){

    return {

      initialized:false,

      reason:
        "World already initialized.",

      entities:
        existing.length

    }

  }





  const marc =

    await createWorldEntity({

      prisma,

      name:
        "Marc Järvinen",

      type:
        ENTITY_TYPES.PERSON,

      description:
        "Spacemonkeyn luoja."

    })





  const spacemonkey =

    await createWorldEntity({

      prisma,

      name:
        "Spacemonkey",

      type:
        ENTITY_TYPES.KNOWLEDGE,

      description:
        "Wood-Booster HQ:n älykkyysydin."

    })





  const os =

    await createWorldEntity({

      prisma,

      name:
        "Wood-Booster HQ",

      type:
        ENTITY_TYPES.PROJECT,

      description:
        "AI käyttöjärjestelmä."

    })





  await createWorldRelation({

    prisma,

    fromEntityId:
      spacemonkey.id,

    toEntityId:
      marc.id,

    type:
      RELATION_TYPES.CREATED_BY,

    description:
      "Spacemonkey on Marc Järvisen luoma."

  })





  await createWorldRelation({

    prisma,

    fromEntityId:
      spacemonkey.id,

    toEntityId:
      os.id,

    type:
      RELATION_TYPES.BELONGS_TO,

    description:
      "Spacemonkey kuuluu Wood-Booster HQ ympäristöön."

  })





  return {

    initialized:true,

    entities:3,

    relations:2

  }

}







export {

  createWorldEntity,

  createWorldRelation,

  findWorldEntity,

  getWorldEntities,

  getWorldRelations,

  buildPersistentWorldContext,

  initializePersistentWorld

}
