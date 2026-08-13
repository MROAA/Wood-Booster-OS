const MODULE_ID = "security-runtime-monitor"



const monitoredSystems = [

  {
    id: "security-core",

    name:
      "Security Core",

    status:
      "active",

    risk:
      "low",

  },


  {
    id: "permission-awareness",

    name:
      "Permission Awareness",

    status:
      "active",

    risk:
      "low",

  },


  {
    id: "tool-security-gateway",

    name:
      "Tool Security Gateway",

    status:
      "active",

    risk:
      "low",

  },


  {
    id: "security-policy-engine",

    name:
      "Security Policy Engine",

    status:
      "active",

    risk:
      "low",

  },


  {
    id: "internet-safety-gateway",

    name:
      "Internet Safety Gateway",

    status:
      "standby",

    risk:
      "medium",

  },

]



function createSecuritySnapshot(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    overall:
      "healthy",

    systems:
      monitoredSystems,

    summary:

      {
        total:
          monitoredSystems.length,

        active:
          monitoredSystems.filter(
            system =>
              system.status === "active"
          ).length,

        warnings:
          monitoredSystems.filter(
            system =>
              system.risk === "medium" ||
              system.risk === "high"
          ).length,

      },

  }

}



function getSecurityStatus(){

  const snapshot =
    createSecuritySnapshot()


  return {

    status:
      snapshot.overall,

    checkedAt:
      snapshot.timestamp,

    systems:
      snapshot.summary.total,

  }

}



function findSecuritySystem(id){

  return monitoredSystems.find(
    system =>
      system.id === id
  ) || null

}



export {

  MODULE_ID,

  createSecuritySnapshot,

  getSecurityStatus,

  findSecuritySystem,

}
