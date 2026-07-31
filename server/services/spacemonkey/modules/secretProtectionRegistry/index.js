const MODULE_ID = "secret-protection-registry"



const secretRegistry = [

  {
    id:
      "protected-term-primary",

    name:
      "Primary Protected Term",

    level:
      "critical",

    action:
      "location-search-only",

    description:
      "Protected information may only be located, never exposed.",

  },


  {
    id:
      "protected-term-secondary",

    name:
      "Secondary Protected Term",

    level:
      "critical",

    action:
      "location-search-only",

    description:
      "Protected information may only be located, never exposed.",

  },

]



function getSecretRegistry(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      secretRegistry.length,

    secrets:
      secretRegistry,

  }

}



function findSecretPolicy(id){

  return secretRegistry.find(
    secret =>
      secret.id === id
  ) || null

}



function getCriticalSecrets(){

  return secretRegistry.filter(
    secret =>
      secret.level === "critical"
  )

}



export {

  MODULE_ID,

  getSecretRegistry,

  findSecretPolicy,

  getCriticalSecrets,

}
