const MODULE_ID = "security-approval-gateway"



const approvalRequests = []



const approvalRules = [

  {
    id: "critical-action",

    risk:
      "critical",

    approvalRequired:
      true,

    description:
      "Critical actions require explicit approval.",

  },


  {
    id: "high-risk-action",

    risk:
      "high",

    approvalRequired:
      true,

    description:
      "High risk actions require authorization.",

  },


  {
    id: "medium-risk-action",

    risk:
      "medium",

    approvalRequired:
      false,

    description:
      "Medium risk actions can continue with monitoring.",

  },


  {
    id: "low-risk-action",

    risk:
      "low",

    approvalRequired:
      false,

    description:
      "Low risk actions are allowed.",

  },

]



function createApprovalRequest({

  action,

  module,

  risk,

}){

  const request = {

    id:
      `approval-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    action,

    module,

    risk,

    status:
      risk === "critical" ||
      risk === "high"

        ? "pending-approval"

        : "approved",

  }


  approvalRequests.push(request)


  return request

}



function approveRequest(id){

  const request =
    approvalRequests.find(
      item =>
        item.id === id
    )


  if (!request){

    return null

  }


  request.status =
    "approved"


  request.approvedAt =
    new Date().toISOString()


  return request

}



function getApprovalRequests(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      approvalRequests.length,

    requests:
      approvalRequests,

  }

}



function getApprovalRules(){

  return approvalRules

}



export {

  MODULE_ID,

  createApprovalRequest,

  approveRequest,

  getApprovalRequests,

  getApprovalRules,

}
