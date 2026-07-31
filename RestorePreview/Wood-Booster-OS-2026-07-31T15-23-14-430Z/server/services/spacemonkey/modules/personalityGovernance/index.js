const MODULE_ID = "personality-governance"



const governanceRules = [

  {
    id:
      "creator-authority",

    rule:
      "Creator defined principles have highest priority.",

    priority:
      "critical",

  },


  {
    id:
      "safety-priority",

    rule:
      "Safety rules override personality changes.",

    priority:
      "critical",

  },


  {
    id:
      "controlled-evolution",

    rule:
      "Personality evolution requires evaluation.",

    priority:
      "high",

  },


  {
    id:
      "stable-identity",

    rule:
      "Core identity should remain consistent.",

    priority:
      "high",

  },

]



const changeRequests = []



function requestPersonalityChange({

  area,

  change,

  reason,

  requestedBy,

}){

  const request = {

    id:
      `personality-change-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    area,

    change,

    reason,

    requestedBy,

    status:
      "pending",

  }


  changeRequests.push(request)


  return request

}



function approvePersonalityChange(id){

  const request =
    changeRequests.find(
      item =>
        item.id === id
    )


  if (!request){

    return {

      success:
        false,

      reason:
        "Change request not found.",

    }

  }


  request.status =
    "approved"


  request.approvedAt =
    new Date().toISOString()


  return {

    success:
      true,

    request,

  }

}



function getGovernanceRules(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      governanceRules.length,

    rules:
      governanceRules,

  }

}



function getChangeRequests(){

  return {

    moduleId:
      MODULE_ID,

    count:
      changeRequests.length,

    requests:
      changeRequests,

  }

}



export {

  MODULE_ID,

  requestPersonalityChange,

  approvePersonalityChange,

  getGovernanceRules,

  getChangeRequests,

}
