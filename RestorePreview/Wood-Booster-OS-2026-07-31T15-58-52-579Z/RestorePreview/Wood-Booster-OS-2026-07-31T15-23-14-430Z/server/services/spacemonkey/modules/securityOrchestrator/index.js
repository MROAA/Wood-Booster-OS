const MODULE_ID = "security-orchestrator"



const securityComponents = [

  {
    id: "security-core",

    name:
      "Security Core",

    status:
      "active",

  },


  {
    id: "permission-awareness",

    name:
      "Permission Awareness",

    status:
      "active",

  },


  {
    id: "tool-security-gateway",

    name:
      "Tool Security Gateway",

    status:
      "active",

  },


  {
    id: "security-policy-engine",

    name:
      "Security Policy Engine",

    status:
      "active",

  },


  {
    id: "security-runtime-monitor",

    name:
      "Security Runtime Monitor",

    status:
      "active",

  },


]



function createSecurityOverview(){

  const activeCount =
    securityComponents.filter(
      component =>
        component.status === "active"
    ).length


  return {

    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),


    overallStatus:
      activeCount === securityComponents.length
        ? "healthy"
        : "attention-required",


    components:
      securityComponents,


    summary:

      {
        total:
          securityComponents.length,

        active:
          activeCount,

      },

  }

}



function getSecurityComponent(id){

  return securityComponents.find(
    component =>
      component.id === id
  ) || null

}



function getSecurityHealth(){

  const overview =
    createSecurityOverview()


  return {

    status:
      overview.overallStatus,

    checkedAt:
      overview.timestamp,

    activeComponents:
      overview.summary.active,

    totalComponents:
      overview.summary.total,

  }

}



export {

  MODULE_ID,

  createSecurityOverview,

  getSecurityComponent,

  getSecurityHealth,

}
