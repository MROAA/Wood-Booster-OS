const MODULE_ID = "security-sandbox-awareness"



const environments = [

  {
    id: "core-system",

    name:
      "Core System",

    risk:
      "critical",

    access:
      "restricted",

    description:
      "Stable system core requiring maximum protection.",

  },


  {
    id: "sandbox",

    name:
      "Sandbox Environment",

    risk:
      "low",

    access:
      "allowed",

    description:
      "Safe isolated environment for testing and experiments.",

  },


  {
    id: "external-world",

    name:
      "External World",

    risk:
      "critical",

    access:
      "controlled",

    description:
      "External services, internet and unknown environments.",

  },


]



function getSandboxModel(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      environments.length,

    environments,

  }

}



function findEnvironment(id){

  return environments.find(
    environment =>
      environment.id === id
  ) || null

}



function evaluateEnvironmentAccess(id){

  const environment =
    findEnvironment(id)


  if (!environment){

    return {

      allowed:
        false,

      reason:
        "Unknown environment.",

    }

  }


  return {

    environment:
      environment.name,

    risk:
      environment.risk,

    access:
      environment.access,

  }

}



function getCriticalEnvironments(){

  return environments.filter(
    environment =>
      environment.risk === "critical"
  )

}



export {

  MODULE_ID,

  getSandboxModel,

  findEnvironment,

  evaluateEnvironmentAccess,

  getCriticalEnvironments,

}
