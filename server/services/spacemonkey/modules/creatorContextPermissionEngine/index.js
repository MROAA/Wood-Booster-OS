const MODULE_ID = "creator-context-permission-engine"



const permissions = [

  {
    requester:
      "personality-runtime",

    allowed:

      [
        "creator-philosophy",
        "development-principles",
        "vision",
      ],

  },


  {
    requester:
      "reflection-engine",

    allowed:

      [
        "lessons",
        "patterns",
        "decisions",
      ],

  },

]



const permissionEvents = []



function checkPermission({

  requester,

  requestedData,

}){

  const rule =
    permissions.find(
      item =>
        item.requester === requester
    )


  if (!rule){

    const denied = {

      allowed:
        false,

      reason:
        "Unknown requester.",

    }


    permissionEvents.push({

      requester,

      requestedData,

      result:
        "denied",

      timestamp:
        new Date().toISOString(),

    })


    return denied

  }



  const allowedData =
    requestedData.filter(
      item =>
        rule.allowed.includes(item)
    )



  const result = {

    allowed:
      allowedData.length > 0,

    approvedData:
      allowedData,

    deniedData:
      requestedData.filter(
        item =>
          !allowedData.includes(item)
      ),

  }



  permissionEvents.push({

    requester,

    requestedData,

    result:
      result.allowed
        ? "approved"
        : "denied",

    timestamp:
      new Date().toISOString(),

  })


  return result

}



function getPermissions(){

  return {

    moduleId:
      MODULE_ID,

    permissions,

  }

}



function getPermissionEvents(){

  return {

    moduleId:
      MODULE_ID,

    count:
      permissionEvents.length,

    events:
      permissionEvents,

  }

}



export {

  MODULE_ID,

  checkPermission,

  getPermissions,

  getPermissionEvents,

}
