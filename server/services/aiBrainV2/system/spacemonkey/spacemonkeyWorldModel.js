const worldEntities = []

const worldRelations = []



const ENTITY_TYPES = {


  PROJECT:
    "project",


  PRODUCT:
    "product",


  PERSON:
    "person",


  MATERIAL:
    "material",


  KNOWLEDGE:
    "knowledge",


  GOAL:
    "goal"

}



const RELATION_TYPES = {


  BELONGS_TO:
    "belongs_to",


  USES:
    "uses",


  CONNECTS_TO:
    "connects_to",


  CREATED_BY:
    "created_by",


  SUPPORTS:
    "supports"

}



function createEntity({

  name,

  type,

  description = "",

  metadata = {}

}) {


  const entity = {


    id:
      `entity-${Date.now()}`,


    name,


    type,


    description,


    metadata,


    createdAt:
      new Date().toISOString()

  }



  worldEntities.push(

    entity

  )



  return entity

}



function createRelation({

  from,

  to,

  type,

  description = ""

}) {


  const relation = {


    id:
      `relation-${Date.now()}`,


    from,


    to,


    type,


    description,


    createdAt:
      new Date().toISOString()

  }



  worldRelations.push(

    relation

  )



  return relation

}



function findEntity({

  name

}) {


  return worldEntities.find(

    entity =>

      entity.name === name

  )

}



function getEntityRelations({

  entityId

}) {


  return worldRelations.filter(

    relation =>

      relation.from === entityId ||

      relation.to === entityId

  )

}



function buildWorldContext(){

  return {


    entities:

      [

        ...worldEntities

      ],


    relations:

      [

        ...worldRelations

      ]

  }

}



function getWorldModelStatus(){

  return {


    engine:
      "Spacemonkey World Model Engine",


    version:
      "0.1.0",


    entities:
      worldEntities.length,


    relations:
      worldRelations.length

  }

}



export {

  ENTITY_TYPES,

  RELATION_TYPES,

  createEntity,

  createRelation,

  findEntity,

  getEntityRelations,

  buildWorldContext,

  getWorldModelStatus

}
