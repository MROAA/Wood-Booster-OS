const MODULE_ID = "permission-awareness"



const permissions = [

  {
    id: "knowledge-read",

    name:
      "Knowledge Read",

    category:
      "read",

    risk:
      "low",

    description:
      "Allows reading knowledge sources.",

    approval:
      false,

  },


  {
    id: "memory-write",

    name:
      "Memory Write",

    category:
      "write",

    risk:
      "medium",

    description:
      "Allows storing approved information into memory.",

    approval:
      true,

  },


  {
    id: "system-inspection",

    name:
      "System Inspection",

    category:
      "system",

    risk:
      "medium",

    description:
      "Allows inspecting system state.",

    approval:
      false,

  },


  {
    id: "file-modification",

    name:
      "File Modification",

    category:
      "system",

    risk:
      "high",

    description:
      "Allows modifying system files.",

    approval:
      true,

  },


  {
    id: "external-network-access",

    name:
      "External Network Access",

    category:
      "network",

    risk:
      "critical",

    description:
      "Allows communication with external networks.",

    approval:
      true,

  },


]



function getPermissionModel(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      permissions.length,

    permissions,

  }

}



function findPermission(id){

  return permissions.find(
    permission =>
      permission.id === id
  ) || null

}



function getHighRiskPermissions(){

  return permissions.filter(
    permission =>
      permission.risk === "high" ||
      permission.risk === "critical"
  )

}



export {

  MODULE_ID,

  getPermissionModel,

  findPermission,

  getHighRiskPermissions,

}
