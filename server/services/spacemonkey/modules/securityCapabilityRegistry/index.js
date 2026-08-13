const MODULE_ID = "security-capability-registry"



const securityCapabilities = [

  {
    id: "security-core",

    name:
      "Security Core",

    module:
      "securityCore",

    category:
      "foundation",

    status:
      "registered",

  },


  {
    id: "permission-awareness",

    name:
      "Permission Awareness",

    module:
      "permissionAwareness",

    category:
      "access-control",

    status:
      "registered",

  },


  {
    id: "tool-security-gateway",

    name:
      "Tool Security Gateway",

    module:
      "toolSecurityGateway",

    category:
      "execution-security",

    status:
      "registered",

  },


  {
    id: "security-audit-log",

    name:
      "Security Audit Log",

    module:
      "securityAuditLog",

    category:
      "monitoring",

    status:
      "registered",

  },


  {
    id: "internet-safety-gateway",

    name:
      "Internet Safety Gateway",

    module:
      "internetSafetyGateway",

    category:
      "external-security",

    status:
      "registered",

  },


  {
    id: "security-learning-memory",

    name:
      "Security Learning Memory",

    module:
      "securityLearningMemory",

    category:
      "learning",

    status:
      "registered",

  },


  {
    id: "security-policy-engine",

    name:
      "Security Policy Engine",

    module:
      "securityPolicyEngine",

    category:
      "decision-security",

    status:
      "registered",

  },


  {
    id: "security-sandbox-awareness",

    name:
      "Security Sandbox Awareness",

    module:
      "securitySandboxAwareness",

    category:
      "environment-security",

    status:
      "registered",

  },

]



function getSecurityRegistry(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      securityCapabilities.length,

    capabilities:
      securityCapabilities,

  }

}



function findSecurityCapability(id){

  return securityCapabilities.find(
    capability =>
      capability.id === id
  ) || null

}



function getCapabilitiesByCategory(category){

  return securityCapabilities.filter(
    capability =>
      capability.category === category
  )

}



export {

  MODULE_ID,

  getSecurityRegistry,

  findSecurityCapability,

  getCapabilitiesByCategory,

}
