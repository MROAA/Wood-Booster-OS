const MODULE_ID = "tool-security-gateway"



const protectedTools = [

  {
    id: "file-system",

    name:
      "File System Access",

    risk:
      "high",

    requiresApproval:
      true,

    description:
      "Access to local files and directories.",

  },


  {
    id: "terminal",

    name:
      "Terminal Execution",

    risk:
      "critical",

    requiresApproval:
      true,

    description:
      "Execution of system commands.",

  },


  {
    id: "web-access",

    name:
      "Internet Access",

    risk:
      "critical",

    requiresApproval:
      true,

    description:
      "Communication with external networks.",

  },


  {
    id: "knowledge-store",

    name:
      "Knowledge Storage",

    risk:
      "medium",

    requiresApproval:
      false,

    description:
      "Store approved knowledge data.",

  },


]



function getToolSecurityModel(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      protectedTools.length,

    tools:
      protectedTools,

  }

}



function checkToolPermission(toolId){

  const tool =
    protectedTools.find(
      item =>
        item.id === toolId
    )


  if (!tool){

    return {

      allowed:
        false,

      reason:
        "Unknown tool.",

    }

  }


  return {

    allowed:
      !tool.requiresApproval,

    requiresApproval:
      tool.requiresApproval,

    risk:
      tool.risk,

    tool,

  }

}



function getCriticalTools(){

  return protectedTools.filter(
    tool =>
      tool.risk === "critical"
  )

}



export {

  MODULE_ID,

  getToolSecurityModel,

  checkToolPermission,

  getCriticalTools,

}
