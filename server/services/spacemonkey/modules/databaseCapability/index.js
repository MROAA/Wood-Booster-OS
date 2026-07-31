const MODULE_ID = "database-capability"



const databaseKnowledge = [

  {
    id: "database-fundamentals",

    name:
      "Database Fundamentals",

    category:
      "database",

    level:
      "foundation",

    description:
      "Understanding database concepts, storage and data organization.",

  },


  {
    id: "sql",

    name:
      "SQL",

    category:
      "database",

    level:
      "advanced",

    description:
      "Understanding relational database queries and data operations.",

  },


  {
    id: "data-modeling",

    name:
      "Data Modeling",

    category:
      "architecture",

    level:
      "advanced",

    description:
      "Understanding entities, relations and database structures.",

  },


  {
    id: "migrations",

    name:
      "Database Migrations",

    category:
      "development",

    level:
      "intermediate",

    description:
      "Understanding controlled database schema evolution.",

  },


  {
    id: "orm",

    name:
      "ORM Systems",

    category:
      "development",

    level:
      "advanced",

    description:
      "Understanding object relational mapping patterns.",

  },


  {
    id: "database-security",

    name:
      "Database Security",

    category:
      "security",

    level:
      "advanced",

    description:
      "Understanding access control, protection and safe data handling.",

  },

]



function getDatabaseCapability(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      databaseKnowledge.length,

    capabilities:
      databaseKnowledge,

  }

}



function findDatabaseCapability(id){

  return databaseKnowledge.find(
    item =>
      item.id === id
  ) || null

}



function getCapabilitiesByCategory(category){

  return databaseKnowledge.filter(
    item =>
      item.category === category
  )

}



export {

  MODULE_ID,

  getDatabaseCapability,

  findDatabaseCapability,

  getCapabilitiesByCategory,

}
