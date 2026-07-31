const MODULE_ID = "creator-context-export-gateway"



const exportsHistory = []



const exportTypes = [

  "agent-context",

  "tool-context",

  "api-context",

  "internal-context",

]



function createExport({

  requester,

  exportType,

  context,

  purpose,

}){

  if (
    !exportTypes.includes(exportType)
  ){

    return {

      success:
        false,

      reason:
        "Invalid export type.",

    }

  }



  const exportRecord = {

    id:
      `creator-export-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    requester,

    exportType,

    purpose,

    context,

    status:
      "created",

  }


  exportsHistory.push(
    exportRecord
  )


  return {

    success:
      true,

    export:
      exportRecord,

  }

}



function getExports(){

  return {

    moduleId:
      MODULE_ID,

    count:
      exportsHistory.length,

    exports:
      exportsHistory,

  }

}



function getExportTypes(){

  return {

    moduleId:
      MODULE_ID,

    types:
      exportTypes,

  }

}



function getLatestExports(){

  return exportsHistory.slice(-5)

}



export {

  MODULE_ID,

  createExport,

  getExports,

  getExportTypes,

  getLatestExports,

}
